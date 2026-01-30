-- Create storage buckets for QuickCarousals

-- Create logos bucket for brand assets (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  false,
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create exports bucket for generated PDFs/PNGs (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exports',
  'exports',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf', 'image/png']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for logos bucket
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to read their own logos
CREATE POLICY "Users can read their own logos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'logos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own logos
CREATE POLICY "Users can delete their own logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'logos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for exports bucket
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own exports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to read their own exports
CREATE POLICY "Users can read their own exports"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'exports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own exports
CREATE POLICY "Users can delete their own exports"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'exports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
