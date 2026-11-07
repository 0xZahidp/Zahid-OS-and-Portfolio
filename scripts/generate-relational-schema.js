const fs = require('fs');
const path = require('path');

const content = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/portfolio-content.json'), 'utf8'));

let sql = `-- ========================================================
-- WARNING: THIS FILE MUST NEVER BE RUN DIRECTLY.
-- This file is a legacy reference export of the relational schema.
-- Running this file directly against a live Supabase database will
-- bypass versioned migrations and zero-trust security postures.
-- Always apply the versioned migrations in \`supabase/migrations/\`.
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


-- ========================================================
-- SEED INITIAL REAL DATA
-- ========================================================
`;

function escapeSql(str) {
  if (str === null || str === undefined) return "''";
  return "'" + String(str).replace(/'/g, "''") + "'";
}

// Seed profile
const p = content.profile;
sql += `
INSERT INTO public.profiles (id, username, full_name, headline, bio, avatar_url, location, timezone, availability, github_followers_count, roles)
VALUES (
  ${escapeSql(p.id)},
  ${escapeSql(p.username)},
  ${escapeSql(p.full_name)},
  ${escapeSql(p.headline)},
  ${escapeSql(p.bio)},
  ${escapeSql(p.avatar_url)},
  ${escapeSql(p.location)},
  ${escapeSql(p.timezone)},
  ${escapeSql(p.availability)},
  ${p.github_followers_count || 0},
  ${escapeSql(JSON.stringify(p.roles || []))}::jsonb
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
`;

// Seed bio paragraphs
sql += `DELETE FROM public.bio_paragraphs;\n`;
content.bioParagraphs.forEach((para, idx) => {
  sql += `INSERT INTO public.bio_paragraphs (id, sort_order, content) VALUES ('bio-${idx + 1}', ${idx}, ${escapeSql(para)});\n`;
});

// Seed experiences
content.experience.forEach((exp, idx) => {
  sql += `INSERT INTO public.experiences (id, company, company_url, company_logo, position, period, type, workplace_type, description, highlights, bullet_points, tags, is_current, sort_order)
VALUES (
  ${escapeSql(exp.id)},
  ${escapeSql(exp.company)},
  ${escapeSql(exp.company_url || '')},
  ${escapeSql(exp.company_logo || '')},
  ${escapeSql(exp.position)},
  ${escapeSql(exp.period)},
  ${escapeSql(exp.type || 'Full-time')},
  ${escapeSql(exp.workplace_type || 'Remote')},
  ${escapeSql(exp.description || '')},
  ${escapeSql(JSON.stringify(exp.highlights || []))}::jsonb,
  ${escapeSql(JSON.stringify(exp.bullet_points || []))}::jsonb,
  ${escapeSql(JSON.stringify(exp.tags || []))}::jsonb,
  ${exp.is_current ? 'TRUE' : 'FALSE'},
  ${idx}
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
  updated_at = NOW();\n`;
});

// Seed projects
content.projects.forEach((proj, idx) => {
  sql += `INSERT INTO public.projects (id, title, description, tags, image_url, project_url, repository_url, stars, highlight_badge, logo_type, sort_order)
VALUES (
  ${escapeSql(proj.id)},
  ${escapeSql(proj.title)},
  ${escapeSql(proj.description || '')},
  ${escapeSql(JSON.stringify(proj.tags || []))}::jsonb,
  ${escapeSql(proj.image_url || '')},
  ${escapeSql(proj.project_url || '')},
  ${escapeSql(proj.repository_url || '')},
  ${proj.stars || 0},
  ${escapeSql(proj.highlightBadge || '')},
  ${escapeSql(proj.logoType || '')},
  ${idx}
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
  updated_at = NOW();\n`;
});

// Seed skills
content.skills.forEach((s, idx) => {
  sql += `INSERT INTO public.skills (id, name, category, color, sort_order)
VALUES (
  ${escapeSql(s.id)},
  ${escapeSql(s.name)},
  ${escapeSql(s.category)},
  ${escapeSql(s.color || '')},
  ${idx}
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();\n`;
});

// Seed languages
content.languages.forEach((lang, idx) => {
  const id = 'lang-' + lang.name.toLowerCase().replace(/[^a-z0-9]/g, '');
  sql += `INSERT INTO public.languages (id, name, proficiency, rating, note, has_voice, sort_order)
VALUES (
  ${escapeSql(id)},
  ${escapeSql(lang.name)},
  ${escapeSql(lang.proficiency)},
  ${lang.rating || 5},
  ${escapeSql(lang.note || '')},
  ${lang.hasVoice !== false ? 'TRUE' : 'FALSE'},
  ${idx}
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  proficiency = EXCLUDED.proficiency,
  rating = EXCLUDED.rating,
  note = EXCLUDED.note,
  has_voice = EXCLUDED.has_voice,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();\n`;
});

// Seed social_links
content.socialLinks.forEach((soc, idx) => {
  sql += `INSERT INTO public.social_links (id, platform, url, handle, label, sort_order)
VALUES (
  ${escapeSql(soc.id)},
  ${escapeSql(soc.platform)},
  ${escapeSql(soc.url)},
  ${escapeSql(soc.handle || '')},
  ${escapeSql(soc.label || '')},
  ${idx}
)
ON CONFLICT (id) DO UPDATE SET
  platform = EXCLUDED.platform,
  url = EXCLUDED.url,
  handle = EXCLUDED.handle,
  label = EXCLUDED.label,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();\n`;
});

// Seed suggested_people
content.suggestedPeople.forEach((peep, idx) => {
  sql += `INSERT INTO public.suggested_people (id, name, role, avatar_url, url, handle, sort_order)
VALUES (
  ${escapeSql(peep.id)},
  ${escapeSql(peep.name)},
  ${escapeSql(peep.role || '')},
  ${escapeSql(peep.avatar_url || '')},
  ${escapeSql(peep.url || '')},
  ${escapeSql(peep.handle || '')},
  ${idx}
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  avatar_url = EXCLUDED.avatar_url,
  url = EXCLUDED.url,
  handle = EXCLUDED.handle,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();\n`;
});

// Seed site_settings
if (content.worksSettings) {
  sql += `INSERT INTO public.site_settings (key, value) VALUES ('works_settings', ${escapeSql(JSON.stringify(content.worksSettings))}::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();\n`;
}
if (content.basedInSettings) {
  sql += `INSERT INTO public.site_settings (key, value) VALUES ('based_in_settings', ${escapeSql(JSON.stringify(content.basedInSettings))}::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();\n`;
}
if (content.githubSettings) {
  sql += `INSERT INTO public.site_settings (key, value) VALUES ('github_settings', ${escapeSql(JSON.stringify(content.githubSettings))}::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();\n`;
}

const outDir = path.join(__dirname, '../supabase');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}
const outPath = path.join(outDir, 'schema_relational.sql');
fs.writeFileSync(outPath, sql, 'utf8');
console.log('Successfully wrote:', outPath, 'Bytes:', sql.length);

