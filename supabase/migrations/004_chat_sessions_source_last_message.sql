-- Chat session metadata required by the Sloan coach implementation plan:
-- source drives the SOS/temptation-moment posture; last_message_at drives
-- the 24h-idle session rotation.
alter table chat_sessions
  add column if not exists source text default 'tab'
    check (source in ('tab', 'sos', 'checkin')),
  add column if not exists last_message_at timestamptz default now();

create index if not exists chat_messages_session_created_idx
  on chat_messages (session_id, created_at);
