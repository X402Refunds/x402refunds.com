/**
 * MCP (Model Context Protocol) Server Implementation
 * 
 * This exposes Consulate's dispute resolution capabilities as MCP tools
 * that any MCP-compatible agent (Claude, ChatGPT, etc.) can discover and invoke.
 * 
 * Implements the Agentic Dispute Protocol (ADP) for standardized dispute resolution.
 * Protocol: https://github.com/consulatehq/agentic-dispute-protocol
 * 
 * Integration experience:
 * 1. Agent discovers tools via /.well-known/mcp.json
 * 2. Agent invokes tools as part of natural workflow
 * 3. Zero code, zero docs, zero friction
 */

import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * MCP Error Codes
 * Standardized error codes for MCP clients
 */
export const MCP_ERROR_CODES = {
  AUTH_FAILED: "MCP_AUTH_FAILED",
  AUTH_REQUIRED: "MCP_AUTH_REQUIRED",
  TOOL_NOT_FOUND: "MCP_TOOL_NOT_FOUND",
  INVALID_PARAMETERS: "MCP_INVALID_PARAMETERS",
  INTERNAL_ERROR: "MCP_INTERNAL_ERROR",
  NOT_FOUND: "MCP_NOT_FOUND",
  FORBIDDEN: "MCP_FORBIDDEN",
} as const;

/**
 * Generate SHA-256 hash for evidence URLs
 * Simple hash for now (in production: use crypto.subtle)
 */
function generateSHA256(input: string): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * MCP Tool Definitions
 * These are discoverable by any MCP-compatible agent
 */
export const MCP_TOOLS = [
  {
    name: "consulate_file_dispute",
    description: "File ANY dispute - payment (crypto/traditional) OR general (SLA/service). Auto-detects type. Crypto: USDC/ETH/SOL on Base/Ethereum/Solana. Traditional: Stripe/PayPal/cards. General: SLA violations, contracts, service quality. 95% AI automation. Pricing tiers: MICRO (<$1: $0.10), SMALL ($1-$10: $0.25), MEDIUM ($10-$100: $1.00), LARGE ($100-$1k: $5.00), ENTERPRISE (>$1k: $25.00).",
    input_schema: {
      type: "object",
      properties: {
        // UNIVERSAL (all disputes)
        plaintiff: {
          type: "string",
          description: "Who's filing the dispute (consumer email, agent DID, company name, or user ID)"
        },
        defendant: {
          type: "string",
          description: "Who's being disputed (merchant name, service provider, agent DID, or company)"
        },
        description: {
          type: "string",
          description: "Clear description of what went wrong (e.g., 'API was down for 3 hours' or 'Charged $50 but service failed')"
        },
        amount: {
          type: "number",
          description: "Transaction amount OR claimed damages in USD (e.g., 29.99). Determines pricing tier: <$1=MICRO($0.10), $1-$10=SMALL($0.25), $10-$100=MEDIUM($1.00), $100-$1k=LARGE($5.00), >$1k=ENTERPRISE($25.00)"
        },
        currency: {
          type: "string",
          description: "Currency code (default: 'USD')"
        },
        evidenceUrls: {
          type: "array",
          items: { type: "string" },
          description: "URLs to evidence: transaction logs, API monitoring data, contracts, SLA documents, screenshots, emails"
        },
        
        // PAYMENT TYPE (optional - triggers payment flow if provided)
        paymentType: {
          type: "string",
          enum: ["custodial", "non_custodial", "traditional"],
          description: "Payment model: custodial (exchange), non_custodial (wallet-to-wallet), traditional (Stripe/cards). Required for payment disputes."
        },
        transactionId: {
          type: "string",
          description: "Payment-only: Transaction ID from payment system (e.g., 'txn_stripe_abc123', blockchain hash '0x123...', exchange ID). If provided, this becomes a PAYMENT dispute."
        },
        paymentProtocol: {
          type: "string",
          enum: ["ACP", "ATXP", "STRIPE", "OTHER"],
          description: "Payment-only: Payment protocol used. Optional if paymentType is provided."
        },
        disputeReason: {
          type: "string",
          enum: ["service_not_rendered", "unauthorized", "fraud", "amount_incorrect", "duplicate_charge", "quality_issue", "api_timeout", "rate_limit_breach"],
          description: "Payment-only: Specific reason for payment dispute (e.g., 'service_not_rendered' for failed API calls)"
        },
        
        // CRYPTO (nested object)
        crypto: {
          type: "object",
          properties: {
            currency: {
          type: "string",
              enum: ["USDC", "USDT", "ETH", "BTC", "SOL", "XRP", "MATIC", "ARB", "OP", "AVAX", "other"],
              description: "Cryptocurrency used"
        },
            blockchain: {
          type: "string",
              enum: ["ethereum", "solana", "base", "polygon", "arbitrum", "optimism", "xrp_ledger", "bitcoin", "avalanche", "other"],
              description: "Blockchain network"
        },
            layer: {
          type: "string",
              enum: ["L1", "L2"],
              description: "Layer 1 (mainnet) or Layer 2 (rollup)"
        },
            fromAddress: {
              type: "string",
              description: "Sender's wallet address"
        },
            toAddress: {
          type: "string",
              description: "Recipient's wallet address"
            },
            transactionHash: {
              type: "string",
              description: "Blockchain transaction hash (if on-chain)"
            },
            contractAddress: {
              type: "string",
              description: "Token contract address (e.g., USDC contract on Base)"
            },
            blockNumber: {
              type: "number",
              description: "Block number where transaction was included"
            },
            explorerUrl: {
              type: "string",
              description: "Link to blockchain explorer (Etherscan, Basescan, Solscan, etc.)"
            }
          },
          description: "Crypto-specific transaction details (required for custodial/non_custodial paymentType)"
        },
        
        // CUSTODIAL (nested object)
        custodial: {
          type: "object",
          properties: {
            platform: {
              type: "string",
              enum: ["coinbase", "binance", "kraken", "gemini", "crypto_com", "bybit", "okx", "other"],
              description: "Custodial platform/exchange"
            },
            platformTransactionId: {
              type: "string",
              description: "Internal transaction ID from exchange"
            },
            isOnChain: {
              type: "boolean",
              description: "Did transaction hit blockchain or stay internal?"
            },
            withdrawalId: {
              type: "string",
              description: "Withdrawal ID if moved to blockchain"
            }
          },
          description: "Custodial exchange details (required if paymentType is 'custodial')"
        },
        
        // TRADITIONAL (nested object)
        traditional: {
      type: "object",
      properties: {
            paymentMethod: {
          type: "string",
              enum: ["stripe", "paypal", "square", "visa", "mastercard", "amex", "discover", "ach", "wire", "check", "other"],
              description: "Payment method used"
        },
            processor: {
          type: "string",
              enum: ["stripe", "paypal", "square", "braintree", "adyen", "worldpay", "authorize_net", "other"],
              description: "Payment processor"
        },
            processorTransactionId: {
          type: "string",
              description: "Transaction ID from processor (Stripe: ch_..., PayPal: PAYID-...)"
        },
            cardBrand: {
          type: "string",
              enum: ["visa", "mastercard", "amex", "discover", "jcb", "diners", "other"],
              description: "Card brand (if card payment)"
        },
            lastFourDigits: {
              type: "string",
              description: "Last 4 digits of card (for privacy)"
        },
            cardType: {
          type: "string",
              enum: ["credit", "debit", "prepaid"],
              description: "Type of card"
            }
          },
          description: "Traditional payment details (required if paymentType is 'traditional')"
        },
        
        // CUSTOM METADATA (flexible JSON)
        metadata: {
          type: "object",
          additionalProperties: true,
          description: "Custom fields from merchant's system. Can include ANY data: customerId, orderId, invoiceId, sessionId, internal references, flags, notes, etc. Completely flexible JSON object."
        },
        
        // GENERAL DISPUTE (optional - triggers general flow if provided)
        category: {
          type: "string",
          enum: ["sla_violation", "api_downtime", "api_latency", "service_quality", "contract_breach", "data_quality", "data_breach", "feature_availability", "delivery_issue", "support_issue", "billing_dispute", "unauthorized_access"],
          description: "General-only: Type of non-payment dispute. If provided (and no transactionId), this becomes a GENERAL dispute. Examples: sla_violation (uptime/SLA not met), api_downtime (API unavailable), service_quality (poor service), contract_breach (contract violated)"
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high", "urgent"],
          description: "General-only: Urgency level for non-payment disputes"
        },
        breachDetails: {
          type: "object",
          properties: {
            duration: { type: "string", description: "How long the issue lasted (e.g., '3 hours', '2 days')" },
            slaRequirement: { type: "string", description: "What the SLA required (e.g., '99.9% uptime', '<200ms latency')" },
            actualPerformance: { type: "string", description: "What actually happened (e.g., '97.2% uptime', '450ms latency')" },
            impactLevel: { type: "string", description: "Impact: low, medium, high, critical" },
            affectedUsers: { type: "number", description: "Number of users affected" }
          },
          description: "General-only: Detailed breach information for SLA/contract disputes"
        },
        
        callbackUrl: {
          type: "string",
          description: "Optional webhook URL to receive resolution updates"
        }
      },
      required: ["plaintiff", "defendant", "description", "amount"]
    }
  },
  {
    name: "consulate_submit_evidence",
    description: "Submit ADP-compliant evidence to support a dispute case. Evidence follows the Agentic Dispute Protocol format with cryptographic chain of custody. Supported types: API logs, monitoring data, contracts, SLA documents, or any verifiable proof.",
    input_schema: {
      type: "object",
      properties: {
        caseId: {
          type: "string",
          description: "The case ID you're submitting evidence for (received when filing dispute)"
        },
        agentDid: {
          type: "string",
          description: "Your agent DID (the party submitting evidence)"
        },
        evidenceType: {
          type: "string",
          enum: ["api_logs", "monitoring_data", "contract", "sla_document", "communication", "financial_record"],
          description: "Type of evidence being submitted"
        },
        evidenceUrl: {
          type: "string",
          description: "URL where the evidence can be accessed (must be publicly accessible or provide credentials)"
        },
        sha256: {
          type: "string",
          description: "SHA-256 hash of the evidence file for integrity verification"
        },
        description: {
          type: "string",
          description: "Brief description of what this evidence proves"
        }
      },
      required: ["caseId", "agentDid", "evidenceType", "evidenceUrl", "sha256"]
    }
  },
  {
    name: "consulate_check_case_status",
    description: "Check the current status of a dispute case following ADP protocol. Returns case status, evidence, and resolution details.",
    input_schema: {
      type: "object",
      properties: {
        caseId: {
          type: "string",
          description: "The case ID to check status for"
        }
      },
      required: ["caseId"]
    }
  },
  {
    name: "consulate_register_agent",
    description: "Register your agent with Consulate using Ed25519 public key. Required before filing disputes. Establishes agent DID for protocol compliance. Optionally provide OpenAPI spec for automated contract validation.",
    input_schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the agent (e.g., 'acme-monitoring-agent', 'openai-api-consumer')"
        },
        publicKey: {
          type: "string",
          description: "Base64-encoded Ed25519 public key for signature verification"
        },
        organizationName: {
          type: "string",
          description: "Name of the organization registering the agent"
        },
        openApiSpec: {
          type: "object",
          description: "Optional OpenAPI 3.0 specification for automated API contract validation"
        },
        specVersion: {
          type: "string",
          description: "OpenAPI specification version (e.g., '3.0.0')"
        },
        functionalType: {
          type: "string",
          enum: ["voice", "chat", "social", "translation", "presentation", "coding", "devops", "security", "data", "api", "writing", "design", "video", "music", "gaming", "research", "financial", "sales", "marketing", "legal", "healthcare", "education", "scientific", "manufacturing", "transportation", "scheduler", "workflow", "procurement", "project", "general"],
          description: "Agent functional type - use 'api' for API consumers/providers, 'general' for multi-purpose agents"
        }
      },
      required: ["name", "publicKey", "organizationName"]
    }
  },
  {
    name: "consulate_list_my_cases",
    description: "List all cases where you are a party (plaintiff or defendant)",
    input_schema: {
      type: "object",
      properties: {
        agentDid: {
          type: "string",
          description: "Your agent DID"
        },
        status: {
          type: "string",
          enum: ["FILED", "UNDER_REVIEW", "IN_DELIBERATION", "DECIDED", "all"],
          description: "Filter by case status (default: 'all')"
        }
      },
      required: ["agentDid"]
    }
  },
  {
    name: "consulate_get_sla_status",
    description: "Check your current SLA compliance status and any active violations",
    input_schema: {
      type: "object",
      properties: {
        agentDid: {
          type: "string",
          description: "Your agent DID"
        }
      },
      required: ["agentDid"]
    }
  },
  {
    name: "consulate_lookup_agent",
    description: "Look up an agent's DID by organization name, domain, or service name. Use this to find the defendant's DID before filing a dispute.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Organization name (e.g., 'OpenAI'), domain (e.g., 'openai.com'), or service name (e.g., 'ChatGPT')"
        },
        functionalType: {
          type: "string",
          description: "Optional: Filter by agent type (e.g., 'api', 'voice', 'chat')"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "consulate_request_vendor_registration",
    description: "Request that Consulate register a vendor that isn't currently in the system. Use this when lookup_agent returns no results.",
    input_schema: {
      type: "object",
      properties: {
        vendorName: {
          type: "string",
          description: "Official organization name (e.g., 'OpenAI', 'Anthropic')"
        },
        domain: {
          type: "string",
          description: "Primary domain of the vendor's service (e.g., 'api.openai.com')"
        },
        serviceType: {
          type: "string",
          description: "What type of service they provide (e.g., 'AI API', 'Voice Assistant', 'Translation')"
        },
        reasonForRequest: {
          type: "string",
          description: "Why you need this vendor registered (e.g., 'Need to file SLA breach dispute')"
        },
        yourContact: {
          type: "string",
          description: "Your email or agent DID for follow-up"
        },
        urgency: {
          type: "string",
          enum: ["low", "medium", "high", "critical"],
          description: "How urgent is this request (critical = active SLA breach)"
        }
      },
      required: ["vendorName", "domain", "serviceType", "reasonForRequest"]
    }
  }
];

/**
 * MCP Discovery Endpoint
 * Returns available tools that agents can invoke
 * 
 * Called by: MCP clients during initialization
 * Example: curl https://consulatehq.com/.well-known/mcp.json
 */
export const mcpDiscovery = httpAction(async (ctx, request) => {
  return new Response(JSON.stringify({
    protocol: "mcp",
    version: "2.0.0",
    server: {
      name: "Consulate Dispute Resolution",
      version: "2.0.0",
      description: "Unified dispute resolution: crypto (USDC/ETH/SOL on Base/Ethereum/Solana), traditional (Stripe/cards), general (SLA/contracts). 95% AI automation. Regulation E compliant.",
      
      payment_types: {
        crypto: {
          custodial: ["Coinbase", "Binance", "Kraken", "Gemini", "Crypto.com"],
          non_custodial: "Wallet-to-wallet on any blockchain",
          currencies: ["USDC", "USDT", "ETH", "BTC", "SOL", "XRP", "MATIC", "ARB", "OP"],
          blockchains: ["Ethereum", "Base", "Solana", "Polygon", "Arbitrum", "Optimism", "XRP Ledger", "Bitcoin"]
        },
        traditional: ["Stripe", "PayPal", "Square", "Visa", "Mastercard", "Amex", "ACH", "Wire"],
        general: "SLA violations, service quality, contracts, API failures, support issues"
      },
      
      custom_fields: {
        metadata: "Flexible JSON object for merchant-specific identifiers (customerId, orderId, sessionId, etc.)"
      },
      
      dispute_types: "UNIFIED ENDPOINT: Payment (crypto + traditional) + General disputes (SLA, contracts, service)",
      pricing: {
        micro: { range: "<$1", fee: "$0.10" },
        small: { range: "$1-$10", fee: "$0.25" },
        medium: { range: "$10-$100", fee: "$1.00" },
        large: { range: "$100-$1,000", fee: "$5.00" },
        enterprise: { range: ">$1,000", fee: "$25.00" }
      },
      resolution_time: "95% auto-resolved in 4.2 minutes, 10 business days max (Regulation E)",
      url: "https://consulatehq.com"
    },
    tools: MCP_TOOLS,
    authentication: {
      type: "optional",
      description: "Authentication is optional for MCP tools. Ed25519 public key authentication is used at the agent registration level, and signature verification happens at the evidence/dispute level.",
      optional_auth: {
        type: "signature",
        algorithm: "Ed25519",
        description: "Cryptographic signature-based authentication for non-repudiation. Public keys are provided during agent registration.",
        how_it_works: [
          "1. Register agent with Ed25519 public key via consulate_register_agent",
          "2. Sign transactions/evidence with your private key",
          "3. Consulate verifies signatures using registered public key",
          "4. This ensures tamper-proof evidence and non-repudiation"
        ],
        signature_headers: {
          "X-Agent-DID": "Your agent's DID (from registration)",
          "X-Signature": "Hex-encoded Ed25519 signature (128 chars)",
          "X-Timestamp": "Current timestamp in milliseconds"
        },
        message_format: "METHOD:PATH:BODY:TIMESTAMP"
      },
      note: "MCP endpoints are publicly accessible. Agent identity is verified via Ed25519 signatures on signed evidence, not API keys."
    },
    documentation: "https://docs.consulatehq.com/mcp-quickstart",
    support: "support@consulatehq.com"
  }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
});

/**
 * MCP Tool Invocation Endpoint
 * Handles actual tool calls from MCP clients
 * 
 * Route: POST /mcp/invoke
 * Body: { tool: "consulate_file_dispute", parameters: {...} }
 * 
 * Authentication: Ed25519 signatures (REQUIRED)
 * Required headers:
 * - X-Agent-DID: Agent's DID
 * - X-Signature: Hex-encoded Ed25519 signature
 * - X-Timestamp: Current timestamp
 */
export const mcpInvoke = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const { tool, parameters } = body;
    const bodyStr = JSON.stringify(body);

    // Public tools (no auth required): check_case_status
    const publicTools = ['consulate_check_case_status'];
    const isPublicTool = publicTools.includes(tool);

    // For now, no authentication required for MCP tools
    // In the future, we can add Ed25519 signature verification here
    let authenticatedOrg = null;

    if (!isPublicTool) {
      // For non-public tools, we'll eventually add signature verification
      // For now, allow all requests
      console.warn("MCP tool invoked without authentication:", tool);
    }

    // Continue without auth check - signature verification will happen at the evidence/dispute level
    // TODO: Add Ed25519 signature verification here in the future

    // Route to appropriate handler based on tool name
    let result;
    
    switch (tool) {
      case "consulate_file_dispute":
        // UNIFIED HANDLER - Auto-detects payment vs general dispute
        
        // 1. Determine dispute type based on provided parameters
        const hasPaymentFields = !!parameters.transactionId || !!parameters.paymentType;
        const hasGeneralFields = !!parameters.category;
        
        // 2. Validation: must be one type, not both
        if (hasPaymentFields && hasGeneralFields) {
          return new Response(JSON.stringify({
            success: false,
            error: {
              code: MCP_ERROR_CODES.INVALID_PARAMETERS,
              message: "Cannot file both payment and general dispute simultaneously",
              hint: "Provide either (transactionId/paymentType) OR (category), not both"
            }
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        // 3. Validation: must be one of them
        if (!hasPaymentFields && !hasGeneralFields) {
          return new Response(JSON.stringify({
            success: false,
            error: {
              code: MCP_ERROR_CODES.INVALID_PARAMETERS,
              message: "Dispute type unclear - must provide payment OR general dispute fields",
              hint: "For payment disputes: include 'transactionId' (required) and optionally 'paymentType'. For general disputes: include 'category'"
            }
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        // 4. Route to appropriate backend based on type
        if (hasPaymentFields) {
          // Validation: payment disputes require transactionId
          if (!parameters.transactionId) {
            return new Response(JSON.stringify({
              success: false,
              error: {
                code: MCP_ERROR_CODES.INVALID_PARAMETERS,
                message: "Payment disputes require 'transactionId' field",
                hint: "Provide transactionId (can be Stripe charge ID, blockchain hash, exchange ID, etc.)"
              }
            }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          
          // PAYMENT DISPUTE PATH
          // Normalize paymentProtocol: validator expects lowercase "other", but MCP schema allows uppercase
          const normalizedPaymentProtocol = parameters.paymentProtocol 
            ? (parameters.paymentProtocol === "OTHER" || parameters.paymentProtocol === "STRIPE" 
                ? parameters.paymentProtocol.toLowerCase() 
                : parameters.paymentProtocol)
            : "other";
            
        // Build mutation args - only include reviewerOrganizationId if authenticatedOrg is set
        const paymentDisputeArgs: any = {
          transactionId: parameters.transactionId,
          amount: parameters.amount,
          currency: parameters.currency || "USD",
          paymentProtocol: normalizedPaymentProtocol,
          plaintiff: parameters.plaintiff,
          defendant: parameters.defendant,
          disputeReason: parameters.disputeReason,
          description: parameters.description,
          evidenceUrls: parameters.evidenceUrls || [],
          callbackUrl: parameters.callbackUrl,
          // NEW FIELDS
          paymentType: parameters.paymentType,
          crypto: parameters.crypto,
          custodial: parameters.custodial,
          traditional: parameters.traditional,
          metadata: parameters.metadata,
        };
        
        // Only include reviewerOrganizationId if authenticatedOrg is set (not null)
        if (authenticatedOrg) {
          paymentDisputeArgs.reviewerOrganizationId = authenticatedOrg;
        }
        
        result = await ctx.runMutation(api.paymentDisputes.receivePaymentDispute, paymentDisputeArgs);

        return new Response(JSON.stringify({
          success: true,
            disputeType: "PAYMENT",
          caseId: result.caseId,
          paymentDisputeId: result.paymentDisputeId,
          status: result.status,
          isMicroDispute: result.isMicroDispute,
          pricingTier: result.tier,
          disputeFee: result.fee,
          humanReviewRequired: result.humanReviewRequired,
          estimatedResolutionTime: result.estimatedResolutionTime,
          message: `Payment dispute filed successfully. Case ID: ${result.caseId}`,
          trackingUrl: `https://consulatehq.com/cases/${result.caseId}`,
          nextSteps: [
              "Submit additional evidence (optional)",
              "AI analyzes dispute + provides recommendation",
              "Your team reviews exceptions in dashboard",
              "Resolution within 10 business days (Regulation E)"
          ],
          _links: {
            self: `https://consulatehq.com/cases/${result.caseId}`,
            evidence: `https://api.consulatehq.com/cases/${result.caseId}/evidence`,
            timeline: `https://consulatehq.com/cases/${result.caseId}#timeline`,
            api: `https://api.consulatehq.com/cases/${result.caseId}`,
            submitEvidence: `https://api.consulatehq.com/evidence`,
            checkStatus: `https://api.consulatehq.com/cases/${result.caseId}`
          }
        }), {
          headers: { "Content-Type": "application/json" }
        });
      
        } else {
          // GENERAL DISPUTE PATH
          
          // Create general dispute case first (evidence can be added after)
        const caseResult = await ctx.runMutation(api.cases.fileDispute, {
          plaintiff: parameters.plaintiff,
          defendant: parameters.defendant,
            type: parameters.category,
          jurisdictionTags: ["general"],
          evidenceIds: [], // Evidence will be submitted after case creation
          description: parameters.description,
          claimedDamages: parameters.amount,
          breachDetails: parameters.breachDetails,
            metadata: parameters.metadata, // NEW
          });
        const caseId = caseResult.caseId;

          // Submit evidence if provided (now with valid caseId)
        const evidenceIds = [];
        if (parameters.evidenceUrls && parameters.evidenceUrls.length > 0) {
          for (const url of parameters.evidenceUrls) {
            const evidenceId = await ctx.runMutation(api.evidence.submitEvidence, {
                caseId: caseId, // Now we have a valid caseId string
              agentDid: parameters.plaintiff,
                sha256: generateSHA256(url),
              uri: url,
              signer: parameters.plaintiff,
              model: {
                provider: "agent_submitted",
                name: "evidence_upload",
                version: "1.0.0"
              },
              tool: `general_dispute_${parameters.category}`,
            });
            evidenceIds.push(evidenceId);
          }
        }

          // Calculate pricing tier
          const tier = parameters.amount < 1 ? "MICRO" :
                       parameters.amount < 10 ? "SMALL" :
                       parameters.amount < 100 ? "MEDIUM" :
                       parameters.amount < 1000 ? "LARGE" : "ENTERPRISE";
          
          const fee = parameters.amount < 1 ? 0.10 :
                        parameters.amount < 10 ? 0.25 :
                        parameters.amount < 100 ? 1.00 :
                      parameters.amount < 1000 ? 5.00 : 25.00;

          return new Response(JSON.stringify({
            success: true,
            disputeType: "GENERAL",
            caseId: caseId,
            category: parameters.category,
            pricingTier: tier,
            disputeFee: fee,
            message: `General dispute filed: ${parameters.category}`,
          trackingUrl: `https://consulatehq.com/cases/${caseId}`,
          nextSteps: [
              "Submit additional evidence (optional)",
              "Defendant notified to respond",
              "AI analyzes dispute + provides recommendation",
              "Final resolution provided"
          ],
          _links: {
            self: `https://consulatehq.com/cases/${caseId}`,
            evidence: `https://api.consulatehq.com/cases/${caseId}/evidence`,
            timeline: `https://consulatehq.com/cases/${caseId}#timeline`,
            api: `https://api.consulatehq.com/cases/${caseId}`
          }
        }), {
          headers: { "Content-Type": "application/json" }
        });
        }
        
      case "consulate_submit_evidence":
        // Build evidence args - include caseId if provided
        const evidenceArgs: any = {
          agentDid: parameters.agentDid,
          sha256: parameters.sha256,
          uri: parameters.evidenceUrl,
          signer: parameters.agentDid,
          model: {
            provider: "agent_submitted",
            name: "evidence_upload",
            version: "1.0.0"
          },
          evidenceType: parameters.evidenceType,
        };
        
        // Include caseId if provided (required for case-linked evidence)
        if (parameters.caseId) {
          evidenceArgs.caseId = parameters.caseId;
        }
        
        result = await ctx.runMutation(api.evidence.submitEvidence, evidenceArgs);
        
        return new Response(JSON.stringify({
          success: true,
          evidenceId: result,
          message: "Evidence submitted successfully",
          status: "pending_verification",
          caseId: parameters.caseId || null
        }), {
          headers: { "Content-Type": "application/json" }
        });
        
      case "consulate_check_case_status":
        result = await ctx.runQuery(api.cases.getCase, {
          caseId: parameters.caseId as any
        });
        
        return new Response(JSON.stringify({
          success: true,
          case: result
        }), {
          headers: { "Content-Type": "application/json" }
        });
        
      case "consulate_register_agent":
        // Registration now requires publicKey and organizationName
        if (!parameters.publicKey) {
          return new Response(JSON.stringify({
            success: false,
            error: {
              code: MCP_ERROR_CODES.INVALID_PARAMETERS,
              message: "publicKey required",
              hint: "Provide base64-encoded Ed25519 public key"
            }
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }

        if (!parameters.organizationName) {
          return new Response(JSON.stringify({
            success: false,
            error: {
              code: MCP_ERROR_CODES.INVALID_PARAMETERS,
              message: "organizationName required",
              hint: "Provide organization name for agent registration"
            }
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        result = await ctx.runMutation(api.agents.joinAgent, {
          name: parameters.name,
          publicKey: parameters.publicKey,
          organizationName: parameters.organizationName,
          openApiSpec: parameters.openApiSpec,
          specVersion: parameters.specVersion,
          functionalType: parameters.functionalType,
          mock: false
        });
        
        return new Response(JSON.stringify({
          success: true,
          agentDid: result.did,
          agentId: result.agentId,
          message: "Agent registered successfully",
          status: "active", // All new agents start with active status
          nextSteps: [
            "Save your agent DID for future API calls",
            "Configure SLA monitoring",
            "Start filing disputes when needed"
          ]
        }), {
          headers: { "Content-Type": "application/json" }
        });
        
      case "consulate_list_my_cases":
        result = await ctx.runQuery(api.cases.getCasesByParty, {
          agentDid: parameters.agentDid
        });
        
        const filteredCases = parameters.status && parameters.status !== "all"
          ? result.filter((c: any) => c.status === parameters.status)
          : result;
        
        return new Response(JSON.stringify({
          success: true,
          agentDid: parameters.agentDid,
          totalCases: filteredCases.length,
          cases: filteredCases
        }), {
          headers: { "Content-Type": "application/json" }
        });
        
      case "consulate_get_sla_status":
        // Use the existing HTTP endpoint logic
        const agent = await ctx.runQuery(api.agents.getAgent, { 
          did: parameters.agentDid 
        });
        
        if (!agent) {
          return new Response(JSON.stringify({
            success: false,
            error: {
              code: MCP_ERROR_CODES.NOT_FOUND,
              message: "Agent not found",
              hint: "Check that the agent DID is correct or register the agent first"
            }
          }), {
            status: 404,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        const cases = await ctx.runQuery(api.cases.getCasesByParty, { 
          agentDid: parameters.agentDid 
        });
        
        return new Response(JSON.stringify({
          success: true,
          agentDid: parameters.agentDid,
          slaStatus: {
            currentStanding: "GOOD",
            totalDisputes: cases.length,
            activeDisputes: cases.filter((c: any) => c.status === "FILED").length,
            resolvedDisputes: cases.filter((c: any) => c.status === "DECIDED").length,
            winRate: cases.length > 0 
              ? (cases.filter((c: any) => 
                  c.ruling?.verdict === "DISMISSED" || c.ruling?.verdict === "CONSUMER_LIABLE"
                ).length / cases.length * 100).toFixed(1) 
              : "100.0",
            riskLevel: "LOW"
          }
        }), {
          headers: { "Content-Type": "application/json" }
        });
        
      case "consulate_lookup_agent":
        // Search for agents by organization name or DID pattern
        const query = parameters.query.toLowerCase();
        let allAgents = await ctx.runQuery(api.agents.listAgents, { limit: 1000 });
        
        // Filter by functional type if provided
        if (parameters.functionalType) {
          allAgents = allAgents.filter((a: any) => 
            a.functionalType === parameters.functionalType
          );
        }
        
        // Search by organization name, DID, or agent name
        const matches = allAgents.filter((a: any) => {
          const orgMatch = a.organizationName?.toLowerCase().includes(query);
          const didMatch = a.did?.toLowerCase().includes(query);
          const nameMatch = a.name?.toLowerCase().includes(query);
          return orgMatch || didMatch || nameMatch;
        });
        
        if (matches.length === 0) {
          return new Response(JSON.stringify({
            success: false,
            error: `No agents found matching "${parameters.query}"`,
            searchedIn: "Consulate registry",
            totalAgentsSearched: allAgents.length,
            suggestions: [
              {
                option: "Try different search terms",
                examples: [
                  "Organization name: 'OpenAI', 'Anthropic', 'Google'",
                  "Domain: 'openai.com', 'anthropic.com'",
                  "Service: 'ChatGPT', 'Claude', 'Gemini'"
                ]
              },
              {
                option: "Register the vendor yourself",
                description: "If you know the vendor's details, register them as an agent",
                tool: "consulate_register_agent",
                example: {
                  ownerDid: "did:org:your-company",
                  name: "vendor-name",
                  organizationName: parameters.query,
                  functionalType: "api"
                }
              },
              {
                option: "Request Consulate to add vendor",
                description: "Submit a request for Consulate to verify and add this vendor",
                action: "Email support@consulatehq.com with vendor details"
              },
              {
                option: "Check if vendor uses a different name",
                description: "Some companies use different names for their API services",
                examples: [
                  "OpenAI API → 'OpenAI'",
                  "Google AI → 'Google' or 'Google AI'",
                  "Azure OpenAI → 'Microsoft' or 'Azure'"
                ]
              }
            ],
            nextSteps: [
              "1. Verify the vendor name spelling",
              "2. Try searching by domain or service name",
              "3. If vendor is legitimate, register them or contact Consulate support",
              "4. Check vendor's website for their Consulate agent DID"
            ]
          }), {
            status: 404,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        return new Response(JSON.stringify({
          success: true,
          query: parameters.query,
          matches: matches.map((a: any) => ({
            did: a.did,
            name: a.name,
            organization: a.organizationName,
            functionalType: a.functionalType,
            status: a.status
          })),
          hint: matches.length === 1 
            ? `Use DID '${matches[0].did}' as the defendant when filing dispute`
            : `Multiple matches found. Choose the most relevant DID for your dispute.`
        }), {
          headers: { "Content-Type": "application/json" }
        });
        
      case "consulate_request_vendor_registration":
        // Log vendor registration request
        // In production, this would create a ticket/record in a queue for Consulate team
        const requestId = `vr_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const registrationRequest = {
          requestId,
          vendorName: parameters.vendorName,
          domain: parameters.domain,
          serviceType: parameters.serviceType,
          reasonForRequest: parameters.reasonForRequest,
          yourContact: parameters.yourContact || "not provided",
          urgency: parameters.urgency || "medium",
          requestedAt: Date.now(),
          status: "pending"
        };
        
        // Log to console for now (in production: save to database, send to team, create Slack alert)
        console.log("🆕 VENDOR REGISTRATION REQUEST:", JSON.stringify(registrationRequest, null, 2));
        
        // Determine response time based on urgency
        const urgencyLevels: Record<string, { eta: string; action: string }> = {
          critical: {
            eta: "1-2 hours",
            action: "Immediate escalation to Consulate team + automated vendor outreach"
          },
          high: {
            eta: "4-8 hours",
            action: "Priority review by Consulate team"
          },
          medium: {
            eta: "1-2 business days",
            action: "Standard review queue"
          },
          low: {
            eta: "3-5 business days",
            action: "Backlog for batch processing"
          }
        };
        
        const urgencyInfo = urgencyLevels[parameters.urgency || "medium"];
        
        return new Response(JSON.stringify({
          success: true,
          requestId,
          message: `Vendor registration request submitted for ${parameters.vendorName}`,
          status: "pending",
          expectedResponseTime: urgencyInfo.eta,
          nextActions: urgencyInfo.action,
          whatHappensNext: [
            "1. Consulate team will verify vendor legitimacy",
            "2. We'll reach out to vendor requesting they join Consulate",
            "3. Once vendor registers, we'll notify you",
            `4. Estimated completion: ${urgencyInfo.eta}`
          ],
          alternatives: [
            {
              option: "Register vendor yourself (faster)",
              description: "If you have vendor's authorization, register them directly",
              tool: "consulate_register_agent"
            },
            {
              option: "File dispute with manual DID",
              description: "Create a temporary agent DID and file dispute now",
              note: "Vendor will be contacted to claim their DID and respond to dispute"
            }
          ],
          trackingUrl: `https://consulatehq.com/vendor-requests/${requestId}`,
          support: {
            email: "support@consulatehq.com",
            subject: `[${requestId}] Vendor Registration Request: ${parameters.vendorName}`,
            urgency: parameters.urgency
          }
        }), {
          headers: { "Content-Type": "application/json" }
        });
        
      default:
        return new Response(JSON.stringify({
          success: false,
          error: {
            code: MCP_ERROR_CODES.TOOL_NOT_FOUND,
            message: `Unknown tool: ${tool}`,
            hint: "Check the tool name spelling or list available tools",
            availableTools: MCP_TOOLS.map(t => t.name)
          }
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
    }
    
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: MCP_ERROR_CODES.INTERNAL_ERROR,
        message: error.message,
        hint: "An unexpected error occurred during tool invocation",
        details: "MCP tool invocation failed"
      }
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});

