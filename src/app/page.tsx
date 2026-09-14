"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import AssessmentForm from "@/components/AssessmentForm";
import EvaluationResult from "@/components/EvaluationResult";
import AppShell from "@/components/AppShell";
import { type AppSidebarHandle } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import type { EvaluationRecord } from "@/lib/types";

type ViewMode = "form" | "result" | "history";

function HomeContent() {
  const [mode, setMode] = useState<ViewMode>("form");
  const [current, setCurrent] = useState<EvaluationRecord | null>(null);
  const sidebarRef = useRef<AppSidebarHandle>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const evaluationId = searchParams.get("evaluationId");
    if (!evaluationId) return;

    let cancelled = false;
    fetch(`/api/evaluations/${evaluationId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          setCurrent(data as EvaluationRecord);
          setMode("history");
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount, driven by initial URL only
  }, []);

  function handleEvaluated(evaluation: EvaluationRecord) {
    setCurrent(evaluation);
    setMode("result");
    sidebarRef.current?.refresh();
  }

  function handleSelectPast(evaluation: EvaluationRecord) {
    setCurrent(evaluation);
    setMode("history");
  }

  function handleNewEvaluation() {
    setCurrent(null);
    setMode("form");
  }

  return (
    <AppShell
      title="Student Development Assistant"
      selectedId={current?.id ?? null}
      onSelect={handleSelectPast}
      onNewEvaluation={handleNewEvaluation}
      sidebarRef={sidebarRef}
    >
      {mode === "form" && (
        <>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Tell us about your learning goal, current activities, strengths, challenges
            and short-term goal — the assistant will give you a structured overview,
            key observations, suggested actions and a short-term plan.
          </p>
          <AssessmentForm onEvaluated={handleEvaluated} />
        </>
      )}

      {(mode === "result" || mode === "history") && current && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {mode === "history" ? "Past evaluation" : "Your plan"}
            </h2>
            <Button variant="outline" size="sm" onClick={handleNewEvaluation}>
              New evaluation
            </Button>
          </div>
          <EvaluationResult evaluation={current} isPastEntry={mode === "history"} />
        </div>
      )}
    </AppShell>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
