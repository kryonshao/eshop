-- Shipping and logistics schema
-- Created: 2026-01-29
-- Purpose: Support shipping, tracking, and logistics management

-- Shipping providers configuration table
create table if not exists public.shipping_providers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  logo_url text,
  is_active boolean not null default true,
  supported_countries jsonb not null default '[]'::jsonb,
  base_rate numeric(12, 2) not null default 0,
  per_kg_rate numeric(12, 2) not null default 0,
  free_shipping_threshold numeric(12, 2),
  estimated_days_min integer not null default 3,
  estimated_days_max integer not null default 7,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.shipping_providers is 'Shipping provider configurations';
comment on column public.shipping_providers.code is 'Unique provider code (e.g., dhl, fedex, standard)';
comment on column public.shipping_providers.supported_countries is 'Array of ISO country codes';
comment on column public.shipping_providers.base_rate is 'Base shipping fee in USD';
comment on column public.shipping_providers.per_kg_rate is 'Additional fee per kg in USD';
comment on column public.shipping_providers.free_shipping_threshold is 'Order amount for free shipping in USD';

-- Shipments table
create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider_id uuid references public.shipping_providers(id) on delete set null,
  provider_code text not null,
  provider_name text not null,
  tracking_number text,
  status text not null default 'pending',
  origin_address jsonb not null,
  destination_address jsonb not null,
  shipping_fee numeric(12, 2) not null default 0,
  weight_kg numeric(10, 2),
  estimated_delivery_date date,
  actual_delivery_date timestamptz,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.shipments is 'Shipment records for orders';
comment on column public.shipments.status is 'pending, picked_up, in_transit, out_for_delivery, delivered, failed, cancelled';
comment on column public.shipments.origin_address is 'Warehouse/sender address';
comment on column public.shipments.destination_address is 'Customer delivery address';

create index if not exists shipments_order_id_idx on public.shipments (order_id);
create index if not exists shipments_tracking_number_idx on public.shipments (tracking_number);
create index if not exists shipments_status_idx on public.shipments (status);
create index if not exists shipments_created_at_idx on public.shipments (created_at desc);

-- Tracking events table
create table if not exists public.tracking_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  status text not null,
  location text,
  description text not null,
  event_time timestamptz not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.tracking_events is 'Tracking events for shipments';
comment on column public.tracking_events.event_time is 'When the tracking event occurred';

create index if not exists tracking_events_shipment_id_idx on public.tracking_events (shipment_id);
create index if not exists tracking_events_event_time_idx on public.tracking_events (event_time desc);

-- Insert default shipping providers
insert into public.shipping_providers (code, name, description, base_rate, per_kg_rate, free_shipping_threshold, estimated_days_min, estimated_days_max, supported_countries)
values
  ('standard', 'Standard Shipping', 'Standard delivery service', 5.00, 2.00, 50.00, 5, 10, '["US", "CA", "GB", "AU", "CN", "JP", "DE", "FR", "ES", "IT"]'::jsonb),
  ('express', 'Express Shipping', 'Fast delivery service', 15.00, 5.00, 100.00, 2, 4, '["US", "CA", "GB", "AU", "CN", "JP", "DE", "FR", "ES", "IT"]'::jsonb),
  ('economy', 'Economy Shipping', 'Budget-friendly delivery', 3.00, 1.00, 30.00, 10, 20, '["US", "CA", "GB", "AU", "CN", "JP", "DE", "FR", "ES", "IT"]'::jsonb)
on conflict (code) do nothing;

-- RLS policies
alter table public.shipping_providers enable row level security;

create policy "Shipping providers are readable by everyone"
  on public.shipping_providers for select
  using (is_active = true);

create policy "Shipping providers are writable by admin only"
  on public.shipping_providers for all
  using (public.has_role('admin', auth.uid()))
  with check (public.has_role('admin', auth.uid()));

alter table public.shipments enable row level security;

create policy "Shipments are readable by order owner or merchant"
  on public.shipments for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = shipments.order_id
      and (o.user_id = auth.uid() or o.guest_email = auth.jwt()->>'email')
    )
    or public.has_role('merchant', auth.uid())
    or public.has_role('admin', auth.uid())
  );

create policy "Shipments are writable by merchant/admin only"
  on public.shipments for all
  using (
    public.has_role('merchant', auth.uid()) or public.has_role('admin', auth.uid())
  )
  with check (
    public.has_role('merchant', auth.uid()) or public.has_role('admin', auth.uid())
  );

alter table public.tracking_events enable row level security;

create policy "Tracking events are readable by shipment owner"
  on public.tracking_events for select
  using (
    exists (
      select 1 from public.shipments s
      join public.orders o on o.id = s.order_id
      where s.id = tracking_events.shipment_id
      and (o.user_id = auth.uid() or o.guest_email = auth.jwt()->>'email')
    )
    or public.has_role('merchant', auth.uid())
    or public.has_role('admin', auth.uid())
  );

create policy "Tracking events are writable by merchant/admin only"
  on public.tracking_events for all
  using (
    public.has_role('merchant', auth.uid()) or public.has_role('admin', auth.uid())
  )
  with check (
    public.has_role('merchant', auth.uid()) or public.has_role('admin', auth.uid())
  );

-- Function to update shipment updated_at timestamp
create or replace function public.update_shipment_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_shipments_updated_at
  before update on public.shipments
  for each row
  execute function public.update_shipment_updated_at();

create trigger update_shipping_providers_updated_at
  before update on public.shipping_providers
  for each row
  execute function public.update_shipment_updated_at();
