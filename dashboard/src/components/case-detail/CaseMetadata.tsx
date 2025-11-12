"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CopyableField } from "./CopyableField";
import { ChevronDown, ChevronUp, Database } from "lucide-react";

interface CaseMetadataProps {
  metadata?: Record<string, unknown>;
  paymentMetadata?: Record<string, unknown>;
}

export function CaseMetadata({ 
  metadata,
  paymentMetadata
}: CaseMetadataProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Combine metadata sources
  const combinedMetadata = {
    ...metadata,
    ...paymentMetadata,
  };

  // If no metadata, don't render
  if (!combinedMetadata || Object.keys(combinedMetadata).length === 0) {
    return null;
  }

  // Helper to render metadata value
  const renderValue = (value: unknown, key: string): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">Not provided</span>;
    }

    if (typeof value === 'boolean') {
      return <Badge variant="outline">{value ? 'Yes' : 'No'}</Badge>;
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
      return (
        <pre className="text-xs bg-muted p-2 rounded border overflow-auto max-h-32">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }

    if (Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((item, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {String(item)}
            </Badge>
          ))}
        </div>
      );
    }

    // For string/number values that might be IDs or hashes
    const strValue = String(value);
    if (strValue.length > 30) {
      return (
        <CopyableField 
          value={strValue} 
          label={`${key} copied`}
          truncate
          truncateLength={50}
        />
      );
    }

    return <span className="text-foreground">{strValue}</span>;
  };

  // Format key for display (camelCase -> Title Case)
  const formatKey = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // Group metadata by category (basic heuristic)
  const categorizeMetadata = (data: Record<string, unknown>): Record<string, Record<string, unknown>> => {
    const categories: Record<string, Record<string, unknown>> = {
      'General': {},
      'Party Information': {},
      'Technical': {},
      'Custom Fields': {},
    };

    Object.entries(data).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('email') || lowerKey.includes('name') || lowerKey.includes('customer') || lowerKey.includes('merchant')) {
        categories['Party Information'][key] = value;
      } else if (lowerKey.includes('id') || lowerKey.includes('hash') || lowerKey.includes('key') || lowerKey.includes('token')) {
        categories['Technical'][key] = value;
      } else if (lowerKey.includes('custom') || lowerKey.includes('meta')) {
        categories['Custom Fields'][key] = value;
      } else {
        categories['General'][key] = value;
      }
    });

    // Remove empty categories
    return Object.fromEntries(
      Object.entries(categories).filter(([, fields]) => Object.keys(fields).length > 0)
    );
  };

  const categorized = categorizeMetadata(combinedMetadata);

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Advanced Metadata
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2"
          >
            {isExpanded ? (
              <>
                Hide Details
                <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Show Details
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-6">
          {Object.entries(categorized).map(([category, fields]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-foreground mb-3 pb-2 border-b">
                {category}
              </h4>
              <div className="space-y-3">
                {Object.entries(fields).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-[200px,1fr] gap-4 items-start">
                    <p className="text-sm font-medium text-muted-foreground">
                      {formatKey(key)}
                    </p>
                    <div className="text-sm">
                      {renderValue(value, key)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Raw JSON View (collapsed by default) */}
          <details className="mt-6">
            <summary className="text-sm font-semibold text-muted-foreground cursor-pointer hover:text-foreground">
              View raw JSON
            </summary>
            <pre className="mt-3 text-xs bg-muted p-4 rounded border overflow-auto max-h-96">
              {JSON.stringify(combinedMetadata, null, 2)}
            </pre>
          </details>
        </CardContent>
      )}
    </Card>
  );
}

function Badge({ children, variant = "default", className = "" }: { 
  children: React.ReactNode; 
  variant?: "default" | "secondary" | "outline"; 
  className?: string;
}) {
  const variantClass = variant === "outline" 
    ? "border bg-transparent" 
    : variant === "secondary"
    ? "bg-secondary text-secondary-foreground"
    : "bg-primary text-primary-foreground";
  
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${variantClass} ${className}`}>
      {children}
    </span>
  );
}

