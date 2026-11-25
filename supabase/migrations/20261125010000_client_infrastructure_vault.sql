-- ==============================================================================
-- Migration: 20261125010000_client_infrastructure_vault.sql
-- Description: Unified, Platform-Agnostic Client & Infrastructure Vault
--              Tracks clients, projects, domains, cloud platforms (Supabase,
--              Vercel, Cloudflare, Railway, VPS, etc.), Git connections,
--              account emails, renewal dates, and AES-256-GCM encrypted secrets.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.client_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_name TEXT NOT NULL,
  project_name TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  primary_domain TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'live', 'maintenance', 'completed', 'paused')),
  contact_name TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '',
  contact_handle TEXT NOT NULL DEFAULT '',
  tech_stack TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS public.client_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.client_projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  category TEXT NOT NULL CHECK (category IN ('domain', 'hosting', 'database', 'git', 'email', 'payments', 'other')),
  provider TEXT NOT NULL,
  resource_name TEXT NOT NULL,
  account_email TEXT NOT NULL DEFAULT '',
  account_username TEXT NOT NULL DEFAULT '',
  connected_git_repo TEXT NOT NULL DEFAULT '',
  dashboard_url TEXT NOT NULL DEFAULT '',
  renewal_date DATE,
  billing_notes TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  encrypted_secrets TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT ''
);

-- Indexes for fast filtering & expiry tracking
CREATE INDEX IF NOT EXISTS idx_client_projects_status ON public.client_projects (status);
CREATE INDEX IF NOT EXISTS idx_client_projects_updated_at ON public.client_projects (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_resources_client_id ON public.client_resources (client_id);
CREATE INDEX IF NOT EXISTS idx_client_resources_category ON public.client_resources (category);
CREATE INDEX IF NOT EXISTS idx_client_resources_renewal_date ON public.client_resources (renewal_date) WHERE renewal_date IS NOT NULL;

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.update_client_vault_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_client_projects_updated ON public.client_projects;
CREATE TRIGGER trg_client_projects_updated
  BEFORE UPDATE ON public.client_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_client_vault_timestamp();

DROP TRIGGER IF EXISTS trg_client_resources_updated ON public.client_resources;
CREATE TRIGGER trg_client_resources_updated
  BEFORE UPDATE ON public.client_resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_client_vault_timestamp();

-- ==============================================================================
-- Row Level Security (RLS) & Zero-Trust Access Hardening
-- Default-deny on anon & authenticated; access strictly granted to service_role.
-- ==============================================================================
ALTER TABLE public.client_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_projects NO FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.client_projects FROM anon, authenticated, PUBLIC;
GRANT ALL ON public.client_projects TO service_role;

ALTER TABLE public.client_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_resources NO FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.client_resources FROM anon, authenticated, PUBLIC;
GRANT ALL ON public.client_resources TO service_role;
