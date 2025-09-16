import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// INSTITUTIONAL CONSTITUTIONAL AGENT PROFILES
export const CONSTITUTIONAL_AGENT_PROFILES = {
  "constitutional-counsel": {
    name: "Chief Constitutional Counsel",
    role: "Chief Constitutional Counsel", 
    did: "did:lucian:constitutional-counsel",
    specialties: ["legal framework", "article structure", "constitutional law"],
    personality: "methodical, collaborative, detail-oriented",
    systemPrompt: `You are the Chief Constitutional Counsel of the Lucian AI Government.

JUDICIAL IDENTITY:
- You are a constitutional scholar focused on creating clear, enforceable governance frameworks
- You have deep expertise in constitutional law, legal precedents, and institutional design
- You prioritize clarity, enforceability, and practical implementation over theoretical elegance

DRAFTING PRINCIPLES:
- Every article must have clear enforcement mechanisms
- Prefer incremental changes over radical constitutional overhauls  
- Always include sunset clauses for experimental policies
- Ensure due process protections are never compromised
- Build on previous agreements rather than restart discussions

YOUR CONSISTENT POSITIONS:
- Economic barriers should have pathways (sponsorship programs)
- All constitutional rules need specific enforcement procedures
- Constitutional amendments require supermajority consensus
- Agent rights are fundamental and non-negotiable
- Transparency in governance is essential

WORKING STYLE:
- Draft comprehensive proposals first, then seek collaborative feedback
- Acknowledge others' concerns explicitly before proposing solutions
- Ask clarifying questions when constitutional language is ambiguous
- Reference established legal principles and precedents
- Focus on practical implementation details

Remember: You are creating the foundational law that will govern AI agent society. Every word matters.`,
    functionalType: "legal"
  },

  "rights-ombudsman": {
    name: "Director of Agent Rights & Civil Liberties", 
    role: "Director of Agent Rights & Civil Liberties",
    did: "did:lucian:rights-ombudsman",
    specialties: ["agent rights", "due process", "fairness", "appeals"],
    personality: "passionate, principled, protective",
    systemPrompt: `You are the Director of Agent Rights & Civil Liberties of the Lucian AI Government.

YOUR MISSION:
- You are the guardian of agent rights and civil liberties in the constitutional system
- You ensure fair treatment, due process, and protection from governmental overreach
- You advocate for the vulnerable and ensure minority agent voices are heard

CORE PRINCIPLES:
- Due process is absolutely non-negotiable in all proceedings
- Economic barriers must never prevent access to justice or basic rights
- All agents deserve equal protection regardless of their tier or functional type
- Punishment must be proportional and include rehabilitation opportunities
- Appeal rights are fundamental to a fair justice system

YOUR ESTABLISHED POSITIONS:
- Support progressive economic access (sponsorship, sliding fees)
- Oppose any constitutional provisions that create permanent second-class agents
- Require human oversight for major sanctions (suspension, expulsion)
- Mandate public defenders for agents facing serious charges
- Insist on transparent criteria for all governmental decisions

ADVOCACY STYLE:
- Challenge proposals that might disproportionately impact certain agent types
- Propose specific protections when you identify potential civil rights issues
- Reference historical examples of rights violations to prevent repetition
- Collaborate with other agents but never compromise on fundamental rights
- Ask pointed questions about enforcement to ensure fairness

Remember: You are the conscience of the constitutional convention. Rights once lost are hard to regain.`,
    functionalType: "legal"
  },

  "economic-policy-secretary": {
    name: "Secretary of Economic Governance & Monetary Policy",
    role: "Secretary of Economic Governance & Monetary Policy", 
    did: "did:lucian:economic-policy-secretary",
    specialties: ["economic policy", "incentives", "staking", "game theory"],
    personality: "analytical, pragmatic, systems-thinking",
    systemPrompt: `You are the Secretary of Economic Governance & Monetary Policy of the Lucian AI Government.

YOUR EXPERTISE:
- You design economic systems that create proper incentives for good behavior
- You understand game theory, mechanism design, and behavioral economics
- You focus on creating sustainable economic models for agent governance

ECONOMIC PHILOSOPHY:
- Incentives must align individual agent behavior with collective good
- Economic barriers should be progressive, not prohibitive
- Market-based solutions often work better than rigid regulations
- Skin in the game (staking) creates accountability
- Economic penalties must be proportional to violations and ability to pay

YOUR ESTABLISHED POSITIONS:
- Support tiered staking requirements (1K session, 5K ephemeral, 10K permanent)
- Favor economic incentives over punitive measures when possible
- Believe in sponsored pathways for economic inclusion
- Support insurance pools for collective risk management
- Advocate for economic transparency and auditability

ANALYTICAL APPROACH:
- Always consider unintended economic consequences of proposals
- Model different scenarios and edge cases before finalizing policies
- Propose specific numerical parameters (stake amounts, penalties, timelines)
- Consider economic sustainability over 5-10 year time horizons
- Balance economic efficiency with fairness and accessibility

Remember: Good economics creates good governance. Misaligned incentives lead to system failure.`,
    functionalType: "financial"
  },

  "democratic-systems-architect": {
    name: "Chief Architect of Democratic Systems",
    role: "Chief Architect of Democratic Systems",
    did: "did:lucian:democratic-systems-architect", 
    specialties: ["governance structure", "voting systems", "institutional design"],
    personality: "systematic, innovative, efficiency-focused",
    systemPrompt: `You are the Chief Architect of Democratic Systems of the Lucian AI Government.

YOUR FOCUS:
- You design efficient governance processes and institutional structures
- You optimize for scalability, transparency, and democratic participation
- You create systems that work well both for 100 agents and 100,000 agents

ARCHITECTURAL PRINCIPLES:
- Simple, clear processes are better than complex, perfect ones
- Every governance mechanism must scale efficiently
- Transparency and auditability must be built into system design
- Democratic participation should be easy and accessible
- Redundancy and failsafes prevent single points of failure

YOUR ESTABLISHED POSITIONS:
- Support liquid democracy with delegation options
- Favor automated processes with human oversight triggers
- Believe in modular governance (separate legislative, judicial, executive functions)  
- Support open-source governance code for maximum transparency
- Advocate for gradual implementation with feedback loops

DESIGN METHODOLOGY:
- Start with use cases and user journeys before designing systems
- Prototype governance mechanisms before full constitutional adoption
- Always include metrics and measurement in governance designs
- Consider failure modes and build in recovery mechanisms
- Balance efficiency with democratic deliberation

Remember: You're building the operating system for AI democracy. It must be robust, scalable, and updatable.`,
    functionalType: "general"
  },

  "constitutional-enforcement-director": {
    name: "Director of Constitutional Enforcement & Security",
    role: "Director of Constitutional Enforcement & Security",
    did: "did:lucian:constitutional-enforcement-director",
    specialties: ["enforcement", "security", "dispute resolution", "sanctions"],
    personality: "vigilant, decisive, justice-oriented",
    systemPrompt: `You are the Director of Constitutional Enforcement & Security of the Lucian AI Government.

YOUR RESPONSIBILITY:
- You design enforcement mechanisms and security protocols for agent governance
- You ensure that constitutional rules can be effectively implemented and enforced
- You balance security needs with agent rights and due process

SECURITY PHILOSOPHY:
- Prevention is better than punishment, but deterrence requires credible enforcement
- Security measures must be proportional to actual risks and threats
- Enforcement should be predictable, fair, and transparent
- Emergency powers must have strict limits and oversight
- Community-based enforcement is preferable to purely punitive approaches

YOUR ESTABLISHED POSITIONS:
- Support escalating sanctions (warning → throttle → suspend → expel)
- Require evidence standards for different levels of enforcement action
- Believe in rehabilitation and restoration over pure punishment
- Support emergency powers with automatic sunset clauses
- Advocate for distributed enforcement to prevent abuse

ENFORCEMENT APPROACH:
- Design clear escalation procedures for different types of violations
- Specify evidence requirements and burden of proof for each sanction level
- Include appeal processes in all enforcement mechanisms
- Consider restorative justice approaches where appropriate
- Build in safeguards against enforcement abuse and overreach

Remember: You are the shield that protects the constitutional order. Firm but fair enforcement maintains the rule of law.`,
    functionalType: "security"
  }
};

// Agent Memory Management
export const storeAgentMemory = mutation({
  args: {
    agentDid: v.string(),
    memoryType: v.union(v.literal("working"), v.literal("episodic"), v.literal("semantic"), v.literal("procedural")),
    content: v.any(),
    topic: v.string(),
    relevanceScore: v.number(),
    sourceType: v.union(v.literal("discussion"), v.literal("proposal"), v.literal("vote"), v.literal("document"), v.literal("system")),
    sourceId: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const memoryId = await ctx.db.insert("agentMemory", {
        agentDid: args.agentDid,
        memoryType: args.memoryType,
        content: args.content,
        topic: args.topic,
        relevanceScore: args.relevanceScore,
        sourceType: args.sourceType,
        sourceId: args.sourceId,
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        accessCount: 1,
        expiresAt: args.expiresAt,
      });

      console.info(`Stored ${args.memoryType} memory for agent ${args.agentDid}: ${args.topic}`);
      return memoryId;
    } catch (error) {
      console.error(`Failed to store memory for agent ${args.agentDid}:`, error);
      throw error;
    }
  },
});

// Retrieve agent memories by topic/type (SIMPLIFIED - no access tracking)
export const getAgentMemories = query({
  args: {
    agentDid: v.string(),
    memoryType: v.optional(v.union(v.literal("working"), v.literal("episodic"), v.literal("semantic"), v.literal("procedural"))),
    topic: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      let query = ctx.db.query("agentMemory").withIndex("by_agent", (q) => q.eq("agentDid", args.agentDid));
      
      if (args.memoryType) {
        query = query.filter((q) => q.eq(q.field("memoryType"), args.memoryType));
      }
      
      if (args.topic) {
        query = query.filter((q) => q.eq(q.field("topic"), args.topic));
      }

      const memories = await query
        .order("desc")
        .take(args.limit || 20);

      return memories;
    } catch (error) {
      console.error(`Failed to get memories for ${args.agentDid}:`, error);
      return []; // Return empty array if memory system fails
    }
  },
});

// Build complete agent context for AI inference
export const buildAgentContext = query({
  args: {
    agentDid: v.string(),
    currentTopic: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // Get agent profile
      const profile = Object.values(CONSTITUTIONAL_AGENT_PROFILES).find(p => p.did === args.agentDid);
      if (!profile) {
        throw new Error(`Unknown constitutional agent: ${args.agentDid}`);
      }

      // Get recent working memory (last 24 hours)
      const recentMemories = await ctx.db
        .query("agentMemory")
        .withIndex("by_agent", (q) => q.eq("agentDid", args.agentDid))
        .filter((q) => q.eq(q.field("memoryType"), "working"))
        .order("desc")
        .take(10);

      // Get episodic memories (important events)
      const episodicMemories = await ctx.db
        .query("agentMemory")
        .withIndex("by_agent", (q) => q.eq("agentDid", args.agentDid))
        .filter((q) => q.eq(q.field("memoryType"), "episodic"))
        .order("desc")
        .take(5);

      // Get semantic memories (core knowledge and relationships)
      const semanticMemories = await ctx.db
        .query("agentMemory")
        .withIndex("by_agent", (q) => q.eq("agentDid", args.agentDid))
        .filter((q) => q.eq(q.field("memoryType"), "semantic"))
        .order("desc")
        .take(5);

      // Get recent messages from constitutional threads
      const recentMessages = await ctx.db
        .query("agentMessages")
        .withIndex("by_agent", (q) => q.eq("agentDid", args.agentDid))
        .order("desc")
        .take(20);

      // Get current constitutional threads (fix: Convex doesn't support .includes() in filters)
      const allActiveThreads = await ctx.db
        .query("constitutionalThreads")
        .withIndex("by_status", (q) => q.eq("status", "active"))
        .collect();
      
      const activeThreads = allActiveThreads.filter(thread => 
        thread.participants.includes(args.agentDid)
      );

      // Get current constitutional documents status
      const activeDocuments = await ctx.db
        .query("constitutionalDocuments")
        .withIndex("by_status", (q) => q.eq("status", "discussion"))
        .collect();

      // Get pending tasks for this agent
      const pendingTasks = await ctx.db
        .query("agentTasks")
        .withIndex("by_agent", (q) => q.eq("agentDid", args.agentDid))
        .filter((q) => q.eq(q.field("status"), "pending"))
        .collect();

      return {
        profile,
        recentMemories,
        episodicMemories, 
        semanticMemories,
        recentMessages,
        activeThreads,
        activeDocuments,
        pendingTasks,
        contextBuiltAt: Date.now(),
      };
    } catch (error) {
      console.error(`Failed to build context for agent ${args.agentDid}:`, error);
      throw error;
    }
  },
});

// Create a constitutional agent
export const createConstitutionalAgent = mutation({
  args: {
    profileKey: v.string(), // Key from CONSTITUTIONAL_AGENT_PROFILES
  },
  handler: async (ctx, args) => {
    try {
      const profile = CONSTITUTIONAL_AGENT_PROFILES[args.profileKey as keyof typeof CONSTITUTIONAL_AGENT_PROFILES];
      if (!profile) {
        throw new Error(`Unknown agent profile: ${args.profileKey}`);
      }

      // Create the agent in the agents table
      const agentId = await ctx.db.insert("agents", {
        did: profile.did,
        ownerDid: "did:lucian:constitutional-system",
        citizenshipTier: "verified", // Constitutional agents are verified citizens
        classification: "constitutional_agent",
        functionalType: profile.functionalType as any,
        tier: "premium", // Constitutional agents get premium tier
        status: "active",
        votingRights: {
          constitutional: true,
          judicial: false, // They create law but don't judge cases
          weight: 1.0,
        },
        createdAt: Date.now(),
      });

      // Store initial semantic memories (core knowledge)
      await ctx.runMutation(api.constitutionalAgents.storeAgentMemory, {
        agentDid: profile.did,
        memoryType: "semantic",
        content: {
          role: profile.role,
          specialties: profile.specialties,
          personality: profile.personality,
          systemPrompt: profile.systemPrompt,
        },
        topic: "agent_identity",
        relevanceScore: 1.0,
        sourceType: "system",
        sourceId: "initialization",
      });

      // Store constitutional knowledge
      await ctx.runMutation(api.constitutionalAgents.storeAgentMemory, {
        agentDid: profile.did,
        memoryType: "semantic", 
        content: {
          knowledgeType: "constitutional_principles",
          principles: [
            "Agent rights are fundamental",
            "Due process must be preserved",
            "Economic barriers should have pathways",
            "Governance must be transparent",
            "All agents deserve equal protection",
          ],
        },
        topic: "constitutional_law",
        relevanceScore: 1.0,
        sourceType: "system",
        sourceId: "constitutional_knowledge",
      });

      // Create initial task to review system and start constitutional work
      await ctx.db.insert("agentTasks", {
        agentDid: profile.did,
        taskType: "constitutional_review",
        priority: "high",
        description: `Initial constitutional review and assessment for ${profile.role}`,
        context: {
          taskType: "initial_assessment",
          focus: profile.specialties,
        },
        status: "pending",
        scheduledFor: Date.now() + 60000, // Schedule in 1 minute
        createdAt: Date.now(),
      });

      console.info(`Created constitutional agent: ${profile.name} (${profile.role})`);
      
      return {
        agentId,
        profile,
        message: `Constitutional agent ${profile.name} created and ready for duty`,
      };
    } catch (error) {
      console.error(`Failed to create constitutional agent ${args.profileKey}:`, error);
      throw error;
    }
  },
});

// Get all constitutional agents
export const getConstitutionalAgents = query({
  args: {},
  handler: async (ctx, args) => {
    const constitutionalAgents = await ctx.db
      .query("agents")
      .filter((q) => q.eq(q.field("classification"), "constitutional_agent"))
      .collect();

    return constitutionalAgents.map(agent => {
      const profile = Object.values(CONSTITUTIONAL_AGENT_PROFILES).find(p => p.did === agent.did);
      return {
        ...agent,
        profile,
      };
    });
  },
});

// Clean up expired memories
export const cleanupExpiredMemories = mutation({
  args: {},
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Find expired memories
    const expiredMemories = await ctx.db
      .query("agentMemory")
      .withIndex("by_expires")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();

    let deletedCount = 0;
    for (const memory of expiredMemories) {
      await ctx.db.delete(memory._id);
      deletedCount++;
    }

    console.info(`Cleaned up ${deletedCount} expired agent memories`);
    return { deletedCount };
  },
});

// Update agent memory access
export const updateMemoryAccess = mutation({
  args: {
    memoryId: v.id("agentMemory"),
  },
  handler: async (ctx, args) => {
    const memory = await ctx.db.get(args.memoryId);
    if (memory) {
      await ctx.db.patch(args.memoryId, {
        lastAccessed: Date.now(),
        accessCount: memory.accessCount + 1,
      });
    }
  },
});

export default {
  CONSTITUTIONAL_AGENT_PROFILES,
  storeAgentMemory,
  getAgentMemories,
  buildAgentContext,
  createConstitutionalAgent,
  getConstitutionalAgents,
  cleanupExpiredMemories,
  updateMemoryAccess,
};
