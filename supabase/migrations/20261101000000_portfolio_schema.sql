-- Migration: 20261101000000_portfolio_schema.sql
-- Description: Create portfolio_content and app_settings tables with RLS policies

-- 1. Create portfolio_content table
CREATE TABLE IF NOT EXISTS public.portfolio_content (
  id TEXT PRIMARY KEY DEFAULT 'current',
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.portfolio_content ENABLE ROW LEVEL SECURITY;

-- Allow public read access to portfolio_content
DROP POLICY IF EXISTS "Allow public read access" ON public.portfolio_content;
CREATE POLICY "Allow public read access" ON public.portfolio_content
  FOR SELECT TO public USING (true);

-- Allow service role full access
DROP POLICY IF EXISTS "Allow service role full access" ON public.portfolio_content;
CREATE POLICY "Allow service role full access" ON public.portfolio_content
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 2. Create app_settings table
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  is_secret BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow service role full access to settings" ON public.app_settings;
CREATE POLICY "Allow service role full access to settings" ON public.app_settings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3. Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_portfolio_content_updated_at ON public.portfolio_content;
CREATE TRIGGER set_portfolio_content_updated_at
  BEFORE UPDATE ON public.portfolio_content
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_app_settings_updated_at ON public.app_settings;
CREATE TRIGGER set_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

