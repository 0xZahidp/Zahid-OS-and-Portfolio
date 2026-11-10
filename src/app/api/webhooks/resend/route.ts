import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getAppSecret } from '@/lib/env-vault';
import {
  upsertReceivedEmail,
  getTombstoneResendIds,
  readMailStore,
  writeMailStore,
} from '@/lib/mail/store';
import { classifyMailbox } from '@/lib/mail/mailbox';
import { supabaseServer } from '@/lib/supabase/server';
import { EmailAttachment } from '@/types/mail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Read raw body text for signature verification
    const rawBody = await req.text();

    if (!rawBody) {
      console.warn('[resend-webhook] Empty request body received');
      return NextResponse.json({ error: 'Empty request body', reason: 'Request body was empty or missing' }, { status: 400 });
    }

    // 2. Extract Svix signature headers
    const svixId = req.headers.get('svix-id') || req.headers.get('webhook-id') || '';
    const svixTimestamp = req.headers.get('svix-timestamp') || req.headers.get('webhook-timestamp') || '';
    const svixSignature = req.headers.get('svix-signature') || req.headers.get('webhook-signature') || '';

    // Missing signature headers -> fail with 400
    if (!svixId || !svixTimestamp || !svixSignature) {
      console.warn('[resend-webhook] Missing signature headers');
      return NextResponse.json(
        { error: 'Missing signature headers', reason: 'One or more required Svix signature headers (svix-id, svix-timestamp, svix-signature) are missing' },
        { status: 400 }
      );
    }

    // 3. Fetch Webhook Secret: if missing, fail closed (500) and log clear error
    const webhookSecret =
      (await getAppSecret('RESEND_WEBHOOK_SECRET')) || process.env.RESEND_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error(
        '[resend-webhook] RESEND_WEBHOOK_SECRET is not configured in environment or database. Failing closed with 500.'
      );
      return NextResponse.json({ error: 'Webhook secret not configured', reason: 'RESEND_WEBHOOK_SECRET is not set in environment or database vault' }, { status: 500 });
    }

    // 4. Verify Svix signature with RESEND_WEBHOOK_SECRET
    const apiKey = (await getAppSecret('RESEND_API_KEY')) || process.env.RESEND_API_KEY;
    const resend = new Resend(apiKey || 're_webhook_verifier');

    try {
      resend.webhooks.verify({
        payload: rawBody,
        webhookSecret,
        headers: {
          id: svixId,
          timestamp: svixTimestamp,
          signature: svixSignature,
        },
      });
      console.log(`[resend-webhook] Signature verification passed for svix_id: ${svixId}`);
    } catch (err: unknown) {
      const reason = err instanceof Error ? err.message : 'Invalid signature';
      console.warn(`[resend-webhook] Signature verification failed: ${reason}`);
      return NextResponse.json({ error: 'Invalid webhook signature', reason }, { status: 400 });
    }

    // 5. Parse JSON payload
    let event: {
      type: string;
      created_at?: string;
      data?: {
        email_id?: string;
        id?: string;
        from?: string;
        to?: string[];
        subject?: string;
      };
    };

    try {
      event = JSON.parse(rawBody);
    } catch {
      console.warn('[resend-webhook] Malformed JSON payload');
      return NextResponse.json({ error: 'Malformed JSON payload', reason: 'Failed to parse request body as JSON' }, { status: 400 });
    }

    const emailId = event.data?.email_id || event.data?.id;
    console.log(`[resend-webhook] Request received: type=${event.type}, email_id=${emailId || 'unknown'}`);

    // 6. Handle Outbound Status Events: email.delivered, email.failed, email.bounced, email.complained
    const OUTBOUND_STATUS_MAP: Record<string, 'delivered' | 'failed' | 'bounced' | 'complained'> = {
      'email.delivered': 'delivered',
      'email.failed': 'failed',
      'email.bounced': 'bounced',
      'email.complained': 'complained',
    };

    if (OUTBOUND_STATUS_MAP[event.type]) {
      if (!emailId) {
        console.warn(`[resend-webhook] ${event.type} event missing email_id`);
        return NextResponse.json({ error: 'Missing email_id', reason: 'Outbound event missing email_id' }, { status: 400 });
      }

      const targetStatus = OUTBOUND_STATUS_MAP[event.type];
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      let existingSent: { id: string; status: string } | null = null;

      if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
        try {
          const supabase = supabaseServer();
          const { data, error } = await supabase
            .from('inbox_messages')
            .select('id, status')
            .eq('resend_id', emailId)
            .eq('direction', 'outbound')
            .maybeSingle();

          if (error) {
            console.error(`[resend-webhook] Database error querying sent message for ${emailId}: [${error.code || 'UNKNOWN'}] ${error.message}`);
            return NextResponse.json({ error: 'Database query error', reason: error.message }, { status: 500 });
          }
          if (data) existingSent = data;
        } catch (err) {
          console.error(`[resend-webhook] Exception querying sent message for ${emailId}:`, err);
          return NextResponse.json({ error: 'Database query exception', reason: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
        }
      } else {
        const store = await readMailStore();
        const local = store.messages.find(
          (m) => m.resendId === emailId && (m.direction === 'outbound' || m.folder === 'sent')
        );
        if (local) existingSent = { id: local.id, status: local.status || '' };
      }

      // If no matching outbound row exists, return 200 { received: true, ignored: 'unknown-message' }
      if (!existingSent) {
        console.log(`[resend-webhook] Decision: IGNORED (unknown-message) for ${event.type}, email_id: ${emailId}`);
        return NextResponse.json({ received: true, ignored: 'unknown-message', reason: 'No matching outbound message found' }, { status: 200 });
      }

      // Status updates must be idempotent.
      // A delivered event must never overwrite a final failed/bounced/complained status if it arrives late.
      const TERMINAL_FAILURES = ['failed', 'bounced', 'complained'];
      if (targetStatus === 'delivered' && TERMINAL_FAILURES.includes(existingSent.status)) {
        console.log(
          `[resend-webhook] Decision: IGNORED (already-terminal) for ${event.type} on ${emailId}, current_status: ${existingSent.status}`
        );
        return NextResponse.json({ received: true, ignored: 'already-terminal', reason: `Message already in terminal state "${existingSent.status}"` }, { status: 200 });
      }

      if (existingSent.status === targetStatus) {
        return NextResponse.json({ received: true, updated: false, status: targetStatus, reason: `Status already "${targetStatus}"` }, { status: 200 });
      }

      // Update ONLY status column. Never touch is_read, is_starred, folder, is_trashed, or thread_id.
      if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
        try {
          const supabase = supabaseServer();
          const { error: updateErr } = await supabase
            .from('inbox_messages')
            .update({ status: targetStatus })
            .eq('id', existingSent.id);

          if (updateErr) {
            console.error(
              `[resend-webhook] Database error updating status to ${targetStatus} for ${emailId}: [${updateErr.code || 'UNKNOWN'}] ${updateErr.message}`
            );
            return NextResponse.json({ error: 'Database update error', reason: updateErr.message }, { status: 500 });
          }
        } catch (err) {
          console.error(`[resend-webhook] Exception updating status for ${emailId}:`, err);
          return NextResponse.json({ error: 'Database update exception', reason: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
        }
      }

      try {
        const store = await readMailStore();
        const localMsg = store.messages.find((m) => m.id === existingSent?.id || m.resendId === emailId);
        if (localMsg) {
          localMsg.status = targetStatus;
          await writeMailStore(store);
        }
      } catch {
        // non-blocking local fallback
      }

      console.log(`[resend-webhook] Updated outbound status to "${targetStatus}" for email_id: ${emailId}`);
      return NextResponse.json({ received: true, updated: true, status: targetStatus }, { status: 200 });
    }

    // 7. Handle Inbound Event: email.received
    if (event.type === 'email.received') {
      if (!emailId) {
        console.warn('[resend-webhook] email.received event missing email_id');
        return NextResponse.json({ error: 'Missing email_id', reason: 'email.received event missing email_id' }, { status: 400 });
      }

      // 7a. Check tombstones first
      const tombstones = await getTombstoneResendIds();
      if (tombstones.has(emailId)) {
        console.log(`[resend-webhook] Decision: IGNORED (tombstoned) for email_id: ${emailId}, reason: ID is tombstoned`);
        return NextResponse.json({ received: true, ignored: 'tombstoned', reason: 'Email ID has been permanently deleted and tombstoned' }, { status: 200 });
      }

      // 7b. Check if already exists in inbox_messages (duplicate)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      let isDuplicate = false;

      if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
        try {
          const supabase = supabaseServer();
          const { data: existing, error: existErr } = await supabase
            .from('inbox_messages')
            .select('id')
            .eq('resend_id', emailId)
            .maybeSingle();

          if (existErr) {
            console.error(
              `[resend-webhook] Database error checking duplicate for ${emailId}: [${existErr.code || 'UNKNOWN'}] ${existErr.message}`
            );
            return NextResponse.json({ error: 'Database check failure', reason: existErr.message }, { status: 500 });
          }
          if (existing) isDuplicate = true;
        } catch (err) {
          console.error(`[resend-webhook] Exception checking duplicate for ${emailId}:`, err);
          return NextResponse.json({ error: 'Database check exception', reason: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
        }
      } else {
        const store = await readMailStore();
        if (store.messages.some((m) => m.resendId === emailId)) {
          isDuplicate = true;
        }
      }

      if (isDuplicate) {
        console.log(`[resend-webhook] Decision: IGNORED (duplicate) for email_id: ${emailId}, reason: resend_id already exists`);
        return NextResponse.json({ received: true, ignored: 'duplicate', reason: 'Email already exists in inbox' }, { status: 200 });
      }

      // 7c. Classify recipients if available in event payload before calling Resend API
      const payloadRecipients: string[] = [];
      const toField = event.data?.to;
      if (Array.isArray(toField)) payloadRecipients.push(...toField);
      else if (typeof toField === 'string' && toField) payloadRecipients.push(toField);

      const rawEventData = (event.data || {}) as Record<string, unknown>;
      if (Array.isArray(rawEventData.received_for)) payloadRecipients.push(...(rawEventData.received_for as string[]));
      else if (typeof rawEventData.received_for === 'string') payloadRecipients.push(rawEventData.received_for);
      if (Array.isArray(rawEventData.cc)) payloadRecipients.push(...(rawEventData.cc as string[]));
      else if (typeof rawEventData.cc === 'string') payloadRecipients.push(rawEventData.cc);
      if (Array.isArray(rawEventData.bcc)) payloadRecipients.push(...(rawEventData.bcc as string[]));
      else if (typeof rawEventData.bcc === 'string') payloadRecipients.push(rawEventData.bcc);

      let mailbox: 'official' | 'unofficial' | 'ignore' | null = null;
      if (payloadRecipients.length > 0) {
        mailbox = classifyMailbox(payloadRecipients);
        if (mailbox === 'ignore') {
          console.log(
            `[resend-webhook] Decision: IGNORED (foreign-domain) for email_id: ${emailId}, recipients: [${payloadRecipients.join(', ')}], reason: no recipients match @zahidp.com`
          );
          return NextResponse.json({ received: true, ignored: 'foreign-domain', reason: 'No recipient belongs to domain zahidp.com', recipients: payloadRecipients }, { status: 200 });
        }
      }

      if (!apiKey) {
        console.error('[resend-webhook] RESEND_API_KEY is not configured');
        return NextResponse.json({ error: 'RESEND_API_KEY missing', reason: 'RESEND_API_KEY is missing' }, { status: 500 });
      }

      // 7d. Fetch full email from Resend Receiving API
      const fullEmailRes = await resend.emails.receiving.get(emailId);

      if (fullEmailRes.error || !fullEmailRes.data) {
        const errMsg = fullEmailRes.error?.message || 'Failed to fetch email from Resend Receiving API';
        console.error(`[resend-webhook] Fetch result: FAILED for email_id ${emailId}: ${errMsg}`);
        return NextResponse.json({ error: errMsg, reason: 'Failed to retrieve email content from Resend Receiving API' }, { status: 500 });
      }

      const fullEmail = fullEmailRes.data;
      console.log(`[resend-webhook] Fetch result: SUCCESS for email_id: ${emailId}`);

      // If event payload did not include recipients, classify now from full email details
      if (!mailbox) {
        const fetchedRecipients: string[] = [];
        if (Array.isArray(fullEmail.to)) fetchedRecipients.push(...fullEmail.to);
        else if (typeof fullEmail.to === 'string' && fullEmail.to) fetchedRecipients.push(fullEmail.to);

        const fullRaw = fullEmail as unknown as Record<string, unknown>;
        if (Array.isArray(fullRaw.received_for)) fetchedRecipients.push(...(fullRaw.received_for as string[]));
        else if (typeof fullRaw.received_for === 'string') fetchedRecipients.push(fullRaw.received_for);
        if (Array.isArray(fullRaw.cc)) fetchedRecipients.push(...(fullRaw.cc as string[]));
        else if (typeof fullRaw.cc === 'string') fetchedRecipients.push(fullRaw.cc);
        if (Array.isArray(fullRaw.bcc)) fetchedRecipients.push(...(fullRaw.bcc as string[]));
        else if (typeof fullRaw.bcc === 'string') fetchedRecipients.push(fullRaw.bcc);

        mailbox = classifyMailbox(fetchedRecipients);
        if (mailbox === 'ignore') {
          console.log(
            `[resend-webhook] Decision: IGNORED (foreign-domain) for email_id: ${emailId}, recipients: [${fetchedRecipients.join(', ')}], reason: no recipients match @zahidp.com`
          );
          return NextResponse.json({ received: true, ignored: 'foreign-domain', reason: 'No recipient belongs to domain zahidp.com', recipients: fetchedRecipients }, { status: 200 });
        }
      }

      // 7e. Insert through existing upsertReceivedEmail path with mailbox classification
      const fullRaw = fullEmail as unknown as Record<string, unknown>;
      const savedMessage = await upsertReceivedEmail({
        id: fullEmail.id,
        from: fullEmail.from,
        to: fullEmail.to,
        cc: fullRaw.cc as string[] | string | undefined,
        bcc: fullRaw.bcc as string[] | string | undefined,
        received_for: fullRaw.received_for as string[] | string | undefined,
        subject: fullEmail.subject,
        html: fullEmail.html,
        text: fullEmail.text,
        created_at: fullEmail.created_at,
        headers: fullEmail.headers as Record<string, unknown> | undefined,
        attachments: fullEmail.attachments as EmailAttachment[] | undefined,
        mailbox: mailbox as 'official' | 'unofficial',
      });

      if (!savedMessage) {
        console.log(`[resend-webhook] Decision: IGNORED (tombstoned-during-ingest) for email_id: ${emailId}`);
        return NextResponse.json({ received: true, ignored: 'tombstoned', reason: 'Skipped ingestion of tombstoned email' }, { status: 200 });
      }

      console.log(`[resend-webhook] Ingestion result: SUCCESS for email_id: ${emailId}, messageId: ${savedMessage.id}, mailbox: ${mailbox}`);
      return NextResponse.json(
        {
          success: true,
          messageId: savedMessage.id,
          resendId: savedMessage.resendId,
          mailbox,
        },
        { status: 200 }
      );
    }

    // 8. Ignore any other event types with HTTP 200
    console.log(`[resend-webhook] Decision: IGNORED (unmonitored-event) for event type: ${event.type}`);
    return NextResponse.json(
      { received: true, ignored: event.type, reason: `Unmonitored event type: ${event.type}` },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal webhook processing error';
    console.error('[resend-webhook] Unhandled exception:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
