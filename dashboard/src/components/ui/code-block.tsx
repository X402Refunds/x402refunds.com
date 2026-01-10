"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/ui/copy-button";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";

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
  variant?: "minimal" | "card";
  copyUi?: "icon" | "button";
  clickToCopy?: boolean;
  header?: "caption" | "none";
  copyPlacement?: "header" | "overlay";
  className?: string;
}) {
  const codeEl = useRef<HTMLElement | null>(null);
  const language = useMemo(() => normalizeLanguage(props.language), [props.language]);
  const variant = props.variant ?? "minimal";
  const copyUi = props.copyUi ?? "icon";
  const clickToCopy = props.clickToCopy ?? false;
  const header = props.header ?? "caption";
  const copyPlacement = props.copyPlacement ?? "header";
  const [copied, setCopied] = useState(false);

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

  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(props.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // CopyButton handles errors with toast; for click-to-copy we silently no-op.
    }
  };

  return (
    <div
      className={cn(
        variant === "card" ? "rounded-xl border border-border bg-card" : "bg-transparent",
        props.className,
      )}
    >
      {header === "caption" ? (
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="min-w-0 text-xs font-medium text-muted-foreground">
            {props.title ? (
              <span className="font-mono text-foreground">{props.title}</span>
            ) : (
              <span className="font-mono">{language}</span>
            )}
          </div>
          {copyPlacement === "header" ? (
            copyUi === "button" ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-2"
                onClick={async () => {
                  await doCopy();
                }}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            ) : (
              <CopyButton value={props.code} label={props.copyLabel || "Copied"} />
            )
          ) : null}
        </div>
      ) : null}

      <pre
        className={cn(
          "prism-code relative m-0 overflow-x-auto rounded-xl bg-muted/40 px-4 py-3 text-[13px] leading-6",
          clickToCopy ? "cursor-pointer transition-colors hover:bg-muted/55" : "",
          `language-${language}`,
        )}
        role={clickToCopy ? "button" : undefined}
        tabIndex={clickToCopy ? 0 : undefined}
        aria-label={clickToCopy ? "Copy code" : undefined}
        onClick={
          clickToCopy
            ? async () => {
                await doCopy();
              }
            : undefined
        }
        onKeyDown={
          clickToCopy
            ? async (e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                await doCopy();
              }
            : undefined
        }
      >
        {copyPlacement === "overlay" ? (
          <div className="absolute right-2 top-2 z-10">
            <CopyButton value={props.code} label={props.copyLabel || "Copied"} />
          </div>
        ) : null}
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

