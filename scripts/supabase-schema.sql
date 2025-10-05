-- Supabase Schema for Codebase RAG
-- Run this in your Supabase SQL editor

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Table: codebase_files
-- Stores file metadata and content for RAG queries
CREATE TABLE IF NOT EXISTS codebase_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  content TEXT,
  file_type TEXT, -- 'component', 'api', 'test', 'config', 'asset', 'doc'
  size_bytes BIGINT,
  exports TEXT[], -- Exported functions/classes/constants
  purpose TEXT, -- Brief description of file purpose
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  indexed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: codebase_embeddings
-- Stores vector embeddings for semantic search
CREATE TABLE IF NOT EXISTS codebase_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES codebase_files(id) ON DELETE CASCADE,
  chunk_index INTEGER DEFAULT 0, -- For large files split into chunks
  chunk_content TEXT,
  embedding vector(1536), -- OpenAI ada-002 or similar (1536 dimensions)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: codebase_dependencies
-- Stores import/export relationships between files
CREATE TABLE IF NOT EXISTS codebase_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_file_id UUID REFERENCES codebase_files(id) ON DELETE CASCADE,
  to_file_id UUID REFERENCES codebase_files(id) ON DELETE CASCADE,
  relationship_type TEXT, -- 'imports', 'exports_to', 'tests', 'uses'
  import_name TEXT, -- What is being imported
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_file_id, to_file_id, import_name)
);

-- Table: codebase_commands
-- Stores available pnpm/npm commands
CREATE TABLE IF NOT EXISTS codebase_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  command TEXT NOT NULL UNIQUE,
  script TEXT NOT NULL,
  package TEXT DEFAULT 'root', -- 'root', 'dashboard', 'convex'
  purpose TEXT,
  category TEXT, -- 'dev', 'build', 'test', 'deploy', 'utility'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_files_path ON codebase_files(path);
CREATE INDEX IF NOT EXISTS idx_files_type ON codebase_files(file_type);
CREATE INDEX IF NOT EXISTS idx_files_name ON codebase_files(name);
CREATE INDEX IF NOT EXISTS idx_embeddings_file ON codebase_embeddings(file_id);
CREATE INDEX IF NOT EXISTS idx_deps_from ON codebase_dependencies(from_file_id);
CREATE INDEX IF NOT EXISTS idx_deps_to ON codebase_dependencies(to_file_id);
CREATE INDEX IF NOT EXISTS idx_commands_category ON codebase_commands(category);

-- Vector similarity search index (HNSW for performance)
CREATE INDEX IF NOT EXISTS idx_embeddings_vector 
ON codebase_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_files_content_fts 
ON codebase_files 
USING gin(to_tsvector('english', content));

CREATE INDEX IF NOT EXISTS idx_files_purpose_fts 
ON codebase_files 
USING gin(to_tsvector('english', purpose));

-- Function: Search files by vector similarity
CREATE OR REPLACE FUNCTION search_similar_files(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  file_id UUID,
  path TEXT,
  content TEXT,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.path,
    e.chunk_content,
    1 - (e.embedding <=> query_embedding) as similarity
  FROM codebase_embeddings e
  JOIN codebase_files f ON e.file_id = f.id
  WHERE 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function: Get file dependencies (recursive)
CREATE OR REPLACE FUNCTION get_file_dependencies(
  file_path TEXT,
  max_depth INTEGER DEFAULT 3
)
RETURNS TABLE (
  path TEXT,
  relationship_type TEXT,
  depth INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE deps AS (
    -- Base case: direct dependencies
    SELECT 
      f2.path,
      d.relationship_type,
      1 as depth
    FROM codebase_files f1
    JOIN codebase_dependencies d ON f1.id = d.from_file_id
    JOIN codebase_files f2 ON d.to_file_id = f2.id
    WHERE f1.path = file_path
    
    UNION
    
    -- Recursive case: dependencies of dependencies
    SELECT 
      f2.path,
      d.relationship_type,
      deps.depth + 1
    FROM deps
    JOIN codebase_files f1 ON f1.path = deps.path
    JOIN codebase_dependencies d ON f1.id = d.from_file_id
    JOIN codebase_files f2 ON d.to_file_id = f2.id
    WHERE deps.depth < max_depth
  )
  SELECT DISTINCT deps.path, deps.relationship_type, deps.depth
  FROM deps
  ORDER BY deps.depth, deps.path;
END;
$$;

-- Function: Search commands by purpose
CREATE OR REPLACE FUNCTION search_commands(
  search_term TEXT
)
RETURNS TABLE (
  command TEXT,
  script TEXT,
  purpose TEXT,
  relevance float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.command,
    c.script,
    c.purpose,
    ts_rank(to_tsvector('english', c.purpose || ' ' || c.command), 
            plainto_tsquery('english', search_term)) as relevance
  FROM codebase_commands c
  WHERE to_tsvector('english', c.purpose || ' ' || c.command) @@ 
        plainto_tsquery('english', search_term)
  ORDER BY relevance DESC
  LIMIT 10;
END;
$$;

-- Row Level Security (RLS) - Optional but recommended
-- Uncomment if you want to restrict access

-- ALTER TABLE codebase_files ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE codebase_embeddings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE codebase_dependencies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE codebase_commands ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
-- CREATE POLICY "Allow authenticated users to read files" 
--   ON codebase_files FOR SELECT 
--   TO authenticated 
--   USING (true);

-- CREATE POLICY "Allow authenticated users to insert files" 
--   ON codebase_files FOR INSERT 
--   TO authenticated 
--   WITH CHECK (true);

COMMENT ON TABLE codebase_files IS 'Stores file metadata and content for codebase RAG system';
COMMENT ON TABLE codebase_embeddings IS 'Stores vector embeddings for semantic search';
COMMENT ON TABLE codebase_dependencies IS 'Stores import/export relationships between files';
COMMENT ON TABLE codebase_commands IS 'Stores available package.json commands';
COMMENT ON FUNCTION search_similar_files IS 'Search for files by vector similarity using cosine distance';
COMMENT ON FUNCTION get_file_dependencies IS 'Get recursive dependencies for a file';
COMMENT ON FUNCTION search_commands IS 'Full-text search for commands by purpose';
