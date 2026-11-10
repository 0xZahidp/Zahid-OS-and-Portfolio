import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-auth';
import {
  readMailStore,
  getThreadWithBodies,
  groupMessagesIntoThreads,
  calculateUnreadCount,
  calculateMailFolderCounts,
  getUnreadCount,
  getMailFolderCounts,
  addMailMessage,
  updateMailMessage,
  updateThreadReadState,
  updateThreadFolder,
  updateThreadStar,
  deleteMailMessage,
  deleteThread,
  emptyTrash,
  syncReceivedEmailsFromResend,
} from '@/lib/mail/store';
import { MailMessage } from '@/types/mail';

export const dynamic = 'force-dynamic';

// GET /api/mail/messages?folder=inbox&search=keyword&alias=test@zahidp.com&category=official&forceSync=false&page=1&limit=25&threadId=...
export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const folder = searchParams.get('folder') || 'inbox';
    const search = searchParams.get('search') || undefined;
    const alias = searchParams.get('alias') || undefined;
    const forceSync = searchParams.get('forceSync') === 'true';
    const threadId = searchParams.get('threadId');

    // 1. Manual sync fallback only: NEVER poll or sync automatically on page load
    if (forceSync) {
      try {
        await syncReceivedEmailsFromResend(true);
      } catch (syncErr) {
        console.warn('[Messages Route] Manual Resend sync error:', syncErr);
      }
    }

    // 2. Single thread detail view: fetch full thread messages with complete bodies
    if (threadId) {
      const thread = await getThreadWithBodies(threadId);
      if (!thread) {
        return NextResponse.json({ success: false, error: 'Thread not found' }, { status: 404 });
      }
      return NextResponse.json(
        { success: true, thread },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          },
        }
      );
    }

    // 3. Paginated list query: read from Supabase (25 per page, ordered by received_at desc),
    // without fetching heavy bodies in the list query.
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '25', 10));
    const offset = (page - 1) * limit;

    const store = await readMailStore({ includeBody: false });
    const allMessages = store.messages || [];

    const unreadCount = calculateUnreadCount(allMessages);
    const counts = calculateMailFolderCounts(allMessages);

    const allFilteredThreads = groupMessagesIntoThreads(allMessages, { folder, search, alias });
    const totalCount = allFilteredThreads.length;
    const totalPages = Math.ceil(totalCount / limit) || 1;
    const paginatedThreads = allFilteredThreads.slice(offset, offset + limit);

    return NextResponse.json(
      {
        success: true,
        folder,
        count: paginatedThreads.length,
        totalCount,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
        unreadCount,
        counts,
        threads: paginatedThreads,
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
    const { id, threadId, isRead, isStarred, folder, isArchived, isTrashed } = body;

    const targetThreadId = threadId || (!id?.startsWith('msg_') && id ? id : undefined);

    if (!id && !threadId) {
      return NextResponse.json(
        { success: false, error: 'Message ID or Thread ID is required.' },
        { status: 400 }
      );
    }

    if (targetThreadId) {
      if (typeof isRead === 'boolean') {
        await updateThreadReadState(targetThreadId, isRead);
      }
      if (typeof isStarred === 'boolean') {
        await updateThreadStar(targetThreadId, isStarred);
      }
      if (folder) {
        await updateThreadFolder(targetThreadId, folder as 'inbox' | 'archive' | 'trash' | 'sent');
      } else if (isArchived) {
        await updateThreadFolder(targetThreadId, 'archive');
      } else if (isTrashed) {
        await updateThreadFolder(targetThreadId, 'trash');
      }

      const unreadCount = await getUnreadCount();
      const counts = await getMailFolderCounts();

      return NextResponse.json({
        success: true,
        threadId: targetThreadId,
        unreadCount,
        counts,
      });
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
    const threadId = searchParams.get('threadId');
    const emptyTrashAction = searchParams.get('emptyTrash') === 'true';
    const permanent = searchParams.get('permanent') === 'true';

    if (emptyTrashAction) {
      const removed = await emptyTrash();
      const counts = await getMailFolderCounts();
      return NextResponse.json({ success: true, removedCount: removed, counts });
    }

    if (threadId) {
      const success = await deleteThread(threadId, permanent);
      const unreadCount = await getUnreadCount();
      const counts = await getMailFolderCounts();
      return NextResponse.json({ success, unreadCount, counts });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Message ID or Thread ID is required.' },
        { status: 400 }
      );
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
