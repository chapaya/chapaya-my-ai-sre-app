"use client";

import { useState } from "react";
import { useStoredValue } from "@/lib/browser-store";

export function HandoverNotes() {
  const { value, setValue } = useStoredValue("shift-start:notes", "");
  const [saved, setSaved] = useState(false);

  return (
    <section aria-labelledby="notes-title">
      <h2 id="notes-title" className="mb-3 text-lg font-bold">
        Handover notes
      </h2>
      <textarea
        rows={7}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(true);
        }}
        placeholder="What should the next person know?"
        aria-labelledby="notes-title"
        className="input"
      />
      <p className="mt-1.5 min-h-[1.5em] text-sm text-muted" aria-live="polite">
        {saved ? "Saved in this browser" : ""}
      </p>
    </section>
  );
}
