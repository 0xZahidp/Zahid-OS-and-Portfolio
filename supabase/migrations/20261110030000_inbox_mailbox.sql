-- Migration: 20261110030000_inbox_mailbox.sql
-- Description: Split inbound messages into 'official' and 'unofficial' mailboxes on zahidp.com
-- Author: FolioFrame Mail Infrastructure
--
-- ROLLBACK INSTRUCTIONS:
-- To reverse this migration, execute the following SQL:
-- BEGIN;
-- DROP INDEX IF EXISTS public.idx_inbox_messages_mailbox;
-- ALTER TABLE public.inbox_messages DROP CONSTRAINT IF EXISTS chk_inbox_messages_mailbox;
-- ALTER TABLE public.inbox_messages DROP COLUMN IF EXISTS mailbox;
-- COMMIT;

BEGIN;

-- 1. Add mailbox column to inbox_messages
ALTER TABLE public.inbox_messages
ADD COLUMN IF NOT EXISTS mailbox TEXT;

-- 2. Add CHECK constraint allowing only 'official', 'unofficial', or NULL
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_inbox_messages_mailbox'
      AND conrelid = 'public.inbox_messages'::regclass
  ) THEN
    ALTER TABLE public.inbox_messages
    ADD CONSTRAINT chk_inbox_messages_mailbox
    CHECK (mailbox IN ('official', 'unofficial') OR mailbox IS NULL);
  END IF;
END $$;

-- 3. Backfill existing inbound messages based on to_email:
-- - Recipients on zahidp.com with official slug -> 'official'
-- - Other recipients on zahidp.com -> 'unofficial'
-- - Any other domain -> leave NULL
-- - Outbound rows keep mailbox NULL
UPDATE public.inbox_messages
SET mailbox = CASE
  WHEN (
    lower(
      split_part(
        COALESCE(
          substring(to_email from '<([^>]+)>'),
          trim(to_email)
        ),
        '@',
        2
      )
    ) = 'zahidp.com'
  ) THEN (
    CASE
      WHEN lower(
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
        'partnerships', 'billing', 'privacy', 'legal', 'security', 'abuse', 'postmaster', 'admin', 'zahid'
      ) THEN 'official'
      ELSE 'unofficial'
    END
  )
  ELSE NULL
END
WHERE (direction = 'inbound' OR (direction IS NULL AND (is_sent IS NULL OR is_sent = false)));

-- 4. Create index on (mailbox, received_at DESC) for fast folder queries
CREATE INDEX IF NOT EXISTS idx_inbox_messages_mailbox
ON public.inbox_messages (mailbox, received_at DESC);

COMMIT;

