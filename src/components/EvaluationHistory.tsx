"use client";

import { useEffect, useState, useImperativeHandle, forwardRef } from "react";
import type { EvaluationListItem, EvaluationRecord } from "@/lib/types";

export type EvaluationHistoryHandle = {
  refresh: () => void;
};

const EvaluationHistory = forwardRef<
  EvaluationHistoryHandle,
  { selectedId: string | null; onSelect: (evaluation: EvaluationRecord) => void }
>(function EvaluationHistory({ selectedId, onSelect }, ref) {
  const [items, setItems] = useState<EvaluationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function fetchList() {
    setLoading(true);
    try {
      const res = await fetch("/api/evaluations");
      const data = await res.json();
      setItems(res.ok ? data.items : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
  }, []);

  useImperativeHandle(ref, () => ({ refresh: fetchList }));

  async function handleSelect(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/evaluations/${id}`);
      const data = await res.json();
      if (res.ok) onSelect(data as EvaluationRecord);
    } finally {
      setLoadingId(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-500">Loading history...</p>;
  }

  if (items.length === 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-500">No evaluations yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => handleSelect(item.id)}
            disabled={loadingId === item.id}
            className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors disabled:opacity-60 ${
              selectedId === item.id
                ? "border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-900"
                : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
            }`}
          >
            <div className="truncate font-medium text-zinc-800 dark:text-zinc-200">
              {item.learningGoal}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-500">
              {new Date(item.createdAt).toLocaleString()}
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
});

export default EvaluationHistory;
