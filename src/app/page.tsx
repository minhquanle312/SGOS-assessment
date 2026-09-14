"use client";

import { useRef, useState } from "react";
import AssessmentForm from "@/components/AssessmentForm";
import EvaluationResult from "@/components/EvaluationResult";
import EvaluationHistory, { type EvaluationHistoryHandle } from "@/components/EvaluationHistory";
import ThemeToggle from "@/components/ThemeToggle";
import type { EvaluationRecord } from "@/lib/types";

export default function Home() {
  const [current, setCurrent] = useState<EvaluationRecord | null>(null);
  const [isPastEntry, setIsPastEntry] = useState(false);
  const historyRef = useRef<EvaluationHistoryHandle>(null);

  function handleEvaluated(evaluation: EvaluationRecord) {
    setCurrent(evaluation);
    setIsPastEntry(false);
    historyRef.current?.refresh();
  }

  function handleSelectPast(evaluation: EvaluationRecord) {
    setCurrent(evaluation);
    setIsPastEntry(true);
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
        <header className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Student Development Assistant
            </h1>
            <ThemeToggle />
          </div>
          <p className="max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Tell us about your learning goal, current activities, strengths, challenges
            and short-term goal — the assistant will give you a structured overview,
            key observations, suggested actions and a short-term plan.
          </p>
        </header>

        <AssessmentForm onEvaluated={handleEvaluated} />

        {current && (
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              {isPastEntry ? "Past evaluation" : "Your assessment"}
            </h2>
            <EvaluationResult evaluation={current} isPastEntry={isPastEntry} />
          </section>
        )}

        <section className="flex flex-col gap-2 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">History</h2>
          <EvaluationHistory ref={historyRef} selectedId={current?.id ?? null} onSelect={handleSelectPast} />
        </section>
      </main>
    </div>
  );
}
