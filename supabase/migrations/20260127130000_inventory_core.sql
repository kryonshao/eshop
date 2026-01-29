-- Inventory core schema

create table if not exists public.warehouses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  address jsonb not null,
  contact_info jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.skus (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku_code text not null unique,
  attributes jsonb not null,
  price numeric(12, 2) not null,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists skus_product_id_idx on public.skus (product_id);
create index if not exists skus_active_idx on public.skus (is_active);
create index if not exists skus_attributes_gin on public.skus using gin (attributes);

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  sku_id uuid not null references public.skus(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  available integer not null default 0,
  reserved integer not null default 0,
  alert_threshold integer not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sku_id, warehouse_id)
);

create index if not exists inventory_sku_id_idx on public.inventory (sku_id);
create index if not exists inventory_warehouse_id_idx on public.inventory (warehouse_id);
create index if not exists inventory_available_idx on public.inventory (available);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  sku_id uuid not null references public.skus(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  quantity integer not null,
  type text not null,
  reference_id uuid,
  reason text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists stock_movements_sku_id_idx on public.stock_movements (sku_id);
create index if not exists stock_movements_created_at_idx on public.stock_movements (created_at);

alter table public.warehouses enable row level security;
create policy "Warehouses admin/merchant only" on public.warehouses
  for all using (
    public.has_role('admin', auth.uid()) or public.has_role('merchant', auth.uid())
  ) with check (
    public.has_role('admin', auth.uid()) or public.has_role('merchant', auth.uid())
  );

alter table public.skus enable row level security;
create policy "SKUs admin/merchant only" on public.skus
  for all using (
    public.has_role('admin', auth.uid()) or public.has_role('merchant', auth.uid())
  ) with check (
    public.has_role('admin', auth.uid()) or public.has_role('merchant', auth.uid())
  );

alter table public.inventory enable row level security;
create policy "Inventory admin/merchant only" on public.inventory
  for all using (
    public.has_role('admin', auth.uid()) or public.has_role('merchant', auth.uid())
  ) with check (
    public.has_role('admin', auth.uid()) or public.has_role('merchant', auth.uid())
  );

alter table public.stock_movements enable row level security;
create policy "Stock movements admin/merchant only" on public.stock_movements
  for all using (
    public.has_role('admin', auth.uid()) or public.has_role('merchant', auth.uid())
  ) with check (
    public.has_role('admin', auth.uid()) or public.has_role('merchant', auth.uid())
  );
