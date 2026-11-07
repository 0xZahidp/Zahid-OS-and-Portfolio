// scripts/check-migration-order.mjs
// Asserts that the security hardening migration is lexicographically the last migration in supabase/migrations/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const MIGRATIONS_DIR = path.join(ROOT_DIR, 'supabase', 'migrations');

function checkMigrationOrder() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.error(`[-] ERROR: Migrations directory not found at: ${MIGRATIONS_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.error('[-] ERROR: No SQL migration files found.');
    process.exit(1);
  }

  const lastFile = files[files.length - 1];

  console.log('='.repeat(70));
  console.log('  SUPABASE MIGRATION ORDER VERIFICATION');
  console.log('='.repeat(70));
  console.log(`Discovered ${files.length} migrations in supabase/migrations:`);
  files.forEach((f, idx) => console.log(`  [${idx + 1}] ${f}`));

  if (!lastFile.includes('security_hardening')) {
    console.error(`\n✖ ERROR: Security hardening migration MUST be the lexicographically last migration.`);
    console.error(`  Expected: A filename ending in _security_hardening.sql at the end.`);
    console.error(`  Actual last file: ${lastFile}\n`);
    process.exit(1);
  }

  console.log(`\n✔ PASS: Hardening migration '${lastFile}' is lexicographically last.\n`);
  process.exit(0);
}

checkMigrationOrder();
