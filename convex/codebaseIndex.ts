import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Upsert a file (insert or update if exists)
 */
export const upsertFile = mutation({
  args: {
    path: v.string(),
    name: v.string(),
    content: v.string(),
    fileType: v.string(),
    sizeBytes: v.number(),
    exports: v.array(v.string()),
    purpose: v.string(),
    lastModified: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      // Check if file already exists
      const existing = await ctx.db
        .query("codebaseFiles")
        .withIndex("by_path", (q) => q.eq("path", args.path))
        .first();
      
      if (existing) {
        // Update existing file
        await ctx.db.patch(existing._id, {
          ...args,
          indexedAt: Date.now(),
        });
        console.log(`Updated file: ${args.path}`);
        return existing._id;
      }
      
      // Insert new file
      const fileId = await ctx.db.insert("codebaseFiles", {
        ...args,
        indexedAt: Date.now(),
      });
      console.log(`Inserted new file: ${args.path}`);
      return fileId;
    } catch (error) {
      console.error(`Failed to upsert file ${args.path}:`, error);
      throw error;
    }
  },
});

/**
 * Insert an embedding chunk
 */
export const insertEmbedding = mutation({
  args: {
    fileId: v.id("codebaseFiles"),
    chunkIndex: v.number(),
    chunkContent: v.string(),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    try {
      return await ctx.db.insert("codebaseEmbeddings", args);
    } catch (error) {
      console.error(`Failed to insert embedding for file ${args.fileId}:`, error);
      throw error;
    }
  },
});

/**
 * Delete all embeddings for a file (used before re-indexing)
 */
export const deleteFileEmbeddings = mutation({
  args: { fileId: v.id("codebaseFiles") },
  handler: async (ctx, args) => {
    try {
      const embeddings = await ctx.db
        .query("codebaseEmbeddings")
        .withIndex("by_file", (q) => q.eq("fileId", args.fileId))
        .collect();
      
      for (const emb of embeddings) {
        await ctx.db.delete(emb._id);
      }
      
      console.log(`Deleted ${embeddings.length} embeddings for file ${args.fileId}`);
      return embeddings.length;
    } catch (error) {
      console.error(`Failed to delete embeddings for file ${args.fileId}:`, error);
      throw error;
    }
  },
});

/**
 * Insert a dependency relationship
 */
export const insertDependency = mutation({
  args: {
    fromFileId: v.id("codebaseFiles"),
    toFileId: v.id("codebaseFiles"),
    relationshipType: v.string(),
    importName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      return await ctx.db.insert("codebaseDependencies", args);
    } catch (error) {
      console.error(`Failed to insert dependency:`, error);
      throw error;
    }
  },
});

/**
 * Upsert a command
 */
export const upsertCommand = mutation({
  args: {
    command: v.string(),
    script: v.string(),
    package: v.string(),
    purpose: v.string(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // For commands, we'll just insert (they're updated rarely)
      return await ctx.db.insert("codebaseCommands", args);
    } catch (error) {
      console.error(`Failed to upsert command ${args.command}:`, error);
      throw error;
    }
  },
});

/**
 * Delete all embeddings and dependencies for a file (cleanup before re-index)
 */
export const deleteFileData = mutation({
  args: { path: v.string() },
  handler: async (ctx, args) => {
    try {
      // Find the file
      const file = await ctx.db
        .query("codebaseFiles")
        .withIndex("by_path", (q) => q.eq("path", args.path))
        .first();
      
      if (!file) {
        console.log(`File not found: ${args.path}`);
        return { deleted: 0 };
      }
      
      // Delete embeddings
      const embeddings = await ctx.db
        .query("codebaseEmbeddings")
        .withIndex("by_file", (q) => q.eq("fileId", file._id))
        .collect();
      
      for (const emb of embeddings) {
        await ctx.db.delete(emb._id);
      }
      
      // Delete dependencies (both from and to)
      const depsFrom = await ctx.db
        .query("codebaseDependencies")
        .withIndex("by_from", (q) => q.eq("fromFileId", file._id))
        .collect();
      
      const depsTo = await ctx.db
        .query("codebaseDependencies")
        .withIndex("by_to", (q) => q.eq("toFileId", file._id))
        .collect();
      
      for (const dep of [...depsFrom, ...depsTo]) {
        await ctx.db.delete(dep._id);
      }
      
      console.log(`Cleaned up ${embeddings.length} embeddings and ${depsFrom.length + depsTo.length} dependencies for ${args.path}`);
      
      return {
        deleted: embeddings.length + depsFrom.length + depsTo.length,
      };
    } catch (error) {
      console.error(`Failed to delete file data for ${args.path}:`, error);
      throw error;
    }
  },
});

/**
 * Clear all commands (used before re-indexing commands)
 */
export const clearCommands = mutation({
  handler: async (ctx) => {
    try {
      const commands = await ctx.db.query("codebaseCommands").collect();
      for (const cmd of commands) {
        await ctx.db.delete(cmd._id);
      }
      console.log(`Cleared ${commands.length} commands`);
      return commands.length;
    } catch (error) {
      console.error('Failed to clear commands:', error);
      throw error;
    }
  },
});
