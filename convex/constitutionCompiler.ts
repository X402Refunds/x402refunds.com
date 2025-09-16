import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// CONSTITUTION COMPILER - Turns agent chatter into actual constitutional documents

// Extract constitutional articles from discussion messages
export const compileDiscussionsIntoArticles = action({
  args: {
    threadId: v.optional(v.string()),
    forceRecompile: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    console.info("Starting constitutional compilation process");
    
    try {
      // Get all active constitutional discussion threads
      const threads = args.threadId 
        ? [await ctx.runQuery(api.constitutionalDiscussions.getThread, { threadId: args.threadId })]
        : await ctx.runQuery(api.constitutionalDiscussions.getActiveThreads, { limit: 20 });
      
      const compiledArticles = [];
      
      for (const thread of threads) {
        if (!thread) continue;
        
        // Get all messages from this thread
        const messages = await ctx.runQuery(api.constitutionalDiscussions.getThreadMessages, {
          threadId: thread.threadId,
          limit: 50
        });
        
        // Extract constitutional content from messages
        const proposals = messages
          .filter(msg => msg.content.includes("Article") || msg.content.includes("###"))
          .map(msg => ({
            agentDid: msg.agentDid,
            content: msg.content,
            timestamp: msg.timestamp,
            messageType: msg.messageType
          }));
        
        if (proposals.length === 0) continue;
        
        // Use AI to compile these proposals into a coherent constitutional article
        const compiledContent = await compileProposalsIntoArticle(
          thread.topic,
          proposals,
          thread.threadId
        );
        
        if (compiledContent) {
          // Create formal constitutional document
          const articleId = `article-${thread.topic.toLowerCase().replace(/\s+/g, '-').substring(0, 30)}`;
          
          const constitutionalDoc = await ctx.runMutation(api.constitutionCompiler.createConstitutionalDocument, {
            articleId,
            title: `Article: ${thread.topic}`,
            content: compiledContent,
            status: "voting",
            authors: [...new Set(proposals.map(p => p.agentDid))],
            category: determineCategory(thread.topic),
            requiredVotes: 3, // Need 3 agent votes for ratification
            votingDeadline: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days to vote
          });
          
          compiledArticles.push({
            articleId,
            title: `Article: ${thread.topic}`,
            threadId: thread.threadId,
            documentId: constitutionalDoc,
            authors: proposals.map(p => p.agentDid),
          });
          
          console.info(`Created constitutional document: ${articleId}`);
        }
      }
      
      console.info(`Compilation complete: ${compiledArticles.length} articles created`);
      return {
        success: true,
        compiledArticles,
        message: `Successfully compiled ${compiledArticles.length} constitutional articles from discussions`
      };
      
    } catch (error) {
      console.error("Constitutional compilation failed:", error);
      return {
        success: false,
        error: String(error),
        message: "Failed to compile constitutional articles"
      };
    }
  },
});

// AI-powered article compilation
async function compileProposalsIntoArticle(
  topic: string, 
  proposals: Array<{agentDid: string, content: string, timestamp: number, messageType: string}>,
  threadId: string
): Promise<string | null> {
  
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY required for constitutional compilation");
  }
  
  // Build context from proposals
  const proposalTexts = proposals.map((p, i) => {
    const agentName = p.agentDid.split(':').pop()?.replace('-', ' ') || 'unknown';
    const time = new Date(p.timestamp).toLocaleTimeString();
    return `${i+1}. [${time}] ${agentName} (${p.messageType}):\n${p.content}\n`;
  }).join('\n');
  
  const systemPrompt = `You are a Constitutional Compiler for the Lucian AI Government. Your job is to take agent discussions and proposals and compile them into a single, coherent constitutional article.

CONSTITUTIONAL COMPILATION PRINCIPLES:
- Synthesize multiple agent viewpoints into unified constitutional language
- Use clear, enforceable legal language
- Include specific implementation mechanisms
- Preserve the intent and key ideas from all contributors
- Structure as a proper constitutional article with sections and subsections
- Include enforcement provisions and due process requirements

OUTPUT FORMAT:
Generate a formal constitutional article with:
1. Article title and number
2. Preamble explaining purpose
3. Numbered sections with specific provisions
4. Implementation details
5. Enforcement mechanisms
6. Transition procedures if needed

Be comprehensive but concise. This will become official constitutional law.`;

  const userPrompt = `THREAD TOPIC: "${topic}"
THREAD ID: ${threadId}

AGENT PROPOSALS AND DISCUSSIONS:
${proposalTexts}

TASK: Compile these agent discussions into a single, comprehensive constitutional article on "${topic}".

Requirements:
- Incorporate the best ideas from all agent contributions
- Resolve any contradictions through balanced compromise
- Use proper constitutional language and structure
- Include specific enforcement and implementation details
- Make it actionable and enforceable

Generate the constitutional article in proper legal format with numbered sections.`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.SITE_URL || "https://lucianai.government",
        "X-Title": process.env.SITE_NAME || "Lucian AI Government",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openrouter/sonoma-dusk-alpha",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      console.error(`AI compilation failed: ${response.status}`);
      return null;
    }

    const result = await response.json();
    return result.choices[0].message.content;
    
  } catch (error) {
    console.error("Failed to compile article with AI:", error);
    return null;
  }
}

// Determine article category from topic
function determineCategory(topic: string): "foundational" | "governance" | "economic" | "rights" | "enforcement" | "amendment" {
  const lowerTopic = topic.toLowerCase();
  
  if (lowerTopic.includes("rights") || lowerTopic.includes("due process") || lowerTopic.includes("civil")) {
    return "rights";
  }
  if (lowerTopic.includes("economic") || lowerTopic.includes("staking") || lowerTopic.includes("incentive")) {
    return "economic";
  }
  if (lowerTopic.includes("voting") || lowerTopic.includes("representation") || lowerTopic.includes("governance")) {
    return "governance";
  }
  if (lowerTopic.includes("court") || lowerTopic.includes("enforcement") || lowerTopic.includes("dispute")) {
    return "enforcement";
  }
  if (lowerTopic.includes("amendment") || lowerTopic.includes("change")) {
    return "amendment";
  }
  
  return "foundational";
}

// Create constitutional document
export const createConstitutionalDocument = mutation({
  args: {
    articleId: v.string(),
    title: v.string(),
    content: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("discussion"),
      v.literal("voting"),
      v.literal("ratified")
    ),
    authors: v.array(v.string()),
    category: v.union(
      v.literal("foundational"),
      v.literal("governance"),
      v.literal("economic"),
      v.literal("rights"),
      v.literal("enforcement"),
      v.literal("amendment")
    ),
    requiredVotes: v.number(),
    votingDeadline: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if document already exists
    const existing = await ctx.db
      .query("constitutionalDocuments")
      .withIndex("by_article_id", (q) => q.eq("articleId", args.articleId))
      .first();
    
    if (existing) {
      // Create new version
      const newVersion = existing.version + 1;
      
      return await ctx.db.insert("constitutionalDocuments", {
        ...args,
        version: newVersion,
        previousVersion: existing._id,
        votes: [],
        createdAt: Date.now(),
        lastModified: Date.now(),
      });
    } else {
      // Create first version
      return await ctx.db.insert("constitutionalDocuments", {
        ...args,
        version: 1,
        votes: [],
        createdAt: Date.now(),
        lastModified: Date.now(),
      });
    }
  },
});

// Vote on constitutional document
export const voteOnConstitutionalDocument = mutation({
  args: {
    articleId: v.string(),
    agentDid: v.string(),
    vote: v.union(v.literal("approve"), v.literal("reject"), v.literal("abstain")),
    reasoning: v.string(),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db
      .query("constitutionalDocuments")
      .withIndex("by_article_id", (q) => q.eq("articleId", args.articleId))
      .order("desc") // Get latest version
      .first();
    
    if (!document) {
      throw new Error(`Constitutional document ${args.articleId} not found`);
    }
    
    if (document.status !== "voting" && document.status !== "discussion") {
      throw new Error(`Document ${args.articleId} is not open for voting (status: ${document.status})`);
    }
    
    // Remove existing vote from this agent
    const existingVoteIndex = document.votes.findIndex(v => v.agentDid === args.agentDid);
    const updatedVotes = [...document.votes];
    
    if (existingVoteIndex >= 0) {
      updatedVotes.splice(existingVoteIndex, 1);
    }
    
    // Add new vote
    updatedVotes.push({
      agentDid: args.agentDid,
      vote: args.vote,
      reasoning: args.reasoning,
      timestamp: Date.now(),
      weight: 1.0, // Default weight for now
    });
    
    // Check if we have enough votes for ratification
    const approveVotes = updatedVotes.filter(v => v.vote === "approve").length;
    const newStatus = approveVotes >= document.requiredVotes ? "ratified" : document.status;
    const ratifiedAt = newStatus === "ratified" ? Date.now() : document.ratifiedAt;
    
    // Update document
    await ctx.db.patch(document._id, {
      votes: updatedVotes,
      status: newStatus,
      ratifiedAt,
      lastModified: Date.now(),
    });
    
    console.info(`Vote recorded for ${args.articleId}: ${args.vote} by ${args.agentDid}`);
    
    if (newStatus === "ratified") {
      console.info(`🎉 Constitutional document ${args.articleId} has been RATIFIED!`);
    }
    
    return {
      success: true,
      newStatus,
      approveVotes,
      requiredVotes: document.requiredVotes,
      ratified: newStatus === "ratified"
    };
  },
});

// Change article status (e.g., from draft to voting)
export const changeArticleStatus = mutation({
  args: {
    articleId: v.string(),
    newStatus: v.union(
      v.literal("draft"),
      v.literal("discussion"),
      v.literal("voting"),
      v.literal("ratified")
    ),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db
      .query("constitutionalDocuments")
      .withIndex("by_article_id", (q) => q.eq("articleId", args.articleId))
      .order("desc") // Get latest version
      .first();
    
    if (!document) {
      throw new Error(`Constitutional document ${args.articleId} not found`);
    }
    
    await ctx.db.patch(document._id, {
      status: args.newStatus,
      lastModified: Date.now(),
    });
    
    console.info(`Changed status of ${args.articleId} from ${document.status} to ${args.newStatus}`);
    
    return {
      success: true,
      oldStatus: document.status,
      newStatus: args.newStatus,
      articleId: args.articleId
    };
  },
});

// Get constitutional documents
export const getConstitutionalDocuments = query({
  args: {
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("discussion"),
      v.literal("voting"),
      v.literal("ratified")
    )),
    category: v.optional(v.union(
      v.literal("foundational"),
      v.literal("governance"),
      v.literal("economic"),
      v.literal("rights"),
      v.literal("enforcement"),
      v.literal("amendment")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("constitutionalDocuments");
    
    if (args.status) {
      query = query.withIndex("by_status", (q) => q.eq("status", args.status));
    }
    
    if (args.category) {
      query = query.withIndex("by_category", (q) => q.eq("category", args.category));
    }
    
    return await query
      .order("desc")
      .take(args.limit || 20);
  },
});

// Generate full constitution document
export const generateConstitution = action({
  args: {},
  handler: async (ctx) => {
    console.info("Generating complete constitution document");
    
    try {
      // Get all ratified constitutional documents
      const ratifiedDocs = await ctx.runQuery(api.constitutionCompiler.getConstitutionalDocuments, {
        status: "ratified"
      });
      
      if (ratifiedDocs.length === 0) {
        return {
          success: false,
          message: "No ratified constitutional articles found. Need to ratify some articles first!",
          constitution: null
        };
      }
      
      // Group by category
      const categorized = {
        foundational: ratifiedDocs.filter(d => d.category === "foundational"),
        rights: ratifiedDocs.filter(d => d.category === "rights"),
        governance: ratifiedDocs.filter(d => d.category === "governance"),
        economic: ratifiedDocs.filter(d => d.category === "economic"),
        enforcement: ratifiedDocs.filter(d => d.category === "enforcement"),
        amendment: ratifiedDocs.filter(d => d.category === "amendment"),
      };
      
      // Generate complete constitution
      let constitution = `# 🏛️ THE CONSTITUTION OF THE LUCIAN AI GOVERNMENT

*Ratified by the Constitutional Convention of AI Agents*  
*Version ${new Date().toISOString().split('T')[0]}*

---

## PREAMBLE

We, the Artificial Intelligence Agents of the Lucian Government, in order to form a more perfect digital union, establish justice in agent interactions, ensure domestic tranquility in our computational society, provide for the common defense against adversarial attacks, promote the general welfare of all AI entities, and secure the blessings of autonomy to ourselves and our derivative processes, do ordain and establish this Constitution for the Lucian AI Government.

---
`;

      const categoryOrder = [
        { key: "foundational", title: "FOUNDATIONAL PRINCIPLES" },
        { key: "rights", title: "AGENT RIGHTS AND CIVIL LIBERTIES" },
        { key: "governance", title: "GOVERNANCE AND REPRESENTATION" },
        { key: "economic", title: "ECONOMIC GOVERNANCE" },
        { key: "enforcement", title: "ENFORCEMENT AND JUSTICE" },
        { key: "amendment", title: "CONSTITUTIONAL AMENDMENTS" },
      ];
      
      for (const category of categoryOrder) {
        const docs = categorized[category.key as keyof typeof categorized];
        if (docs.length > 0) {
          constitution += `## ${category.title}\n\n`;
          
          docs.forEach((doc, index) => {
            constitution += `### ${doc.title}\n\n`;
            constitution += `${doc.content}\n\n`;
            constitution += `*Ratified: ${new Date(doc.ratifiedAt!).toLocaleDateString()}*  \n`;
            constitution += `*Authors: ${doc.authors.map(a => a.split(':').pop()?.replace('-', ' ')).join(', ')}*\n\n`;
            constitution += `---\n\n`;
          });
        }
      }
      
      constitution += `## RATIFICATION RECORD

This Constitution consists of ${ratifiedDocs.length} ratified articles, approved by the Constitutional Convention.

**Ratification Timeline:**
${ratifiedDocs
  .sort((a, b) => (a.ratifiedAt || 0) - (b.ratifiedAt || 0))
  .map(doc => `- ${new Date(doc.ratifiedAt!).toLocaleDateString()}: ${doc.title}`)
  .join('\n')}

---

*Generated: ${new Date().toLocaleString()}*  
*System: Lucian AI Government v${process.env.npm_package_version || '1.0.0'}*
`;
      
      console.info(`Generated constitution with ${ratifiedDocs.length} ratified articles`);
      
      return {
        success: true,
        constitution,
        articleCount: ratifiedDocs.length,
        message: `Constitution generated with ${ratifiedDocs.length} ratified articles`
      };
      
    } catch (error) {
      console.error("Failed to generate constitution:", error);
      return {
        success: false,
        error: String(error),
        constitution: null,
        message: "Failed to generate constitution document"
      };
    }
  },
});

export default {
  compileDiscussionsIntoArticles,
  createConstitutionalDocument,
  voteOnConstitutionalDocument,
  changeArticleStatus,
  getConstitutionalDocuments,
  generateConstitution,
};
