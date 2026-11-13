begin;

-- Each account keeps one order of notes; a tab shows its own notes in that order.
-- A smaller position comes first. Existing notes keep their newest-first order, and a new
-- note gets a position before all existing ones, so it appears at the top of its tab.
alter table public.notes add column position bigint;

update public.notes as n
set position = ordered.place
from (
  select id, row_number() over (partition by user_id order by created_at desc, id desc) as place
  from public.notes
) as ordered
where ordered.id = n.id;

alter table public.notes
  alter column position set default (-(extract(epoch from clock_timestamp()) * 1000))::bigint,
  alter column position set not null;

-- Moves a note right after another note of the same account (to the top when
-- after_note_id is null) and renumbers the account's notes from their current order.
-- The client sends only this intent, so an outdated list on another device cannot undo
-- moves it has not seen. Returns the new position of every note of the account.
create function public.reorder_note(moved_note_id uuid, after_note_id uuid)
returns table (note_id uuid, note_position bigint)
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in before reordering notes.';
  end if;
  -- Reorders of one account run one at a time, so their renumbering cannot interleave.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('reorder_note:' || auth.uid()::text, 0)
  );
  if not exists (
    select 1 from public.notes as n where n.id = moved_note_id and n.user_id = auth.uid()
  ) then
    raise exception 'The note is no longer available.' using errcode = 'no_data_found';
  end if;
  if after_note_id is not null and (
    after_note_id = moved_note_id or not exists (
      select 1 from public.notes as n where n.id = after_note_id and n.user_id = auth.uid()
    )
  ) then
    raise exception 'Your notes changed. Refresh and try again.' using errcode = 'no_data_found';
  end if;

  update public.notes as n
  set position = wanted.place
  from (
    with others as (
      select o.id,
        row_number() over (order by o.position, o.created_at desc, o.id desc) as place
      from public.notes as o
      where o.user_id = auth.uid() and o.id <> moved_note_id
    ),
    anchor as (
      select coalesce((select o.place from others as o where o.id = after_note_id), 0) as place
    )
    select o.id, case when o.place > a.place then o.place + 1 else o.place end as place
    from others as o cross join anchor as a
    union all
    select moved_note_id, a.place + 1 from anchor as a
  ) as wanted
  where n.id = wanted.id and n.user_id = auth.uid() and n.position <> wanted.place;

  return query
  select n.id, n.position from public.notes as n where n.user_id = auth.uid();
end;
$$;

revoke all on function public.reorder_note(uuid, uuid) from public, anon;
grant execute on function public.reorder_note(uuid, uuid) to authenticated;

notify pgrst, 'reload schema';

commit;
