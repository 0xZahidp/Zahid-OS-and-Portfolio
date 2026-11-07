-- ==============================================================================
-- Migration: 20261107010000_os_mail_domains.sql
-- Description: Create dedicated os_mail_domains table matching application schema
-- Enforces Row Level Security (RLS) with zero policies for anon or authenticated.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.os_mail_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  resend_domain_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  records JSONB DEFAULT '[]'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS (Default-deny for all non-bypass roles)
ALTER TABLE public.os_mail_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_mail_domains NO FORCE ROW LEVEL SECURITY;

-- Ensure zero policies exist on os_mail_domains for anon or authenticated
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN (
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'os_mail_domains'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.os_mail_domains;', pol.policyname);
    END LOOP;
END $$;

-- Grant access strictly to service_role (used by server routes)
GRANT ALL ON TABLE public.os_mail_domains TO service_role;

