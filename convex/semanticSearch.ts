import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

type SemanticSearchResult = {
  file: any;
  chunk: string;
  chunkIndex: number;
  score: number;
};

/**
 * Semantic search - takes natural language query, generates embedding, searches
 * This is an action because it needs to call external OpenAI API
 */
export const searchByQuery = action({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<SemanticSearchResult[]> => {
    try {
      // Check for OpenAI API key
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable not set');
      }
      
      console.log(`Generating embedding for query: "${args.query}"`);
      
      // Generate embedding for the query
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          input: args.query,
          model: 'text-embedding-ada-002',
        }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
      }
      
      const data = await response.json();
      const embedding = data.data[0].embedding;
      
      console.log(`Generated embedding with ${embedding.length} dimensions`);
      
      // Search using the embedding
      const results: SemanticSearchResult[] = await ctx.runQuery(api.codebaseSearch.searchSimilar, {
        embedding,
        limit: args.limit ?? 10,
      });
      
      console.log(`Found ${results.length} similar files`);
      
      return results;
    } catch (error) {
      console.error('Semantic search failed:', error);
      throw new Error(`Semantic search failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

/**
 * Find similar files to a given file path
 */
export const findSimilarFiles = action({
  args: {
    path: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<SemanticSearchResult[]> => {
    try {
      // Get the file
      const file: { content: string } | null = await ctx.runQuery(api.codebaseSearch.getFileByPath, {
        path: args.path,
      });
      
      if (!file) {
        throw new Error(`File not found: ${args.path}`);
      }
      
      // Use the file content as the query
      return await ctx.runAction(api.semanticSearch.searchByQuery, {
        query: file.content.slice(0, 2000), // Use first 2000 chars
        limit: args.limit,
      });
    } catch (error) {
      console.error('Find similar files failed:', error);
      throw new Error(`Find similar files failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});
