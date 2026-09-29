begin;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (name = btrim(name) and char_length(name) between 1 and 50),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create unique index categories_owner_name on public.categories (user_id, lower(name));

create table public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (title = btrim(title) and char_length(title) between 1 and 120),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  priority_id smallint not null default 2 check (priority_id between 1 and 4),
  category_id uuid,
  foreign key (category_id, user_id) references public.categories (id, user_id)
);

create index todos_owner_created on public.todos (user_id, created_at, id);
create index todos_owner_category on public.todos (user_id, category_id);

alter table public.categories enable row level security;
alter table public.todos enable row level security;

revoke all on public.categories, public.todos from anon, authenticated;
grant select, insert, update, delete on public.categories, public.todos to authenticated;

create policy categories_select on public.categories for select to authenticated
  using ((select auth.uid()) = user_id);
create policy categories_insert on public.categories for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy categories_update on public.categories for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy categories_delete on public.categories for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy todos_select on public.todos for select to authenticated
  using ((select auth.uid()) = user_id);
create policy todos_insert on public.todos for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy todos_update on public.todos for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy todos_delete on public.todos for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Import is an explicit, atomic operation and is allowed only into an empty account.
-- Invoker permissions and RLS remain active throughout the function.
create function public.import_browser_data(expected_user_id uuid, category_rows jsonb, todo_rows jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in before importing tasks.';
  end if;
  if auth.uid() is distinct from expected_user_id then
    raise exception 'Your account changed. Please sign in again before importing.';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text, 0));
  if exists (select 1 from public.categories where user_id = auth.uid())
    or exists (select 1 from public.todos where user_id = auth.uid()) then
    raise exception 'Import is available only for an empty account.';
  end if;

  insert into public.categories (id, user_id, name)
    select (value ->> 'id')::uuid, auth.uid(), value ->> 'name'
    from pg_catalog.jsonb_array_elements(category_rows) as entry(value);

  insert into public.todos (id, user_id, title, completed, created_at, priority_id, category_id)
    select (value ->> 'id')::uuid, auth.uid(), value ->> 'title',
      (value ->> 'completed')::boolean, (value ->> 'created_at')::timestamptz,
      (value ->> 'priority_id')::smallint, (value ->> 'category_id')::uuid
    from pg_catalog.jsonb_array_elements(todo_rows) as entry(value);
end;
$$;

revoke all on function public.import_browser_data(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.import_browser_data(uuid, jsonb, jsonb) to authenticated;

commit;
