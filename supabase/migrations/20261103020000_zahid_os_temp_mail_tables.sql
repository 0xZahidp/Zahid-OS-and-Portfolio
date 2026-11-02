-- Migration: 20261103020000_zahid_os_temp_mail_tables.sql
-- Description: Real Temp Mail Inboxes, Messages with OTP Parsing, Rate Limiting, and API Playground Saved Endpoints

-- 1. Table: Temporary Inboxes
CREATE TABLE IF NOT EXISTS public.os_temp_inboxes (
  id TEXT PRIMARY KEY,
  address TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  domain TEXT NOT NULL,
  token TEXT NOT NULL,
  ip_hash TEXT,
  ttl_seconds INTEGER DEFAULT 3600,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Index for expiration lookups and cleanups
CREATE INDEX IF NOT EXISTS idx_temp_inboxes_expires ON public.os_temp_inboxes (expires_at);
CREATE INDEX IF NOT EXISTS idx_temp_inboxes_address ON public.os_temp_inboxes (address);

-- 2. Table: Received Temporary Messages (Real Inbound via Resend)
CREATE TABLE IF NOT EXISTS public.os_temp_messages (
  id TEXT PRIMARY KEY,
  inbox_address TEXT NOT NULL REFERENCES public.os_temp_inboxes(address) ON DELETE CASCADE,
  resend_id TEXT,
  from_name TEXT,
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT DEFAULT '(No Subject)',
  snippet TEXT DEFAULT '',
  body_text TEXT DEFAULT '',
  body_html TEXT DEFAULT '',
  otp_code TEXT,
  verification_link TEXT,
  is_read BOOLEAN DEFAULT false,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_temp_messages_inbox ON public.os_temp_messages (inbox_address);
CREATE INDEX IF NOT EXISTS idx_temp_messages_received ON public.os_temp_messages (received_at DESC);
CREATE INDEX IF NOT EXISTS idx_temp_messages_expires ON public.os_temp_messages (expires_at);

-- 3. Table: API Playground Saved Requests / Endpoints (Optional Cloud Bookmarks)
CREATE TABLE IF NOT EXISTS public.os_api_saved_requests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'GET',
  url TEXT NOT NULL,
  headers JSONB DEFAULT '{}'::jsonb,
  body TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.os_temp_inboxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_temp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_api_saved_requests ENABLE ROW LEVEL SECURITY;

-- 5. Policies
-- Temp inboxes: Public can create an inbox and read with matching secret token
DROP POLICY IF EXISTS "Public can create temp inboxes" ON public.os_temp_inboxes;
CREATE POLICY "Public can create temp inboxes" ON public.os_temp_inboxes
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can read active temp inboxes" ON public.os_temp_inboxes;
CREATE POLICY "Public can read active temp inboxes" ON public.os_temp_inboxes
  FOR SELECT USING (expires_at > NOW());

DROP POLICY IF EXISTS "Public can delete own temp inboxes" ON public.os_temp_inboxes;
CREATE POLICY "Public can delete own temp inboxes" ON public.os_temp_inboxes
  FOR DELETE USING (true);

-- Temp messages: Public can read messages for non-expired inboxes
DROP POLICY IF EXISTS "Public can read temp messages" ON public.os_temp_messages;
CREATE POLICY "Public can read temp messages" ON public.os_temp_messages
  FOR SELECT USING (expires_at > NOW());

DROP POLICY IF EXISTS "Server webhook can insert temp messages" ON public.os_temp_messages;
CREATE POLICY "Server webhook can insert temp messages" ON public.os_temp_messages
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can delete temp messages" ON public.os_temp_messages;
CREATE POLICY "Public can delete temp messages" ON public.os_temp_messages
  FOR DELETE USING (true);

-- API Playground saved requests
DROP POLICY IF EXISTS "Public can read saved API requests" ON public.os_api_saved_requests;
CREATE POLICY "Public can read saved API requests" ON public.os_api_saved_requests
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can write saved API requests" ON public.os_api_saved_requests;
CREATE POLICY "Public can write saved API requests" ON public.os_api_saved_requests
  FOR ALL USING (true);

-- 6. Helper Function: Cleanup Expired Temp Mail & Messages
CREATE OR REPLACE FUNCTION public.cleanup_expired_temp_mail()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Cascade will automatically delete messages belonging to expired inboxes
  DELETE FROM public.os_temp_inboxes
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
