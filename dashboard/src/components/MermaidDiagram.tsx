"use client";

import { useEffect, useId, useMemo, useState } from "react";

type Mermaid = (typeof import("mermaid"))["default"];

export function MermaidDiagram(props: { chart: string; className?: string }) {
  const id = useId().replace(/:/g, "");
  const [svg, setSvg] = useState<string>("");

  const chart = useMemo(() => props.chart.trim(), [props.chart]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const mermaid: Mermaid = (await import("mermaid")).default;

      mermaid.initialize({
        startOnLoad: false,
        theme: "neutral",
        securityLevel: "strict",
        sequence: {
          showSequenceNumbers: false,
        },
      });

      const { svg } = await mermaid.render(`mmd-${id}`, chart);
      if (cancelled) return;

      // Make SVG responsive.
      const responsiveSvg = svg
        .replace("<svg ", '<svg style="max-width:100%;height:auto;" ')
        .replace(/width="[^"]*"/, "")
        .replace(/height="[^"]*"/, "");

      setSvg(responsiveSvg);
    }

    run().catch(() => {
      // If Mermaid fails, keep page usable (no throw in client).
      if (!cancelled) setSvg("");
    });

    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  return (
    <div
      className={props.className ?? ""}
      style={{ overflowX: "auto" }}
      aria-label="Mermaid diagram"
    >
      {svg ? (
        <div dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <pre className="text-sm text-muted-foreground whitespace-pre-wrap">{chart}</pre>
      )}
    </div>
  );
}


