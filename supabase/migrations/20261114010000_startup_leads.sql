-- ==============================================================================
-- Migration: 20261114010000_startup_leads.sql
-- Description: Dedicated Startup Leads & Outreach Radar Table
--
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/txrnbazpdyoaazszkwwq/sql/new
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.startup_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_url TEXT NOT NULL,
  normalized_company TEXT NOT NULL,
  company_name TEXT NOT NULL,
  website_domain TEXT,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('early_hiring_post', 'seed_funding')),
  track TEXT NOT NULL CHECK (track IN ('Web3 Growth', 'Full-Stack', 'Salesforce')),
  role_or_headline TEXT NOT NULL,
  startup_summary TEXT,
  contact_name TEXT,
  contact_title TEXT,
  contact_email TEXT,
  email_confidence TEXT NOT NULL DEFAULT 'missing' CHECK (email_confidence IN ('verified', 'extracted', 'guessed', 'missing')),
  pitch_hook TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'emailed', 'replied', 'promoted', 'archived')),
  post_published_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_startup_leads_source_url UNIQUE (source_url)
);

-- Deduplication Rule 2: Composite UNIQUE index on (normalized_company, role_or_headline)
CREATE UNIQUE INDEX IF NOT EXISTS uq_startup_leads_company_role 
ON public.startup_leads (normalized_company, role_or_headline);

-- Performance Indexes for Radar querying & filtering
CREATE INDEX IF NOT EXISTS idx_startup_leads_status ON public.startup_leads (status);
CREATE INDEX IF NOT EXISTS idx_startup_leads_created_at ON public.startup_leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_startup_leads_track ON public.startup_leads (track);
CREATE INDEX IF NOT EXISTS idx_startup_leads_signal_type ON public.startup_leads (signal_type);
CREATE INDEX IF NOT EXISTS idx_startup_leads_normalized_company ON public.startup_leads (normalized_company);

-- ==============================================================================
-- Row Level Security (RLS) & Zero-Trust Access Hardening
-- Matches FolioFrame's strict security posture:
-- Default-deny on anon & authenticated; access strictly granted to service_role.
-- ==============================================================================

ALTER TABLE public.startup_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_leads NO FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.startup_leads FROM anon, authenticated, PUBLIC;
GRANT ALL ON public.startup_leads TO service_role;

