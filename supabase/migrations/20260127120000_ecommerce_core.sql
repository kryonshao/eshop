-- Core ecommerce schema updates (USDT single-coin payments + coupons + guest email orders)

-- Products (replace mock data over time)
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(12, 2) not null,
  original_price numeric(12, 2),
  discount_price numeric(12, 2),
  currency text not null default 'USD',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Coupons
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(12, 2) not null,
  min_order_amount numeric(12, 2),
  max_redemptions integer,
  per_user_limit integer,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  guest_email text,
  discount_amount numeric(12, 2) not null default 0,
  redeemed_at timestamptz not null default now(),
  unique (coupon_id, order_id)
);

-- Payments (NOWPayments)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  payment_method text not null default 'crypto',
  nowpayments_payment_id text not null unique,
  pay_address text not null,
  pay_amount numeric(18, 8) not null,
  pay_currency text not null,
  price_amount numeric(12, 2) not null,
  price_currency text not null default 'USD',
  exchange_rate numeric(18, 8) not null,
  status text not null,
  payment_url text,
  expiration_date timestamptz,
  actually_paid numeric(18, 8),
  created_at timestamptz not null default now()
);

create table if not exists public.refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  amount_usd numeric(12, 2) not null,
  crypto_amount numeric(18, 8) not null,
  crypto_currency text not null,
  exchange_rate numeric(18, 8) not null,
  reason text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Orders: add guest email + coupon code + currency metadata
alter table if exists public.orders
  add column if not exists guest_email text,
  add column if not exists coupon_code text,
  add column if not exists discount_amount numeric(12, 2) not null default 0,
  add column if not exists currency text not null default 'USD';

-- Order tracking: optional carrier + tracking number for manual shipment entry
alter table if exists public.order_tracking
  add column if not exists carrier text,
  add column if not exists tracking_number text;

-- RLS policies (restrict write to admin/merchant; reads for products only)
alter table public.products enable row level security;
create policy "Products are readable by everyone" on public.products
  for select using (true);
create policy "Products are writable by admin/merchant" on public.products
  for all using (
    public.has_role('admin', auth.uid()) or public.has_role('merchant', auth.uid())
  ) with check (
    public.has_role('admin', auth.uid()) or public.has_role('merchant', auth.uid())
  );

alter table public.coupons enable row level security;
create policy "Coupons are admin/merchant only" on public.coupons
  for all using (
    public.has_role('admin', auth.uid()) or public.has_role('merchant', auth.uid())
  ) with check (
    public.has_role('admin', auth.uid()) or public.has_role('merchant', auth.uid())
  );

alter table public.coupon_redemptions enable row level security;
create policy "Coupon redemptions are admin/merchant only" on public.coupon_redemptions
  for all using (
    public.has_role('admin', auth.uid()) or public.has_role('merchant', auth.uid())
  ) with check (
    public.has_role('admin', auth.uid()) or public.has_role('merchant', auth.uid())
  );

alter table public.payments enable row level security;
create policy "Payments are admin/merchant only" on public.payments
  for all using (
    public.has_role('admin', auth.uid()) or public.has_role('merchant', auth.uid())
  ) with check (
    public.has_role('admin', auth.uid()) or public.has_role('merchant', auth.uid())
  );

alter table public.refunds enable row level security;
create policy "Refunds are admin/merchant only" on public.refunds
  for all using (
    public.has_role('admin', auth.uid()) or public.has_role('merchant', auth.uid())
  ) with check (
    public.has_role('admin', auth.uid()) or public.has_role('merchant', auth.uid())
  );
