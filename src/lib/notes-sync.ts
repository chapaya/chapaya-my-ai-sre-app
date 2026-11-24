// -----------------------------------------------------------------
// The rules for the shared handover note, kept free of React and
// Supabase so they can be unit-tested (see notes-sync.test.ts).
//
// - Your typing is never overwritten by a teammate's save. If one
//   arrives while you have unsaved text, you keep yours and see who
//   saved; your next save wins ("last save wins").
// - Supabase echoes your own saves back over Realtime; those are
//   recognised and ignored.
// - Re-loading the note (coming back online, returning to the app)
//   follows the same rule: unsaved text is never replaced.
// - Nothing can be typed until the note has loaded once, so a failed
//   load can't lead to an empty box overwriting the team's note.
// -----------------------------------------------------------------

import type { NoteRow } from "./supabase";

export type NotesState = {
  /** What the textarea shows. */
  text: string;
  /** Last text the server confirmed. */
  savedText: string;
  /** Text currently being sent, if a save is in flight. */
  sendingText: string | null;
  status: "idle" | "saving" | "saved" | "error" | "offline";
  /** True when `text` has changes the server hasn't confirmed. */
  dirty: boolean;
  /** Email of a teammate whose update we didn't apply because you were typing. */
  conflictBy: string | null;
  /** That teammate's update, applied if you undo your own changes. */
  pendingRemote: NoteRow | null;
  /** True once the note has been loaded from the server at least once. */
  hasLoaded: boolean;
  lastEdit: { by: string | null; at: string } | null;
};

export type NotesAction =
  | { type: "loaded"; row: NoteRow }
  | { type: "edited"; text: string }
  | { type: "saveStarted"; text: string }
  | { type: "saveSucceeded"; row: NoteRow }
  | { type: "saveFailed" }
  | { type: "remoteUpdated"; row: NoteRow }
  | { type: "wentOffline"; cached: NoteRow | null };

export const initialNotesState: NotesState = {
  text: "",
  savedText: "",
  sendingText: null,
  status: "idle",
  dirty: false,
  conflictBy: null,
  pendingRemote: null,
  hasLoaded: false,
  lastEdit: null,
};

const editOf = (row: NoteRow) => ({ by: row.updated_by_email, at: row.updated_at });

/** Show `row` as the current server copy, replacing what's in the box. */
const applyRow = (s: NotesState, row: NoteRow): NotesState => ({
  ...s,
  text: row.body,
  savedText: row.body,
  dirty: false,
  conflictBy: null,
  pendingRemote: null,
  lastEdit: editOf(row),
});

/** A teammate changed the note while you have unsaved text: keep yours. */
const keepLocal = (s: NotesState, row: NoteRow): NotesState => ({
  ...s,
  conflictBy: row.updated_by_email ?? "a teammate",
  pendingRemote: row,
});

export function notesReducer(s: NotesState, a: NotesAction): NotesState {
  switch (a.type) {
    case "loaded": {
      const base = { ...s, hasLoaded: true, status: s.status === "offline" ? "idle" : s.status } as NotesState;
      if (!s.dirty) return applyRow(base, a.row);
      // Unsaved text: keep it. Flag a conflict only if someone else changed the note.
      const changedByOthers = a.row.body !== s.savedText && a.row.body !== s.sendingText;
      return changedByOthers ? keepLocal(base, a.row) : base;
    }

    case "edited": {
      if (!s.hasLoaded) return s;
      const dirty = a.text !== s.savedText;
      // You undid your changes: now show the teammate's update you skipped.
      if (!dirty && s.pendingRemote) return applyRow({ ...s, text: a.text }, s.pendingRemote);
      return { ...s, text: a.text, dirty };
    }

    case "saveStarted":
      return { ...s, sendingText: a.text, status: "saving" };

    case "saveSucceeded":
      return {
        ...s,
        savedText: a.row.body,
        sendingText: null,
        status: "saved",
        dirty: s.text !== a.row.body,
        conflictBy: null,
        pendingRemote: null,
        lastEdit: editOf(a.row),
      };

    case "saveFailed":
      return { ...s, sendingText: null, status: "error", dirty: true };

    case "remoteUpdated": {
      // Our own save coming back over Realtime.
      if (a.row.body === s.savedText || a.row.body === s.sendingText) return s;
      if (s.dirty) return keepLocal(s, a.row);
      return applyRow(s, a.row);
    }

    case "wentOffline":
      // Unsaved text stays (read-only) until you're back online.
      if (s.dirty) return { ...s, sendingText: null, status: "offline" };
      return {
        ...initialNotesState,
        hasLoaded: s.hasLoaded,
        text: a.cached?.body ?? "",
        savedText: a.cached?.body ?? "",
        status: "offline",
        lastEdit: a.cached ? editOf(a.cached) : null,
      };
  }
}
