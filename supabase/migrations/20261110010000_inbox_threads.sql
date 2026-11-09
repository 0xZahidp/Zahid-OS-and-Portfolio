-- Migration: 20261110010000_inbox_threads.sql
-- Description: Adds thread_id, read_at, unique resend_id index, deduplicates existing rows,
--              and backfills conversation threads.
-- =========================================================================
-- BACKUP INSTRUCTIONS (RUN BEFORE EXECUTING THIS MIGRATION):
-- In Supabase Dashboard -> SQL Editor, run:
--   CREATE TABLE IF NOT EXISTS public.inbox_messages_backup_20261110 AS SELECT * FROM public.inbox_messages;
--
-- ROLLBACK INSTRUCTIONS (IF YOU NEED TO REVERT):
--   ALTER TABLE public.inbox_messages DROP COLUMN IF EXISTS thread_id;
--   ALTER TABLE public.inbox_messages DROP COLUMN IF EXISTS read_at;
--   DROP INDEX IF EXISTS idx_inbox_messages_thread_id;
--   DROP INDEX IF EXISTS idx_inbox_messages_read_status;
--   DROP INDEX IF EXISTS idx_inbox_messages_resend_id_unique;
-- =========================================================================

BEGIN;

-- 1. Deduplicate existing rows: keep the earliest row per resend_id
DELETE FROM public.inbox_messages a
USING public.inbox_messages b
WHERE a.resend_id IS NOT NULL 
  AND a.resend_id <> ''
  AND a.resend_id = b.resend_id
  AND (
    a.received_at > b.received_at 
    OR (a.received_at = b.received_at AND a.id > b.id)
  );

-- 2. Add thread_id and read_at columns if not present
ALTER TABLE public.inbox_messages ADD COLUMN IF NOT EXISTS thread_id TEXT;
ALTER TABLE public.inbox_messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- 3. Add UNIQUE index on resend_id to guarantee DB-level deduplication
DROP INDEX IF EXISTS idx_inbox_messages_resend_id;
CREATE UNIQUE INDEX IF NOT EXISTS idx_inbox_messages_resend_id_unique
  ON public.inbox_messages (resend_id)
  WHERE resend_id IS NOT NULL AND resend_id <> '';

-- 4. Create index on thread_id and read status for fast conversation fetching
CREATE INDEX IF NOT EXISTS idx_inbox_messages_thread_id ON public.inbox_messages (thread_id);
CREATE INDEX IF NOT EXISTS idx_inbox_messages_read_status ON public.inbox_messages (is_read, is_trashed, status, direction);

-- 5. Backfill read_at for messages that were already marked read
UPDATE public.inbox_messages
SET read_at = COALESCE(read_at, received_at, created_at, NOW())
WHERE is_read = TRUE AND read_at IS NULL;

-- 6. Thread Backfill Procedure
-- Pass 1: In-Reply-To / References linking
-- If a message cites an earlier message's resend_id or id in in_reply_to or references_header,
-- link it to that parent message's thread_id or id.
UPDATE public.inbox_messages child
SET thread_id = COALESCE(parent.thread_id, parent.id)
FROM public.inbox_messages parent
WHERE child.thread_id IS NULL
  AND (
    (child.in_reply_to IS NOT NULL AND child.in_reply_to <> '' AND (child.in_reply_to = parent.resend_id OR child.in_reply_to = parent.id OR child.in_reply_to = parent.raw_headers->>'message-id'))
    OR
    (child.references_header IS NOT NULL AND child.references_header <> '' AND (child.references_header LIKE '%' || parent.resend_id || '%' OR child.references_header LIKE '%' || parent.id || '%'))
  )
  AND child.id <> parent.id;

-- Pass 2: Normalized subject fallback WITH participant overlap AND within 30 days
-- Strip common email reply/forward prefixes: 're:', 'fwd:', 're :', etc. using POSIX 'gi' flag
WITH normalized_messages AS (
  SELECT 
    id,
    received_at,
    from_email,
    to_email,
    TRIM(REGEXP_REPLACE(COALESCE(subject, ''), '^((re|fwd|fw|re\s*\[[0-9]+\]|fwd\s*\[[0-9]+\])\s*:\s*)+', '', 'gi')) AS norm_subject
  FROM public.inbox_messages
  WHERE thread_id IS NULL
),
linked_pairs AS (
  SELECT DISTINCT ON (n1.id)
    n1.id AS child_id,
    COALESCE(parent.thread_id, parent.id) AS assigned_thread_id
  FROM normalized_messages n1
  JOIN public.inbox_messages parent ON parent.id <> n1.id
  WHERE n1.norm_subject <> ''
    AND TRIM(REGEXP_REPLACE(COALESCE(parent.subject, ''), '^((re|fwd|fw|re\s*\[[0-9]+\]|fwd\s*\[[0-9]+\])\s*:\s*)+', '', 'gi')) = n1.norm_subject
    -- Require participant overlap:
    AND (
      n1.from_email = parent.from_email 
      OR n1.from_email = parent.to_email
      OR n1.to_email = parent.from_email
      OR n1.to_email = parent.to_email
    )
    -- Require messages to be within 30 days (2,592,000 seconds)
    AND ABS(EXTRACT(EPOCH FROM (COALESCE(n1.received_at, NOW()) - COALESCE(parent.received_at, NOW())))) <= 2592000
    AND COALESCE(parent.received_at, NOW()) <= COALESCE(n1.received_at, NOW())
  ORDER BY n1.id, parent.received_at ASC
)
UPDATE public.inbox_messages m
SET thread_id = lp.assigned_thread_id
FROM linked_pairs lp
WHERE m.id = lp.child_id AND m.thread_id IS NULL;

-- Pass 3: Self-assign thread_id for root messages or messages without a thread
UPDATE public.inbox_messages
SET thread_id = id
WHERE thread_id IS NULL OR thread_id = '';

COMMIT;
