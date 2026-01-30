-- Create size guide tables for products

-- Size guide categories (tops, bottoms, shoes, etc.)
CREATE TABLE IF NOT EXISTS public.size_guide_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  name_en TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Size guide templates (reusable size charts)
CREATE TABLE IF NOT EXISTS public.size_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.size_guide_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  chart_data JSONB NOT NULL, -- Stores the size chart as JSON
  measurement_tips JSONB, -- Measurement instructions
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Link products to size guides
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS size_guide_id UUID REFERENCES public.size_guides(id) ON DELETE SET NULL;

-- Add product variant fields
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS sizes JSONB DEFAULT '[]'::jsonb;

-- Comments
COMMENT ON TABLE public.size_guide_categories IS 'Size guide categories (tops, bottoms, etc.)';
COMMENT ON TABLE public.size_guides IS 'Reusable size guide templates';
COMMENT ON COLUMN public.products.size_guide_id IS 'Reference to size guide template';
COMMENT ON COLUMN public.products.colors IS 'Available colors for this product';
COMMENT ON COLUMN public.products.sizes IS 'Available sizes for this product';

-- RLS Policies
ALTER TABLE public.size_guide_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.size_guides ENABLE ROW LEVEL SECURITY;

-- Everyone can read size guides
CREATE POLICY "Size guide categories are readable by everyone" 
  ON public.size_guide_categories FOR SELECT USING (true);

CREATE POLICY "Size guides are readable by everyone" 
  ON public.size_guides FOR SELECT USING (true);

-- Only admin/merchant can manage size guides
CREATE POLICY "Size guide categories are writable by admin/merchant" 
  ON public.size_guide_categories FOR ALL 
  USING (
    public.has_role('admin', auth.uid()) OR public.has_role('merchant', auth.uid())
  ) 
  WITH CHECK (
    public.has_role('admin', auth.uid()) OR public.has_role('merchant', auth.uid())
  );

CREATE POLICY "Size guides are writable by admin/merchant" 
  ON public.size_guides FOR ALL 
  USING (
    public.has_role('admin', auth.uid()) OR public.has_role('merchant', auth.uid())
  ) 
  WITH CHECK (
    public.has_role('admin', auth.uid()) OR public.has_role('merchant', auth.uid())
  );

-- Insert default size guide categories
INSERT INTO public.size_guide_categories (name, name_en, display_order) VALUES
  ('上装', 'Tops', 1),
  ('下装', 'Bottoms', 2),
  ('鞋类', 'Shoes', 3),
  ('配饰', 'Accessories', 4)
ON CONFLICT (name) DO NOTHING;

-- Insert default size guides
INSERT INTO public.size_guides (category_id, name, name_en, chart_data, measurement_tips) 
SELECT 
  (SELECT id FROM public.size_guide_categories WHERE name = '上装'),
  '标准上装尺码',
  'Standard Tops Size',
  '{
    "headers": ["尺码", "胸围(cm)", "腰围(cm)", "肩宽(cm)"],
    "rows": [
      ["XS", "84-88", "66-70", "38-40"],
      ["S", "88-92", "70-74", "40-42"],
      ["M", "92-96", "74-78", "42-44"],
      ["L", "96-100", "78-82", "44-46"],
      ["XL", "100-104", "82-86", "46-48"],
      ["XXL", "104-108", "86-90", "48-50"]
    ]
  }'::jsonb,
  '{
    "tips": [
      {"title": "胸围测量", "description": "在胸部最丰满处水平测量一周"},
      {"title": "腰围测量", "description": "在腰部最细处水平测量一周"},
      {"title": "肩宽测量", "description": "从左肩点到右肩点的直线距离"}
    ]
  }'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.size_guides WHERE name = '标准上装尺码'
);

INSERT INTO public.size_guides (category_id, name, name_en, chart_data, measurement_tips) 
SELECT 
  (SELECT id FROM public.size_guide_categories WHERE name = '下装'),
  '标准下装尺码',
  'Standard Bottoms Size',
  '{
    "headers": ["尺码", "腰围(cm)", "臀围(cm)", "裤长(cm)"],
    "rows": [
      ["XS", "66-70", "88-92", "98-100"],
      ["S", "70-74", "92-96", "100-102"],
      ["M", "74-78", "96-100", "102-104"],
      ["L", "78-82", "100-104", "104-106"],
      ["XL", "82-86", "104-108", "106-108"],
      ["XXL", "86-90", "108-112", "108-110"]
    ]
  }'::jsonb,
  '{
    "tips": [
      {"title": "腰围测量", "description": "在腰部最细处水平测量一周"},
      {"title": "臀围测量", "description": "在臀部最丰满处水平测量一周"},
      {"title": "裤长测量", "description": "从腰部到脚踝的垂直距离"}
    ]
  }'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.size_guides WHERE name = '标准下装尺码'
);
