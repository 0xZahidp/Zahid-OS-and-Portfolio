'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Cloud,
  Loader2,
  Check,
  Search,
  ChevronLeft,
  CheckSquare,
  List,
  ListOrdered,
  Heading,
  Bold,
  Quote,
  Code,
  Calendar,
  SquarePen,
  Copy,
  Columns,
  Maximize2,
} from 'lucide-react';
import { confirmModal } from '@/components/ui/ConfirmDialog';

export interface IosNoteItem {
  id: string;
  title: string;
  content: string;
  created_at?: string;
  updated_at?: string;
}

interface IosNotesAppProps {
  isAdmin?: boolean;
  getAdminHeaders?: () => HeadersInit;
  initialNoteId?: string;
  onNotesCountChange?: (count: number) => void;
  className?: string;
}

const DEFAULT_NOTE: IosNoteItem = {
  id: 'main_scratchpad',
  title: 'Quick Scratchpad',
  content: `# Welcome to Notes
- [ ] Check out new iOS-style formatting
- [ ] Try creating a numbered list
• Radio / bullet point ideas
> Jot down meeting memos, code snippets, or todo lists.

1. First task
2. Second task`,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const IosNotesApp: React.FC<IosNotesAppProps> = ({
  isAdmin = true,
  getAdminHeaders,
  initialNoteId,
  onNotesCountChange,
  className = '',
}) => {
  // Navigation & View state: 'list' (first shown as requested) or 'editor'
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
  const [isSplitView, setIsSplitView] = useState<boolean>(false);
  const [editorSubTab, setEditorSubTab] = useState<'type' | 'interactive'>('type');

  // Notes data
  const [notes, setNotes] = useState<IosNoteItem[]>([DEFAULT_NOTE]);
  const [activeNoteId, setActiveNoteId] = useState<string>(initialNoteId || 'main_scratchpad');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active note in-flight editing state
  const [activeTitle, setActiveTitle] = useState<string>(DEFAULT_NOTE.title);
  const [activeContent, setActiveContent] = useState<string>(DEFAULT_NOTE.content);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(true);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const onCountChangeRef = useRef(onNotesCountChange);
  useEffect(() => {
    onCountChangeRef.current = onNotesCountChange;
  }, [onNotesCountChange]);

  // 1. Initial Load from Supabase (or localStorage fallback)
  useEffect(() => {
    let isMounted = true;

    async function loadNotes() {
      if (isAdmin && getAdminHeaders) {
        try {
          const res = await fetch('/api/os/notes', {
            headers: getAdminHeaders(),
          });
          const json = await res.json();
          if (json.success && Array.isArray(json.notes) && json.notes.length > 0) {
            if (isMounted) {
              setNotes(json.notes);
              onCountChangeRef.current?.(json.notes.length);
              const target =
                json.notes.find((n: IosNoteItem) => n.id === initialNoteId) || json.notes[0];
              setActiveNoteId(target.id);
              setActiveTitle(target.title || 'Untitled Note');
              setActiveContent(target.content || '');
              setIsCloudSynced(true);
            }
            return;
          }
        } catch (err) {
          console.warn('[IosNotesApp] Failed to load remote notes:', err);
        }
      }

      // Offline / LocalStorage fallback
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('zahid_os_notes_list');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              if (isMounted) {
                setNotes(parsed);
                onCountChangeRef.current?.(parsed.length);
                const target = parsed.find((n: IosNoteItem) => n.id === initialNoteId) || parsed[0];
                setActiveNoteId(target.id);
                setActiveTitle(target.title || 'Untitled Note');
                setActiveContent(target.content || '');
              }
              return;
            }
          }
        } catch {}
      }
    }

    loadNotes();
    return () => {
      isMounted = false;
    };
  }, [isAdmin, getAdminHeaders, initialNoteId]);

  // Save to Cloud & Local Storage
  const persistNote = useCallback(
    async (noteId: string, title: string, content: string) => {
      setSaveState('saving');
      const nowIso = new Date().toISOString();

      // Mirror to localStorage
      if (typeof window !== 'undefined') {
        try {
          setNotes((prev) => {
            const updated = prev.map((n) =>
              n.id === noteId ? { ...n, title, content, updated_at: nowIso } : n
            );
            localStorage.setItem('zahid_os_notes_list', JSON.stringify(updated));
            return updated;
          });
          if (noteId === 'main_scratchpad') {
            localStorage.setItem('zahid_os_scratchpad', content);
          }
        } catch {}
      }

      // If admin, persist to Supabase
      if (isAdmin && getAdminHeaders) {
        try {
          const res = await fetch('/api/os/notes', {
            method: 'POST',
            headers: {
              ...getAdminHeaders(),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: noteId,
              title,
              content,
            }),
          });
          const json = await res.json();
          if (json.success) {
            setSaveState('saved');
            setIsCloudSynced(true);
            setLastSavedTime(
              new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            );
            setTimeout(() => setSaveState('idle'), 2000);
            return;
          }
        } catch {
          setSaveState('error');
          return;
        }
      }

      // Non-admin local save
      setSaveState('saved');
      setIsCloudSynced(false);
      setLastSavedTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
      setTimeout(() => setSaveState('idle'), 2000);
    },
    [isAdmin, getAdminHeaders]
  );

  // Debounced auto-save handler for content typing
  const handleContentChange = (newContent: string) => {
    setActiveContent(newContent);
    setIsCloudSynced(false);

    // Also auto-derive title from first line if title is generic
    let derivedTitle = activeTitle;
    if (activeTitle === 'Untitled Note' || activeTitle === 'New Note' || !activeTitle.trim()) {
      const firstLine = newContent.trim().split('\n')[0]?.replace(/^[#\-*•\s\d.]+(\[[ xX]\])?\s*/, '').trim();
      if (firstLine && firstLine.length > 0) {
        derivedTitle = firstLine.slice(0, 40);
        setActiveTitle(derivedTitle);
      }
    }

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      persistNote(activeNoteId, derivedTitle, newContent);
    }, 1500);
  };

  // Immediate title change
  const handleTitleChange = (newTitle: string) => {
    setActiveTitle(newTitle);
    setIsCloudSynced(false);

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      persistNote(activeNoteId, newTitle, activeContent);
    }, 1000);
  };

  // Select note from list
  const handleOpenNote = (note: IosNoteItem) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      persistNote(activeNoteId, activeTitle, activeContent);
    }
    setActiveNoteId(note.id);
    setActiveTitle(note.title || 'Untitled Note');
    setActiveContent(note.content || '');
    setIsCloudSynced(true);
    setSaveState('idle');
    setViewMode('editor');
  };

  // Create new note
  const handleCreateNewNote = async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      persistNote(activeNoteId, activeTitle, activeContent);
    }
    const newId = `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newNote: IosNoteItem = {
      id: newId,
      title: 'New Note',
      content: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = [newNote, ...notes];
    setNotes(updated);
    onNotesCountChange?.(updated.length);

    setActiveNoteId(newId);
    setActiveTitle('New Note');
    setActiveContent('');
    setIsCloudSynced(false);
    setViewMode('editor');

    await persistNote(newId, 'New Note', '');
  };

  // Delete active or specified note
  const handleDeleteNote = async (idToDelete: string) => {
    const ok = await confirmModal({
      title: 'Delete Note',
      message: 'Are you sure you want to permanently delete this note?',
      confirmText: 'Delete Note',
      type: 'danger',
    });
    if (!ok) return;

    if (isAdmin && getAdminHeaders) {
      try {
        await fetch(`/api/os/notes?id=${encodeURIComponent(idToDelete)}`, {
          method: 'DELETE',
          headers: getAdminHeaders(),
        });
      } catch (err) {
        console.warn('Failed to delete note remotely:', err);
      }
    }

    const remaining = notes.filter((n) => n.id !== idToDelete);
    const finalNotes =
      remaining.length > 0
        ? remaining
        : [
            {
              id: 'main_scratchpad',
              title: 'Quick Scratchpad',
              content: '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ];

    setNotes(finalNotes);
    onNotesCountChange?.(finalNotes.length);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('zahid_os_notes_list', JSON.stringify(finalNotes));
      } catch {}
    }

    const next = finalNotes[0];
    setActiveNoteId(next.id);
    setActiveTitle(next.title);
    setActiveContent(next.content || '');

    // Return to list view if deleted active note
    if (viewMode === 'editor' && !isSplitView) {
      setViewMode('list');
    }
  };

  // Format Helper: Insert text at current cursor or wrap selection
  const insertFormatting = (prefix: string, suffix = '', defaultText = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;
    const selected = currentText.substring(start, end) || defaultText;

    // Check if inserting a line-level format (checklist, bullet, number, heading)
    const isLineLevel = prefix.startsWith('- [ ] ') || prefix.startsWith('• ') || prefix.startsWith('1. ') || prefix.startsWith('# ') || prefix.startsWith('> ');

    let newText = '';
    let newCursorPos = start + prefix.length + selected.length;

    if (isLineLevel) {
      // Find start of current line
      const lineStart = currentText.lastIndexOf('\n', start - 1) + 1;
      const beforeLine = currentText.substring(0, lineStart);
      const afterLine = currentText.substring(lineStart);
      newText = `${beforeLine}${prefix}${afterLine}`;
      newCursorPos = lineStart + prefix.length;
    } else {
      newText = currentText.substring(0, start) + prefix + selected + suffix + currentText.substring(end);
      newCursorPos = start + prefix.length + selected.length;
    }

    handleContentChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  // Smart keyboard handler for natural iOS Notes list behavior on Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const cursor = textarea.selectionStart;
      const textBeforeCursor = textarea.value.substring(0, cursor);
      const lastLineStart = textBeforeCursor.lastIndexOf('\n') + 1;
      const currentLine = textBeforeCursor.substring(lastLineStart);

      // 1. Checklist continuation: line matches "- [ ] " or "- [x] "
      const checkMatch = currentLine.match(/^(\s*(?:-|\*)?\s*\[)([ xX])(\]\s*)(.*)$/);
      if (checkMatch) {
        e.preventDefault();
        const itemText = checkMatch[4].trim();
        // If line is empty checklist (just "- [ ] "), pressing Enter clears it
        if (!itemText) {
          const beforeLine = textarea.value.substring(0, lastLineStart);
          const afterCursor = textarea.value.substring(cursor);
          const newText = beforeLine + afterCursor;
          handleContentChange(newText);
          setTimeout(() => {
            textarea.setSelectionRange(lastLineStart, lastLineStart);
          }, 0);
          return;
        }

        // Continue checklist on new line
        const continuation = '\n- [ ] ';
        const newText =
          textarea.value.substring(0, cursor) + continuation + textarea.value.substring(cursor);
        handleContentChange(newText);
        setTimeout(() => {
          textarea.setSelectionRange(cursor + continuation.length, cursor + continuation.length);
        }, 0);
        return;
      }

      // 2. Bullet point continuation: line matches "• " or "- "
      const bulletMatch = currentLine.match(/^(\s*(?:•|-|\*)\s+)(.*)$/);
      if (bulletMatch) {
        e.preventDefault();
        const itemText = bulletMatch[2].trim();
        if (!itemText) {
          const beforeLine = textarea.value.substring(0, lastLineStart);
          const afterCursor = textarea.value.substring(cursor);
          const newText = beforeLine + afterCursor;
          handleContentChange(newText);
          setTimeout(() => {
            textarea.setSelectionRange(lastLineStart, lastLineStart);
          }, 0);
          return;
        }

        const continuation = '\n• ';
        const newText =
          textarea.value.substring(0, cursor) + continuation + textarea.value.substring(cursor);
        handleContentChange(newText);
        setTimeout(() => {
          textarea.setSelectionRange(cursor + continuation.length, cursor + continuation.length);
        }, 0);
        return;
      }

      // 3. Numbered list continuation: line matches "1. "
      const numMatch = currentLine.match(/^(\s*(\d+)\.\s+)(.*)$/);
      if (numMatch) {
        e.preventDefault();
        const itemText = numMatch[3].trim();
        if (!itemText) {
          const beforeLine = textarea.value.substring(0, lastLineStart);
          const afterCursor = textarea.value.substring(cursor);
          const newText = beforeLine + afterCursor;
          handleContentChange(newText);
          setTimeout(() => {
            textarea.setSelectionRange(lastLineStart, lastLineStart);
          }, 0);
          return;
        }

        const nextNum = parseInt(numMatch[2], 10) + 1;
        const continuation = `\n${nextNum}. `;
        const newText =
          textarea.value.substring(0, cursor) + continuation + textarea.value.substring(cursor);
        handleContentChange(newText);
        setTimeout(() => {
          textarea.setSelectionRange(cursor + continuation.length, cursor + continuation.length);
        }, 0);
        return;
      }
    }
  };

  // Toggle checklist item status in interactive mode
  const handleToggleChecklist = (lineIndex: number) => {
    const lines = activeContent.split('\n');
    if (lineIndex < 0 || lineIndex >= lines.length) return;

    const line = lines[lineIndex];
    const checkMatch = line.match(/^(\s*(?:-|\*)?\s*\[)([ xX])(\]\s*)(.*)$/);
    if (!checkMatch) return;

    const isCurrentlyChecked = checkMatch[2].toLowerCase() === 'x';
    const newMark = isCurrentlyChecked ? ' ' : 'x';
    lines[lineIndex] = `${checkMatch[1]}${newMark}${checkMatch[3]}${checkMatch[4]}`;

    const newContent = lines.join('\n');
    handleContentChange(newContent);
  };

  // Copy note text to clipboard
  const handleCopyNote = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`${activeTitle}\n\n${activeContent}`);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1800);
    }
  };

  // Filter notes based on search query
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const q = searchQuery.toLowerCase();
    return notes.filter(
      (n) => n.title.toLowerCase().includes(q) || (n.content && n.content.toLowerCase().includes(q))
    );
  }, [notes, searchQuery]);

  // Compute checklist stats for note
  const getNoteStats = (content: string) => {
    const lines = content.split('\n');
    let totalChecklist = 0;
    let completedChecklist = 0;

    for (const line of lines) {
      const match = line.match(/^\s*(?:-|\*)?\s*\[([ xX])\]/);
      if (match) {
        totalChecklist++;
        if (match[1].toLowerCase() === 'x') completedChecklist++;
      }
    }

    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    return { words, totalChecklist, completedChecklist };
  };

  const activeStats = useMemo(() => getNoteStats(activeContent), [activeContent]);

  // Format date helper
  const formatNoteDate = (isoStr?: string) => {
    if (!isoStr) return 'Just now';
    const date = new Date(isoStr);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  /* -------------------------------------------------------------------------- */
  /*                             RENDER: LIST VIEW                              */
  /* -------------------------------------------------------------------------- */
  const renderListView = () => (
    <div className="flex flex-col h-full space-y-3.5 select-none">
      {/* iOS Style Notes Header */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 grid place-items-center shadow-xs">
            <FileText className="size-4.5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Notes</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
                {notes.length}
              </span>
            </h2>
            <p className="text-[11px] text-white/50">
              {isAdmin ? 'Synced with Supabase Cloud' : 'Browser Storage'}
            </p>
          </div>
        </div>

        {/* Actions: Split View Toggle + New Note Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSplitView(!isSplitView)}
            className="hidden lg:grid size-8.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white place-items-center transition-colors cursor-pointer"
            title={isSplitView ? 'Collapse to single column' : 'Expand to iPad/Mac split view'}
          >
            {isSplitView ? <Maximize2 className="size-4" /> : <Columns className="size-4" />}
          </button>
          <button
            type="button"
            onClick={handleCreateNewNote}
            className="h-8.5 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-zinc-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <SquarePen className="size-3.5" />
            <span>New Note</span>
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="size-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search notes, checklists & memos..."
          className="w-full h-9 pl-9 pr-8 rounded-xl border border-white/10 bg-white/5 focus:bg-white/10 text-xs text-white placeholder:text-white/40 outline-hidden focus:border-amber-500/50 transition-colors font-sans"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Note Cards List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[300px] max-h-[560px] [scrollbar-width:thin]">
        {filteredNotes.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 space-y-3">
            <FileText className="size-8 text-white/30 mx-auto" />
            <div className="text-xs text-white/60">
              {searchQuery ? `No notes matching "${searchQuery}"` : 'No notes yet'}
            </div>
            <button
              type="button"
              onClick={handleCreateNewNote}
              className="btn btn-secondary h-8 px-3 rounded-xl text-xs font-semibold text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="size-3.5" />
              <span>Create First Note</span>
            </button>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const stats = getNoteStats(note.content || '');
            const previewSnippet =
              note.content
                ? note.content
                    .split('\n')
                    .slice(0, 2)
                    .map((l) => l.replace(/^[#\-*•\s\d.]+(\[[ xX]\])?\s*/, ''))
                    .filter(Boolean)
                    .join(' · ')
                : 'No additional text';

            return (
              <div
                key={note.id}
                onClick={() => handleOpenNote(note)}
                className={`group relative p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                  activeNoteId === note.id && (isSplitView || viewMode === 'editor')
                    ? 'border-amber-500/50 bg-amber-500/10 shadow-sm'
                    : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors truncate">
                      {note.title || 'Untitled Note'}
                    </h3>
                    <p className="text-[11.5px] text-white/50 line-clamp-1 mt-0.5 font-sans leading-relaxed">
                      {previewSnippet}
                    </p>
                  </div>

                  <span className="text-[10.5px] text-white/40 shrink-0 font-mono mt-0.5">
                    {formatNoteDate(note.updated_at || note.created_at)}
                  </span>
                </div>

                {/* Footer pills: Checklists & Word Count */}
                <div className="flex items-center justify-between text-[10.5px] text-white/50 pt-1 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    {stats.totalChecklist > 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/25 text-amber-300 font-semibold font-mono text-[10px]">
                        <CheckSquare className="size-3 text-amber-400" />
                        <span>
                          {stats.completedChecklist}/{stats.totalChecklist} done
                        </span>
                      </span>
                    )}
                    <span>{stats.words} words</span>
                  </div>

                  {/* Delete button (hover only, protected for default note) */}
                  {note.id !== 'main_scratchpad' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/20 transition-all cursor-pointer"
                      title="Delete Note"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[11px] text-white/40 pt-1 border-t border-white/10 font-mono">
        <span>Click any note to open typing interface</span>
        <span>{filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}</span>
      </div>
    </div>
  );

  /* -------------------------------------------------------------------------- */
  /*                            RENDER: EDITOR VIEW                             */
  /* -------------------------------------------------------------------------- */
  const renderEditorView = () => (
    <div className="flex flex-col h-full space-y-3 select-none">
      {/* Editor Top Navigation Bar (Apple Notes Style) */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/10">
        {/* Left: Back Button (< Notes) */}
        <div className="flex items-center gap-2">
          {!isSplitView && (
            <button
              type="button"
              onClick={() => {
                if (saveTimerRef.current) {
                  clearTimeout(saveTimerRef.current);
                  persistNote(activeNoteId, activeTitle, activeContent);
                }
                setViewMode('list');
              }}
              className="h-8 px-2.5 -ml-1 rounded-xl text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ChevronLeft className="size-4 -ml-0.5" />
              <span>Notes</span>
            </button>
          )}

          {/* Cloud Sync Status */}
          <div className="flex items-center gap-1.5 text-xs text-white/60">
            {saveState === 'saving' ? (
              <span className="inline-flex items-center gap-1 text-amber-300 text-[11px] font-mono">
                <Loader2 className="size-3 animate-spin" />
                <span>Saving…</span>
              </span>
            ) : saveState === 'saved' || isCloudSynced ? (
              <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-semibold">
                <Cloud className="size-3" />
                <span className="hidden sm:inline">Synced</span>
                {lastSavedTime && <span className="text-white/40 font-mono font-normal">({lastSavedTime})</span>}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-400 text-[11px] font-mono">
                <span>Unsaved</span>
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Sub-tab toggle: Typing Editor vs Interactive Checklist */}
          <div className="flex items-center p-0.5 rounded-xl bg-white/10 border border-white/10 text-[11px]">
            <button
              type="button"
              onClick={() => setEditorSubTab('type')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                editorSubTab === 'type'
                  ? 'bg-amber-500 text-zinc-950 shadow-xs'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Type
            </button>
            <button
              type="button"
              onClick={() => setEditorSubTab('interactive')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                editorSubTab === 'interactive'
                  ? 'bg-amber-500 text-zinc-950 shadow-xs'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <CheckSquare className="size-3" />
              <span>Interactive</span>
            </button>
          </div>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopyNote}
            className="size-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white grid place-items-center transition-colors cursor-pointer"
            title="Copy Note Text"
          >
            {isCopied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
          </button>

          {/* Delete Button (if not default note) */}
          {activeNoteId !== 'main_scratchpad' && (
            <button
              type="button"
              onClick={() => handleDeleteNote(activeNoteId)}
              className="size-8 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 grid place-items-center transition-colors cursor-pointer"
              title="Delete Note"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}

          {/* Desktop Split View Toggle */}
          <button
            type="button"
            onClick={() => setIsSplitView(!isSplitView)}
            className="hidden lg:grid size-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white place-items-center transition-colors cursor-pointer"
            title={isSplitView ? 'Collapse to single column' : 'Expand to iPad/Mac split view'}
          >
            {isSplitView ? <Maximize2 className="size-3.5" /> : <Columns className="size-3.5" />}
          </button>

          {/* Done / Save Button */}
          <button
            type="button"
            onClick={() => {
              if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
              persistNote(activeNoteId, activeTitle, activeContent);
              if (!isSplitView) setViewMode('list');
            }}
            className="h-8 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-all cursor-pointer flex items-center gap-1 shadow-xs"
          >
            <Check className="size-3.5" />
            <span>Done</span>
          </button>
        </div>
      </div>

      {/* Note Title Input (iOS Notes Style borderless headline) */}
      <input
        type="text"
        value={activeTitle}
        onChange={(e) => handleTitleChange(e.target.value)}
        placeholder="Note Title"
        className="w-full bg-transparent text-lg sm:text-xl font-bold text-white placeholder:text-white/30 outline-hidden pb-1 border-b border-transparent focus:border-amber-500/40 transition-colors"
      />

      {/* Formatting Toolbar (Apple Notes Inspired) */}
      <div className="flex items-center gap-1 overflow-x-auto p-1.5 rounded-xl bg-white/[0.04] border border-white/10 [scrollbar-width:none]">
        {/* 1. Checklist Button */}
        <button
          type="button"
          onClick={() => insertFormatting('- [ ] ', '', 'Task item')}
          className="h-7 px-2.5 rounded-lg bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 text-white/80 text-[11px] font-medium flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
          title="Insert Checklist Item (- [ ] )"
        >
          <CheckSquare className="size-3.5 text-amber-400" />
          <span>Checklist</span>
        </button>

        {/* 2. Radio / Bullet Button */}
        <button
          type="button"
          onClick={() => insertFormatting('• ', '', 'Bullet item')}
          className="h-7 px-2.5 rounded-lg bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 text-white/80 text-[11px] font-medium flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
          title="Insert Bullet Point (• )"
        >
          <List className="size-3.5 text-amber-400" />
          <span>Bullet</span>
        </button>

        {/* 3. Numbered List Button */}
        <button
          type="button"
          onClick={() => insertFormatting('1. ', '', 'Numbered step')}
          className="h-7 px-2.5 rounded-lg bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 text-white/80 text-[11px] font-medium flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
          title="Insert Numbered Step (1. )"
        >
          <ListOrdered className="size-3.5 text-amber-400" />
          <span>Number</span>
        </button>

        <span className="h-4 w-px bg-white/10 shrink-0 mx-0.5" />

        {/* 4. Heading Button */}
        <button
          type="button"
          onClick={() => insertFormatting('# ', '', 'Heading')}
          className="h-7 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-[11px] font-medium flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
          title="Heading (# )"
        >
          <Heading className="size-3.5" />
          <span className="hidden sm:inline">Heading</span>
        </button>

        {/* 5. Bold Button */}
        <button
          type="button"
          onClick={() => insertFormatting('**', '**', 'bold text')}
          className="h-7 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-[11px] font-medium flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
          title="Bold (**text**)"
        >
          <Bold className="size-3.5" />
        </button>

        {/* 6. Quote / Memo Button */}
        <button
          type="button"
          onClick={() => insertFormatting('> ', '', 'Memo note')}
          className="h-7 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-[11px] font-medium flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
          title="Quote / Memo (> )"
        >
          <Quote className="size-3.5" />
        </button>

        {/* 7. Code Button */}
        <button
          type="button"
          onClick={() => insertFormatting('`', '`', 'code')}
          className="h-7 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-[11px] font-medium flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
          title="Inline Code (`code`)"
        >
          <Code className="size-3.5" />
        </button>

        {/* 8. Today Date Timestamp */}
        <button
          type="button"
          onClick={() => {
            const todayStr = new Date().toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            insertFormatting(`[${todayStr}] `);
          }}
          className="h-7 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-[11px] font-medium flex items-center gap-1 transition-colors shrink-0 cursor-pointer ml-auto"
          title="Insert Today Date"
        >
          <Calendar className="size-3.5 text-amber-400" />
          <span className="hidden sm:inline">Date</span>
        </button>
      </div>

      {/* Editor Body: Textarea vs Interactive Checklist Mode */}
      {editorSubTab === 'type' ? (
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={activeContent}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your notes here...
Use - [ ] for checklists
Use • for bullet points
Use 1. for numbered lists"
            rows={15}
            className="w-full h-full min-h-[340px] p-4 rounded-2xl border border-white/10 bg-amber-950/15 focus:bg-amber-950/25 text-xs font-mono text-amber-100 placeholder:text-amber-200/30 outline-hidden leading-relaxed resize-y shadow-inner focus:border-amber-500/50 transition-colors selection:bg-amber-500/30 selection:text-white"
          />
        </div>
      ) : (
        /* Interactive Checklist & Markdown View */
        <div className="flex-1 min-h-[340px] p-4 rounded-2xl border border-white/10 bg-amber-950/15 overflow-y-auto space-y-2 [scrollbar-width:thin]">
          {activeContent.trim() ? (
            activeContent.split('\n').map((line, idx) => {
              // 1. Checklist Line
              const checkMatch = line.match(/^(\s*(?:-|\*)?\s*\[)([ xX])(\]\s*)(.*)$/);
              if (checkMatch) {
                const isChecked = checkMatch[2].toLowerCase() === 'x';
                const text = checkMatch[4];
                return (
                  <div
                    key={idx}
                    onClick={() => handleToggleChecklist(idx)}
                    className="flex items-start gap-2.5 p-1 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group"
                  >
                    <button
                      type="button"
                      className={`size-4.5 rounded-md border grid place-items-center mt-0.5 shrink-0 transition-colors ${
                        isChecked
                          ? 'bg-amber-500 border-amber-500 text-zinc-950'
                          : 'border-white/30 group-hover:border-amber-400 bg-white/5'
                      }`}
                    >
                      {isChecked && <Check className="size-3 stroke-[3]" />}
                    </button>
                    <span
                      className={`text-xs leading-relaxed transition-all ${
                        isChecked
                          ? 'line-through text-white/40'
                          : 'text-amber-100 font-medium'
                      }`}
                    >
                      {text || <span className="opacity-40 italic">Empty task</span>}
                    </span>
                  </div>
                );
              }

              // 2. Bullet Line
              const bulletMatch = line.match(/^(\s*(?:•|-|\*)\s+)(.*)$/);
              if (bulletMatch) {
                return (
                  <div key={idx} className="flex items-start gap-2.5 pl-1 py-0.5">
                    <span className="size-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                    <span className="text-xs text-amber-100 leading-relaxed">
                      {bulletMatch[2]}
                    </span>
                  </div>
                );
              }

              // 3. Numbered Line
              const numMatch = line.match(/^(\s*(\d+)\.\s+)(.*)$/);
              if (numMatch) {
                return (
                  <div key={idx} className="flex items-start gap-2.5 pl-1 py-0.5">
                    <span className="text-[11px] font-bold text-amber-400 font-mono shrink-0">
                      {numMatch[2]}.
                    </span>
                    <span className="text-xs text-amber-100 leading-relaxed">
                      {numMatch[3]}
                    </span>
                  </div>
                );
              }

              // 4. Heading
              if (line.startsWith('# ')) {
                return (
                  <h3 key={idx} className="text-sm font-extrabold text-amber-300 pt-2 pb-1 border-b border-white/10">
                    {line.replace(/^#\s+/, '')}
                  </h3>
                );
              }

              // 5. Blockquote
              if (line.startsWith('> ')) {
                return (
                  <div key={idx} className="pl-3 py-1 border-l-2 border-amber-400/60 text-xs italic text-amber-200/80 bg-white/[0.02] rounded-r-lg">
                    {line.replace(/^>\s+/, '')}
                  </div>
                );
              }

              // 6. Normal Line
              return (
                <div key={idx} className="text-xs text-amber-100/90 leading-relaxed min-h-[1.25rem]">
                  {line}
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-xs text-white/40 italic">
              Empty note. Switch to &ldquo;Type&rdquo; to add text and checklists.
            </div>
          )}
        </div>
      )}

      {/* Editor Stats Footer */}
      <div className="flex items-center justify-between text-[11px] text-white/50 pt-1 font-mono">
        <div className="flex items-center gap-2">
          <span>{activeStats.words} words</span>
          <span>•</span>
          <span>{activeContent.length} chars</span>
          {activeStats.totalChecklist > 0 && (
            <>
              <span>•</span>
              <span className="text-amber-300 font-semibold">
                ✓ {activeStats.completedChecklist}/{activeStats.totalChecklist} done
              </span>
            </>
          )}
        </div>
        <span>Press Enter on checklists/bullets to auto-continue</span>
      </div>
    </div>
  );

  /* -------------------------------------------------------------------------- */
  /*                               MAIN CONTAINER                               */
  /* -------------------------------------------------------------------------- */
  return (
    <div className={`w-full ${className}`}>
      {/* Desktop Split View (if wide screen and split mode enabled) */}
      {isSplitView ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[580px]">
          <div className="lg:col-span-5 border-r border-white/10 pr-4">
            {renderListView()}
          </div>
          <div className="lg:col-span-7 pl-2">
            {renderEditorView()}
          </div>
        </div>
      ) : (
        /* Single View Mode: starts with List, transitions to Editor on click */
        <div>
          {viewMode === 'list' ? renderListView() : renderEditorView()}
        </div>
      )}
    </div>
  );
};

