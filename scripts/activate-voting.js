#!/usr/bin/env node

// ACTIVATE VOTING - Move draft articles to voting status

const { parseEnvironment, createConvexClient, handleError } = require("./lib/index.js");
const { api } = require("../convex/_generated/api");

// Initialize environment and client using shared utilities
const envVars = parseEnvironment();
const client = createConvexClient(envVars);

async function activateVotingOnAllDrafts() {
  console.log('🗳️  ACTIVATING VOTING ON DRAFT CONSTITUTIONAL ARTICLES');
  console.log('==================================================');
  
  try {
    // Get all draft articles
    const draftArticles = await client.query(api.constitutionCompiler.getConstitutionalDocuments, {
      status: "draft"
    });
    
    console.log(`Found ${draftArticles.length} draft articles to activate for voting\n`);
    
    const results = [];
    
    for (const article of draftArticles) {
      try {
        console.log(`📄 Activating: "${article.title}"`);
        console.log(`   Article ID: ${article.articleId}`);
        console.log(`   Category: ${article.category}`);
        
        // Change status to voting
        const result = await client.mutation(api.constitutionCompiler.changeArticleStatus, {
          articleId: article.articleId,
          newStatus: "voting"
        });
        
        console.log(`   ✅ Status changed: ${result.oldStatus} → ${result.newStatus}`);
        
        results.push({
          articleId: article.articleId,
          title: article.title,
          success: true
        });
        
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
        results.push({
          articleId: article.articleId,
          title: article.title,
          success: false,
          error: error.message
        });
      }
    }
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`\n📊 VOTING ACTIVATION COMPLETE:`);
    console.log(`   ✅ Successfully activated: ${successful}`);
    console.log(`   ❌ Failed: ${failed}`);
    
    if (successful > 0) {
      console.log(`\n🎉 ${successful} constitutional articles are now ready for voting!`);
      console.log('   Run: node scripts/generate-constitution.js create');
    }
    
    return results;
    
  } catch (error) {
    handleError(error, "voting activation");
    return [];
  }
}

// Run if called directly
if (require.main === module) {
  activateVotingOnAllDrafts().catch(error => {
    handleError(error, "activate-voting.js startup");
  });
}

module.exports = { activateVotingOnAllDrafts };
