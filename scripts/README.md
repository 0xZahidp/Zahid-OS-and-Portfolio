# Verification & Automation Scripts

This directory contains test suites, database migration checks, and security verification scripts for FolioFrame.

---

## 1. Content Deletion Propagation & Concurrency Suite

**File**: [`test-delete-propagation.ts`](./test-delete-propagation.ts)

Validates content persistence, relational table synchronization, snapshot-based deletions, client-loaded safety checks, the 50% mass deletion guard modal trigger, and optimistic concurrency versioning (409 conflict detection).

### How It Runs

The test runner operates in **Dual Mode**:

### Mode A: Fast In-Memory Fixture (Default)
By default, the suite runs completely offline against a high-fidelity in-memory relational fixture (`MockRelationalDb`). It has **zero external dependencies**, requires no running database, and executes in milliseconds:

```bash
npx tsx scripts/test-delete-propagation.ts
```

### Mode B: Local / Throwaway Supabase Instance (Optional)
When target test environment variables are supplied, the suite connects to a real Supabase database (`RealSupabaseDb`), runs all 6 test suites against live PostgreSQL tables, and cleans up after completion:

```bash
# 1. Start local Supabase (if using Supabase CLI)
supabase start

# 2. Run the test suite against local Supabase
$env:SUPABASE_TEST_URL="http://127.0.0.1:54321"
$env:SUPABASE_TEST_SERVICE_KEY="<local-service-role-key>"
npx tsx scripts/test-delete-propagation.ts
```

### Production Safety Guard
To prevent accidental data loss or mutation on production databases, the runner incorporates a hard safety check:
- If `SUPABASE_TEST_URL` matches `NEXT_PUBLIC_SUPABASE_URL`, or contains a production host (`*.supabase.co`), the test runner **immediately aborts execution with an exit code of 1** and logs a safety refusal.

---

## 2. Test Suites Covered

| Suite | Description | Invariants Verified |
| :--- | :--- | :--- |
| **Suite 1: List Lifecycle** | Lifecycle of collection items (size 0, 1, 3, 5) | Adds, single deletes, reordering, empty arrays `[]` without resurrecting default template data. |
| **Suite 2: Client Load Protection** | Safety for unverified/failed client loads | If `clientLoaded: false`, server skips deletions, preserves existing rows, and returns `deletionsSkipped: true`. |
| **Suite 3: Mass Deletion Guard** | Accidental mass-wipe protection | Deleting >50% of collections with >8 items requires `confirmDelete: true`. Without it, returns HTTP 400 with `requiresConfirmation: true`. |
| **Suite 4: Guard Exemptions** | Normal CMS operations | Collections $\le$ 8 items or deleting $\le$ 3 items are unblocked without confirmation prompts. |
| **Suite 5: Snapshot-based Deletion** | Concurrent row additions | Server only deletes IDs present in the client's `loadedIds` snapshot. Newly inserted rows from other sessions are preserved. |
| **Suite 6: Optimistic Concurrency** | Multi-tab / multi-user concurrency | Each content save increments version number. Stale saves return HTTP 409 (`conflict: true`) with `"This data changed elsewhere, reload before saving"`. UI reloads without overwriting. |

---

## 3. Other Verification Scripts

- **`check-migration-order.mjs`**: Ensures that the security hardening migration (`*security_hardening.sql`) lexicographically sorts last after all schema migrations.
- **`verify-rls.mjs`**: Audits database tables for Row Level Security (RLS) enforcement and policy compliance.
- **`verify-admin-auth.mjs`**: Tests admin authentication gating, MFA requirements, and rate limit boundaries.
- **`test-read-failure.ts`**: Verifies that private admin stores return 503 instead of empty mock data when Supabase is unreachable.
- **`test-write-failure.ts`**: Verifies that write failures propagate cleanly to callers rather than resolving with false success.
