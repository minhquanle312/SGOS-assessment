"use client";

import { useRef, useState } from "react";
import AssessmentForm from "@/components/AssessmentForm";
import EvaluationResult from "@/components/EvaluationResult";
import AppSidebar, { type AppSidebarHandle } from "@/components/AppSidebar";
import ThemeToggle from "@/components/ThemeToggle";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import type { EvaluationRecord } from "@/lib/types";

type ViewMode = "form" | "result" | "history";

export default function Home() {
  const [mode, setMode] = useState<ViewMode>("form");
  const [current, setCurrent] = useState<EvaluationRecord | null>(null);
  const sidebarRef = useRef<AppSidebarHandle>(null);

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
    <SidebarProvider>
      <AppSidebar ref={sidebarRef} selectedId={current?.id ?? null} onSelect={handleSelectPast} onNewEvaluation={handleNewEvaluation} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
          <SidebarTrigger />
          <h1 className="text-sm font-semibold">Student Development Assistant</h1>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-8">
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
                  {mode === "history" ? "Past evaluation" : "Your assessment"}
                </h2>
                <Button variant="outline" size="sm" onClick={handleNewEvaluation}>
                  New evaluation
                </Button>
              </div>
              <EvaluationResult evaluation={current} isPastEntry={mode === "history"} />
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
