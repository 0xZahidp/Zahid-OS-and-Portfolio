# Git History Pattern-Based Secret Leak Audit Report

**Date**: 2026-11-06  
**Repository**: `0xZahidp/0xzahidp`  
**Authenticated Remote Visibility Check**: **PRIVATE** (`gh repo view 0xZahidp/0xzahidp --json isPrivate` -> `isPrivate: true`)

---

## Pattern Search Methodology & Findings

All searches were conducted across all historical commits and branches using `git log --all -G<pattern>`. In compliance with zero-trust security guidelines, no secret values or matched strings are recorded or displayed below. Only commit hashes and file paths are reported.

### 1. Resend API Keys (`re_[A-Za-z0-9_]{20,}`)

* **`7b78220cebacdbbb43035db545457352f3ba0c18`**
  - Path: `.env.example`
  - Note: Matched example placeholder documentation (`re_your_resend_api_key_here`).
* **`defca0774da8bd9bb0f773edf1a910c107662781`**
  - Paths: `scripts/generate-relational-schema.js`, `supabase/schema_relational.sql`
  - Note: Security remediation commit that removed previously hardcoded secret seeds from generator and schema files.
* **`ede5f2bf7104c0ae1d281779bf4aa9d4ff213e14`**
  - Paths: `scripts/generate-relational-schema.js`, `supabase/schema_relational.sql`
  - Note: Real Resend API key was committed in seed SQL.

---

### 2. 64-Character Hex Strings (`\b[a-f0-9]{64}\b`) (Rate-Limit Secrets)

* **`defca0774da8bd9bb0f773edf1a910c107662781`**
  - Paths: `scripts/generate-relational-schema.js`, `supabase/schema_relational.sql`
  - Note: Security remediation commit scrubbing 64-character hex strings from generator and SQL schema files.
* **`ede5f2bf7104c0ae1d281779bf4aa9d4ff213e14`**
  - Paths: `scripts/generate-relational-schema.js`, `supabase/schema_relational.sql`
  - Note: Real rate-limit secret was committed in seed SQL.

---

### 3. GitHub Tokens (`ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}`)

* **`a776137f73c9f62c6289207b5296ef6638929cc4`**
  - Path: `src/components/admin/tabs/GitHubTab.tsx`
  - Note: Matched UI documentation validation string and dummy placeholder (`ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`). No live tokens were present.

---

### 4. JWT-Like Supabase Keys (`eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}`)

* **Matches**: **0 commits found across entire git history**.
* Neither the Supabase service role key nor JWT tokens were ever committed to the repository.

---

## Leak Confirmation & Exposure Assessment

> [!CAUTION]
> **Confirmed Leak in Git History**: Real Resend API key and rate-limit secret values were committed in commit `ede5f2bf7104c0ae1d281779bf4aa9d4ff213e14` (`scripts/generate-relational-schema.js`, `supabase/schema_relational.sql`) and scrubbed in commit `defca0774da8bd9bb0f773edf1a910c107662781`. Even though the remote GitHub repository is confirmed **PRIVATE**, any secrets that appeared in git history must be treated as compromised and rotated immediately.

---

## Secret Rotation Checklist

1. [ ] **Resend API Key**:
   - Go to Resend Dashboard -> API Keys.
   - Delete the existing API key that was committed in commit `ede5f2b`.
   - Generate a new restricted API key for sending only.
   - Update your production environment variables (e.g., Vercel / `.env.local`).

2. [ ] **`CONTACT_RATE_LIMIT_SECRET`**:
   - Generate a fresh 64-character random hex string (`openssl rand -hex 32`).
   - Update in Vercel project environment variables and `.env.local`.

3. [ ] **GitHub Personal Access Token**:
   - Revoke any Personal Access Token generated or tested during development in GitHub Settings -> Developer Settings -> Personal access tokens.
   - Generate a new fine-grained token with read-only permissions for public contributions if needed.

4. [ ] **Env-Vault Entries (`app_settings` / `site_settings`)**:
   - In Supabase SQL Editor or CMS Studio Vault, clear out any historical secret rows from `app_settings` or `site_settings` that were initialized with real values.

5. [ ] **Supabase Service Role Key**:
   - *Conditional*: Rotate this in Supabase Project Settings -> API **only** if the service role key was ever manually pasted into the `.env` vault in CMS Studio or stored into the `app_settings` table. (It was never committed to git history).
