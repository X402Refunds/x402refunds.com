import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * LLM Engine Tests
 * 
 * Tests for cost-optimized LLM integration:
 * - Dispute generation via OpenRouter
 * - Evidence generation
 * - Error handling and fallbacks
 * - API key validation
 */

// Mock fetch for LLM API calls
global.fetch = vi.fn();

describe('LLM Engine - Dispute Generation', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    delete process.env.OPENROUTER_API_KEY;
  });

  it('should return null when no API key is configured', async () => {
    delete process.env.OPENROUTER_API_KEY;
    
    const { generateCostOptimizedDispute } = await import('../convex/llmEngine');
    const result = await generateCostOptimizedDispute();
    
    expect(result).toBeNull();
  });

  it('should generate a valid dispute with LLM', async () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            title: "API Downtime Exceeds SLA",
            type: "API_DOWNTIME",
            provider: "OpenAI",
            customer: "Netflix",
            description: "OpenAI's API experienced 4 hours of downtime, breaching the 99.9% uptime SLA and causing service disruption.",
            breachDuration: "4 hours 23 minutes",
            impactLevel: "Severe",
            affectedUsers: 50000,
            slaRequirement: "99.9% uptime",
            actualPerformance: "96.5% uptime",
            rootCause: "Database connection pool exhaustion",
            damages: 25000
          })
        }
      }]
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const { generateCostOptimizedDispute } = await import('../convex/llmEngine');
    const result = await generateCostOptimizedDispute();
    
    expect(result).toBeDefined();
    expect(result).toHaveProperty('type', 'API_DOWNTIME');
    expect(result).toHaveProperty('description');
    expect(result).toHaveProperty('typicalDamages');
    expect(result).toHaveProperty('llmGenerated', true);
    expect(result).toHaveProperty('llmData');
    expect(result?.llmData).toHaveProperty('provider', 'OpenAI');
    expect(result?.llmData).toHaveProperty('customer', 'Netflix');
  });

  it('should handle LLM API errors gracefully', async () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 429
    });

    const { generateCostOptimizedDispute } = await import('../convex/llmEngine');
    const result = await generateCostOptimizedDispute();
    
    expect(result).toBeNull();
  });

  it('should handle malformed JSON responses', async () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    
    const mockResponse = {
      choices: [{
        message: {
          content: "This is not valid JSON"
        }
      }]
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const { generateCostOptimizedDispute } = await import('../convex/llmEngine');
    const result = await generateCostOptimizedDispute();
    
    expect(result).toBeNull();
  });

  it('should handle markdown-wrapped JSON responses', async () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    
    const mockResponse = {
      choices: [{
        message: {
          content: '```json\n{"title": "Test", "type": "API_DOWNTIME", "provider": "OpenAI", "customer": "Netflix", "description": "Test description", "breachDuration": "1 hour", "impactLevel": "Minor", "affectedUsers": 100, "slaRequirement": "99.9%", "actualPerformance": "98%", "rootCause": "Test", "damages": 5000}\n```'
        }
      }]
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const { generateCostOptimizedDispute } = await import('../convex/llmEngine');
    const result = await generateCostOptimizedDispute();
    
    expect(result).toBeDefined();
    expect(result?.type).toBe('API_DOWNTIME');
  });

  it('should parse damages from string format', async () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            title: "Test",
            type: "API_DOWNTIME",
            provider: "OpenAI",
            customer: "Netflix",
            description: "Test",
            breachDuration: "1h",
            impactLevel: "Minor",
            affectedUsers: 100,
            slaRequirement: "99.9%",
            actualPerformance: "98%",
            rootCause: "Test",
            damages: "$10,000" // String format with $ and comma
          })
        }
      }]
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const { generateCostOptimizedDispute } = await import('../convex/llmEngine');
    const result = await generateCostOptimizedDispute();
    
    expect(result).toBeDefined();
    expect(result?.typicalDamages.min).toBeGreaterThan(0);
    expect(result?.typicalDamages.max).toBeGreaterThan(result?.typicalDamages.min);
  });

  it('should handle network errors', async () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const { generateCostOptimizedDispute } = await import('../convex/llmEngine');
    const result = await generateCostOptimizedDispute();
    
    expect(result).toBeNull();
  });
});

describe('LLM Engine - Evidence Generation', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    delete process.env.OPENROUTER_API_KEY;
  });

  it('should return null when no API key is configured', async () => {
    delete process.env.OPENROUTER_API_KEY;
    
    const { generateCostOptimizedEvidence } = await import('../convex/llmEngine');
    const result = await generateCostOptimizedEvidence('API_DOWNTIME', 10000);
    
    expect(result).toBeNull();
  });

  it('should generate valid evidence with LLM', async () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            technical_logs: "Server logs show 4 hours of continuous 503 errors from 2pm-6pm UTC, affecting all API endpoints.",
            business_impact: "Service outage resulted in $25,000 in lost revenue and 50,000 affected users unable to access critical features.",
            legal_basis: "Breach of SLA contract section 3.2 requiring 99.9% uptime guarantee."
          })
        }
      }]
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const { generateCostOptimizedEvidence } = await import('../convex/llmEngine');
    const result = await generateCostOptimizedEvidence('API_DOWNTIME', 25000);
    
    expect(result).toBeDefined();
    expect(result).toHaveProperty('technical_logs');
    expect(result).toHaveProperty('business_impact');
    expect(result).toHaveProperty('legal_basis');
  });

  it('should handle API errors in evidence generation', async () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    const { generateCostOptimizedEvidence } = await import('../convex/llmEngine');
    const result = await generateCostOptimizedEvidence('API_DOWNTIME', 10000);
    
    expect(result).toBeNull();
  });

  it('should handle malformed evidence JSON', async () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    
    const mockResponse = {
      choices: [{
        message: {
          content: "Not valid JSON at all"
        }
      }]
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const { generateCostOptimizedEvidence } = await import('../convex/llmEngine');
    const result = await generateCostOptimizedEvidence('API_DOWNTIME', 10000);
    
    expect(result).toBeNull();
  });

  it('should handle network errors in evidence generation', async () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    
    (global.fetch as any).mockRejectedValueOnce(new Error('Connection timeout'));

    const { generateCostOptimizedEvidence } = await import('../convex/llmEngine');
    const result = await generateCostOptimizedEvidence('API_DOWNTIME', 10000);
    
    expect(result).toBeNull();
  });
});

describe('LLM Engine - Cost Optimization', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.OPENROUTER_API_KEY = 'test-key';
  });

  it('should use limited token count for disputes', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            title: "Test",
            type: "API_DOWNTIME",
            provider: "OpenAI",
            customer: "Netflix",
            description: "Test",
            breachDuration: "1h",
            impactLevel: "Minor",
            affectedUsers: 100,
            slaRequirement: "99.9%",
            actualPerformance: "98%",
            rootCause: "Test",
            damages: 5000
          })
        }
      }]
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const { generateCostOptimizedDispute } = await import('../convex/llmEngine');
    await generateCostOptimizedDispute();
    
    const fetchCall = (global.fetch as any).mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1].body);
    
    expect(requestBody.max_tokens).toBe(400); // Cost limit
  });

  it('should use limited token count for evidence', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            technical_logs: "Test logs",
            business_impact: "Test impact",
            legal_basis: "Test basis"
          })
        }
      }]
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const { generateCostOptimizedEvidence } = await import('../convex/llmEngine');
    await generateCostOptimizedEvidence('API_DOWNTIME', 10000);
    
    const fetchCall = (global.fetch as any).mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1].body);
    
    expect(requestBody.max_tokens).toBe(300); // Cost limit
  });
});

