#!/usr/bin/env node

// Creates bilateral agreements between companies instead of universal constitution
// Much simpler for VCs to understand: "Company A + Company B = Agreement Rules"

const BILATERAL_AGREEMENTS = [
  {
    companies: ["Goldman Sachs", "JPMorgan Chase"],
    sector: "Financial Trading",
    agreementType: "High-Frequency Trading Protocol",
    rules: [
      "Maximum latency: 12ms for risk assessment queries",
      "SLA violation penalty: $1000 per millisecond over limit", 
      "Evidence required: Performance logs, timestamps, financial impact",
      "Resolution timeframe: 4 hours maximum"
    ],
    activeDisputes: [
      {
        case: "GS-HFT-001",
        issue: "15ms latency caused $47K loss to JPM risk system",
        status: "RESOLVED - Goldman pays $47K + $3K penalty",
        resolutionTime: "4.2 hours"
      }
    ]
  },
  
  {
    companies: ["Google", "Microsoft"],  
    sector: "Technology/IP",
    agreementType: "Code Analysis & IP Protection",
    rules: [
      "No proprietary algorithm analysis without consent",
      "IP violation penalty: $50K + licensing fees",
      "Evidence required: Code similarity reports, patent documentation", 
      "Resolution timeframe: 8 hours maximum"
    ],
    activeDisputes: [
      {
        case: "GOOG-MSFT-043",
        issue: "Code review agent detected proprietary algorithm usage",
        status: "PENDING - Evidence review in progress", 
        resolutionTime: "2.1 hours elapsed"
      }
    ]
  },

  {
    companies: ["Mayo Clinic", "Johns Hopkins"],
    sector: "Healthcare/Research", 
    agreementType: "Medical Data Sharing Protocol",
    rules: [
      "Patient data access requires dual authorization",
      "Research database conflicts resolved via priority scoring",
      "Violation penalty: $25K + data usage suspension",
      "Resolution timeframe: 6 hours maximum (patient care priority)"
    ],
    activeDisputes: [
      {
        case: "MAYO-JH-018",
        issue: "Simultaneous access to research database causing delays",
        status: "RESOLVED - Priority given to Mayo (patient care), JH compensated $5K",
        resolutionTime: "3.8 hours"
      }
    ]
  },
  
  {
    companies: ["Uber", "Lyft"],
    sector: "Transportation/Logistics",
    agreementType: "Dynamic Pricing Coordination", 
    rules: [
      "Surge pricing conflicts resolved via geographic splitting",
      "Market manipulation prohibition with $100K penalties",
      "Evidence required: Pricing logs, demand data, geographic boundaries",
      "Resolution timeframe: 2 hours maximum (real-time markets)"
    ],
    activeDisputes: [
      {
        case: "UBER-LYFT-127", 
        issue: "Conflicting surge pricing in downtown SF causing driver confusion",
        status: "RESOLVED - Geographic boundaries established, shared driver pool",
        resolutionTime: "1.7 hours"
      }
    ]
  }
];

function generateBilateralDemo() {
  console.log('🤝 BILATERAL AGREEMENT DEMO');
  console.log('============================');
  console.log('💡 Much simpler than universal constitution: Company A + Company B = Specific Rules\n');
  
  for (const agreement of BILATERAL_AGREEMENTS) {
    console.log(`📋 ${agreement.agreementType}`);
    console.log(`   Companies: ${agreement.companies[0]} ↔ ${agreement.companies[1]}`);
    console.log(`   Sector: ${agreement.sector}`);
    
    console.log(`   Rules:`);
    agreement.rules.forEach(rule => console.log(`     • ${rule}`));
    
    console.log(`   Active Cases:`);
    agreement.activeDisputes.forEach(dispute => {
      console.log(`     📁 ${dispute.case}: ${dispute.issue}`);
      console.log(`        Status: ${dispute.status}`);
      console.log(`        Time: ${dispute.resolutionTime}`);
    });
    console.log('');
  }
  
  console.log('\n🎯 VC-FRIENDLY TALKING POINTS:');
  console.log('===============================');
  console.log('💬 "Simple bilateral agreements between companies"');
  console.log('💬 "Each pair of companies sets their own rules"'); 
  console.log('💬 "When their AI agents dispute, our platform resolves it"');
  console.log('💬 "No complex universal constitution - just business agreements"');
  
  console.log('\n📈 SCALE NARRATIVE:');
  console.log('===================');
  console.log('• Current: 4 bilateral agreements (8 companies)');
  console.log('• Scale: 1000 companies = 499,500 potential bilateral agreements');
  console.log('• Network effects: More companies = more relationships = more disputes');
  console.log('• Revenue: $100/agent/month + $3K per dispute resolution');
  
  console.log('\n🏆 WHY THIS IS MONKEY-SIMPLE:');
  console.log('=============================');
  console.log('✅ Every business understands bilateral agreements');
  console.log('✅ Clear dispute resolution with obvious value ($47K saved)'); 
  console.log('✅ Network effects story is intuitive');
  console.log('✅ No confusing "universal AI constitution" complexity');
  console.log('✅ Just: "AI agents dispute, we resolve, everyone saves money"');
}

generateBilateralDemo();
