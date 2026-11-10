// scripts/cleanup-storage.mjs
// Removes v1 uploaded objects from Supabase Storage bucket `portfolio-public-assets`
// using the Storage API and service role key without printing any secret values.
// Usage:
//   node --env-file=.env.local scripts/cleanup-storage.mjs --dry-run
//   node --env-file=.env.local scripts/cleanup-storage.mjs --run

import { createClient } from '@supabase/supabase-js';

const TARGET_BUCKET = 'portfolio-public-assets';

function getCredentials() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment.');
  }

  return { supabaseUrl, serviceKey };
}

async function listAllFiles(supabase, bucketName, folder = '') {
  const files = [];
  const { data, error } = await supabase.storage.from(bucketName).list(folder, {
    limit: 100,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' },
  });

  if (error) {
    throw new Error(`Failed to list contents of bucket '${bucketName}' at path '${folder}': ${error.message}`);
  }

  if (!data) return files;

  for (const item of data) {
    const itemPath = folder ? `${folder}/${item.name}` : item.name;
    // In Supabase storage, folders have id === null or metadata === null
    if (!item.id || item.id === null) {
      const subFiles = await listAllFiles(supabase, bucketName, itemPath);
      files.push(...subFiles);
    } else {
      files.push({
        name: item.name,
        path: itemPath,
        size: item.metadata?.size || 0,
        mimetype: item.metadata?.mimetype || '',
        createdAt: item.created_at,
      });
    }
  }

  return files;
}

async function main() {
  const isRun = process.argv.includes('--run');
  const isDryRun = !isRun;

  console.log('='.repeat(70));
  console.log('  SUPABASE STORAGE CLEANUP: portfolio-public-assets');
  console.log('='.repeat(70));
  console.log(`Mode: ${isDryRun ? 'DRY-RUN (List only, no deletions)' : 'EXECUTE (Deleting files)'}`);

  const { supabaseUrl, serviceKey } = getCredentials();
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`\nScanning bucket: ${TARGET_BUCKET}...`);
  const files = await listAllFiles(supabase, TARGET_BUCKET);

  console.log(`Discovered ${files.length} object(s) in bucket '${TARGET_BUCKET}':\n`);
  files.forEach((f, idx) => {
    const sizeKb = (f.size / 1024).toFixed(1);
    console.log(`  [${String(idx + 1).padStart(2, ' ')}] ${f.path} (${sizeKb} KB, ${f.mimetype || 'unknown'})`);
  });

  if (files.length === 0) {
    console.log('\n✔ Bucket is already completely empty.');
    return;
  }

  if (isDryRun) {
    console.log('\n' + '-'.repeat(70));
    console.log(`[DRY-RUN SUMMARY]`);
    console.log(`Total objects identified for deletion: ${files.length}`);
    console.log(`Bucket '${TARGET_BUCKET}' will be preserved.`);
    console.log(`To execute deletion, re-run with: --run`);
    console.log('-'.repeat(70));
    return;
  }

  console.log('\nProceeding with deletion of objects...');
  const pathsToDelete = files.map((f) => f.path);
  const { data: deleted, error: delError } = await supabase.storage
    .from(TARGET_BUCKET)
    .remove(pathsToDelete);

  if (delError) {
    throw new Error(`Failed to remove objects: ${delError.message}`);
  }

  console.log(`✔ Successfully removed ${deleted ? deleted.length : pathsToDelete.length} object(s).`);

  // Verify bucket is empty
  const remaining = await listAllFiles(supabase, TARGET_BUCKET);
  console.log(`Remaining objects in bucket: ${remaining.length}`);
  if (remaining.length === 0) {
    console.log(`✔ Verified: Bucket '${TARGET_BUCKET}' is now completely clean.`);
  } else {
    console.warn(`⚠ Warning: ${remaining.length} object(s) still remain.`);
  }
}

main().catch((err) => {
  console.error('\n✖ Cleanup failed:', err.message);
  process.exit(1);
});

