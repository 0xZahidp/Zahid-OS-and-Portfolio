# FolioFrame: Modern Developer Profile & Portfolio Platform

FolioFrame is a high-performance, developer-focused profile and portfolio platform built with **Next.js 15 (App Router)**, **TypeScript**, and **Tailwind CSS v4**.

Designed from the ground up to match the visual hierarchy, restrained aesthetic, and responsiveness of modern developer profiles, FolioFrame balances minimal aesthetics with rich interactivity and a robust, production-ready admin CMS backed by Supabase and Resend.

---

## 🔐 Environment Variables

The table below lists every environment variable utilized across the codebase (scanned directly from source). Configure these in your `.env.local` for local development or in your Vercel Project Settings for production deployments.

| Variable Name | Status | Where to Obtain | Purpose / Description |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **Required** | Supabase Project Settings -> API | Public REST URL for the Supabase instance (e.g. `https://xxx.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Required** | Supabase Project Settings -> API | Public Anonymous API Key for client-side queries and Supabase Auth. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Required** | Supabase Project Settings -> API | Secret service role key used server-side to execute migrations, webhooks, and bypass RLS safely. |
| `ADMIN_USER_ID` | **Required** | Supabase Dashboard -> Authentication -> Users | The UUID of the authorized portfolio owner/admin user account. |
| `RESEND_API_KEY` | **Required** | Resend Dashboard -> API Keys | API Key (`re_...`) used to send outgoing email and fetch received email payloads. |
| `RESEND_WEBHOOK_SECRET` | **Required** | Resend Dashboard -> Webhooks | Secret signing key (`whsec_...`) used to verify Svix signatures on inbound webhook events. |
| `GITHUB_TOKEN` | Optional | GitHub Developer Settings -> Personal Access Tokens | Classic or Fine-grained PAT (`ghp_...`) for authenticated GitHub API requests and higher rate limits. |
| `ADMIN_TEST_TOKEN` | Optional | Custom / Generated Secret | Secret bearer token for automated API integration tests and synthetic health checks. |
| `RESEND_DEFAULT_SENDER` | Optional | Custom Config | Default From sender string (defaults to `Md Zahid Hasan <hello@zahidp.com>`). |
| `CONTACT_FROM_EMAIL` | Optional | Custom Config | Sender address used when dispatching contact form notifications. |
| `CONTACT_TO_EMAIL` | Optional | Custom Config | Recipient inbox address for contact form submissions. |
| `CONTACT_RATE_LIMIT_SECRET` | Optional | Custom / Random Hex String | Secret key used for signing HMAC tokens to rate limit contact form submissions. |
| `NEXT_PUBLIC_SITE_URL` | Optional | Custom Config | Canonical site URL (e.g. `https://zahidp.com` or `http://localhost:3000`). |
| `SITE_NOINDEX` | Optional | Custom Config (`true`/`false`) | When set to `true`, outputs `<meta name="robots" content="noindex,nofollow" />` on staging environments. |
| `TEMP_MAIL_DOMAIN` | Optional | Custom Config | Primary domain configured for the standalone disposable Zahid OS Temp Mail subsystem. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Optional | Supabase Project Settings -> API | Alternate alias for `NEXT_PUBLIC_SUPABASE_ANON_KEY`. |
| `VAULT_ENCRYPTION_KEY` | Optional | Custom 32-byte Hex String | Secret key for AES-256 database-backed Encrypted Vault variables. |
| `VAULT_ENCRYPTION_KEY_PREVIOUS` | Optional | Custom 32-byte Hex String | Fallback decryption key when rotating the vault master encryption key. |
| `SUPABASE_TEST_URL` | Optional | CI / Test Runner | Dedicated isolated Supabase test instance URL for automated tests. |
| `SUPABASE_TEST_SERVICE_KEY` | Optional | CI / Test Runner | Dedicated service key for the isolated test database. |
| `TEST_HOST` | Optional | CI / Test Runner | Hostname for local integration test runners. |
| `TEST_PORT` | Optional | CI / Test Runner | Port for local integration test runners. |
| `VERCEL` / `VERCEL_ENV` | Platform | Vercel Deployment Runtime | Automatically injected by Vercel (`production`, `preview`, or `development`). |

---

## 📬 Mail System Architecture

FolioFrame features an enterprise-grade, Resend-powered inbox client built directly into the Admin CMS.

### 1. Ingestion Flow (Event-Driven)
```
Inbound Email -> Resend Receiving -> Webhook POST /api/webhooks/resend
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
             Svix Signature Check                        Recipient Classification
            (Uses RESEND_WEBHOOK_SECRET)                   (Official vs Unofficial)
                       │                                           │
                       ▼                                           ▼
             Tombstone & Dedupe Check                    Ingest to Supabase
            (inbox_deleted_resend_ids)                  (inbox_messages with mailbox)
```

- **Zero Automatic Polling**: Inbound messages are received in real time through webhooks. The admin panel does not run background polling loops against the Resend API, keeping CPU and network usage minimal.
- **Server Pagination**: Threads are queried from Supabase paginated (25 per page, ordered by `received_at DESC`), omitting heavy HTML/text bodies from the list view.
- **On-Demand Detail Fetch**: Full sanitized HTML and text bodies are loaded on-demand via `/api/mail/messages?threadId=<id>` when an active conversation is opened.

### 2. Mailbox Classification & Separation

FolioFrame splits inbound correspondence into two distinct mailboxes:

1. **Inbox (`mailbox = 'official'`)**: Messages received at `@zahidp.com` with a designated official team/system alias.
2. **Unofficial (`mailbox = 'unofficial'`)**: Inbound messages received at any other `@zahidp.com` address.

The single source of truth for classification is located in [`src/lib/mail/mailbox.ts`](src/lib/mail/mailbox.ts):
```ts
export const OFFICIAL_DOMAIN = 'zahidp.com';
export const OFFICIAL_SLUGS = new Set([
  'contact', 'hello', 'info', 'support', 'hire', 'jobs', 'careers', 'business',
  'partnerships', 'billing', 'privacy', 'legal', 'security', 'abuse', 'postmaster', 'admin', 'zahid'
]);
```

- **Foreign Domain Ignore Rule**: Temp Mail is a completely separate subsystem with its own API. The Resend webhook is account-level, so foreign-domain messages arrive at the webhook and are cleanly ignored with HTTP 200 (`{ received: true, ignored: 'foreign-domain' }`). They are **never** fetched, stored in `inbox_messages`, or tombstoned.
- **Parsing Rules**: Recipients are checked case-insensitively across `to`, `cc`, and `bcc`. Sub-address tags (`+tag`) are stripped (e.g. `support+urgent@` -> `support`). Full name formats (`"Support Desk <support@zahidp.com>"`) are parsed automatically.

### 3. Folder Navigation & Unread Counts

The inbox sidebar displays folders in the following hierarchy:
- **Inbox** (`mailbox = 'official'`): Shows prominent emerald/brand badge counting unread, non-trashed official threads.
- **Unofficial** (`mailbox = 'unofficial'`): Positioned directly under Inbox; displays a muted unread count badge.
- **Starred**: Starred threads across both official and unofficial mailboxes.
- **Sent**: Outbound messages dispatched from FolioFrame.
- **Archive**: Archived threads across both mailboxes.
- **Trash**: Soft-deleted messages across both mailboxes.

### 4. Conversation Threading & Reply Default

- Messages are grouped into threads by `In-Reply-To` and `References` headers first, then by normalized subject (stripping `Re:`, `Fwd:`, `[FWD]`) plus participant overlap within a 30-day window.
- **Reply Sender Default**: When composing a reply, the "From" address defaults to the recipient address where the incoming email was received (e.g. if an inquiry was received at `support@zahidp.com`, the reply defaults to sending from `Md Zahid Hasan <support@zahidp.com>`).

### 5. Deletion & Tombstones

- **Soft Delete (Move to Trash)**: Messages moved to Trash retain their data, can be restored at any time, and do not create tombstones.
- **Permanent Delete**: Permanently deleting an individual message, an entire thread, or clicking **Empty Trash** writes the Resend IDs into `inbox_deleted_resend_ids` before removing the rows. Any subsequent sync or webhook event containing a tombstoned ID will skip ingestion and never resurrect the message.
- **Manual Sync Fallback**: A manual **"Sync Resend"** button is provided in the UI for emergency recovery; it honors all active tombstones and duplicate constraints.

---

## ⚡ Resend Webhook Setup

Follow these steps to configure inbound email webhooks on Resend:

1. **Navigate to Webhooks**: Go to [Resend Dashboard -> Webhooks](https://resend.com/webhooks).
2. **Add Endpoint**:
   - **Endpoint URL**: `https://<your-domain>/api/webhooks/resend`
   - **Events to Select**:
     - `Email Received` (`email.received`)
     - `Email Delivered` (`email.delivered`)
     - `Email Bounced` (`email.bounced`)
     - `Email Failed` (`email.failed`)
     - `Email Complained` (`email.complained`)
3. **Save Webhook Secret**:
   - Copy the signing secret provided by Resend (starts with `whsec_...`).
   - Add this secret to your Vercel Project Settings as `RESEND_WEBHOOK_SECRET`.
4. **Testing Webhooks**:
   - Click **Send Test Event** in the Resend dashboard.
   - Choose `email.received` and verify your endpoint responds with `200 OK`.
   - Outbound status events (`delivered`, `bounced`, `failed`) update the sent message's `status` column idempotently without modifying conversation thread states.

---

## 🗄️ Database Migrations

FolioFrame maintains versioned, transactional, and idempotent SQL migrations in `supabase/migrations/`:

| Migration File | Description |
|---|---|
| [`20261110010000_inbox_threads.sql`](supabase/migrations/20261110010000_inbox_threads.sql) | Adds `thread_id` to `inbox_messages`, backfills conversation threads using 3-pass threading algorithm, and adds performance indexes. |
| [`20261110020000_inbox_tombstones.sql`](supabase/migrations/20261110020000_inbox_tombstones.sql) | Creates `inbox_deleted_resend_ids` table with Row Level Security (RLS) to prevent deleted emails from re-importing. |
| [`20261110030000_inbox_mailbox.sql`](supabase/migrations/20261110030000_inbox_mailbox.sql) | Adds `mailbox` column (`CHECK (mailbox IN ('official', 'unofficial') OR mailbox IS NULL)`), backfills existing inbound rows, and indexes `(mailbox, received_at DESC)`. |

> [!WARNING]
> **Safety Notice Before Running Migrations:**
> Always create a backup of your `inbox_messages` table before applying schema updates.
>
> If you have historical rows with foreign or disposable domains, review and execute the manual cleanup script:
> [`supabase/manual/inbox_foreign_cleanup.sql`](supabase/manual/inbox_foreign_cleanup.sql)
> Step 1 creates a timestamped safety backup table (`inbox_messages_backup_20261110b`), Step 2 reports domains, and Step 3 safely removes foreign records.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router, React 19)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4
- **Database & Auth**: Supabase (PostgreSQL, Row Level Security, Auth)
- **Email Dispatch & Receiving**: Resend API + Svix Webhooks
- **Icons**: Lucide React

---

## 💻 Local Development Commands

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### Run Type Checking
```bash
npx tsc --noEmit
```

### Run Linting
```bash
npm run lint
```

### Run Unit Tests
```bash
npm test
```

### Build for Production
```bash
npm run build
```
