-- Migration: 20261106020000_health_private.sql
-- Description: Create private storage bucket and strict RLS policies for private health records & documents

-- 1. Create health-private storage bucket (5MB max upload, private access only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'health-private',
  'health-private',
  false,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- 2. Storage Policies on storage.objects

-- Allow service role full access
DROP POLICY IF EXISTS "Service role full access on health-private" ON storage.objects;
CREATE POLICY "Service role full access on health-private"
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'health-private')
  WITH CHECK (bucket_id = 'health-private');

-- Allow authenticated admin users full access
DROP POLICY IF EXISTS "Admin authenticated full access on health-private" ON storage.objects;
CREATE POLICY "Admin authenticated full access on health-private"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'health-private')
  WITH CHECK (bucket_id = 'health-private');

-- Strict deny for anon / public
DROP POLICY IF EXISTS "Deny anon access on health-private" ON storage.objects;
CREATE POLICY "Deny anon access on health-private"
  ON storage.objects
  FOR ALL
  TO anon
  USING (false);

