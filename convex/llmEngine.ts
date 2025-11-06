// Cost-Optimized LLM Engine for Dispute Resolution
// Limits: 500 words max, efficient prompts, reduced API calls

import { DEFAULT_MODEL } from "./lib/openrouter";

export async function generateCostOptimizedDispute() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.log("⚠️ No OpenRouter API key - using rule-based fallback");
    return null;
  }

  try {
    // Define diverse real-world companies for variety
    const providers = [
      "OpenAI", "Anthropic", "AWS", "Google Cloud", "Azure", "Stripe", "Twilio", 
      "SendGrid", "MongoDB", "Snowflake", "Databricks", "Cloudflare", "Auth0",
      "Plaid", "Mapbox", "Cohere", "HuggingFace"
    ];
    const customers = [
      "Netflix", "Uber", "Spotify", "Airbnb", "DoorDash", "Shopify", "Discord",
      "Slack", "Robinhood", "Coinbase", "Square", "Instacart", "Booking.com",
      "Teladoc", "Notion", "Figma", "Asana", "Unity", "Roblox", "Peloton"
    ];
    
    const randomProvider = providers[Math.floor(Math.random() * providers.length)];
    const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
    
    const prompt = `Generate a realistic AI/API vendor service dispute case with proper grammar and professional language.

Provider: ${randomProvider}
Customer: ${randomCustomer}

Return ONLY valid JSON (no markdown, no code blocks):
{
  "title": "Professional case title",
  "type": "API_DOWNTIME" OR "RESPONSE_LATENCY" OR "DATA_ACCURACY" OR "PROCESSING_VOLUME" OR "RATE_LIMIT_BREACH" OR "DATA_LOSS" OR "SECURITY_INCIDENT",
  "provider": "${randomProvider}",
  "customer": "${randomCustomer}",
  "description": "Complete, grammatically correct 2-3 sentence description of what happened and why it's a breach. Write professionally as if for a legal filing.",
  "breachDuration": "Specific time period (e.g., '4 hours 23 minutes', '2 days')",
  "impactLevel": "Minor" OR "Moderate" OR "Significant" OR "Severe" OR "Critical",
  "affectedUsers": number (realistic based on company size),
  "slaRequirement": "Specific SLA metric violated (e.g., '99.9% uptime', '< 200ms p95 latency')",
  "actualPerformance": "Actual measured performance that breached SLA",
  "rootCause": "Brief technical explanation of what caused the breach",
  "damages": 5000 to 500000 (realistic dollar amount as number, no symbols)
}

IMPORTANT:
- Use complete, grammatically correct sentences
- Be specific with metrics and timeframes
- Make it realistic and professional
- Return ONLY the JSON object, no extra text`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://consulate.ai"
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400, // Cost limit
        temperature: 0.6
      })
    });

    if (!response.ok) {
      console.log(`⚠️ LLM API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse JSON response (handle both raw JSON and markdown-wrapped)
    let jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log("⚠️ No JSON found in LLM response");
      return null;
    }
    
    const scenario = JSON.parse(jsonMatch[0]);
    console.log(`✅ LLM dispute: ${scenario.title} (${scenario.provider} vs ${scenario.customer})`);
    
    // Parse damages (handle both string and number formats)
    const damagesValue = typeof scenario.damages === 'string' 
      ? parseInt(scenario.damages.replace(/[$,]/g, ''))
      : scenario.damages;
    
    return {
      type: scenario.type,
      description: scenario.description,
      typicalDamages: {
        min: Math.floor(damagesValue * 0.9),
        max: Math.floor(damagesValue * 1.1)
      },
      llmGenerated: true,
      llmData: {
        title: scenario.title,
        provider: scenario.provider,
        customer: scenario.customer,
        description: scenario.description,
        breachDuration: scenario.breachDuration,
        impactLevel: scenario.impactLevel,
        affectedUsers: scenario.affectedUsers,
        slaRequirement: scenario.slaRequirement,
        actualPerformance: scenario.actualPerformance,
        rootCause: scenario.rootCause
      }
    };
    
  } catch (error: any) {
    console.log(`⚠️ LLM failed: ${error.message}`);
    return null;
  }
}

export async function generateCostOptimizedEvidence(disputeType: string, damageAmount: number) {
  if (!process.env.OPENROUTER_API_KEY) return null;

  try {
    const prompt = `Generate brief evidence for ${disputeType} dispute worth $${damageAmount}:

{
  "technical_logs": "Brief technical evidence (75 words max)",
  "business_impact": "Financial impact summary (75 words max)", 
  "legal_basis": "Legal argument (50 words max)"
}

Keep under 200 words total.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300, // Cost limit
        temperature: 0.5
      })
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    
  } catch (error: any) {
    console.log(`⚠️ Evidence generation failed: ${error.message}`);
    return null;
  }
}
