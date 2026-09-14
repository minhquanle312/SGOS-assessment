import type { EvaluationRecord } from "@/lib/types";

export default function EvaluationResult({
  evaluation,
  isPastEntry = false,
}: {
  evaluation: EvaluationRecord;
  isPastEntry?: boolean;
}) {
  const { input, output } = evaluation;

  return (
    <div className="flex flex-col gap-4">
      {isPastEntry && (
        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            What you entered
          </h2>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
            <Field label="Learning goal" value={input.learningGoal} />
            <Field label="Short-term goal" value={input.shortTermGoal} />
            <Field label="Current activities" value={input.currentActivities} />
            <Field label="Strengths" value={input.strengths} />
            <Field label="Challenges" value={input.challenges} />
          </dl>
        </div>
      )}

      <Section title="Student Overview">
        <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">{output.summary}</p>
      </Section>
      <Section title="Key Observations">
        <List items={output.observations} />
      </Section>
      <Section title="Suggested Actions">
        <List items={output.suggested_actions} />
      </Section>
      <Section title="Short-term Plan">
        <List items={output.short_term_plan} ordered />
      </Section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-zinc-500 dark:text-zinc-500">{label}</dt>
      <dd className="text-zinc-800 dark:text-zinc-200">{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {title}
      </h2>
      {children}
    </div>
  );
}

function List({ items, ordered = false }: { items: string[]; ordered?: boolean }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag className={`flex flex-col gap-1.5 text-sm leading-6 text-zinc-700 dark:text-zinc-300 ${ordered ? "list-decimal pl-5" : "list-disc pl-5"}`}>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </Tag>
  );
}
