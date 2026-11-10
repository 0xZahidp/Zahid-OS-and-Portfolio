import { NextRequest, NextResponse } from 'next/server';
import { getOsNotes, getOsNoteById, saveOsNote, deleteOsNote } from '@/lib/os/notes';
import { requireAdmin } from '@/lib/auth/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const note = await getOsNoteById(id);
      return NextResponse.json(
        { success: true, note },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' } }
      );
    }

    const notes = await getOsNotes();
    const mainNote = notes.find((n) => n.id === 'main_scratchpad') || notes[0];

    return NextResponse.json(
      { success: true, notes, note: mainNote },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch notes';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => ({}));
    const { id, title, content } = body;

    const saved = await saveOsNote({ id, title, content });

    return NextResponse.json(
      {
        success: true,
        note: saved,
        message: 'Note saved successfully to Supabase cloud.',
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save note';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Note ID is required' }, { status: 400 });
    }

    if (id === 'main_scratchpad') {
      // Rather than deleting the main scratchpad, clear its content
      const cleared = await saveOsNote({ id: 'main_scratchpad', title: 'Admin Notes', content: '' });
      return NextResponse.json({ success: true, note: cleared, message: 'Main scratchpad cleared.' });
    }

    await deleteOsNote(id);
    return NextResponse.json({ success: true, message: 'Note deleted successfully.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete note';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

