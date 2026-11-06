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
  - Note: Introduction of the dynamic secrets generator containing seed secrets (now scrubbed in `defca07`).

---

### 2. 64-Character Hex Strings (`\b[a-f0-9]{64}\b`) (Rate-Limit Secrets)

* **`defca0774da8bd9bb0f773edf1a910c107662781`**
  - Paths: `scripts/generate-relational-schema.js`, `supabase/schema_relational.sql`
  - Note: Security remediation commit scrubbing 64-character hex strings from generator and SQL schema files.
* **`ede5f2bf7104c0ae1d281779bf4aa9d4ff213e14`**
  - Paths: `scripts/generate-relational-schema.js`, `supabase/schema_relational.sql`
  - Note: Initial addition of seed secret row.

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

## Visibility & Risk Assessment

1. **Repository Access**: The remote GitHub repository is confirmed **PRIVATE** via authenticated API inspection (`gh repo view 0xZahidp/0xzahidp`).
2. **Current State**: All tracked working tree files (`scripts/generate-relational-schema.js`, `supabase/schema_relational.sql`, `.env.example`) have been completely scrubbed of live secrets.
3. **Recommendation**: As a standard best practice following any historical discovery, ensure the Resend API key and any live GitHub tokens referenced during local development are rotated in their respective provider consoles.

