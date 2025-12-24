#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = process.env.CONVEX_URL || "https://youthful-orca-358.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

// Case IDs from the screenshot (without the # prefix)
const caseIds = [
  "jd7ae4gn",
  "jd75fxd6", 
  "jd7ffnm4",
  "jd7308ef",
  "jd74y7dk",
  "jd76fqg2",
  "jd760vpb"
];

async function findSpecificCases() {
  console.log(`🔍 Looking for specific cases in: ${CONVEX_URL}\n`);
  
  try {
    for (const caseId of caseIds) {
      try {
        const caseData = await client.query("cases:getCasePublic", { caseId });
        console.log(`✅ Found case ${caseId}:`);
        console.log(`   Amount: ${caseData.amount} ${caseData.currency || 'USD'}`);
        console.log(`   Status: ${caseData.status}`);
        console.log(`   Filed: ${new Date(caseData.filedAt).toLocaleString()}`);
        console.log();
      } catch (error) {
        console.log(`❌ Case ${caseId} not found or error: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

findSpecificCases();
