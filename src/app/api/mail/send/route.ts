import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { saveSentMessage } from '@/lib/mail/store';
import { getAppSecret } from '@/lib/env-vault';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const apiKey = (await getAppSecret('RESEND_API_KEY')) || process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'RESEND_API_KEY is not configured in Supabase or environment.' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { to, subject, text, html, replyTo, from, inReplyTo, references } = body;

    if (!to || !subject || (!text && !html)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, subject, and text/html body.' },
        { status: 400 }
      );
    }

    // Standardize recipient
    const recipientList = Array.isArray(to) ? to : [to];
    const cleanTo = recipientList.map((t) => String(t).trim()).filter(Boolean);

    if (cleanTo.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one valid recipient email is required.' },
        { status: 400 }
      );
    }

    // Sender default: check Supabase dynamic vault, then fallback to verified address
    const configuredSender =
      (await getAppSecret('RESEND_DEFAULT_SENDER')) ||
      (await getAppSecret('CONTACT_FROM_EMAIL')) ||
      process.env.RESEND_DEFAULT_SENDER ||
      process.env.CONTACT_FROM_EMAIL ||
      'Md Zahid Hasan <hello@zahidp.com>';

    const fromAddress = from?.trim() || configuredSender;

    const resend = new Resend(apiKey);
    const emailText = text || (html ? html.replace(/<[^>]+>/g, ' ') : '');

    // Construct custom headers for email threading (In-Reply-To & References)
    const emailHeaders: Record<string, string> = {};
    if (inReplyTo) {
      emailHeaders['In-Reply-To'] = inReplyTo.trim();
    }
    if (references) {
      emailHeaders['References'] = references.trim();
    } else if (inReplyTo) {
      emailHeaders['References'] = inReplyTo.trim();
    }

    const emailPayload: {
      from: string;
      to: string[];
      subject: string;
      text: string;
      html?: string;
      replyTo?: string;
      headers?: Record<string, string>;
    } = {
      from: fromAddress,
      to: cleanTo,
      subject: subject.trim(),
      text: emailText,
      ...(html ? { html } : {}),
      replyTo: replyTo || (fromAddress.match(/<(.+?)>/)?.[1] || 'hello@zahidp.com'),
      ...(Object.keys(emailHeaders).length > 0 ? { headers: emailHeaders } : {}),
    };

    // Call Resend API
    let resendResult;
    try {
      resendResult = await resend.emails.send(emailPayload);
    } catch (sendErr: unknown) {
      // If custom domain fails for any reason, attempt fallback to onboarding@resend.dev
      if (fromAddress !== 'onboarding@resend.dev') {
        try {
          emailPayload.from = 'FolioFrame <onboarding@resend.dev>';
          resendResult = await resend.emails.send(emailPayload);
        } catch {
          throw sendErr;
        }
      } else {
        throw sendErr;
      }
    }

    if (resendResult.error) {
      return NextResponse.json(
        { success: false, error: resendResult.error.message },
        { status: 400 }
      );
    }

    const resendId = resendResult.data?.id || `resend_${Date.now()}`;
    const messageId = `msg_sent_${Date.now()}`;

    // Extract sender display name and email
    const fromMatch = fromAddress.match(/^(.*?)\s*<(.+?)>$/);
    const senderName = fromMatch ? fromMatch[1].trim() : 'Md Zahid Hasan';
    const senderEmail = fromMatch ? fromMatch[2].trim() : fromAddress;

    // Save outbound sent message to Supabase inbox_messages with direction='outbound'
    const savedSent = await saveSentMessage({
      id: messageId,
      resendId,
      fromName: senderName,
      fromEmail: senderEmail,
      toEmail: cleanTo.join(', '),
      subject: subject.trim(),
      text: emailText,
      html: html || undefined,
      inReplyTo: inReplyTo || undefined,
      references: references || undefined,
    });

    return NextResponse.json({
      success: true,
      messageId: savedSent.id,
      resendId,
      direction: 'outbound',
      sentAt: savedSent.createdAt,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to send email via Resend';
    console.error('[API Send Mail Error]:', err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
