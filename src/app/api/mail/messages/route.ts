import { NextRequest, NextResponse } from 'next/server';
import {
  listMailMessages,
  addMailMessage,
  updateMailMessage,
  deleteMailMessage,
  emptyTrash,
  getUnreadCount,
} from '@/lib/mail/store';
import { MailMessage } from '@/types/mail';

export const dynamic = 'force-dynamic';

// GET /api/mail/messages?folder=inbox&search=keyword
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const folder = searchParams.get('folder') || 'inbox';
    const search = searchParams.get('search') || undefined;

    const messages = await listMailMessages({ folder, search });
    const unreadCount = await getUnreadCount();

    return NextResponse.json({
      success: true,
      folder,
      count: messages.length,
      unreadCount,
      messages,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve messages';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST /api/mail/messages (Simulate inbound or incoming contact inquiry)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message, tags } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and message are required.' },
        { status: 400 }
      );
    }

    const newMessage: MailMessage = {
      id: `msg_inbox_${Date.now()}`,
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
      subject: (subject || 'New Portfolio Inquiry').trim(),
      body: message.trim(),
      snippet: message.trim().substring(0, 120) + (message.length > 120 ? '...' : ''),
      createdAt: new Date().toISOString(),
      isRead: false,
      isStarred: false,
      tags: tags || ['Inquiry', 'Website'],
    };

    await addMailMessage(newMessage);

    return NextResponse.json({
      success: true,
      message: newMessage,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to store message';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// PATCH /api/mail/messages (Update isRead, isStarred, folder)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, isRead, isStarred, folder } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Message ID is required.' }, { status: 400 });
    }

    const updates: Partial<MailMessage> = {};
    if (typeof isRead === 'boolean') updates.isRead = isRead;
    if (typeof isStarred === 'boolean') updates.isStarred = isStarred;
    if (folder) updates.folder = folder;

    const updated = await updateMailMessage(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Message not found.' }, { status: 404 });
    }

    const unreadCount = await getUnreadCount();

    return NextResponse.json({
      success: true,
      message: updated,
      unreadCount,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update message';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// DELETE /api/mail/messages (Trash or empty trash)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const emptyTrashAction = searchParams.get('emptyTrash') === 'true';
    const permanent = searchParams.get('permanent') === 'true';

    if (emptyTrashAction) {
      const removed = await emptyTrash();
      return NextResponse.json({ success: true, removedCount: removed });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Message ID is required.' }, { status: 400 });
    }

    const success = await deleteMailMessage(id, permanent);
    const unreadCount = await getUnreadCount();

    return NextResponse.json({
      success,
      unreadCount,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete message';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
