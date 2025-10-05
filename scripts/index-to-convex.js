#!/usr/bin/env node

/**
 * Convex Codebase Indexer
 * 
 * Generates embeddings for codebase files and uploads to Convex
 * for semantic RAG queries. Supports incremental updates.
 * 
 * Environment variables required:
 * - CONVEX_URL (from .env.local)
 * - OPENAI_API_KEY or ANTHROPIC_API_KEY
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = process.cwd();

// Configuration
const CONVEX_URL = process.env.CONVEX_URL;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const EMBEDDING_PROVIDER = process.env.EMBEDDING_PROVIDER || 'openrouter'; // 'openrouter', 'openai', 'anthropic'

const MAX_FILE_SIZE = 100000; // 100KB max per file for embedding
const CHUNK_SIZE = 2000; // Characters per chunk for large files

/**
 * Check environment variables
 */
function checkEnvironment() {
  const missing = [];
  
  if (!CONVEX_URL) missing.push('CONVEX_URL');
  
  // Check for at least one embedding provider
  if (!OPENAI_API_KEY && !ANTHROPIC_API_KEY && !OPENROUTER_API_KEY) {
    console.error('❌ Missing embedding provider API key!');
    console.error('\nYou need ONE of:');
    console.error('  • OPENROUTER_API_KEY (recommended - supports multiple models)');
    console.error('  • OPENAI_API_KEY (OpenAI direct)');
    console.error('  • ANTHROPIC_API_KEY (Anthropic direct)');
    console.error('\nSet in .env.local or as environment variables.');
    console.error('\n💡 Get OpenRouter key: https://openrouter.ai/keys');
    process.exit(1);
  }
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    console.error('\nSet these in .env.local or as environment variables.');
    process.exit(1);
  }
  
  // Determine which provider to use
  let provider = 'none';
  if (OPENROUTER_API_KEY) provider = 'OpenRouter';
  else if (OPENAI_API_KEY) provider = 'OpenAI';
  else if (ANTHROPIC_API_KEY) provider = 'Anthropic';
  
  console.log(`✅ Using ${provider} for embeddings`);
}

/**
 * Generate embeddings using OpenRouter (supports multiple providers)
 */
async function generateEmbeddingOpenRouter(text) {
  const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://github.com/consulate-ai/platform',
      'X-Title': 'Consulate Codebase Indexer'
    },
    body: JSON.stringify({
      input: text,
      model: 'openai/text-embedding-ada-002' // Can also use other models
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Generate embeddings using OpenAI directly
 */
async function generateEmbeddingOpenAI(text) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-ada-002'
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Generate embedding using appropriate provider
 */
async function generateEmbedding(text) {
  // Prefer OpenRouter (most flexible)
  if (OPENROUTER_API_KEY) {
    return await generateEmbeddingOpenRouter(text);
  }
  
  // Fall back to OpenAI
  if (OPENAI_API_KEY) {
    return await generateEmbeddingOpenAI(text);
  }
  
  // Note: Anthropic doesn't provide embeddings API yet
  // If they add it, we can support it here
  if (ANTHROPIC_API_KEY) {
    throw new Error('Anthropic does not yet provide embeddings API. Use OpenRouter or OpenAI.');
  }
  
  throw new Error('No embedding provider available');
}

/**
 * Get changed files using git diff
 */
async function getChangedFiles() {
  try {
    const { execSync } = await import('child_process');
    const output = execSync('git diff --name-only HEAD~1 2>/dev/null || echo ""', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    return output.trim().split('\n').filter(f => f.length > 0);
  } catch (error) {
    // If git diff fails, return empty (will do full scan)
    return [];
  }
}

/**
 * Scan directory for files to index
 */
function scanCodebase(fullScan = false, changedFiles = []) {
  const files = [];
  
  const scanDir = (dirPath) => {
    try {
      if (!fs.existsSync(dirPath)) return;
      
      const items = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const item of items) {
        // Skip patterns
        if (item.name.startsWith('.') || 
            item.name === 'node_modules' || 
            item.name === 'dist' ||
            item.name === '_generated') {
          continue;
        }
        
        const fullPath = path.join(dirPath, item.name);
        const relativePath = path.relative(ROOT_DIR, fullPath);
        
        if (item.isDirectory()) {
          scanDir(fullPath);
        } else if (item.isFile()) {
          // Only index source code files
          const ext = path.extname(item.name);
          if (['.ts', '.tsx', '.js', '.jsx', '.md'].includes(ext)) {
            // If incremental, only include changed files
            if (!fullScan && changedFiles.length > 0) {
              if (changedFiles.includes(relativePath)) {
                files.push({ path: relativePath, fullPath });
              }
            } else {
              files.push({ path: relativePath, fullPath });
            }
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  };
  
  scanDir(ROOT_DIR);
  return files;
}

/**
 * Extract file metadata
 */
function extractMetadata(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const stats = fs.statSync(filePath);
    const ext = path.extname(filePath);
    
    // Determine file type
    let fileType = 'other';
    if (filePath.includes('/components/')) fileType = 'component';
    else if (filePath.startsWith('convex/')) fileType = 'api';
    else if (filePath.includes('.test.')) fileType = 'test';
    else if (filePath.endsWith('package.json') || filePath.endsWith('tsconfig.json')) fileType = 'config';
    else if (ext === '.md') fileType = 'doc';
    
    // Extract exports (simple regex)
    const exports = [];
    const exportMatches = content.matchAll(/export\s+(?:const|function|class)\s+(\w+)/g);
    for (const match of exportMatches) {
      exports.push(match[1]);
    }
    
    // Generate purpose from content (first comment or first line)
    const purposeMatch = content.match(/\/\*\*?\s*\n?\s*\*?\s*(.+?)[\n\*]/);
    const purpose = purposeMatch ? purposeMatch[1].trim() : `${fileType} file`;
    
    return {
      content: content.slice(0, MAX_FILE_SIZE), // Limit content size
      sizeBytes: stats.size,
      fileType,
      exports,
      purpose,
      lastModified: Math.floor(stats.mtimeMs),
    };
  } catch (error) {
    console.error(`Failed to read ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Chunk large content for embedding
 */
function chunkContent(content) {
  const chunks = [];
  for (let i = 0; i < content.length; i += CHUNK_SIZE) {
    chunks.push(content.slice(i, i + CHUNK_SIZE));
  }
  return chunks;
}

/**
 * Index files to Convex
 */
async function indexToConvex(files, client) {
  console.log(`\n📊 Indexing ${files.length} files to Convex...\n`);
  
  let indexed = 0;
  let errors = 0;
  
  for (const file of files) {
    try {
      console.log(`Processing: ${file.path}`);
      
      const metadata = extractMetadata(file.fullPath);
      if (!metadata) {
        errors++;
        continue;
      }
      
      // Upsert file record
      const fileId = await client.mutation(api.codebaseIndex.upsertFile, {
        path: file.path,
        name: path.basename(file.path),
        content: metadata.content,
        fileType: metadata.fileType,
        sizeBytes: metadata.sizeBytes,
        exports: metadata.exports,
        purpose: metadata.purpose,
        lastModified: metadata.lastModified,
      });
      
      // Delete old embeddings for this file
      await client.mutation(api.codebaseIndex.deleteFileEmbeddings, {
        fileId,
      });
      
      // Generate embeddings for content chunks
      const chunks = chunkContent(metadata.content);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        if (chunk.trim().length < 50) continue; // Skip tiny chunks
        
        try {
          // Generate embedding using configured provider
          const embedding = await generateEmbedding(chunk);
          
          // Insert new embedding
          await client.mutation(api.codebaseIndex.insertEmbedding, {
            fileId,
            chunkIndex: i,
            chunkContent: chunk,
            embedding,
          });
        } catch (embError) {
          console.error(`  ⚠️  Failed to generate/insert embedding:`, embError.message);
        }
      }
      
      console.log(`  ✅ Indexed (${chunks.length} chunks)`);
      indexed++;
      
      // Rate limit: wait between files to avoid API limits
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`  ❌ Error processing ${file.path}:`, error.message);
      errors++;
    }
  }
  
  console.log(`\n✅ Indexing complete:`);
  console.log(`   Indexed: ${indexed} files`);
  console.log(`   Errors: ${errors}`);
}

/**
 * Index package.json commands
 */
async function indexCommands(client) {
  console.log('\n📦 Indexing package.json commands...');
  
  try {
    // Clear existing commands
    await client.mutation(api.codebaseIndex.clearCommands);
    
    const pkgPath = path.join(ROOT_DIR, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const scripts = pkg.scripts || {};
    
    for (const [command, script] of Object.entries(scripts)) {
      // Categorize command
      let category = 'utility';
      if (command.includes('dev')) category = 'dev';
      else if (command.includes('build')) category = 'build';
      else if (command.includes('test')) category = 'test';
      else if (command.includes('deploy')) category = 'deploy';
      
      // Generate purpose
      const purpose = `Run ${script.split(' ')[0]} command`;
      
      await client.mutation(api.codebaseIndex.upsertCommand, {
        command: `pnpm ${command}`,
        script,
        package: 'root',
        purpose,
        category,
      });
    }
    
    console.log(`✅ Indexed ${Object.keys(scripts).length} commands`);
  } catch (error) {
    console.error('❌ Failed to index commands:', error.message);
  }
}

/**
 * Main execution
 */
async function main() {
  const fullScan = process.argv.includes('--full');
  
  console.log('🚀 Convex Codebase Indexer\n');
  
  // Check environment
  checkEnvironment();
  
  // Initialize Convex client
  const client = new ConvexHttpClient(CONVEX_URL);
  console.log('✅ Connected to Convex');
  
  // Get files to index
  const changedFiles = fullScan ? [] : await getChangedFiles();
  const scanMode = fullScan || changedFiles.length === 0 ? 'full' : 'incremental';
  
  console.log(`📁 Scan mode: ${scanMode}`);
  if (scanMode === 'incremental') {
    console.log(`   Changed files: ${changedFiles.length}`);
  }
  
  const files = scanCodebase(scanMode === 'full', changedFiles);
  
  if (files.length === 0) {
    console.log('✅ No files to index');
    return;
  }
  
  // Index files
  await indexToConvex(files, client);
  
  // Index commands
  await indexCommands(client);
  
  console.log('\n✨ Convex indexing complete!');
  console.log('\nNext steps:');
  console.log('1. Deploy schema: pnpm deploy (if not already done)');
  console.log('2. Query via Convex: ctx.runQuery(api.codebaseSearch.searchSimilar, ...)');
  console.log('3. Or use semantic search: ctx.runAction(api.semanticSearch.searchByQuery, {query: "..."})');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { indexToConvex, main };
