"use client"

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Search, FileText } from 'lucide-react';
import { SidebarItem } from '@/lib/docs';

interface DocSidebarProps {
  items: SidebarItem[];
  currentSlug?: string[];
}

export function DocSidebar({ items, currentSlug = [] }: DocSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(items.map(item => item.slug.join('/')))
  );

  const toggleSection = (slug: string[]) => {
    const key = slug.join('/');
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const isActive = (slug: string[]) => {
    return slug.join('/') === currentSlug.join('/');
  };

  const isExpanded = (slug: string[]) => {
    return expandedSections.has(slug.join('/'));
  };

  const renderItem = (item: SidebarItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const expanded = isExpanded(item.slug);
    const active = isActive(item.slug);

    return (
      <div key={item.slug.join('/')}>
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            active
              ? 'bg-blue-100 text-blue-900 font-medium'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          style={{ paddingLeft: `${level * 12 + 12}px` }}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleSection(item.slug)}
              className="flex items-center gap-2 flex-1 text-left"
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <span className="font-medium">{item.title}</span>
            </button>
          ) : (
            <Link
              href={`/docs/${item.slug.join('/')}`}
              className="flex items-center gap-2 flex-1"
            >
              <FileText className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          )}
        </div>

        {hasChildren && expanded && (
          <div>
            {item.children!.map(child => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const filteredItems = searchQuery
    ? items.filter(item => {
        const matchesSearch = (i: SidebarItem): boolean => {
          if (i.title.toLowerCase().includes(searchQuery.toLowerCase())) {
            return true;
          }
          if (i.children) {
            return i.children.some(matchesSearch);
          }
          return false;
        };
        return matchesSearch(item);
      })
    : items;

  return (
    <div className="w-64 h-full bg-slate-50 border-r border-slate-200 overflow-y-auto">
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search docs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      <nav className="px-2 pb-4">
        <Link
          href="https://docs.x402disputes.com"
          className={`flex items-center gap-2 px-3 py-2 mb-2 rounded-lg transition-colors ${
            currentSlug.length === 0
              ? 'bg-blue-100 text-blue-900 font-medium'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Documentation Home</span>
        </Link>

        <Link
          href="https://docs.x402disputes.com/api-overview"
          className={`flex items-center gap-2 px-3 py-2 mb-4 rounded-lg transition-colors ${
            currentSlug[0] === 'api'
              ? 'bg-blue-100 text-blue-900 font-medium'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>API Reference</span>
        </Link>

        <div className="space-y-1">
          {filteredItems.map(item => renderItem(item))}
        </div>
      </nav>
    </div>
  );
}

