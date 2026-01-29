-- NOWPayments webhook events for idempotency & audit

create table if not exists public.nowpayments_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_hash text not null unique,
  payment_id text,
  order_id text,
  payment_status text,
  raw_payload jsonb not null,
  signature text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists nowpayments_webhook_events_payment_id_idx
  on public.nowpayments_webhook_events (payment_id);

create index if not exists nowpayments_webhook_events_received_at_idx
  on public.nowpayments_webhook_events (received_at);

alter table public.nowpayments_webhook_events enable row level security;
create policy "Nowpayments webhook events admin/merchant only" on public.nowpayments_webhook_events
  for all using (
    public.has_role('admin', auth.uid()) or public.has_role('merchant', auth.uid())
  ) with check (
    public.has_role('admin', auth.uid()) or public.has_role('merchant', auth.uid())
  );
