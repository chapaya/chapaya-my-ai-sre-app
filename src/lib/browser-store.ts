"use client";

// -----------------------------------------------------------------
// Saving to the browser, the React way.
//
// Next.js first renders the page on the server, where there is no
// localStorage and no "your" date. useSyncExternalStore lets React
// render a placeholder on the server (getServerSnapshot) and then
// switch to the real browser value right after the page loads,
// without hydration errors and without a useEffect.
// -----------------------------------------------------------------

import { useCallback, useMemo, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // "storage" fires when another tab changes the same data.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

// localStorage can throw (private windows, blocked storage), so guard it.
function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Like useState, but the value is saved in this browser.
 * `ready` is false during the server render, true once in the browser.
 */
export function useStoredValue<T>(key: string, fallback: T) {
  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(key),
    () => undefined, // server: nothing stored yet
  );

  // Strings are compared by value, so parse only when the text changes.
  const value = useMemo<T>(() => {
    if (raw == null) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fallback is a constant
  }, [raw]);

  const setValue = useCallback(
    (next: T) => {
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* storage unavailable: nothing to save to */
      }
      listeners.forEach((notify) => notify());
    },
    [key],
  );

  return { value, setValue, ready: raw !== undefined };
}

/** Today's date as "2026-11-24" in the viewer's time zone, or "" on the server. */
export function useToday() {
  return useSyncExternalStore(
    () => () => {},
    () => {
      const d = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    },
    () => "",
  );
}
