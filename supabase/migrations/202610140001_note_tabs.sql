begin;

-- Named tabs that group notes. A note without a tab belongs to the built-in General tab,
-- so existing notes need no data migration.
create table public.note_tabs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (name = btrim(name) and char_length(name) between 1 and 50),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create unique index note_tabs_owner_name on public.note_tabs (user_id, lower(name));
create index note_tabs_owner_created on public.note_tabs (user_id, created_at, id);

-- Deleting a tab moves its notes to General. Only tab_id becomes NULL; the composite key
-- keeps user_id required and prevents assigning a tab from another account.
alter table public.notes
  add column title text not null default ''
    check (title = btrim(title) and char_length(title) <= 120),
  add column tab_id uuid,
  add constraint notes_tab_id_user_id_fkey
    foreign key (tab_id, user_id) references public.note_tabs (id, user_id)
    on delete set null (tab_id);

create index notes_owner_tab on public.notes (user_id, tab_id);

alter table public.note_tabs enable row level security;

revoke all on public.note_tabs from anon, authenticated;
grant select, insert, update, delete on public.note_tabs to authenticated;

create policy note_tabs_select on public.note_tabs for select to authenticated
  using ((select auth.uid()) = user_id);
create policy note_tabs_insert on public.note_tabs for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy note_tabs_update on public.note_tabs for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy note_tabs_delete on public.note_tabs for delete to authenticated
  using ((select auth.uid()) = user_id);

commit;
