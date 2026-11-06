-- ==============================================================================
-- File: supabase/verify-security.sql
-- Description: Verification script for Supabase Zero-Trust Security Posture
-- Run this script in the Supabase SQL Editor.
-- The queries return structured result grids directly in the editor UI.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- CHECK 1: Ensure RLS is active on ALL public tables
-- Expectation: 0 rows returned (every table MUST have rowsecurity = true)
-- ------------------------------------------------------------------------------
SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled,
    'VULNERABLE: RLS is disabled' AS security_issue
FROM pg_tables
WHERE schemaname = 'public'
  AND NOT rowsecurity;

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
    cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND (
      'anon' = ANY(roles) 
      OR 'authenticated' = ANY(roles) 
      OR 'public' = ANY(roles)
  );

-- ------------------------------------------------------------------------------
-- CHECK 4: Check storage bucket configuration for health-private
-- Expectation: public = false, and 0 policies referencing health-private
-- ------------------------------------------------------------------------------
SELECT 
    id,
    name,
    public,
    CASE 
        WHEN public = false THEN 'SECURE (Private Bucket)'
        ELSE 'VULNERABLE (Public Bucket)'
    END AS status
FROM storage.buckets
WHERE id = 'health-private';

-- Check policies on storage.objects matching health-private (Expectation: 0 rows)
SELECT 
    policyname,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
      coalesce(qual, '') ILIKE '%health-private%' 
      OR coalesce(with_check, '') ILIKE '%health-private%'
      OR policyname ILIKE '%health-private%'
  );

-- ------------------------------------------------------------------------------
-- CHECK 5: Role Privilege & Default-Deny Verification (Tabular Output)
-- Tests permissions for anon and authenticated across SELECT, INSERT, UPDATE, DELETE.
-- ------------------------------------------------------------------------------

-- 5A. Summary count by Role and Privilege (Shows blocked vs leaked count)
SELECT 
    r.rolname AS role,
    p.privilege,
    COUNT(*) FILTER (WHERE NOT has_table_privilege(r.rolname, 'public.' || quote_ident(t.tablename), p.privilege)) AS blocked_tables,
    COUNT(*) FILTER (WHERE has_table_privilege(r.rolname, 'public.' || quote_ident(t.tablename), p.privilege)) AS leaked_tables,
    CASE 
        WHEN COUNT(*) FILTER (WHERE has_table_privilege(r.rolname, 'public.' || quote_ident(t.tablename), p.privilege)) = 0 
        THEN 'PASS (Zero-Trust Enforced)'
        ELSE 'FAIL (Permissions Leaked)'
    END AS status
FROM pg_tables t
CROSS JOIN (VALUES ('anon'), ('authenticated')) AS r(rolname)
CROSS JOIN (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')) AS p(privilege)
WHERE t.schemaname = 'public'
GROUP BY r.rolname, p.privilege
ORDER BY r.rolname, p.privilege;

-- 5B. Leaked permissions drill-down (Expectation: 0 rows returned)
WITH checks AS (
    SELECT 
        t.tablename,
        r.rolname,
        p.privilege,
        has_table_privilege(r.rolname, 'public.' || quote_ident(t.tablename), p.privilege) AS has_privilege
    FROM pg_tables t
    CROSS JOIN (VALUES ('anon'), ('authenticated')) AS r(rolname)
    CROSS JOIN (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')) AS p(privilege)
    WHERE t.schemaname = 'public'
)
SELECT 
    tablename,
    rolname AS role,
    privilege,
    'FAIL: Permission is granted to unprivileged role' AS security_issue
FROM checks
WHERE has_privilege = true
ORDER BY tablename, role, privilege;
