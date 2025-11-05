# Claude Desktop Integration for Local Agent Testing

**Last Updated**: 2025-11-05

This guide explains how to use **Claude Desktop** (on your Mac) to test and develop Consulate agents locally, instead of using GPT-4 via OpenRouter.

## Why Claude Desktop?

- **Instant feedback**: Test agents locally without API costs
- **Faster iteration**: No network latency, no rate limits
- **Better debugging**: See full agent reasoning in Claude's interface
- **Free during development**: No OpenRouter costs for testing

## Prerequisites

1. **Claude Desktop** installed (macOS app from Anthropic)
2. **MCP server** configured (already set up in your repo)
3. **Convex development environment** running

## Step 1: Understanding the Current Setup

Currently, your agents use **OpenRouter** to call GPT-4:

```typescript:convex/agents/specValidatorAgent.ts
export const specValidatorAgent = new Agent(components.agent, {
  name: "API Contract Validator",
  languageModel: openrouter.chat("openai/gpt-4o"),  // <-- Uses OpenRouter
  instructions: `You are an API contract compliance analyst...`,
});
```

To use Claude Desktop, you'll interact with agents via the **MCP protocol** instead.

## Step 2: How to Use Claude Desktop for Agent Testing

### Option 1: Manual Testing via MCP

Claude Desktop can connect to your Convex backend via the MCP server and call agents directly.

**Your Claude Desktop config** (`~/Library/Application\ Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "consulate-local": {
      "command": "node",
      "args": ["/Users/vkotecha/Desktop/consulate/scripts/claude-desktop-mcp-proxy.js"],
      "env": {
        "CONVEX_URL": "https://youthful-orca-358.convex.cloud",
        "CONVEX_DEPLOY_KEY": "your-deploy-key-here"
      }
    }
  }
}
```

Then in Claude Desktop:

```
You: "Use the consulate_validate_api_contract tool to check if this response matches the OpenAPI spec:

Request: POST /v1/chat/completions with body {model: 'gpt-4', messages: [...]}
Response: {status: 500, body: {error: 'Internal Server Error'}}
OpenAPI Spec: [paste spec here]"

Claude: [Calls your specValidatorAgent and shows results]
```

### Option 2: Direct Local Testing (Recommended)

For **faster iteration**, you can mock the agent locally using Claude Desktop's conversation interface.

**Create a test script** (`test/manual/test-spec-validator-claude.ts`):

```typescript
/**
 * Manual testing script for spec validator agent
 * Run this in Claude Desktop to test agent logic
 */

const testCase = {
  openApiSpec: {
    openapi: "3.0.0",
    paths: {
      "/v1/chat/completions": {
        post: {
          responses: {
            "200": {
              description: "Success",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["id", "choices"],
                    properties: {
                      id: { type: "string" },
                      choices: { type: "array" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  request: {
    method: "POST",
    path: "/v1/chat/completions",
    headers: { "Content-Type": "application/json" },
    body: {
      model: "gpt-4",
      messages: [{ role: "user", content: "What is 2+2?" }]
    }
  },
  response: {
    status: 500,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      error: {
        message: "Internal Server Error",
        type: "server_error",
        code: 500
      }
    })
  }
};

// Copy this into Claude Desktop and ask:
// "Act as the Consulate spec validator agent. Analyze this test case..."
console.log(JSON.stringify(testCase, null, 2));
```

Then in **Claude Desktop**:

```
You: "I need you to act as the Consulate API Contract Validator agent. Here's the system prompt:

[Paste the instructions from specValidatorAgent.ts]

Now analyze this test case:
[Paste testCase from above]

Output your analysis in this JSON format:
{
  "contractBreach": true/false,
  "violations": [...],
  "confidence": 0.98,
  "severity": "HIGH" | "MEDIUM" | "LOW",
  "details": {...}
}"

Claude: [Analyzes like the agent would and returns JSON]
```

### Option 3: Integrate Claude as Language Model (Advanced)

You can modify the agent to use Claude via Anthropic SDK instead of OpenRouter:

```bash
# Install Anthropic SDK
pnpm add @anthropic-ai/sdk
```

```typescript
// convex/lib/claude.ts
import Anthropic from '@anthropic-ai/sdk';

export const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export function claudeChat(model: string = "claude-3-5-sonnet-20241022") {
  return {
    chat: async (messages: any[]) => {
      const response = await claude.messages.create({
        model,
        max_tokens: 4096,
        messages: messages.map(msg => ({
          role: msg.role === "system" ? "user" : msg.role,
          content: msg.content,
        })),
      });
      return response.content[0].text;
    },
  };
}
```

Then update your agent:

```typescript
// convex/agents/specValidatorAgent.ts
import { claude } from "../lib/claude";  // Instead of openrouter

export const specValidatorAgent = new Agent(components.agent, {
  name: "API Contract Validator",
  languageModel: claude.chat("claude-3-5-sonnet-20241022"),  // Use Claude!
  instructions: `You are an API contract compliance analyst...`,
});
```

## Step 3: Testing Signed Evidence Workflow with Claude Desktop

Now you can test the **entire signed evidence workflow** using Claude Desktop:

### Scenario: Vendor provides bad output, buyer files dispute

```
You: "I'm testing the Consulate signed evidence workflow. Here's the scenario:

**Vendor**: OpenAI API (registered with Ed25519 public key)
**OpenAPI Spec**: [paste from test]
**Transaction**:
- Request: POST /v1/chat/completions with body {model: 'gpt-4', messages: [{role: 'user', content: 'What is 2+2?'}]}
- Response: {status: 500, body: {error: 'Internal Server Error'}}
- Signature: [base64 signature]
- Amount: $0.05

**Step 1**: Verify the signature is valid
**Step 2**: Compare response against OpenAPI spec
**Step 3**: Determine if this is a contract breach

Act as the spec validator agent and analyze this."

Claude: [Performs analysis step-by-step]
```

### What Claude Will Analyze:

1. **Signature validity**: "The Ed25519 signature length is correct (64 bytes)"
2. **Endpoint match**: "POST /v1/chat/completions exists in the OpenAPI spec ✓"
3. **Status code**: "Response returned 500, but spec only documents 200 ✗"
4. **Contract breach**: "YES - Vendor returned undocumented error response"

### Example Output:

```json
{
  "contractBreach": true,
  "violations": [
    "Response status 500 not documented in OpenAPI spec",
    "Missing required field 'choices' in response body",
    "Vendor charged $0.05 but delivered error response"
  ],
  "confidence": 0.98,
  "severity": "HIGH",
  "details": {
    "endpointFound": true,
    "statusMatches": false,
    "schemaMatches": false,
    "slaCompliant": false
  }
}
```

## Step 4: Comparing Claude Desktop vs GPT-4

| Feature | Claude Desktop | GPT-4 (OpenRouter) |
|---------|---------------|-------------------|
| **Cost** | Free (local testing) | ~$0.03 per analysis |
| **Speed** | Instant | 1-3 seconds (network) |
| **Quality** | Excellent (Claude 3.5) | Excellent (GPT-4) |
| **Debugging** | Full conversation visible | API logs only |
| **Rate limits** | None | 10,000 RPM |
| **Best for** | Development & testing | Production |

## Step 5: Production Deployment

**For production**, keep using OpenRouter/GPT-4 (already configured):
- Reliable API
- Proven uptime
- Handles high volume

**For development**, use Claude Desktop:
- Faster iteration
- Better debugging
- No API costs

## Common Workflows

### Testing a new agent

1. **Write the agent logic** in `convex/agents/yourAgent.ts`
2. **Copy the system prompt** to Claude Desktop
3. **Test with sample inputs** in Claude's chat
4. **Iterate on the prompt** until output is perfect
5. **Deploy** and test via Convex

### Debugging a failing agent

1. **Get the failing case** from Convex logs
2. **Paste into Claude Desktop** with full context
3. **Ask Claude to analyze** what went wrong
4. **Fix the prompt/logic**
5. **Re-deploy**

### Developing new agent types

1. **Design the agent in Claude Desktop** first
2. **Test all edge cases** manually
3. **Convert to Convex agent** once proven
4. **Deploy to preview**
5. **Run automated tests**

## Best Practices

✅ **DO**:
- Use Claude Desktop for **rapid prototyping**
- Test **edge cases** manually before deploying
- Keep **system prompts in sync** between Claude Desktop and code
- Use **structured output** (JSON) for consistency

❌ **DON'T**:
- Don't use Claude Desktop in **production** (use APIs)
- Don't **hard-code** test data (use fixtures)
- Don't **skip automated tests** after manual testing
- Don't **forget to update prompts** in code after Claude Desktop testing

## Troubleshooting

### "Claude Desktop can't access my Convex functions"

- Check MCP server config in `claude_desktop_config.json`
- Verify `CONVEX_URL` matches your deployment
- Restart Claude Desktop after config changes

### "Agent outputs don't match Claude Desktop outputs"

- Ensure **system prompts are identical**
- Check **temperature settings** (Claude Desktop may use different defaults)
- Verify **input format** is exactly the same

### "How do I test signature verification in Claude Desktop?"

Claude Desktop can't actually verify Ed25519 signatures, but you can:
1. **Mock the verification** result (`signatureVerified: true`)
2. **Focus on the analysis** logic (what happens AFTER verification)
3. **Use real signature verification** in automated tests

## Summary

**Claude Desktop is perfect for**:
- 🚀 Rapid agent development
- 🐛 Debugging agent logic
- 💡 Experimenting with prompts
- 🧪 Manual testing edge cases

**Use OpenRouter/GPT-4 for**:
- 🏭 Production workloads
- 📊 Automated testing
- 🔄 High-volume processing
- 📈 Scalable deployments

**Best workflow**:
1. **Develop** agents in Claude Desktop (fast iteration)
2. **Test** with real data in Convex preview (automated)
3. **Deploy** to production with OpenRouter (reliable)

---

**Next steps**: Try testing the signed evidence workflow in Claude Desktop using the test case from `/Users/vkotecha/Desktop/consulate/test/signed-evidence-workflow.test.ts`!

