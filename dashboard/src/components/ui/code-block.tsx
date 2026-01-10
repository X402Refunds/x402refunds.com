"use client";

import { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/ui/copy-button";

type Prism = (typeof import("prismjs"))["default"];

function normalizeLanguage(lang: string | undefined) {
  const raw = (lang || "text").trim().toLowerCase();
  if (raw === "txt") return "text";
  if (raw === "shell" || raw === "sh") return "bash";
  return raw;
}

async function loadPrismAndLanguage(language: string) {
  const mod = await import("prismjs");
  const Prism: Prism | undefined = mod.default;
  if (!Prism) throw new Error("Prism failed to load");

  // Prism language components sometimes depend on base grammars.
  // We keep this small and only load what we use on landing/docs today.
  switch (language) {
    case "json":
      await import("prismjs/components/prism-json");
      break;
    case "bash":
      await import("prismjs/components/prism-bash");
      break;
    case "typescript":
      await import("prismjs/components/prism-clike");
      await import("prismjs/components/prism-javascript");
      await import("prismjs/components/prism-typescript");
      break;
    case "javascript":
      await import("prismjs/components/prism-clike");
      await import("prismjs/components/prism-javascript");
      break;
    case "markup":
    case "html":
      await import("prismjs/components/prism-markup");
      break;
    case "text":
    default:
      // No-op: Prism will treat it as plain text if the language is missing.
      break;
  }

  return Prism;
}

export function CodeBlock(props: {
  code: string;
  language?: string;
  title?: string;
  copyLabel?: string;
  className?: string;
}) {
  const codeEl = useRef<HTMLElement | null>(null);
  const language = useMemo(() => normalizeLanguage(props.language), [props.language]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!codeEl.current) return;
      try {
        const Prism = await loadPrismAndLanguage(language);
        if (cancelled) return;
        Prism.highlightElement(codeEl.current);
      } catch {
        // If Prism fails to load/highlight, we still show plaintext code.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [language, props.code]);

  return (
    <div className={cn("rounded-xl border border-border bg-card", props.className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border bg-background/60 px-3 py-2">
        <div className="min-w-0 text-xs font-medium text-muted-foreground">
          {props.title ? (
            <span className="font-mono text-foreground">{props.title}</span>
          ) : (
            <span className="font-mono">{language}</span>
          )}
        </div>
        <CopyButton value={props.code} label={props.copyLabel || "Copied"} />
      </div>

      <pre
        className={cn(
          "prism-code m-0 overflow-x-auto bg-muted/50 p-3 text-[13px] leading-6",
          `language-${language}`,
        )}
      >
        <code
          ref={(el) => {
            codeEl.current = el;
          }}
          className={cn("font-mono", `language-${language}`)}
        >
          {props.code}
        </code>
      </pre>
    </div>
  );
}

