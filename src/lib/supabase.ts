// -----------------------------------------------------------------
// The Supabase connection, used only in the browser / Android app.
//
// The publishable key is meant to be public: what a visitor can read
// or change is decided by the row-level security rules in
// supabase/handover_notes.sql, not by keeping this key secret.
// -----------------------------------------------------------------

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** The single row of the `handover_notes` table (id is always 1). */
export type NoteRow = {
  body: string;
  updated_at: string;
  updated_by_email: string | null;
};

// Read as literal property names so Next.js can inline them at build time.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let client: SupabaseClient | null = null;

/** The shared client, or null when the Supabase settings are missing. */
export function getSupabase(): SupabaseClient | null {
  if (!url || !key) return null;
  client ??= createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return client;
}
