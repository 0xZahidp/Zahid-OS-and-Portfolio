-- ==============================================================================
-- Migration: 20261107020000_security_hardening.sql
-- Description: Zero-Trust Supabase Security Hardening & Complete Access Lockdown
-- 
-- IMPORTANT: Always run this file last, after any new migration.
-- ==============================================================================
-- 1. Strip ALL table, sequence, routine, and function privileges from `anon` & `authenticated`.
-- 2. Revoke default privileges on future tables/sequences/routines/functions.
-- 3. Grant full privileges strictly to `service_role` (used by backend server routes).
-- 4. Enable Row Level Security (RLS) on all tables in schema `public` (drops FORCE RLS).
-- 5. Drop all existing policies on public tables to eliminate legacy permissive grants.
-- 6. Maintain ZERO policies on public tables (strict default-deny for anon & authenticated;
--    redundant service_role policies are omitted because service_role natively bypasses RLS).
-- 7. Harden `health-private` bucket: ensure private and drop storage policies by content.
-- 
-- Safety & Idempotency:
-- - Fully idempotent: safe to run multiple times.
-- - Non-destructive: DO NOT DROP TABLES, preserves all existing tables and data.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. REVOKE ALL PRIVILEGES FROM anon, authenticated, AND PUBLIC
-- ------------------------------------------------------------------------------
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated, PUBLIC;

-- Revoke default privileges on any future objects created in schema public
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM anon, authenticated, PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated, PUBLIC;

-- ------------------------------------------------------------------------------
-- 2. GRANT FULL PRIVILEGES STRICTLY TO service_role
-- ------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO service_role;

-- ------------------------------------------------------------------------------
-- 3. ENABLE ROW LEVEL SECURITY (RLS) ON ALL PUBLIC TABLES (DROP FORCE RLS)
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
        EXECUTE format('ALTER TABLE public.%I NO FORCE ROW LEVEL SECURITY;', tbl.tablename);
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
-- 5. ZERO POLICIES FOR ALL ROLES (DEFAULT-DENY)
-- With RLS enabled and zero policies defined, Postgres enforces DEFAULT-DENY on
-- anon and authenticated for SELECT, INSERT, UPDATE, DELETE.
-- No policies are created for service_role because in Supabase, service_role has
-- the BYPASSRLS attribute and bypasses RLS natively.
-- ------------------------------------------------------------------------------

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

-- Drop storage policies by content (and by name) matching health-private
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
