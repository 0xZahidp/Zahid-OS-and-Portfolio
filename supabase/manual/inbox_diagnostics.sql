-- File: supabase/manual/inbox_diagnostics.sql
-- Description: Read-only diagnostic queries for troubleshooting Resend webhook
--              and inbox row creation issues in production Supabase.
-- DO NOT RUN AUTOMATICALLY - Run manually in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/txrnbazpdyoaazszkwwq/sql/new
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Table existence & column verification for inbox_messages
-- ------------------------------------------------------------------------------
-- 1a. List all columns in inbox_messages
SELECT 
  table_schema,
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'inbox_messages'
ORDER BY ordinal_position;

-- 1b. Specific check for critical columns: thread_id, read_at, mailbox, resend_id, status
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'inbox_messages'
  AND column_name IN ('thread_id', 'read_at', 'mailbox', 'resend_id', 'status')
ORDER BY column_name;

-- ------------------------------------------------------------------------------
-- 2. Check inbox_deleted_resend_ids tombstone table & row count
-- ------------------------------------------------------------------------------
SELECT 
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'inbox_deleted_resend_ids'
  ) AS tombstone_table_exists,
  (
    SELECT COUNT(*) 
    FROM public.inbox_deleted_resend_ids
  ) AS tombstone_count;

-- ------------------------------------------------------------------------------
-- 3. Unique indexes and constraints on inbox_messages
-- ------------------------------------------------------------------------------
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'inbox_messages'
ORDER BY indexname;

-- ------------------------------------------------------------------------------
-- 4. RLS enabled status and policies on both tables
-- ------------------------------------------------------------------------------
-- 4a. Check RLS status (rowsecurity = true means RLS is enabled)
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('inbox_messages', 'inbox_deleted_resend_ids')
ORDER BY tablename;

-- 4b. Policies on both tables
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('inbox_messages', 'inbox_deleted_resend_ids')
ORDER BY tablename, policyname;

-- ------------------------------------------------------------------------------
-- 5. Latest 10 rows of inbox_messages
-- ------------------------------------------------------------------------------
SELECT
  id,
  resend_id,
  direction,
  mailbox,
  to_email,
  subject,
  received_at
FROM public.inbox_messages
ORDER BY received_at DESC NULLS LAST
LIMIT 10;

-- ------------------------------------------------------------------------------
-- 6. Count of rows grouped by direction and mailbox
-- ------------------------------------------------------------------------------
SELECT
  COALESCE(direction, '(null)') AS direction,
  COALESCE(mailbox, '(null)') AS mailbox,
  COUNT(*) AS message_count,
  MIN(received_at) AS earliest_received,
  MAX(received_at) AS latest_received
FROM public.inbox_messages
GROUP BY direction, mailbox
ORDER BY direction, mailbox;

-- ------------------------------------------------------------------------------
-- 7. Any rows in inbox_deleted_resend_ids matching resend_ids (or recent tombstones)
-- ------------------------------------------------------------------------------
SELECT
  t.resend_id AS tombstoned_resend_id,
  t.deleted_at,
  m.id AS matching_inbox_id,
  m.subject,
  m.received_at
FROM public.inbox_deleted_resend_ids t
LEFT JOIN public.inbox_messages m ON m.resend_id = t.resend_id
ORDER BY t.deleted_at DESC
LIMIT 20;

