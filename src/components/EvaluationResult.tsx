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
        <div className="rounded-md border border-border bg-muted/50 p-4 text-sm">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
        <p className="text-sm leading-6 text-foreground/90">{output.summary}</p>
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
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {children}
    </div>
  );
}

function List({ items, ordered = false }: { items: string[]; ordered?: boolean }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag className={`flex flex-col gap-1.5 text-sm leading-6 text-foreground/90 ${ordered ? "list-decimal pl-5" : "list-disc pl-5"}`}>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </Tag>
  );
}
