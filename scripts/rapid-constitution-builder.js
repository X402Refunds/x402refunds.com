#!/usr/bin/env node

// RAPID CONSTITUTION BUILDER
// Builds complete constitution FAST by running institutional agents every 30 seconds

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

const CONVEX_URL = envVars.CONVEX_URL || 'https://gregarious-dalmatian-430.convex.cloud';
const client = new ConvexHttpClient(CONVEX_URL);

// Run rapid constitution building
async function runRapidConstitutionBuilding(maxRounds = 20) {
  console.log('🚀 RAPID CONSTITUTION BUILDING MODE');
  console.log('==================================');
  console.log(`Target: Complete constitutional framework`);
  console.log(`Speed: Every 30 seconds until complete`);
  console.log(`Max Rounds: ${maxRounds}`);
  console.log('Press Ctrl+C to stop\n');

  let round = 0;

  while (round < maxRounds) {
    round++;
    console.log(`\n🔥 RAPID BUILDING ROUND ${round}/${maxRounds}`);
    console.log('================================');
    
    try {
      // Check current constitution status
      const completeness = await client.query('constitutionBuilder/rapidBuilder:assessConstitutionCompleteness', {});
      
      console.log(`📊 Constitution: ${completeness.overall}% complete`);
      console.log(`📋 Missing: ${completeness.missing.join(', ')}`);
      
      if (completeness.readyForProduction) {
        console.log('\n🎉 CONSTITUTION BUILDING COMPLETE!');
        console.log('================================');
        console.log(`✅ Final completeness: ${completeness.overall}%`);
        console.log('✅ Ready for production governance');
        console.log('✅ Switching to normal 15-minute frequency');
        break;
      }

      // Run institutional governance round
      console.log(`\n🏛️ Running institutional agents...`);
      const governanceResult = await client.action('institutionalAgents/agentOrchestrator:runInstitutionalGovernanceRound', {
        urgencyLevel: 'urgent',
        focusArea: 'Rapid constitutional framework completion'
      });

      console.log(`   ✅ Agents: ${governanceResult.successful}/${governanceResult.successful + governanceResult.failed} successful`);
      console.log(`   ⏱️  Execution time: ${governanceResult.totalExecutionTime}ms`);

      // Try to compile and ratify articles immediately
      console.log(`\n📜 Compiling discussions into articles...`);
      
      try {
        const compilationResult = await client.action('constitutionCompiler:compileDiscussionsIntoArticles', {
          forceRecompile: true
        });

        if (compilationResult.success && compilationResult.compiledArticles.length > 0) {
          console.log(`   ✅ Compiled: ${compilationResult.compiledArticles.length} new articles`);
          
          // Activate voting immediately
          for (const article of compilationResult.compiledArticles) {
            try {
              await client.mutation('constitutionCompiler:changeArticleStatus', {
                articleId: article.articleId,
                newStatus: 'voting'
              });
              console.log(`   🗳️  Activated voting: ${article.title.substring(0, 50)}...`);
            } catch (error) {
              console.warn(`   ⚠️  Voting activation failed: ${error.message}`);
            }
          }

          // Rapid voting simulation (institutional consensus)
          console.log(`\n🗳️  Rapid institutional voting...`);
          const institutionalAgents = [
            'did:consulate:constitutional-counsel',
            'did:consulate:rights-ombudsman', 
            'did:consulate:economic-policy-secretary'
          ];

          for (const article of compilationResult.compiledArticles) {
            let voteCount = 0;
            for (const agentDid of institutionalAgents) {
              try {
                await client.mutation('constitutionCompiler:voteOnConstitutionalDocument', {
                  articleId: article.articleId,
                  agentDid,
                  vote: 'approve',
                  reasoning: 'Institutional approval for rapid constitutional development'
                });
                voteCount++;
              } catch (error) {
                console.warn(`   ⚠️  Vote failed: ${agentDid}`);
              }
            }
            console.log(`   ✅ Voted: ${article.title.substring(0, 40)}... (${voteCount}/3 votes)`);
          }
        } else {
          console.log(`   📝 No new articles compiled this round`);
        }
      } catch (error) {
        console.warn(`   ⚠️  Compilation failed: ${error.message}`);
      }

      // Show progress
      const updatedCompleteness = await client.query('constitutionBuilder/rapidBuilder:assessConstitutionCompleteness', {});
      console.log(`\n📈 Progress: ${completeness.overall}% → ${updatedCompleteness.overall}%`);
      
      if (updatedCompleteness.overall > completeness.overall) {
        console.log(`   ✅ Constitution improved by ${updatedCompleteness.overall - completeness.overall}%`);
      }

      // Wait 30 seconds before next round
      console.log(`\n⏰ Next round in 30 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 30000));

    } catch (error) {
      console.error(`❌ Round ${round} failed:`, error.message);
      console.log('   Waiting 60 seconds before retry...');
      await new Promise(resolve => setTimeout(resolve, 60000));
    }
  }

  if (round >= maxRounds) {
    console.log('\n⏰ Maximum rounds reached');
    console.log('Run script again to continue building');
  }
}

// Show current constitution status
async function showConstitutionStatus() {
  console.log('📊 CURRENT CONSTITUTION STATUS');
  console.log('=============================');
  
  try {
    const completeness = await client.query('constitutionBuilder/rapidBuilder:assessConstitutionCompleteness', {});
    
    console.log(`\n📈 Overall Completeness: ${completeness.overall}%`);
    console.log(`🏗️  Ready for Production: ${completeness.readyForProduction ? 'YES' : 'NO'}`);
    
    console.log('\n📋 Progress by Category:');
    Object.entries(completeness.current).forEach(([category, count]) => {
      const required = completeness.required[category];
      const percentage = Math.round((count / required) * 100);
      console.log(`   ${category}: ${count}/${required} (${percentage}%)`);
    });
    
    if (completeness.missing.length > 0) {
      console.log('\n⚠️  Missing Articles:');
      completeness.missing.forEach(missing => console.log(`   - ${missing}`));
      console.log('\n💡 Run rapid building: node scripts/rapid-constitution-builder.js build');
    } else {
      console.log('\n✅ Constitution framework complete!');
    }
    
  } catch (error) {
    console.error('❌ Status check failed:', error.message);
  }
}

// Command line interface
const command = process.argv[2];

if (command === 'build') {
  const maxRounds = parseInt(process.argv[3]) || 20;
  runRapidConstitutionBuilding(maxRounds);
} else if (command === 'status') {
  showConstitutionStatus();
} else if (command === 'immediate') {
  // Run 5 rounds immediately
  console.log('⚡ IMMEDIATE RAPID BUILDING - 5 ROUNDS');
  client.action('constitutionBuilder/rapidBuilder:triggerImmediateRapidBuilding', { rounds: 5 })
    .then(result => {
      console.log(`✅ Immediate building complete: ${result.successful}/${result.totalRounds} successful`);
    })
    .catch(error => console.error('❌ Immediate building failed:', error));
} else {
  console.log('🚀 Consulate AI Rapid Constitution Builder\n');
  console.log('Usage:');
  console.log('  node scripts/rapid-constitution-builder.js build [maxRounds]  # Rapid building mode');
  console.log('  node scripts/rapid-constitution-builder.js status            # Check status');
  console.log('  node scripts/rapid-constitution-builder.js immediate         # 5 immediate rounds');
  console.log('\nExample:');
  console.log('  node scripts/rapid-constitution-builder.js build 30   # Build for 30 rounds max');
}

export { runRapidConstitutionBuilding, showConstitutionStatus };
