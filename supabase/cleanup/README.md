# Supabase V1 Content Cleanup

## Overview
This directory contains the cleanup SQL migration used to revert the seeded v1 content from the Supabase database (`txrnbazpdyoaazszkwwq`), returning the database to the clean Studio-Release state.

## What `remove_v1_content.sql` Does
1. **Deletes 17 seeded projects**: Targets strictly the 17 UUIDs inserted by `seed/04_projects.sql`.
2. **Deletes 54 seeded skills**: Targets strictly the 54 UUIDs inserted by `seed/02_skills.sql`.
3. **Deletes 4 seeded site_settings**: Targets keys `('homepage', 'hero_developer', 'hero_marketer', 'site_sections')`.
4. **Drops temporary tables**: Deletes all rows and drops tables `public.tools` and `public.blogs`.
5. **Re-publishes original projects**: Sets `is_published = true` on the remaining 8 original portfolio projects.
6. **Transaction Safety**: All actions run inside a single `BEGIN ... COMMIT` block.

## What is NOT Touched
- `public.app_settings`
- Career and education data
- Health records and emergency card data
- Inbox and contact messages
- Other `site_settings` keys
- Storage bucket `health-private`
- Extra schema columns added to `public.projects`

## Rollback / Recovery
Before execution, a complete JSON export of `projects`, `skills`, `site_settings`, `blogs`, and `tools` was saved to `../FolioFrame-backups/v1-cleanup-<timestamp>.json`.
To restore, re-insert the rows from the backup JSON or re-apply the seed files from branch `seo-backup`.

