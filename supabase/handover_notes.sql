-- Shift Start: one shared handover note for the team.
-- Paste into Supabase → SQL Editor → Run. Safe to run again.

create table if not exists public.handover_notes (
  id               smallint primary key default 1 check (id = 1),
  body             text        not null default '',
  updated_at       timestamptz not null default now(),
  updated_by_email text
);

-- The single shared note.
insert into public.handover_notes (id) values (1) on conflict (id) do nothing;

-- Only signed-in users can read or edit it. No insert/delete policies,
-- so nobody can add or remove rows from the app. Signed-out visitors get nothing.
alter table public.handover_notes enable row level security;

-- Table access for signed-in users only (the policies below narrow it further).
revoke all on public.handover_notes from anon;
grant select, update on public.handover_notes to authenticated;

drop policy if exists "signed-in users can read the note" on public.handover_notes;
create policy "signed-in users can read the note"
  on public.handover_notes for select
  to authenticated
  using (true);

drop policy if exists "signed-in users can edit the note" on public.handover_notes;
create policy "signed-in users can edit the note"
  on public.handover_notes for update
  to authenticated
  using (true)
  with check (id = 1);

-- Live updates: send changes to open pages.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'handover_notes'
  ) then
    alter publication supabase_realtime add table public.handover_notes;
  end if;
end $$;
