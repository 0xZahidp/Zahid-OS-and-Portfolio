import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { addMailMessage } from '@/lib/mail/store';
import { MailMessage } from '@/types/mail';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: 'Please provide name, email, and message.' },
        { status: 400 }
      );
    }

    // 1. Store message in Admin Inbox
    const messageId = `msg_contact_${Date.now()}`;
    const cleanSubject = (subject || `Portfolio Message from ${name}`).trim();

    const inboxItem: MailMessage = {
      id: messageId,
      folder: 'inbox',
      from: {
        name: name.trim(),
        email: email.trim(),
      },
      to: [
        {
          name: 'Md Zahid Hasan',
          email: 'hello@zahidp.com',
        },
      ],
      replyTo: email.trim(),
      subject: cleanSubject,
      body: message.trim(),
      snippet: message.trim().substring(0, 120) + (message.length > 120 ? '...' : ''),
      createdAt: new Date().toISOString(),
      isRead: false,
      isStarred: false,
      tags: ['Portfolio', 'Direct Contact'],
    };

    await addMailMessage(inboxItem);

    // 2. If Resend configured, attempt to send owner alert
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      try {
        const resend = new Resend(apiKey);
        await resend.emails.send({
          from: 'FolioFrame Inquiries <hello@zahidp.com>',
          to: ['mdzahidhasanpatwary@gmail.com'],
          replyTo: email.trim(),
          subject: `[New Inquiry] ${cleanSubject}`,
          text: `You received a new portfolio inquiry from ${name} (${email}):\n\n${message}`,
        });
      } catch (mailErr) {
        console.warn('[Contact Alert] Optional Resend notification failed (stored in inbox anyway):', mailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your message has been delivered to Zahid.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to send message';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

