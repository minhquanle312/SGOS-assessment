"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { EvaluationRecord } from "@/lib/types";

type FieldKey =
  | "learningGoal"
  | "currentActivities"
  | "strengths"
  | "challenges"
  | "shortTermGoal";

const FIELDS: { key: FieldKey; label: string; placeholder: string; rows: number }[] = [
  {
    key: "learningGoal",
    label: "Learning goal",
    placeholder: "e.g. Become job-ready as a frontend developer in 6 months",
    rows: 2,
  },
  {
    key: "currentActivities",
    label: "Current learning activities",
    placeholder: "e.g. Doing a React course on Udemy, building a portfolio site",
    rows: 3,
  },
  {
    key: "strengths",
    label: "Strengths",
    placeholder: "e.g. Consistent with daily practice, good at debugging",
    rows: 2,
  },
  {
    key: "challenges",
    label: "Challenges",
    placeholder: "e.g. Struggle to finish projects, easily distracted",
    rows: 2,
  },
  {
    key: "shortTermGoal",
    label: "Short-term goal",
    placeholder: "e.g. Ship one complete project in the next 4 weeks",
    rows: 2,
  },
];

const EMPTY_FORM: Record<FieldKey, string> = {
  learningGoal: "",
  currentActivities: "",
  strengths: "",
  challenges: "",
  shortTermGoal: "",
};

type Status = "idle" | "loading" | "error";

export default function AssessmentForm({
  onEvaluated,
}: {
  onEvaluated: (evaluation: EvaluationRecord) => void;
}) {
  const [form, setForm] = useState<Record<FieldKey, string>>(EMPTY_FORM);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isFormValid = FIELDS.every((f) => form[f.key].trim().length > 0);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isFormValid) {
      setStatus("error");
      setErrorMessage("Please fill in all fields before submitting.");
      return;
    }

    setStatus("loading");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data?.error ?? "Something went wrong. Please try again.");
        return;
      }

      setStatus("idle");
      onEvaluated(data as EvaluationRecord);
    } catch {
      setStatus("error");
      setErrorMessage("Could not reach the server. Check your connection and try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5" noValidate>
      {FIELDS.map((field) => (
        <div key={field.key} className="flex flex-col gap-1.5">
          <label htmlFor={field.key} className="text-sm font-medium text-foreground">
            {field.label}
          </label>
          <textarea
            id={field.key}
            rows={field.rows}
            placeholder={field.placeholder}
            value={form[field.key]}
            onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30 dark:disabled:bg-input/80"
          />
        </div>
      ))}

      <div className="mt-1 flex justify-end">
        <Button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Analyzing..." : "Get my plan"}
        </Button>
      </div>

      {status === "error" && errorMessage && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </p>
      )}
    </form>
  );
}
