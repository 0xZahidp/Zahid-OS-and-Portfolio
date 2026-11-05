# FolioFrame Supabase Security & Access Audit

**Audit Date**: 2026-11-06  
**Auditor**: Antigravity Assistant  
**Status**: Read-Only Audit Complete (Phase 0)  
**Branch**: `feature/folioframe`  

---

## Executive Summary

A comprehensive security audit of FolioFrame's database architecture, Supabase client instantiations, API routes, and schema files was conducted. The audit revealed **critical security vulnerabilities** in the existing PostgreSQL setup:

1. **Overly Permissive Grants**: `supabase/schema_relational.sql` (lines 225–229) executed:
   ```sql
   GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
   GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
   GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
   ```
2. **Missing RLS**: In `schema_relational.sql`, Row Level Security (RLS) was **not enabled** on any table (`profiles`, `bio_paragraphs`, `experiences`, `projects`, `skills`, `languages`, `social_links`, `suggested_people`, `site_settings`, `inbox_messages`, `app_settings`, `os_short_links`, `os_settings`, `os_snippets`, `os_notes`). Combined with `GRANT ALL ... TO anon`, anyone holding the public anon key can read, modify, or delete any record directly via Supabase PostgREST.
3. **Hardcoded Secrets in Schema Seed**: `supabase/schema_relational.sql` (lines 1402–1409) seeded live production secrets (`RESEND_API_KEY`, `CONTACT_RATE_LIMIT_SECRET`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `NEXT_PUBLIC_SITE_URL`) directly into `public.app_settings`.
4. **Publicly Exposed Sensitive Settings**: Private CRM data (`career_applications`) and private medical data (`health_*`) fall back to `site_settings`. Without row-level restriction, an anonymous client querying `site_settings` can inspect private medical logs and job pipelines.
5. **Unauthenticated API Endpoints**: Several Next.js API routes used `service_role` or read/write operations without verifying administrative credentials:
   - `/api/env-vault` (GET, POST, DELETE): Unrestricted access to `app_settings` secrets.
   - `/api/supabase/crud` & `/api/supabase/tables`: Arbitrary database inspection/mutation with `service_role`.
   - `/api/backup/csv` & `/api/backup/zip`: Unauthenticated whole-database export and restore.
   - `/api/admin/career`: CRUD pipeline had no admin authentication gate.
   - `/api/content` (POST): Content upsert had no admin gate.

This document inventories every client, table, storage bucket, and public interaction, then defines a hardened access matrix and idempotent RLS policy set.

---

## 1. Supabase Client Inventory

There are two official Supabase client factories and three ad-hoc REST/script callers:

| Client Location | Environment | Auth Key Used | Role / Privilege Level | Server-Only Guard |
| :--- | :--- | :--- | :--- | :--- |
| `src/lib/supabase/client.ts` | Browser / Client | `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `anon` | N/A (Client singleton) |
| `src/lib/supabase/server.ts` | Server | `SUPABASE_SERVICE_ROLE_KEY` | `service_role` (Bypasses RLS) | Needs `import "server-only";` (Phase 3) |
| `src/app/api/supabase/crud/route.ts` | Server Route | `SUPABASE_SERVICE_ROLE_KEY` | `service_role` | Raw REST fetch |
| `src/app/api/supabase/tables/route.ts` | Server Route | `SUPABASE_SERVICE_ROLE_KEY` | `service_role` | Raw REST fetch |
| `src/app/api/supabase-status/route.ts` | Server Route | `SUPABASE_SERVICE_ROLE_KEY` | `service_role` | Raw REST fetch |
| `scripts/backfill-resend-emails.mjs` | Node.js Script | `SUPABASE_SERVICE_ROLE_KEY` | `service_role` | Standalone CLI script |

### Key Exposure Verification
- **Service Role Key Verification**: `SUPABASE_SERVICE_ROLE_KEY` is **never imported into client components** and **never has a `NEXT_PUBLIC_` prefix**.
- References to `SUPABASE_SERVICE_ROLE_KEY` in `src/components/admin/tabs/ZahidOsTab.tsx` and `src/data/os-snippets.json` are static educational code snippets displayed in the UI, not live imported variables.

---

## 2. Table, Storage, RPC, and Channel Access by Client

### A. Browser Anon Client (`src/lib/supabase/client.ts`)

The browser client is strictly imported in 8 files:
1. `src/components/admin/AdminLogin.tsx`
2. `src/context/AdminAuthContext.tsx`
3. `src/components/admin/tabs/SettingsTab.tsx`
4. `src/components/admin/tabs/InboxTab.tsx`
5. `src/app/admin/mfa/page.tsx`
6. `src/app/admin/reset-password/page.tsx`
7. `src/app/auth/callback/page.tsx`
8. `src/components/auth/AuthRecoveryListener.tsx`

**Operations**:
- **Tables Queried Directly**: **NONE**. The browser client never invokes `supabase.from(...)`.
- **Realtime Channels**:
  - `realtime_inbox_messages`: Listens to `postgres_changes` on `inbox_messages` in `InboxTab.tsx`. When a change fires, it invokes an internal authenticated API fetch.
- **Supabase Auth Operations**:
  - `auth.getSession()`, `auth.onAuthStateChange()`
  - `auth.signInWithPassword()`, `auth.signUp()`, `auth.signOut()`
  - `auth.signInWithOAuth()`, `auth.signInWithPasskey()`, `auth.registerPasskey()`
  - `auth.mfa.listFactors()`, `auth.mfa.enroll()`, `auth.mfa.challengeAndVerify()`, `auth.mfa.unenroll()`, `auth.mfa.getAuthenticatorAssuranceLevel()`
  - `auth.resetPasswordForEmail()`, `auth.updateUser()`, `auth.exchangeCodeForSession()`
- **Storage Buckets**: NONE.
- **RPCs**: NONE.

### B. Server Service-Role Client (`src/lib/supabase/server.ts`)

Used by Route Handlers and Server Libs (`src/lib/**`):

| Target Table / Bucket / RPC | File / Store | Operations Performed | Purpose |
| :--- | :--- | :--- | :--- |
| `profiles` | `src/app/api/content/route.ts`, `table-store.ts` | `SELECT`, `UPSERT` | Portfolio profile data |
| `bio_paragraphs` | `src/app/api/content/route.ts`, `table-store.ts` | `SELECT`, `UPSERT` | Portfolio bio statements |
| `experiences` | `src/app/api/content/route.ts`, `table-store.ts` | `SELECT`, `UPSERT` | Career experience entries |
| `projects` | `src/app/api/content/route.ts`, `table-store.ts` | `SELECT`, `UPSERT` | Showcase projects |
| `skills` | `src/app/api/content/route.ts`, `table-store.ts` | `SELECT`, `UPSERT` | Technical skills |
| `languages` | `src/app/api/content/route.ts`, `table-store.ts` | `SELECT`, `UPSERT` | Spoken / human languages |
| `social_links` | `src/app/api/content/route.ts`, `table-store.ts` | `SELECT`, `UPSERT` | Social media profiles |
| `suggested_people` | `src/app/api/content/route.ts`, `table-store.ts` | `SELECT`, `UPSERT` | Peer / network links |
| `site_settings` | `content/route.ts`, `career-store.ts`, `health-store.ts`, `os/settings.ts`, `os/short-links.ts`, `temp-mail-domains.ts`, `travel-storage.ts` | `SELECT`, `UPSERT` | Application key-value configurations, fallbacks |
| `portfolio_content` | `table-store.ts`, `backup/csv`, `backup/zip` | `SELECT`, `UPSERT` | Legacy single-table portfolio store |
| `inbox_messages` | `src/lib/mail/store.ts`, `src/app/api/mail/**` | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | Inbox communications & emails |
| `app_settings` | `src/lib/env-vault.ts`, `src/app/api/env-vault/**` | `SELECT`, `UPSERT`, `DELETE` | Environment secrets vault |
| `os_short_links` | `src/lib/os/short-links.ts`, `src/app/api/os/short-links/**` | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | URL shortener records |
| `os_settings` | `src/lib/os/settings.ts`, `src/app/api/os/settings/**` | `SELECT`, `UPSERT` | Zahid OS desktop settings |
| `os_snippets` | `src/lib/table-store.ts` | `SELECT`, `UPSERT` | Zahid OS code snippets |
| `os_notes` | `src/lib/table-store.ts` | `SELECT`, `UPSERT` | Zahid OS scratchpad notes |
| `os_travel_districts` | `src/lib/travel/travel-storage.ts`, `src/app/api/os/travel/**` | `SELECT`, `UPSERT` | Bangladesh 64 districts ledger |
| `os_travel_memories` | `src/lib/travel/travel-storage.ts`, `src/app/api/os/travel/**` | `SELECT`, `UPSERT`, `DELETE` | Travel stories & entries |
| `os_temp_inboxes` | `src/lib/os/temp-mail.ts`, `src/app/api/os/temp-mail/**` | `SELECT`, `INSERT`, `DELETE` | Temporary email inboxes |
| `os_temp_messages` | `src/lib/os/temp-mail.ts`, `src/app/api/os/temp-mail/**` | `SELECT`, `INSERT`, `DELETE` | Inbound temp mail messages |
| `os_api_saved_requests` | `src/lib/table-store.ts` | `SELECT`, `UPSERT` | API Playground bookmarks |
| `career_applications` | `src/lib/career/career-store.ts` | `SELECT`, `UPSERT`, `DELETE` | Private job pipeline CRM |
| `career_interviews` | `src/lib/career/career-store.ts` | `SELECT`, `UPSERT`, `DELETE` | Private interview rounds |
| `career_contacts` | `src/lib/career/career-store.ts` | `SELECT`, `UPSERT`, `DELETE` | Private recruiter contacts |
| Bucket: `health-private` | `src/app/api/admin/health/**` | `upload`, `createSignedUrl`, `remove`, `list` | Private medical records & PDFs |
| Supabase Auth Admin | `src/app/api/auth/**`, `src/lib/auth/admin-auth.ts` | `getUser`, `generateLink`, `deleteFactor` | Admin session & MFA recovery |

---

## 3. Public Reads with Anon Key

In FolioFrame's architecture, public frontend visitors interact with the site via **Next.js Server-Side APIs and Server Components**. However, if a client interacts directly with Supabase via the PostgREST API using the public `anon` key, access must follow the principle of least privilege:

### A. Intended Public Data (Read Allowed)
The following tables and data points are designed to be publicly viewable:
1. **Portfolio Content**:
   - `profiles` (all rows)
   - `bio_paragraphs` (all rows)
   - `experiences` (all rows)
   - `projects` (all rows)
   - `skills` (all rows)
   - `languages` (all rows)
   - `social_links` (all rows)
   - `suggested_people` (all rows)
   - `portfolio_content` (legacy JSON fallback row)
2. **Public `site_settings` Keys**:
   - `works_settings`
   - `based_in_settings`
   - `github_settings`
   - `suggested_people_rich`
   - `library_data`
   - `zahid_os_settings`
   - `zahid_os_travel_data`
3. **Public Utilities & Micro-Apps**:
   - `os_short_links`: **Only rows where `is_active = true`** (inactive / draft links must remain hidden).
   - `os_settings`: Global desktop settings.
   - `os_snippets`: Public developer cheat sheets.
   - `os_travel_districts`: District names, statuses, and public visit counts.
   - `os_travel_memories`: Public travel logs.

### B. Prohibited Public Data (Anon SELECT Denied)
The following must **NEVER** be readable by the `anon` key:
- `inbox_messages` (contains private personal messages and email logs)
- `app_settings` (contains sensitive API keys and secrets)
- `career_applications`, `career_interviews`, `career_contacts` (private job CRM)
- `os_notes` (private scratchpad notes)
- `os_temp_inboxes`, `os_temp_messages` (managed exclusively via server route handlers)
- **Private keys in `site_settings`**: `career_applications`, `health_profile`, `health_medications`, `health_documents`, `health_visits`, `health_vitals`, `health_vaccinations`, `health_reminders`, `zahid_os_short_links`, `zahid_os_temp_mail_domains`.

---

## 4. Public Writes & Actions

All public writes in FolioFrame pass through server-side Next.js route handlers executing with `service_role`. **Direct database writes by `anon` are completely unnecessary and dangerous.**

| Public Action | Entry Route Handler | Backend Storage Operation | Privileges Required for `anon` |
| :--- | :--- | :--- | :--- |
| **Contact Form Submission** | `POST /api/mail/contact` | Server inserts message into `inbox_messages` via `service_role` + dispatches Resend alert | **NONE** (Server-side service_role) |
| **Short Link Redirection & Click Counting** | `GET /s/[slug]` | Server looks up `os_short_links`, increments `clicks`, updates `last_clicked_at` via `service_role` | **NONE** (Server-side service_role) |
| **Public Short Link Creation** | `POST /api/os/short-links` | Server checks `allow_public_link_creation`, validates URL, inserts via `service_role` | **NONE** (Server-side service_role) |
| **Temp Mail Inbox Creation & Message Fetch** | `POST/GET /api/os/temp-mail` | Server verifies token, accesses `os_temp_inboxes` / `os_temp_messages` via `service_role` | **NONE** (Server-side service_role) |
| **Inbound Email Webhooks** | `POST /api/webhooks/resend` | Server validates webhook signature, writes to `inbox_messages` or `os_temp_messages` | **NONE** (Server-side service_role) |

> [!IMPORTANT]
> Because every public user action is handled by a Server Route Handler using `supabaseServer()`, **the `anon` role requires ZERO write permissions (no `INSERT`, `UPDATE`, or `DELETE`) on ANY table or sequence in the entire PostgreSQL database.**

---

## 5. Strictly Private / Admin Resources

The following tables, settings, and buckets must be strictly shielded from public access:

### Tables
1. `inbox_messages`: All customer inquiries, inbound/outbound emails, email headers, raw attachments.
2. `app_settings`: Production API credentials (`RESEND_API_KEY`, `CONTACT_RATE_LIMIT_SECRET`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, etc.).
3. `career_applications`: Full job/scholarship application pipeline, compensation amounts, recruiter notes.
4. `career_interviews`: Interview rounds, technical questions, preparation notes.
5. `career_contacts`: Recruiter phone numbers, emails, LinkedIn links.
6. `os_notes`: Private scratchpad admin notes.

### Private `site_settings` Keys
- `career_applications`: Legacy/fallback store for career pipeline.
- `health_profile`: Blood group, allergies, chronic conditions, emergency contact card.
- `health_medications`: Prescriptions, dosages, schedules.
- `health_documents`: Medical report and prescription metadata.
- `health_visits`: Doctor visits, clinic consultations, diagnoses.
- `health_vitals`: Blood pressure, blood glucose, weight, heart rate logs.
- `health_vaccinations`: Immunization records.
- `health_reminders`: Medication and appointment alerts.
- `zahid_os_short_links`: Contains private, internal, or deactivated links.
- `zahid_os_temp_mail_domains`: Internal temporary mail domain list.

### Storage Buckets
- `health-private`: Prescriptions, clinical laboratory PDFs, diagnostic scans.
  - Access model: 60-second presigned URLs generated server-side for authenticated admin sessions only.
  - Anon access: **Strictly Denied (RLS `USING (false)`)**.

---

## 6. Proposed RLS and GRANT Policy Matrix

### A. Principle of Least Privilege: Role Grants
1. **Schema Usage**:
   ```sql
   GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
   ```
2. **Revoke Dangerous Defaults**:
   ```sql
   ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
   REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
   REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
   ```
3. **Selective Table Grants**:
   - `anon`: `GRANT SELECT` only on public tables (`profiles`, `bio_paragraphs`, `experiences`, `projects`, `skills`, `languages`, `social_links`, `suggested_people`, `site_settings`, `portfolio_content`, `os_short_links`, `os_settings`, `os_snippets`, `os_travel_districts`, `os_travel_memories`).
   - `authenticated`: `GRANT ALL` on all tables in schema `public`.
   - `service_role`: `GRANT ALL` on all tables in schema `public`.
4. **Sequences**:
   - `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;`

---

### B. Table-by-Table RLS Policy Matrix

| Table Name | RLS Enabled | `anon` Policy | `authenticated` Policy | `service_role` Policy |
| :--- | :---: | :--- | :--- | :--- |
| **`profiles`** | YES | `FOR SELECT USING (true)` | `FOR ALL USING (true) WITH CHECK (true)` | `FOR ALL USING (true) WITH CHECK (true)` |
| **`bio_paragraphs`** | YES | `FOR SELECT USING (true)` | `FOR ALL USING (true) WITH CHECK (true)` | `FOR ALL USING (true) WITH CHECK (true)` |
| **`experiences`** | YES | `FOR SELECT USING (true)` | `FOR ALL USING (true) WITH CHECK (true)` | `FOR ALL USING (true) WITH CHECK (true)` |
| **`projects`** | YES | `FOR SELECT USING (true)` | `FOR ALL USING (true) WITH CHECK (true)` | `FOR ALL USING (true) WITH CHECK (true)` |
| **`skills`** | YES | `FOR SELECT USING (true)` | `FOR ALL USING (true) WITH CHECK (true)` | `FOR ALL USING (true) WITH CHECK (true)` |
| **`languages`** | YES | `FOR SELECT USING (true)` | `FOR ALL USING (true) WITH CHECK (true)` | `FOR ALL USING (true) WITH CHECK (true)` |
| **`social_links`** | YES | `FOR SELECT USING (true)` | `FOR ALL USING (true) WITH CHECK (true)` | `FOR ALL USING (true) WITH CHECK (true)` |
| **`suggested_people`**| YES | `FOR SELECT USING (true)` | `FOR ALL USING (true) WITH CHECK (true)` | `FOR ALL USING (true) WITH CHECK (true)` |
| **`portfolio_content`**| YES | `FOR SELECT USING (true)` | `FOR ALL USING (true) WITH CHECK (true)` | `FOR ALL USING (true) WITH CHECK (true)` |
| **`site_settings`** | YES | `FOR SELECT USING (key IN ('works_settings', 'based_in_settings', 'github_settings', 'suggested_people_rich', 'library_data', 'zahid_os_settings', 'zahid_os_travel_data'))` | `FOR ALL USING (true) WITH CHECK (true)` | `FOR ALL USING (true) WITH CHECK (true)` |
| **`os_short_links`** | YES | `FOR SELECT USING (is_active = true)` | `FOR ALL USING (true) WITH CHECK (true)` | `FOR ALL USING (true) WITH CHECK (true)` |
| **`os_settings`** | YES | `FOR SELECT USING (true)` | `FOR ALL USING (true) WITH CHECK (true)` | `FOR ALL USING (true) WITH CHECK (true)` |
| **`os_snippets`** | YES | `FOR SELECT USING (true)` | `FOR ALL USING (true) WITH CHECK (true)` | `FOR ALL USING (true) WITH CHECK (true)` |
| **`os_travel_districts`**| YES| `FOR SELECT USING (true)` | `FOR ALL USING (true) WITH CHECK (true)` | `FOR ALL USING (true) WITH CHECK (true)` |
| **`os_travel_memories`** | YES| `FOR SELECT USING (true)` | `FOR ALL USING (true) WITH CHECK (true)` | `FOR ALL USING (true) WITH CHECK (true)` |
| **`os_notes`** | YES | **NO ACCESS** (`USING (false)`) | `FOR ALL USING (true) WITH CHECK (true)` | `FOR ALL USING (true) WITH CHECK (true)` |
| **`inbox_messages`** | YES | **NO ACCESS** (`USING (false)`) | `FOR ALL USING (true) WITH CHECK (true)` | `FOR ALL USING (true) WITH CHECK (true)` |
| **`app_settings`** | YES | **NO ACCESS** (`USING (false)`) | **NO ACCESS** (or `FOR ALL` if admin auth user) | `FOR ALL USING (true) WITH CHECK (true)` |
| **`career_applications`**| YES| **NO ACCESS** (`USING (false)`) | `FOR ALL USING (true) WITH CHECK (true)` | `FOR ALL USING (true) WITH CHECK (true)` |
| **`career_interviews`**| YES| **NO ACCESS** (`USING (false)`) | `FOR ALL USING (true) WITH CHECK (true)` | `FOR ALL USING (true) WITH CHECK (true)` |
| **`career_contacts`**| YES| **NO ACCESS** (`USING (false)`) | `FOR ALL USING (true) WITH CHECK (true)` | `FOR ALL USING (true) WITH CHECK (true)` |
| **`os_temp_inboxes`** | YES | **NO ACCESS** (`USING (false)`) | `FOR ALL USING (true) WITH CHECK (true)` | `FOR ALL USING (true) WITH CHECK (true)` |
| **`os_temp_messages`**| YES | **NO ACCESS** (`USING (false)`) | `FOR ALL USING (true) WITH CHECK (true)` | `FOR ALL USING (true) WITH CHECK (true)` |
| **`os_api_saved_requests`**| YES| **NO ACCESS** (`USING (false)`) | `FOR ALL USING (true) WITH CHECK (true)` | `FOR ALL USING (true) WITH CHECK (true)` |

---

### C. Storage Bucket Policies (`storage.objects`)

| Bucket ID | Public Flag | Role | Operations | Policy Definition |
| :--- | :---: | :--- | :--- | :--- |
| `health-private` | `false` | `service_role` | `ALL` | `USING (bucket_id = 'health-private') WITH CHECK (bucket_id = 'health-private')` |
| `health-private` | `false` | `authenticated`| `ALL` | `USING (bucket_id = 'health-private') WITH CHECK (bucket_id = 'health-private')` |
| `health-private` | `false` | `anon` | **NONE** | `USING (false)` |

---

## 7. Next Actions (Awaiting User OK)

Upon user approval of this audit and policy matrix:
- **Phase 1**: Secret Scrubbing & Rotation Checklist. Clean secrets from `supabase/schema_relational.sql`, search git commits for exposed keys, and catalog keys to rotate.
- **Phase 2**: Write Idempotent SQL Migrations (`supabase/migrations/20261106030000_security_hardening.sql`, update `schema_relational.sql`, update `20261106020000_health_private.sql`, verify `20261106_career_tracker.sql`).
- **Phase 3**: Codebase Hardening (`import "server-only"` in `src/lib/supabase/server.ts`, enforce `isAdminRequest(req)` on `/api/env-vault`, `/api/admin/career`, `/api/content` POST, `/api/supabase/crud`, `/api/supabase/tables`, `/api/backup/*`, `/api/mail/messages`, etc.).
- **Phase 4**: Verification scripts (`supabase/verify-security.sql`, `scripts/verify-rls.mjs`, `tsc`, `lint`, and production build).
