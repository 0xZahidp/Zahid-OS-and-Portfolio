# FolioFrame Supabase Security & Access Audit (Hardened Revision)

**Audit Date**: 2026-11-06  
**Auditor**: Antigravity Assistant  
**Status**: Read-Only Audit & Threat Assessment Complete (Phase 0)  
**Branch**: `feature/folioframe`  

---

## Executive Summary

A comprehensive security audit of FolioFrame's database architecture, Supabase client instantiations, server route handlers, and SQL schema migrations was conducted. The audit revealed **severe security vulnerabilities** in the existing setup:

1. **Overly Permissive Schema Grants**: `supabase/schema_relational.sql` (lines 225–229) executed `GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role` and configured default privileges to grant `ALL` on future tables to `anon`.
2. **Missing RLS**: In `schema_relational.sql`, Row Level Security (RLS) was **never enabled** on any relational table (`profiles`, `bio_paragraphs`, `experiences`, `projects`, `skills`, `languages`, `social_links`, `suggested_people`, `site_settings`, `inbox_messages`, `app_settings`, `os_short_links`, `os_settings`, `os_snippets`, `os_notes`).
3. **Hardcoded Secrets in Schema Seed**: `supabase/schema_relational.sql` (lines 1402–1409) seeded live production secrets (`RESEND_API_KEY`, `CONTACT_RATE_LIMIT_SECRET`) into `public.app_settings`.
4. **Secrets Exposed via Public Route**: `src/app/api/supabase/schema-sql/route.ts` serves `schema_relational.sql` as plain text over HTTP without any authentication, exposing live API keys and secrets to anyone on the internet.
5. **Completely Unauthenticated Administrative APIs**:
   - Every administrative handler in `src/app/api/mail/` (`/messages`, `/send`, `/status`, `/backfill`) lacks authentication and reads/writes via `service_role`.
   - Every handler in `src/app/api/supabase/` (`/crud`, `/tables`, `/schema-sql`) lacks authentication and permits arbitrary table queries and schema dumps via `service_role`.
   - `/api/admin/career`, `/api/env-vault`, `/api/backup/csv`, `/api/backup/zip`, `/api/github-secret`, `/api/upload`, and `/api/os/settings` (POST) lack authentication checks.
6. **Zero Direct Client-to-Database Reads Needed**:
   - Investigation proved that **no public browser component queries Supabase directly with the `anon` key**. All public reads go through Next.js server route handlers (`/api/content`, `/api/os/settings`, `/api/os/short-links`, `/api/os/travel`), which run server-side with `service_role`.
   - Therefore, **neither `anon` nor `authenticated` requires any table-level RLS policies or grants**. Complete lockout at the PostgREST layer eliminates external database scraping and tampering while keeping the web application 100% functional.

---

## 1. Browser-Side Supabase Calls & Storage Inspection

### A. Inventory of Browser Client Usages (`src/lib/supabase/client.ts`)

The browser client is imported in exactly 8 files:

| File | Exact Calls Invoked | Touches Tables (`.from`)? | Touches Storage (`.storage`)? |
| :--- | :--- | :---: | :---: |
| `src/components/admin/AdminLogin.tsx` | `supabase.auth.mfa.getAuthenticatorAssuranceLevel()` | **NO** | **NO** |
| `src/context/AdminAuthContext.tsx` | `supabase.auth.getSession()`, `supabase.auth.onAuthStateChange()`, `supabase.auth.signInWithPassword()`, `supabase.auth.signUp()`, `supabase.auth.signOut()`, `supabase.auth.signInWithOAuth()`, `supabase.auth.signInWithPasskey()`, `supabase.auth.registerPasskey()`, `supabase.auth.mfa.listFactors()`, `supabase.auth.mfa.challengeAndVerify()`, `supabase.auth.mfa.unenroll()`, `supabase.auth.refreshSession()`, `supabase.auth.updateUser()`, `supabase.auth.resetPasswordForEmail()` | **NO** | **NO** |
| `src/components/admin/tabs/SettingsTab.tsx` | `supabase.auth.mfa.listFactors()`, `supabase.auth.mfa.enroll()`, `supabase.auth.mfa.challengeAndVerify()`, `supabase.auth.mfa.unenroll()`, `supabase.auth.refreshSession()` | **NO** | **NO** |
| `src/components/admin/tabs/InboxTab.tsx` | `supabase.channel('realtime_inbox_messages').on('postgres_changes', ...)` | **NO** | **NO** |
| `src/app/admin/mfa/page.tsx` | `supabase.auth.mfa.listFactors()` | **NO** | **NO** |
| `src/app/admin/reset-password/page.tsx` | `supabase.auth.exchangeCodeForSession()`, `supabase.auth.getSession()`, `supabase.auth.onAuthStateChange()`, `supabase.auth.updateUser()`, `supabase.auth.signOut()`, `supabase.auth.resetPasswordForEmail()` | **NO** | **NO** |
| `src/app/auth/callback/page.tsx` | `supabase.auth.exchangeCodeForSession()`, `supabase.auth.getSession()` | **NO** | **NO** |
| `src/components/auth/AuthRecoveryListener.tsx`| `supabase.auth.onAuthStateChange()` | **NO** | **NO** |

### B. Findings on Browser Database & Storage Access
- **Zero Table Queries**: `supabase.from(...)` is **never called anywhere in client components or browser code**.
- **Zero Storage Calls**: `supabase.storage` is **never called in browser code**. The `health-private` bucket is accessed exclusively server-side via route handlers (`/api/admin/health/upload`, `/file`, `/usage`) using `supabaseServer()`.
- **Realtime Channel in `InboxTab.tsx`**:
  `InboxTab.tsx` (lines 155–164) subscribes to channel `'realtime_inbox_messages'` on table `'inbox_messages'`. However, when an event occurs, it does not read the event payload; it calls `fetchMessages()` which fetches from `/api/mail/messages`.
  Because `InboxTab.tsx` relies on the authenticated server API and has internal polling/refresh controls, granting table-level `authenticated` access to `inbox_messages` is unnecessary and introduces risk if a non-admin authenticated user existed.

### C. Policy Determination for `authenticated`
Because **no browser-side client touches tables or storage**, the `authenticated` role receives:
- **NO table policies** across all tables (`profiles`, `inbox_messages`, `career_*`, `app_settings`, etc.).
- **NO storage policies** on `storage.objects` for `health-private`.
- **NO grants** on tables or sequences.

---

## 2. Server-Side vs. Anon Key Access Analysis

### A. Architectural Reality: 100% Server-Brokered Architecture

Every page, widget, and micro-app in FolioFrame fetches data through Next.js Server Components or Server Route Handlers using `supabaseServer()` (`SUPABASE_SERVICE_ROLE_KEY`):

| Resource / Public Feature | Public Browser Entry Point | Backend Server Handler | Server DB Client | Read via Browser Anon Key? |
| :--- | :--- | :--- | :--- | :---: |
| **Portfolio Profile & Bio** | `/` (Home) | `GET /api/content` | `supabaseServer()` | **NO** |
| **Projects, Experience, Skills**| `/` (Home) | `GET /api/content` | `supabaseServer()` | **NO** |
| **Languages, Socials, People** | `/` (Home) | `GET /api/content` | `supabaseServer()` | **NO** |
| **Works & Based-in Badges** | `/` (Home) | `GET /api/content` | `supabaseServer()` | **NO** |
| **Short Links Redirect** | `/s/[slug]`, `/l/[slug]` | `GET /s/[slug]/route.ts` | `supabaseServer()` | **NO** |
| **Short Links List (Public OS)**| `/os` | `GET /api/os/short-links` | `supabaseServer()` | **NO** |
| **Zahid OS Settings** | `/os` | `GET /api/os/settings` | `supabaseServer()` | **NO** |
| **Travel Districts & Memories** | `/travel`, `/os` | `GET /api/os/travel` | `supabaseServer()` | **NO** |
| **Temp Mail Inboxes & Messages** | `/os` (Temp Mail) | `GET/POST /api/os/temp-mail` | `supabaseServer()` | **NO** |
| **Public Contact Form** | `/` (Contact form) | `POST /api/mail/contact` | `supabaseServer()` | **NO** |

### B. Re-Justification of Specific Tables Against Anon Access

1. **`os_short_links`**:
   - *Direct Anon Access Needed?* **NO**. Read server-side by `/s/[slug]` (redirect engine) and `/api/os/short-links`.
   - *Private Data Check*: Contains `clicks` analytics, `last_clicked_at`, and `is_active` flags. `GET /api/os/short-links` explicitly filters out inactive/draft links for non-admins (`links.filter(l => l.is_active !== false)`). Direct anon access would expose unpublished, internal, or archived destination URLs.
   - *Policy*: **NO anon policy** (Default deny).
2. **`os_travel_districts` & `os_travel_memories`**:
   - *Direct Anon Access Needed?* **NO**. Read server-side by `GET /api/os/travel`.
   - *Private Data Check*: Memories contain personal notes, dates, and locations. The travel API formats and sanitizes this output.
   - *Policy*: **NO anon policy** (Default deny).
3. **`os_snippets`**:
   - *Direct Anon Access Needed?* **NO**. Developer snippets are statically bundled in `src/data/os-snippets.json`.
   - *Policy*: **NO anon policy** (Default deny).
4. **`os_settings` & `zahid_os_settings`**:
   - *Direct Anon Access Needed?* **NO**. Read server-side by `GET /api/os/settings`.
   - *Private Data Check*: Stores desktop permission flags and wallpaper configurations.
   - *Policy*: **NO anon policy** (Default deny).
5. **`site_settings` (including `library_data`, `zahid_os_settings`, `zahid_os_travel_data`)**:
   - *Direct Anon Access Needed?* **NO**. Read server-side by `GET /api/content` and respective route handlers.
   - *Private Data Check*: **CRITICAL HAZARD**. `site_settings` holds fallback storage for private career applications (`career_applications`) and confidential health records (`health_profile`, `health_medications`, `health_documents`, `health_visits`, `health_vitals`, `health_vaccinations`, `health_reminders`). Exposing `site_settings` to `anon` allows reading medical histories and private job applications.
   - *Policy*: **NO anon policy** (Default deny).
6. **Portfolio Tables (`profiles`, `bio_paragraphs`, `experiences`, `projects`, `skills`, `languages`, `social_links`, `suggested_people`, `portfolio_content`)**:
   - *Direct Anon Access Needed?* **NO**. Loaded server-side by `GET /api/content`.
   - *Policy*: **NO anon policy** (Default deny).

### C. The Zero-Trust Database Posture
Because all public queries are handled by Server Route Handlers operating with `service_role`:
- **The public `anon` role requires ZERO RLS policies and ZERO grants on ANY table in the database.**
- If an attacker grabs the public anon key from the client bundle and sends requests to `https://<project>.supabase.co/rest/v1/*`, PostgREST returns empty arrays or 403 Forbidden on every table.
- Direct database scraping, unauthorized mutation, and API enumeration via the anon key are eliminated.

---

## 3. Comprehensive Audit of `src/app/api/mail` and `src/app/api/supabase`

Every route under `src/app/api/mail` and `src/app/api/supabase` was inspected for admin authentication (`isAdminRequest`) and service-role usage:

### A. Routes under `src/app/api/mail/`

| Route File | Methods | Current Auth Check | Service Role Used? | Security Verdict & Risk |
| :--- | :---: | :---: | :---: | :--- |
| `src/app/api/mail/contact/route.ts` | `POST` | None (Public endpoint) | YES (`addMailMessage`) | **Intended Public**: Allows portfolio visitors to send inquiries. Protected by spam checks; writes via service role. |
| `src/app/api/mail/messages/route.ts`| `GET`, `POST`, `PATCH`, `DELETE` | **NONE** | YES (`supabaseServer()`) | **CRITICAL VULNERABILITY**: Any unauthenticated visitor can read all emails (`GET`), inject messages (`POST`), update statuses (`PATCH`), or delete/empty trash (`DELETE`). |
| `src/app/api/mail/send/route.ts` | `POST` | **NONE** | YES (`getAppSecret`, `saveSentMessage`) | **CRITICAL VULNERABILITY**: Any unauthenticated visitor can use the verified domain to send arbitrary outgoing emails via Resend. |
| `src/app/api/mail/status/route.ts` | `GET`, `POST` | **NONE** | YES (`getAppSecret`, `setAppSecret`) | **CRITICAL VULNERABILITY**: `GET` leaks domain & unread status. `POST` allows unauthenticated callers to overwrite `RESEND_DEFAULT_SENDER` and `CONTACT_FROM_EMAIL`. |
| `src/app/api/mail/backfill/route.ts`| `GET`, `POST` | **NONE** | YES (`supabaseServer()`, Resend API) | **CRITICAL VULNERABILITY**: Any caller can trigger Resend inbox sync and delete mock emails from database. |

### B. Routes under `src/app/api/supabase/`

| Route File | Methods | Current Auth Check | Service Role Used? | Security Verdict & Risk |
| :--- | :---: | :---: | :---: | :--- |
| `src/app/api/supabase/crud/route.ts` | `GET`, `POST`, `PATCH`, `DELETE` | **NONE** | YES (`SUPABASE_SERVICE_ROLE_KEY` raw fetch) | **CRITICAL VULNERABILITY**: Executes arbitrary SQL queries, insertions, mutations, and deletions across any table specified in `?table=`. |
| `src/app/api/supabase/tables/route.ts`| `GET` | **NONE** | YES (`SUPABASE_SERVICE_ROLE_KEY` raw fetch) | **HIGH VULNERABILITY**: Introspects OpenAPI definitions and dumps list of all tables and row counts. |
| `src/app/api/supabase/schema-sql/route.ts`| `GET` | **NONE** | Reads filesystem | **CRITICAL VULNERABILITY**: Serves plain-text `supabase/schema_relational.sql` containing production `RESEND_API_KEY` and rate-limit secrets. |
| `src/app/api/supabase-status/route.ts`| `GET` | **NONE** | YES (Health ping) | **MEDIUM RISK**: Pings REST endpoint with service role. |

### C. Additional Unauthenticated Routes Discovered

| Route File | Methods | Missing Auth | Risk |
| :--- | :---: | :---: | :--- |
| `src/app/api/admin/career/route.ts` | `GET`, `POST`, `PATCH`, `DELETE` | **NONE** | Unauthenticated CRUD access to private job applications and compensation data. |
| `src/app/api/env-vault/route.ts` | `GET`, `POST`, `DELETE` | **NONE** | Unauthenticated reading, setting, and deleting of production environment secrets in `app_settings`. |
| `src/app/api/backup/csv/route.ts` | `GET`, `POST` | **NONE** | Unauthenticated export and overwrite of any database table via CSV. |
| `src/app/api/backup/zip/route.ts` | `GET`, `POST` | **NONE** | Unauthenticated full-database dump and restore via ZIP. |
| `src/app/api/github-secret/route.ts` | `GET`, `POST`, `DELETE` | **NONE** | Unauthenticated reading, setting, and deleting of GitHub Personal Access Token. |
| `src/app/api/upload/route.ts` | `POST` | **NONE** | Unauthenticated file upload to server disk. |
| `src/app/api/content/route.ts` | `POST` | **NONE** | Unauthenticated mutation of portfolio profile, projects, and site settings. |
| `src/app/api/os/settings/route.ts` | `POST` | **NONE** | Unauthenticated mutation of Zahid OS settings. |
| `src/app/api/os/temp-mail/domains/route.ts` | `POST`, `DELETE` | **NONE** | Unauthenticated management of temporary mail domains. |

---

## 4. Final Proposed RLS & Access Matrix

### A. Role Grants & Privilege Revocation
```sql
-- 1. Ensure public schema usage for all roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. Revoke all default privileges on future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM anon, authenticated;

-- 3. Revoke all existing table, sequence, and routine privileges
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon, authenticated;

-- 4. Grant full privileges exclusively to service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO service_role;
```

### B. Dynamic RLS Loop (Universal Deny-by-Default)
```sql
DO $$
DECLARE
  tbl record;
BEGIN
  FOR tbl IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl.tablename);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY;', tbl.tablename);
  END LOOP;
END $$;
```

### C. Table-by-Table Policy Definitions

| Table Name | RLS Enabled | `anon` Policy | `authenticated` Policy | `service_role` Policy |
| :--- | :---: | :---: | :---: | :---: |
| **`profiles`** | **YES (Forced)** | **NONE** (Deny) | **NONE** (Deny) | Full Access (Bypass) |
| **`bio_paragraphs`** | **YES (Forced)** | **NONE** (Deny) | **NONE** (Deny) | Full Access (Bypass) |
| **`experiences`** | **YES (Forced)** | **NONE** (Deny) | **NONE** (Deny) | Full Access (Bypass) |
| **`projects`** | **YES (Forced)** | **NONE** (Deny) | **NONE** (Deny) | Full Access (Bypass) |
| **`skills`** | **YES (Forced)** | **NONE** (Deny) | **NONE** (Deny) | Full Access (Bypass) |
| **`languages`** | **YES (Forced)** | **NONE** (Deny) | **NONE** (Deny) | Full Access (Bypass) |
| **`social_links`** | **YES (Forced)** | **NONE** (Deny) | **NONE** (Deny) | Full Access (Bypass) |
| **`suggested_people`**| **YES (Forced)** | **NONE** (Deny) | **NONE** (Deny) | Full Access (Bypass) |
| **`portfolio_content`**| **YES (Forced)** | **NONE** (Deny) | **NONE** (Deny) | Full Access (Bypass) |
| **`site_settings`** | **YES (Forced)** | **NONE** (Deny) | **NONE** (Deny) | Full Access (Bypass) |
| **`os_short_links`** | **YES (Forced)** | **NONE** (Deny) | **NONE** (Deny) | Full Access (Bypass) |
| **`os_settings`** | **YES (Forced)** | **NONE** (Deny) | **NONE** (Deny) | Full Access (Bypass) |
| **`os_snippets`** | **YES (Forced)** | **NONE** (Deny) | **NONE** (Deny) | Full Access (Bypass) |
| **`os_notes`** | **YES (Forced)** | **NONE** (Deny) | **NONE** (Deny) | Full Access (Bypass) |
| **`os_travel_districts`**| **YES (Forced)** | **NONE** (Deny) | **NONE** (Deny) | Full Access (Bypass) |
| **`os_travel_memories`** | **YES (Forced)** | **NONE** (Deny) | **NONE** (Deny) | Full Access (Bypass) |
| **`os_temp_inboxes`** | **YES (Forced)** | **NONE** (Deny) | **NONE** (Deny) | Full Access (Bypass) |
| **`os_temp_messages`**| **YES (Forced)** | **NONE** (Deny) | **NONE** (Deny) | Full Access (Bypass) |
| **`os_api_saved_requests`**| **YES (Forced)** | **NONE** (Deny) | **NONE** (Deny) | Full Access (Bypass) |
| **`inbox_messages`** | **YES (Forced)** | **NONE** (Deny) | **NONE** (Deny) | Full Access (Bypass) |
| **`app_settings`** | **YES (Forced)** | **NONE** (Deny) | **NONE** (Deny) | Full Access (Bypass) |
| **`career_applications`**| **YES (Forced)** | **NONE** (Deny) | **NONE** (Deny) | Full Access (Bypass) |
| **`career_interviews`**| **YES (Forced)** | **NONE** (Deny) | **NONE** (Deny) | Full Access (Bypass) |
| **`career_contacts`**| **YES (Forced)** | **NONE** (Deny) | **NONE** (Deny) | Full Access (Bypass) |
| *Any Future Table* | **YES (Forced)** | **NONE** (Deny) | **NONE** (Deny) | Full Access (Bypass) |

### D. Private Storage Bucket: `health-private`
- **Bucket Configuration**: `public = false`, 5 MB limit, image & PDF MIME types only.
- **Policies on `storage.objects`**:
  ```sql
  DROP POLICY IF EXISTS "Service role full access on health-private" ON storage.objects;
  DROP POLICY IF EXISTS "Admin authenticated full access on health-private" ON storage.objects;
  DROP POLICY IF EXISTS "Deny anon access on health-private" ON storage.objects;
  ```
- **Result**: Zero policies created for `anon` or `authenticated`. By default RLS rules, all access by `anon` and `authenticated` is denied. Access is permitted strictly to `service_role` (which generates 60s signed URLs in `/api/admin/health/file`).

---

## 5. Implementation Roadmap (Phases 1–4)

1. **Phase 1: Secret Scrubbing & Git Audit**
   - Clean secrets from `supabase/schema_relational.sql` and replace with placeholders.
   - Run `git log --all -S` to detect any past commits containing exposed tokens (without logging secret values).
   - Generate a rotation checklist for all affected credentials.
2. **Phase 2: Database Migration Creation**
   - Create idempotent SQL file `supabase/migrations/20261106030000_security_hardening.sql`.
   - Update `schema_relational.sql`, `20261106020000_health_private.sql`, and `20261106_career_tracker.sql`.
3. **Phase 3: Codebase API Hardening**
   - Add `import "server-only";` to `src/lib/supabase/server.ts`.
   - Apply `isAdminRequest(req)` auth guards across all vulnerable routes (`/api/mail/messages`, `/api/mail/send`, `/api/mail/status`, `/api/mail/backfill`, `/api/supabase/crud`, `/api/supabase/tables`, `/api/supabase/schema-sql`, `/api/admin/career`, `/api/env-vault`, `/api/backup/*`, `/api/github-secret`, `/api/upload`, `/api/os/settings`, `/api/os/temp-mail/domains`).
4. **Phase 4: Verification & Test Suite**
   - Produce `supabase/verify-security.sql` to test RLS policies and role isolation.
   - Write `scripts/verify-rls.mjs` test runner.

---

## 6. Secrets Segregation: Environment Variables vs. Database Settings

To prevent secret leakage and credential exposure in database tables:

### A. Environment Variables (.env.local / Hosting Platform)
The following credentials **must strictly live in environment variables** (e.g. Vercel Project Settings / `.env.local`) and NEVER be seeded or permanently stored in SQL tables:

| Variable Name | Purpose | Sensitivity | Location |
| :--- | :--- | :--- | :--- |
| `SUPABASE_SERVICE_ROLE_KEY` | Bypasses all RLS on server | Critical | `.env.local` / Host Secret |
| `ADMIN_USER_ID` | UUID of designated owner | High | `.env.local` / Host Secret |
| `RESEND_API_KEY` | Mail sending & receiving API | High | `.env.local` / Host Secret |
| `RESEND_WEBHOOK_SECRET` | Svix signature verification | High | `.env.local` / Host Secret |
| `CONTACT_RATE_LIMIT_SECRET`| HMAC rate-limiting secret | High | `.env.local` / Host Secret |
| `GITHUB_TOKEN` | GitHub PAT for private contributions | High | `.env.local` / Host Secret (or masked in `app_settings`) |

### B. Database Dynamic Settings (`site_settings` / `app_settings`)
Only dynamic runtime toggles and operational configuration that administrators edit in the UI belong in database tables:

| Setting Key | Table | Purpose |
| :--- | :--- | :--- |
| `works_settings` | `site_settings` | Project display ordering and active tabs |
| `based_in_settings` | `site_settings` | Current city, country, coordinates |
| `github_settings` | `site_settings` | GitHub username, display toggles, pinned repos (token stripped) |
| `suggested_people_rich` | `site_settings` | People recommendations list |
| `library_data` | `site_settings` | Books, readings, podcasts collection |
| `temp_mail_domains` | `site_settings` | Registered domain names for temp-mail (API keys masked) |
| `os_settings` | `os_settings` | Wallpaper, audio fx, micro-app permissions |
| `CONTACT_TO_EMAIL` | `app_settings` | Target address for portfolio contact submissions |
| `CONTACT_FROM_EMAIL` | `app_settings` | Sender display name header |
| `RESEND_DEFAULT_SENDER` | `app_settings` | Sender email address for outgoing mail |

   - Execute `npx tsc --noEmit`, `npm run lint`, and production build (`NEXT_DIST_DIR=.next-prod`).
