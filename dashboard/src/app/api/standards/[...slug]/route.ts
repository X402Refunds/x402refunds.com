import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';

const STANDARDS_DIR = join(process.cwd(), '..', 'docs', 'standards');
const RULES_PATTERN = /^consulate-arbitration-rules-v(\d+\.\d+(?:\.\d+)?)\.md$/;

/**
 * Parse version from filename
 */
function parseVersion(filename: string): string | null {
  const match = filename.match(RULES_PATTERN);
  return match ? match[1] : null;
}

/**
 * List all available standards with their versions
 */
function listAllStandards() {
  const files = readdirSync(STANDARDS_DIR);
  const rulesFiles = files.filter(f => RULES_PATTERN.test(f));

  const versions = rulesFiles
    .map(f => {
      const version = parseVersion(f);
      return version ? { version, filename: f } : null;
    })
    .filter((v): v is { version: string; filename: string } => v !== null)
    .sort((a, b) => {
      // Sort by version (newest first)
      const aParts = a.version.split('.').map(Number);
      const bParts = b.version.split('.').map(Number);
      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aVal = aParts[i] || 0;
        const bVal = bParts[i] || 0;
        if (aVal !== bVal) return bVal - aVal;
      }
      return 0;
    });

  return {
    standards: [
      {
        id: 'arbitration-rules',
        name: 'x402Disputes Arbitration Rules',
        description: 'Procedural rules for agentic dispute arbitration',
        versions: versions.map(v => ({
          version: v.version,
          url: `/api/standards/arbitration-rules/v${v.version}`,
          filename: v.filename
        })),
        latestVersion: versions[0]?.version || null
      }
    ]
  };
}

/**
 * List versions of a specific standard
 */
function listStandardVersions(standardId: string) {
  if (standardId !== 'arbitration-rules') {
    return null;
  }

  const files = readdirSync(STANDARDS_DIR);
  const rulesFiles = files.filter(f => RULES_PATTERN.test(f));

  const versions = rulesFiles
    .map(f => {
      const version = parseVersion(f);
      return version ? { version, filename: f } : null;
    })
    .filter((v): v is { version: string; filename: string } => v !== null)
    .sort((a, b) => {
      const aParts = a.version.split('.').map(Number);
      const bParts = b.version.split('.').map(Number);
      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aVal = aParts[i] || 0;
        const bVal = bParts[i] || 0;
        if (aVal !== bVal) return bVal - aVal;
      }
      return 0;
    });

  return {
    id: standardId,
    name: 'x402Disputes Arbitration Rules',
    versions: versions.map(v => ({
      version: v.version,
      url: `/api/standards/arbitration-rules/v${v.version}`,
      filename: v.filename
    })),
    latestVersion: versions[0]?.version || null
  };
}

/**
 * Get specific version of a standard
 */
function getStandardVersion(standardId: string, version: string, format: string = 'json') {
  if (standardId !== 'arbitration-rules') {
    return null;
  }

  // Clean version (remove 'v' prefix if present)
  const cleanVersion = version.startsWith('v') ? version.slice(1) : version;

  // Find matching file
  const filename = `consulate-arbitration-rules-v${cleanVersion}.md`;
  const filePath = join(STANDARDS_DIR, filename);

  if (!existsSync(filePath)) {
    return null;
  }

  const content = readFileSync(filePath, 'utf-8');

  if (format === 'markdown' || format === 'md') {
    return {
      version: cleanVersion,
      format: 'markdown',
      content
    };
  }

  // Parse markdown header
  const lines = content.split('\n');
  const header: Record<string, string> = {};

  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const line = lines[i];
    if (line.startsWith('**') && line.includes(':**')) {
      const match = line.match(/\*\*(.+?)\*\*:\s*(.+)/);
      if (match) {
        header[match[1]] = match[2].replace(/`/g, '').trim();
      }
    }
    if (line.startsWith('## ')) {
      break;
    }
  }

  return {
    version: cleanVersion,
    format: 'json',
    metadata: {
      effectiveDate: header['Effective Date'] || null,
      version: header['Version'] || cleanVersion,
      license: header['License'] || null,
      canonicalUrl: header['Canonical URL'] || null,
      protocolHash: header['Protocol Hash'] || null,
      timestampMethod: header['Timestamp Method'] || null,
      timestamp: header['Timestamp'] || null,
    },
    content,
    url: `/api/standards/arbitration-rules/v${cleanVersion}`
  };
}

/**
 * GET handler for standards API
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug?: string[] } }
) {
  const slug = params.slug || [];
  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get('format') || 'json';

  try {
    // Route: /api/standards
    if (slug.length === 0) {
      const data = listAllStandards();
      return NextResponse.json(data, {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        }
      });
    }

    // Route: /api/standards/arbitration-rules
    if (slug.length === 1) {
      const standardId = slug[0];
      const data = listStandardVersions(standardId);
      
      if (!data) {
        return NextResponse.json(
          { error: 'Standard not found', standardId },
          { status: 404 }
        );
      }

      return NextResponse.json(data, {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        }
      });
    }

    // Route: /api/standards/arbitration-rules/v1.0
    if (slug.length === 2) {
      const standardId = slug[0];
      const version = slug[1];
      const data = getStandardVersion(standardId, version, format);

      if (!data) {
        return NextResponse.json(
          { error: 'Version not found', standardId, version },
          { status: 404 }
        );
      }

      // Return markdown directly if requested
      if (format === 'markdown' || format === 'md') {
        return new NextResponse(data.content, {
          headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Cache-Control': 'public, max-age=86400, s-maxage=86400',
          }
        });
      }

      return NextResponse.json(data, {
        headers: {
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        }
      });
    }

    // Invalid route
    return NextResponse.json(
      { error: 'Invalid route', path: slug.join('/') },
      { status: 404 }
    );
  } catch (error) {
    console.error('Standards API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

