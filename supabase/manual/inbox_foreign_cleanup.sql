-- File: supabase/manual/inbox_foreign_cleanup.sql
-- Description: Manual cleanup script to remove historical foreign-domain emails from inbox_messages
-- DO NOT RUN AUTOMATICALLY. Review the results of Step 2 before executing Step 3.
-- Note: Foreign domain emails must NOT be tombstoned (only permanently deleted zahidp.com emails are tombstoned).

-- ==============================================================================
-- STEP 1: Create a safety backup table before deleting any rows
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.inbox_messages_backup_20261110b AS
SELECT * FROM public.inbox_messages;

-- ==============================================================================
-- STEP 2: Inspect inbound rows where mailbox IS NULL (grouped by recipient domain)
-- Review this list to ensure ONLY unwanted foreign/disposable domain emails match!
-- ==============================================================================
SELECT
  lower(
    split_part(
      COALESCE(
        substring(to_email from '<([^>]+)>'),
        trim(to_email)
      ),
      '@',
      2
    )
  ) AS recipient_domain,
  COUNT(*) AS message_count,
  MIN(received_at) AS earliest_received,
  MAX(received_at) AS latest_received
FROM public.inbox_messages
WHERE mailbox IS NULL
  AND (direction = 'inbound' OR (direction IS NULL AND (is_sent IS NULL OR is_sent = false)))
GROUP BY 1
ORDER BY message_count DESC;

-- ==============================================================================
-- STEP 3: Delete foreign domain rows (COMMENTED OUT BY DEFAULT)
-- CAUTION: Verify Step 2 results first. Uncomment and execute when ready.
-- ==============================================================================

BEGIN;

DELETE FROM public.inbox_messages
WHERE mailbox IS NULL
  AND (direction = 'inbound' OR (direction IS NULL AND (is_sent IS NULL OR is_sent = false)));

COMMIT;


