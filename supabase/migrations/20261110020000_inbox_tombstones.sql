-- Migration: 20261110020000_inbox_tombstones.sql
-- Description: Creates inbox_deleted_resend_ids tombstone table to prevent permanently
--              deleted emails from being re-imported on subsequent Resend syncs or webhooks.
-- =========================================================================

BEGIN;

-- 1. Create tombstone table for permanently deleted resend_ids
CREATE TABLE IF NOT EXISTS public.inbox_deleted_resend_ids (
  resend_id TEXT PRIMARY KEY,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.inbox_deleted_resend_ids ENABLE ROW LEVEL SECURITY;

-- 3. Service role only policy (no public access)
DROP POLICY IF EXISTS "Service role full access on inbox_deleted_resend_ids" ON public.inbox_deleted_resend_ids;
CREATE POLICY "Service role full access on inbox_deleted_resend_ids"
  ON public.inbox_deleted_resend_ids
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMIT;

