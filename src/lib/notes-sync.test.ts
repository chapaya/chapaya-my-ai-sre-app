import { describe, expect, test } from "vitest";
import { initialNotesState, notesReducer, type NotesState } from "./notes-sync";
import type { NoteRow } from "./supabase";

const row = (body: string, by: string | null = "alex@example.com"): NoteRow => ({
  body,
  updated_at: "2026-11-24T09:42:00.000Z",
  updated_by_email: by,
});

function run(...actions: Parameters<typeof notesReducer>[1][]): NotesState {
  return actions.reduce(notesReducer, initialNotesState);
}

describe("notesReducer", () => {
  test("loaded sets text and lastEdit", () => {
    const s = run({ type: "loaded", row: row("hello") });
    expect(s.text).toBe("hello");
    expect(s.savedText).toBe("hello");
    expect(s.dirty).toBe(false);
    expect(s.status).toBe("idle");
    expect(s.lastEdit).toEqual({ by: "alex@example.com", at: "2026-11-24T09:42:00.000Z" });
  });

  test("edited marks dirty", () => {
    const s = run({ type: "loaded", row: row("a") }, { type: "edited", text: "ab" });
    expect(s.text).toBe("ab");
    expect(s.dirty).toBe(true);
    expect(s.conflictBy).toBeNull();
  });

  test("saveSucceeded with same text clears dirty", () => {
    const s = run(
      { type: "loaded", row: row("") },
      { type: "edited", text: "a" },
      { type: "saveStarted", text: "a" },
      { type: "saveSucceeded", row: row("a", "me@example.com") },
    );
    expect(s.status).toBe("saved");
    expect(s.savedText).toBe("a");
    expect(s.dirty).toBe(false);
    expect(s.lastEdit?.by).toBe("me@example.com");
  });

  test("echo of own save while typing more", () => {
    const s = run(
      { type: "loaded", row: row("") },
      { type: "edited", text: "a" },
      { type: "saveStarted", text: "a" },
      { type: "edited", text: "ab" },
      { type: "saveSucceeded", row: row("a", "me@example.com") },
    );
    expect(s.text).toBe("ab");
    expect(s.dirty).toBe(true);
    expect(s.status).toBe("saved");
  });

  test("remote update while clean replaces text", () => {
    const s = run({ type: "loaded", row: row("old") }, { type: "remoteUpdated", row: row("new", "sam@example.com") });
    expect(s.text).toBe("new");
    expect(s.savedText).toBe("new");
    expect(s.conflictBy).toBeNull();
    expect(s.lastEdit?.by).toBe("sam@example.com");
  });

  test("remote update while dirty keeps local text", () => {
    const s = run(
      { type: "loaded", row: row("old") },
      { type: "edited", text: "mine" },
      { type: "remoteUpdated", row: row("theirs", "sam@example.com") },
    );
    expect(s.text).toBe("mine");
    expect(s.dirty).toBe(true);
    expect(s.conflictBy).toBe("sam@example.com");
  });

  test("remote update equal to own savedText is ignored", () => {
    const s = run(
      { type: "loaded", row: row("") },
      { type: "edited", text: "a" },
      { type: "saveStarted", text: "a" },
      { type: "saveSucceeded", row: row("a", "me@example.com") },
      { type: "edited", text: "ab" },
      { type: "remoteUpdated", row: row("a", "me@example.com") },
    );
    expect(s.text).toBe("ab");
    expect(s.conflictBy).toBeNull();
  });

  test("remote echo of an in-flight save is ignored", () => {
    const s = run(
      { type: "loaded", row: row("") },
      { type: "edited", text: "a" },
      { type: "saveStarted", text: "a" },
      { type: "edited", text: "ab" },
      { type: "remoteUpdated", row: row("a", "me@example.com") },
    );
    expect(s.text).toBe("ab");
    expect(s.conflictBy).toBeNull();
  });

  test("save failure keeps text and marks dirty", () => {
    const s = run(
      { type: "loaded", row: row("") },
      { type: "edited", text: "a" },
      { type: "saveStarted", text: "a" },
      { type: "saveFailed" },
    );
    expect(s.status).toBe("error");
    expect(s.dirty).toBe(true);
    expect(s.text).toBe("a");
  });

  test("wentOffline shows cached copy", () => {
    expect(run({ type: "wentOffline", cached: row("cached") }).text).toBe("cached");
    const empty = run({ type: "wentOffline", cached: null });
    expect(empty.text).toBe("");
    expect(empty.status).toBe("offline");
  });

  test("saveSucceeded clears conflictBy", () => {
    const s = run(
      { type: "loaded", row: row("old") },
      { type: "edited", text: "mine" },
      { type: "remoteUpdated", row: row("theirs", "sam@example.com") },
      { type: "saveStarted", text: "mine" },
      { type: "saveSucceeded", row: row("mine", "me@example.com") },
    );
    expect(s.conflictBy).toBeNull();
  });

  test("edits are ignored before the note has loaded", () => {
    const s = run({ type: "edited", text: "oops" });
    expect(s.text).toBe("");
    expect(s.dirty).toBe(false);
  });

  test("loaded marks the note as loaded", () => {
    expect(initialNotesState.hasLoaded).toBe(false);
    expect(run({ type: "loaded", row: row("x") }).hasLoaded).toBe(true);
  });

  test("loaded while dirty keeps local text when nobody else changed it", () => {
    const s = run(
      { type: "loaded", row: row("old") },
      { type: "edited", text: "mine" },
      { type: "saveStarted", text: "mine" },
      { type: "saveFailed" },
      { type: "loaded", row: row("old") },
    );
    expect(s.text).toBe("mine");
    expect(s.dirty).toBe(true);
    expect(s.conflictBy).toBeNull();
  });

  test("loaded while dirty with a teammate's change keeps local text and shows conflict", () => {
    const s = run(
      { type: "loaded", row: row("old") },
      { type: "edited", text: "mine" },
      { type: "loaded", row: row("theirs", "sam@example.com") },
    );
    expect(s.text).toBe("mine");
    expect(s.dirty).toBe(true);
    expect(s.conflictBy).toBe("sam@example.com");
  });

  test("loaded after offline clears offline status", () => {
    const s = run({ type: "wentOffline", cached: row("cached") }, { type: "loaded", row: row("fresh") });
    expect(s.status).toBe("idle");
    expect(s.text).toBe("fresh");
  });

  test("wentOffline while dirty keeps local text", () => {
    const s = run(
      { type: "loaded", row: row("old") },
      { type: "edited", text: "mine" },
      { type: "wentOffline", cached: row("old") },
    );
    expect(s.text).toBe("mine");
    expect(s.dirty).toBe(true);
    expect(s.status).toBe("offline");
  });

  test("undoing edits after a conflict applies the teammate's update", () => {
    const s = run(
      { type: "loaded", row: row("old") },
      { type: "edited", text: "mine" },
      { type: "remoteUpdated", row: row("theirs", "sam@example.com") },
      { type: "edited", text: "old" },
    );
    expect(s.text).toBe("theirs");
    expect(s.savedText).toBe("theirs");
    expect(s.dirty).toBe(false);
    expect(s.conflictBy).toBeNull();
  });
});
