#!/usr/bin/env node

/**
 * Claude Desktop MCP Proxy for Consulate
 *
 * This script implements a stdio-based MCP server that proxies tool invocations
 * to the Consulate HTTP API, automatically adding authentication via API key.
 *
 * Usage:
 *   CONSULATE_API_KEY=csk_live_... node claude-desktop-mcp-proxy.js
 *
 * Claude Desktop Configuration:
 *   {
 *     "mcpServers": {
 *       "consulate": {
 *         "command": "node",
 *         "args": ["/path/to/consulate/scripts/claude-desktop-mcp-proxy.js"],
 *         "env": {
 *           "CONSULATE_API_KEY": "csk_live_..."
 *         }
 *       }
 *     }
 *   }
 */

import https from 'https';
import http from 'http';

// Configuration
const API_KEY = process.env.CONSULATE_API_KEY;
const API_BASE_URL = process.env.CONSULATE_API_URL || 'https://api.consulatehq.com';
const DEBUG = process.env.CONSULATE_DEBUG === 'true';

// Logging helper (writes to stderr to not interfere with stdio protocol)
function log(message, data = null) {
  if (DEBUG) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ${message}`);
    if (data) {
      console.error(JSON.stringify(data, null, 2));
    }
  }
}

// Validation
if (!API_KEY) {
  console.error('❌ ERROR: CONSULATE_API_KEY environment variable is required');
  console.error('');
  console.error('Usage:');
  console.error('  CONSULATE_API_KEY=csk_live_... node claude-desktop-mcp-proxy.js');
  console.error('');
  console.error('Get your API key from: https://consulatehq.com/settings/api-keys');
  process.exit(1);
}

if (!API_KEY.startsWith('csk_live_') && !API_KEY.startsWith('csk_test_')) {
  console.error('❌ ERROR: Invalid API key format');
  console.error('');
  console.error('API keys must start with:');
  console.error('  - csk_live_... (production)');
  console.error('  - csk_test_... (testing)');
  console.error('');
  console.error('Get your API key from: https://consulatehq.com/settings/api-keys');
  process.exit(1);
}

log('🚀 Consulate MCP Proxy starting...');
log(`API Base URL: ${API_BASE_URL}`);
log(`API Key: ${API_KEY.substring(0, 15)}...`);

/**
 * Fetch helper that supports both http and https
 */
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = protocol.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: res.headers,
          json: async () => JSON.parse(data),
          text: async () => data
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

/**
 * Fetch discovery manifest from Consulate API
 */
async function fetchDiscoveryManifest() {
  try {
    log('Fetching MCP discovery manifest...');
    const response = await fetch(`${API_BASE_URL}/.well-known/mcp.json`);

    if (!response.ok) {
      throw new Error(`Discovery endpoint returned ${response.status}: ${response.statusText}`);
    }

    const manifest = await response.json();
    log('✅ Discovery manifest fetched successfully');
    log('Available tools:', manifest.tools.map(t => t.name));

    return manifest;
  } catch (error) {
    log('❌ Failed to fetch discovery manifest:', error.message);
    throw error;
  }
}

/**
 * Invoke a tool on the Consulate API
 */
async function invokeTool(toolName, parameters) {
  try {
    log(`Invoking tool: ${toolName}`, parameters);

    const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'User-Agent': 'Consulate-MCP-Proxy/1.0'
      },
      body: JSON.stringify({
        tool: toolName,
        parameters: parameters
      })
    });

    const result = await response.json();

    if (!response.ok) {
      log(`❌ Tool invocation failed (${response.status}):`, result);
      // Handle new error format: { success: false, error: { code, message, hint } }
      if (result.error && typeof result.error === 'object') {
        return {
          error: result.error.message || result.error,
          hint: result.error.hint,
          details: result.error.details,
          status: response.status
        };
      }
      // Handle old format
      return {
        error: result.error || 'Tool invocation failed',
        hint: result.hint,
        details: result.details,
        status: response.status
      };
    }

    log('✅ Tool invoked successfully:', result);
    return result;
  } catch (error) {
    log('❌ Tool invocation error:', error.message);
    return {
      error: error.message,
      hint: 'Check your network connection and API endpoint',
      details: error.stack
    };
  }
}

/**
 * Handle MCP protocol messages
 */
async function handleMCPMessage(message) {
  try {
    const request = JSON.parse(message);
    log('📨 Received MCP request:', request);

    // Check if this is a notification (no id field)
    // Notifications MUST NOT receive responses per JSON-RPC 2.0 spec
    const isNotification = !request.hasOwnProperty('id') && typeof request.id === 'undefined';

    if (isNotification) {
      log('📢 Received notification (no response will be sent)');
      // Process notification but don't send response
      return null;
    }

    // Handle different MCP request types
    if (request.method === 'initialize') {
      // Fetch real discovery manifest from Consulate
      const manifest = await fetchDiscoveryManifest();

      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          protocolVersion: '2024-11-05',
          serverInfo: {
            name: manifest.server.name,
            version: manifest.server.version
          },
          capabilities: {
            tools: {
              listChanged: false
            }
          }
        }
      };
    }

    if (request.method === 'tools/list') {
      // Fetch and return available tools
      const manifest = await fetchDiscoveryManifest();

      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          tools: manifest.tools.map(tool => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.input_schema
          }))
        }
      };
    }

    if (request.method === 'tools/call') {
      // Invoke the requested tool
      const { name, arguments: args } = request.params;

      const result = await invokeTool(name, args);

      // Check if invocation failed
      if (result.error) {
        return {
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: result.status === 401 ? -32001 : -32000,
            message: result.error,
            data: {
              hint: result.hint,
              details: result.details
            }
          }
        };
      }

      // Success response
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        }
      };
    }

    // Unknown method
    return {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32601,
        message: `Method not found: ${request.method}`
      }
    };

  } catch (error) {
    log('❌ Error handling MCP message:', error.message);

    // Try to extract id from the message if possible
    let requestId = null;
    try {
      const partialRequest = JSON.parse(message);
      requestId = partialRequest.id;
    } catch {
      // Cannot determine id, use null per JSON-RPC 2.0 spec
      requestId = null;
    }

    return {
      jsonrpc: '2.0',
      id: requestId,
      error: {
        code: -32700,
        message: 'Parse error',
        data: {
          details: error.message
        }
      }
    };
  }
}

/**
 * Main stdio loop
 */
async function main() {
  log('👂 Listening for MCP requests on stdin...');

  let buffer = '';

  process.stdin.setEncoding('utf8');

  process.stdin.on('data', async (chunk) => {
    buffer += chunk;

    // Process complete lines (messages)
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.trim()) {
        const response = await handleMCPMessage(line);

        // Only send response if not null (null = notification, no response needed)
        if (response !== null) {
          const responseStr = JSON.stringify(response);
          log('📤 Sending MCP response:', response);
          process.stdout.write(responseStr + '\n');
        }
      }
    }
  });

  process.stdin.on('end', () => {
    log('👋 stdin closed, exiting...');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    log('👋 SIGINT received, exiting...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    log('👋 SIGTERM received, exiting...');
    process.exit(0);
  });
}

// Start the proxy
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
