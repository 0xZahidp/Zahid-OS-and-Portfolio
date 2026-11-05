import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getAppSecret } from '@/lib/env-vault';
import { upsertReceivedEmail } from '@/lib/mail/store';
import { EmailAttachment } from '@/types/mail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Read raw body text for signature verification
    const rawBody = await req.text();

    if (!rawBody) {
      return NextResponse.json({ error: 'Empty request body' }, { status: 400 });
    }

    // 2. Fetch API key and Webhook Secret
    const apiKey = (await getAppSecret('RESEND_API_KEY')) || process.env.RESEND_API_KEY;
    const webhookSecret =
      (await getAppSecret('RESEND_WEBHOOK_SECRET')) || process.env.RESEND_WEBHOOK_SECRET;

    if (!apiKey) {
      console.error('[Resend Webhook] RESEND_API_KEY is not configured');
      return NextResponse.json({ error: 'RESEND_API_KEY missing' }, { status: 500 });
    }

    const resend = new Resend(apiKey);

    // 3. Verify webhook signature (fail closed: requires RESEND_WEBHOOK_SECRET)
    if (!webhookSecret) {
      console.error('[Resend Webhook] RESEND_WEBHOOK_SECRET is not configured. Rejecting request.');
      return NextResponse.json({ error: 'RESEND_WEBHOOK_SECRET missing' }, { status: 500 });
    }

    const svixId = req.headers.get('svix-id') || req.headers.get('webhook-id') || '';
    const svixTimestamp = req.headers.get('svix-timestamp') || req.headers.get('webhook-timestamp') || '';
    const svixSignature = req.headers.get('svix-signature') || req.headers.get('webhook-signature') || '';

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error('[Resend Webhook] Missing svix signature headers');
      return NextResponse.json(
        { error: 'Missing svix signature headers (svix-id, svix-timestamp, svix-signature)' },
        { status: 400 }
      );
    }

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
    } catch (verifyErr: unknown) {
      const msg = verifyErr instanceof Error ? verifyErr.message : 'Signature verification failed';
      console.error('[Resend Webhook] Invalid signature:', msg);
      return NextResponse.json({ error: 'Invalid webhook signature', details: msg }, { status: 400 });
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
