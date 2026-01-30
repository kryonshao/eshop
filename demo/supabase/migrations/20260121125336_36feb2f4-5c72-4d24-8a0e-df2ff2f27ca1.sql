-- Create storage bucket for review images
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-images', 'review-images', true);

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload review images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'review-images');

-- Allow everyone to view review images
CREATE POLICY "Anyone can view review images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'review-images');

-- Allow users to delete their own review images
CREATE POLICY "Users can delete their own review images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'review-images' AND auth.uid()::text = (storage.foldername(name))[1]);