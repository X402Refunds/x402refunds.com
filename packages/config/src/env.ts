import { z } from "zod";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// Environment variable schema
const envSchema = z.object({
  // Convex Configuration
  CONVEX_URL: z.string().url("CONVEX_URL must be a valid URL"),
  NEXT_PUBLIC_CONVEX_URL: z.string().url().optional(),
  
  // AI API Keys
  OPENROUTER_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(), 
  OPENAI_API_KEY: z.string().optional(),
  
  // Environment settings
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  
  // Optional ports and URLs
  PORT: z.string().regex(/^\d+$/).optional(),
  DASHBOARD_PORT: z.string().regex(/^\d+$/).optional(),
});

export type Environment = z.infer<typeof envSchema>;

// Parse environment variables from .env.local file
function parseEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) {
    return {};
  }

  const envContent = readFileSync(filePath, "utf8");
  const fileVars: Record<string, string> = {};
  
  envContent.split("\n").forEach(line => {
    line = line.trim();
    if (line && !line.startsWith("#")) {
      const [key, ...valueParts] = line.split("=");
      if (key && valueParts.length > 0) {
        fileVars[key] = valueParts.join("=").replace(/^["']|["']$/g, "");
      }
    }
  });
  
  return fileVars;
}

// Load and validate environment variables
export function loadEnvironment(options: { requireOpenRouter?: boolean } = {}): Environment {
  // Start with process.env
  let envVars = { ...process.env };
  
  // Load .env.local if present
  const envPath = join(process.cwd(), ".env.local");
  const fileVars = parseEnvFile(envPath);
  
  // Merge (file variables take precedence)
  envVars = { ...envVars, ...fileVars };
  
  // Set defaults for NEXT_PUBLIC_CONVEX_URL if not provided
  if (!envVars.NEXT_PUBLIC_CONVEX_URL && envVars.CONVEX_URL) {
    envVars.NEXT_PUBLIC_CONVEX_URL = envVars.CONVEX_URL;
  }
  
  // Parse and validate
  const result = envSchema.safeParse(envVars);
  
  if (!result.success) {
    console.error("❌ Environment validation failed:");
    result.error.issues.forEach(issue => {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  }
  
  // Additional validation for OpenRouter when required
  if (options.requireOpenRouter && !result.data.OPENROUTER_API_KEY) {
    console.error("❌ OPENROUTER_API_KEY required for AI operations but not found in environment or .env.local");
    process.exit(1);
  }
  
  return result.data;
}

// Singleton instance
let environmentInstance: Environment | null = null;

// Get environment (cached)
export function getEnvironment(options: { requireOpenRouter?: boolean } = {}): Environment {
  if (!environmentInstance) {
    environmentInstance = loadEnvironment(options);
  }
  return environmentInstance;
}

// Export for backwards compatibility with existing scripts
export { getEnvironment as parseEnvironment };
