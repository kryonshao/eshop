-- Add missing fields to products table

-- Add image field (single image URL for backward compatibility)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS image TEXT DEFAULT '/placeholder.svg';

-- Add images field (JSONB array for multiple images)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Add category field
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS category TEXT;

-- Add stock field
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;

-- Add rating field
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2) DEFAULT 0;

-- Add comments
COMMENT ON COLUMN public.products.image IS 'Primary product image URL';
COMMENT ON COLUMN public.products.images IS 'Array of product image URLs (max 5)';
COMMENT ON COLUMN public.products.category IS 'Product category';
COMMENT ON COLUMN public.products.stock IS 'Available stock quantity';
COMMENT ON COLUMN public.products.rating IS 'Average product rating (0-5)';
