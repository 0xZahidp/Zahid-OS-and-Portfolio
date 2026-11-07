// Set environment variables BEFORE any imports
process.env.VERCEL = '1';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:9';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-dummy-service-role-key-never-leaked';

async function main() {
  console.log('--- WRITE FAILURE PROPAGATION AUDIT ---');
  console.log('Environment: VERCEL=1, NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:9 (Unreachable)\n');

  const { saveCareerApplications } = await import('../src/lib/career/career-store');
  const { saveHealthCollection } = await import('../src/lib/health/health-store');
  const {
    writeMailStore,
    addMailMessage,
    updateMailMessage,
    deleteMailMessage,
    emptyTrash,
  } = await import('../src/lib/mail/store');
  const { saveShortLinks } = await import('../src/lib/os/short-links');
  const { createTempInbox, deleteTempInbox } = await import('../src/lib/os/temp-mail');
  const { saveDomainsToStore } = await import('../src/lib/os/temp-mail-domains');
  const { saveOsSettings } = await import('../src/lib/os/settings');
  const { saveTravelData } = await import('../src/lib/travel/travel-storage');
  const { saveTableRows, syncRowsToLocal } = await import('../src/lib/table-store');

  const tests: Array<{ name: string; run: () => Promise<unknown> }> = [
    {
      name: 'career-store (saveCareerApplications)',
      run: () =>
        saveCareerApplications([
          {
            id: 'test-app',
            company_name: 'Test Corp',
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
        ]),
    },
    {
      name: 'health-store (saveHealthCollection)',
      run: () =>
        saveHealthCollection('medications', [
          {
            id: 'test-med',
            name: 'Test Med',
            dose: '10mg',
            frequency: 'Daily',
            active: true,
            updatedAt: new Date().toISOString(),
          },
        ]),
    },
    {
      name: 'mail store (writeMailStore)',
      run: () =>
        writeMailStore({
          updatedAt: new Date().toISOString(),
          messages: [],
        }),
    },
    {
      name: 'mail store (addMailMessage)',
      run: () =>
        addMailMessage({
          id: 'test-msg-1',
          folder: 'inbox',
          from: { name: 'Sender', email: 'sender@example.com' },
          to: [{ name: 'User', email: 'hello@zahidp.com' }],
          subject: 'Test',
          body: 'Test body',
          snippet: 'Test body',
          createdAt: new Date().toISOString(),
          isRead: false,
          isStarred: false,
          isArchived: false,
          isTrashed: false,
        }),
    },
    {
      name: 'short-links (saveShortLinks)',
      run: () =>
        saveShortLinks([
          {
            id: 'test-link',
            slug: 'test-slug',
            original_url: 'https://example.com',
            title: 'Test',
            clicks: 0,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]),
    },
    {
      name: 'temp-mail (createTempInbox)',
      run: () =>
        createTempInbox({
          domain: 'example.com',
          username: 'tester',
        }),
    },
    {
      name: 'temp-mail (deleteTempInbox)',
      run: () => deleteTempInbox('tester@example.com'),
    },
    {
      name: 'temp-mail-domains (saveDomainsToStore)',
      run: () =>
        saveDomainsToStore([
          {
            id: 'dom_1',
            domain: 'test.com',
            status: 'verified',
            isDefault: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]),
    },
    {
      name: 'os settings (saveOsSettings)',
      run: () => saveOsSettings({ wallpaper: 'zos-emerald' }),
    },
    {
      name: 'travel-storage (saveTravelData)',
      run: () =>
        saveTravelData([
          {
            code: 'bd-dhk',
            name: 'Dhaka',
            bnName: 'ঢাকা',
            division: 'dhaka',
            slug: 'dhaka',
            status: 'visited',
            visitsCount: 1,
            places: [],
            memories: [],
          },
        ]),
    },
    {
      name: 'table-store (saveTableRows)',
      run: () => saveTableRows('projects', [{ id: 'p1', title: 'Test' }]),
    },
    {
      name: 'table-store (syncRowsToLocal)',
      run: () => syncRowsToLocal('projects', [{ id: 'p1', title: 'Test' }]),
    },
  ];

  let passed = 0;
  let failed = 0;
  const swallowingPaths: string[] = [];

  for (const t of tests) {
    try {
      await t.run();
      console.log(`❌ FAIL (swallowed error): ${t.name} resolved instead of throwing`);
      swallowingPaths.push(t.name);
      failed++;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.log(`✅ PASS (threw as expected): ${t.name} -> "${errMsg}"`);
      passed++;
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (swallowingPaths.length > 0) {
    console.log('Write paths still swallowing errors:');
    swallowingPaths.forEach((p) => console.log(` - ${p}`));
    process.exit(1);
  } else {
    console.log('All store write functions properly propagate write failures!');
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
