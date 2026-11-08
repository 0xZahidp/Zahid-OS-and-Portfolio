-- ==============================================================================
-- Migration: Public Assets Storage Bucket
-- Version: 20261107016000
-- Description: Creates portfolio-public-assets bucket for upload route
--
-- Security:
-- - Public bucket allows public GET via /object/public/portfolio-public-assets/...
-- - Writes are performed server-side via service_role key only
-- - Zero policies on storage.objects to prevent unauthorized listing or writes
-- ==============================================================================

-- 1. Create or update the public storage bucket
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'storage' AND table_name = 'buckets'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'portfolio-public-assets',
      'portfolio-public-assets',
      true,
      5242880,
      ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/pdf']
    )
    ON CONFLICT (id) DO UPDATE SET
      public = true,
      file_size_limit = 5242880,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/pdf'];
  END IF;
END $$;

-- 2. Drop all policies on storage.objects
-- A public bucket serves files without any policy on storage.objects.
-- Dropping all policies ensures zero unauthorized access or listing leaks.
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
        ) LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects;', pol.policyname);
        END LOOP;
    END IF;
END $$;
