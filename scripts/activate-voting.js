#!/usr/bin/env node

// ACTIVATE VOTING - Move draft articles to voting status

import { ConvexHttpClient } from "convex/browser";
import { readFileSync } from 'fs';
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
    console.error("Failed to activate voting:", error);
    return [];
  }
}

activateVotingOnAllDrafts();

export { activateVotingOnAllDrafts };
