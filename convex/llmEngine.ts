// Cost-Optimized LLM Engine for Dispute Resolution
// Limits: 500 words max, efficient prompts, reduced API calls

export async function generateCostOptimizedDispute() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.log("⚠️ No OpenRouter API key - using rule-based fallback");
    return null;
  }

  try {
    const prompt = `Generate a realistic AI vendor dispute in under 300 words:

Real companies (Netflix+AWS, Stripe+Shopify, etc):
{
  "title": "Brief title",
  "type": "API_DOWNTIME|RESPONSE_LATENCY|DATA_ACCURACY",
  "provider": "Service provider",
  "customer": "Service customer",
  "issue": "Technical problem (100 words max)",
  "impact": "Business damage (100 words max)",
  "damages": "$X,XXX,XXX",
  "sla_breach": "What SLA violated"
}

Keep under 300 words total.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://consulate.ai"
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-sonnet",
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
    
    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    
    const scenario = JSON.parse(jsonMatch[0]);
    console.log(`✅ LLM dispute: ${scenario.title} (${scenario.provider} vs ${scenario.customer})`);
    
    return {
      type: scenario.type,
      description: scenario.issue,
      typicalDamages: {
        min: parseInt(scenario.damages.replace(/[$,]/g, '')) * 0.8,
        max: parseInt(scenario.damages.replace(/[$,]/g, '')) * 1.2
      },
      llmGenerated: true,
      llmData: scenario
    };
    
  } catch (error) {
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
        model: "anthropic/claude-3.5-sonnet",
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
    
  } catch (error) {
    console.log(`⚠️ Evidence generation failed: ${error.message}`);
    return null;
  }
}
