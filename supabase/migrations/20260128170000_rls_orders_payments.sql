-- RLS policies for user/guest order visibility

-- Ensure RLS is enabled
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_tracking enable row level security;

-- Orders: user can read own orders
create policy "Orders are readable by owner" on public.orders
  for select using (user_id = auth.uid());

-- Orders: guest can read by matching guest_id or guest_email
create policy "Orders are readable by guest" on public.orders
  for select using (
    user_id is null
    and (
      guest_id = (current_setting('request.headers', true)::jsonb ->> 'x-guest-id')
      or guest_email = (current_setting('request.headers', true)::jsonb ->> 'x-guest-email')
    )
  );

-- Order items: readable if parent order is readable
create policy "Order items readable by order owner" on public.order_items
  for select using (
    exists (
      select 1
      from public.orders o
      where o.id = order_items.order_id
        and o.user_id = auth.uid()
    )
  );

create policy "Order items readable by guest" on public.order_items
  for select using (
    exists (
      select 1
      from public.orders o
      where o.id = order_items.order_id
        and o.user_id is null
        and (
          o.guest_id = (current_setting('request.headers', true)::jsonb ->> 'x-guest-id')
          or o.guest_email = (current_setting('request.headers', true)::jsonb ->> 'x-guest-email')
        )
    )
  );

-- Order tracking: readable if parent order is readable
create policy "Order tracking readable by order owner" on public.order_tracking
  for select using (
    exists (
      select 1
      from public.orders o
      where o.id = order_tracking.order_id
        and o.user_id = auth.uid()
    )
  );

create policy "Order tracking readable by guest" on public.order_tracking
  for select using (
    exists (
      select 1
      from public.orders o
      where o.id = order_tracking.order_id
        and o.user_id is null
        and (
          o.guest_id = (current_setting('request.headers', true)::jsonb ->> 'x-guest-id')
          or o.guest_email = (current_setting('request.headers', true)::jsonb ->> 'x-guest-email')
        )
    )
  );

-- Payments: readable by order owner
alter table public.payments enable row level security;
create policy "Payments readable by order owner" on public.payments
  for select using (
    exists (
      select 1
      from public.orders o
      where o.id = payments.order_id
        and o.user_id = auth.uid()
    )
  );

-- Payments: readable by guest
create policy "Payments readable by guest" on public.payments
  for select using (
    exists (
      select 1
      from public.orders o
      where o.id = payments.order_id
        and o.user_id is null
        and (
          o.guest_id = (current_setting('request.headers', true)::jsonb ->> 'x-guest-id')
          or o.guest_email = (current_setting('request.headers', true)::jsonb ->> 'x-guest-email')
        )
    )
  );

-- Guard: require matching guest header for guest orders
create policy "Orders readable by guest header" on public.orders
  for select using (
    user_id is null
    and (
      guest_id = (current_setting('request.headers', true)::jsonb ->> 'x-guest-id')
      or guest_email = (current_setting('request.headers', true)::jsonb ->> 'x-guest-email')
    )
  );
