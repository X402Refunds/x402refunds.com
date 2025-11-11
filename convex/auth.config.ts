import { AuthConfig } from "convex/server";

// Hardcoded for preview (production uses env var set in Convex dashboard)
export default {
  providers: [
    {
      domain: "https://national-treefrog-88.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;

