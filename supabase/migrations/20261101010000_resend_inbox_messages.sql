-- Migration: 20261101010000_resend_inbox_messages.sql
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/txrnbazpdyoaazszkwwq/sql/new
-- =========================================================================

-- 1. Ensure public.inbox_messages exists with complete rich columns
CREATE TABLE IF NOT EXISTS public.inbox_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  resend_id TEXT UNIQUE,
  from_name TEXT DEFAULT '',
  from_email TEXT NOT NULL DEFAULT '',
  to_email TEXT NOT NULL DEFAULT 'hello@zahidp.com',
  subject TEXT NOT NULL DEFAULT '',
  text_body TEXT DEFAULT '',
  html_body TEXT DEFAULT '',
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  is_starred BOOLEAN NOT NULL DEFAULT FALSE,
  is_trashed BOOLEAN NOT NULL DEFAULT FALSE,
  label TEXT DEFAULT 'inbox',
  direction TEXT NOT NULL DEFAULT 'inbound', -- 'inbound' | 'outbound'
  in_reply_to TEXT DEFAULT '',
  references_header TEXT DEFAULT '',
  raw_headers JSONB DEFAULT '{}'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  -- Backwards-compatibility columns
  name TEXT DEFAULT '',
  email TEXT DEFAULT '',
  recipient TEXT DEFAULT '',
  body TEXT DEFAULT '',
  status TEXT DEFAULT 'unread',
  is_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add columns if table already existed with older schema
ALTER TABLE public.inbox_messages ADD COLUMN IF NOT EXISTS resend_id TEXT UNIQUE;
ALTER TABLE public.inbox_messages ADD COLUMN IF NOT EXISTS from_name TEXT DEFAULT '';
ALTER TABLE public.inbox_messages ADD COLUMN IF NOT EXISTS from_email TEXT DEFAULT '';
ALTER TABLE public.inbox_messages ADD COLUMN IF NOT EXISTS to_email TEXT DEFAULT '';
ALTER TABLE public.inbox_messages ADD COLUMN IF NOT EXISTS text_body TEXT DEFAULT '';
ALTER TABLE public.inbox_messages ADD COLUMN IF NOT EXISTS html_body TEXT DEFAULT '';
ALTER TABLE public.inbox_messages ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.inbox_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
ALTER TABLE public.inbox_messages ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT FALSE;
ALTER TABLE public.inbox_messages ADD COLUMN IF NOT EXISTS is_trashed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.inbox_messages ADD COLUMN IF NOT EXISTS label TEXT DEFAULT 'inbox';
ALTER TABLE public.inbox_messages ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT 'inbound';
ALTER TABLE public.inbox_messages ADD COLUMN IF NOT EXISTS in_reply_to TEXT DEFAULT '';
ALTER TABLE public.inbox_messages ADD COLUMN IF NOT EXISTS references_header TEXT DEFAULT '';
ALTER TABLE public.inbox_messages ADD COLUMN IF NOT EXISTS raw_headers JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.inbox_messages ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- 3. Populate existing rows to ensure consistency
UPDATE public.inbox_messages
SET 
  from_name = COALESCE(NULLIF(from_name, ''), name, ''),
  from_email = COALESCE(NULLIF(from_email, ''), email, ''),
  to_email = COALESCE(NULLIF(to_email, ''), recipient, 'hello@zahidp.com'),
  text_body = COALESCE(NULLIF(text_body, ''), body, ''),
  is_read = COALESCE(is_read, (status = 'read'), false),
  direction = CASE WHEN is_sent THEN 'outbound' ELSE 'inbound' END
WHERE (from_name = '' OR from_name IS NULL) AND name IS NOT NULL AND name != '';

-- 4. Create index on resend_id and direction for fast lookups
CREATE INDEX IF NOT EXISTS idx_inbox_messages_resend_id ON public.inbox_messages (resend_id);
CREATE INDEX IF NOT EXISTS idx_inbox_messages_direction ON public.inbox_messages (direction);
CREATE INDEX IF NOT EXISTS idx_inbox_messages_received_at ON public.inbox_messages (received_at DESC);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- Service Role (used by webhook and server routes) has full bypass access
DROP POLICY IF EXISTS "Service role full access on inbox_messages" ON public.inbox_messages;
CREATE POLICY "Service role full access on inbox_messages"
  ON public.inbox_messages
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated admin users can select, update, and delete
DROP POLICY IF EXISTS "Admin select inbox_messages" ON public.inbox_messages;
CREATE POLICY "Admin select inbox_messages"
  ON public.inbox_messages
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin update inbox_messages" ON public.inbox_messages;
CREATE POLICY "Admin update inbox_messages"
  ON public.inbox_messages
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin delete inbox_messages" ON public.inbox_messages;
CREATE POLICY "Admin delete inbox_messages"
  ON public.inbox_messages
  FOR DELETE
  TO authenticated
  USING (true);
