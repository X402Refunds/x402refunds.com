#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = process.env.CONVEX_URL || "https://youthful-orca-358.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

async function checkInReview() {
  console.log(`🔍 Checking IN_REVIEW cases in: ${CONVEX_URL}\n`);
  
  try {
    const inReviewCases = await client.query("cases:getCasesByStatus", { 
      status: "IN_REVIEW",
      limit: 200 
    });
    
    console.log(`📊 Total IN_REVIEW cases: ${inReviewCases.length}\n`);
    
    // Find cases with large amounts
    const largeCases = inReviewCases.filter(c => {
      if (!c.amount) return false;
      return c.amount > 100000; // Over 100k in any currency
    });
    
    console.log(`🚨 Cases with amount > 100,000:\n`);
    largeCases.forEach((c, i) => {
      console.log(`${i+1}. Case ${c._id}`);
      console.log(`   Amount: $${c.amount.toLocaleString()} ${c.currency || 'USD'}`);
      console.log(`   Status: ${c.status}`);
      console.log(`   Filed: ${new Date(c.filedAt).toLocaleString()}`);
      console.log(`   Plaintiff: ${c.plaintiff}`);
      console.log(`   Defendant: ${c.defendant}`);
      console.log();
    });
    
    if (largeCases.length === 0) {
      console.log("✅ No large amount cases found!");
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkInReview();
