-- =============================================================================
-- Activity logs and settings
-- =============================================================================

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users (id) on delete set null,
  action public.activity_action not null default 'other',
  entity_type text not null,
  entity_id uuid,
  description text,
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  description text,
  is_public boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint settings_scope_key_unique unique (user_id, key)
);

-- Enforce: global settings have null user_id; user settings require user_id
create unique index if not exists idx_settings_global_key
  on public.settings (key)
  where user_id is null;

create index if not exists idx_activity_logs_actor_user_id on public.activity_logs (actor_user_id);
create index if not exists idx_activity_logs_entity on public.activity_logs (entity_type, entity_id);
create index if not exists idx_activity_logs_created_at on public.activity_logs (created_at desc);
create index if not exists idx_settings_user_id on public.settings (user_id);
create index if not exists idx_settings_key on public.settings (key);

create trigger trg_settings_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

create or replace function public.write_activity_log(
  p_action public.activity_action,
  p_entity_type text,
  p_entity_id uuid default null,
  p_description text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  insert into public.activity_logs (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    description,
    metadata
  )
  values (
    auth.uid(),
    p_action,
    p_entity_type,
    p_entity_id,
    p_description,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.write_activity_log(public.activity_action, text, uuid, text, jsonb) from public;
grant execute on function public.write_activity_log(public.activity_action, text, uuid, text, jsonb) to authenticated;
