-- Payment reconciliation fields

alter table if exists public.payments
  add column if not exists reconciliation_status text not null default 'unreconciled',
  add column if not exists discrepancy_amount numeric(18, 8);

alter table if exists public.refunds
  add column if not exists nowpayments_refund_id text,
  add column if not exists processed_at timestamptz;

create index if not exists payments_reconciliation_status_idx on public.payments (reconciliation_status);
