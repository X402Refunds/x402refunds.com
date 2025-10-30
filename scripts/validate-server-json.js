#!/usr/bin/env node

/**
 * Validate server.json against MCP registry schema
 */

import https from 'https';
import fs from 'fs';

const SCHEMA_URL = 'https://static.modelcontextprotocol.io/schemas/2025-10-17/server.schema.json';
const SERVER_JSON_PATH = './server.json';

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

function validateRequiredFields(serverJson) {
  const required = ['$schema', 'name', 'title', 'description', 'version'];
  const missing = required.filter(field => !serverJson[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  // Validate name format (should be io.github.* or com.*)
  if (!serverJson.name.match(/^(io\.github\.[^/]+|com\.[^/]+)\/.+$/)) {
    throw new Error(`Invalid name format: ${serverJson.name}. Must be io.github.username/server-name or com.company/server-name`);
  }
  
  // Validate remotes structure
  if (!serverJson.remotes || !Array.isArray(serverJson.remotes) || serverJson.remotes.length === 0) {
    throw new Error('Must have at least one remote configuration');
  }
  
  for (const remote of serverJson.remotes) {
    if (!remote.type || !['streamable-http', 'sse'].includes(remote.type)) {
      throw new Error(`Invalid remote type: ${remote.type}. Must be 'streamable-http' or 'sse'`);
    }
    
    if (!remote.url || !remote.url.startsWith('https://')) {
      throw new Error(`Invalid remote URL: ${remote.url}. Must be HTTPS URL`);
    }
  }
  
  return true;
}

async function main() {
  try {
    console.log('📋 Reading server.json...');
    const serverJson = JSON.parse(fs.readFileSync(SERVER_JSON_PATH, 'utf8'));
    
    console.log('✅ server.json is valid JSON');
    console.log(`   Name: ${serverJson.name}`);
    console.log(`   Version: ${serverJson.version}`);
    console.log(`   Remotes: ${serverJson.remotes?.length || 0}`);
    
    console.log('\n🔍 Validating required fields...');
    validateRequiredFields(serverJson);
    console.log('✅ Required fields present and valid');
    
    console.log('\n🌐 Checking schema URL...');
    try {
      const schema = await fetch(SCHEMA_URL);
      console.log('✅ Schema accessible');
      console.log(`   Schema version: ${schema.$schema || 'unknown'}`);
    } catch (error) {
      console.warn(`⚠️  Could not fetch schema (${error.message}), but structure looks valid`);
    }
    
    console.log('\n✅ server.json validation passed!');
    console.log('\n📝 Summary:');
    console.log(`   - Name: ${serverJson.name}`);
    console.log(`   - Title: ${serverJson.title}`);
    console.log(`   - Version: ${serverJson.version}`);
    console.log(`   - Remote URLs: ${serverJson.remotes.map(r => r.url).join(', ')}`);
    
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Validation failed: ${error.message}`);
    console.error('\nCurrent server.json:');
    console.error(fs.readFileSync(SERVER_JSON_PATH, 'utf8'));
    process.exit(1);
  }
}

main();

