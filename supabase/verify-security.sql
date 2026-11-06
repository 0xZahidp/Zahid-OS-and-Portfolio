-- ==============================================================================
-- File: supabase/verify-security.sql
-- Description: Verification script for Supabase Zero-Trust Security Posture
-- Run this script in the Supabase SQL Editor to verify that RLS, permissions,
-- and policies are strictly enforced and default-deny is active.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- CHECK 1: Ensure RLS and FORCE RLS are active on ALL public tables
-- Expectation: 0 rows returned (every table MUST have rowsecurity = true AND forcerowsecurity = true)
-- ------------------------------------------------------------------------------
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    forcerowsecurity,
    CASE 
        WHEN rowsecurity AND forcerowsecurity THEN 'SECURE (RLS Forced)'
        WHEN rowsecurity THEN 'PARTIAL (RLS enabled, not forced)'
        ELSE 'VULNERABLE (RLS disabled)'
    END AS status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.schemaname
WHERE t.schemaname = 'public'
  AND (NOT c.relrowsecurity OR NOT c.relforcerowsecurity);

-- ------------------------------------------------------------------------------
-- CHECK 2: Ensure NO direct table grants exist for `anon` or `authenticated`
-- Expectation: 0 rows returned
-- ------------------------------------------------------------------------------
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated');

-- ------------------------------------------------------------------------------
-- CHECK 3: Ensure ZERO policies allow access to `anon`, `authenticated`, or `public`
-- Expectation: 0 rows returned
-- ------------------------------------------------------------------------------
SELECT 
    schemaname,
    tablename,
    policyname,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
  AND (
      'anon' = ANY(roles) 
      OR 'authenticated' = ANY(roles) 
      OR 'public' = ANY(roles)
  );

-- ------------------------------------------------------------------------------
-- CHECK 4: Check storage bucket configuration for health-private
-- Expectation: public = false
-- ------------------------------------------------------------------------------
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    CASE 
        WHEN public = false THEN 'SECURE (Private Bucket)'
        ELSE 'VULNERABLE (Public Bucket)'
    END AS status
FROM storage.buckets
WHERE id = 'health-private';

-- Check policies on storage.objects for anon and authenticated on health-private
SELECT 
    policyname,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (qual ILIKE '%health-private%' OR with_check ILIKE '%health-private%')
  AND ('anon' = ANY(roles) OR 'authenticated' = ANY(roles) OR 'public' = ANY(roles));

-- ------------------------------------------------------------------------------
-- CHECK 5: Transaction Role Simulation
-- Simulates queries as `anon` and `authenticated` to confirm refusal.
-- (Runs in a transaction that is rolled back; produces NOTICE output in SQL Editor)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    test_failed boolean := false;
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'Starting Zero-Trust RLS Permission Test Simulation';
    RAISE NOTICE '==================================================';
END $$;

-- Test 5A: Simulate `anon` role
BEGIN;
  SET LOCAL ROLE anon;

  -- Test reading public.profiles
  DO $$
  BEGIN
    PERFORM * FROM public.profiles LIMIT 1;
    RAISE EXCEPTION 'SECURITY FAILURE: anon was able to read public.profiles!';
  EXCEPTION 
    WHEN insufficient_privilege THEN
      RAISE NOTICE '✔ PASS: anon denied SELECT on public.profiles (insufficient_privilege)';
    WHEN undefined_table THEN
      RAISE NOTICE '- SKIP: table public.profiles does not exist';
  END $$;

  -- Test reading public.inbox_messages
  DO $$
  BEGIN
    PERFORM * FROM public.inbox_messages LIMIT 1;
    RAISE EXCEPTION 'SECURITY FAILURE: anon was able to read public.inbox_messages!';
  EXCEPTION 
    WHEN insufficient_privilege THEN
      RAISE NOTICE '✔ PASS: anon denied SELECT on public.inbox_messages (insufficient_privilege)';
    WHEN undefined_table THEN
      RAISE NOTICE '- SKIP: table public.inbox_messages does not exist';
  END $$;

  -- Test reading public.app_settings
  DO $$
  BEGIN
    PERFORM * FROM public.app_settings LIMIT 1;
    RAISE EXCEPTION 'SECURITY FAILURE: anon was able to read public.app_settings!';
  EXCEPTION 
    WHEN insufficient_privilege THEN
      RAISE NOTICE '✔ PASS: anon denied SELECT on public.app_settings (insufficient_privilege)';
    WHEN undefined_table THEN
      RAISE NOTICE '- SKIP: table public.app_settings does not exist';
  END $$;

  -- Test reading public.career_applications
  DO $$
  BEGIN
    PERFORM * FROM public.career_applications LIMIT 1;
    RAISE EXCEPTION 'SECURITY FAILURE: anon was able to read public.career_applications!';
  EXCEPTION 
    WHEN insufficient_privilege THEN
      RAISE NOTICE '✔ PASS: anon denied SELECT on public.career_applications (insufficient_privilege)';
    WHEN undefined_table THEN
      RAISE NOTICE '- SKIP: table public.career_applications does not exist';
  END $$;

  -- Test reading public.os_short_links
  DO $$
  BEGIN
    PERFORM * FROM public.os_short_links LIMIT 1;
    RAISE EXCEPTION 'SECURITY FAILURE: anon was able to read public.os_short_links!';
  EXCEPTION 
    WHEN insufficient_privilege THEN
      RAISE NOTICE '✔ PASS: anon denied SELECT on public.os_short_links (insufficient_privilege)';
    WHEN undefined_table THEN
      RAISE NOTICE '- SKIP: table public.os_short_links does not exist';
  END $$;

  -- Test reading public.site_settings
  DO $$
  BEGIN
    PERFORM * FROM public.site_settings LIMIT 1;
    RAISE EXCEPTION 'SECURITY FAILURE: anon was able to read public.site_settings!';
  EXCEPTION 
    WHEN insufficient_privilege THEN
      RAISE NOTICE '✔ PASS: anon denied SELECT on public.site_settings (insufficient_privilege)';
    WHEN undefined_table THEN
      RAISE NOTICE '- SKIP: table public.site_settings does not exist';
  END $$;
ROLLBACK;

-- Test 5B: Simulate `authenticated` role
BEGIN;
  SET LOCAL ROLE authenticated;

  -- Test reading public.inbox_messages
  DO $$
  BEGIN
    PERFORM * FROM public.inbox_messages LIMIT 1;
    RAISE EXCEPTION 'SECURITY FAILURE: authenticated was able to read public.inbox_messages!';
  EXCEPTION 
    WHEN insufficient_privilege THEN
      RAISE NOTICE '✔ PASS: authenticated denied SELECT on public.inbox_messages (insufficient_privilege)';
    WHEN undefined_table THEN
      RAISE NOTICE '- SKIP: table public.inbox_messages does not exist';
  END $$;

  -- Test reading public.career_applications
  DO $$
  BEGIN
    PERFORM * FROM public.career_applications LIMIT 1;
    RAISE EXCEPTION 'SECURITY FAILURE: authenticated was able to read public.career_applications!';
  EXCEPTION 
    WHEN insufficient_privilege THEN
      RAISE NOTICE '✔ PASS: authenticated denied SELECT on public.career_applications (insufficient_privilege)';
    WHEN undefined_table THEN
      RAISE NOTICE '- SKIP: table public.career_applications does not exist';
  END $$;

  -- Test reading public.app_settings
  DO $$
  BEGIN
    PERFORM * FROM public.app_settings LIMIT 1;
    RAISE EXCEPTION 'SECURITY FAILURE: authenticated was able to read public.app_settings!';
  EXCEPTION 
    WHEN insufficient_privilege THEN
      RAISE NOTICE '✔ PASS: authenticated denied SELECT on public.app_settings (insufficient_privilege)';
    WHEN undefined_table THEN
      RAISE NOTICE '- SKIP: table public.app_settings does not exist';
  END $$;
ROLLBACK;

DO $$
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'All Zero-Trust Security Checks Completed!';
    RAISE NOTICE '==================================================';
END $$;

