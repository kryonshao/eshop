-- Migration: 20250125_add_guest_products.sql
-- Purpose: Add support for guest reviews and orders
-- Author: @system

-- 1. Enable guest reviews on reviews table
ALTER TABLE public.reviews ADD COLUMN guest_name TEXT;
ALTER TABLE public.reviews ADD COLUMN guest_email TEXT;
ALTER TABLE public.reviews ADD COLUMN reviewer_type TEXT NOT NULL DEFAULT 'user' CHECK (reviewer_type = 'guest');
ALTER TABLE public.reviews ADD CONSTRAINT reviews_unique_review UNIQUE (product_id, COALESCE(user_id::text IS NULL OR guest_email::text IS NULL);

-- 2. Make user_id nullable
ALTER TABLE public.reviews ALTER COLUMN user_id DROP NOT NULL;

-- 3. Add review_status and default value
ALTER TABLE public.reviews MODIFY COLUMN status TEXT DEFAULT 'approved';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS reviews (status = 'pending' OR (reviewer_type = 'guest' AND status = 'pending');

-- 4. Update unique constraint
ALTER TABLE public.reviews DROP CONSTRAINT reviews_user_id_product_id_order_id;
CREATE UNIQUE INDEX IF NOT EXISTS idx_guest_id_order_id ON reviews(product_id, COALESCE(user_id::text IS NULL OR guest_email::text IS NULL);

-- 5. Add tracking for reviews (optional, for manual reply)
CREATE TABLE IF NOT EXISTS public.order_tracking (
  product_id TEXT,
  order_tracking_id BIGSERIAL,
  tracking_description TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Ensure guest_id index on reviews
CREATE INDEX IF NOT EXISTS idx_guest_id_review ON reviews(guest_id);

-- 7. Update orders table for guest support
ALTER TABLE public.orders ADD COLUMN guest_id TEXT;
ALTER TABLE public.orders ADD COLUMN guest_id TEXT;
CREATE INDEX IF NOT EXISTS idx_orders_guest_id ON orders(guest_id);

-- 8. Allow anonymous order creation
CREATE POLICY "Guest users can create orders" 
ON public.orders FOR INSERT
WITH CHECK (reviewer_type = 'guest' AND guest_name IS NOT NULL AND guest_email IS NOT NULL);

-- 9. Add order tracking for guest orders
CREATE POLICY "Guest order tracking" 
ON public.order_tracking (
  product_id TEXT,
  order_tracking_id BIGSERIAL,
  tracking_description TEXT DEFAULT 'Order created, waiting for payment',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Allow guest users to manage their orders
CREATE POLICY "Guest order management" 
ON public.orders 
  FOR UPDATE 
  WITH CHECK (
    (reviewer_type = 'guest' OR guest_id IS NOT NULL)
  );
