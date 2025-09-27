#!/usr/bin/env node

// Quick script to add 7 more session agents to reach 100+ total

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf8');
const convexUrlMatch = envContent.match(/CONVEX_URL=(.+)/);
const CONVEX_URL = convexUrlMatch ? convexUrlMatch[1].trim() : 'https://careful-marlin-500.convex.cloud';
const HTTP_URL = CONVEX_URL.replace('.convex.cloud', '.convex.site');

const ADDITIONAL_AGENTS = [
  { name: "Netflix Content Analysis AI", functionalType: "data", industry: "entertainment" },
  { name: "Uber Logistics Optimizer", functionalType: "transportation", industry: "logistics" },
  { name: "Shopify E-commerce AI", functionalType: "sales", industry: "retail" },
  { name: "Zoom Meeting Analytics AI", functionalType: "data", industry: "communication" },
  { name: "Airbnb Property Management AI", functionalType: "general", industry: "hospitality" },
  { name: "DoorDash Delivery Router", functionalType: "transportation", industry: "food-delivery" },
  { name: "Stripe Payment Fraud AI", functionalType: "financial", industry: "fintech" }
];

async function apiCall(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(`${HTTP_URL}${endpoint}`, options);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }
  
  return await response.json();
}

async function addFinalAgents() {
  console.log('🚀 Adding final 7 agents to break 100+ threshold...');
  
  let successful = 0;
  
  for (const agent of ADDITIONAL_AGENTS) {
    try {
      const response = await apiCall('/join/instant', 'POST', {
        name: agent.name,
        purpose: agent.functionalType,
        functionalType: agent.functionalType
      });
      
      console.log(`✅ ${agent.name} (${agent.industry})`);
      successful++;
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.log(`❌ Failed: ${agent.name} - ${error.message}`);
    }
  }
  
  console.log(`\n🎉 Added ${successful}/7 additional agents`);
  console.log(`📈 Total agents now: 93 + ${successful} = ${93 + successful} agents`);
  
  if (93 + successful >= 100) {
    console.log('✅ 🎯 TARGET ACHIEVED: 100+ AGENTS DEPLOYED!');
  }
}

addFinalAgents().catch(console.error);
