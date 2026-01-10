"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export type DocsSectionKey = "merchants" | "buyers";
type Mermaid = (typeof import("mermaid"))["default"];

const SECTION_HASH: Record<DocsSectionKey, string> = {
  merchants: "integration-guide-for-merchants",
  buyers: "file-disputes-as-a-buyer-agent",
};

function keyFromHash(hash: string): DocsSectionKey | null {
  const h = (hash || "").replace(/^#/, "").trim().toLowerCase();
  for (const [key, slug] of Object.entries(SECTION_HASH) as Array<[DocsSectionKey, string]>) {
    if (h === slug) return key;
  }
  return null;
}

function setHashForKey(key: DocsSectionKey) {
  if (typeof window === "undefined") return;
  const slug = SECTION_HASH[key];
  try {
    window.history.replaceState(null, "", `#${slug}`);
  } catch {
    // Fallback
    window.location.hash = `#${slug}`;
  }
}

export function DocsClient(props: {
  title: string;
  sections: Record<DocsSectionKey, string>;
  buyerPanels?: { http?: string; mcp?: string };
}) {
  const [active, setActive] = useState<DocsSectionKey>("merchants");
  const [buyerMode, setBuyerMode] = useState<"http" | "mcp">("mcp");
  const contentRef = useRef<HTMLDivElement | null>(null);
  const buyerHttpRef = useRef<HTMLDivElement | null>(null);
  const buyerMcpRef = useRef<HTMLDivElement | null>(null);

  const items = useMemo(
    () =>
      [
        { key: "merchants" as const, label: "Integration guide for Merchants" },
        { key: "buyers" as const, label: "File Disputes as a Buyer Agent" },
      ] as const,
    [],
  );

  const enhanceRenderedHtml = (root: HTMLDivElement | null) => {
    if (!root) return;

    // 1) Render Mermaid blocks (```mermaid) into SVGs (client-side).
    // remark-html renders fenced code as: <pre><code class="language-mermaid">...</code></pre>
    const mermaidPres = Array.from(
      root.querySelectorAll('pre > code.language-mermaid, pre > code[class*="language-mermaid"]'),
    ).map((c) => c.parentElement as HTMLPreElement);

    if (mermaidPres.length > 0) {
      (async () => {
        try {
          const mermaid: Mermaid = (await import("mermaid")).default;
          mermaid.initialize({
            startOnLoad: false,
            theme: "neutral",
            securityLevel: "strict",
          });

          for (const pre of mermaidPres) {
            const code = pre.querySelector("code");
            const chart = (code?.textContent ?? "").trim();
            if (!chart) continue;

            const holder = document.createElement("div");
            holder.className = "mermaid-diagram";
            const mermaidEl = document.createElement("div");
            mermaidEl.className = "mermaid";
            mermaidEl.textContent = chart;
            holder.appendChild(mermaidEl);
            pre.replaceWith(holder);
          }

          await mermaid.run({ querySelector: ".mermaid" });

          const svgs = Array.from(root.querySelectorAll(".mermaid-diagram svg")) as SVGElement[];
          for (const svg of svgs) {
            svg.removeAttribute("width");
            svg.removeAttribute("height");
            svg.style.maxWidth = "100%";
            svg.style.height = "auto";
          }
        } catch {
          // If Mermaid fails, keep the plaintext blocks (already replaced) as-is.
        }
      })();
    }

    // 2) Add copy buttons to remaining code blocks (skip Mermaid).
    const pres = Array.from(root.querySelectorAll("pre")) as HTMLPreElement[];
    for (const pre of pres) {
      if (pre.querySelector('code.language-mermaid, code[class*="language-mermaid"]')) continue;
      if (pre.querySelector("button.code-copy-btn")) continue;
      const value = extractCode(pre);
      if (!value) continue;

      const btn = createCopyButton(async () => {
        try {
          await navigator.clipboard.writeText(value);
          btn.style.borderColor = "rgb(37 99 235)"; // blue-600
          setTimeout(() => {
            btn.style.borderColor = "";
          }, 900);
        } catch {
          // no-op
        }
      });

      pre.appendChild(btn);
    }

    // 3) PrismJS highlight (client-side) for any fenced code blocks.
    // remark-html renders fenced code as: <pre><code class="language-xxx">...</code></pre>
    // We keep this lightweight by only loading Prism + a small set of languages.
    highlightCodeBlocksWithPrism(root);
  };

  useEffect(() => {
    const initial = typeof window !== "undefined" ? keyFromHash(window.location.hash) : null;
    if (initial) setActive(initial);
  }, []);

  useEffect(() => {
    if (active !== "buyers") {
      enhanceRenderedHtml(contentRef.current);
      return;
    }
    if (buyerMode === "http") {
      enhanceRenderedHtml(buyerHttpRef.current);
      return;
    }
    enhanceRenderedHtml(buyerMcpRef.current);
  }, [active, buyerMode, props.sections, props.buyerPanels]);

  const buyerHasPanels = !!props.buyerPanels?.http || !!props.buyerPanels?.mcp;

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <aside className="md:w-72 md:flex-shrink-0">
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="flex gap-2 md:flex-col md:gap-1">
            {items.map((item) => (
              <Button
                key={item.key}
                type="button"
                variant="ghost"
                className={[
                  "justify-start md:w-full",
                  active === item.key
                    ? "bg-slate-100 text-slate-800 hover:bg-slate-100 hover:text-slate-900"
                    : "text-slate-600 hover:text-slate-900",
                ].join(" ")}
                onClick={() => {
                  setActive(item.key);
                  setHashForKey(item.key);
                }}
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
            {active === "buyers" && buyerHasPanels ? (
              <div id={SECTION_HASH.buyers}>
                <div className="flex gap-2 mb-4">
                  <Button
                    type="button"
                    variant="ghost"
                    className={
                      buyerMode === "http"
                        ? "bg-slate-100 text-slate-800 hover:bg-slate-100 hover:text-slate-900"
                        : "text-slate-600 hover:text-slate-900"
                    }
                    onClick={() => setBuyerMode("http")}
                  >
                    HTTP
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className={
                      buyerMode === "mcp"
                        ? "bg-slate-100 text-slate-800 hover:bg-slate-100 hover:text-slate-900"
                        : "text-slate-600 hover:text-slate-900"
                    }
                    onClick={() => setBuyerMode("mcp")}
                  >
                    MCP (default)
                  </Button>
                </div>

                <div style={{ display: buyerMode === "http" ? "block" : "none" }} ref={buyerHttpRef}>
                  <article
                    className="markdown"
                    dangerouslySetInnerHTML={{ __html: props.buyerPanels?.http || "" }}
                  />
                </div>
                <div style={{ display: buyerMode === "mcp" ? "block" : "none" }} ref={buyerMcpRef}>
                  <article
                    className="markdown"
                    dangerouslySetInnerHTML={{ __html: props.buyerPanels?.mcp || "" }}
                  />
                </div>
              </div>
            ) : (
              <div ref={contentRef} id={SECTION_HASH[active]}>
                <article
                  className="markdown"
                  dangerouslySetInnerHTML={{ __html: props.sections[active] }}
                />
              </div>
            )}
          </div>
          <Separator />
          <div className="p-4 text-xs text-muted-foreground">
            Schema:{" "}
            <a
              className="underline underline-offset-2"
              href="https://api.x402refunds.com/.well-known/mcp.json"
            >
              /.well-known/mcp.json
            </a>
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

type Prism = (typeof import("prismjs"))["default"];
let prismPromise: Promise<Prism> | null = null;
async function getPrism() {
  if (!prismPromise) {
    prismPromise = (async () => {
      const mod = await import("prismjs");
      const Prism = mod.default;
      if (!Prism) throw new Error("Prism failed to load");
      // Languages used in docs today
      await Promise.allSettled([
        import("prismjs/components/prism-json"),
        import("prismjs/components/prism-bash"),
      ]);
      return Prism;
    })();
  }
  return prismPromise;
}

function normalizeLanguageClass(cls: string) {
  // Prism uses "text"; markdown commonly uses "txt"
  if (cls === "language-txt") return "language-text";
  if (cls === "language-shell" || cls === "language-sh") return "language-bash";
  return cls;
}

function highlightCodeBlocksWithPrism(root: HTMLDivElement) {
  const codeNodes = Array.from(
    root.querySelectorAll('pre > code[class*="language-"]'),
  ) as HTMLElement[];
  if (codeNodes.length === 0) return;

  // Fire and forget; render remains usable even if Prism fails.
  void (async () => {
    try {
      const Prism = await getPrism();
      for (const code of codeNodes) {
        // Ensure the <pre> has the same language class so Prism theme selectors apply
        const pre = code.parentElement as HTMLPreElement | null;
        if (!pre) continue;

        const langClass = Array.from(code.classList).find((c) => c.startsWith("language-")) || "language-text";
        const normalized = normalizeLanguageClass(langClass);
        if (normalized !== langClass) {
          code.classList.remove(langClass);
          code.classList.add(normalized);
        }
        if (!pre.classList.contains(normalized)) pre.classList.add(normalized);
        pre.classList.add("prism-code");

        Prism.highlightElement(code);
      }
    } catch {
      // no-op
    }
  })();
}


