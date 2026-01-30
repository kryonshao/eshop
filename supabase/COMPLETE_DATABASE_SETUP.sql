-- ============================================
-- COMPLETE DATABASE SETUP FOR ALTES ECOMMERCE
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- ============================================
-- PART 1: Core Functions and User System
-- ============================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  user_role TEXT NOT NULL DEFAULT 'customer' CHECK (user_role IN ('customer', 'merchant', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_role ON public.profiles(user_role);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role = 'admin'
    )
  );

-- Create has_role function (if not exists or update it)
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT, user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id
    AND user_role = required_role
  );
END;
$$;

-- Create handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, user_role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'user_role', 'customer')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create profiles for existing users
INSERT INTO public.profiles (id, email, user_role)
SELECT id, email, 'customer'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PART 2: Orders Table (required by other tables)
-- ============================================

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  coupon_code TEXT,
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  shipping_address JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

-- ============================================
-- PART 3: Products and Ecommerce Core
-- ============================================

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL,
  original_price NUMERIC(12, 2),
  discount_price NUMERIC(12, 2),
  currency TEXT NOT NULL DEFAULT 'USD',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(12, 2) NOT NULL,
  min_order_amount NUMERIC(12, 2),
  max_redemptions INTEGER,
  per_user_limit INTEGER,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_email TEXT,
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (coupon_id, order_id)
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL DEFAULT 'crypto',
  nowpayments_payment_id TEXT NOT NULL UNIQUE,
  pay_address TEXT NOT NULL,
  pay_amount NUMERIC(18, 8) NOT NULL,
  pay_currency TEXT NOT NULL,
  price_amount NUMERIC(12, 2) NOT NULL,
  price_currency TEXT NOT NULL DEFAULT 'USD',
  exchange_rate NUMERIC(18, 8) NOT NULL,
  status TEXT NOT NULL,
  payment_url TEXT,
  expiration_date TIMESTAMPTZ,
  actually_paid NUMERIC(18, 8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  amount_usd NUMERIC(12, 2) NOT NULL,
  crypto_amount NUMERIC(18, 8) NOT NULL,
  crypto_currency TEXT NOT NULL,
  exchange_rate NUMERIC(18, 8) NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- PART 4: Inventory System
-- ============================================

CREATE TABLE IF NOT EXISTS public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  address JSONB NOT NULL,
  contact_info JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.skus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku_code TEXT NOT NULL UNIQUE,
  attributes JSONB NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS skus_product_id_idx ON public.skus (product_id);
CREATE INDEX IF NOT EXISTS skus_active_idx ON public.skus (is_active);

CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku_id UUID NOT NULL REFERENCES public.skus(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  available INTEGER NOT NULL DEFAULT 0,
  reserved INTEGER NOT NULL DEFAULT 0,
  alert_threshold INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sku_id, warehouse_id)
);

CREATE INDEX IF NOT EXISTS inventory_sku_id_idx ON public.inventory (sku_id);
CREATE INDEX IF NOT EXISTS inventory_warehouse_id_idx ON public.inventory (warehouse_id);

CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku_id UUID NOT NULL REFERENCES public.skus(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  type TEXT NOT NULL,
  reference_id UUID,
  reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS stock_movements_sku_id_idx ON public.stock_movements (sku_id);

-- ============================================
-- PART 5: Shipping System
-- ============================================

CREATE TABLE IF NOT EXISTS public.shipping_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  api_endpoint TEXT,
  api_key_encrypted TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  supported_countries JSONB,
  config JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider_id TEXT,
  provider_name TEXT,
  tracking_number TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  origin_address JSONB,
  destination_address JSONB,
  shipping_fee NUMERIC(10,2),
  estimated_delivery DATE,
  actual_delivery TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON public.shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON public.shipments(tracking_number);

CREATE TABLE IF NOT EXISTS public.tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  location TEXT,
  description TEXT,
  event_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracking_events_shipment_id ON public.tracking_events(shipment_id);

-- ============================================
-- PART 6: Cart and Wishlist
-- ============================================

CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  size TEXT,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id, size, color)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);

CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON public.wishlist(user_id);

-- ============================================
-- PART 7: Monitoring Tables
-- ============================================

CREATE TABLE IF NOT EXISTS public.nowpayments_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nowpayments_webhook_payment_id ON public.nowpayments_webhook_events(payment_id);

CREATE TABLE IF NOT EXISTS public.system_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_events_created_at ON public.system_events(created_at);

-- ============================================
-- PART 8: Enable RLS and Create Policies
-- ============================================

-- Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Products are readable by everyone" ON public.products;
CREATE POLICY "Products are readable by everyone" ON public.products
  FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Products are writable by admin/merchant" ON public.products;
CREATE POLICY "Products are writable by admin/merchant" ON public.products
  FOR ALL USING (
    public.has_role('admin', auth.uid()) OR public.has_role('merchant', auth.uid())
  );

-- Coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Coupons are admin/merchant only" ON public.coupons;
CREATE POLICY "Coupons are admin/merchant only" ON public.coupons
  FOR ALL USING (
    public.has_role('admin', auth.uid()) OR public.has_role('merchant', auth.uid())
  );

-- Coupon Redemptions
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Coupon redemptions are admin/merchant only" ON public.coupon_redemptions;
CREATE POLICY "Coupon redemptions are admin/merchant only" ON public.coupon_redemptions
  FOR ALL USING (
    public.has_role('admin', auth.uid()) OR public.has_role('merchant', auth.uid())
  );

-- Payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Payments are admin/merchant only" ON public.payments;
CREATE POLICY "Payments are admin/merchant only" ON public.payments
  FOR ALL USING (
    public.has_role('admin', auth.uid()) OR public.has_role('merchant', auth.uid())
  );

-- Refunds
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Refunds are admin/merchant only" ON public.refunds;
CREATE POLICY "Refunds are admin/merchant only" ON public.refunds
  FOR ALL USING (
    public.has_role('admin', auth.uid()) OR public.has_role('merchant', auth.uid())
  );

-- Warehouses
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Warehouses admin/merchant only" ON public.warehouses;
CREATE POLICY "Warehouses admin/merchant only" ON public.warehouses
  FOR ALL USING (
    public.has_role('admin', auth.uid()) OR public.has_role('merchant', auth.uid())
  );

-- SKUs
ALTER TABLE public.skus ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "SKUs admin/merchant only" ON public.skus;
CREATE POLICY "SKUs admin/merchant only" ON public.skus
  FOR ALL USING (
    public.has_role('admin', auth.uid()) OR public.has_role('merchant', auth.uid())
  );

-- Inventory
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Inventory admin/merchant only" ON public.inventory;
CREATE POLICY "Inventory admin/merchant only" ON public.inventory
  FOR ALL USING (
    public.has_role('admin', auth.uid()) OR public.has_role('merchant', auth.uid())
  );

-- Stock Movements
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Stock movements admin/merchant only" ON public.stock_movements;
CREATE POLICY "Stock movements admin/merchant only" ON public.stock_movements
  FOR ALL USING (
    public.has_role('admin', auth.uid()) OR public.has_role('merchant', auth.uid())
  );

-- Shipping Providers
ALTER TABLE public.shipping_providers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Shipping providers are writable by admin only" ON public.shipping_providers;
CREATE POLICY "Shipping providers are writable by admin only" ON public.shipping_providers
  FOR ALL USING (public.has_role('admin', auth.uid()));

-- Shipments
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Shipments are readable by order owner or merchant" ON public.shipments;
CREATE POLICY "Shipments are readable by order owner or merchant" ON public.shipments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = shipments.order_id
      AND (o.user_id = auth.uid() OR public.has_role('merchant', auth.uid()) OR public.has_role('admin', auth.uid()))
    )
  );
DROP POLICY IF EXISTS "Shipments are writable by merchant/admin only" ON public.shipments;
CREATE POLICY "Shipments are writable by merchant/admin only" ON public.shipments
  FOR ALL USING (
    public.has_role('merchant', auth.uid()) OR public.has_role('admin', auth.uid())
  );

-- Tracking Events
ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tracking events are readable by shipment owner" ON public.tracking_events;
CREATE POLICY "Tracking events are readable by shipment owner" ON public.tracking_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.shipments s
      JOIN public.orders o ON s.order_id = o.id
      WHERE s.id = tracking_events.shipment_id
      AND (o.user_id = auth.uid() OR public.has_role('merchant', auth.uid()) OR public.has_role('admin', auth.uid()))
    )
  );
DROP POLICY IF EXISTS "Tracking events are writable by merchant/admin only" ON public.tracking_events;
CREATE POLICY "Tracking events are writable by merchant/admin only" ON public.tracking_events
  FOR ALL USING (
    public.has_role('merchant', auth.uid()) OR public.has_role('admin', auth.uid())
  );

-- Cart Items
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own cart items" ON public.cart_items;
CREATE POLICY "Users can read own cart items" ON public.cart_items
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own cart items" ON public.cart_items;
CREATE POLICY "Users can insert own cart items" ON public.cart_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own cart items" ON public.cart_items;
CREATE POLICY "Users can update own cart items" ON public.cart_items
  FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own cart items" ON public.cart_items;
CREATE POLICY "Users can delete own cart items" ON public.cart_items
  FOR DELETE USING (auth.uid() = user_id);

-- Wishlist
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own wishlist" ON public.wishlist;
CREATE POLICY "Users can read own wishlist" ON public.wishlist
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own wishlist" ON public.wishlist;
CREATE POLICY "Users can insert own wishlist" ON public.wishlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own wishlist" ON public.wishlist;
CREATE POLICY "Users can delete own wishlist" ON public.wishlist
  FOR DELETE USING (auth.uid() = user_id);

-- Monitoring Tables
ALTER TABLE public.nowpayments_webhook_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Nowpayments webhook events admin/merchant only" ON public.nowpayments_webhook_events;
CREATE POLICY "Nowpayments webhook events admin/merchant only" ON public.nowpayments_webhook_events
  FOR ALL USING (
    public.has_role('admin', auth.uid()) OR public.has_role('merchant', auth.uid())
  );

ALTER TABLE public.system_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "System events admin/merchant only" ON public.system_events;
CREATE POLICY "System events admin/merchant only" ON public.system_events
  FOR ALL USING (
    public.has_role('admin', auth.uid()) OR public.has_role('merchant', auth.uid())
  );

-- ============================================
-- PART 9: Create Triggers
-- ============================================

DROP TRIGGER IF EXISTS update_cart_items_updated_at ON public.cart_items;
CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- PART 10: Grant Permissions
-- ============================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.wishlist TO authenticated;
GRANT SELECT ON public.products TO anon, authenticated;

-- ============================================
-- PART 11: Verification
-- ============================================

SELECT 
  'Database setup complete!' as message,
  COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE';

-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;
