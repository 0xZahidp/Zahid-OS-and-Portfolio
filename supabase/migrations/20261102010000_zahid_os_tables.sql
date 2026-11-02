-- ============================================================
-- Zahid OS Dedicated Relational Tables Migration
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/txrnbazpdyoaazszkwwq/sql/new
-- ============================================================

-- 1. Short Links Table
CREATE TABLE IF NOT EXISTS public.os_short_links (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  clicks INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  last_clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for instant slug lookup during /s/[slug] redirects
CREATE INDEX IF NOT EXISTS idx_os_short_links_slug ON public.os_short_links (lower(slug));

-- 2. Zahid OS Configuration & Permissions Table
CREATE TABLE IF NOT EXISTS public.os_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  is_public_enabled BOOLEAN DEFAULT true,
  allow_public_link_creation BOOLEAN DEFAULT false,
  public_hero_title TEXT DEFAULT 'Zahid OS',
  public_hero_subtitle TEXT DEFAULT 'Cloud tools, web utilities & micro-apps designed by 0xZahidP',
  wallpaper TEXT DEFAULT 'emerald-mesh',
  sound_effects BOOLEAN DEFAULT true,
  app_permissions JSONB DEFAULT '{
    "shortener": { "name": "Shortener", "is_public": true },
    "qr": { "name": "QR Studio", "is_public": true },
    "notes": { "name": "Notes", "is_public": true },
    "snippets": { "name": "Snippets", "is_public": true },
    "focus": { "name": "Focus Clock", "is_public": true },
    "settings": { "name": "Settings", "is_public": false }
  }'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Developer Snippets & Cheat Sheet Table
CREATE TABLE IF NOT EXISTS public.os_snippets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  language TEXT DEFAULT 'TypeScript',
  description TEXT,
  code TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Instant Scratchpad Notes Table
CREATE TABLE IF NOT EXISTS public.os_notes (
  id TEXT PRIMARY KEY DEFAULT 'main_scratchpad',
  title TEXT DEFAULT 'Admin Notes',
  content TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Row Level Security (RLS) & Access Grants
-- ============================================================

ALTER TABLE public.os_short_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_notes ENABLE ROW LEVEL SECURITY;

-- Public can read active short links & public settings/snippets
DROP POLICY IF EXISTS "Public can read short links" ON public.os_short_links;
CREATE POLICY "Public can read short links" ON public.os_short_links
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can read os settings" ON public.os_settings;
CREATE POLICY "Public can read os settings" ON public.os_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can read os snippets" ON public.os_snippets;
CREATE POLICY "Public can read os snippets" ON public.os_snippets
  FOR SELECT USING (true);

-- Service role & Admin full access
DROP POLICY IF EXISTS "Full access to os_short_links" ON public.os_short_links;
CREATE POLICY "Full access to os_short_links" ON public.os_short_links
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access to os_settings" ON public.os_settings;
CREATE POLICY "Full access to os_settings" ON public.os_settings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access to os_snippets" ON public.os_snippets;
CREATE POLICY "Full access to os_snippets" ON public.os_snippets
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access to os_notes" ON public.os_notes;
CREATE POLICY "Full access to os_notes" ON public.os_notes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Permissions for API & Supabase Client
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.os_short_links TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.os_settings TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.os_snippets TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.os_notes TO anon, authenticated, service_role;

-- Migrate initial existing short links from site_settings (if present)
DO $$
DECLARE
  v_links jsonb;
BEGIN
  SELECT value INTO v_links FROM public.site_settings WHERE key = 'zahid_os_short_links';
  IF v_links IS NOT NULL AND jsonb_typeof(v_links) = 'array' THEN
    INSERT INTO public.os_short_links (id, slug, original_url, title, description, clicks, is_active, created_at, updated_at)
    SELECT
      elem->>'id',
      elem->>'slug',
      elem->>'original_url',
      COALESCE(elem->>'title', 'Link'),
      COALESCE(elem->>'description', ''),
      COALESCE((elem->>'clicks')::int, 0),
      COALESCE((elem->>'is_active')::boolean, true),
      COALESCE((elem->>'created_at')::timestamptz, now()),
      COALESCE((elem->>'updated_at')::timestamptz, now())
    FROM jsonb_array_elements(v_links) AS elem
    ON CONFLICT (id) DO UPDATE SET
      slug = EXCLUDED.slug,
      original_url = EXCLUDED.original_url,
      clicks = EXCLUDED.clicks,
      updated_at = EXCLUDED.updated_at;
  END IF;
END $$;

