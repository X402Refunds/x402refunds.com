import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkHtml from 'remark-html';

const docsDirectory = path.join(process.cwd(), '..', 'docs');

export interface DocMetadata {
  title: string;
  description?: string;
  [key: string]: unknown;
}

export interface DocFile {
  slug: string[];
  metadata: DocMetadata;
  content: string;
  htmlContent?: string;
}

export interface SidebarItem {
  title: string;
  slug: string[];
  children?: SidebarItem[];
}

/**
 * Recursively get all markdown files from docs directory
 * Excludes 'standards' directory as it's served separately
 */
export function getAllDocs(dir: string = docsDirectory, baseSlug: string[] = []): DocFile[] {
  const files = fs.readdirSync(dir);
  const docs: DocFile[] = [];

  for (const file of files) {
    // Skip standards directory - served separately at /rules
    if (file === 'standards' && baseSlug.length === 0) {
      continue;
    }

    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Recursively get docs from subdirectories
      docs.push(...getAllDocs(filePath, [...baseSlug, file]));
    } else if (file.endsWith('.md')) {
      // Read and parse markdown file
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(fileContents);
      
      // Generate slug from filename (remove .md extension)
      const fileName = file.replace(/\.md$/, '');
      const slug = [...baseSlug, fileName];

      docs.push({
        slug,
        metadata: {
          title: data.title || fileName.replace(/-/g, ' ').replace(/([A-Z])/g, ' $1').trim(),
          ...data,
        },
        content,
      });
    }
  }

  return docs;
}

/**
 * Get a specific doc by its slug
 */
export async function getDocBySlug(slug: string[]): Promise<DocFile | null> {
  try {
    // Build file path from slug
    const fileName = slug[slug.length - 1] + '.md';
    const dirPath = slug.slice(0, -1);
    const filePath = path.join(docsDirectory, ...dirPath, fileName);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);

    // Convert markdown to HTML
    const processedContent = await remark()
      .use(remarkHtml, { sanitize: false })
      .process(content);
    const htmlContent = processedContent.toString();

    return {
      slug,
      metadata: {
        title: data.title || slug[slug.length - 1].replace(/-/g, ' '),
        ...data,
      },
      content,
      htmlContent,
    };
  } catch (error) {
    console.error('Error reading doc:', error);
    return null;
  }
}

/**
 * Generate sidebar navigation tree from docs
 */
export function generateSidebar(): SidebarItem[] {
  const docs = getAllDocs();
  const sidebar: SidebarItem[] = [];

  // Group docs by their directory structure
  const grouped = new Map<string, DocFile[]>();

  for (const doc of docs) {
    if (doc.slug.length === 1) {
      // Root level doc
      sidebar.push({
        title: doc.metadata.title,
        slug: doc.slug,
      });
    } else {
      // Nested doc
      const category = doc.slug[0];
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(doc);
    }
  }

  // Build nested structure
  for (const [category, categoryDocs] of grouped) {
    const children: SidebarItem[] = categoryDocs.map(doc => ({
      title: doc.metadata.title,
      slug: doc.slug,
    }));

    sidebar.push({
      title: category.charAt(0).toUpperCase() + category.slice(1),
      slug: [category],
      children,
    });
  }

  return sidebar;
}

/**
 * Get all possible doc paths for static generation
 */
export function getAllDocPaths(): string[][] {
  const docs = getAllDocs();
  return docs.map(doc => doc.slug);
}

/**
 * Format slug for display (convert kebab-case to Title Case)
 */
export function formatSlugTitle(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Search docs by query string
 */
export function searchDocs(query: string): DocFile[] {
  const allDocs = getAllDocs();
  const lowerQuery = query.toLowerCase();

  return allDocs.filter(doc => {
    const titleMatch = doc.metadata.title.toLowerCase().includes(lowerQuery);
    const contentMatch = doc.content.toLowerCase().includes(lowerQuery);
    const slugMatch = doc.slug.join('/').toLowerCase().includes(lowerQuery);
    
    return titleMatch || contentMatch || slugMatch;
  });
}

