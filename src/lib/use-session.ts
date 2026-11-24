"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";

/**
 * The signed-in Supabase session (or null), kept up to date on sign-in,
 * sign-out and token refresh. `ready` is false until the saved session
 * has been read, so the page doesn't flash the sign-in form.
 */
export function useSession(): { session: Session | null; ready: boolean } {
  const [state, setState] = useState<{ session: Session | null; ready: boolean }>({
    session: null,
    ready: false,
  });

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => setState({ session: data.session, ready: true }));
    const { data } = supabase.auth.onAuthStateChange((_event, session) =>
      setState({ session, ready: true }),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  return state;
}
