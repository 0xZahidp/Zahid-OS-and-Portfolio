# Startup Leads & Outreach Radar (FolioFrame Studio)

An automated, **zero-cost ($0.00/mo)** startup lead radar and intelligence pipeline built directly into **FolioFrame Studio** (`zahidp.com/admin?tab=leads`). It continually monitors early hiring signals and seed funding announcements, runs automated AI qualification against your triple-threat engineering & growth profile, extracts verified contact emails, and drafts human-sounding 4-line outreach messages ready for 1-click dispatch.

---

## 1. Quick Architecture Overview

```
                                      ┌────────────────────────────────────────────────────────┐
                                      │                     FREE SOURCES                       │
                                      │  • Reddit JSON/RSS (r/forhire, r/Web3Jobs, r/startups) │
                                      │  • Hacker News Algolia API (Stories + Who is hiring)   │
                                      │  • Seed Funding RSS (CoinDesk, The Block, TC, Decrypt) │
                                      └──────────────────────────┬─────────────────────────────┘
                                                                 │
                                                                 ▼
                                      ┌────────────────────────────────────────────────────────┐
                                      │         AI TRIAGE ENGINE (Google Gemini Flash)         │
                                      │  • Discards job seekers ([FOR HIRE]) & recruiters      │
                                      │  • Classifies track: Web3 Growth | Full-Stack | SFDC   │
                                      │  • Extracts company, role, contacts & emails           │
                                      │  • Synthesizes custom 1-line pitch hook                │
                                      └──────────────────────────┬─────────────────────────────┘
                                                                 │
                                                                 ▼
                                      ┌────────────────────────────────────────────────────────┐
                                      │         CONTACT ENRICHMENT (Optional Hunter.io)        │
                                      │  • Max 2 calls/run to strictly preserve 50/mo quota    │
                                      └──────────────────────────┬─────────────────────────────┘
                                                                 │
                                                                 ▼
                                      ┌────────────────────────────────────────────────────────┐
                                      │               STRICT 3-LAYER DEDUPLICATION             │
                                      │  1. Skip if company already in Career & Pipeline       │
                                      │  2. UNIQUE constraint on source_url                    │
                                      │  3. UNIQUE index on (normalized_company, role)         │
                                      └──────────────────────────┬─────────────────────────────┘
                                                                 │
                                                                 ▼
                                      ┌────────────────────────────────────────────────────────┐
                                      │           FOLIOFRAME STUDIO (Private CRM Tab)          │
                                      │  • 5-Metric top strip (New, Ready, Emailed, Replied)   │
                                      │  • Cards & Table responsive views                      │
                                      │  • "Copy 4-Line Email Draft" pre-filled with hook      │
                                      │  • 1-Click "Promote to Career Pipeline" as Applied     │
                                      └────────────────────────────────────────────────────────┘
```

---

## 2. Supabase Migration Setup

The migration file is located at [`supabase/migrations/20261114010000_startup_leads.sql`](supabase/migrations/20261114010000_startup_leads.sql).

### To execute the migration in production:
1. Open your Supabase Dashboard:
   **[https://supabase.com/dashboard/project/txrnbazpdyoaazszkwwq/sql/new](https://supabase.com/dashboard/project/txrnbazpdyoaazszkwwq/sql/new)**
2. Paste the contents of `supabase/migrations/20261114010000_startup_leads.sql`.
3. Click **Run**.
4. The migration creates the `startup_leads` table, sets up composite unique indexes for deduplication, and locks down Row Level Security (RLS) under zero-trust (default-deny for `anon` & `authenticated`, full permissions to `service_role`).

> **Note:** The FolioFrame store layer includes automatic fallback handling so local development and offline mode work gracefully even before the remote SQL is executed.

---

## 3. GitHub Actions & Repository Secrets

The automated worker runs every 4 hours via [`.github/workflows/lead-radar.yml`](.github/workflows/lead-radar.yml) (`0 */4 * * *`) and can also be triggered manually from GitHub's **Actions** tab via `workflow_dispatch`.

Because your GitHub repository is public, **never commit secrets to code or configuration files**. Add the following repository secrets:

1. Navigate to **GitHub Repository → Settings → Secrets and variables → Actions → New repository secret**.
2. Add the following secrets:

| Secret Name | Required | Description | Example / Location |
|---|---|---|---|
| `SUPABASE_URL` | **Yes** | Your Supabase project URL | `https://txrnbazpdyoaazszkwwq.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Supabase `service_role` secret (bypasses RLS from backend) | Supabase Dashboard → Project Settings → API |
| `GEMINI_API_KEY` | **Yes** | Free Tier Google AI Studio Gemini API Key | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| `HUNTER_API_KEY` | *Optional* | Hunter.io API Key (Free tier 50 requests/mo) | [hunter.io/api_keys](https://hunter.io/api_keys) |

---

## 4. Local Testing

You can run the ingestion worker locally at any time:

```bash
# Reads environment variables from your local .env.local
npm run fetch-leads
```

The worker will output a structured summary:
```text
================================================================
  Startup Leads & Outreach Radar — Ingestion Worker
================================================================
[Sources] Reddit: fetched 18 hiring candidates.
[Sources] Hacker News: fetched 26 candidates.
[Sources] Seed Funding RSS: fetched 15 articles.
[Triage] Unseen candidates sent to Gemini AI: 47
[Gemini] Processing batch 1 / 8...
[AI Qualification] Gemini qualified 7 leads.
[Hunter.io] Enriching email for Alice Smith @ acmelabs.xyz...
[Hunter.io] Found email: alice@acmelabs.xyz (verified)

================================================================
  RUN SUMMARY
================================================================
  Raw candidates fetched:        59
  AI Qualified leads:            7
  Career Pipeline duplicates:    1
  Cross-post duplicates skipped: 2
  Successfully inserted:         4
================================================================
```

---

## 5. FolioFrame Studio Features

### Top Metric Strip
- **New Today:** Leads ingested in the last 24 hours.
- **Ready to Email:** Leads with an extracted or verified email address ready for immediate outreach.
- **Emailed:** Outreach dispatched.
- **Replied:** Active dialogue initiated.
- **Promoted to Pipeline:** Converted into official applications in your Career CRM.

### Outreach Features
- **1-Click 4-Line Email Draft:** Copies a personalized plain-text email referencing the startup's funding or hiring news and Zahid's triple-threat experience (NexGami 500K users / $5M raise, Full-Stack CS development, certified Salesforce engineering).
- **Inline Email Editing:** If a founder's email was missing from the post, you can input and save it inline with 1 click.
- **Promote to Career Pipeline:** Automatically moves the company and position into your existing **Career & Pipeline** tracker as an active application with stage `Applied` and priority `High`, pre-populating company details, contact information, and pitch notes.
- **Archive with Deduplication Retention:** Archiving hides low-fit leads from view without deleting the database record, ensuring the ingestion engine never resurfaces cross-posted duplicates in future runs.

