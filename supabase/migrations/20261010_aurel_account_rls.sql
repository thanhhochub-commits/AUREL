-- AUREL account isolation: run in the intended Supabase project SQL editor.
-- All rows remain private to authenticated owners. Do not expose service_role to browser.
begin;
create table if not exists public.aurel_account_state (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{"rows":[],"documents":[]}'::jsonb,
  revision bigint not null default 0,
  updated_at timestamptz not null default now(),
  constraint aurel_account_payload_object check (jsonb_typeof(payload) = 'object')
);
alter table public.aurel_account_state enable row level security;
alter table public.aurel_account_state force row level security;
revoke all on table public.aurel_account_state from public, anon;
grant select, insert, update, delete on public.aurel_account_state to authenticated;
drop policy if exists "aurel owner select" on public.aurel_account_state;
drop policy if exists "aurel owner insert" on public.aurel_account_state;
drop policy if exists "aurel owner update" on public.aurel_account_state;
drop policy if exists "aurel owner delete" on public.aurel_account_state;
create policy "aurel owner select" on public.aurel_account_state for select to authenticated using ((select auth.uid())=owner_id);
create policy "aurel owner insert" on public.aurel_account_state for insert to authenticated with check ((select auth.uid())=owner_id);
create policy "aurel owner update" on public.aurel_account_state for update to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create policy "aurel owner delete" on public.aurel_account_state for delete to authenticated using ((select auth.uid())=owner_id);

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('aurel-documents','aurel-documents',false,41943040,array['application/pdf','text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict (id) do update
set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "aurel document owner read" on storage.objects;
drop policy if exists "aurel document owner insert" on storage.objects;
drop policy if exists "aurel document owner update" on storage.objects;
drop policy if exists "aurel document owner delete" on storage.objects;
create policy "aurel document owner read" on storage.objects
  for select to authenticated
  using (bucket_id='aurel-documents' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "aurel document owner insert" on storage.objects
  for insert to authenticated
  with check (bucket_id='aurel-documents' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "aurel document owner update" on storage.objects
  for update to authenticated
  using (bucket_id='aurel-documents' and (storage.foldername(name))[1]=(select auth.uid())::text)
  with check (bucket_id='aurel-documents' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "aurel document owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id='aurel-documents' and (storage.foldername(name))[1]=(select auth.uid())::text);
commit;