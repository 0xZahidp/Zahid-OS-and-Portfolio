-- ==============================================================================
-- Migration: 20261106030000_security_hardening.sql
-- Description: Zero-Trust Supabase Security Hardening & Complete Access Lockdown
-- 
-- Summary of Actions:
-- 1. Strip ALL table, sequence, and routine privileges from `anon` and `authenticated`.
-- 2. Revoke default privileges on future tables/sequences/routines from `anon` and `authenticated`.
-- 3. Grant full privileges strictly to `service_role` (used by server route handlers).
-- 4. Enable and FORCE Row Level Security (RLS) on all tables in the `public` schema.
-- 5. Drop all existing policies on public tables to eliminate legacy permissive grants.
-- 6. Maintain ZERO policies for `anon` and `authenticated` (strict default-deny).
-- 7. Grant explicit access solely to `service_role`.
-- 8. Harden `health-private` storage bucket: ensure private with zero public/auth policies.
-- 
-- Safety & Idempotency:
-- - Fully idempotent: safe to run multiple times.
-- - Non-destructive: DO NOT DROP TABLES, preserves all data in all tables.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. REVOKE ALL PRIVILEGES FROM anon AND authenticated
-- ------------------------------------------------------------------------------
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon, authenticated;

-- Revoke default privileges on any future objects created in schema public
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM anon, authenticated;

-- ------------------------------------------------------------------------------
-- 2. GRANT FULL PRIVILEGES STRICTLY TO service_role
-- ------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO service_role;

-- ------------------------------------------------------------------------------
-- 3. ENABLE AND FORCE ROW LEVEL SECURITY (RLS) ON ALL PUBLIC TABLES
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN (
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl.tablename);
        EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY;', tbl.tablename);
    END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 4. DROP ALL EXISTING POLICIES ON PUBLIC TABLES
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 5. ZERO POLICIES FOR anon & authenticated; EXPLICIT POLICIES FOR service_role
-- With RLS enabled and zero policies matching anon or authenticated, PostgreSQL
-- enforces strict DEFAULT-DENY on all operations (SELECT, INSERT, UPDATE, DELETE).
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN (
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Service role full access" ON public.%I;', tbl.tablename);
        EXECUTE format('CREATE POLICY "Service role full access" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true);', tbl.tablename);
    END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 6. STORAGE BUCKET HARDENING (health-private)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'storage' AND table_name = 'buckets'
    ) THEN
        UPDATE storage.buckets
        SET public = false
        WHERE id = 'health-private';
    END IF;
END $$;

-- Drop any permissive policies on storage.objects for anon and authenticated
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'storage' AND table_name = 'objects'
    ) THEN
        DROP POLICY IF EXISTS "Admin authenticated full access on health-private" ON storage.objects;
        DROP POLICY IF EXISTS "Deny anon access on health-private" ON storage.objects;
        DROP POLICY IF EXISTS "Public can view health-private" ON storage.objects;
        DROP POLICY IF EXISTS "Authenticated can view health-private" ON storage.objects;

        -- Ensure service_role has explicit access to health-private bucket
        DROP POLICY IF EXISTS "Service role full access on health-private" ON storage.objects;
        CREATE POLICY "Service role full access on health-private"
          ON storage.objects
          FOR ALL
          TO service_role
          USING (bucket_id = 'health-private')
          WITH CHECK (bucket_id = 'health-private');
    END IF;
END $$;

