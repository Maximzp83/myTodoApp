-- For an empty, disposable PostgreSQL 15+ database only.
-- This minimal Auth stub lets ownership.sql exercise actual PostgreSQL RLS and foreign keys.
\set ON_ERROR_STOP on
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
grant usage on schema public, auth to anon, authenticated;

\ir ../migrations/202609290001_accounts_and_todos.sql
\ir ../migrations/202609290002_category_deletion.sql
\ir ownership.sql
