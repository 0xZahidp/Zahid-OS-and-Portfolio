-- Migration: 20261106020000_health_private.sql
-- Description: Bucket-only migration for private health documents and records
-- No client-facing policies: all access goes through admin API routes with the service role and 60s signed URLs.

-- 1. Create or update health-private storage bucket (5MB max upload, private access only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'health-private',
  'health-private',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Ensure zero storage.objects policies exist for health-private
-- Drops any storage.objects policy whose qual, with_check or name references health-private
DO $$
DECLARE
    pol RECORD;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'storage' AND table_name = 'objects'
    ) THEN
        FOR pol IN (
            SELECT policyname
            FROM pg_policies
            WHERE schemaname = 'storage'
              AND tablename = 'objects'
              AND (
                  coalesce(qual, '') ILIKE '%health-private%' 
                  OR coalesce(with_check, '') ILIKE '%health-private%'
                  OR policyname ILIKE '%health-private%'
              )
        ) LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects;', pol.policyname);
        END LOOP;
    END IF;
END $$;
