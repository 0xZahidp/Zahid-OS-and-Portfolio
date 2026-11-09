import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Pure test harness implementing the tombstone & ingestion filtering logic
 * exactly as implemented in src/lib/mail/store.ts.
 */
class MockMailEngine {
  constructor() {
    this.messages = [];
    this.tombstones = new Set();
  }

  // Soft delete message (move to trash)
  softDeleteMessage(id) {
    const msg = this.messages.find((m) => m.id === id);
    if (!msg) return false;
    msg.isTrashed = true;
    msg.folder = 'trash';
    // Soft delete does NOT record a tombstone
    return true;
  }

  // Restore message from trash
  restoreMessage(id) {
    const msg = this.messages.find((m) => m.id === id);
    if (!msg) return false;
    msg.isTrashed = false;
    msg.folder = 'inbox';
    return true;
  }

  // Permanent delete message
  permanentDeleteMessage(id) {
    const idx = this.messages.findIndex((m) => m.id === id);
    if (idx < 0) return false;
    const msg = this.messages[idx];
    if (msg.resendId) {
      this.tombstones.add(msg.resendId);
    }
    this.messages.splice(idx, 1);
    return true;
  }

  // Permanent delete thread
  permanentDeleteThread(threadId) {
    const threadMsgs = this.messages.filter((m) => m.threadId === threadId || m.id === threadId);
    if (threadMsgs.length === 0) return false;
    for (const m of threadMsgs) {
      if (m.resendId) {
        this.tombstones.add(m.resendId);
      }
    }
    this.messages = this.messages.filter((m) => m.threadId !== threadId && m.id !== threadId);
    return true;
  }

  // Empty trash
  emptyTrash() {
    const trashed = this.messages.filter((m) => m.isTrashed || m.folder === 'trash');
    for (const m of trashed) {
      if (m.resendId) {
        this.tombstones.add(m.resendId);
      }
    }
    const beforeCount = this.messages.length;
    this.messages = this.messages.filter((m) => !m.isTrashed && m.folder !== 'trash');
    return beforeCount - this.messages.length;
  }

  // Sync ingestion from Resend list
  syncFromResend(incomingSummaries) {
    const existingResendIds = new Set(
      this.messages.map((m) => m.resendId).filter(Boolean)
    );

    // Filter out already existing rows and tombstoned rows
    const newSummaries = incomingSummaries.filter(
      (s) => !existingResendIds.has(s.id) && !this.tombstones.has(s.id)
    );

    const imported = [];
    for (const s of newSummaries) {
      // Ingestion creates a new inbox message
      const msg = {
        id: `msg_resend_${s.id}`,
        resendId: s.id,
        threadId: `msg_resend_${s.id}`,
        subject: s.subject || '(No Subject)',
        folder: 'inbox',
        isRead: false,
        isStarred: false,
        isTrashed: false,
        isArchived: false,
      };
      this.messages.unshift(msg);
      imported.push(s.id);
    }

    return { importedCount: imported.length, imported };
  }
}

test('Permanent delete records a tombstone and subsequent sync skips re-importing', () => {
  const engine = new MockMailEngine();

  // 1. Initial email is synced
  engine.syncFromResend([{ id: 're_perm_001', subject: 'Invoice' }]);
  assert.equal(engine.messages.length, 1);
  assert.equal(engine.messages[0].resendId, 're_perm_001');

  // 2. Permanently delete the email
  const deleted = engine.permanentDeleteMessage('msg_resend_re_perm_001');
  assert.equal(deleted, true);
  assert.equal(engine.messages.length, 0);
  assert.equal(engine.tombstones.has('re_perm_001'), true);

  // 3. Next sync arrives with the same email from Resend API
  const syncResult = engine.syncFromResend([{ id: 're_perm_001', subject: 'Invoice' }]);
  assert.equal(syncResult.importedCount, 0);
  assert.equal(engine.messages.length, 0, 'Deleted email must NOT be re-imported');
});

test('Permanent delete of a thread tombstones all messages in that thread', () => {
  const engine = new MockMailEngine();

  engine.messages = [
    {
      id: 'm1',
      threadId: 'thread_100',
      resendId: 're_thread_msg1',
      subject: 'Job Offer',
      folder: 'inbox',
      isTrashed: false,
    },
    {
      id: 'm2',
      threadId: 'thread_100',
      resendId: 're_thread_msg2',
      subject: 'Re: Job Offer',
      folder: 'sent',
      isTrashed: false,
    },
  ];

  assert.equal(engine.messages.length, 2);

  // Permanently delete thread
  engine.permanentDeleteThread('thread_100');
  assert.equal(engine.messages.length, 0);
  assert.equal(engine.tombstones.has('re_thread_msg1'), true);
  assert.equal(engine.tombstones.has('re_thread_msg2'), true);

  // Resend sync attempts to sync re_thread_msg1
  const res = engine.syncFromResend([{ id: 're_thread_msg1', subject: 'Job Offer' }]);
  assert.equal(res.importedCount, 0);
  assert.equal(engine.messages.length, 0);
});

test('Soft delete (move to Trash) does NOT create a tombstone and stays trashed after sync', () => {
  const engine = new MockMailEngine();

  // 1. Initial email in inbox
  engine.syncFromResend([{ id: 're_soft_001', subject: 'Newsletter' }]);
  assert.equal(engine.messages.length, 1);

  // 2. Move to Trash (soft delete)
  engine.softDeleteMessage('msg_resend_re_soft_001');
  assert.equal(engine.messages[0].folder, 'trash');
  assert.equal(engine.messages[0].isTrashed, true);
  assert.equal(engine.tombstones.has('re_soft_001'), false, 'Soft delete must NOT create a tombstone');

  // 3. Resend sync runs again
  const syncResult = engine.syncFromResend([{ id: 're_soft_001', subject: 'Newsletter' }]);
  assert.equal(syncResult.importedCount, 0, 'Existing message is skipped');

  // 4. Assert it stays trashed and was NOT resurrected to inbox
  assert.equal(engine.messages[0].folder, 'trash');
  assert.equal(engine.messages[0].isTrashed, true);
});

test('Restoring from trash returns message to inbox and remains untouched by sync', () => {
  const engine = new MockMailEngine();

  // 1. Ingest email and move to trash
  engine.syncFromResend([{ id: 're_restore_001', subject: 'Contract' }]);
  engine.softDeleteMessage('msg_resend_re_restore_001');
  assert.equal(engine.messages[0].folder, 'trash');

  // 2. Restore to inbox
  engine.restoreMessage('msg_resend_re_restore_001');
  assert.equal(engine.messages[0].folder, 'inbox');
  assert.equal(engine.messages[0].isTrashed, false);
  assert.equal(engine.tombstones.has('re_restore_001'), false);

  // 3. Sync runs
  const syncResult = engine.syncFromResend([{ id: 're_restore_001', subject: 'Contract' }]);
  assert.equal(syncResult.importedCount, 0);
  assert.equal(engine.messages[0].folder, 'inbox');
});

test('Empty Trash tombstones all trashed messages while preserving active inbox messages', () => {
  const engine = new MockMailEngine();

  engine.messages = [
    {
      id: 'm_active',
      resendId: 're_active_1',
      folder: 'inbox',
      isTrashed: false,
    },
    {
      id: 'm_trash_1',
      resendId: 're_trash_1',
      folder: 'trash',
      isTrashed: true,
    },
    {
      id: 'm_trash_2',
      resendId: 're_trash_2',
      folder: 'trash',
      isTrashed: true,
    },
  ];

  // Empty Trash
  const removed = engine.emptyTrash();
  assert.equal(removed, 2);
  assert.equal(engine.messages.length, 1);
  assert.equal(engine.messages[0].id, 'm_active');

  // Tombstones must contain trash resend_ids, but NOT active inbox
  assert.equal(engine.tombstones.has('re_trash_1'), true);
  assert.equal(engine.tombstones.has('re_trash_2'), true);
  assert.equal(engine.tombstones.has('re_active_1'), false);

  // Sync with all 3 from Resend
  const syncResult = engine.syncFromResend([
    { id: 're_trash_1' },
    { id: 're_trash_2' },
    { id: 're_active_1' },
  ]);

  assert.equal(syncResult.importedCount, 0);
  assert.equal(engine.messages.length, 1);
  assert.equal(engine.messages[0].resendId, 're_active_1');
});

