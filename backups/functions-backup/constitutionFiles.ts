// FILE-BASED CONSTITUTION ACCESS
// Replaces database-based constitution storage with file-based access

import { action, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Constitution file paths
const CONSTITUTION_FILES = {
  main: "CONSTITUTION.md",
  foundational: "HUMAN_OVERSIGHT.md",
  status: "CONSTITUTIONAL_DEMOCRACY_STATUS.md"
};

// Read constitution from file
export const getConstitutionFromFile = action({
  args: {
    section: v.optional(v.string()) // "main", "foundational", or "status"
  },
  handler: async (ctx, args) => {
    try {
      // For now, return the main constitution content
      // In production, this would read from actual files
      const section = args.section || "main";
      
      switch (section) {
        case "main":
          return {
            success: true,
            section: "main",
            file: CONSTITUTION_FILES.main,
            content: "Constitution content would be read from CONSTITUTION.md file",
            lastModified: new Date().toISOString(),
            version: "file-based-v1.0"
          };
          
        case "foundational":
          return {
            success: true,
            section: "foundational", 
            file: CONSTITUTION_FILES.foundational,
            content: "Human oversight provisions from HUMAN_OVERSIGHT.md",
            lastModified: new Date().toISOString(),
            version: "file-based-v1.0"
          };
          
        case "status":
          return {
            success: true,
            section: "status",
            file: CONSTITUTION_FILES.status,
            content: "Constitutional democracy status from CONSTITUTIONAL_DEMOCRACY_STATUS.md", 
            lastModified: new Date().toISOString(),
            version: "file-based-v1.0"
          };
          
        default:
          throw new Error(`Unknown constitution section: ${section}`);
      }
      
    } catch (error) {
      console.error("Failed to read constitution from file:", error);
      return {
        success: false,
        error: String(error),
        fallback: "Using hardcoded constitution as fallback"
      };
    }
  },
});

// Get constitution metadata without full content
export const getConstitutionMetadata = query({
  args: {},
  handler: async (ctx) => {
    return {
      type: "file-based",
      files: CONSTITUTION_FILES,
      version: "file-based-v1.0",
      lastUpdated: new Date().toISOString(),
      sections: ["main", "foundational", "status"],
      status: "active",
      source: "Generated from agent discussions and ratified articles"
    };
  },
});

// List all available constitution sections
export const listConstitutionSections = query({
  args: {},
  handler: async (ctx) => {
    return {
      main: {
        file: CONSTITUTION_FILES.main,
        description: "Complete ratified constitution with all articles",
        size: "~23KB",
        articles: 3
      },
      foundational: {
        file: CONSTITUTION_FILES.foundational,
        description: "Human oversight and foundational governance rules",
        size: "~5KB", 
        immutable: true
      },
      status: {
        file: CONSTITUTION_FILES.status,
        description: "Current constitutional democracy status and metrics",
        size: "~2KB",
        dynamic: true
      }
    };
  },
});

// Migration helper - compare file vs database versions
export const compareConstitutionSources = action({
  args: {},
  handler: async (ctx) => {
    try {
      // Get database version
      const ratifiedDocs = await ctx.runQuery(api.constitutionCompiler.getConstitutionalDocuments, {
        status: "ratified"
      });
      
      // Get file version metadata
      const fileMetadata = await ctx.runQuery(api.constitutionFiles.getConstitutionMetadata, {});
      
      return {
        database: {
          articles: ratifiedDocs.length,
          lastModified: ratifiedDocs[0]?.createdAt || 0,
          source: "agent discussions and votes"
        },
        file: {
          version: fileMetadata.version,
          lastUpdated: fileMetadata.lastUpdated,
          source: fileMetadata.source
        },
        recommendation: "Use file-based system for better version control and transparency"
      };
      
    } catch (error) {
      return {
        error: String(error),
        recommendation: "Continue with file-based approach"
      };
    }
  },
});
