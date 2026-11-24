"use client";

// Styled like a pre-flight checklist: the task on the left, a dotted
// leader, and the response word on the right once it's ticked.

import { useState, type FormEvent } from "react";
import type { Check } from "@/config";

export type ChecklistItem = Check & { extra: boolean };

type Props = {
  items: ChecklistItem[];
  done: number[];
  onToggle: (i: number) => void;
  onAdd: (task: string) => void;
  onRemove: (i: number) => void;
  onClear: () => void;
};

export function Checklist({ items, done, onToggle, onAdd, onRemove, onClear }: Props) {
  const [draft, setDraft] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault(); // stop the browser from reloading the page
    const task = draft.trim();
    if (!task) return;
    onAdd(task);
    setDraft("");
  }

  return (
    <section aria-labelledby="checklist-title">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="checklist-title" className="mb-3 text-lg font-bold">
          Morning checks
        </h2>
        <button
          type="button"
          onClick={onClear}
          className="cursor-pointer p-1 font-medium text-muted underline underline-offset-[3px]"
        >
          Clear all checks
        </button>
      </div>

      <ul className="border-t-2 border-ink">
        {items.map((item, i) => {
          const isDone = done.includes(i);
          return (
            <li key={`${i}-${item.task}`} className="flex items-center border-b border-rule">
              <label className="flex flex-1 cursor-pointer items-baseline gap-3 px-1 py-3.5">
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={() => onToggle(i)}
                  className="size-[1.15rem] flex-none translate-y-[0.15rem] accent-ok"
                />
                <span className={`flex-1 sm:max-w-[70%] sm:flex-none ${isDone ? "text-muted" : ""}`}>
                  {item.task}
                </span>
                <span
                  className="hidden min-w-4 flex-1 -translate-y-1 border-b-2 border-dotted border-rule sm:block"
                  aria-hidden="true"
                />
                <span className="flex-none font-bold text-ok">{isDone ? item.response : ""}</span>
              </label>

              {item.extra && (
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  aria-label={`Remove "${item.task}"`}
                  className="cursor-pointer px-1 text-muted"
                >
                  ×
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <form onSubmit={submit} className="mt-5 flex gap-2">
        <label htmlFor="new-check" className="sr-only">
          New check
        </label>
        <input
          id="new-check"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a check for today only"
          autoComplete="off"
          className="input"
        />
        <button
          type="submit"
          className="cursor-pointer rounded-md bg-ink px-4 py-2.5 font-bold text-paper"
        >
          Add
        </button>
      </form>
    </section>
  );
}
