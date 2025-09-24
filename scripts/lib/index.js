const { ConvexHttpClient } = require("convex/browser");
const fs = require("fs");
const path = require("path");

// Guard fetch usage for Node <18 or document requirement
if (typeof fetch !== 'function') {
  try {
    const { default: fetch } = require('node-fetch');
    global.fetch = fetch;
  } catch (error) {
    console.error("❌ fetch is not available. Please use Node.js 18+ or install node-fetch");
    process.exit(1);
  }
}

// Parse environment variables with validation using shared config
function parseEnvironment(options = {}) {
  const { requireOpenRouter = false } = options;
  
  try {
    // Use the shared config package for environment parsing
    const { getEnvironment } = require("../../packages/config/src/env.ts");
    return getEnvironment({ requireOpenRouter });
  } catch (error) {
    // Fallback to legacy parsing for backwards compatibility
    console.warn("⚠️ Using legacy environment parsing. Consider updating to use @consulate/config");
    return legacyParseEnvironment(options);
  }
}

// Legacy environment parsing for backwards compatibility
function legacyParseEnvironment(options = {}) {
  const { requireOpenRouter = false } = options;
  
  // Start with process.env
  let envVars = { ...process.env };
  
  // Attempt to read .env.local if present
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    const fileVars = {};
    
    envContent.split("\n").forEach(line => {
      line = line.trim();
      if (line && !line.startsWith("#")) {
        const [key, ...valueParts] = line.split("=");
        if (key && valueParts.length > 0) {
          fileVars[key] = valueParts.join("=").replace(/^["']|["']$/g, "");
        }
      }
    });
    
    // Merge with process.env (env file wins)
    envVars = { ...envVars, ...fileVars };
  }

  // Validate required environment variables
  if (!envVars.CONVEX_URL) {
    console.error("❌ CONVEX_URL not found in environment or .env.local");
    process.exit(1);
  }

  // Only validate OPENROUTER_API_KEY when required
  if (requireOpenRouter && !envVars.OPENROUTER_API_KEY) {
    console.error("❌ OPENROUTER_API_KEY required for AI operations but not found in environment or .env.local");
    process.exit(1);
  }

  return envVars;
}

// Create and initialize Convex client
function createConvexClient(envVars) {
  return new ConvexHttpClient(envVars.CONVEX_URL);
}

// Constitutional agents configuration
const CONSTITUTIONAL_AGENTS = [
  "constitutional-counsel",
  "chief-constitutional-counsel",
  "congressional-representative", 
  "constitutional-scholar",
  "constitutional-interpreter"
];

// Institutional agents configuration  
const INSTITUTIONAL_AGENTS = [
  "institutional-coordinator",
  "constitutional-counsel",
  "chief-constitutional-counsel",
  "congressional-representative"
];

// Build DID utility for consistent DID scheme
function buildDID(agentKey, domain = 'constitutional') {
  return `did:${domain}:${agentKey}`;
}

// OpenRouter API call utility
async function callAI(systemPrompt, userPrompt, options = {}) {
  const envVars = options.envVars || parseEnvironment({ requireOpenRouter: true });
  
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${envVars.OPENROUTER_API_KEY}`,
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "Consulate AI",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "model": options.model || "anthropic/claude-3.5-sonnet",
      "messages": [
        { "role": "system", "content": systemPrompt },
        { "role": "user", "content": userPrompt }
      ],
      "max_tokens": options.maxTokens || 2000,
      "temperature": options.temperature || 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error("Invalid response format from OpenRouter API");
  }

  return data.choices[0].message.content;
}

// Format agent DID for display
function formatAgentName(did) {
  if (!did) return "Unknown Agent";
  
  // Extract agent type from DID
  const agentType = did.split(":").pop() || did;
  
  // Convert kebab-case to title case
  return agentType
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Common error handling utility
function handleError(error, context) {
  console.error(`❌ Error in ${context}:`);
  console.error(error);
  
  if (error.message?.includes("CONVEX_URL")) {
    console.error("💡 Make sure your .env.local file contains a valid CONVEX_URL");
  }
  
  if (error.message?.includes("OPENROUTER_API_KEY")) {
    console.error("💡 Make sure your .env.local file contains a valid OPENROUTER_API_KEY");
  }
  
  process.exit(1);
}

// Sleep utility for timing delays
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  parseEnvironment,
  createConvexClient,
  CONSTITUTIONAL_AGENTS,
  INSTITUTIONAL_AGENTS,
  buildDID,
  callAI,
  formatAgentName,
  handleError,
  sleep
};
