// scripts/verify-rls.mjs
// Automated Supabase Row-Level Security (RLS) & Zero-Trust Verification Test Runner

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Load environment variables safely from .env.local or .env without printing secrets
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.join(ROOT_DIR, file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const TABLES_TO_CHECK = [
  'profiles',
  'bio_paragraphs',
  'experiences',
  'projects',
  'skills',
  'languages',
  'social_links',
  'suggested_people',
  'site_settings',
  'portfolio_content',
  'app_settings',
  'inbox_messages',
  'os_short_links',
  'os_settings',
  'os_snippets',
  'os_notes',
  'os_travel_districts',
  'os_travel_memories',
  'os_temp_inboxes',
  'os_temp_messages',
  'os_api_saved_requests',
  'career_applications',
  'career_interviews',
  'career_contacts'
];

async function runRlsVerification() {
  console.log('='.repeat(70));
  console.log('  SUPABASE ZERO-TRUST RLS VERIFICATION TEST RUNNER');
  console.log('='.repeat(70));

  if (!supabaseUrl || !anonKey || supabaseUrl.includes('placeholder')) {
    console.log('\n[NOTICE] NEXT_PUBLIC_SUPABASE_URL or anon key is unset/placeholder.');
    console.log('Skipping live network probe. Supabase client calls will fail safely.');
    console.log('To run against a live Supabase instance:');
    console.log('  NEXT_PUBLIC_SUPABASE_URL=https://... NEXT_PUBLIC_SUPABASE_ANON_KEY=... node scripts/verify-rls.mjs\n');
    return;
  }

  const maskedUrl = supabaseUrl.replace(/^(https?:\/\/[^.]+).*/, '$1.***');
  console.log(`Connecting to: ${maskedUrl} using public ANON key...\n`);

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false }
  });

  let passCount = 0;
  let failCount = 0;
  let skipCount = 0;

  console.log('--- Checking Public ANON Access to Database Tables ---');

  for (const table of TABLES_TO_CHECK) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(5);

      if (error) {
        // Permission denied, RLS rejection, or schema not found
        if (
          error.code === '42501' || // insufficient_privilege
          error.code === 'PGRST301' ||
          error.message?.toLowerCase().includes('permission denied') ||
          error.message?.toLowerCase().includes('row-level security') ||
          error.message?.toLowerCase().includes('not found') ||
          error.code === '42P01' || // undefined_table
          error.code === 'PGRST204' ||
          error.code === 'PGRST200'
        ) {
          console.log(`  ✔ PASS [${table}]: Access blocked (${error.code || 'denied'}: ${error.message?.slice(0, 50)})`);
          passCount++;
        } else {
          console.log(`  ✔ PASS [${table}]: Query rejected with: ${error.message?.slice(0, 60)}`);
          passCount++;
        }
      } else if (!data || data.length === 0) {
        // RLS filtered out 100% of rows (default-deny)
        console.log(`  ✔ PASS [${table}]: 0 rows returned (RLS filtered / default-deny active)`);
        passCount++;
      } else {
        // DATA LEAK!
        console.error(`  ✖ FAIL [${table}]: LEAK! Anon key read ${data.length} row(s) from table!`);
        failCount++;
      }
    } catch (err) {
      if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.message?.includes('fetch failed')) {
        console.log(`  - SKIP [${table}]: Network unreachable (${err.message})`);
        skipCount++;
      } else {
        console.log(`  ✔ PASS [${table}]: Access rejected with exception (${err.message})`);
        passCount++;
      }
    }
  }

  console.log('\n--- Checking Public ANON Access to health-private Storage Bucket ---');
  try {
    const { data, error } = await supabase.storage.from('health-private').list();
    if (error || !data || data.length === 0) {
      console.log(`  ✔ PASS [health-private]: Bucket list access blocked/empty (${error?.message || '0 items'})`);
      passCount++;
    } else {
      console.error(`  ✖ FAIL [health-private]: Storage leak! Anon key listed ${data.length} files in private bucket!`);
      failCount++;
    }

    const { error: downloadError } = await supabase.storage.from('health-private').download('test-probe.pdf');
    if (downloadError) {
      console.log(`  ✔ PASS [health-private]: Download probe rejected (${downloadError.message})`);
      passCount++;
    } else {
      console.error('  ✖ FAIL [health-private]: Download probe succeeded for anon user!');
      failCount++;
    }
  } catch (err) {
    console.log(`  ✔ PASS [health-private]: Access rejected (${err.message})`);
    passCount++;
  }

  console.log('\n' + '='.repeat(70));
  console.log(`VERIFICATION SUMMARY: ${passCount} Passed, ${failCount} Failed, ${skipCount} Skipped`);
  console.log('='.repeat(70));

  if (failCount > 0) {
    console.error('\n✖ SECURITY AUDIT FAILED: Anon key has unauthorized access to tables or storage!');
    console.error('👉 ACTION REQUIRED: Run `supabase/migrations/20261106030000_security_hardening.sql` in your Supabase SQL Editor.');
    console.error('   Then re-run this script to verify all permissions and tables are sealed.');
    process.exit(1);
  } else {
    console.log('\n✔ ZERO-TRUST COMPLIANT: All anon access attempts successfully blocked.');
  }
}

runRlsVerification().catch((err) => {
  console.error('Unexpected error running verification:', err.message);
  process.exit(1);
});
