"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export type DocsSectionKey = "overview" | "merchants" | "buyers";

export function DocsClient(props: {
  title: string;
  sections: Record<DocsSectionKey, string>;
}) {
  const [active, setActive] = useState<DocsSectionKey>("overview");

  const items = useMemo(
    () =>
      [
        { key: "overview" as const, label: "Overview" },
        { key: "merchants" as const, label: "Integration guide for Merchants" },
        { key: "buyers" as const, label: "File Disputes as a Buyer Agent" },
      ] as const,
    [],
  );

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <aside className="md:w-72 md:flex-shrink-0">
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="text-sm font-semibold text-foreground">{props.title}</div>
          <div className="mt-2 flex gap-2 md:flex-col md:gap-1">
            {items.map((item) => (
              <Button
                key={item.key}
                type="button"
                variant={active === item.key ? "secondary" : "ghost"}
                className="justify-start md:w-full"
                onClick={() => setActive(item.key)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="rounded-lg border border-border bg-card">
          <div className="p-6">
            <article
              className="markdown"
              dangerouslySetInnerHTML={{ __html: props.sections[active] }}
            />
          </div>
          <Separator />
          <div className="p-4 text-xs text-muted-foreground">
            Tip: open `/.well-known/mcp.json` to see the exact live tool schema.
          </div>
        </div>
      </div>
    </div>
  );
}


