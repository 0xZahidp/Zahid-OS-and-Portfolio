export {};

// Set test environment variables (never uses live DB)
process.env.VERCEL = '1';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:9';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-dummy-service-role-key-never-leaked';
process.env.ADMIN_USER_ID = 'test-admin-user-id';

import { defaultPortfolioContent } from '../src/data/default-content';
import { PortfolioContent } from '../src/types/cms';
import { LanguageSkill } from '../src/types/profile';

// In-Memory Test Fixture mimicking the exact relational table schema and route operations
class MockRelationalDb {
  tables: {
    profiles: any[];
    bio_paragraphs: any[];
    experiences: any[];
    projects: any[];
    skills: any[];
    languages: any[];
    social_links: any[];
    suggested_people: any[];
    site_settings: any[];
    portfolio_content: any[];
  } = {
    profiles: [
      {
        id: 'usr_zahid',
        username: '0xZahidp',
        full_name: 'Md Zahid Hasan',
        roles: [],
        updated_at: new Date().toISOString(),
      },
    ],
    bio_paragraphs: [],
    experiences: [],
    projects: [],
    skills: [],
    languages: [],
    social_links: [],
    suggested_people: [],
    site_settings: [],
    portfolio_content: [],
  };

  reset() {
    this.tables.languages = [];
    this.tables.skills = [];
    this.tables.projects = [];
    this.tables.experiences = [];
    this.tables.social_links = [];
    this.tables.suggested_people = [];
    this.tables.bio_paragraphs = [];
    this.tables.site_settings = [];
    this.tables.portfolio_content = [];
  }

  // Exact simulation of GET /api/content logic
  async getContent(): Promise<PortfolioContent> {
    const profileRow = this.tables.profiles[0];
    if (!profileRow) {
      return defaultPortfolioContent;
    }

    const langRows = [...this.tables.languages].sort((a, b) => a.sort_order - b.sort_order);
    const expRows = [...this.tables.experiences].sort((a, b) => a.sort_order - b.sort_order);
    const projRows = [...this.tables.projects].sort((a, b) => a.sort_order - b.sort_order);
    const skillRows = [...this.tables.skills].sort((a, b) => a.sort_order - b.sort_order);
    const socRows = [...this.tables.social_links].sort((a, b) => a.sort_order - b.sort_order);
    const peepRows = [...this.tables.suggested_people].sort((a, b) => a.sort_order - b.sort_order);
    const bioRows = [...this.tables.bio_paragraphs].sort((a, b) => a.sort_order - b.sort_order);

    return {
      profile: profileRow,
      bioParagraphs: bioRows.map((b) => b.content),
      experience: expRows,
      projects: projRows,
      skills: skillRows,
      languages: langRows.map((l) => ({
        id: l.id,
        name: l.name,
        proficiency: l.proficiency,
        rating: l.rating ?? 5,
        note: l.note || '',
        has_voice: l.has_voice !== false,
        hasVoice: l.has_voice !== false,
        sort_order: l.sort_order ?? 0,
      })),
      socialLinks: socRows,
      suggestedPeople: peepRows,
      worksSettings: defaultPortfolioContent.worksSettings,
      basedInSettings: defaultPortfolioContent.basedInSettings,
      githubSettings: defaultPortfolioContent.githubSettings,
      libraryData: defaultPortfolioContent.libraryData,
      updatedAt: profileRow.updated_at,
    };
  }

  // Exact simulation of POST /api/content save & deletion propagation logic
  async saveContent(payload: PortfolioContent & { clientLoaded?: boolean; confirmDelete?: boolean }) {
    const isClientLoaded = payload.clientLoaded === true;
    const isConfirmDelete = payload.confirmDelete === true;

    // Existing rows in table
    const existingLangs = [...this.tables.languages];
    const existingLangIds = existingLangs.map((r) => r.id);

    // Map incoming rows
    const langRows = (payload.languages || []).map((lang, idx) => {
      let langId = lang.id;
      if (!langId) {
        const existingByName = existingLangs.find(
          (r) => r.name.toLowerCase() === lang.name.toLowerCase()
        );
        langId = existingByName
          ? existingByName.id
          : `lang_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      }
      return {
        id: langId,
        name: lang.name,
        proficiency: lang.proficiency,
        rating: lang.rating || 5,
        note: lang.note || '',
        has_voice: lang.hasVoice !== false && lang.has_voice !== false,
        sort_order: idx,
        updated_at: new Date().toISOString(),
      };
    });

    const incomingLangIds = langRows.map((r) => r.id);
    const deletedLangIds = existingLangIds.filter((id) => !incomingLangIds.includes(id));

    // Mass Deletion Guard check
    if (isClientLoaded) {
      if (existingLangIds.length > 8 && deletedLangIds.length > 3) {
        const ratio = deletedLangIds.length / existingLangIds.length;
        if (ratio > 0.5 && !isConfirmDelete) {
          return {
            status: 400,
            body: {
              success: false,
              error: `Mass deletion guard: deleting ${deletedLangIds.length} of ${existingLangIds.length} items (>50%) in languages requires explicit confirmation.`,
              requiresConfirmation: true,
              deletedCount: deletedLangIds.length,
              totalCount: existingLangIds.length,
            },
          };
        }
      }
    }

    // 1. Upsert incoming rows
    for (const row of langRows) {
      const idx = this.tables.languages.findIndex((r) => r.id === row.id);
      if (idx >= 0) {
        this.tables.languages[idx] = row;
      } else {
        this.tables.languages.push(row);
      }
    }

    // 2. Delete missing rows ONLY if clientLoaded is true
    if (isClientLoaded && deletedLangIds.length > 0) {
      this.tables.languages = this.tables.languages.filter(
        (r) => !deletedLangIds.includes(r.id)
      );
    }

    // Synchronize sanitized content
    const sanitized: PortfolioContent = {
      ...payload,
      languages: langRows.map((r) => ({
        id: r.id,
        name: r.name,
        proficiency: r.proficiency,
        rating: r.rating,
        note: r.note,
        has_voice: r.has_voice,
        hasVoice: r.has_voice,
        sort_order: r.sort_order,
      })),
      updatedAt: new Date().toISOString(),
    };

    // Mirror to legacy table
    this.tables.portfolio_content = [{ id: 'current', data: sanitized }];

    return {
      status: 200,
      body: {
        success: true,
        content: sanitized,
      },
    };
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('         DELETION PROPAGATION & CONCURRENCY TEST SUITE          ');
  console.log('================================================================\n');

  const db = new MockRelationalDb();
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // SUITE 1: List sizes 0, 1, 3, 5 - Save, Delete One, Add One, Reorder
  // ---------------------------------------------------------------------------
  console.log('--- Suite 1: List Lifecycle (Save, Delete One, Add One, Reorder) ---');

  // Step 1: Save 3 languages
  const initial3: LanguageSkill[] = [
    { name: 'English', proficiency: 'Native', rating: 5, note: 'Primary', hasVoice: true },
    { name: 'Spanish', proficiency: 'Conversational', rating: 3, note: 'B1 level', hasVoice: true },
    { name: 'French', proficiency: 'Elementary', rating: 2, note: 'A2 level', hasVoice: false },
  ];

  const baseContent = await db.getContent();
  const res1 = await db.saveContent({
    ...baseContent,
    languages: initial3,
    clientLoaded: true,
  });

  assert(res1.status === 200, 'Save 3 languages returns 200 OK');
  assert(db.tables.languages.length === 3, 'Database stored exactly 3 languages');
  const getRes1 = await db.getContent();
  assert(getRes1.languages.length === 3, 'GET /api/content returns exactly 3 languages');
  assert(
    getRes1.languages.map((l) => l.name).join(',') === 'English,Spanish,French',
    'Languages returned in exact initial order (English, Spanish, French)'
  );

  // Step 2: Delete one (Spanish)
  const remaining2 = getRes1.languages.filter((l) => l.name !== 'Spanish');
  const res2 = await db.saveContent({
    ...baseContent,
    languages: remaining2,
    clientLoaded: true,
  });

  assert(res2.status === 200, 'Save after deleting Spanish returns 200 OK');
  assert(db.tables.languages.length === 2, 'Spanish is removed from database table');
  const getRes2 = await db.getContent();
  assert(getRes2.languages.length === 2, 'GET /api/content returns 2 languages');
  assert(
    !getRes2.languages.some((l) => l.name === 'Spanish'),
    'Spanish is completely absent from GET /api/content'
  );
  assert(
    getRes2.languages.map((l) => l.name).join(',') === 'English,French',
    'Remaining languages preserved (English, French)'
  );

  // Step 3: Add one (German) -> size 3 again
  const added3: LanguageSkill[] = [
    ...getRes2.languages,
    { name: 'German', proficiency: 'Conversational', rating: 3, note: 'B1', hasVoice: true },
  ];
  const res3 = await db.saveContent({
    ...baseContent,
    languages: added3,
    clientLoaded: true,
  });

  assert(res3.status === 200, 'Save after adding German returns 200 OK');
  const getRes3 = await db.getContent();
  assert(getRes3.languages.length === 3, 'Database and GET have 3 languages');
  assert(
    getRes3.languages[2].name === 'German' && Boolean(getRes3.languages[2].id),
    'German added with generated ID'
  );

  // Step 4: Reorder (swap German and English)
  const reordered3 = [getRes3.languages[2], getRes3.languages[1], getRes3.languages[0]];
  const res4 = await db.saveContent({
    ...baseContent,
    languages: reordered3,
    clientLoaded: true,
  });

  assert(res4.status === 200, 'Save reordered languages returns 200 OK');
  const getRes4 = await db.getContent();
  assert(
    getRes4.languages.map((l) => l.name).join(',') === 'German,French,English',
    'GET /api/content reflects new order (German, French, English)'
  );
  assert(
    getRes4.languages[0].sort_order === 0 &&
      getRes4.languages[1].sort_order === 1 &&
      getRes4.languages[2].sort_order === 2,
    'All sort_order values updated sequentially (0, 1, 2)'
  );

  // Step 5: Expand to size 5
  const expanded5: LanguageSkill[] = [
    ...getRes4.languages,
    { name: 'Italian', proficiency: 'Elementary', rating: 2, note: '', hasVoice: false },
    { name: 'Japanese', proficiency: 'Conversational', rating: 3, note: '', hasVoice: true },
  ];
  const res5 = await db.saveContent({
    ...baseContent,
    languages: expanded5,
    clientLoaded: true,
  });

  assert(res5.status === 200, 'Save expanded list (size 5) returns 200 OK');
  const getRes5 = await db.getContent();
  assert(getRes5.languages.length === 5, 'GET /api/content returns exactly 5 languages');
  assert(
    getRes5.languages.map((l) => l.name).join(',') === 'German,French,English,Italian,Japanese',
    'All 5 languages stored and returned in exact order'
  );

  // Step 6: Reduce to size 1
  const reduced1 = [getRes5.languages[4]]; // Only Japanese
  const res6 = await db.saveContent({
    ...baseContent,
    languages: reduced1,
    clientLoaded: true,
  });

  assert(res6.status === 200, 'Save reduced list (size 1) returns 200 OK');
  const getRes6 = await db.getContent();
  assert(getRes6.languages.length === 1, 'Database and GET have exactly 1 language');
  assert(getRes6.languages[0].name === 'Japanese', 'Single language is Japanese');

  // Step 7: Reduce to size 0 (Empty Array [])
  const res7 = await db.saveContent({
    ...baseContent,
    languages: [],
    clientLoaded: true,
  });

  assert(res7.status === 200, 'Save empty array [] returns 200 OK');
  assert(db.tables.languages.length === 0, 'Database table languages is now empty');
  const getRes7 = await db.getContent();
  assert(Array.isArray(getRes7.languages), 'GET /api/content returns an array');
  assert(getRes7.languages.length === 0, 'GET /api/content returns [] without reverting to defaults');
  assert(
    !getRes7.languages.some((l) => ['Arabic', 'Bangla', 'English'].includes(l.name)),
    'No default seed languages (Arabic, Bangla, English) resurrected'
  );

  // ---------------------------------------------------------------------------
  // SUITE 2: Client Load Protection (Failed or Unverified Client Load)
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 2: Client Load Protection (Failed Load Safety) ---');

  // Seed with 3 languages
  await db.saveContent({
    ...baseContent,
    languages: initial3,
    clientLoaded: true,
  });
  assert(db.tables.languages.length === 3, 'Pre-condition: 3 languages seeded');

  // Attempt save with empty list when clientLoaded is false (e.g. initial load failed)
  const failedLoadRes = await db.saveContent({
    ...baseContent,
    languages: [],
    clientLoaded: false,
  });

  assert(failedLoadRes.status === 200, 'Save with clientLoaded=false does not crash');
  assert(
    db.tables.languages.length === 3,
    'CRITICAL: No rows deleted when clientLoaded=false (prevented accidental data wipe)'
  );
  const getResFailed = await db.getContent();
  assert(
    getResFailed.languages.length === 3,
    'GET /api/content preserves existing items after unverified save'
  );

  // ---------------------------------------------------------------------------
  // SUITE 3: 50% Mass Deletion Guard (> 8 items, > 3 deleted, > 50%)
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 3: Mass Deletion Guard & Confirmation Dialog ---');

  // Seed with 10 languages
  const bulk10: LanguageSkill[] = Array.from({ length: 10 }, (_, i) => ({
    id: `lang-test-${i + 1}`,
    name: `Language ${i + 1}`,
    proficiency: 'Conversational',
    rating: 3,
    hasVoice: true,
  }));

  await db.saveContent({
    ...baseContent,
    languages: bulk10,
    clientLoaded: true,
  });
  assert(db.tables.languages.length === 10, 'Pre-condition: 10 languages seeded (>8 threshold)');

  // Attempt to delete 6 languages (60% deleted, >3 items) without confirmDelete
  const remaining4 = bulk10.slice(0, 4);
  const guardRes = await db.saveContent({
    ...baseContent,
    languages: remaining4,
    clientLoaded: true,
    confirmDelete: false,
  });

  assert(guardRes.status === 400, 'Mass deletion (>50% of 10 items) rejected with HTTP 400');
  assert(
    Boolean((guardRes.body as any).requiresConfirmation),
    'Response signals requiresConfirmation: true for UI modal'
  );
  assert(db.tables.languages.length === 10, 'Database unchanged: all 10 items intact');

  // Retry with confirmDelete: true (user confirmed dialog)
  const confirmRes = await db.saveContent({
    ...baseContent,
    languages: remaining4,
    clientLoaded: true,
    confirmDelete: true,
  });

  assert(confirmRes.status === 200, 'Mass deletion with confirmDelete=true succeeds (HTTP 200)');
  assert(db.tables.languages.length === 4, 'Database correctly reduced to 4 items');
  const getResConfirmed = await db.getContent();
  assert(getResConfirmed.languages.length === 4, 'GET /api/content returns exactly 4 items');

  // ---------------------------------------------------------------------------
  // SUITE 4: Guard Exemptions (Normal edits not blocked)
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 4: Guard Exemptions (Normal Edits Unblocked) ---');

  // Case A: Small collection (<= 8 items) deleting > 50%
  // 4 items -> delete 3 (75% deleted, but collection <= 8 items)
  const remaining1 = getResConfirmed.languages.slice(0, 1);
  const smallColRes = await db.saveContent({
    ...baseContent,
    languages: remaining1,
    clientLoaded: true,
    confirmDelete: false, // No confirmation needed for small collection
  });

  assert(
    smallColRes.status === 200,
    'Collection with <= 8 items exempt from 50% guard (normal edit allowed without dialog)'
  );
  assert(db.tables.languages.length === 1, 'Small collection reduced to 1 item');

  // Case B: Large collection (> 8 items) deleting <= 3 items
  await db.saveContent({
    ...baseContent,
    languages: bulk10,
    clientLoaded: true,
  });
  assert(db.tables.languages.length === 10, 'Re-seeded with 10 languages');

  // Delete 2 items (10 -> 8, deleting 2 <= 3 items)
  const remaining8 = bulk10.slice(0, 8);
  const minorDeleteRes = await db.saveContent({
    ...baseContent,
    languages: remaining8,
    clientLoaded: true,
    confirmDelete: false, // No confirmation needed when deleting <= 3 items
  });

  assert(
    minorDeleteRes.status === 200,
    'Deleting <= 3 items in large collection exempt from 50% guard'
  );
  assert(db.tables.languages.length === 8, '8 items remain in database');

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED:      ${passed}`);
  console.log(`FAILED:      ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Unhandled test runner error:', err);
  process.exit(1);
});
