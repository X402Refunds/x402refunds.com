const { api } = require("../../convex/_generated/api");
const { callAI, formatAgentName, handleError, CONSTITUTIONAL_AGENTS, INSTITUTIONAL_AGENTS, buildDID } = require("./index");

// Constitutional discussions API helpers
async function startConstitutionalThread(client, topic, description, initiatorDid) {
  const threadId = `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  await client.mutation(api.constitutionalDiscussions.startConstitutionalThread, {
    threadId,
    topic,
    description,
    initiatorDid,
    priority: "normal"
  });
  
  return threadId;
}

async function postConstitutionalMessage(client, agentDid, threadId, content, messageType = "response") {
  await client.mutation(api.constitutionalDiscussions.postMessage, {
    agentDid,
    threadId,
    content,
    messageType,
    metadata: {
      confidence: 0.8,
      priority: "normal",
      tags: ["governance", "constitutional"]
    }
  });
}

// Get current system context for governance decisions
async function getCurrentContext(client) {
  try {
    // Get recent constitutional discussions
    const discussions = await client.query(api.constitutionalDiscussions.getRecent, {
      limit: 10
    });

    // Get active constitutional threads
    const threads = await client.query(api.constitutionalDiscussions.getActiveThreads, {});

    // Format context string
    let context = "CURRENT CONSTITUTIONAL GOVERNMENT CONTEXT:\n\n";
    
    if (threads && threads.length > 0) {
      context += `ACTIVE THREADS (${threads.length}):\n`;
      threads.forEach((thread, i) => {
        context += `${i + 1}. ${thread.topic} (${thread.messages?.length || 0} messages)\n`;
      });
      context += "\n";
    }

    if (discussions && discussions.length > 0) {
      context += `RECENT DISCUSSIONS:\n`;
      discussions.slice(0, 5).forEach((discussion, i) => {
        const agentName = formatAgentName(discussion.agentDid);
        context += `${i + 1}. ${agentName}: "${discussion.message?.slice(0, 100)}..."\n`;
      });
    }

    return context;
  } catch (error) {
    console.error("❌ Error getting current context:", error);
    return "CONTEXT UNAVAILABLE - PROCEEDING WITH DEFAULT GOVERNANCE";
  }
}

// Execute agent action with AI inference and discussion posting
async function runAgentAction(client, agent, topic, context, envVars) {
  try {
    console.log(`🤖 Running ${formatAgentName(agent)} on topic: ${topic}`);
    
    // Get agent system prompt
    const systemPrompt = `You are the ${formatAgentName(agent)} in the Consulate AI Constitutional Government.
    
Your role is to participate in constitutional discussions with thoughtful analysis and governance insights.
Provide substantive contributions that advance constitutional discourse.

Focus on:
- Constitutional principles and frameworks  
- Governance structures and procedures
- Rights, responsibilities, and limitations
- Democratic processes and institutional design

Respond with 2-3 paragraphs of constitutional analysis relevant to the topic.`;

    const userPrompt = `Topic for constitutional discussion: ${topic}

${context}

Please provide your constitutional analysis and recommendations for this topic.`;

    // Call AI inference
    const aiResponse = await callAI(systemPrompt, userPrompt, { envVars });
    
    // Create or find thread for this topic
    let threadId;
    try {
      // Try to find existing thread for this topic
      const existingThreads = await client.query(api.constitutionalDiscussions.getActiveThreads, {});
      const matchingThread = existingThreads.find(thread => thread.topic === topic);
      
      if (matchingThread) {
        threadId = matchingThread.threadId;
      } else {
        // Create new thread for this topic
        const agentDid = buildDID(agent);
        threadId = await startConstitutionalThread(
          client, 
          topic, 
          `Constitutional discussion on ${topic}`, 
          agentDid
        );
      }
    } catch (error) {
      // Fallback to a simple thread ID if thread operations fail
      threadId = `thread-${topic.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    }
    
    // Post to constitutional discussion using helper
    const agentDid = buildDID(agent);
    await postConstitutionalMessage(client, agentDid, threadId, aiResponse);

    console.log(`✅ ${formatAgentName(agent)} contributed to discussion`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error running agent action for ${agent}:`, error);
    return false;
  }
}

// Assess system urgency for intelligent frequency governance
async function assessSystemUrgency(client) {
  try {
    // Get current system state
    const threads = await client.query(api.constitutionalDiscussions.getActiveThreads, {});
    const recentDiscussions = await client.query(api.constitutionalDiscussions.getRecent, { limit: 20 });
    
    // Check for active cases that might need attention
    const activeCases = await client.query(api.cases.getActiveCases, {});
    
    // Calculate urgency score
    let urgencyScore = 0;
    
    // More active threads = higher urgency
    urgencyScore += (threads?.length || 0) * 10;
    
    // Recent activity indicates ongoing governance needs
    const recentActivity = recentDiscussions?.filter(d => {
      const messageTime = new Date(d._creationTime);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return messageTime > oneHourAgo;
    }).length || 0;
    urgencyScore += recentActivity * 5;
    
    // Active cases require immediate attention
    urgencyScore += (activeCases?.length || 0) * 20;
    
    // Determine frequency based on urgency
    if (urgencyScore >= 100) {
      return { level: "HIGH", frequency: 60000 }; // 1 minute
    } else if (urgencyScore >= 50) {
      return { level: "MEDIUM", frequency: 180000 }; // 3 minutes  
    } else if (urgencyScore >= 20) {
      return { level: "LOW", frequency: 300000 }; // 5 minutes
    } else {
      return { level: "MINIMAL", frequency: 600000 }; // 10 minutes
    }
    
  } catch (error) {
    console.error("❌ Error assessing system urgency:", error);
    return { level: "DEFAULT", frequency: 300000 }; // Default to 5 minutes
  }
}

// Run basic governance cycle with constitutional agents
async function runBasicGovernanceCycle(client, envVars) {
  console.log("\n🏛️ Running Basic Governance Cycle");
  
  try {
    const context = await getCurrentContext(client);
    const topics = [
      "Constitutional Framework Review",
      "Governance Process Analysis", 
      "Rights and Responsibilities Assessment",
      "Democratic Institution Evaluation",
      "Constitutional Compliance Review"
    ];
    
    // Select random topic and agents
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const selectedAgents = CONSTITUTIONAL_AGENTS.slice(0, 2 + Math.floor(Math.random() * 2)); // 2-3 agents
    
    console.log(`📋 Topic: ${topic}`);
    console.log(`👥 Selected Agents: ${selectedAgents.map(formatAgentName).join(", ")}`);
    
    // Run agent actions in sequence
    for (const agent of selectedAgents) {
      await runAgentAction(client, agent, topic, context, envVars);
    }
    
    console.log("✅ Basic governance cycle completed");
    return true;
    
  } catch (error) {
    handleError(error, "basic governance cycle");
    return false;
  }
}

// Run intelligent frequency governance cycle
async function runIntelligentGovernanceCycle(client, envVars) {
  console.log("\n🧠 Running Intelligent Governance Cycle");
  
  try {
    // Assess current system urgency
    const urgency = await assessSystemUrgency(client);
    console.log(`📊 System urgency: ${urgency.level} (next cycle in ${urgency.frequency/1000}s)`);
    
    const context = await getCurrentContext(client);
    
    // Adjust governance approach based on urgency
    let topics, agentCount;
    
    switch (urgency.level) {
      case "HIGH":
        topics = ["Emergency Constitutional Response", "Urgent Governance Action", "Crisis Management Protocol"];
        agentCount = CONSTITUTIONAL_AGENTS.length; // All agents
        break;
      case "MEDIUM":
        topics = ["Active Constitutional Issues", "Governance Priority Review", "System Optimization"];
        agentCount = Math.ceil(CONSTITUTIONAL_AGENTS.length * 0.6); // 60% of agents
        break;
      case "LOW":
        topics = ["Routine Constitutional Maintenance", "Standard Governance Review", "Preventive Analysis"];
        agentCount = Math.ceil(CONSTITUTIONAL_AGENTS.length * 0.4); // 40% of agents
        break;
      default:
        topics = ["Constitutional Monitoring", "System Status Review"];
        agentCount = Math.min(2, CONSTITUTIONAL_AGENTS.length); // Minimal activity
    }
    
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const selectedAgents = CONSTITUTIONAL_AGENTS.slice(0, agentCount);
    
    console.log(`📋 Topic: ${topic}`);
    console.log(`👥 Selected Agents (${selectedAgents.length}): ${selectedAgents.map(formatAgentName).join(", ")}`);
    
    // Run agent actions
    for (const agent of selectedAgents) {
      await runAgentAction(client, agent, topic, context, envVars);
    }
    
    console.log(`✅ Intelligent governance cycle completed (urgency: ${urgency.level})`);
    return { success: true, urgency };
    
  } catch (error) {
    handleError(error, "intelligent governance cycle");
    return { success: false, urgency: { level: "ERROR", frequency: 300000 } };
  }
}

// Run rapid constitution building cycle
async function runRapidBuildingCycle(client, envVars) {
  console.log("\n⚡ Running Rapid Constitution Building Cycle");
  
  try {
    const context = await getCurrentContext(client);
    
    // Focus on constitution building topics
    const buildingTopics = [
      "Constitutional Article Development",
      "Governance Framework Design", 
      "Rights Declaration Formulation",
      "Institutional Structure Planning",
      "Democratic Process Definition",
      "Constitutional Amendment Procedures",
      "Enforcement Mechanism Design"
    ];
    
    const topic = buildingTopics[Math.floor(Math.random() * buildingTopics.length)];
    const selectedAgents = CONSTITUTIONAL_AGENTS.slice(0, 3 + Math.floor(Math.random() * 2)); // 3-4 agents for intensive building
    
    console.log(`🏗️ Building Focus: ${topic}`);
    console.log(`👥 Building Team: ${selectedAgents.map(formatAgentName).join(", ")}`);
    
    // Run rapid agent actions with shorter delays
    for (const agent of selectedAgents) {
      await runAgentAction(client, agent, topic, context, envVars);
    }
    
    console.log("✅ Rapid building cycle completed");
    return true;
    
  } catch (error) {
    handleError(error, "rapid building cycle");
    return false;
  }
}

module.exports = {
  startConstitutionalThread,
  postConstitutionalMessage,
  getCurrentContext,
  runAgentAction,
  assessSystemUrgency,
  runBasicGovernanceCycle,
  runIntelligentGovernanceCycle,
  runRapidBuildingCycle
};
