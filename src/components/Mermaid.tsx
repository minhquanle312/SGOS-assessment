"use client";

import { useEffect, useId, useRef, useState } from "react";

export default function Mermaid({ chart }: { chart: string }) {
  const id = useId().replace(/:/g, "-");
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    import("mermaid").then(async ({ default: mermaid }) => {
      const isDark = document.documentElement.classList.contains("dark");
      mermaid.initialize({ startOnLoad: false, theme: isDark ? "dark" : "default" });
      try {
        const { svg } = await mermaid.render(`mermaid-${id}`, chart);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch {
        if (!cancelled) setError("Không render được diagram này.");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (error) {
    return <pre className="text-sm text-destructive">{error}</pre>;
  }

  return <div ref={containerRef} className="not-prose flex justify-center overflow-x-auto" />;
}
