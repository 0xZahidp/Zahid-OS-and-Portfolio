-- ==============================================================================
-- Migration: 20261124020000_inbox_performance_optimization.sql
-- Description: Pre-classify Official vs Unofficial emails, add soft-delete sync,
--              create high-performance B-Tree indexes, and harden Zero-Trust RLS.
-- ==============================================================================

BEGIN;

-- 1. Add is_official and is_deleted boolean columns
ALTER TABLE public.inbox_messages
ADD COLUMN IF NOT EXISTS is_official BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.inbox_messages
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Backfill is_official and is_deleted for existing records
UPDATE public.inbox_messages
SET 
  is_official = (
    mailbox = 'official'
    OR direction = 'outbound'
    OR is_sent = TRUE
    OR lower(
      split_part(
        split_part(
          COALESCE(
            substring(to_email from '<([^>]+)>'),
            trim(to_email)
          ),
          '@',
          1
        ),
        '+',
        1
      )
    ) IN (
      'contact', 'hello', 'info', 'support', 'hire', 'jobs', 'careers', 'business',
      'partnerships', 'billing', 'privacy', 'legal', 'security', 'abuse', 'postmaster',
      'admin', 'zahid', 'test', 'reply', 'noreply', 'me'
    )
  ),
  is_deleted = COALESCE(is_trashed, FALSE);

-- 3. Composite B-Tree Indexes for millisecond tab-switching and filtering
CREATE INDEX IF NOT EXISTS idx_inbox_messages_official_deleted_received
ON public.inbox_messages (is_official, is_deleted, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_inbox_messages_official_trashed_received
ON public.inbox_messages (is_official, is_trashed, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_inbox_messages_label_status_received
ON public.inbox_messages (label, status, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_inbox_messages_thread_received_asc
ON public.inbox_messages (thread_id, received_at ASC);

-- 4. RLS Audit & Zero-Trust Access Hardening
ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox_messages NO FORCE ROW LEVEL SECURITY;

ALTER TABLE public.career_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_applications NO FORCE ROW LEVEL SECURITY;

ALTER TABLE public.startup_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_leads NO FORCE ROW LEVEL SECURITY;

-- Drop legacy permissive policies on inbox_messages
DROP POLICY IF EXISTS "Admin select inbox_messages" ON public.inbox_messages;
DROP POLICY IF EXISTS "Admin update inbox_messages" ON public.inbox_messages;
DROP POLICY IF EXISTS "Admin delete inbox_messages" ON public.inbox_messages;
DROP POLICY IF EXISTS "Service role full access on inbox_messages" ON public.inbox_messages;

-- Strictly grant privileges only to service_role (default-deny for anon & authenticated)
REVOKE ALL ON public.inbox_messages FROM anon, authenticated, PUBLIC;
GRANT ALL ON public.inbox_messages TO service_role;

REVOKE ALL ON public.career_applications FROM anon, authenticated, PUBLIC;
GRANT ALL ON public.career_applications TO service_role;

REVOKE ALL ON public.startup_leads FROM anon, authenticated, PUBLIC;
GRANT ALL ON public.startup_leads TO service_role;

COMMIT;
