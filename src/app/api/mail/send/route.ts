import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { addMailMessage } from '@/lib/mail/store';
import { MailMessage } from '@/types/mail';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'RESEND_API_KEY is not configured in environment.' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { to, subject, text, html, replyTo, from } = body;

    if (!to || !subject || (!text && !html)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, subject, and text/html body.' },
        { status: 400 }
      );
    }

    // Standardize recipient
    const recipientList = Array.isArray(to) ? to : [to];
    const cleanTo = recipientList.map((t) => t.trim()).filter(Boolean);

    if (cleanTo.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one valid recipient email is required.' },
        { status: 400 }
      );
    }

    // Sender default: zahidp.com is verified on Resend!
    // Format: 'Md Zahid Hasan <hello@zahidp.com>' or 'Md Zahid Hasan <onboarding@resend.dev>'
    const fromAddress = from?.trim() || 'Md Zahid Hasan <hello@zahidp.com>';

    const resend = new Resend(apiKey);

    const emailText = text || (html ? html.replace(/<[^>]+>/g, ' ') : '');

    const emailPayload: {
      from: string;
      to: string[];
      subject: string;
      text: string;
      html?: string;
      replyTo?: string;
    } = {
      from: fromAddress,
      to: cleanTo,
      subject: subject.trim(),
      text: emailText,
      ...(html ? { html } : {}),
      ...(replyTo ? { replyTo } : {}),
    };

    // Call Resend
    let resendResult;
    try {
      resendResult = await resend.emails.send(emailPayload);
    } catch (sendErr: unknown) {
      // If custom domain fails for any reason (e.g. testing tier restriction), attempt fallback to onboarding@resend.dev
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

    // Create Sent message in local store
    const sentMessage: MailMessage = {
      id: messageId,
      folder: 'sent',
      from: {
        name: senderName,
        email: senderEmail,
      },
      to: cleanTo.map((e) => ({ name: e.split('@')[0], email: e })),
      subject: subject.trim(),
      body: text || html || '',
      snippet: (text || html || '').substring(0, 120) + '...',
      createdAt: new Date().toISOString(),
      isRead: true,
      isStarred: false,
      resendId,
      tags: ['Sent', 'Resend'],
    };

    await addMailMessage(sentMessage);

    return NextResponse.json({
      success: true,
      messageId,
      resendId,
      sentAt: sentMessage.createdAt,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to send email via Resend';
    console.error('[API Send Mail Error]:', err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
