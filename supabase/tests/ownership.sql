-- Run after the migration in Supabase SQL Editor. All test records are rolled back.
begin;
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000000001', 'rls-test-a@example.invalid'),
  ('00000000-0000-4000-8000-000000000002', 'rls-test-b@example.invalid');
insert into public.categories (id, user_id, name) values
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'Test A'),
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002', 'Test B');
insert into public.todos (id, user_id, title, category_id) values
  ('20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'Test A task', '10000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002', 'Test B task', '10000000-0000-4000-8000-000000000002');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
do $$
declare changed integer;
begin
  if (select count(*) from public.todos) <> 1 or (select count(*) from public.categories) <> 1 then
    raise exception 'RLS failed: another account is visible.';
  end if;
  update public.todos set completed = true where id = '20000000-0000-4000-8000-000000000002';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'RLS failed: another account can be updated.'; end if;
  delete from public.todos where id = '20000000-0000-4000-8000-000000000002';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'RLS failed: another account can be deleted.'; end if;
  begin
    insert into public.todos (user_id, title) values ('00000000-0000-4000-8000-000000000002', 'Forbidden');
    raise exception 'RLS failed: another owner can be supplied.';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.todos set category_id = '10000000-0000-4000-8000-000000000002';
    raise exception 'Ownership failed: a category from another account can be assigned.';
  exception when foreign_key_violation then null;
  end;
  update public.todos set completed = true;
  if not (select completed from public.todos) then raise exception 'Own task update failed.'; end if;
end;
$$;

set local role anon;
do $$
begin
  begin
    perform 1 from public.todos;
    raise exception 'Unauthenticated access to tasks is allowed.';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.categories;
    raise exception 'Unauthenticated access to categories is allowed.';
  exception when insufficient_privilege then null;
  end;
end;
$$;
rollback;
