#!/usr/bin/env node

// Add real AI integration to your judge system
// This will make your judges actually use LLMs for analysis instead of hardcoded logic

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧠 ADDING REAL AI TO YOUR JUDGE SYSTEM');
console.log('=====================================');

// Check what AI providers are available
const AI_PROVIDERS = {
  anthropic: {
    name: "Anthropic Claude",
    models: ["claude-3-5-sonnet-20241022", "claude-3-opus-20240229"],
    env_var: "ANTHROPIC_API_KEY",
    cost: "$3-15 per 1M tokens",
    recommended: true
  },
  openai: {
    name: "OpenAI GPT", 
    models: ["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
    env_var: "OPENAI_API_KEY",
    cost: "$5-30 per 1M tokens",
    recommended: true
  },
  local: {
    name: "Local/Ollama",
    models: ["llama3", "mistral", "codellama"],
    env_var: "OLLAMA_URL",
    cost: "Free (requires local setup)",
    recommended: false
  }
};

function generateAIJudgesCode() {
  return `// Real AI-powered judge integration
// This replaces the hardcoded logic with actual LLM calls

// Add this to your convex/judges.ts file
import { action } from "./_generated/server";
import { v } from "convex/values";

// AI-powered judge analysis using real LLMs
export const analyzeWithAI = action({
  args: {
    caseData: v.object({
      id: v.string(),
      parties: v.array(v.string()),
      type: v.string(),
      jurisdictionTags: v.array(v.string())
    }),
    evidenceManifests: v.array(v.any()),
    judgeType: v.optional(v.string()),
    systemPrompt: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const judgeType = args.judgeType || "GENERAL_JUDGE";
    const systemPrompt = args.systemPrompt || JUDGE_SYSTEM_PROMPTS[judgeType];
    
    // Format case for AI analysis
    const caseContext = \`
CASE DETAILS:
- Case ID: \${args.caseData.id}
- Type: \${args.caseData.type} 
- Parties: \${args.caseData.parties.join(' vs ')}
- Jurisdiction: \${args.caseData.jurisdictionTags.join(', ')}
- Evidence Count: \${args.evidenceManifests.length}

EVIDENCE SUMMARY:
\${args.evidenceManifests.map(e => \`
- Evidence ID: \${e.id}
- Agent: \${e.agentDid}
- SHA256: \${e.sha256}
- Model Used: \${e.model.provider}:\${e.model.name}
- Timestamp: \${new Date(e.ts).toISOString()}
\`).join('\\n')}

Please provide your judicial analysis following the format in your system prompt.
\`;

    try {
      // Try Anthropic Claude first (recommended)
      if (process.env.ANTHROPIC_API_KEY) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 2000,
            temperature: 0.1,
            system: systemPrompt,
            messages: [{
              role: 'user',
              content: caseContext
            }]
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          const analysis = result.content[0].text;
          
          // Extract structured decision from AI response
          return parseAIAnalysis(analysis, args.caseData.type);
        }
      }
      
      // Fallback to OpenAI if available
      if (process.env.OPENAI_API_KEY) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${process.env.OPENAI_API_KEY}\`
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: caseContext }
            ],
            temperature: 0.1,
            max_tokens: 2000
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          const analysis = result.choices[0].message.content;
          
          return parseAIAnalysis(analysis, args.caseData.type);
        }
      }
      
      // Fallback to enhanced hardcoded logic if no AI available
      console.warn("No AI provider available, using enhanced hardcoded analysis");
      return await analyzeCase(args.caseData, args.evidenceManifests);
      
    } catch (error) {
      console.error("AI analysis failed:", error);
      
      // Fallback to hardcoded analysis
      return await analyzeCase(args.caseData, args.evidenceManifests);
    }
  }
});

// Parse AI response into structured format
function parseAIAnalysis(aiResponse: string, caseType: string): {
  code: string;
  reasons: string; 
  confidence: number;
} {
  try {
    // Try to extract decision from AI response
    const upheldMatch = aiResponse.match(/(?:UPHELD|VIOLATION CONFIRMED|SUSTAINED)/i);
    const dismissedMatch = aiResponse.match(/(?:DISMISSED|NO VIOLATION|NOT SUSTAINED)/i);
    const remandedMatch = aiResponse.match(/(?:REMANDED|REQUIRES.*REVIEW|INSUFFICIENT)/i);
    const partialMatch = aiResponse.match(/(?:PARTIALLY|PARTIAL|MIXED)/i);
    
    let code = "REMANDED"; // Default
    if (upheldMatch) code = "UPHELD";
    else if (dismissedMatch) code = "DISMISSED"; 
    else if (partialMatch) code = "PARTIALLY_UPHELD";
    
    // Extract confidence if mentioned
    const confidenceMatch = aiResponse.match(/confidence:?\\s*([0-9.]+)/i);
    const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.8;
    
    return {
      code,
      reasons: aiResponse.trim(),
      confidence: Math.min(1.0, Math.max(0.0, confidence))
    };
    
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    return {
      code: "REMANDED",
      reasons: \`AI analysis completed but parsing failed. Raw response: \${aiResponse.substring(0, 500)}...\`,
      confidence: 0.6
    };
  }
}

// Enhanced court engine integration
export const processAIAutorule = action({
  args: {
    caseId: v.id("cases")
  },
  handler: async (ctx, args) => {
    // Get case and evidence
    const caseData = await ctx.runQuery(api.cases.getCase, { caseId: args.caseId });
    if (!caseData) throw new Error("Case not found");
    
    const evidenceManifests = await ctx.runQuery(api.evidence.getEvidenceByCase, { 
      caseId: args.caseId 
    });
    
    // Use AI judge for analysis
    const aiAnalysis = await ctx.runAction(api.judges.analyzeWithAI, {
      caseData: {
        id: caseData._id,
        parties: caseData.parties,
        type: caseData.type,
        jurisdictionTags: caseData.jurisdictionTags
      },
      evidenceManifests,
      judgeType: "CHIEF_JUDGE"
    });
    
    // Log the AI decision for transparency
    await ctx.runMutation(api.transparency.logDeliberation, {
      caseId: caseData._id,
      judgePrompt: "AI-powered Chief Judge analysis",
      analysisResult: aiAnalysis,
      timestamp: Date.now()
    });
    
    // If confidence is high enough, auto-rule
    if (aiAnalysis.confidence >= 0.8) {
      await ctx.runMutation(api.cases.updateCaseStatus, {
        caseId: args.caseId,
        status: "AUTORULED",
        ruling: {
          verdict: aiAnalysis.code,
          auto: true,
          decidedAt: Date.now(),
          reasoning: aiAnalysis.reasons.substring(0, 1000)
        }
      });
      
      return { 
        status: "AUTORULED", 
        verdict: aiAnalysis.code,
        confidence: aiAnalysis.confidence 
      };
    } else {
      // Send to panel if confidence is low
      const panelId = await ctx.runMutation(api.judges.assignPanel, {
        caseId: args.caseId,
        panelSize: 3
      });
      
      return { 
        status: "PANELED", 
        panelId,
        aiRecommendation: aiAnalysis 
      };
    }
  }
});`;
}

function generateEnvTemplate() {
  return `# AI Judge Configuration
# Add one or more of these API keys to enable real AI judges

# Anthropic Claude (Recommended - best for legal reasoning)
ANTHROPIC_API_KEY=your_anthropic_key_here

# OpenAI GPT (Alternative)  
OPENAI_API_KEY=your_openai_key_here

# Local Ollama (Free but requires setup)
# OLLAMA_URL=http://localhost:11434
`;
}

console.log('🎯 Next Steps to Add Real AI:');
console.log('\n1. CHOOSE AN AI PROVIDER:');

Object.entries(AI_PROVIDERS).forEach(([key, provider]) => {
  const icon = provider.recommended ? '✅' : '⚪';
  console.log(`   ${icon} ${provider.name}`);
  console.log(`      Models: ${provider.models.join(', ')}`);
  console.log(`      Cost: ${provider.cost}`);
  console.log(`      Setup: Add ${provider.env_var} to .env.local`);
  console.log('');
});

console.log('2. ADD API KEY:');
console.log('   • Get API key from your chosen provider');
console.log('   • Add to .env.local file');
console.log('   • Restart your Convex dev server');

console.log('\n3. INTEGRATION OPTIONS:');
console.log('   A) 🚀 AUTO-INTEGRATE: I can add the code automatically');
console.log('   B) 📋 MANUAL: I can provide code snippets to add yourself');
console.log('   C) 🧪 TEST: Create a simple test case to verify AI works');

console.log('\n💡 RECOMMENDED APPROACH:');
console.log('   • Use Anthropic Claude (best for judicial reasoning)');
console.log('   • Start with test cases to verify integration');  
console.log('   • Then replace hardcoded logic with AI calls');

// Write example code files
const judgesCodePath = join(__dirname, '..', 'examples', 'ai-judges-integration.ts');
const envTemplatePath = join(__dirname, '..', 'examples', 'env-ai-template');

// Create examples directory if it doesn't exist
import { mkdirSync } from 'fs';
try {
  mkdirSync(join(__dirname, '..', 'examples'), { recursive: true });
} catch (e) {
  // Directory already exists
}

writeFileSync(judgesCodePath, generateAIJudgesCode());
writeFileSync(envTemplatePath, generateEnvTemplate());

console.log('\n📁 Generated files:');
console.log(`   • examples/ai-judges-integration.ts - AI integration code`);
console.log(`   • examples/env-ai-template - Environment variables template`);

console.log('\n❓ What would you like to do next?');
console.log('   • Get an API key and integrate AI judges?');
console.log('   • Test with a simple case first?');
console.log('   • See the generated integration code?');

export { generateAIJudgesCode, generateEnvTemplate };
