import test from 'node:test';
import assert from 'node:assert/strict';

// Helper: Normalize Subject
function normalizeSubject(subject) {
  if (!subject) return '';
  return subject
    .replace(/^(\s*(re|fwd|fw|re\s*\[\d+\]|fwd\s*\[\d+\])\s*:\s*)+/i, '')
    .trim();
}

// Helper: Backfill / Group threads matching the production implementation
function backfillThreads(messages) {
  const result = messages.map(m => ({ ...m }));
  const idMap = new Map();
  const resendMap = new Map();

  for (const m of result) {
    if (m.id) idMap.set(m.id, m);
    if (m.resendId) resendMap.set(m.resendId, m);
  }

  // Pass 1: In-Reply-To and References
  for (const m of result) {
    let parent;
    if (m.inReplyTo) {
      parent = resendMap.get(m.inReplyTo) || idMap.get(m.inReplyTo);
    }
    if (!parent && m.references) {
      for (const [resendId, candidate] of resendMap.entries()) {
        if (m.references.includes(resendId)) {
          parent = candidate;
          break;
        }
      }
    }
    if (parent) {
      const assigned = parent.threadId || parent.id;
      m.threadId = assigned;
    }
  }

  // Pass 2: Normalized subject fallback ONLY if participants overlap AND within 30 days
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  for (let i = 0; i < result.length; i++) {
    const current = result[i];
    const norm = normalizeSubject(current.subject);
    if (!norm) continue;

    for (let j = 0; j < result.length; j++) {
      if (i === j) continue;
      const other = result[j];
      const otherNorm = normalizeSubject(other.subject);
      if (norm.toLowerCase() !== otherNorm.toLowerCase()) continue;

      const currentParticipants = [current.from.email, ...(current.to || []).map(t => t.email)].filter(Boolean).map(e => e.toLowerCase());
      const otherParticipants = [other.from.email, ...(other.to || []).map(t => t.email)].filter(Boolean).map(e => e.toLowerCase());
      const hasOverlap = currentParticipants.some(p => otherParticipants.includes(p));
      if (!hasOverlap) continue;

      const currentTime = new Date(current.createdAt).getTime();
      const otherTime = new Date(other.createdAt).getTime();
      if (Math.abs(currentTime - otherTime) <= thirtyDaysMs) {
        const targetThreadId = otherTime <= currentTime ? (other.threadId || other.id) : (current.threadId || current.id);
        current.threadId = targetThreadId;
        other.threadId = targetThreadId;
      }
    }
  }

  // Pass 3: Self-assign
  for (const m of result) {
    if (!m.threadId) {
      m.threadId = m.id;
    }
  }

  return result;
}

function calculateUnreadThreadCount(messages) {
  const threaded = backfillThreads(messages);
  const unreadThreads = new Set();
  for (const m of threaded) {
    if (!m.isRead && !m.isTrashed && !m.isArchived && (m.folder === 'inbox' || !m.folder)) {
      unreadThreads.add(m.threadId || m.id);
    }
  }
  return unreadThreads.size;
}

test('Subject normalization strips Re:, Fwd:, FW:, case-insensitively and repeatedly', () => {
  assert.equal(normalizeSubject('Re: CV Submission'), 'CV Submission');
  assert.equal(normalizeSubject('RE: Re: Fwd: Project Inquiry'), 'Project Inquiry');
  assert.equal(normalizeSubject('re[2]: fwd: Hello Zahid'), 'Hello Zahid');
  assert.equal(normalizeSubject('Direct Subject Without Prefix'), 'Direct Subject Without Prefix');
  assert.equal(normalizeSubject(''), '');
});

test('Threading groups by In-Reply-To header', () => {
  const messages = [
    {
      id: 'msg-1',
      resendId: 'res-1',
      subject: 'Job Offer',
      from: { email: 'recruiter@tech.com' },
      to: [{ email: 'hello@zahidp.com' }],
      createdAt: '2026-11-01T10:00:00Z',
    },
    {
      id: 'msg-2',
      resendId: 'res-2',
      inReplyTo: 'res-1',
      subject: 'Re: Job Offer',
      from: { email: 'hello@zahidp.com' },
      to: [{ email: 'recruiter@tech.com' }],
      createdAt: '2026-11-01T11:00:00Z',
    },
  ];

  const threaded = backfillThreads(messages);
  assert.equal(threaded[0].threadId, 'msg-1');
  assert.equal(threaded[1].threadId, 'msg-1');
});

test('Threading groups by normalized subject ONLY if participants overlap AND within 30 days', () => {
  const now = new Date('2026-11-05T12:00:00Z').getTime();

  // Overlapping participants within 2 days -> should group
  const pair1 = [
    {
      id: 'msg-a',
      subject: 'Consulting Contract',
      from: { email: 'alice@client.com' },
      to: [{ email: 'hello@zahidp.com' }],
      createdAt: new Date(now).toISOString(),
    },
    {
      id: 'msg-b',
      subject: 'Re: Consulting Contract',
      from: { email: 'hello@zahidp.com' },
      to: [{ email: 'alice@client.com' }],
      createdAt: new Date(now + 86400000).toISOString(),
    },
  ];

  const threadedPair1 = backfillThreads(pair1);
  assert.equal(threadedPair1[0].threadId, threadedPair1[1].threadId);

  // Same subject, but completely DIFFERENT participants -> MUST NOT GROUP
  const unrelatedPair = [
    {
      id: 'msg-c',
      subject: 'Consulting Contract',
      from: { email: 'stranger@nowhere.com' },
      to: [{ email: 'other@nowhere.com' }],
      createdAt: new Date(now).toISOString(),
    },
    {
      id: 'msg-d',
      subject: 'Consulting Contract',
      from: { email: 'different@corp.com' },
      to: [{ email: 'hello@zahidp.com' }],
      createdAt: new Date(now + 1000).toISOString(),
    },
  ];

  const threadedUnrelated = backfillThreads(unrelatedPair);
  assert.notEqual(threadedUnrelated[0].threadId, threadedUnrelated[1].threadId);

  // Same subject, overlapping participants, but 45 days apart (> 30 days) -> MUST NOT GROUP
  const fortyFiveDaysLater = now + 45 * 24 * 60 * 60 * 1000;
  const oldPair = [
    {
      id: 'msg-e',
      subject: 'Annual Review',
      from: { email: 'alice@client.com' },
      to: [{ email: 'hello@zahidp.com' }],
      createdAt: new Date(now).toISOString(),
    },
    {
      id: 'msg-f',
      subject: 'Annual Review',
      from: { email: 'alice@client.com' },
      to: [{ email: 'hello@zahidp.com' }],
      createdAt: new Date(fortyFiveDaysLater).toISOString(),
    },
  ];

  const threadedOld = backfillThreads(oldPair);
  assert.notEqual(threadedOld[0].threadId, threadedOld[1].threadId);
});

test('Unread count calculation counts unread THREADS, not total unread messages', () => {
  // A thread with 3 messages, 2 of which are unread -> counts as 1 unread thread
  const messages = [
    {
      id: 'm1',
      threadId: 'thread-alpha',
      folder: 'inbox',
      isRead: false,
      from: { email: 'client@work.com' },
      to: [{ email: 'hello@zahidp.com' }],
      createdAt: '2026-11-01T10:00:00Z',
    },
    {
      id: 'm2',
      threadId: 'thread-alpha',
      folder: 'inbox',
      isRead: false,
      from: { email: 'client@work.com' },
      to: [{ email: 'hello@zahidp.com' }],
      createdAt: '2026-11-01T11:00:00Z',
    },
    {
      id: 'm3',
      threadId: 'thread-alpha',
      folder: 'sent',
      isRead: true,
      from: { email: 'hello@zahidp.com' },
      to: [{ email: 'client@work.com' }],
      createdAt: '2026-11-01T12:00:00Z',
    },
    // Another separate thread, read -> 0 unread
    {
      id: 'm4',
      threadId: 'thread-beta',
      folder: 'inbox',
      isRead: true,
      from: { email: 'bob@work.com' },
      to: [{ email: 'hello@zahidp.com' }],
      createdAt: '2026-11-01T13:00:00Z',
    },
  ];

  assert.equal(calculateUnreadThreadCount(messages), 1);

  // When m1 and m2 are marked read:
  messages[0].isRead = true;
  messages[1].isRead = true;
  assert.equal(calculateUnreadThreadCount(messages), 0);
});
