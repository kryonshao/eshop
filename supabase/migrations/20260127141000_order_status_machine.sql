-- Order status machine fields + order_items SKU link

alter table if exists public.orders
  add column if not exists payment_due_at timestamptz,
  add column if not exists paid_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists shipped_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists status_updated_at timestamptz;

create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_payment_due_at_idx on public.orders (payment_due_at);

alter table if exists public.order_items
  add column if not exists sku_id uuid references public.skus(id) on delete set null;

create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_sku_id_idx on public.order_items (sku_id);
