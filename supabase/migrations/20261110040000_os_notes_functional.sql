-- Migration: 20261110040000_os_notes_functional.sql
-- Ensure os_notes table has all required columns and constraints for full cloud persistence

CREATE TABLE IF NOT EXISTS public.os_notes (
  id TEXT PRIMARY KEY DEFAULT 'main_scratchpad',
  title TEXT DEFAULT 'Admin Notes',
  content TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.os_notes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.os_notes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.os_notes ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Admin Notes';
ALTER TABLE public.os_notes ADD COLUMN IF NOT EXISTS content TEXT DEFAULT '';

-- Enable RLS
ALTER TABLE public.os_notes ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access
DROP POLICY IF EXISTS "Full access to os_notes" ON public.os_notes;
CREATE POLICY "Full access to os_notes" ON public.os_notes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Ensure permissions
GRANT ALL ON TABLE public.os_notes TO anon, authenticated, service_role;

