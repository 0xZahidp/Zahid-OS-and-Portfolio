import { supabaseServer } from '@/lib/supabase/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export interface OsNote {
  id: string;
  title: string;
  content: string;
  created_at?: string;
  updated_at?: string;
}

const LOCAL_NOTES_FILE = path.join(process.cwd(), 'src', 'data', 'os-notes.json');

const DEFAULT_MAIN_NOTE: OsNote = {
  id: 'main_scratchpad',
  title: 'Admin Notes',
  content: '',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Get all notes from Supabase os_notes table (with local offline fallback)
 */
export async function getOsNotes(): Promise<OsNote[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      const { data, error } = await supabase
        .from('os_notes')
        .select('*')
        .order('updated_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        if (data.length === 0) {
          return [DEFAULT_MAIN_NOTE];
        }
        return data as OsNote[];
      }
    } catch (err) {
      console.warn('[OsNotes] Supabase fetch error, checking local fallback:', err);
    }
  }

  // Fallback to local JSON file
  try {
    const raw = await fs.readFile(LOCAL_NOTES_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as OsNote[];
    }
  } catch {
    // Return default note if no file exists
  }

  return [DEFAULT_MAIN_NOTE];
}

/**
 * Get a specific note by ID
 */
export async function getOsNoteById(id: string): Promise<OsNote | null> {
  const notes = await getOsNotes();
  return notes.find((n) => n.id === id) || null;
}

/**
 * Save or update a note in Supabase (with offline file backup)
 */
export async function saveOsNote(input: {
  id?: string;
  title?: string;
  content?: string;
}): Promise<OsNote> {
  const noteId = (input.id && input.id.trim()) || 'main_scratchpad';
  const nowIso = new Date().toISOString();

  const noteToSave: OsNote = {
    id: noteId,
    title: input.title !== undefined ? input.title.trim() : 'Admin Notes',
    content: input.content !== undefined ? input.content : '',
    updated_at: nowIso,
  };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      const { data, error } = await supabase
        .from('os_notes')
        .upsert(
          {
            id: noteToSave.id,
            title: noteToSave.title,
            content: noteToSave.content,
            updated_at: noteToSave.updated_at,
          },
          { onConflict: 'id' }
        )
        .select()
        .single();

      if (!error && data) {
        noteToSave.created_at = data.created_at;
        noteToSave.updated_at = data.updated_at;
      } else if (error) {
        console.warn('[OsNotes] Supabase upsert failed:', error.message);
      }
    } catch (err) {
      console.warn('[OsNotes] Supabase save error:', err);
    }
  }

  // Local file backup (skip on Vercel read-only runtime)
  if (!process.env.VERCEL) {
    try {
      let existingNotes: OsNote[] = [];
      try {
        const raw = await fs.readFile(LOCAL_NOTES_FILE, 'utf-8');
        existingNotes = JSON.parse(raw);
        if (!Array.isArray(existingNotes)) existingNotes = [];
      } catch {
        existingNotes = [];
      }

      const idx = existingNotes.findIndex((n) => n.id === noteToSave.id);
      if (idx >= 0) {
        existingNotes[idx] = { ...existingNotes[idx], ...noteToSave };
      } else {
        existingNotes.unshift(noteToSave);
      }

      await fs.writeFile(LOCAL_NOTES_FILE, JSON.stringify(existingNotes, null, 2), 'utf-8');
    } catch (fsErr) {
      console.warn('[OsNotes] Local file write skipped:', fsErr);
    }
  }

  return noteToSave;
}

/**
 * Delete a note by ID
 */
export async function deleteOsNote(id: string): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      await supabase.from('os_notes').delete().eq('id', id);
    } catch (err) {
      console.warn('[OsNotes] Supabase delete error:', err);
    }
  }

  if (!process.env.VERCEL) {
    try {
      const raw = await fs.readFile(LOCAL_NOTES_FILE, 'utf-8');
      const existingNotes = JSON.parse(raw);
      if (Array.isArray(existingNotes)) {
        const filtered = existingNotes.filter((n: OsNote) => n.id !== id);
        await fs.writeFile(LOCAL_NOTES_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
      }
    } catch {
      // Ignore
    }
  }

  return true;
}
