#!/usr/bin/env node

/**
 * Supabase Codebase Indexer
 * 
 * Generates embeddings for codebase files and uploads to Supabase
 * for semantic RAG queries. Supports incremental updates.
 * 
 * Environment variables required:
 * - SUPABASE_URL
 * - SUPABASE_KEY
 * - OPENAI_API_KEY or ANTHROPIC_API_KEY
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = process.cwd();

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const MAX_FILE_SIZE = 100000; // 100KB max per file for embedding
const CHUNK_SIZE = 2000; // Characters per chunk for large files

/**
 * Check environment variables
 */
function checkEnvironment() {
  const missing = [];
  
  if (!SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!SUPABASE_KEY) missing.push('SUPABASE_KEY');
  if (!OPENAI_API_KEY && !ANTHROPIC_API_KEY) {
    missing.push('OPENAI_API_KEY or ANTHROPIC_API_KEY');
  }
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    console.error('\nSet these in .env.local or as environment variables.');
    process.exit(1);
  }
  
  console.log('✅ Environment variables configured');
}

/**
 * Generate embeddings using OpenAI
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
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Get changed files using git diff
 */
async function getChangedFiles() {
  try {
    const { execSync } = await import('child_process');
    const output = execSync('git diff --name-only HEAD~1', { encoding: 'utf-8' });
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
      size_bytes: stats.size,
      file_type: fileType,
      exports,
      purpose,
      last_modified: stats.mtime.toISOString()
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
 * Index files to Supabase
 */
async function indexToSupabase(files, supabase) {
  console.log(`\n📊 Indexing ${files.length} files to Supabase...\n`);
  
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
      const { data: fileRecord, error: fileError } = await supabase
        .from('codebase_files')
        .upsert({
          path: file.path,
          name: path.basename(file.path),
          content: metadata.content,
          file_type: metadata.file_type,
          size_bytes: metadata.size_bytes,
          exports: metadata.exports,
          purpose: metadata.purpose,
          last_modified: metadata.last_modified,
          indexed_at: new Date().toISOString()
        }, {
          onConflict: 'path'
        })
        .select()
        .single();
      
      if (fileError) {
        console.error(`  ❌ Failed to upsert file:`, fileError.message);
        errors++;
        continue;
      }
      
      // Generate embeddings for content chunks
      const chunks = chunkContent(metadata.content);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        if (chunk.trim().length < 50) continue; // Skip tiny chunks
        
        try {
          // Generate embedding
          const embedding = await generateEmbeddingOpenAI(chunk);
          
          // Delete old embeddings for this file
          if (i === 0) {
            await supabase
              .from('codebase_embeddings')
              .delete()
              .eq('file_id', fileRecord.id);
          }
          
          // Insert new embedding
          const { error: embError } = await supabase
            .from('codebase_embeddings')
            .insert({
              file_id: fileRecord.id,
              chunk_index: i,
              chunk_content: chunk,
              embedding
            });
          
          if (embError) {
            console.error(`  ⚠️  Failed to insert embedding:`, embError.message);
          }
        } catch (embError) {
          console.error(`  ⚠️  Failed to generate embedding:`, embError.message);
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
async function indexCommands(supabase) {
  console.log('\n📦 Indexing package.json commands...');
  
  try {
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
      
      await supabase
        .from('codebase_commands')
        .upsert({
          command: `pnpm ${command}`,
          script,
          package: 'root',
          purpose,
          category
        }, {
          onConflict: 'command'
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
  
  console.log('🚀 Supabase Codebase Indexer\n');
  
  // Check environment
  checkEnvironment();
  
  // Initialize Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log('✅ Connected to Supabase');
  
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
  await indexToSupabase(files, supabase);
  
  // Index commands
  await indexCommands(supabase);
  
  console.log('\n✨ Supabase indexing complete!');
  console.log('\nNext steps:');
  console.log('1. Configure .cursor/mcp.json with Supabase MCP server');
  console.log('2. Restart Cursor to load MCP server');
  console.log('3. Ask questions like: "How does authentication work?"');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { indexToSupabase, main };
