-- Basic monitoring table for key events

create table if not exists public.system_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  severity text not null default 'info',
  source text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists system_events_type_idx on public.system_events (event_type);
create index if not exists system_events_created_at_idx on public.system_events (created_at);

alter table public.system_events enable row level security;
create policy "System events admin/merchant only" on public.system_events
  for all using (
    public.has_role('admin', auth.uid()) or public.has_role('merchant', auth.uid())
  ) with check (
    public.has_role('admin', auth.uid()) or public.has_role('merchant', auth.uid())
  );
