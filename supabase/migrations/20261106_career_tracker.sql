-- Migration: 20261106_career_tracker.sql
-- Description: Create dedicated relational tables for private Career Tracker & Job Pipeline CRM with strict RLS policies

-- 1. Create career_applications table
CREATE TABLE IF NOT EXISTS public.career_applications (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'saved',
  priority TEXT NOT NULL DEFAULT 'medium',
  type TEXT DEFAULT 'job',
  company_website TEXT,
  company_location TEXT,
  location TEXT,
  remote_type TEXT DEFAULT 'remote',
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'USD',
  compensation_notes TEXT,
  job_url TEXT,
  notes TEXT,
  applied_date TIMESTAMPTZ,
  next_followup_date DATE,
  stage_changed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.career_applications ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
DROP POLICY IF EXISTS "Service role full access on career_applications" ON public.career_applications;
CREATE POLICY "Service role full access on career_applications" ON public.career_applications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Allow authenticated admin users full access
DROP POLICY IF EXISTS "Admin authenticated full access on career_applications" ON public.career_applications;
CREATE POLICY "Admin authenticated full access on career_applications" ON public.career_applications
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Disallow public / anon access completely (strict private CRM)
DROP POLICY IF EXISTS "Deny public access on career_applications" ON public.career_applications;
CREATE POLICY "Deny public access on career_applications" ON public.career_applications
  FOR ALL TO anon USING (false);

-- 2. Create career_interviews table
CREATE TABLE IF NOT EXISTS public.career_interviews (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES public.career_applications(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL DEFAULT 1,
  round_name TEXT NOT NULL,
  interview_date TIMESTAMPTZ,
  interviewer_names TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  questions_asked JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.career_interviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on career_interviews" ON public.career_interviews;
CREATE POLICY "Service role full access on career_interviews" ON public.career_interviews
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin authenticated full access on career_interviews" ON public.career_interviews;
CREATE POLICY "Admin authenticated full access on career_interviews" ON public.career_interviews
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Deny public access on career_interviews" ON public.career_interviews;
CREATE POLICY "Deny public access on career_interviews" ON public.career_interviews
  FOR ALL TO anon USING (false);

-- 3. Create career_contacts table
CREATE TABLE IF NOT EXISTS public.career_contacts (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES public.career_applications(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  email TEXT,
  linkedin_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.career_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on career_contacts" ON public.career_contacts;
CREATE POLICY "Service role full access on career_contacts" ON public.career_contacts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin authenticated full access on career_contacts" ON public.career_contacts;
CREATE POLICY "Admin authenticated full access on career_contacts" ON public.career_contacts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Deny public access on career_contacts" ON public.career_contacts;
CREATE POLICY "Deny public access on career_contacts" ON public.career_contacts
  FOR ALL TO anon USING (false);

-- 4. Triggers to automatically update updated_at
DROP TRIGGER IF EXISTS set_career_applications_updated_at ON public.career_applications;
CREATE TRIGGER set_career_applications_updated_at
  BEFORE UPDATE ON public.career_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_career_interviews_updated_at ON public.career_interviews;
CREATE TRIGGER set_career_interviews_updated_at
  BEFORE UPDATE ON public.career_interviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_career_contacts_updated_at ON public.career_contacts;
CREATE TRIGGER set_career_contacts_updated_at
  BEFORE UPDATE ON public.career_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. Indexes for fast CRM querying and filtering
CREATE INDEX IF NOT EXISTS idx_career_applications_status ON public.career_applications(status);
CREATE INDEX IF NOT EXISTS idx_career_applications_priority ON public.career_applications(priority);
CREATE INDEX IF NOT EXISTS idx_career_applications_type ON public.career_applications(type);
CREATE INDEX IF NOT EXISTS idx_career_applications_followup ON public.career_applications(next_followup_date);
CREATE INDEX IF NOT EXISTS idx_career_applications_archived ON public.career_applications(archived);
CREATE INDEX IF NOT EXISTS idx_career_interviews_app_id ON public.career_interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_career_contacts_app_id ON public.career_contacts(application_id);

