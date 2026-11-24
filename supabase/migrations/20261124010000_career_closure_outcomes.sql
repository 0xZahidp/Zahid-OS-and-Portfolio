-- ==============================================================================
-- Migration: 20261124010000_career_closure_outcomes.sql
-- Description: Add Closure Outcomes, Rejection Reasons, and Stage Tracking
--
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/<your-project-ref>/sql/new
-- ==============================================================================

-- 1. Create career_applications table if not already present
CREATE TABLE IF NOT EXISTS public.career_applications (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  company_name TEXT NOT NULL,
  company_website TEXT,
  company_location TEXT,
  company_logo TEXT,
  role_title TEXT NOT NULL,
  type TEXT DEFAULT 'job' CHECK (type IN ('job', 'scholarship')),
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('saved', 'applied', 'screening', 'technical', 'manager', 'offer', 'rejected', 'withdrawn')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  stage_changed_at TIMESTAMPTZ DEFAULT now(),
  source TEXT DEFAULT 'other',
  source_detail TEXT,
  source_url TEXT,
  remote_type TEXT DEFAULT 'remote' CHECK (remote_type IN ('remote', 'hybrid', 'onsite')),
  location TEXT,
  employment_type TEXT DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'internship')),
  applied_date TIMESTAMPTZ DEFAULT now(),
  deadline TIMESTAMPTZ,
  salary_currency TEXT DEFAULT 'USD',
  salary_min NUMERIC,
  salary_max NUMERIC,
  salary_period TEXT DEFAULT 'yearly' CHECK (salary_period IN ('yearly', 'monthly', 'hourly')),
  compensation_notes TEXT,
  notes TEXT,
  cv_version TEXT,
  cover_letter_url TEXT,
  portfolio_url TEXT,
  next_followup_date TIMESTAMPTZ,
  next_followup_notes TEXT,
  contacts JSONB DEFAULT '[]'::jsonb,
  interviews JSONB DEFAULT '[]'::jsonb,
  archived BOOLEAN DEFAULT false,
  -- Closure Outcome & Rejection Analytics Columns:
  closed_outcome TEXT CHECK (closed_outcome IN ('accepted', 'rejected', 'ghosted', 'withdrawn', 'offer_declined')),
  outcome_reason TEXT,
  outcome_notes TEXT,
  rejected_at_stage TEXT,
  closed_at TIMESTAMPTZ
);

-- 2. If table already exists, idempotently add the closure columns:
DO $$
BEGIN
  -- closed_outcome
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'career_applications' 
      AND column_name = 'closed_outcome'
  ) THEN
    ALTER TABLE public.career_applications ADD COLUMN closed_outcome TEXT;
    ALTER TABLE public.career_applications 
      ADD CONSTRAINT chk_career_closed_outcome 
      CHECK (closed_outcome IN ('accepted', 'rejected', 'ghosted', 'withdrawn', 'offer_declined'));
  END IF;

  -- outcome_reason
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'career_applications' 
      AND column_name = 'outcome_reason'
  ) THEN
    ALTER TABLE public.career_applications ADD COLUMN outcome_reason TEXT;
  END IF;

  -- outcome_notes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'career_applications' 
      AND column_name = 'outcome_notes'
  ) THEN
    ALTER TABLE public.career_applications ADD COLUMN outcome_notes TEXT;
  END IF;

  -- rejected_at_stage
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'career_applications' 
      AND column_name = 'rejected_at_stage'
  ) THEN
    ALTER TABLE public.career_applications ADD COLUMN rejected_at_stage TEXT;
  END IF;

  -- closed_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'career_applications' 
      AND column_name = 'closed_at'
  ) THEN
    ALTER TABLE public.career_applications ADD COLUMN closed_at TIMESTAMPTZ;
  END IF;
END $$;

-- 3. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_career_apps_status ON public.career_applications (status);
CREATE INDEX IF NOT EXISTS idx_career_apps_closed_outcome ON public.career_applications (closed_outcome);
CREATE INDEX IF NOT EXISTS idx_career_apps_closed_at ON public.career_applications (closed_at DESC);
CREATE INDEX IF NOT EXISTS idx_career_apps_rejected_at_stage ON public.career_applications (rejected_at_stage);

-- 4. RLS & Zero-Trust Security Hardening (Matches FolioFrame strict posture)
ALTER TABLE public.career_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_applications NO FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.career_applications FROM anon, authenticated, PUBLIC;
GRANT ALL ON public.career_applications TO service_role;
