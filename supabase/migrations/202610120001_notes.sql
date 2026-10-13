begin;

-- An optional note attached to a single task.
alter table public.todos
  add column note text check (note is null or char_length(note) between 1 and 2000);

-- Standalone notes, independent of tasks. A new note starts empty and is autosaved.
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null default '' check (char_length(body) <= 10000),
  created_at timestamptz not null default now()
);

create index notes_owner_created on public.notes (user_id, created_at, id);

alter table public.notes enable row level security;

revoke all on public.notes from anon, authenticated;
grant select, insert, update, delete on public.notes to authenticated;

create policy notes_select on public.notes for select to authenticated
  using ((select auth.uid()) = user_id);
create policy notes_insert on public.notes for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy notes_update on public.notes for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy notes_delete on public.notes for delete to authenticated
  using ((select auth.uid()) = user_id);

commit;
