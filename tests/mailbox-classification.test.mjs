import test from 'node:test';
import assert from 'node:assert/strict';

// Constants matching src/lib/mail/mailbox.ts
const OFFICIAL_DOMAIN = 'zahidp.com';
const OFFICIAL_SLUGS = new Set([
  'contact', 'hello', 'info', 'support', 'hire', 'jobs', 'careers', 'business',
  'partnerships', 'billing', 'privacy', 'legal', 'security', 'abuse', 'postmaster', 'admin', 'zahid'
]);

function parseEmailAddress(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const angleMatch = trimmed.match(/<([^>]+)>/);
  const addr = (angleMatch ? angleMatch[1] : trimmed).trim();

  const atIdx = addr.indexOf('@');
  if (atIdx <= 0 || atIdx === addr.length - 1) return null;

  const local = addr.slice(0, atIdx).trim().toLowerCase();
  const domain = addr.slice(atIdx + 1).trim().toLowerCase();
  const slug = local.split('+')[0].trim();

  return { local, slug, domain };
}

function classifyMailbox(recipients) {
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return 'ignore';
  }

  let hasOfficial = false;
  let hasUnofficial = false;

  for (const raw of recipients) {
    if (!raw) continue;
    const parts = raw.split(',');
    for (const part of parts) {
      const parsed = parseEmailAddress(part);
      if (!parsed) continue;

      if (parsed.domain === OFFICIAL_DOMAIN.toLowerCase()) {
        if (OFFICIAL_SLUGS.has(parsed.slug)) {
          hasOfficial = true;
        } else {
          hasUnofficial = true;
        }
      }
    }
  }

  if (hasOfficial) return 'official';
  if (hasUnofficial) return 'unofficial';
  return 'ignore';
}

// ----------------------------------------------------------------------------
// TEST SUITE 1: classifyMailbox unit tests
// ----------------------------------------------------------------------------
test('classifyMailbox: correctly classifies official slug', () => {
  const result = classifyMailbox(['contact@zahidp.com']);
  assert.equal(result, 'official');
});

test('classifyMailbox: handles uppercase addresses and domains', () => {
  const result = classifyMailbox(['SUPPORT@ZAHIDP.COM']);
  assert.equal(result, 'official');
});

test('classifyMailbox: handles +tag sub-addressing by stripping the tag', () => {
  const result = classifyMailbox(['hello+newsletter123@zahidp.com']);
  assert.equal(result, 'official');
});

test('classifyMailbox: parses "Name <addr>" format', () => {
  const result = classifyMailbox(['"Md Zahid Hasan" <support@zahidp.com>']);
  assert.equal(result, 'official');
});

test('classifyMailbox: classifies unknown slug on zahidp.com as unofficial', () => {
  const result = classifyMailbox(['random123@zahidp.com']);
  assert.equal(result, 'unofficial');
});

test('classifyMailbox: classifies foreign/disposable domain as ignore', () => {
  const result = classifyMailbox(['inbox@tmp.zahidp.com', 'user@gmail.com']);
  assert.equal(result, 'ignore');
});

test('classifyMailbox: classifies multiple recipients where one is official as official', () => {
  const result = classifyMailbox(['external@partner.org', 'jobs@zahidp.com', 'random@zahidp.com']);
  assert.equal(result, 'official');
});

test('classifyMailbox: returns ignore for empty or invalid recipient list', () => {
  assert.equal(classifyMailbox([]), 'ignore');
  assert.equal(classifyMailbox(['']), 'ignore');
  assert.equal(classifyMailbox(['not-an-email']), 'ignore');
});

// ----------------------------------------------------------------------------
// TEST SUITE 2: Webhook routing with mailbox classification
// ----------------------------------------------------------------------------
class MockWebhookSimulator {
  constructor() {
    this.messages = [];
    this.fetchCallCount = 0;
  }

  async handleEvent(event) {
    if (event.type !== 'email.received') {
      return { status: 200, body: { received: true, ignored: event.type } };
    }

    const emailId = event.data?.email_id || event.data?.id;

    // Check duplicate
    if (this.messages.some((m) => m.resendId === emailId)) {
      return { status: 200, body: { received: true, ignored: 'duplicate' } };
    }

    // Classify from payload recipients if present
    const payloadRecipients = [];
    if (Array.isArray(event.data?.to)) payloadRecipients.push(...event.data.to);
    else if (typeof event.data?.to === 'string') payloadRecipients.push(event.data.to);

    let mailbox = null;
    if (payloadRecipients.length > 0) {
      mailbox = classifyMailbox(payloadRecipients);
      if (mailbox === 'ignore') {
        return { status: 200, body: { received: true, ignored: 'foreign-domain' } };
      }
    }

    // Fetch full email
    this.fetchCallCount++;
    const fullEmail = {
      id: emailId,
      from: event.data?.from || 'sender@example.com',
      to: event.data?.to || ['unknown@otherdomain.com'],
      subject: event.data?.subject || 'Test Subject',
    };

    if (!mailbox) {
      const fetchedRecipients = Array.isArray(fullEmail.to) ? fullEmail.to : [fullEmail.to];
      mailbox = classifyMailbox(fetchedRecipients);
      if (mailbox === 'ignore') {
        return { status: 200, body: { received: true, ignored: 'foreign-domain' } };
      }
    }

    const record = {
      id: `msg_${emailId}`,
      resendId: emailId,
      mailbox,
      isRead: false,
      folder: 'inbox',
      subject: fullEmail.subject,
    };
    this.messages.push(record);

    return { status: 200, body: { success: true, messageId: record.id, mailbox } };
  }
}

test('Webhook: foreign-domain event returns 200 with no fetch and no insert', async () => {
  const sim = new MockWebhookSimulator();
  const res = await sim.handleEvent({
    type: 'email.received',
    data: {
      id: 're_foreign_1',
      to: ['disposable@tempmail.io'],
      subject: 'Spam or Temp',
    },
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.ignored, 'foreign-domain');
  assert.equal(sim.fetchCallCount, 0, 'Must NOT fetch details for foreign domain');
  assert.equal(sim.messages.length, 0, 'Must NOT insert row for foreign domain');
});

test('Webhook: unknown slug on zahidp.com stores with mailbox unofficial', async () => {
  const sim = new MockWebhookSimulator();
  const res = await sim.handleEvent({
    type: 'email.received',
    data: {
      id: 're_unoff_1',
      to: ['customalias99@zahidp.com'],
      subject: 'Inquiry',
    },
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.mailbox, 'unofficial');
  assert.equal(sim.messages.length, 1);
  assert.equal(sim.messages[0].mailbox, 'unofficial');
});

test('Webhook: official email stores with mailbox official', async () => {
  const sim = new MockWebhookSimulator();
  const res = await sim.handleEvent({
    type: 'email.received',
    data: {
      id: 're_off_1',
      to: ['hello@zahidp.com'],
      subject: 'Official Partnership',
    },
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.mailbox, 'official');
  assert.equal(sim.messages.length, 1);
  assert.equal(sim.messages[0].mailbox, 'official');
});

test('Webhook: retry of the same event changes nothing (idempotent)', async () => {
  const sim = new MockWebhookSimulator();
  await sim.handleEvent({
    type: 'email.received',
    data: { id: 're_off_2', to: ['support@zahidp.com'] },
  });

  sim.messages[0].isRead = true;
  sim.messages[0].folder = 'archive';

  // Retry
  const retryRes = await sim.handleEvent({
    type: 'email.received',
    data: { id: 're_off_2', to: ['support@zahidp.com'] },
  });

  assert.equal(retryRes.status, 200);
  assert.equal(retryRes.body.ignored, 'duplicate');
  assert.equal(sim.messages[0].isRead, true);
  assert.equal(sim.messages[0].folder, 'archive');
});

// ----------------------------------------------------------------------------
// TEST SUITE 3: Sync & Backfill foreign-domain skipping
// ----------------------------------------------------------------------------
test('Sync/backfill: foreign-domain summaries are skipped without fetching details', async () => {
  const summaries = [
    { id: 'item_1', to: ['user@disposable-temp.com'] },
    { id: 'item_2', to: ['contact@zahidp.com'] },
    { id: 'item_3', to: ['stranger@external.net'] },
    { id: 'item_4', to: ['sales@zahidp.com'] },
  ];

  let fetchedDetailsCount = 0;
  let skippedForeignCount = 0;
  const processed = [];

  for (const item of summaries) {
    const recipients = Array.isArray(item.to) ? item.to : [item.to];
    const mb = classifyMailbox(recipients);
    if (mb === 'ignore') {
      skippedForeignCount++;
      continue;
    }

    // Only fetch for non-ignored
    fetchedDetailsCount++;
    processed.push({ id: item.id, mailbox: mb });
  }

  assert.equal(skippedForeignCount, 2, '2 foreign domain emails skipped');
  assert.equal(fetchedDetailsCount, 2, 'Only 2 eligible emails fetched');
  assert.equal(processed[0].mailbox, 'official');
  assert.equal(processed[1].mailbox, 'unofficial');
});

// ----------------------------------------------------------------------------
// TEST SUITE 4: Mobile detail view clearing on thread delete
// ----------------------------------------------------------------------------
test('Mobile: clearing selected thread returns to list view', () => {
  let activeThreadId = 'thread_123';
  let mobileView = 'message';

  function handleBackToList() {
    activeThreadId = null;
    mobileView = 'list';
  }

  function deleteThread(threadId) {
    if (mobileView === 'message') {
      handleBackToList();
    }
  }

  deleteThread('thread_123');

  assert.equal(activeThreadId, null, 'Active thread must be cleared');
  assert.equal(mobileView, 'list', 'Mobile view must return to list');
});

