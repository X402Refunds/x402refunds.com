import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const SCHEMAS_DIR = join(process.cwd(), '..', 'agentic-dispute-protocol', 'spec', 'json-schema');

/**
 * GET /api/schemas/[schemaName] - Expose JSON schemas from ADP protocol
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { schemaName: string } }
) {
  try {
    const { schemaName } = params;

    // If schemaName is "list", return all available schemas
    if (schemaName === 'list') {
      const files = readdirSync(SCHEMAS_DIR);
      const schemas = files
        .filter(f => f.endsWith('.json'))
        .map(f => ({
          name: f.replace('.json', ''),
          filename: f,
          url: `/api/schemas/${f.replace('.json', '')}`
        }));

      return NextResponse.json({
        schemas,
        count: schemas.length
      }, {
        headers: {
          'Cache-Control': 'public, max-age=3600',
        }
      });
    }

    // Load specific schema
    const filename = schemaName.startsWith('schema.') 
      ? `${schemaName}.json` 
      : `schema.${schemaName}.json`;
    
    const filePath = join(SCHEMAS_DIR, filename);
    const content = readFileSync(filePath, 'utf-8');
    const schema = JSON.parse(content);

    return NextResponse.json(schema, {
      headers: {
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch {
    return NextResponse.json(
      { error: 'Schema not found', schemaName: params.schemaName },
      { status: 404 }
    );
  }
}

