-- =============================================================================
-- Conversations, messages, notifications
-- =============================================================================

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  subject text,
  job_id uuid references public.jobs (id) on delete set null,
  application_id uuid references public.applications (id) on delete set null,
  applicant_user_id uuid not null references public.users (id) on delete cascade,
  employer_user_id uuid not null references public.users (id) on delete cascade,
  employer_id uuid references public.employers (id) on delete set null,
  last_message_at timestamptz,
  is_archived_by_applicant boolean not null default false,
  is_archived_by_employer boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint conversations_participants_distinct check (applicant_user_id <> employer_user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_user_id uuid not null references public.users (id) on delete cascade,
  body text not null,
  attachment_document_id uuid references public.documents (id) on delete set null,
  is_read boolean not null default false,
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  body text not null,
  channel public.notification_channel not null default 'in_app',
  event_type text not null,
  entity_type text,
  entity_id uuid,
  link_url text,
  is_read boolean not null default false,
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_conversations_applicant_user_id on public.conversations (applicant_user_id);
create index if not exists idx_conversations_employer_user_id on public.conversations (employer_user_id);
create index if not exists idx_conversations_application_id on public.conversations (application_id);
create index if not exists idx_conversations_last_message_at on public.conversations (last_message_at desc nulls last);
create index if not exists idx_messages_conversation_id on public.messages (conversation_id, created_at);
create index if not exists idx_messages_sender_user_id on public.messages (sender_user_id);
create index if not exists idx_messages_unread on public.messages (conversation_id) where is_read = false;
create index if not exists idx_notifications_user_id on public.notifications (user_id, created_at desc);
create index if not exists idx_notifications_unread on public.notifications (user_id) where is_read = false;

create trigger trg_conversations_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

create trigger trg_messages_updated_at
  before update on public.messages
  for each row execute function public.set_updated_at();

create trigger trg_notifications_updated_at
  before update on public.notifications
  for each row execute function public.set_updated_at();

create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set last_message_at = timezone('utc', now()),
      updated_at = timezone('utc', now())
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists trg_messages_touch_conversation on public.messages;
create trigger trg_messages_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation_on_message();
