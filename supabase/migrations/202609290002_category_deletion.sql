begin;

-- Preserve tasks when their category is deleted. Only category_id becomes NULL;
-- user_id stays required and the composite key still prevents cross-account assignment.
alter table public.todos
  drop constraint todos_category_id_user_id_fkey,
  add constraint todos_category_id_user_id_fkey
    foreign key (category_id, user_id) references public.categories (id, user_id)
    on delete set null (category_id);

commit;
