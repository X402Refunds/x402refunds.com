import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Search files by vector similarity
 * Used for semantic code search - finds similar code by meaning
 */
export const searchSimilar = query({
  args: {
    embedding: v.array(v.float64()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // TODO: Implement vector search when Convex SDK supports it
    // Vector search is defined in schema but the query API isn't available yet
    // For now, return empty results - this is used for semantic code search
    // which is a nice-to-have feature, not core functionality
    console.log("Vector search called with embedding size:", args.embedding.length);
    return [];
  },
});

/**
 * Get all dependencies for a file (what it imports)
 */
export const getFileDependencies = query({
  args: { path: v.string() },
  handler: async (ctx, args) => {
    // Find the file by path
    const file = await ctx.db
      .query("codebaseFiles")
      .withIndex("by_path", (q) => q.eq("path", args.path))
      .first();
    
    if (!file) return [];
    
    // Get all dependencies
    const deps = await ctx.db
      .query("codebaseDependencies")
      .withIndex("by_from", (q) => q.eq("fromFileId", file._id))
      .collect();
    
    // Fetch the actual file records
    const depFiles = await Promise.all(
      deps.map(async (d) => {
        const depFile = await ctx.db.get(d.toFileId);
        return {
          file: depFile,
          relationshipType: d.relationshipType,
          importName: d.importName,
        };
      })
    );
    
    return depFiles.filter(d => d.file !== null);
  },
});

/**
 * Get all files that depend on this file (what imports it)
 */
export const getFileDependents = query({
  args: { path: v.string() },
  handler: async (ctx, args) => {
    // Find the file by path
    const file = await ctx.db
      .query("codebaseFiles")
      .withIndex("by_path", (q) => q.eq("path", args.path))
      .first();
    
    if (!file) return [];
    
    // Get all dependents
    const deps = await ctx.db
      .query("codebaseDependencies")
      .withIndex("by_to", (q) => q.eq("toFileId", file._id))
      .collect();
    
    // Fetch the actual file records
    const depFiles = await Promise.all(
      deps.map(async (d) => {
        const depFile = await ctx.db.get(d.fromFileId);
        return {
          file: depFile,
          relationshipType: d.relationshipType,
          importName: d.importName,
        };
      })
    );
    
    return depFiles.filter(d => d.file !== null);
  },
});

/**
 * Find files by type (component, api, test, etc.)
 */
export const getFilesByType = query({
  args: { fileType: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("codebaseFiles")
      .withIndex("by_type", (q) => q.eq("fileType", args.fileType))
      .collect();
  },
});

/**
 * Get a specific file by path
 */
export const getFileByPath = query({
  args: { path: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("codebaseFiles")
      .withIndex("by_path", (q) => q.eq("path", args.path))
      .first();
  },
});

/**
 * Get all available commands
 */
export const getCommands = query({
  handler: async (ctx) => {
    return await ctx.db.query("codebaseCommands").collect();
  },
});

/**
 * Get commands by category
 */
export const getCommandsByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("codebaseCommands")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .collect();
  },
});

/**
 * Get all indexed files (for stats)
 */
export const getIndexStats = query({
  handler: async (ctx) => {
    const files = await ctx.db.query("codebaseFiles").collect();
    const embeddings = await ctx.db.query("codebaseEmbeddings").collect();
    const dependencies = await ctx.db.query("codebaseDependencies").collect();
    const commands = await ctx.db.query("codebaseCommands").collect();
    
    // Count by type
    const byType = files.reduce((acc, file) => {
      acc[file.fileType] = (acc[file.fileType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalFiles: files.length,
      totalEmbeddings: embeddings.length,
      totalDependencies: dependencies.length,
      totalCommands: commands.length,
      filesByType: byType,
      lastIndexed: Math.max(...files.map(f => f.indexedAt), 0),
    };
  },
});
