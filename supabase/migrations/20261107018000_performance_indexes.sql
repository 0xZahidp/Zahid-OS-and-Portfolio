-- Migration: 20261107018000_performance_indexes.sql
-- Description: Add B-tree performance indexes on ordered columns (sort_order, is_current)
-- for public portfolio relational tables to eliminate sequential scans and sorting overhead.

-- 1. Experiences (sort_order and current status)
CREATE INDEX IF NOT EXISTS idx_experiences_sort_order ON public.experiences (sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_experiences_current_sort ON public.experiences (is_current DESC, sort_order ASC);

-- 2. Projects (sort_order)
CREATE INDEX IF NOT EXISTS idx_projects_sort_order ON public.projects (sort_order ASC);

-- 3. Skills (category, sort_order)
CREATE INDEX IF NOT EXISTS idx_skills_cat_sort ON public.skills (category, sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_skills_sort_order ON public.skills (sort_order ASC);

-- 4. Languages (sort_order)
CREATE INDEX IF NOT EXISTS idx_languages_sort_order ON public.languages (sort_order ASC);

-- 5. Social Links (sort_order)
CREATE INDEX IF NOT EXISTS idx_social_links_sort_order ON public.social_links (sort_order ASC);

-- 6. Suggested People (sort_order)
CREATE INDEX IF NOT EXISTS idx_suggested_people_sort_order ON public.suggested_people (sort_order ASC);

-- 7. Bio Paragraphs (sort_order)
CREATE INDEX IF NOT EXISTS idx_bio_paragraphs_sort_order ON public.bio_paragraphs (sort_order ASC);

