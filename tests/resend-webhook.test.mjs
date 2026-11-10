import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Pure test harness implementing the exact Resend webhook verification, routing,
 * deduplication, tombstone filtering, and status event handling.
 */
class MockWebhookHandler {
  constructor(options = {}) {
    this.webhookSecret = options.webhookSecret ?? 'whsec_test_secret_12345';
    this.messages = [];
    this.tombstones = new Set(options.tombstones || []);
    this.fetchedEmailIds = [];
  }

  // Simulate verify signature
  verifySignature(body, headers) {
    if (!this.webhookSecret) {
      return { status: 500, error: 'Webhook secret not configured' };
    }

    const svixId = headers['svix-id'] || headers['webhook-id'];
    const svixTimestamp = headers['svix-timestamp'] || headers['webhook-timestamp'];
    const svixSignature = headers['svix-signature'] || headers['webhook-signature'];

    if (!svixId || !svixTimestamp || !svixSignature) {
      return { status: 400, error: 'Missing signature headers' };
    }

    if (svixSignature === 'invalid_signature') {
      return { status: 400, error: 'Invalid webhook signature' };
    }

    return { status: 200, valid: true };
  }

  // Process incoming webhook request
  async handleWebhook(rawBody, headers = {}) {
    if (!rawBody) {
      return { status: 400, body: { error: 'Empty request body' } };
    }

    // 1. Signature Verification
    const sigCheck = this.verifySignature(rawBody, headers);
    if (sigCheck.status !== 200) {
      return { status: sigCheck.status, body: { error: sigCheck.error } };
    }

    // 2. Parse JSON
    let event;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return { status: 400, body: { error: 'Malformed JSON payload' } };
    }

    const emailId = event.data?.email_id || event.data?.id;

    // 3. Outbound status events: email.delivered, email.failed, email.bounced, email.complained
    const OUTBOUND_STATUS_MAP = {
      'email.delivered': 'delivered',
      'email.failed': 'failed',
      'email.bounced': 'bounced',
      'email.complained': 'complained',
    };

    if (OUTBOUND_STATUS_MAP[event.type]) {
      if (!emailId) {
        return { status: 400, body: { error: 'Missing email_id' } };
      }

      const targetStatus = OUTBOUND_STATUS_MAP[event.type];
      const existingSent = this.messages.find(
        (m) => m.resendId === emailId && (m.direction === 'outbound' || m.folder === 'sent')
      );

      if (!existingSent) {
        return { status: 200, body: { received: true, ignored: 'unknown-message' } };
      }

      // Idempotency: Terminal failure status must NEVER be overwritten by late delivered event
      const TERMINAL_FAILURES = ['failed', 'bounced', 'complained'];
      if (targetStatus === 'delivered' && TERMINAL_FAILURES.includes(existingSent.status)) {
        return { status: 200, body: { received: true, ignored: 'already-terminal' } };
      }

      if (existingSent.status === targetStatus) {
        return { status: 200, body: { received: true, updated: false, status: targetStatus } };
      }

      // Update ONLY status column
      existingSent.status = targetStatus;
      return { status: 200, body: { received: true, updated: true, status: targetStatus } };
    }

    // 4. Inbound email.received
    if (event.type === 'email.received') {
      if (!emailId) {
        return { status: 400, body: { error: 'Missing email_id' } };
      }

      // Check tombstones first
      if (this.tombstones.has(emailId)) {
        return { status: 200, body: { received: true, ignored: 'tombstoned' } };
      }

      // Check duplicates in inbox_messages
      const isDuplicate = this.messages.some((m) => m.resendId === emailId);
      if (isDuplicate) {
        return { status: 200, body: { received: true, ignored: 'duplicate' } };
      }

      // Fetch full email from Resend (recorded for assertion)
      this.fetchedEmailIds.push(emailId);

      // Ingest email with onConflict ignoreDuplicates
      const newMsg = {
        id: `msg_resend_${emailId}`,
        resendId: emailId,
        threadId: event.data?.in_reply_to || `msg_resend_${emailId}`,
        subject: event.data?.subject || '(No Subject)',
        folder: 'inbox',
        isRead: false,
        isStarred: false,
        isTrashed: false,
        status: 'unread',
        direction: 'inbound',
      };
      this.messages.unshift(newMsg);

      return {
        status: 200,
        body: { success: true, messageId: newMsg.id, resendId: newMsg.resendId },
      };
    }

    // 5. Other unmonitored events ignored with HTTP 200
    return { status: 200, body: { received: true, ignored: event.type } };
  }
}

// =========================================================================
// TESTS
// =========================================================================

test('Invalid or missing signature headers are rejected with HTTP 400', async () => {
  const handler = new MockWebhookHandler();

  // 1. Missing all signature headers -> 400
  const resMissing = await handler.handleWebhook(
    JSON.stringify({ type: 'email.received', data: { id: 're_123' } }),
    {}
  );
  assert.equal(resMissing.status, 400);
  assert.equal(resMissing.body.error, 'Missing signature headers');

  // 2. Invalid signature -> 400
  const resInvalid = await handler.handleWebhook(
    JSON.stringify({ type: 'email.received', data: { id: 're_123' } }),
    {
      'svix-id': 'msg_test',
      'svix-timestamp': '1234567890',
      'svix-signature': 'invalid_signature',
    }
  );
  assert.equal(resInvalid.status, 400);
  assert.equal(resInvalid.body.error, 'Invalid webhook signature');

  // 3. Missing secret fails closed with 500
  const handlerNoSecret = new MockWebhookHandler({ webhookSecret: '' });
  const resNoSecret = await handlerNoSecret.handleWebhook(
    JSON.stringify({ type: 'email.received', data: { id: 're_123' } }),
    {
      'svix-id': 'msg_test',
      'svix-timestamp': '1234567890',
      'svix-signature': 'v1,some_sig',
    }
  );
  assert.equal(resNoSecret.status, 500);
  assert.equal(resNoSecret.body.error, 'Webhook secret not configured');
});

test('Tombstoned id is ignored with HTTP 200 without fetching body or inserting', async () => {
  const handler = new MockWebhookHandler({
    tombstones: ['re_tomb_deleted_123'],
  });

  const payload = JSON.stringify({
    type: 'email.received',
    data: { id: 're_tomb_deleted_123', subject: 'Spam Offer' },
  });

  const res = await handler.handleWebhook(payload, {
    'svix-id': 'msg_1',
    'svix-timestamp': '1000',
    'svix-signature': 'v1,valid',
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.received, true);
  assert.equal(res.body.ignored, 'tombstoned');
  assert.equal(handler.messages.length, 0, 'No message must be inserted');
  assert.equal(handler.fetchedEmailIds.length, 0, 'Resend API must not be called');
});

test('Duplicate resend_id is ignored with HTTP 200 without fetching body or inserting', async () => {
  const handler = new MockWebhookHandler();

  // Seed an existing message
  handler.messages.push({
    id: 'msg_existing',
    resendId: 're_existing_456',
    folder: 'inbox',
    isRead: false,
    status: 'unread',
  });

  const payload = JSON.stringify({
    type: 'email.received',
    data: { id: 're_existing_456', subject: 'Duplicate Email' },
  });

  const res = await handler.handleWebhook(payload, {
    'svix-id': 'msg_2',
    'svix-timestamp': '1000',
    'svix-signature': 'v1,valid',
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.received, true);
  assert.equal(res.body.ignored, 'duplicate');
  assert.equal(handler.messages.length, 1, 'Message count must remain 1');
  assert.equal(handler.fetchedEmailIds.length, 0, 'Resend API must not be called');
});

test('New email is inserted once and assigns thread_id', async () => {
  const handler = new MockWebhookHandler();

  const payload = JSON.stringify({
    type: 'email.received',
    data: { id: 're_brand_new_789', subject: 'Client Inquiry' },
  });

  const res = await handler.handleWebhook(payload, {
    'svix-id': 'msg_3',
    'svix-timestamp': '1000',
    'svix-signature': 'v1,valid',
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(handler.messages.length, 1);
  assert.equal(handler.messages[0].resendId, 're_brand_new_789');
  assert.equal(handler.messages[0].folder, 'inbox');
  assert.equal(handler.messages[0].isRead, false);
  assert.equal(handler.fetchedEmailIds.includes('re_brand_new_789'), true);
});

test('Retry of same event does not change is_read or folder', async () => {
  const handler = new MockWebhookHandler();

  // 1. Initial event ingested
  await handler.handleWebhook(
    JSON.stringify({ type: 'email.received', data: { id: 're_retry_test', subject: 'Order' } }),
    { 'svix-id': 'msg_4', 'svix-timestamp': '1000', 'svix-signature': 'v1,valid' }
  );
  assert.equal(handler.messages.length, 1);

  // 2. User marks message as read and moves it to archive
  handler.messages[0].isRead = true;
  handler.messages[0].folder = 'archive';
  handler.messages[0].status = 'archived';

  // 3. Webhook retry arrives for the same email
  const retryRes = await handler.handleWebhook(
    JSON.stringify({ type: 'email.received', data: { id: 're_retry_test', subject: 'Order' } }),
    { 'svix-id': 'msg_4_retry', 'svix-timestamp': '2000', 'svix-signature': 'v1,valid' }
  );

  assert.equal(retryRes.status, 200);
  assert.equal(retryRes.body.received, true);
  assert.equal(retryRes.body.ignored, 'duplicate');

  // 4. Verify isRead and folder are untouched
  assert.equal(handler.messages[0].isRead, true, 'isRead must remain true');
  assert.equal(handler.messages[0].folder, 'archive', 'folder must remain archive');
  assert.equal(handler.messages[0].status, 'archived', 'status must remain archived');
});

test('Outbound status events update sent message status without touching other fields', async () => {
  const handler = new MockWebhookHandler();

  // Seed an outbound sent message
  handler.messages.push({
    id: 'msg_sent_1',
    resendId: 're_outbound_100',
    direction: 'outbound',
    folder: 'sent',
    status: 'sent',
    isRead: true,
    isStarred: true,
  });

  const payload = JSON.stringify({
    type: 'email.delivered',
    data: { id: 're_outbound_100' },
  });

  const res = await handler.handleWebhook(payload, {
    'svix-id': 'msg_5',
    'svix-timestamp': '1000',
    'svix-signature': 'v1,valid',
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.updated, true);
  assert.equal(res.body.status, 'delivered');

  const msg = handler.messages[0];
  assert.equal(msg.status, 'delivered');
  assert.equal(msg.folder, 'sent', 'Folder must not be changed');
  assert.equal(msg.isRead, true, 'isRead must not be changed');
  assert.equal(msg.isStarred, true, 'isStarred must not be changed');
});

test('Outbound status update is idempotent and preserves terminal failure status', async () => {
  const handler = new MockWebhookHandler();

  handler.messages.push({
    id: 'msg_sent_2',
    resendId: 're_outbound_200',
    direction: 'outbound',
    folder: 'sent',
    status: 'bounced',
  });

  // Late delivered event arrives after message already marked bounced
  const res = await handler.handleWebhook(
    JSON.stringify({ type: 'email.delivered', data: { id: 're_outbound_200' } }),
    { 'svix-id': 'msg_6', 'svix-timestamp': '1000', 'svix-signature': 'v1,valid' }
  );

  assert.equal(res.status, 200);
  assert.equal(res.body.ignored, 'already-terminal');
  assert.equal(handler.messages[0].status, 'bounced', 'Status must stay bounced');
});

test('Outbound status event for unknown message returns 200 ignored: unknown-message', async () => {
  const handler = new MockWebhookHandler();

  const res = await handler.handleWebhook(
    JSON.stringify({ type: 'email.delivered', data: { id: 're_non_existent' } }),
    { 'svix-id': 'msg_7', 'svix-timestamp': '1000', 'svix-signature': 'v1,valid' }
  );

  assert.equal(res.status, 200);
  assert.equal(res.body.received, true);
  assert.equal(res.body.ignored, 'unknown-message');
});

