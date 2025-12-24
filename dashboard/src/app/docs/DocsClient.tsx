"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export type DocsSectionKey = "overview" | "merchants" | "buyers";

export function DocsClient(props: {
  title: string;
  sections: Record<DocsSectionKey, string>;
}) {
  const [active, setActive] = useState<DocsSectionKey>("overview");
  const contentRef = useRef<HTMLDivElement | null>(null);

  const items = useMemo(
    () =>
      [
        { key: "overview" as const, label: "Overview" },
        { key: "merchants" as const, label: "Integration guide for Merchants" },
        { key: "buyers" as const, label: "File Disputes as a Buyer Agent" },
      ] as const,
    [],
  );

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;

    const pres = Array.from(root.querySelectorAll("pre")) as HTMLPreElement[];
    for (const pre of pres) {
      if (pre.querySelector("button.code-copy-btn")) continue;
      const value = extractCode(pre);
      if (!value) continue;

      const btn = createCopyButton(async () => {
        try {
          await navigator.clipboard.writeText(value);
          btn.style.borderColor = "rgb(16 185 129)"; // emerald-500
          setTimeout(() => {
            btn.style.borderColor = "";
          }, 900);
        } catch {
          // no-op (clipboard can fail in some contexts)
        }
      });

      pre.appendChild(btn);
    }
  }, [active, props.sections]);

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
            <div ref={contentRef}>
              <article
                className="markdown"
                dangerouslySetInnerHTML={{ __html: props.sections[active] }}
              />
            </div>
          </div>
          <Separator />
          <div className="p-4 text-xs text-muted-foreground">
            Tip: connect your LLM to{" "}
            <a className="underline underline-offset-2" href="https://api.x402disputes.com/mcp">
              https://api.x402disputes.com/mcp
            </a>{" "}
            (schema:{" "}
            <a
              className="underline underline-offset-2"
              href="https://api.x402disputes.com/.well-known/mcp.json"
            >
              /.well-known/mcp.json
            </a>
            )
          </div>
        </div>
      </div>
    </div>
  );
}

function createCopyButton(onClick: () => void) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "code-copy-btn";
  btn.setAttribute("aria-label", "Copy code");
  btn.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" width="16" height="16">' +
    '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>' +
    '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>' +
    "</svg>";
  btn.addEventListener("click", onClick);
  return btn;
}

function extractCode(pre: HTMLPreElement) {
  const code = pre.querySelector("code");
  return (code?.textContent ?? pre.textContent ?? "").trim();
}


