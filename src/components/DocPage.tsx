"use client";

import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import MarkdownView from "@/components/MarkdownView";
import type { EvaluationRecord } from "@/lib/types";

export default function DocPage({ title, content }: { title: string; content: string }) {
  const router = useRouter();

  function handleSelect(evaluation: EvaluationRecord) {
    router.push(`/?evaluationId=${evaluation.id}`);
  }

  function handleNewEvaluation() {
    router.push("/");
  }

  return (
    <AppShell title={title} selectedId={null} onSelect={handleSelect} onNewEvaluation={handleNewEvaluation} wide>
      <MarkdownView content={content} />
    </AppShell>
  );
}
