"use client";

import { useState, type FormEvent } from "react";
import { getSupabase } from "@/lib/supabase";

/** Email + password sign-in. Accounts are created in the Supabase dashboard. */
export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;
    setPending(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } catch {
      setError("Couldn't reach the server. Check your connection.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <p className="text-sm text-muted">Sign in to read and write the team&apos;s notes.</p>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Email
        <input
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Password
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer self-start rounded-md bg-ink px-4 py-2.5 font-bold text-paper disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="min-h-[1.5em] text-sm text-signal" role="alert">
        {error}
      </p>
    </form>
  );
}
