"use client";

// The interactive part of the page. It owns the checklist state,
// because both the headline and the checklist need it.
// The sidebar arrives as a prop, so it can stay a Server Component.

import type { ReactNode } from "react";
import { CHECKS } from "@/config";
import { useStoredValue, useToday } from "@/lib/browser-store";
import { Masthead } from "./Masthead";
import { Checklist, type ChecklistItem } from "./Checklist";

type DayState = {
  done: number[];   // indexes of ticked checks
  extra: string[];  // checks added for today only
};

const EMPTY_DAY: DayState = { done: [], extra: [] };

export function ShiftStart({ sidebar }: { sidebar: ReactNode }) {
  const today = useToday();
  // One key per day, so every morning starts fresh.
  const { value: day, setValue: setDay, ready } = useStoredValue<DayState>(
    `shift-start:${today}`,
    EMPTY_DAY,
  );

  const items: ChecklistItem[] = [
    ...CHECKS.map((c) => ({ ...c, extra: false })),
    ...day.extra.map((task) => ({ task, response: "Done", extra: true })),
  ];

  function toggle(i: number) {
    const done = day.done.includes(i)
      ? day.done.filter((n) => n !== i)
      : [...day.done, i];
    setDay({ ...day, done });
  }

  function add(task: string) {
    setDay({ ...day, extra: [...day.extra, task] });
  }

  function remove(i: number) {
    const extraIndex = i - CHECKS.length;
    setDay({
      extra: day.extra.filter((_, n) => n !== extraIndex),
      // Indexes after the removed item shift down by one.
      done: day.done.filter((n) => n !== i).map((n) => (n > i ? n - 1 : n)),
    });
  }

  return (
    <>
      <Masthead
        today={today}
        total={items.length}
        done={day.done.length}
        ready={ready && today !== ""}
      />

      <main className="mx-auto grid max-w-6xl items-start gap-10 px-4 pb-16 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] md:gap-12">
        <Checklist
          items={items}
          done={day.done}
          onToggle={toggle}
          onAdd={add}
          onRemove={remove}
          onClear={() => setDay({ ...day, done: [] })}
        />
        <aside className="grid gap-10">{sidebar}</aside>
      </main>
    </>
  );
}
