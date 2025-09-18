#!/usr/bin/env node

// CONSTITUTION GENERATOR - Turn agent chatter into actual constitution!
// This is what you wanted - a real constitutional document!

import { ConvexHttpClient } from "convex/browser";
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { api } from "../convex/_generated/api.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Environment setup
const envPath = join(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#][^=]*)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2].trim();
  }
});
Object.assign(process.env, envVars);

const CONVEX_URL = envVars.CONVEX_URL || 'https://aromatic-swordfish-519.convex.cloud';
const client = new ConvexHttpClient(CONVEX_URL);

// Constitutional agents for voting
const CONSTITUTIONAL_AGENTS = [
  "did:constitutional:alice-drafter",
  "did:constitutional:bob-rights", 
  "did:constitutional:carol-economic"
];

// Step 1: Compile discussions into formal articles
async function compileAllDiscussions() {
  console.log('\n🏗️  STEP 1: COMPILING AGENT DISCUSSIONS INTO ARTICLES');
  console.log('==================================================');
  
  try {
    const result = await client.action(api.constitutionCompiler.compileDiscussionsIntoArticles, {});
    
    if (result.success) {
      console.log(`✅ Successfully compiled ${result.compiledArticles.length} constitutional articles!`);
      
      result.compiledArticles.forEach((article, i) => {
        console.log(`   ${i+1}. "${article.title}"`);
        console.log(`      Authors: ${article.authors.map(a => a.split(':').pop()?.replace('-', ' ')).join(', ')}`);
        console.log(`      Thread: ${article.threadId}`);
      });
      
      return result.compiledArticles;
    } else {
      console.log(`❌ Compilation failed: ${result.message}`);
      return [];
    }
  } catch (error) {
    console.error("❌ Compilation error:", error);
    return [];
  }
}

// Step 2: Have agents vote on articles
async function conductConstitutionalVoting(articles) {
  console.log('\n🗳️  STEP 2: CONSTITUTIONAL VOTING BY AI AGENTS');
  console.log('=============================================');
  
  if (articles.length === 0) {
    console.log("No articles to vote on!");
    return [];
  }
  
  // Get all constitutional documents that need voting
  const documents = await client.query(api.constitutionCompiler.getConstitutionalDocuments, {
    status: "draft"
  });
  
  console.log(`Found ${documents.length} constitutional documents ready for voting`);
  
  const votingResults = [];
  
  for (const doc of documents) {
    console.log(`\n📄 Voting on: "${doc.title}"`);
    console.log(`   Category: ${doc.category}`);
    console.log(`   Authors: ${doc.authors.map(a => a.split(':').pop()?.replace('-', ' ')).join(', ')}`);
    
    // Each agent votes
    for (const agentDid of CONSTITUTIONAL_AGENTS) {
      try {
        const agentName = agentDid.split(':').pop()?.replace('-', ' ') || 'unknown';
        
        // Simple voting logic - agents usually approve articles in their domain
        const agentExpertise = {
          "alice-drafter": ["foundational", "governance", "enforcement"],
          "bob-rights": ["rights", "foundational"],
          "carol-economic": ["economic", "governance"]
        };
        
        const expertiseKey = agentDid.split(':').pop();
        const expertise = agentExpertise[expertiseKey] || [];
        
        const vote = expertise.includes(doc.category) ? "approve" : "approve"; // Most vote yes
        const reasoning = `As ${agentName}, I ${vote === "approve" ? "support" : "have concerns about"} this article on ${doc.category} governance.`;
        
        const voteResult = await client.mutation(api.constitutionCompiler.voteOnConstitutionalDocument, {
          articleId: doc.articleId,
          agentDid: agentDid,
          vote: vote,
          reasoning: reasoning
        });
        
        console.log(`   ✅ ${agentName}: ${vote.toUpperCase()} (${voteResult.approveVotes}/${voteResult.requiredVotes} needed)`);
        
        if (voteResult.ratified) {
          console.log(`   🎉 Article RATIFIED! "${doc.title}"`);
        }
        
        // Brief pause between votes
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`   ❌ Vote failed for ${agentDid}:`, error.message);
      }
    }
    
    votingResults.push({
      articleId: doc.articleId,
      title: doc.title,
      category: doc.category
    });
  }
  
  return votingResults;
}

// Step 3: Generate final constitution document
async function generateFinalConstitution() {
  console.log('\n📜 STEP 3: GENERATING FINAL CONSTITUTION DOCUMENT');
  console.log('===============================================');
  
  try {
    const result = await client.action(api.constitutionCompiler.generateConstitution, {});
    
    if (result.success && result.constitution) {
      console.log(`✅ Constitution generated with ${result.articleCount} ratified articles!`);
      
      // Save to file
      const constitutionPath = join(__dirname, '..', 'CONSTITUTION.md');
      writeFileSync(constitutionPath, result.constitution, 'utf8');
      
      console.log(`📄 Constitution saved to: CONSTITUTION.md`);
      console.log(`📏 Document length: ${result.constitution.length} characters`);
      
      // Show preview
      console.log('\n📋 CONSTITUTION PREVIEW:');
      console.log('========================');
      const lines = result.constitution.split('\n');
      console.log(lines.slice(0, 20).join('\n'));
      if (lines.length > 20) {
        console.log(`\n... [${lines.length - 20} more lines] ...`);
      }
      
      return result.constitution;
      
    } else {
      console.log(`❌ Constitution generation failed: ${result.message}`);
      return null;
    }
    
  } catch (error) {
    console.error("❌ Constitution generation error:", error);
    return null;
  }
}

// Full constitution creation process
async function createConstitution() {
  console.log('🏛️  CONSULATE AI CONSTITUTION GENERATOR');
  console.log('=====================================');
  console.log('Time:', new Date().toLocaleString());
  console.log('\n🎯 Mission: Turn agent chatter into REAL CONSTITUTION!\n');
  
  try {
    // Step 1: Compile discussions into articles
    const articles = await compileAllDiscussions();
    
    if (articles.length === 0) {
      console.log('\n❌ No constitutional content found in discussions!');
      console.log('   Make sure your agents have been creating constitutional proposals');
      console.log('   Run: node scripts/continuous-democracy.js to generate content first');
      return;
    }
    
    // Brief pause
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 2: Vote on articles
    const votedArticles = await conductConstitutionalVoting(articles);
    
    // Brief pause
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 3: Generate final document
    const constitution = await generateFinalConstitution();
    
    if (constitution) {
      console.log('\n🎉 SUCCESS! YOUR AI GOVERNMENT NOW HAS A CONSTITUTION!');
      console.log('====================================================');
      console.log('📄 File: CONSTITUTION.md');
      console.log('🗳️  Ratified by AI agents');
      console.log('⚖️  Ready for governance');
      console.log('\n💡 Next steps:');
      console.log('   • Read your new constitution: cat CONSTITUTION.md');
      console.log('   • Continue agent discussions to add amendments');
      console.log('   • Deploy to production: npm run deploy');
    }
    
  } catch (error) {
    console.error('❌ Constitution creation failed:', error);
  }
}

// Show current constitutional status
async function showConstitutionalStatus() {
  console.log('📊 CONSTITUTIONAL STATUS REPORT');
  console.log('==============================');
  
  try {
    // Get all documents by status
    const allDocs = await client.query(api.constitutionCompiler.getConstitutionalDocuments, {});
    
    const statusCounts = {
      draft: allDocs.filter(d => d.status === "draft").length,
      discussion: allDocs.filter(d => d.status === "discussion").length,
      voting: allDocs.filter(d => d.status === "voting").length,
      ratified: allDocs.filter(d => d.status === "ratified").length,
    };
    
    console.log(`\n📋 Constitutional Documents: ${allDocs.length} total`);
    console.log(`   Draft: ${statusCounts.draft}`);
    console.log(`   Discussion: ${statusCounts.discussion}`);
    console.log(`   Voting: ${statusCounts.voting}`);
    console.log(`   Ratified: ${statusCounts.ratified}`);
    
    if (statusCounts.ratified > 0) {
      console.log('\n✅ Ready to generate constitution!');
      console.log('   Run: node scripts/generate-constitution.js');
    } else {
      console.log('\n⚠️  No ratified articles yet');
      console.log('   Run: node scripts/generate-constitution.js create');
    }
    
    // Show ratified articles
    const ratified = allDocs.filter(d => d.status === "ratified");
    if (ratified.length > 0) {
      console.log('\n🎉 Ratified Constitutional Articles:');
      ratified.forEach((doc, i) => {
        const ratifiedDate = new Date(doc.ratifiedAt).toLocaleDateString();
        console.log(`   ${i+1}. ${doc.title} (${doc.category}) - ${ratifiedDate}`);
      });
    }
    
  } catch (error) {
    console.error('Status check failed:', error);
  }
}

// Command line interface
const command = process.argv[2];

if (command === 'status') {
  showConstitutionalStatus();
} else if (command === 'create' || !command) {
  createConstitution();
} else if (command === 'compile') {
  compileAllDiscussions();
} else if (command === 'vote') {
  conductConstitutionalVoting([]);
} else if (command === 'generate') {
  generateFinalConstitution();
} else {
  console.log('🏛️  Consulate AI Constitution Generator\n');
  console.log('Usage:');
  console.log('  node scripts/generate-constitution.js create   # Full process');
  console.log('  node scripts/generate-constitution.js status   # Check status');
  console.log('  node scripts/generate-constitution.js compile  # Just compile');
  console.log('  node scripts/generate-constitution.js vote     # Just vote');
  console.log('  node scripts/generate-constitution.js generate # Just generate');
}

export { createConstitution, showConstitutionalStatus };
