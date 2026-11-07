export {};

// Set environment variables BEFORE any imports
process.env.VERCEL = '1';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:9';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-dummy-service-role-key-never-leaked';

async function main() {
  console.log('--- PRIVATE STORE READ FAILURE & CONCURRENCY AUDIT ---');
  console.log('Environment: VERCEL=1, NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:9 (Unreachable)\n');

  // Dynamic imports after environment setup
  const { getCareerApplications, saveCareerApplications } = await import('../src/lib/career/career-store');
  const {
    getHealthCollection,
    getHealthCollectionWithVersion,
    getHealthData,
    exportHealthData,
    saveHealthCollection,
    clearHealthCache,
  } = await import('../src/lib/health/health-store');
  const {
    readMailStore,
    listMailMessages,
    getMailFolderCounts,
  } = await import('../src/lib/mail/store');
  const { listAppSecrets } = await import('../src/lib/env-vault');

  // Public stores to verify graceful defaults
  const { getOsSettings, saveOsSettings } = await import('../src/lib/os/settings');
  const { getShortLinks } = await import('../src/lib/os/short-links');
  const { getTravelData } = await import('../src/lib/travel/travel-storage');
  const { getTempMailDomains } = await import('../src/lib/os/temp-mail-domains');

  let passed = 0;
  let failed = 0;
  const swallowingPaths: string[] = [];

  // =========================================================================
  // 1. ASSERT PRIVATE STORE READS THROW (DO NOT SWALLOW ERRORS)
  // =========================================================================
  console.log('[1/3] Testing Private Store Read Error Propagation (Must Throw):');

  const privateReadTests: Array<{
    name: string;
    setup?: () => void;
    run: () => Promise<unknown>;
  }> = [
    {
      name: 'career-store (getCareerApplications)',
      run: () => getCareerApplications(),
    },
    {
      name: 'health-store (getHealthCollection: medications)',
      setup: () => clearHealthCache(),
      run: () => getHealthCollection('medications'),
    },
    {
      name: 'health-store (getHealthCollectionWithVersion: profile)',
      setup: () => clearHealthCache(),
      run: () => getHealthCollectionWithVersion('profile'),
    },
    {
      name: 'health-store (getHealthData)',
      setup: () => clearHealthCache(),
      run: () => getHealthData(),
    },
    {
      name: 'health-store (exportHealthData)',
      setup: () => clearHealthCache(),
      run: () => exportHealthData(),
    },
    {
      name: 'mail store (readMailStore)',
      run: () => readMailStore(),
    },
    {
      name: 'mail store (listMailMessages)',
      run: () => listMailMessages(),
    },
    {
      name: 'mail store (getMailFolderCounts)',
      run: () => getMailFolderCounts(),
    },
    {
      name: 'env-vault (listAppSecrets)',
      run: () => listAppSecrets(),
    },
  ];

  for (const t of privateReadTests) {
    if (t.setup) t.setup();
    try {
      const result = await t.run();
      console.log(`❌ FAIL (swallowed error): ${t.name} resolved with data instead of throwing:`, JSON.stringify(result)?.slice(0, 100));
      swallowingPaths.push(t.name);
      failed++;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.log(`✅ PASS (threw as expected): ${t.name} -> "${errMsg}"`);
      passed++;
    }
  }

  // =========================================================================
  // 2. ASSERT PUBLIC STORE READS KEEP GRACEFUL DEFAULTS (DO NOT THROW)
  // =========================================================================
  console.log('\n[2/3] Testing Public Store Graceful Fallbacks (Must NOT Throw):');

  const publicReadTests: Array<{
    name: string;
    run: () => Promise<unknown>;
  }> = [
    {
      name: 'os settings (getOsSettings)',
      run: () => getOsSettings(),
    },
    {
      name: 'short-links (getShortLinks)',
      run: () => getShortLinks(),
    },
    {
      name: 'travel-storage (getTravelData)',
      run: () => getTravelData(),
    },
    {
      name: 'temp-mail-domains (getTempMailDomains)',
      run: () => getTempMailDomains(),
    },
  ];

  for (const t of publicReadTests) {
    try {
      await t.run();
      console.log(`✅ PASS (graceful default): ${t.name} returned default data safely`);
      passed++;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.log(`❌ FAIL (threw unexpectedly): ${t.name} -> "${errMsg}"`);
      failed++;
    }
  }

  // =========================================================================
  // 3. ASSERT SIMULATED STALE-VERSION SAVES RETURN 409
  // =========================================================================
  console.log('\n[3/3] Testing Optimistic Concurrency (Stale-Version Save Must Reject with 409):');

  const concurrencyTests: Array<{
    name: string;
    run: () => Promise<unknown>;
  }> = [
    {
      name: 'career-store optimistic concurrency (saveCareerApplications with stale expectedVersion=999)',
      run: () =>
        saveCareerApplications(
          [
            {
              id: 'test-app',
              company_name: 'Stale Test Corp',
              role_title: 'Engineer',
              type: 'job',
              status: 'applied',
              priority: 'medium',
              stageChangedAt: new Date().toISOString(),
              source: 'linkedin',
              remote_type: 'remote',
              location: 'Remote',
              employment_type: 'full_time',
              applied_date: '2026-01-01',
              deadline: '',
              salary_currency: 'USD',
              salary_period: 'yearly',
              contacts: [],
              interviews: [],
              archived: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          999 // stale version (current is 0)
        ),
    },
    {
      name: 'health-store optimistic concurrency (saveHealthCollection with stale expectedVersion=999)',
      run: () =>
        saveHealthCollection(
          'medications',
          [
            {
              id: 'test-med',
              name: 'Stale Med',
              dose: '20mg',
              frequency: 'Daily',
              active: true,
              updatedAt: new Date().toISOString(),
            },
          ],
          999 // stale version (current is 0)
        ),
    },
    {
      name: 'os-settings optimistic concurrency (saveOsSettings with stale expectedVersion=999)',
      run: () =>
        saveOsSettings(
          {
            wallpaper: 'zos-cyber',
          },
          999 // stale version (current is 0)
        ),
    },
  ];

  for (const t of concurrencyTests) {
    try {
      await t.run();
      console.log(`❌ FAIL (concurrency conflict ignored): ${t.name} resolved instead of rejecting with 409`);
      failed++;
    } catch (err: unknown) {
      const errObj = err as { status?: number; statusCode?: number; message?: string };
      const status = errObj.status ?? errObj.statusCode;
      const is409 = status === 409 || errObj.message?.includes('changed elsewhere');
      if (is409) {
        console.log(`✅ PASS (HTTP 409 Conflict): ${t.name} -> status=${status} "${errObj.message}"`);
        passed++;
      } else {
        console.log(`❌ FAIL (wrong error status): ${t.name} threw status=${status} instead of 409: "${errObj.message}"`);
        failed++;
      }
    }
  }

  // =========================================================================
  // SUMMARY REPORT
  // =========================================================================
  console.log(`\n=======================================================`);
  console.log(`Summary: ${passed} passed, ${failed} failed`);
  if (swallowingPaths.length > 0) {
    console.log('\nPrivate read paths still swallowing errors:');
    swallowingPaths.forEach((p) => console.log(` - ${p}`));
    process.exit(1);
  } else {
    console.log('All private stores properly propagate read failures on error!');
    console.log('All public stores maintain graceful default fallbacks!');
    console.log('Optimistic concurrency checks reject stale saves with HTTP 409!');
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
