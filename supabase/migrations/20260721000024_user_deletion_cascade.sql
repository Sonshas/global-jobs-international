-- =============================================================================
-- User deletion: unblock auth.users / public.users deletes
--
-- Root cause of "Database error deleting user":
--   public.users.id → auth.users(id) ON DELETE CASCADE, but
--   public.payments.user_id / payer_user_id → users ON DELETE RESTRICT
--   public.employers.owner_user_id → users ON DELETE RESTRICT
-- Those RESTRICT FKs abort the cascade when Supabase Auth tries to delete a user.
-- =============================================================================

-- 1) payments → cascade when the owning/paying user is removed
do $$
declare
  r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    join pg_class rel on rel.oid = c.conrelid
    join pg_namespace n on n.oid = rel.relnamespace
    where c.contype = 'f'
      and n.nspname = 'public'
      and rel.relname = 'payments'
      and c.confrelid = 'public.users'::regclass
  loop
    execute format('alter table public.payments drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.payments
  add constraint payments_user_id_fkey
    foreign key (user_id) references public.users (id) on delete cascade,
  add constraint payments_payer_user_id_fkey
    foreign key (payer_user_id) references public.users (id) on delete cascade;

-- 2) employers.owner_user_id → cascade (jobs / profiles / interviews already cascade from employers)
-- Do not touch verified_by (SET NULL) — only recreate the owner_user_id FK.
do $$
declare
  owner_attnum int;
  r record;
begin
  select a.attnum into owner_attnum
  from pg_attribute a
  where a.attrelid = 'public.employers'::regclass
    and a.attname = 'owner_user_id'
    and not a.attisdropped;

  if owner_attnum is null then
    raise exception 'employers.owner_user_id column not found';
  end if;

  for r in
    select c.conname
    from pg_constraint c
    where c.contype = 'f'
      and c.conrelid = 'public.employers'::regclass
      and c.confrelid = 'public.users'::regclass
      and c.conkey = array[owner_attnum]::int2[]
  loop
    execute format('alter table public.employers drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.employers
  add constraint employers_owner_user_id_fkey
    foreign key (owner_user_id) references public.users (id) on delete cascade;

-- 3) Clean Storage objects before public.users row disappears (auth delete cascades here)
create or replace function public.cleanup_user_storage_before_delete()
returns trigger
language plpgsql
security definer
set search_path = public, storage
as $$
begin
  -- Path convention from document uploads: {user_id}/...
  delete from storage.objects
  where bucket_id = 'documents'
    and (name = old.id::text or name like old.id::text || '/%');
  return old;
end;
$$;

drop trigger if exists trg_users_cleanup_storage on public.users;
create trigger trg_users_cleanup_storage
  before delete on public.users
  for each row
  execute function public.cleanup_user_storage_before_delete();

-- 4) Admin-callable RPC: delete auth user (cascades public graph after FK fix)
-- Prefer calling via service_role from the Express admin route; also usable from SQL.
create or replace function public.admin_delete_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if p_user_id is null then
    raise exception 'user id is required';
  end if;

  -- Only service_role should execute this (grants below). Extra guard if an
  -- authenticated JWT somehow reaches it: require platform admin.
  if auth.role() = 'authenticated' and not public.is_admin() then
    raise exception 'not authorized to delete users';
  end if;

  if not exists (select 1 from auth.users where id = p_user_id) then
    -- Also clear a dangling public.users row if auth is already gone
    delete from public.users where id = p_user_id;
    return;
  end if;

  delete from auth.users where id = p_user_id;
end;
$$;

revoke all on function public.admin_delete_user(uuid) from public;
revoke all on function public.admin_delete_user(uuid) from anon;
revoke all on function public.admin_delete_user(uuid) from authenticated;
grant execute on function public.admin_delete_user(uuid) to service_role;

comment on function public.admin_delete_user(uuid) is
  'Deletes auth.users row (cascades to public.users and dependents). service_role only.';
