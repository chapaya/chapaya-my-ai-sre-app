"use client";

import { useEffect, useReducer, useRef, useState, useSyncExternalStore } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { getSupabase, type NoteRow } from "@/lib/supabase";
import { useSession } from "@/lib/use-session";
import { initialNotesState, notesReducer } from "@/lib/notes-sync";
import { SignInForm } from "./SignInForm";

// One shared note for the whole team, stored in Supabase (see
// supabase/handover_notes.sql). Signed-out visitors see a sign-in form.

const CACHE_KEY = "shift-start:notes-cache";
const SAVE_DELAY_MS = 1000;
const COLUMNS = "body, updated_at, updated_by_email";
const OFFLINE_RETRY_MS = 30_000;

export function HandoverNotes() {
  const configured = getSupabase() !== null;
  const { session, ready } = useSession();
  const online = useOnline();

  return (
    <section aria-labelledby="notes-title">
      <h2 id="notes-title" className="mb-3 text-lg font-bold">
        Handover notes
      </h2>
      {!configured ? (
        <p className="text-sm text-muted">
          Supabase isn&apos;t configured. Set NEXT_PUBLIC_SUPABASE_URL and
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see README).
        </p>
      ) : !ready ? null : session ? (
        <SharedNotes key={session.user.id} session={session} />
      ) : !online && readCache() ? (
        // Offline with an expired login: the saved session can't be refreshed
        // until we're back online, so show the last copy instead of a sign-in form.
        <OfflineCopy row={readCache()!} />
      ) : (
        <SignInForm />
      )}
    </section>
  );
}

function SharedNotes({ session }: { session: Session }) {
  const supabase = getSupabase()!;
  const email = session.user.email ?? null;
  const [state, dispatch] = useReducer(notesReducer, initialNotesState);
  const [attempted, setAttempted] = useState(false);
  const [loadError, setLoadError] = useState("");
  // Text whose save just failed: don't retry it until you edit again.
  const failedText = useRef<string | null>(null);
  const resyncRef = useRef<() => void>(() => {});

  // Load the note now, and re-load it whenever we may have missed changes:
  // back online, back to this tab/app, or live updates reconnecting.
  // Unsaved text is never replaced (see notes-sync.ts).
  useEffect(() => {
    let cancelled = false;
    const resync = () => {
      failedText.current = null; // let a pending edit retry
      fetchNote(supabase).then((result) => {
        if (cancelled) return;
        if (result.ok) {
          dispatch({ type: "loaded", row: result.row });
          writeCache(result.row);
          setLoadError("");
        } else if (result.offline) {
          dispatch({ type: "wentOffline", cached: readCache() });
        } else {
          setLoadError(result.message);
        }
        setAttempted(true);
      });
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") resync();
    };
    resyncRef.current = resync;
    resync();
    window.addEventListener("online", resync);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.removeEventListener("online", resync);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [supabase]);

  // Live updates from teammates.
  useEffect(() => {
    const channel = supabase
      .channel("handover_notes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "handover_notes" },
        (payload) => {
          const row = payload.new as Partial<NoteRow>;
          // Large unchanged values can be left out of the event; fetch instead.
          if (typeof row.body !== "string") return resyncRef.current();
          dispatch({ type: "remoteUpdated", row: row as NoteRow });
          writeCache(row as NoteRow);
        },
      )
      .subscribe((channelStatus) => {
        // Also fires after a reconnect: catch up on anything we missed.
        if (channelStatus === "SUBSCRIBED") resyncRef.current();
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Offline (or Supabase unreachable): keep trying every 30 seconds.
  const isOffline = state.status === "offline";
  useEffect(() => {
    if (!isOffline) return;
    const timer = setInterval(() => resyncRef.current(), OFFLINE_RETRY_MS);
    return () => clearInterval(timer);
  }, [isOffline]);

  // Save about a second after typing stops.
  const { text, dirty, sendingText, status, hasLoaded } = state;
  useEffect(() => {
    if (!hasLoaded || !dirty || sendingText !== null || status === "offline") return;
    if (text === failedText.current) return;

    const timer = setTimeout(async () => {
      dispatch({ type: "saveStarted", text });
      try {
        const { data, error } = await supabase
          .from("handover_notes")
          .update({ body: text, updated_at: new Date().toISOString(), updated_by_email: email })
          .eq("id", 1)
          .select(COLUMNS)
          .single<NoteRow>();
        if (error) throw error;
        failedText.current = null;
        dispatch({ type: "saveSucceeded", row: data });
        writeCache(data);
      } catch {
        failedText.current = text;
        dispatch({ type: "saveFailed" });
      }
    }, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [text, dirty, sendingText, status, hasLoaded, supabase, email]);

  const offline = status === "offline";

  return (
    <>
      {loadError ? (
        <p className="mb-2 text-sm text-signal" role="alert">
          Couldn&apos;t load the notes: {loadError}{" "}
          <button
            type="button"
            onClick={() => resyncRef.current()}
            className="cursor-pointer font-medium underline underline-offset-[3px]"
          >
            Try again
          </button>
        </p>
      ) : null}
      <textarea
        rows={7}
        value={text}
        readOnly={offline || !state.hasLoaded}
        onChange={(e) => dispatch({ type: "edited", text: e.target.value })}
        placeholder={attempted ? "What should the next person know?" : "Loading…"}
        aria-labelledby="notes-title"
        className="input"
      />
      <p className="mt-1.5 min-h-[1.5em] text-sm text-muted" aria-live="polite">
        {statusMessage(state)}
      </p>
      {state.lastEdit ? (
        <p className="text-sm text-muted">
          Last edited by {state.lastEdit.by ?? "someone"} at {formatTime(state.lastEdit.at)}
        </p>
      ) : null}
      <p className="mt-2 text-sm text-muted">
        Signed in as {email} ·{" "}
        <button
          type="button"
          onClick={() => {
            clearCache(); // don't leave the team's notes on a shared device
            supabase.auth.signOut();
          }}
          className="cursor-pointer font-medium underline underline-offset-[3px]"
        >
          Sign out
        </button>
      </p>
    </>
  );
}

function OfflineCopy({ row }: { row: NoteRow }) {
  return (
    <>
      <textarea rows={7} value={row.body} readOnly aria-labelledby="notes-title" className="input" />
      <p className="mt-1.5 text-sm text-muted" aria-live="polite">
        Offline — showing the last saved copy. Sign in again when you&apos;re back online.
      </p>
    </>
  );
}

/** navigator.onLine, kept up to date (true during the server render). */
function useOnline(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener("online", onChange);
      window.addEventListener("offline", onChange);
      return () => {
        window.removeEventListener("online", onChange);
        window.removeEventListener("offline", onChange);
      };
    },
    () => navigator.onLine,
    () => true,
  );
}

function statusMessage(s: typeof initialNotesState): string {
  if (s.status === "offline") return "Offline — showing the last saved copy";
  if (s.conflictBy) return `Updated by ${s.conflictBy} — your next save will replace it.`;
  if (s.status === "saving") return "Saving…";
  if (s.status === "error") return "Couldn't save — check your connection";
  if (s.status === "saved") return "Saved";
  return "";
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

type LoadResult =
  | { ok: true; row: NoteRow }
  | { ok: false; offline: boolean; message: string };

async function fetchNote(supabase: SupabaseClient): Promise<LoadResult> {
  try {
    const { data, error } = await supabase
      .from("handover_notes")
      .select(COLUMNS)
      .eq("id", 1)
      .single<NoteRow>();
    if (error) throw error;
    return { ok: true, row: data };
  } catch (err) {
    return { ok: false, offline: isNetworkError(err), message: errorMessage(err) };
  }
}

function errorMessage(err: unknown): string {
  return String((err as { message?: string })?.message ?? err);
}

function isNetworkError(err: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  const message = errorMessage(err);
  return /fetch|network|load failed/i.test(message);
}

// localStorage can throw (private windows, blocked storage), so guard it.
function readCache(): NoteRow | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as NoteRow) : null;
  } catch {
    return null;
  }
}

function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    /* storage unavailable */
  }
}

function writeCache(row: NoteRow) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(row));
  } catch {
    /* storage unavailable */
  }
}
