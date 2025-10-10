"use client"

import { ReactNode } from 'react';
import { DocSidebar } from './doc-sidebar';
import { SidebarItem } from '@/lib/docs';
import { Navigation } from './Navigation';
import { Footer } from './Footer';

interface DocLayoutProps {
  children: ReactNode;
  sidebar: SidebarItem[];
  currentSlug?: string[];
}

export function DocLayout({ children, sidebar, currentSlug }: DocLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      
      <div className="flex flex-1">
        <DocSidebar items={sidebar} currentSlug={currentSlug} />
        
        <main className="flex-1 bg-white">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}

