import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-auth';
import {
  readMailStore,
  filterMailMessages,
  calculateUnreadCount,
  calculateMailFolderCounts,
  getUnreadCount,
  getMailFolderCounts,
  addMailMessage,
  updateMailMessage,
  deleteMailMessage,
  emptyTrash,
  syncReceivedEmailsFromResend,
} from '@/lib/mail/store';
import { MailMessage } from '@/types/mail';

export const dynamic = 'force-dynamic';

// GET /api/mail/messages?folder=inbox&search=keyword&alias=test@zahidp.com&category=official&forceSync=false
export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const folder = searchParams.get('folder') || 'inbox';
    const search = searchParams.get('search') || undefined;
    const alias = searchParams.get('alias') || undefined;
    const category = (searchParams.get('category') || (folder === 'inbox' ? 'official' : 'all')) as
      | 'official'
      | 'temp'
      | 'all';
    const forceSync = searchParams.get('forceSync') === 'true';
    const autoSync = searchParams.get('sync') !== 'false';

    // 1. Sync emails from Resend Receiving
    // If explicitly forceSync=true, wait for it.
    // Otherwise, trigger in background without blocking so the inbox loads instantly (<30ms)!
    if (autoSync) {
      if (forceSync) {
        try {
          await syncReceivedEmailsFromResend(true);
        } catch (syncErr) {
          console.warn('[Messages Route] Resend auto-sync warning:', syncErr);
        }
      } else {
        syncReceivedEmailsFromResend(false).catch((syncErr) => {
          console.warn('[Messages Route] Background Resend sync note:', syncErr);
        });
      }
    }

    // 2. Read mail store ONCE and calculate all views in memory (no repeated DB round-trips)
    const store = await readMailStore();
    const allMessages = store.messages || [];

    const messages = filterMailMessages(allMessages, { folder, search, alias, category });
    const unreadCount = calculateUnreadCount(allMessages);
    const counts = calculateMailFolderCounts(allMessages, category);

    return NextResponse.json(
      {
        success: true,
        folder,
        category,
        count: messages.length,
        unreadCount,
        counts,
        messages,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Database service unavailable' },
      {
        status: 503,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
      }
    );
  }
}

// POST /api/mail/messages (Simulate inbound or incoming contact inquiry)
export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { name, email, subject, message, tags, recipient } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and message are required.' },
        { status: 400 }
      );
    }

    const targetRecipient = (recipient || 'hello@zahidp.com').trim();

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
          email: targetRecipient,
        },
      ],
      replyTo: email.trim(),
      subject: (subject || 'New Portfolio Inquiry').trim(),
      body: message.trim(),
      snippet: message.trim().substring(0, 120) + (message.length > 120 ? '...' : ''),
      createdAt: new Date().toISOString(),
      isRead: false,
      isStarred: false,
      isArchived: false,
      isTrashed: false,
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

// PATCH /api/mail/messages (Update isRead, isStarred, folder, isArchived, isTrashed)
export async function PATCH(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { id, isRead, isStarred, folder, isArchived, isTrashed } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Message ID is required.' }, { status: 400 });
    }

    const updates: Partial<MailMessage> = {};
    if (typeof isRead === 'boolean') updates.isRead = isRead;
    if (typeof isStarred === 'boolean') updates.isStarred = isStarred;
    if (typeof isArchived === 'boolean') updates.isArchived = isArchived;
    if (typeof isTrashed === 'boolean') updates.isTrashed = isTrashed;
    if (folder) updates.folder = folder;

    const updated = await updateMailMessage(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Message not found.' }, { status: 404 });
    }

    const unreadCount = await getUnreadCount();
    const counts = await getMailFolderCounts();

    return NextResponse.json({
      success: true,
      message: updated,
      unreadCount,
      counts,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update message';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// DELETE /api/mail/messages (Trash or empty trash or permanent delete)
export async function DELETE(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const emptyTrashAction = searchParams.get('emptyTrash') === 'true';
    const permanent = searchParams.get('permanent') === 'true';

    if (emptyTrashAction) {
      const removed = await emptyTrash();
      const counts = await getMailFolderCounts();
      return NextResponse.json({ success: true, removedCount: removed, counts });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Message ID is required.' }, { status: 400 });
    }

    const success = await deleteMailMessage(id, permanent);
    const unreadCount = await getUnreadCount();
    const counts = await getMailFolderCounts();

    return NextResponse.json({
      success,
      unreadCount,
      counts,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete message';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
