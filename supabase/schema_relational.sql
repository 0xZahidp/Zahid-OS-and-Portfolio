-- ========================================================
-- FolioFrame Complete Relational Schema & Data Migration
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/txrnbazpdyoaazszkwwq/sql/new
-- ========================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  full_name TEXT NOT NULL,
  headline TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  avatar_url TEXT DEFAULT '',
  location TEXT DEFAULT '',
  timezone TEXT DEFAULT 'Asia/Dhaka',
  availability TEXT DEFAULT 'Open to new conversations',
  github_followers_count INTEGER DEFAULT 0,
  roles JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. BIO PARAGRAPHS TABLE
CREATE TABLE IF NOT EXISTS public.bio_paragraphs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  sort_order INTEGER NOT NULL DEFAULT 0,
  content TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. EXPERIENCES TABLE
CREATE TABLE IF NOT EXISTS public.experiences (
  id TEXT PRIMARY KEY,
  company TEXT NOT NULL,
  company_url TEXT DEFAULT '',
  company_logo TEXT DEFAULT '',
  position TEXT NOT NULL,
  period TEXT NOT NULL,
  type TEXT DEFAULT 'Full-time',
  workplace_type TEXT DEFAULT 'Remote',
  description TEXT DEFAULT '',
  highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
  bullet_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_current BOOLEAN DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  image_url TEXT DEFAULT '',
  project_url TEXT DEFAULT '',
  repository_url TEXT DEFAULT '',
  stars INTEGER DEFAULT 0,
  highlight_badge TEXT DEFAULT '',
  logo_type TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. SKILLS TABLE
CREATE TABLE IF NOT EXISTS public.skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'tech',
  color TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. LANGUAGES TABLE
CREATE TABLE IF NOT EXISTS public.languages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  proficiency TEXT NOT NULL DEFAULT 'Native',
  rating INTEGER DEFAULT 5,
  note TEXT DEFAULT '',
  has_voice BOOLEAN DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. SOCIAL LINKS TABLE
CREATE TABLE IF NOT EXISTS public.social_links (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  handle TEXT DEFAULT '',
  label TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. SUGGESTED PEOPLE TABLE
CREATE TABLE IF NOT EXISTS public.suggested_people (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  url TEXT DEFAULT '',
  handle TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. SITE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. INBOX MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.inbox_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread',
  is_starred BOOLEAN NOT NULL DEFAULT FALSE,
  is_sent BOOLEAN NOT NULL DEFAULT FALSE,
  recipient TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. APP SETTINGS & ENV SECRETS VAULT TABLE
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  is_secret BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE IF EXISTS public.app_settings ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- 12. GRANT PERMISSIONS (Essential for Supabase anon & service_role access)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;

-- ========================================================
-- SEED INITIAL REAL DATA
-- ========================================================

INSERT INTO public.profiles (id, username, full_name, headline, bio, avatar_url, location, timezone, availability, github_followers_count, roles)
VALUES (
  'usr_zahid',
  '0xZahidp',
  'Md Zahid Hasan Patwary',
  'I build practical web products, internal tools, and automation systems for real-world work.',
  'Product Developer & Full-Stack Builder | Building practical web applications, offline-first systems, and automation workflows that solve real problems.',
  '/images/avatar.webp',
  'Dhaka, Bangladesh',
  'Asia/Dhaka',
  'Open to new conversations',
  6,
  '[{"title":"CTO & Co-Founder","company":"Dhakaiya Bites","company_url":"https://dhakaiyabites-zeta.vercel.app/","company_logo":"/uploads/logos/logo-dhakaiya-bites-1793536613357.png"},{"title":"Jr. Software Engineer","company":"TwinForce Soluations Ltd","company_url":"https://twinforce.net","company_logo":"/uploads/logos/logo-scholar-quest-1793536616620.png"}]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  headline = EXCLUDED.headline,
  bio = EXCLUDED.bio,
  avatar_url = EXCLUDED.avatar_url,
  location = EXCLUDED.location,
  timezone = EXCLUDED.timezone,
  availability = EXCLUDED.availability,
  github_followers_count = EXCLUDED.github_followers_count,
  roles = EXCLUDED.roles,
  updated_at = NOW();
DELETE FROM public.bio_paragraphs;
INSERT INTO public.bio_paragraphs (id, sort_order, content) VALUES ('bio-1', 0, 'I build practical web products, internal tools, and automation systems for real-world work. I’m Zahid Hasan Patwary, a product developer and full-stack builder focused on turning everyday operational bottlenecks into clear, reliable software.');
INSERT INTO public.bio_paragraphs (id, sort_order, content) VALUES ('bio-2', 1, 'From offline-first restaurant POS platforms (Dhakaiya Bites) and personal finance ledgers (Zahid Finance) to scholarship application command centers (Scholar Quest) and shared-living management systems (The Shared Plate), I build systems people can actually use in production.');
INSERT INTO public.bio_paragraphs (id, sort_order, content) VALUES ('bio-3', 2, 'My engineering stack centers around React 19, Next.js, TypeScript, Supabase, PostgreSQL, Tailwind CSS, TanStack Query, and offline-first IndexedDB storage. I also design lightweight automation systems and bots leveraging Python, Telegram Bot API, and Google Sheets.');
INSERT INTO public.bio_paragraphs (id, sort_order, content) VALUES ('bio-4', 3, 'Whether you need a reliable product engineered from scratch, an offline-first architecture, or operational automation to streamline daily workflows, I own the technical roadmap, architecture, and user experience end to end.');
INSERT INTO public.experiences (id, company, company_url, company_logo, position, period, type, workplace_type, description, highlights, bullet_points, tags, is_current, sort_order)
VALUES (
  'exp-sq',
  'Scholar Quest',
  'https://sq.zahidp.com',
  '/images/avatar.webp',
  'Lead Developer & System Architect',
  '2025 – Present',
  'Contract',
  'Remote',
  'Architected a full-stack command center helping scholarship applicants organize university shortlists, IELTS preparation, application documents, professor outreach, and deadlines.',
  '[{"label":"Architecture","value":"React 19 + TanStack","icon":"code"},{"label":"Security","value":"Supabase RLS","icon":"rocket"},{"label":"Deployment","value":"Live SaaS","icon":"mobile"}]'::jsonb,
  '["One organized scholarship workflow: university shortlists, IELTS tracking, outreach, and document vault in a unified workspace.","Built with React 19, TypeScript, TanStack Router, TanStack Query, and Supabase Row Level Security.","Context-aware mentor experience with intelligent deadline notifications and applicant readiness scoring."]'::jsonb,
  '["React 19","TanStack Router","Supabase","Tailwind CSS"]'::jsonb,
  TRUE,
  0
)
ON CONFLICT (id) DO UPDATE SET
  company = EXCLUDED.company,
  company_url = EXCLUDED.company_url,
  company_logo = EXCLUDED.company_logo,
  position = EXCLUDED.position,
  period = EXCLUDED.period,
  type = EXCLUDED.type,
  workplace_type = EXCLUDED.workplace_type,
  description = EXCLUDED.description,
  highlights = EXCLUDED.highlights,
  bullet_points = EXCLUDED.bullet_points,
  tags = EXCLUDED.tags,
  is_current = EXCLUDED.is_current,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.experiences (id, company, company_url, company_logo, position, period, type, workplace_type, description, highlights, bullet_points, tags, is_current, sort_order)
VALUES (
  'exp-db',
  'Dhakaiya Bites',
  'https://db.zahidp.com',
  '/images/bidvers.webp',
  'Product Developer',
  '2025 – Present',
  'Full-time',
  'Dhaka, Bangladesh',
  'Built an offline-first restaurant POS and operations platform for orders, table management, inventory, production costing, staff workflows, payments, reports, and sync-ready data management.',
  '[{"label":"Architecture","value":"Offline-First","icon":"rocket"},{"label":"Storage Engine","value":"IndexedDB + Dexie","icon":"code"},{"label":"Operations","value":"POS + Inventory","icon":"mobile"}]'::jsonb,
  '["Offline-first POS: handles billing, tables, KOT, and inventory without requiring continuous internet connectivity.","Production costing and staff workflows: tracks ingredient usage, recipe margins, and daily sales summaries.","Sync-ready architecture: automatically pushes batched operational data to Supabase when network is restored."]'::jsonb,
  '["React","TypeScript","IndexedDB","Dexie","Supabase"]'::jsonb,
  TRUE,
  1
)
ON CONFLICT (id) DO UPDATE SET
  company = EXCLUDED.company,
  company_url = EXCLUDED.company_url,
  company_logo = EXCLUDED.company_logo,
  position = EXCLUDED.position,
  period = EXCLUDED.period,
  type = EXCLUDED.type,
  workplace_type = EXCLUDED.workplace_type,
  description = EXCLUDED.description,
  highlights = EXCLUDED.highlights,
  bullet_points = EXCLUDED.bullet_points,
  tags = EXCLUDED.tags,
  is_current = EXCLUDED.is_current,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.experiences (id, company, company_url, company_logo, position, period, type, workplace_type, description, highlights, bullet_points, tags, is_current, sort_order)
VALUES (
  'exp-ipb',
  'Independent Product Builder',
  'https://www.zahidp.com',
  '/images/gymscanner.webp',
  'Full-Stack Developer',
  '2024 – Present',
  'Full-time',
  'Remote',
  'Designing and shipping practical web products for real workflows, including restaurant operations, shared-living finance, personal finance, and community record-keeping.',
  '[{"label":"Products Shipped","value":"5+ Production Apps","icon":"rocket"},{"label":"Core Focus","value":"Shipping Systems","icon":"code"},{"label":"Stack","value":"Next.js + Supabase","icon":"mobile"}]'::jsonb,
  '["Shipped 5 production-grade web systems solving specific operational pain points for local businesses and communities.","Engineered scalable database models with PostgreSQL, Row Level Security, and automated timestamp tracking.","Designed accessible, tactile user interfaces using Tailwind CSS with keyboard-first workflows."]'::jsonb,
  '["React","Next.js","TypeScript","Supabase","Tailwind CSS"]'::jsonb,
  TRUE,
  2
)
ON CONFLICT (id) DO UPDATE SET
  company = EXCLUDED.company,
  company_url = EXCLUDED.company_url,
  company_logo = EXCLUDED.company_logo,
  position = EXCLUDED.position,
  period = EXCLUDED.period,
  type = EXCLUDED.type,
  workplace_type = EXCLUDED.workplace_type,
  description = EXCLUDED.description,
  highlights = EXCLUDED.highlights,
  bullet_points = EXCLUDED.bullet_points,
  tags = EXCLUDED.tags,
  is_current = EXCLUDED.is_current,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.experiences (id, company, company_url, company_logo, position, period, type, workplace_type, description, highlights, bullet_points, tags, is_current, sort_order)
VALUES (
  'exp-zf',
  'Zahid Finance',
  'https://finance.zahidp.com',
  '/images/invo.webp',
  'Full-stack Developer',
  '2025 – Present',
  'Full-time',
  'Remote',
  'Created a personal finance and trust-money ledger to track income, expenses, lending, borrowing, held funds, reminders, recurring transactions, approvals, reports, and email-based records.',
  '[]'::jsonb,
  '["Relationship-based ledger: separates personal income/expenses from funds held in trust for others or lent out.","Automated financial health overview with net worth calculation, settlement tracking, and payment reminders.","Built as a lightweight, installable PWA for high performance on both mobile and desktop."]'::jsonb,
  '["React","TypeScript","Supabase","PWA"]'::jsonb,
  TRUE,
  3
)
ON CONFLICT (id) DO UPDATE SET
  company = EXCLUDED.company,
  company_url = EXCLUDED.company_url,
  company_logo = EXCLUDED.company_logo,
  position = EXCLUDED.position,
  period = EXCLUDED.period,
  type = EXCLUDED.type,
  workplace_type = EXCLUDED.workplace_type,
  description = EXCLUDED.description,
  highlights = EXCLUDED.highlights,
  bullet_points = EXCLUDED.bullet_points,
  tags = EXCLUDED.tags,
  is_current = EXCLUDED.is_current,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.experiences (id, company, company_url, company_logo, position, period, type, workplace_type, description, highlights, bullet_points, tags, is_current, sort_order)
VALUES (
  'exp-tsp',
  'The Shared Plate',
  'https://www.zahidp.com',
  '/images/mytapcard.webp',
  'Full-stack Developer',
  '2025 – Present',
  'Full-time',
  'Remote',
  'Built a shared-living management system for meal tracking, grocery and bazar records, member payables, rent, settlements, absence tracking, and monthly reporting.',
  '[]'::jsonb,
  '["Shared household ledger: tracks daily meal counts, grocery contributions, utility bills, and individual net balances.","Automated end-of-month settlement reports eliminating manual disputes and ledger calculation errors.","Responsive, mobile-optimized interface with granular member permission roles."]'::jsonb,
  '["React","TypeScript","Supabase","Tailwind CSS"]'::jsonb,
  TRUE,
  4
)
ON CONFLICT (id) DO UPDATE SET
  company = EXCLUDED.company,
  company_url = EXCLUDED.company_url,
  company_logo = EXCLUDED.company_logo,
  position = EXCLUDED.position,
  period = EXCLUDED.period,
  type = EXCLUDED.type,
  workplace_type = EXCLUDED.workplace_type,
  description = EXCLUDED.description,
  highlights = EXCLUDED.highlights,
  bullet_points = EXCLUDED.bullet_points,
  tags = EXCLUDED.tags,
  is_current = EXCLUDED.is_current,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.experiences (id, company, company_url, company_logo, position, period, type, workplace_type, description, highlights, bullet_points, tags, is_current, sort_order)
VALUES (
  'exp-madrasah',
  'Madrasah Ledger & Automation',
  'https://www.zahidp.com',
  '/images/prompt.webp',
  'Automation Developer',
  '2024 – Present',
  'Freelance',
  'Remote',
  'Developing lightweight administrative tools and Telegram bots that simplify recurring tasks through structured data capture, reminders, confirmations, reporting, and clear audit-friendly records.',
  '[]'::jsonb,
  '["Built Telegram bot workflows automating administrative student attendance and monthly fee collection reminders.","Engineered Google Sheets API sync pipeline for auto-generating weekly financial audit sheets.","Reduced manual administrative workload by over 10 hours weekly."]'::jsonb,
  '["Python","Telegram Bot API","Google Sheets API","Automation"]'::jsonb,
  TRUE,
  5
)
ON CONFLICT (id) DO UPDATE SET
  company = EXCLUDED.company,
  company_url = EXCLUDED.company_url,
  company_logo = EXCLUDED.company_logo,
  position = EXCLUDED.position,
  period = EXCLUDED.period,
  type = EXCLUDED.type,
  workplace_type = EXCLUDED.workplace_type,
  description = EXCLUDED.description,
  highlights = EXCLUDED.highlights,
  bullet_points = EXCLUDED.bullet_points,
  tags = EXCLUDED.tags,
  is_current = EXCLUDED.is_current,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.experiences (id, company, company_url, company_logo, position, period, type, workplace_type, description, highlights, bullet_points, tags, is_current, sort_order)
VALUES (
  'exp-bidvers',
  'Bidvers',
  'https://bidvers.com',
  '/images/bidvers.webp',
  'Chief Technology Officer',
  'Nov 2025 – Present',
  'Full-time',
  'Remote',
  'Hand-picked by GymScanner’s CEO to build his next company from day one. I own the architecture and technical roadmap as Bidvers operates in the US, Oman and Romania.',
  '[{"label":"Raised","value":"$120K+","icon":"rocket"},{"label":"Built from scratch","value":"Core + API","icon":"code"},{"label":"Mobile Apps","value":"iOS + Android","icon":"mobile"}]'::jsonb,
  '["Core platform and API: architected and built them from a blank repo; the team’s iOS and Android apps are built on top.","Bidding engine: built a low-latency, real-time engine on the TALL stack (Tailwind, Alpine.js, Laravel, Livewire).","Payments and vendors: shipped secure payment routing and complex vendor workflows for operations in the US, Oman and Romania."]'::jsonb,
  '["Laravel","Livewire","Alpine.js","Tailwind CSS"]'::jsonb,
  TRUE,
  6
)
ON CONFLICT (id) DO UPDATE SET
  company = EXCLUDED.company,
  company_url = EXCLUDED.company_url,
  company_logo = EXCLUDED.company_logo,
  position = EXCLUDED.position,
  period = EXCLUDED.period,
  type = EXCLUDED.type,
  workplace_type = EXCLUDED.workplace_type,
  description = EXCLUDED.description,
  highlights = EXCLUDED.highlights,
  bullet_points = EXCLUDED.bullet_points,
  tags = EXCLUDED.tags,
  is_current = EXCLUDED.is_current,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.projects (id, title, description, tags, image_url, project_url, repository_url, stars, highlight_badge, logo_type, sort_order)
VALUES (
  'proj-sq',
  'Scholar Quest',
  'A full-stack command center that helps scholarship applicants manage university shortlists, IELTS preparation, application documents, professor outreach, finances, deadlines, and progress in one focused workspace.',
  '["React 19","TypeScript","TanStack Router","TanStack Query","Supabase"]'::jsonb,
  '',
  'https://sq.zahidp.com',
  '',
  42,
  'EdTech Command Center',
  'prompt',
  0
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  tags = EXCLUDED.tags,
  image_url = EXCLUDED.image_url,
  project_url = EXCLUDED.project_url,
  repository_url = EXCLUDED.repository_url,
  stars = EXCLUDED.stars,
  highlight_badge = EXCLUDED.highlight_badge,
  logo_type = EXCLUDED.logo_type,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.projects (id, title, description, tags, image_url, project_url, repository_url, stars, highlight_badge, logo_type, sort_order)
VALUES (
  'proj-zf',
  'Zahid Finance',
  'A relationship-based personal ledger and trust-money tracking system designed for individuals managing loans, shared commitments, and net worth overview.',
  '["React","TypeScript","Supabase","Tailwind CSS","PWA"]'::jsonb,
  '',
  'https://finance.zahidp.com',
  'https://github.com/0xzahidp/zahid-finance',
  38,
  'Personal Finance & Trust',
  'invo',
  1
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  tags = EXCLUDED.tags,
  image_url = EXCLUDED.image_url,
  project_url = EXCLUDED.project_url,
  repository_url = EXCLUDED.repository_url,
  stars = EXCLUDED.stars,
  highlight_badge = EXCLUDED.highlight_badge,
  logo_type = EXCLUDED.logo_type,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.projects (id, title, description, tags, image_url, project_url, repository_url, stars, highlight_badge, logo_type, sort_order)
VALUES (
  'proj-db',
  'Dhakaiya Bites',
  'An offline-first restaurant POS and operations platform for orders, table management, inventory, production costing, staff workflows, and reports.',
  '["React","TypeScript","IndexedDB","Dexie","Supabase"]'::jsonb,
  '',
  'https://db.zahidp.com',
  '',
  24,
  'Offline-First POS',
  'bidvers',
  2
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  tags = EXCLUDED.tags,
  image_url = EXCLUDED.image_url,
  project_url = EXCLUDED.project_url,
  repository_url = EXCLUDED.repository_url,
  stars = EXCLUDED.stars,
  highlight_badge = EXCLUDED.highlight_badge,
  logo_type = EXCLUDED.logo_type,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.projects (id, title, description, tags, image_url, project_url, repository_url, stars, highlight_badge, logo_type, sort_order)
VALUES (
  'proj-tsp',
  'The Shared Plate',
  'A shared-living management system for meal tracking, grocery and bazar records, member payables, rent, settlements, absence tracking, and monthly reporting.',
  '["React","TypeScript","Supabase","Tailwind CSS"]'::jsonb,
  '',
  'https://www.zahidp.com',
  '',
  19,
  'Shared Living System',
  'mytapcard',
  3
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  tags = EXCLUDED.tags,
  image_url = EXCLUDED.image_url,
  project_url = EXCLUDED.project_url,
  repository_url = EXCLUDED.repository_url,
  stars = EXCLUDED.stars,
  highlight_badge = EXCLUDED.highlight_badge,
  logo_type = EXCLUDED.logo_type,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.projects (id, title, description, tags, image_url, project_url, repository_url, stars, highlight_badge, logo_type, sort_order)
VALUES (
  'proj-booknagar',
  'Book-Nagar',
  'A full-stack web application for exploring, managing, and discovering books with user libraries, book reviews, and reading collections.',
  '["React","Node.js","MongoDB","Express","Tailwind CSS"]'::jsonb,
  '',
  'https://www.zahidp.com/en/projects/book-nagar',
  'https://github.com/0xzahidp/book-nagar',
  15,
  'Web Application',
  'laravel',
  4
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  tags = EXCLUDED.tags,
  image_url = EXCLUDED.image_url,
  project_url = EXCLUDED.project_url,
  repository_url = EXCLUDED.repository_url,
  stars = EXCLUDED.stars,
  highlight_badge = EXCLUDED.highlight_badge,
  logo_type = EXCLUDED.logo_type,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.projects (id, title, description, tags, image_url, project_url, repository_url, stars, highlight_badge, logo_type, sort_order)
VALUES (
  'proj-madrasah',
  'Madrasah Automation Tools',
  'Lightweight administrative tools and Telegram bots that simplify recurring administrative tasks through structured data capture, reminders, and audit-friendly records.',
  '["Python","Telegram Bot API","Google Sheets API","Automation"]'::jsonb,
  '',
  'https://www.zahidp.com',
  '',
  29,
  'Telegram Bot & Automation',
  'prompt',
  5
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  tags = EXCLUDED.tags,
  image_url = EXCLUDED.image_url,
  project_url = EXCLUDED.project_url,
  repository_url = EXCLUDED.repository_url,
  stars = EXCLUDED.stars,
  highlight_badge = EXCLUDED.highlight_badge,
  logo_type = EXCLUDED.logo_type,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.projects (id, title, description, tags, image_url, project_url, repository_url, stars, highlight_badge, logo_type, sort_order)
VALUES (
  'proj-bidvers',
  'Bidvers',
  'Core platform and API behind a real-time hotel upgrade bidding marketplace operating in the US, Oman and Romania.',
  '["Laravel","API","Real-time","Livewire"]'::jsonb,
  '',
  'https://bidvers.com',
  '',
  54,
  '$120K+ raised',
  'bidvers',
  6
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  tags = EXCLUDED.tags,
  image_url = EXCLUDED.image_url,
  project_url = EXCLUDED.project_url,
  repository_url = EXCLUDED.repository_url,
  stars = EXCLUDED.stars,
  highlight_badge = EXCLUDED.highlight_badge,
  logo_type = EXCLUDED.logo_type,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.projects (id, title, description, tags, image_url, project_url, repository_url, stars, highlight_badge, logo_type, sort_order)
VALUES (
  'proj-learn-laravel',
  'Learn Laravel',
  'Self-learning resources to level up your Laravel skills: tutorials, ebooks, blogs and courses for modern web developers.',
  '["Open source","Laravel","Learning","PHP"]'::jsonb,
  '',
  '',
  'https://github.com/0xzahidp/learn-laravel',
  186,
  'Open source',
  'laravel',
  7
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  tags = EXCLUDED.tags,
  image_url = EXCLUDED.image_url,
  project_url = EXCLUDED.project_url,
  repository_url = EXCLUDED.repository_url,
  stars = EXCLUDED.stars,
  highlight_badge = EXCLUDED.highlight_badge,
  logo_type = EXCLUDED.logo_type,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.skills (id, name, category, color, sort_order)
VALUES (
  'claude',
  'Claude',
  'ai',
  '#d97757',
  0
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.skills (id, name, category, color, sort_order)
VALUES (
  'openai',
  'OpenAI',
  'ai',
  '#10a37f',
  1
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.skills (id, name, category, color, sort_order)
VALUES (
  'antigravity',
  'Antigravity',
  'ai',
  '#6366f1',
  2
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.skills (id, name, category, color, sort_order)
VALUES (
  'opencode',
  'OpenCode',
  'ai',
  '#0ea5e9',
  3
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.skills (id, name, category, color, sort_order)
VALUES (
  'telegram-bot',
  'Telegram Bot API',
  'ai',
  '#24A1DE',
  4
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.skills (id, name, category, color, sort_order)
VALUES (
  'python',
  'Python',
  'ai',
  '#3776AB',
  5
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.skills (id, name, category, color, sort_order)
VALUES (
  'react',
  'React 19',
  'tech',
  '',
  6
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.skills (id, name, category, color, sort_order)
VALUES (
  'nextjs',
  'Next.js',
  'tech',
  '',
  7
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.skills (id, name, category, color, sort_order)
VALUES (
  'typescript',
  'TypeScript',
  'tech',
  '',
  8
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.skills (id, name, category, color, sort_order)
VALUES (
  'javascript',
  'JavaScript',
  'tech',
  '',
  9
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.skills (id, name, category, color, sort_order)
VALUES (
  'supabase',
  'Supabase',
  'tech',
  '',
  10
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.skills (id, name, category, color, sort_order)
VALUES (
  'tailwind',
  'Tailwind CSS',
  'tech',
  '',
  11
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.skills (id, name, category, color, sort_order)
VALUES (
  'tanstack',
  'TanStack Query',
  'tech',
  '',
  12
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.skills (id, name, category, color, sort_order)
VALUES (
  'indexeddb',
  'IndexedDB / Dexie',
  'tech',
  '',
  13
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.skills (id, name, category, color, sort_order)
VALUES (
  'laravel',
  'Laravel',
  'tech',
  '',
  14
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.skills (id, name, category, color, sort_order)
VALUES (
  'php',
  'PHP',
  'tech',
  '',
  15
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.skills (id, name, category, color, sort_order)
VALUES (
  'livewire',
  'Livewire',
  'tech',
  '',
  16
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.skills (id, name, category, color, sort_order)
VALUES (
  'alpine',
  'Alpine.js',
  'tech',
  '',
  17
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.skills (id, name, category, color, sort_order)
VALUES (
  'vue',
  'Vue.js',
  'tech',
  '',
  18
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.skills (id, name, category, color, sort_order)
VALUES (
  'vscode',
  'VS Code',
  'tool',
  '',
  19
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.skills (id, name, category, color, sort_order)
VALUES (
  'git',
  'Git',
  'tool',
  '',
  20
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.skills (id, name, category, color, sort_order)
VALUES (
  'github',
  'GitHub',
  'tool',
  '',
  21
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.skills (id, name, category, color, sort_order)
VALUES (
  'vercel',
  'Vercel',
  'tool',
  '',
  22
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.skills (id, name, category, color, sort_order)
VALUES (
  'vite',
  'Vite',
  'tool',
  '',
  23
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.skills (id, name, category, color, sort_order)
VALUES (
  'figma',
  'Figma',
  'tool',
  '',
  24
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.languages (id, name, proficiency, rating, note, has_voice, sort_order)
VALUES (
  'lang-english',
  'English',
  'Near-native',
  5,
  'Professional & technical communication',
  TRUE,
  0
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  proficiency = EXCLUDED.proficiency,
  rating = EXCLUDED.rating,
  note = EXCLUDED.note,
  has_voice = EXCLUDED.has_voice,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.languages (id, name, proficiency, rating, note, has_voice, sort_order)
VALUES (
  'lang-bangla',
  'Bangla',
  'Native',
  5,
  'Native tongue',
  TRUE,
  1
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  proficiency = EXCLUDED.proficiency,
  rating = EXCLUDED.rating,
  note = EXCLUDED.note,
  has_voice = EXCLUDED.has_voice,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.languages (id, name, proficiency, rating, note, has_voice, sort_order)
VALUES (
  'lang-arabic',
  'Arabic',
  'Reading and small talk',
  3,
  'Conversational & liturgical reading',
  TRUE,
  2
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  proficiency = EXCLUDED.proficiency,
  rating = EXCLUDED.rating,
  note = EXCLUDED.note,
  has_voice = EXCLUDED.has_voice,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.social_links (id, platform, url, handle, label, sort_order)
VALUES (
  'soc-telegram',
  'peerlist',
  'https://t.me/0xzahidp',
  '@OxZahidP',
  'Telegram',
  0
)
ON CONFLICT (id) DO UPDATE SET
  platform = EXCLUDED.platform,
  url = EXCLUDED.url,
  handle = EXCLUDED.handle,
  label = EXCLUDED.label,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.social_links (id, platform, url, handle, label, sort_order)
VALUES (
  'soc-github',
  'github',
  'https://github.com/0xzahidp',
  '@0xzahidp',
  'GitHub',
  1
)
ON CONFLICT (id) DO UPDATE SET
  platform = EXCLUDED.platform,
  url = EXCLUDED.url,
  handle = EXCLUDED.handle,
  label = EXCLUDED.label,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.social_links (id, platform, url, handle, label, sort_order)
VALUES (
  'soc-x',
  'x',
  'https://x.com/0xzahidp',
  '@0xzahidp',
  'X (Twitter)',
  2
)
ON CONFLICT (id) DO UPDATE SET
  platform = EXCLUDED.platform,
  url = EXCLUDED.url,
  handle = EXCLUDED.handle,
  label = EXCLUDED.label,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.social_links (id, platform, url, handle, label, sort_order)
VALUES (
  'soc-linkedin',
  'linkedin',
  'https://www.linkedin.com/in/oxzahidp',
  'in/oxzahidp',
  'LinkedIn',
  3
)
ON CONFLICT (id) DO UPDATE SET
  platform = EXCLUDED.platform,
  url = EXCLUDED.url,
  handle = EXCLUDED.handle,
  label = EXCLUDED.label,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.social_links (id, platform, url, handle, label, sort_order)
VALUES (
  'soc-facebook',
  'facebook',
  'https://facebook.com/0xzahidp',
  '0xzahidp',
  'Facebook',
  4
)
ON CONFLICT (id) DO UPDATE SET
  platform = EXCLUDED.platform,
  url = EXCLUDED.url,
  handle = EXCLUDED.handle,
  label = EXCLUDED.label,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.suggested_people (id, name, role, avatar_url, url, handle, sort_order)
VALUES (
  'person-hasin',
  'Hasin Hayder',
  'Product Architect & Founder of TyroLabs',
  'https://avatars.githubusercontent.com/u/490779?v=4',
  'https://github.com/hasinhayder',
  'hasinhayder',
  0
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  avatar_url = EXCLUDED.avatar_url,
  url = EXCLUDED.url,
  handle = EXCLUDED.handle,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.suggested_people (id, name, role, avatar_url, url, handle, sort_order)
VALUES (
  'person-zahin',
  'Zahin Mohammad',
  'Web Developer (React, Next.js, Go)',
  'https://avatars.githubusercontent.com/u/105446082?v=4',
  'https://github.com/IsHereZahin',
  'IsHereZahin',
  1
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  avatar_url = EXCLUDED.avatar_url,
  url = EXCLUDED.url,
  handle = EXCLUDED.handle,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.suggested_people (id, name, role, avatar_url, url, handle, sort_order)
VALUES (
  'person-rezaur',
  'Rezaur Rahman',
  'Senior Software Engineer (Distributed Systems)',
  'https://avatars.githubusercontent.com/u/68007353?v=4',
  'https://github.com/RezaurOfficial',
  'RezaurOfficial',
  2
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  avatar_url = EXCLUDED.avatar_url,
  url = EXCLUDED.url,
  handle = EXCLUDED.handle,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.suggested_people (id, name, role, avatar_url, url, handle, sort_order)
VALUES (
  'person-aniruddha',
  'Aniruddha Adhikary (Ani)',
  'Software Engineer @GovTechSG (Singapore)',
  'https://avatars.githubusercontent.com/u/932949?v=4',
  'https://github.com/aniruddha-adhikary',
  'aniruddha-adhikary',
  3
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  avatar_url = EXCLUDED.avatar_url,
  url = EXCLUDED.url,
  handle = EXCLUDED.handle,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.suggested_people (id, name, role, avatar_url, url, handle, sort_order)
VALUES (
  'person-tahsin',
  'Md. Tahsinul Hoque Siddiki',
  'DevOps & Cloud Automation Engineer',
  'https://avatars.githubusercontent.com/u/107357207?v=4',
  'https://github.com/tahsinulhoque',
  'tahsinulhoque',
  4
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  avatar_url = EXCLUDED.avatar_url,
  url = EXCLUDED.url,
  handle = EXCLUDED.handle,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.suggested_people (id, name, role, avatar_url, url, handle, sort_order)
VALUES (
  'person-emran',
  'Emran Haque',
  'Web3 & Community Relations Specialist',
  'https://avatars.githubusercontent.com/u/55331321?v=4',
  'https://github.com/Emranrx02',
  'Emranrx02',
  5
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  avatar_url = EXCLUDED.avatar_url,
  url = EXCLUDED.url,
  handle = EXCLUDED.handle,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.suggested_people (id, name, role, avatar_url, url, handle, sort_order)
VALUES (
  'person-sani',
  'Sanaullah Sani',
  'Full Stack Web Developer',
  'https://avatars.githubusercontent.com/u/66258879?v=4',
  'https://github.com/ssani7',
  'ssani7',
  6
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  avatar_url = EXCLUDED.avatar_url,
  url = EXCLUDED.url,
  handle = EXCLUDED.handle,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.suggested_people (id, name, role, avatar_url, url, handle, sort_order)
VALUES (
  'person-benaiah',
  'Benaiah',
  'Full Stack Builder & Software Engineer',
  'https://avatars.githubusercontent.com/u/65370456?v=4',
  'https://github.com/Benrobo',
  'Benrobo',
  7
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  avatar_url = EXCLUDED.avatar_url,
  url = EXCLUDED.url,
  handle = EXCLUDED.handle,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.suggested_people (id, name, role, avatar_url, url, handle, sort_order)
VALUES (
  'person-roman',
  'Roman Mendaliev',
  'Software Developer',
  'https://avatars.githubusercontent.com/u/21079607?v=4',
  'https://github.com/reacheight',
  'reacheight',
  8
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  avatar_url = EXCLUDED.avatar_url,
  url = EXCLUDED.url,
  handle = EXCLUDED.handle,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.suggested_people (id, name, role, avatar_url, url, handle, sort_order)
VALUES (
  'person-prottoy',
  'ABM Prottoy',
  'Software Developer (Dhaka)',
  'https://avatars.githubusercontent.com/u/115341293?v=4',
  'https://github.com/abmprottoy',
  'abmprottoy',
  9
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  avatar_url = EXCLUDED.avatar_url,
  url = EXCLUDED.url,
  handle = EXCLUDED.handle,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.suggested_people (id, name, role, avatar_url, url, handle, sort_order)
VALUES (
  'person-shakib',
  'Shakibul Islam',
  'Web Developer (Dhaka)',
  'https://avatars.githubusercontent.com/u/206897066?v=4',
  'https://github.com/shakib5551',
  'shakib5551',
  10
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  avatar_url = EXCLUDED.avatar_url,
  url = EXCLUDED.url,
  handle = EXCLUDED.handle,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.suggested_people (id, name, role, avatar_url, url, handle, sort_order)
VALUES (
  'person-syed',
  'Syed Eftasum Alam',
  'Computer Science & Engineering Graduate',
  'https://avatars.githubusercontent.com/u/62606974?v=4',
  'https://github.com/Syed-Eftasum-Alam',
  'Syed-Eftasum-Alam',
  11
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  avatar_url = EXCLUDED.avatar_url,
  url = EXCLUDED.url,
  handle = EXCLUDED.handle,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
INSERT INTO public.site_settings (key, value) VALUES ('works_settings', '{"heading":"Remote-first","description":"Comfortable working with teams in any time zone, from the Americas to Europe to Asia-Pacific.","chips":["Remote","Async-friendly","US hours","EU hours","Flexible schedule"]}'::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
INSERT INTO public.site_settings (key, value) VALUES ('based_in_settings', '{"city":"Dhaka","country":"Bangladesh","timezone":"Asia/Dhaka","timeString":"8:29 PM","gmtOffset":"GMT+6"}'::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
INSERT INTO public.site_settings (key, value) VALUES ('github_settings', '{"username":"0xZahidp","followersCount":6,"totalContributions":1378,"totalRepos":92}'::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

INSERT INTO public.app_settings (key, value, is_secret, description)
VALUES 
  ('RESEND_API_KEY', 're_ZDpWhajB_JZ6cCMrkca3p9EbFDcJCwq2E', TRUE, 'Resend API key for inbox communications and contact form dispatches'),
  ('CONTACT_RATE_LIMIT_SECRET', 'd14e27bfeffe65f7544ebf67803b71b0984288fb9fb010d0b5ebd3b8db54235c', TRUE, 'HMAC secret token used for public rate limiting'),
  ('CONTACT_TO_EMAIL', 'mdzahidhasanpatwary@gmail.com', FALSE, 'Destination email for portfolio contact form inquiries'),
  ('CONTACT_FROM_EMAIL', 'Md Zahid Hasan <hello@zahidp.com>', FALSE, 'Default sender identity for outbound emails'),
  ('NEXT_PUBLIC_SITE_URL', 'https://zahidp.com', FALSE, 'Canonical domain for OpenGraph meta tags and SEO')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  is_secret = EXCLUDED.is_secret,
  description = EXCLUDED.description,
  updated_at = NOW();
