import { ReactNode } from 'react';
import { DocLayout } from '@/components/doc-layout';
import { generateSidebar } from '@/lib/docs';

export default function DocsLayout({ children }: { children: ReactNode }) {
  const sidebar = generateSidebar();

  return <DocLayout sidebar={sidebar}>{children}</DocLayout>;
}

