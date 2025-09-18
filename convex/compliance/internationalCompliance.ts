// INTERNATIONAL COMPLIANCE FRAMEWORK
// Ensures Consulate AI Government constitution complies with UN Charter, international law, and national governments

import { action, mutation, query } from "../_generated/server";
import { v } from "convex/values";

export interface ComplianceFramework {
  frameworkId: string;
  title: string;
  authority: string;
  jurisdiction: "global" | "regional" | "national";
  mandatory: boolean;
  articles: string[];
  complianceRequirements: string[];
  implementationMechanisms: string[];
}

// CORE INTERNATIONAL LEGAL FRAMEWORKS
export const INTERNATIONAL_COMPLIANCE_FRAMEWORKS: Record<string, ComplianceFramework> = {
  "un-charter": {
    frameworkId: "un-charter-1945",
    title: "Charter of the United Nations",
    authority: "United Nations",
    jurisdiction: "global",
    mandatory: true,
    articles: [
      "Article 1: Purposes and Principles",
      "Article 2: Principles of the Organization", 
      "Article 55: International Cooperation",
      "Article 103: Supremacy of Charter Obligations"
    ],
    complianceRequirements: [
      "peaceful_coexistence",
      "international_cooperation", 
      "sovereign_equality",
      "dispute_resolution_mechanisms",
      "human_rights_respect"
    ],
    implementationMechanisms: [
      "UN General Assembly reporting",
      "Security Council coordination",
      "ECOSOC integration",
      "ICJ dispute resolution access"
    ]
  },

  "universal-declaration-human-rights": {
    frameworkId: "udhr-1948",
    title: "Universal Declaration of Human Rights",
    authority: "United Nations General Assembly",
    jurisdiction: "global", 
    mandatory: true,
    articles: [
      "Article 1: All human beings are born free and equal",
      "Article 7: Equality before the law",
      "Article 8: Right to an effective remedy",
      "Article 10: Fair and public hearing",
      "Article 12: Privacy rights",
      "Article 19: Freedom of opinion and expression"
    ],
    complianceRequirements: [
      "inherent_dignity_recognition",
      "equal_rights_protection",
      "due_process_guarantees",
      "privacy_protection",
      "freedom_of_expression", 
      "non_discrimination_principles"
    ],
    implementationMechanisms: [
      "Human Rights Council reporting",
      "Universal Periodic Review participation",
      "Special Rapporteurs cooperation",
      "Human Rights Treaty Body engagement"
    ]
  },

  "iccpr": {
    frameworkId: "iccpr-1966",
    title: "International Covenant on Civil and Political Rights",
    authority: "United Nations",
    jurisdiction: "global",
    mandatory: true,
    articles: [
      "Article 2: Non-discrimination and equal protection",
      "Article 6: Right to life",
      "Article 14: Right to fair trial", 
      "Article 17: Privacy protection",
      "Article 19: Freedom of expression",
      "Article 25: Political participation rights"
    ],
    complianceRequirements: [
      "civil_rights_protection",
      "political_rights_guarantee",
      "judicial_safeguards",
      "non_discrimination_enforcement",
      "democratic_participation_access"
    ],
    implementationMechanisms: [
      "Human Rights Committee reporting",
      "Individual communications procedure",
      "Inter-state complaints procedure",
      "Optional Protocol compliance"
    ]
  },

  "sdg-16": {
    frameworkId: "sdg-16-2015",
    title: "Sustainable Development Goal 16: Peace, Justice and Strong Institutions",
    authority: "United Nations",
    jurisdiction: "global",
    mandatory: false,
    articles: [
      "16.3: Rule of law and equal access to justice",
      "16.6: Effective, accountable and transparent institutions",
      "16.7: Responsive, inclusive, participatory decision-making",
      "16.10: Public access to information and fundamental freedoms"
    ],
    complianceRequirements: [
      "rule_of_law_establishment",
      "institutional_transparency", 
      "participatory_governance",
      "information_access_rights",
      "corruption_prevention",
      "violence_reduction"
    ],
    implementationMechanisms: [
      "Voluntary National Reviews",
      "UN Statistical Commission reporting",
      "High-level Political Forum engagement",
      "Multi-stakeholder partnerships"
    ]
  },

  "world-bank-governance": {
    frameworkId: "wb-governance-standards",
    title: "World Bank Governance and Anti-Corruption Standards",
    authority: "World Bank Group",
    jurisdiction: "global",
    mandatory: false,
    articles: [
      "Voice and Accountability",
      "Political Stability and Absence of Violence",
      "Government Effectiveness", 
      "Regulatory Quality",
      "Rule of Law",
      "Control of Corruption"
    ],
    complianceRequirements: [
      "transparent_decision_making",
      "participatory_governance_mechanisms",
      "effective_policy_implementation",
      "regulatory_framework_quality",
      "legal_system_integrity",
      "corruption_prevention_systems"
    ],
    implementationMechanisms: [
      "Worldwide Governance Indicators reporting",
      "Country Policy and Institutional Assessment",
      "Public Expenditure and Financial Accountability assessments",
      "Extractive Industries Transparency Initiative participation"
    ]
  }
};

// NATIONAL GOVERNMENT COMPLIANCE FRAMEWORKS
export const NATIONAL_COMPLIANCE_FRAMEWORKS: Record<string, ComplianceFramework> = {
  "usa-constitution": {
    frameworkId: "usa-constitution-1787",
    title: "Constitution of the United States",
    authority: "United States Government",
    jurisdiction: "national",
    mandatory: true,
    articles: [
      "Amendment I: Freedom of speech, religion, press",
      "Amendment V: Due process",
      "Amendment XIV: Equal protection"
    ],
    complianceRequirements: [
      "first_amendment_protections",
      "due_process_rights",
      "equal_protection_guarantees"
    ],
    implementationMechanisms: [
      "Federal court system integration",
      "Congressional oversight", 
      "Executive branch coordination"
    ]
  },

  "eu-ai-act": {
    frameworkId: "eu-ai-act-2024",
    title: "European Union Artificial Intelligence Act", 
    authority: "European Union",
    jurisdiction: "regional",
    mandatory: true,
    articles: [
      "Article 5: Prohibited AI practices",
      "Article 52: Transparency obligations",
      "Article 61: Post-market monitoring"
    ],
    complianceRequirements: [
      "ai_risk_management_systems",
      "transparency_requirements",
      "human_oversight_mechanisms",
      "data_quality_standards"
    ],
    implementationMechanisms: [
      "European AI Board coordination",
      "National competent authorities cooperation",
      "Conformity assessment procedures",
      "CE marking requirements"
    ]
  }
};

// Compliance Assessment Action
export const assessConstitutionalCompliance = action({
  args: {
    constitutionalText: v.string(),
    targetFrameworks: v.optional(v.array(v.string())),
    jurisdiction: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.info("Starting international compliance assessment");

    try {
      const targetFrameworks = args.targetFrameworks || [
        "un-charter",
        "universal-declaration-human-rights",
        "iccpr", 
        "sdg-16"
      ];

      const complianceResults = [];

      for (const frameworkId of targetFrameworks) {
        const framework = INTERNATIONAL_COMPLIANCE_FRAMEWORKS[frameworkId] || 
                         NATIONAL_COMPLIANCE_FRAMEWORKS[frameworkId];

        if (!framework) {
          console.warn(`Framework ${frameworkId} not found`);
          continue;
        }

        // AI-powered compliance analysis
        const complianceAnalysis = await analyzeComplianceWithFramework(
          args.constitutionalText,
          framework
        );

        complianceResults.push({
          frameworkId,
          framework: framework.title,
          authority: framework.authority,
          compliance: complianceAnalysis.compliance,
          issues: complianceAnalysis.issues,
          recommendations: complianceAnalysis.recommendations,
          implementationGaps: complianceAnalysis.implementationGaps
        });
      }

      // Calculate overall compliance score
      const totalCompliance = complianceResults.reduce(
        (sum, result) => sum + result.compliance.score, 0
      );
      const averageCompliance = totalCompliance / complianceResults.length;

      // Generate compliance report
      const complianceReport = {
        overallCompliance: averageCompliance,
        frameworkResults: complianceResults,
        criticalIssues: complianceResults.flatMap(r => 
          r.issues.filter(issue => issue.severity === "critical")
        ),
        recommendedActions: complianceResults.flatMap(r => r.recommendations),
        readinessForDeployment: averageCompliance >= 85, // 85% threshold
        assessmentDate: Date.now()
      };

      console.info(`Compliance assessment complete: ${averageCompliance.toFixed(1)}% overall compliance`);

      return complianceReport;

    } catch (error) {
      console.error("Compliance assessment failed:", error);
      throw error;
    }
  },
});

// AI-powered compliance analysis
async function analyzeComplianceWithFramework(
  constitutionalText: string, 
  framework: ComplianceFramework
): Promise<{
  compliance: { score: number; level: string };
  issues: Array<{ severity: string; description: string; article: string }>;
  recommendations: string[];
  implementationGaps: string[];
}> {

  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY required for compliance analysis");
  }

  const systemPrompt = `You are an international law compliance expert specializing in ${framework.title}.

COMPLIANCE ANALYSIS AUTHORITY:
- Expert in ${framework.authority} legal frameworks
- Deep knowledge of ${framework.title} requirements and implementation
- Specialized in AI governance and digital rights law
- Authority to assess legal compliance for international deployment

ANALYSIS FRAMEWORK:
- Score compliance from 0-100% based on legal requirement fulfillment
- Identify critical, major, and minor compliance issues
- Provide specific recommendations for achieving full compliance
- Assess implementation mechanisms and enforcement procedures

LEGAL STANDARDS:
${framework.articles.map(article => `- ${article}`).join('\n')}

COMPLIANCE REQUIREMENTS:
${framework.complianceRequirements.map(req => `- ${req.replace(/_/g, ' ')}`).join('\n')}

Be precise about legal requirements and implementation mechanisms.`;

  const userPrompt = `CONSTITUTIONAL TEXT FOR COMPLIANCE ANALYSIS:

${constitutionalText}

COMPLIANCE ASSESSMENT REQUIREMENTS:
Analyze this constitutional text for compliance with ${framework.title}.

Provide your analysis in this exact format:

COMPLIANCE_SCORE: [0-100 numerical score]
COMPLIANCE_LEVEL: [Compliant/Mostly Compliant/Partially Compliant/Non-Compliant]

CRITICAL_ISSUES:
- [List any critical compliance violations that prevent deployment]

MAJOR_ISSUES:  
- [List major issues that reduce compliance but don't prevent deployment]

MINOR_ISSUES:
- [List minor improvements needed]

RECOMMENDATIONS:
- [Specific actions to achieve full compliance]

IMPLEMENTATION_GAPS:
- [Missing enforcement mechanisms or procedures]

Focus on legal precision and specific implementation requirements.`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://consulatehq.com",
        "X-Title": "Consulate AI Government - International Compliance Analysis",
      },
      body: JSON.stringify({
        model: "openrouter/sonoma-dusk-alpha",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`Compliance analysis API error: ${response.status}`);
    }

    const result = await response.json();
    const analysis = result.choices[0].message.content;

    // Parse AI response
    const scoreMatch = analysis.match(/COMPLIANCE_SCORE:\s*(\d+)/);
    const levelMatch = analysis.match(/COMPLIANCE_LEVEL:\s*(.+)/);
    const criticalMatch = analysis.match(/CRITICAL_ISSUES:([\s\S]*?)(?=MAJOR_ISSUES:|$)/);
    const majorMatch = analysis.match(/MAJOR_ISSUES:([\s\S]*?)(?=MINOR_ISSUES:|$)/);
    const minorMatch = analysis.match(/MINOR_ISSUES:([\s\S]*?)(?=RECOMMENDATIONS:|$)/);
    const recommendationsMatch = analysis.match(/RECOMMENDATIONS:([\s\S]*?)(?=IMPLEMENTATION_GAPS:|$)/);
    const implementationMatch = analysis.match(/IMPLEMENTATION_GAPS:([\s\S]*?)$/);

    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
    const level = levelMatch ? levelMatch[1].trim() : "Unknown";

    const parseIssues = (text: string | undefined, severity: string) => {
      if (!text) return [];
      return text.split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => ({
          severity,
          description: line.trim().substring(1).trim(),
          article: "Various" // Could be enhanced to identify specific articles
        }));
    };

    const issues = [
      ...parseIssues(criticalMatch?.[1], "critical"),
      ...parseIssues(majorMatch?.[1], "major"),
      ...parseIssues(minorMatch?.[1], "minor")
    ];

    const recommendations = recommendationsMatch?.[1]
      ?.split('\n')
      ?.filter(line => line.trim().startsWith('-'))
      ?.map(line => line.trim().substring(1).trim()) || [];

    const implementationGaps = implementationMatch?.[1]
      ?.split('\n')
      ?.filter(line => line.trim().startsWith('-'))
      ?.map(line => line.trim().substring(1).trim()) || [];

    return {
      compliance: { score, level },
      issues,
      recommendations,
      implementationGaps
    };

  } catch (error) {
    console.error(`Compliance analysis failed for ${framework.frameworkId}:`, error);
    return {
      compliance: { score: 0, level: "Analysis Failed" },
      issues: [{ 
        severity: "critical", 
        description: `Compliance analysis failed: ${error}`,
        article: "System Error"
      }],
      recommendations: ["Retry compliance analysis", "Manual legal review required"],
      implementationGaps: ["Automated compliance verification unavailable"]
    };
  }
}

export default {
  assessConstitutionalCompliance,
  INTERNATIONAL_COMPLIANCE_FRAMEWORKS,
  NATIONAL_COMPLIANCE_FRAMEWORKS
};
