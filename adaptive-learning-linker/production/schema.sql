-- Adaptive learning production schema (PostgreSQL)

create table if not exists learning_events (
  id bigserial primary key,
  user_id text not null,
  event_type text not null check (event_type in ('question_submitted', 'reading_completed')),
  occurred_at timestamptz not null,
  payload jsonb not null,
  idempotency_key text,
  created_at timestamptz not null default now()
);

create unique index if not exists ux_learning_events_idempotency
  on learning_events (idempotency_key)
  where idempotency_key is not null;

create index if not exists ix_learning_events_user_time
  on learning_events (user_id, occurred_at desc);

create table if not exists user_content_state (
  user_id text not null,
  content_type text not null check (content_type in ('reading', 'flashcard', 'question_set')),
  content_id text not null,
  state text not null check (state in ('locked', 'unlocked', 'completed')),
  updated_at timestamptz not null default now(),
  primary key (user_id, content_type, content_id)
);

create table if not exists content_links (
  id bigserial primary key,
  source_type text not null check (source_type in ('question_type', 'reading')),
  source_id text not null,
  target_type text not null check (target_type in ('reading', 'flashcard', 'question_set')),
  target_id text not null,
  relation text not null check (relation in ('unlock_on_miss', 'unlock_on_complete', 'recommend_on_struggle')),
  active boolean not null default true,
  unique (source_type, source_id, target_type, target_id, relation)
);

create table if not exists progression_rules (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists action_queue (
  id bigserial primary key,
  user_id text not null,
  action_type text not null check (action_type in ('unlock', 'recommend')),
  content_type text not null check (content_type in ('reading', 'flashcard', 'question_set')),
  content_id text not null,
  reason text not null,
  source_event_id bigint references learning_events(id),
  status text not null default 'pending' check (status in ('pending', 'applied', 'dismissed', 'failed')),
  created_at timestamptz not null default now(),
  applied_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

-- De-dupe repeated actions in active states
create unique index if not exists ux_action_queue_dedupe
  on action_queue (user_id, action_type, content_type, content_id)
  where status in ('pending', 'applied');

create index if not exists ix_action_queue_user_status
  on action_queue (user_id, status, created_at desc);

create table if not exists user_question_type_stats (
  user_id text not null,
  question_type text not null,
  attempts_window integer not null default 0,
  correct_window integer not null default 0,
  incorrect_streak integer not null default 0,
  window_updated_at timestamptz not null default now(),
  primary key (user_id, question_type)
);
