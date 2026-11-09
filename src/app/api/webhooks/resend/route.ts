import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getAppSecret } from '@/lib/env-vault';
import { upsertReceivedEmail, getTombstoneResendIds } from '@/lib/mail/store';
import { EmailAttachment } from '@/types/mail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

let hasLoggedWebhookSecretMissing = false;

export async function POST(req: NextRequest) {
  try {
    // 1. Read raw body text for signature verification
    const rawBody = await req.text();

    if (!rawBody) {
      return NextResponse.json({ error: 'Empty request body' }, { status: 400 });
    }

    // 2. Unsigned requests must return 401
    const svixId = req.headers.get('svix-id') || req.headers.get('webhook-id') || '';
    const svixTimestamp = req.headers.get('svix-timestamp') || req.headers.get('webhook-timestamp') || '';
    const svixSignature = req.headers.get('svix-signature') || req.headers.get('webhook-signature') || '';

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing signature headers' },
        { status: 401 }
      );
    }

    // 3. Fetch Webhook Secret (if missing when signed request arrives, log warning once and return 503)
    const webhookSecret =
      (await getAppSecret('RESEND_WEBHOOK_SECRET')) || process.env.RESEND_WEBHOOK_SECRET;

    if (!webhookSecret) {
      if (!hasLoggedWebhookSecretMissing) {
        hasLoggedWebhookSecretMissing = true;
        console.warn(
          '[Resend Webhook] RESEND_WEBHOOK_SECRET is not configured in environment or database. Webhook endpoint unavailable.'
        );
      }
      return NextResponse.json({ error: 'Webhook service unavailable' }, { status: 503 });
    }

    // 4. Badly signed requests must return 401
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
    } catch {
      return NextResponse.json({ error: 'Unauthorized: Invalid webhook signature' }, { status: 401 });
    }

    if (!apiKey) {
      console.error('[Resend Webhook] RESEND_API_KEY is not configured');
      return NextResponse.json({ error: 'RESEND_API_KEY missing' }, { status: 500 });
    }

    // 4. Parse JSON payload
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
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
    }

    // 5. Handle only `email.received` event; return 200 quickly for other events
    if (event.type !== 'email.received') {
      return NextResponse.json(
        { received: true, ignored: event.type, message: 'Event type not monitored' },
        { status: 200 }
      );
    }

    // 6. Extract email id from event data
    const emailId = event.data?.email_id || event.data?.id;

    if (!emailId) {
      console.error('[Resend Webhook] email.received event missing email_id in data:', event);
      return NextResponse.json({ error: 'Missing email_id in webhook event data' }, { status: 400 });
    }

    // 6b. Check tombstones before calling Resend Receiving API
    const tombstones = await getTombstoneResendIds();
    if (tombstones.has(emailId)) {
      console.log(`[Resend Webhook] Ignoring permanently deleted email (Resend ID: ${emailId})`);
      return NextResponse.json(
        { received: true, ignored: 'tombstoned', message: 'Email was previously permanently deleted' },
        { status: 200 }
      );
    }

    // 7. Fetch full email (html, text, headers, attachments) using Resend Receiving API
    const fullEmailRes = await resend.emails.receiving.get(emailId);

    if (fullEmailRes.error || !fullEmailRes.data) {
      const errMsg = fullEmailRes.error?.message || 'Failed to fetch email from Resend Receiving API';
      console.error(`[Resend Webhook] Error fetching receiving email ${emailId}:`, errMsg);
      return NextResponse.json({ error: errMsg }, { status: 500 });
    }

    const fullEmail = fullEmailRes.data;

    // 8. Upsert into Supabase (and local store) keyed on Resend email id
    const savedMessage = await upsertReceivedEmail({
      id: fullEmail.id,
      from: fullEmail.from,
      to: fullEmail.to,
      subject: fullEmail.subject,
      html: fullEmail.html,
      text: fullEmail.text,
      created_at: fullEmail.created_at,
      headers: fullEmail.headers as Record<string, unknown> | undefined,
      attachments: fullEmail.attachments as EmailAttachment[] | undefined,
    });

    if (!savedMessage) {
      return NextResponse.json(
        { received: true, ignored: 'tombstoned', message: 'Email was previously permanently deleted' },
        { status: 200 }
      );
    }

    // 8b. Also check if recipient matches an active Zahid OS Temp Mail inbox with anti-flooding limits
    try {
      const { ingestInboundEmail } = await import('@/lib/os/temp-mail');
      await ingestInboundEmail({
        resendId: fullEmail.id,
        from: fullEmail.from,
        to: fullEmail.to,
        subject: fullEmail.subject,
        text: fullEmail.text,
        html: fullEmail.html,
      });
    } catch (tempMailErr) {
      console.warn('[Resend Webhook] Temp mail ingestion notice:', tempMailErr);
    }

    console.log(`[Resend Webhook] Successfully ingested incoming email "${savedMessage.subject}" from ${savedMessage.from.email} (Resend ID: ${savedMessage.resendId})`);

    return NextResponse.json(
      {
        success: true,
        messageId: savedMessage.id,
        resendId: savedMessage.resendId,
        subject: savedMessage.subject,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal webhook processing error';
    console.error('[Resend Webhook] Unhandled exception:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
