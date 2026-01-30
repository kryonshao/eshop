-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'merchant', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Add review_status to reviews table
ALTER TABLE public.reviews 
ADD COLUMN status TEXT NOT NULL DEFAULT 'pending' 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Create review_replies table for merchant responses
CREATE TABLE public.review_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on review_replies
ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;

-- Anyone can view approved review replies
CREATE POLICY "Anyone can view review replies"
ON public.review_replies
FOR SELECT
USING (true);

-- Only merchants and admins can create replies
CREATE POLICY "Merchants and admins can create replies"
ON public.review_replies
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'merchant') OR public.has_role(auth.uid(), 'admin')
);

-- Users can update their own replies
CREATE POLICY "Users can update their own replies"
ON public.review_replies
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own replies
CREATE POLICY "Users can delete their own replies"
ON public.review_replies
FOR DELETE
USING (auth.uid() = user_id);

-- Update trigger for review_replies
CREATE TRIGGER update_review_replies_updated_at
BEFORE UPDATE ON public.review_replies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update reviews SELECT policy to show all reviews (approved ones for public, all for admins/merchants)
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;

CREATE POLICY "Anyone can view approved reviews"
ON public.reviews
FOR SELECT
USING (
  status = 'approved' 
  OR auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'merchant') 
  OR public.has_role(auth.uid(), 'admin')
);

-- Merchants and admins can update review status
CREATE POLICY "Merchants can update review status"
ON public.reviews
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'merchant') OR public.has_role(auth.uid(), 'admin')
);