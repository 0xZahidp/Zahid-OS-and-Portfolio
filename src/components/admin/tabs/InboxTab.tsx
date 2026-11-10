'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import DOMPurify from 'dompurify';
import {
  Send,
  Star,
  Trash2,
  Plus,
  Search,
  RefreshCw,
  Mail,
  MailCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CornerUpLeft,
  X,
  ExternalLink,
  ArrowLeft,
  Paperclip,
  Archive,
  ArchiveRestore,
  Check,
  Lock,
  Maximize2,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
} from 'lucide-react';
import { useInbox } from '@/context/InboxContext';
import { MailFolder, MailThread } from '@/types/mail';

const LOCKED_OFFICIAL_ALIASES = [
  { id: 'all', label: 'All Official Aliases', alias: 'all' },
  { id: 'hello', label: 'hello@zahidp.com', alias: 'hello@zahidp.com' },
  { id: 'test', label: 'test@zahidp.com', alias: 'test@zahidp.com' },
  { id: 'contact', label: 'contact@zahidp.com', alias: 'contact@zahidp.com' },
  { id: 'support', label: 'support@zahidp.com', alias: 'support@zahidp.com' },
  { id: 'reply', label: 'reply@zahidp.com', alias: 'reply@zahidp.com' },
  { id: 'noreply', label: 'noreply@zahidp.com', alias: 'noreply@zahidp.com' },
] as const;

/**
 * Renders sanitized HTML or plain text with an expandable/collapsible toggle
 * for quoted reply history (e.g. <blockquote> or lines starting with >).
 */
const SanitizedEmailBody: React.FC<{ html?: string; text?: string }> = ({ html, text }) => {
  const [showQuoted, setShowQuoted] = useState(false);

  // Check if body has quoted text patterns
  const hasQuotedContent = useMemo(() => {
    if (html) {
      return (
        html.includes('<blockquote') ||
        html.includes('class="gmail_quote"') ||
        html.includes('class="yahoo_quoted"') ||
        html.includes('id="appendonsend"') ||
        /On\s.+?wrote:/i.test(html)
      );
    }
    if (text) {
      return (
        text.includes('\n>') ||
        /---\s*Original Message\s*---/i.test(text) ||
        /On\s.+?wrote:/i.test(text)
      );
    }
    return false;
  }, [html, text]);

  const sanitizedHtml = useMemo(() => {
    if (!html) return '';
    if (typeof window === 'undefined') return html;
    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      ADD_ATTR: ['target', 'rel'],
    });
  }, [html]);

  const cleanText = text || '';

  return (
    <div className="space-y-3">
      {sanitizedHtml ? (
        <div className="relative">
          <style jsx global>{`
            .email-body-content blockquote,
            .email-body-content .gmail_quote,
            .email-body-content .yahoo_quoted {
              display: ${showQuoted ? 'block' : 'none'} !important;
              border-left: 2px solid var(--color-line, #333);
              padding-left: 12px;
              margin-top: 10px;
              margin-bottom: 10px;
              opacity: 0.85;
            }
          `}</style>
          <div
            className="email-body-content prose dark:prose-invert max-w-none text-xs sm:text-sm text-ink leading-relaxed break-words [overflow-wrap:anywhere] [word-break:break-word] p-3 sm:p-4 rounded-xl bg-surface border border-line/60"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
        </div>
      ) : (
        <div className="p-3 sm:p-4 rounded-xl bg-surface border border-line/60 prose dark:prose-invert max-w-none text-xs sm:text-sm text-ink leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
          {hasQuotedContent && !showQuoted ? (
            cleanText.split(/\n>\s|\nOn\s.+?wrote:|\s*---\s*Original Message\s*---/i)[0] || cleanText
          ) : (
            cleanText
          )}
        </div>
      )}

      {hasQuotedContent && (
        <div>
          <button
            type="button"
            onClick={() => setShowQuoted((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-line bg-surface-2 hover:bg-surface-3 text-[11px] font-medium text-ink-3 hover:text-ink transition-colors cursor-pointer"
          >
            <MoreHorizontal className="size-3" />
            <span>{showQuoted ? 'Hide quoted history' : 'Show quoted text'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export const InboxTab: React.FC = () => {
  const {
    threads,
    activeThreadId,
    activeThread,
    folder,
    searchQuery,
    selectedAlias,
    counts,
    isLoading,
    isSyncing,
    loadError,
    defaultSender,
    lastSyncedAt,
    page,
    totalPages,
    totalCount,
    setActiveThreadId,
    setFolder,
    setSearchQuery,
    setSelectedAlias,
    nextPage,
    prevPage,
    fetchThreads,
    markThreadRead,
    toggleThreadStar,
    moveThread,
    deleteThreadById,
    emptyTrashAction,
    sendReply,
  } = useInbox();

  // Local UI states
  const [mobileView, setMobileView] = useState<'list' | 'message'>('list');
  const [isExpandModalOpen, setIsExpandModalOpen] = useState(false);
  const [expandedMessageIds, setExpandedMessageIds] = useState<Set<string>>(new Set());

  // Reply Composer State
  const [isReplyExpanded, setIsReplyExpanded] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyFrom, setReplyFrom] = useState(defaultSender);
  const [isEditingReplyFrom, setIsEditingReplyFrom] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Compose Modal State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeFrom, setComposeFrom] = useState(defaultSender);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [isSendingCompose, setIsSendingCompose] = useState(false);
  const [statusNotification, setStatusNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Sync defaultSender when available
  useEffect(() => {
    if (defaultSender) {
      setReplyFrom(defaultSender);
      setComposeFrom(defaultSender);
    }
  }, [defaultSender]);

  // Default replyFrom to the address the email was received at (already on zahidp.com)
  useEffect(() => {
    if (!activeThread) return;
    const latestInbound = [...activeThread.messages].reverse().find((m) => m.direction === 'inbound');
    const recipient =
      latestInbound?.to?.find((t) => t.email && t.email.toLowerCase().endsWith('@zahidp.com')) ||
      latestInbound?.to?.[0];
    if (recipient?.email) {
      const name = recipient.name && recipient.name !== 'Recipient' ? recipient.name : 'Md Zahid Hasan';
      setReplyFrom(`${name} <${recipient.email}>`);
    } else if (defaultSender) {
      setReplyFrom(defaultSender);
    }
  }, [activeThread, defaultSender]);

  // Draft auto-save and restore per thread
  useEffect(() => {
    if (!activeThreadId) {
      setReplyText('');
      setIsReplyExpanded(false);
      return;
    }

    try {
      const savedDraft = localStorage.getItem(`inbox_draft_${activeThreadId}`);
      if (savedDraft) {
        setReplyText(savedDraft);
        setIsReplyExpanded(true);
      } else {
        setReplyText('');
        setIsReplyExpanded(false);
      }
    } catch {
      // ignore
    }
  }, [activeThreadId]);

  // Auto-save reply text draft
  const handleReplyChange = (text: string) => {
    setReplyText(text);
    if (!activeThreadId) return;
    try {
      if (text.trim()) {
        localStorage.setItem(`inbox_draft_${activeThreadId}`, text);
      } else {
        localStorage.removeItem(`inbox_draft_${activeThreadId}`);
      }
    } catch {
      // ignore
    }
  };

  // Keyboard Shortcuts: j/k, Enter, r, e, #, s, u
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isInput = tag === 'input' || tag === 'textarea' || target?.isContentEditable;

      // Escape closes modals or collapses reply
      if (e.key === 'Escape') {
        if (isExpandModalOpen) {
          setIsExpandModalOpen(false);
          return;
        }
        if (isComposeOpen) {
          setIsComposeOpen(false);
          return;
        }
        if (isReplyExpanded && !isInput) {
          setIsReplyExpanded(false);
          return;
        }
      }

      if (isInput) return;

      // Thread navigation with j / k
      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        const currentIndex = threads.findIndex((t) => t.id === activeThreadId);
        const nextIndex = currentIndex < threads.length - 1 ? currentIndex + 1 : 0;
        if (threads[nextIndex]) {
          setActiveThreadId(threads[nextIndex].id);
        }
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = threads.findIndex((t) => t.id === activeThreadId);
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : threads.length - 1;
        if (threads[prevIndex]) {
          setActiveThreadId(threads[prevIndex].id);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        // Expand reply composer & focus textarea
        e.preventDefault();
        setIsReplyExpanded(true);
        setTimeout(() => replyTextareaRef.current?.focus(), 50);
      } else if (e.key === 'e' && activeThread) {
        // Archive
        e.preventDefault();
        moveThread(activeThread.id, activeThread.isArchived ? 'inbox' : 'archive');
      } else if ((e.key === '#' || e.key === 'Delete') && activeThread) {
        // Trash
        e.preventDefault();
        deleteThreadById(activeThread.id, activeThread.isTrashed);
      } else if (e.key === 's' && activeThread) {
        // Star
        e.preventDefault();
        toggleThreadStar(activeThread.id, !activeThread.isStarred);
      } else if (e.key === 'u' && activeThread) {
        // Toggle Read / Unread
        e.preventDefault();
        markThreadRead(activeThread.id, activeThread.hasUnread);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    threads,
    activeThreadId,
    activeThread,
    isExpandModalOpen,
    isComposeOpen,
    isReplyExpanded,
    setActiveThreadId,
    moveThread,
    deleteThreadById,
    toggleThreadStar,
    markThreadRead,
  ]);

  const handleBackToList = useCallback(() => {
    setActiveThreadId(null);
    setMobileView('list');
  }, [setActiveThreadId]);

  // Browser / device back button gesture support
  useEffect(() => {
    const onPopState = () => {
      if (mobileView === 'message') {
        handleBackToList();
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [mobileView, handleBackToList]);

  // Automatically return to list view on mobile if selected thread is cleared
  useEffect(() => {
    if (!activeThreadId && mobileView === 'message') {
      setMobileView('list');
    }
  }, [activeThreadId, mobileView]);

  const handleDeleteThreadAction = async (threadId: string, isTrashed: boolean) => {
    if (mobileView === 'message') {
      handleBackToList();
    }
    await deleteThreadById(threadId, isTrashed);
  };

  const handleMoveThreadAction = async (threadId: string, targetFolder: MailFolder) => {
    if (mobileView === 'message') {
      handleBackToList();
    }
    await moveThread(threadId, targetFolder);
  };

  // Toggle individual message collapse in thread
  const toggleMessageExpand = (msgId: string) => {
    setExpandedMessageIds((prev) => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return next;
    });
  };

  // Select a thread from the list
  const handleSelectThread = (thread: MailThread) => {
    setActiveThreadId(thread.id);
    setMobileView('message');
    if (typeof window !== 'undefined') {
      window.history.pushState({ inboxView: 'message', threadId: thread.id }, '');
    }
  };

  // Submit Quick Reply
  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !replyText.trim()) return;

    setIsSendingReply(true);
    setStatusNotification(null);

    // Latest message in thread
    const latestMessage = activeThread.messages[activeThread.messages.length - 1];
    const replyRecipient =
      latestMessage.replyTo ||
      latestMessage.from?.email ||
      activeThread.participants.find((p) => p.email && !p.email.includes('zahidp.com'))?.email ||
      '';

    const normalizedSubj = activeThread.subject.replace(/^(\s*(re|fwd)\s*:\s*)+/i, '').trim();
    const replySubject = `Re: ${normalizedSubj}`;

    const res = await sendReply({
      threadId: activeThread.id,
      to: replyRecipient,
      subject: replySubject,
      body: replyText.trim(),
      inReplyTo: latestMessage.resendId || latestMessage.id,
      references: latestMessage.references
        ? [...latestMessage.references, latestMessage.resendId || latestMessage.id]
        : [latestMessage.resendId || latestMessage.id],
      from: replyFrom || defaultSender,
    });

    setIsSendingReply(false);

    if (res.success) {
      // Clear draft
      try {
        localStorage.removeItem(`inbox_draft_${activeThread.id}`);
      } catch {
        // ignore
      }
      setReplyText('');
      setIsReplyExpanded(false);
      setStatusNotification({ type: 'success', text: 'Reply sent successfully via Resend' });
      setTimeout(() => setStatusNotification(null), 4000);
    } else {
      setStatusNotification({ type: 'error', text: res.error || 'Failed to dispatch reply' });
    }
  };

  // Submit Compose Modal
  const handleSubmitCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo || !composeSubject || !composeBody) return;

    setIsSendingCompose(true);
    setStatusNotification(null);

    try {
      const res = await fetch('/api/mail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: composeTo.trim(),
          subject: composeSubject.trim(),
          body: composeBody.trim(),
          from: composeFrom || defaultSender,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch email');
      }

      setIsComposeOpen(false);
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      setStatusNotification({ type: 'success', text: 'New email dispatched successfully via Resend' });
      setTimeout(() => setStatusNotification(null), 4000);
      await fetchThreads(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error sending email';
      setStatusNotification({ type: 'error', text: msg });
    } finally {
      setIsSendingCompose(false);
    }
  };

  // Format participant names for list view
  const formatParticipants = (thread: MailThread): string => {
    const names = thread.participants.map((p) => {
      if (p.email?.toLowerCase().includes('zahidp.com')) return 'You';
      return p.name || p.email.split('@')[0];
    });
    const unique = Array.from(new Set(names));
    if (unique.length === 0) return 'Unknown';
    if (unique.length === 1) return unique[0];
    return unique.join(', ');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] bg-surface border border-line rounded-2xl overflow-hidden shadow-xs select-none">
      {/* Status banner if present */}
      {statusNotification && (
        <div
          className={`px-4 py-2 text-xs font-semibold flex items-center justify-between border-b ${
            statusNotification.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusNotification.type === 'success' ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <AlertCircle className="size-4" />
            )}
            <span>{statusNotification.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusNotification(null)}
            className="text-ink-3 hover:text-ink cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Main 3-Column Split View */}
      <div className="flex flex-1 min-h-0 divide-x divide-line">
        {/* COLUMN 1: Folder Navigation & Domain Diagnostics (Left Rail) */}
        <div className="w-56 shrink-0 hidden xl:flex flex-col bg-surface-2/40 p-3 space-y-4">
          {/* Compose Button */}
          <button
            type="button"
            onClick={() => setIsComposeOpen(true)}
            className="w-full h-9 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="size-4" />
            <span>New Message</span>
          </button>

          {/* Folder Navigation */}
          <nav className="space-y-1">
            <p className="px-2.5 text-[10px] font-bold text-ink-3 uppercase tracking-wider mb-1.5">Folders</p>
            {[
              { id: 'inbox' as MailFolder, label: 'Inbox', icon: Mail, count: counts.unread, isUnreadCount: true },
              { id: 'unofficial' as MailFolder, label: 'Unofficial', icon: MailCheck, count: counts.unofficialUnread, isMutedCount: true },
              { id: 'starred' as MailFolder, label: 'Starred', icon: Star, count: counts.starred },
              { id: 'sent' as MailFolder, label: 'Sent', icon: Send, count: counts.sent },
              { id: 'archive' as MailFolder, label: 'Archive', icon: Archive, count: counts.archive },
              { id: 'trash' as MailFolder, label: 'Trash', icon: Trash2, count: counts.trash },
            ].map((f) => {
              const Icon = f.icon;
              const isActive = folder === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setFolder(f.id);
                    setMobileView('list');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-surface text-ink shadow-xs ring-1 ring-line font-bold'
                      : 'text-ink-3 hover:bg-surface-2 hover:text-ink'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`size-4 ${
                        isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink-3'
                      }`}
                    />
                    <span>{f.label}</span>
                  </div>
                  {typeof f.count === 'number' && f.count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                        f.isUnreadCount
                          ? 'bg-brand-500 text-white font-bold'
                          : f.isMutedCount
                          ? 'bg-surface-3 text-ink-3 font-medium border border-line/60'
                          : 'bg-surface-3 text-ink-3 font-semibold'
                      }`}
                    >
                      {f.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Domain & Sync Status Card */}
          <div className="mt-auto p-3 rounded-xl border border-line bg-surface/60 space-y-2 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500" />
                Resend Connected
              </span>
            </div>
            <div className="space-y-0.5 text-[10px] text-ink-3">
              <p>Domain: <span className="font-mono text-ink">zahidp.com</span></p>
              <p>Catch-all: <span className="font-mono text-emerald-500 font-medium">*@zahidp.com</span></p>
              {lastSyncedAt && (
                <p>Synced: {lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => fetchThreads(true)}
              disabled={isSyncing}
              className="w-full h-7 rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`size-3 ${isSyncing ? 'animate-spin text-brand-500' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Resend'}</span>
            </button>
          </div>
        </div>

        {/* COLUMN 2: Thread List & Filter Bar (Middle Pane) */}
        <div
          className={`w-full lg:w-88 xl:w-96 shrink-0 flex flex-col bg-surface-2/20 ${
            mobileView === 'message' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Top Filter and Search Bar */}
          <div className="p-3 border-b border-line space-y-2.5 bg-surface/50">
            {/* Search Input & Action Icons */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search threads..."
                  className="w-full h-8 pl-8 pr-7 rounded-lg bg-surface border border-line text-xs text-ink placeholder:text-ink-4 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink cursor-pointer"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>

              {/* Compose button on mobile / tablet */}
              <button
                type="button"
                onClick={() => setIsComposeOpen(true)}
                className="xl:hidden p-1.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors cursor-pointer shrink-0"
                title="Compose Email"
              >
                <Plus className="size-4" />
              </button>

              {/* Refresh button */}
              <button
                type="button"
                onClick={() => fetchThreads(false)}
                className="p-1.5 rounded-lg border border-line text-ink-3 hover:text-ink hover:bg-surface transition-colors cursor-pointer shrink-0"
                title="Refresh threads"
              >
                <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              {/* Empty Trash button when viewing trash */}
              {folder === 'trash' && threads.length > 0 && (
                <button
                  type="button"
                  onClick={emptyTrashAction}
                  className="p-1.5 rounded-lg border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                  title="Empty Trash"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>

            {/* Locked Aliases & Category Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 text-[11px] [scrollbar-width:none]">
              <div className="flex items-center gap-1 text-ink-3 shrink-0 mr-0.5">
                <Lock className="size-3 text-emerald-500" />
                <span className="text-[10px] font-semibold uppercase text-emerald-600 dark:text-emerald-400">
                  Locked:
                </span>
              </div>
              {LOCKED_OFFICIAL_ALIASES.map((al) => {
                const isActive = selectedAlias === al.alias;
                return (
                  <button
                    key={al.id}
                    type="button"
                    onClick={() => {
                      setSelectedAlias(al.alias);
                    }}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono whitespace-nowrap transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                      isActive
                        ? 'bg-emerald-600 text-white font-bold shadow-xs'
                        : 'bg-surface border border-line text-ink-3 hover:text-ink hover:border-emerald-500/40'
                    }`}
                  >
                    <span>{al.id === 'all' ? 'All Official' : al.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Thread List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-line/60 [scrollbar-width:thin]">
            {isLoading && threads.length === 0 ? (
              <div className="p-8 text-center text-xs text-ink-3 flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin text-brand-500" />
                <span>Loading conversations...</span>
              </div>
            ) : threads.length === 0 ? (
              <div className="p-8 text-center text-xs text-ink-3 space-y-1">
                <Mail className="size-6 mx-auto opacity-30" />
                <p className="font-semibold">No conversations in {folder}</p>
                <p className="text-[11px] opacity-75">
                  {selectedAlias !== 'all' ? `Filtered by ${selectedAlias}` : 'All caught up!'}
                </p>
              </div>
            ) : (
              threads.map((thread) => {
                const isSelected = activeThreadId === thread.id;
                const formattedDate = new Date(thread.lastMessageAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                });
                const participantsText = formatParticipants(thread);

                return (
                  <div
                    key={thread.id}
                    onClick={() => handleSelectThread(thread)}
                    className={`p-3.5 transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-brand-500/10 border-l-2 border-brand-500'
                        : !thread.hasUnread
                        ? 'bg-surface hover:bg-surface-2/60'
                        : 'bg-surface-2/80 hover:bg-surface-2 font-semibold'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        {thread.hasUnread && (
                          <span
                            className="size-2 rounded-full bg-brand-500 shrink-0"
                            title="Unread conversation"
                          />
                        )}
                        <span
                          className={`text-xs truncate ${
                            thread.hasUnread ? 'font-bold text-ink' : 'font-medium text-ink-2'
                          }`}
                        >
                          {participantsText}
                        </span>
                        {/* Conversation count badge */}
                        {thread.messageCount > 1 && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-surface-3 border border-line text-ink-3 font-semibold shrink-0">
                            {thread.messageCount}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-ink-3 shrink-0 font-medium">
                        {formattedDate}
                      </span>
                    </div>

                    <h4
                      className={`text-xs truncate mb-1 ${
                        thread.hasUnread ? 'font-bold text-ink' : 'font-medium text-ink-2'
                      }`}
                    >
                      {thread.subject || '(No Subject)'}
                    </h4>

                    <p className="text-[11px] text-ink-3 line-clamp-2 leading-relaxed">
                      {thread.snippet || '(No snippet available)'}
                    </p>

                    {/* Footer Row: Tags & Quick Hover Actions */}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                        {thread.hasSent && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-surface-2 border border-line text-ink-3">
                            Replied
                          </span>
                        )}
                        {thread.isArchived && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            Archived
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveThread(thread.id, thread.isArchived ? 'inbox' : 'archive');
                          }}
                          className="opacity-0 group-hover:opacity-100 text-ink-4 hover:text-indigo-500 p-0.5 rounded transition-opacity"
                          title={thread.isArchived ? 'Move to Inbox' : 'Archive conversation'}
                        >
                          {thread.isArchived ? (
                            <ArchiveRestore className="size-3.5" />
                          ) : (
                            <Archive className="size-3.5" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteThreadById(thread.id, thread.isTrashed);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-ink-4 hover:text-rose-500 p-0.5 rounded transition-opacity"
                          title={thread.isTrashed ? 'Delete permanently' : 'Move to Trash'}
                        >
                          <Trash2 className="size-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleThreadStar(thread.id, !thread.isStarred);
                          }}
                          className="text-ink-4 hover:text-amber-500 p-0.5 rounded transition-colors"
                          title={thread.isStarred ? 'Unstar' : 'Star'}
                        >
                          <Star
                            className={`size-3.5 ${
                              thread.isStarred ? 'fill-amber-400 text-amber-500' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Controls (25 threads per page) */}
          {totalPages > 1 && (
            <div className="p-2.5 border-t border-line bg-surface/90 flex items-center justify-between text-[11px] text-ink-3 shrink-0">
              <span className="font-mono text-[10px]">
                Page {page} of {totalPages} ({totalCount} {totalCount === 1 ? 'thread' : 'threads'})
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={prevPage}
                  className="px-2 py-0.5 rounded-md border border-line bg-surface hover:bg-surface-2 text-ink text-[10px] font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={nextPage}
                  className="px-2 py-0.5 rounded-md border border-line bg-surface hover:bg-surface-2 text-ink text-[10px] font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* COLUMN 3: Reading Pane & Docked Reply Composer (3 Zones) */}
        <div
          className={`flex-1 flex flex-col min-w-0 bg-surface overflow-hidden ${
            mobileView === 'list' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {activeThread ? (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* ZONE 1: Fixed Header Bar */}
              <div className="p-3 sm:p-4 border-b border-line flex items-center justify-between gap-3 bg-surface shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={handleBackToList}
                    className="lg:hidden p-1.5 -ml-1 text-ink-3 hover:text-ink hover:bg-surface-2 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Back to conversation list"
                  >
                    <ArrowLeft className="size-4" />
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-ink truncate leading-tight">
                        {activeThread.subject || '(No Subject)'}
                      </h3>
                      {activeThread.messageCount > 1 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-surface-2 border border-line text-ink-3 font-semibold shrink-0">
                          {activeThread.messageCount} messages
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-ink-3 truncate mt-0.5">
                      Participants: {formatParticipants(activeThread)}
                    </p>
                  </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Expand Modal / Fullscreen */}
                  <button
                    type="button"
                    onClick={() => setIsExpandModalOpen(true)}
                    className="p-2 rounded-lg border border-line text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
                    title="Expand conversation to full view"
                  >
                    <Maximize2 className="size-4" />
                  </button>

                  {/* Star */}
                  <button
                    type="button"
                    onClick={() => toggleThreadStar(activeThread.id, !activeThread.isStarred)}
                    className="p-2 rounded-lg border border-line text-ink-3 hover:text-amber-500 hover:bg-surface-2 transition-colors cursor-pointer"
                    title={activeThread.isStarred ? 'Unstar' : 'Star'}
                  >
                    <Star
                      className={`size-4 ${
                        activeThread.isStarred ? 'fill-amber-400 text-amber-500' : ''
                      }`}
                    />
                  </button>

                  {/* Read / Unread */}
                  <button
                    type="button"
                    onClick={() => markThreadRead(activeThread.id, activeThread.hasUnread)}
                    className="p-2 rounded-lg border border-line text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
                    title={activeThread.hasUnread ? 'Mark as Read' : 'Mark as Unread'}
                  >
                    {activeThread.hasUnread ? (
                      <MailCheck className="size-4" />
                    ) : (
                      <Mail className="size-4" />
                    )}
                  </button>

                  {/* Archive */}
                  <button
                    type="button"
                    onClick={() =>
                      handleMoveThreadAction(activeThread.id, activeThread.isArchived ? 'inbox' : 'archive')
                    }
                    className="p-2 rounded-lg border border-line text-ink-3 hover:text-indigo-500 hover:bg-indigo-500/10 transition-colors cursor-pointer"
                    title={activeThread.isArchived ? 'Move to Inbox' : 'Archive conversation'}
                  >
                    {activeThread.isArchived ? (
                      <ArchiveRestore className="size-4" />
                    ) : (
                      <Archive className="size-4" />
                    )}
                  </button>

                  {/* Delete / Trash */}
                  <button
                    type="button"
                    onClick={() => handleDeleteThreadAction(activeThread.id, activeThread.isTrashed)}
                    className="p-2 rounded-lg border border-line text-ink-3 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title={activeThread.isTrashed ? 'Delete permanently' : 'Move to Trash'}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              {/* ZONE 2: Scrollable Messages Stack (flex-1 min-h-0 overflow-y-auto) */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 [scrollbar-width:thin]">
                {activeThread.messages.map((msg, index) => {
                  const isLatest = index === activeThread.messages.length - 1;
                  const isExpanded =
                    expandedMessageIds.has(msg.id) ||
                    (isLatest && !expandedMessageIds.has(`collapsed_${msg.id}`));
                  const isOutbound = msg.direction === 'outbound' || msg.folder === 'sent';
                  const formattedTime = new Date(msg.createdAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  if (!isExpanded) {
                    // Collapsed 1-line strip for older messages
                    return (
                      <div
                        key={msg.id}
                        onClick={() => toggleMessageExpand(msg.id)}
                        className="p-3 rounded-xl border border-line bg-surface-2/40 hover:bg-surface-2 transition-colors cursor-pointer flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="size-6 rounded-full bg-surface-3 flex items-center justify-center font-bold text-[10px] text-ink-2 shrink-0">
                            {isOutbound ? 'You' : (msg.from?.name || msg.from?.email || 'U').charAt(0)}
                          </div>
                          <span className="font-semibold text-ink truncate">
                            {isOutbound ? 'You (Sent)' : msg.from?.name || msg.from?.email}
                          </span>
                          <span className="text-ink-3 truncate text-[11px]">
                            {msg.snippet || msg.body?.substring(0, 80)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 text-ink-3 text-[10px]">
                          <span>{formattedTime}</span>
                          <ChevronDown className="size-3.5" />
                        </div>
                      </div>
                    );
                  }

                  // Full Expanded Message Card
                  return (
                    <div
                      key={msg.id}
                      className={`rounded-2xl border transition-all ${
                        isOutbound
                          ? 'border-emerald-500/30 bg-emerald-500/[0.03] shadow-xs'
                          : 'border-line bg-surface shadow-xs'
                      }`}
                    >
                      {/* Message Card Header */}
                      <div
                        onClick={() => {
                          if (!isLatest) toggleMessageExpand(msg.id);
                        }}
                        className={`p-4 border-b border-line/60 flex items-start justify-between gap-3 ${
                          !isLatest ? 'cursor-pointer hover:bg-surface-2/30' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`size-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              isOutbound
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono'
                                : 'bg-surface-2 border border-line text-ink'
                            }`}
                          >
                            {isOutbound ? 'You' : (msg.from?.name || msg.from?.email || 'U').charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-ink truncate">
                                {isOutbound ? 'You (Sent Reply)' : msg.from?.name || msg.from?.email}
                              </span>
                              {isOutbound && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                  Resend Outbound
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-ink-3 truncate mt-0.5">
                              From: &lt;{msg.from?.email}&gt; · To: {msg.to?.map((t) => t.email).join(', ') || 'hello@zahidp.com'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-ink-3 font-mono">{formattedTime}</span>
                          {!isLatest && <ChevronUp className="size-3.5 text-ink-3" />}
                        </div>
                      </div>

                      {/* Message Card Body */}
                      <div className="p-4 sm:p-5 space-y-4">
                        <SanitizedEmailBody html={msg.htmlBody} text={msg.textBody || msg.body} />

                        {/* Attachments if present */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="pt-3 border-t border-line/60 space-y-2">
                            <span className="text-[11px] font-semibold text-ink-3 flex items-center gap-1.5">
                              <Paperclip className="size-3.5 text-brand-500" />
                              <span>Attachments ({msg.attachments.length})</span>
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {msg.attachments.map((att, idx) => (
                                <div
                                  key={att.id || idx}
                                  className="px-2.5 py-1.5 rounded-lg border border-line bg-surface-2 text-xs flex items-center gap-2"
                                >
                                  <span className="font-medium text-ink truncate max-w-[200px]">
                                    {att.filename || 'attachment'}
                                  </span>
                                  {att.size && (
                                    <span className="text-[10px] text-ink-3">
                                      ({Math.round(att.size / 1024)} KB)
                                    </span>
                                  )}
                                  {(att.url || att.download_url) && (
                                    <a
                                      href={(att.url || att.download_url) ?? undefined}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-brand-500 hover:underline text-[10px] font-semibold"
                                    >
                                      Download
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ZONE 3: Docked Reply Composer (Collapsible, ~120-160px) */}
              {!activeThread.isTrashed && (
                <div className="shrink-0 border-t border-line bg-surface-2/30 p-3">
                  {!isReplyExpanded ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsReplyExpanded(true);
                        setTimeout(() => replyTextareaRef.current?.focus(), 50);
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-line bg-surface hover:bg-surface-2 text-ink-3 hover:text-ink text-xs font-medium transition-colors cursor-pointer shadow-xs"
                    >
                      <CornerUpLeft className="size-4 text-emerald-500" />
                      <span>Reply to this conversation...</span>
                      <span className="ml-auto text-[10px] text-ink-3/70 bg-surface-2 px-1.5 py-0.5 rounded border border-line">
                        Press R
                      </span>
                    </button>
                  ) : (
                    <form
                      onSubmit={handleSubmitReply}
                      className="rounded-2xl border border-line bg-surface p-3.5 space-y-3 shadow-md"
                    >
                      {/* Sender Identity & Alias selector */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <CornerUpLeft className="size-3.5 text-emerald-500" />
                          <span className="font-bold text-ink">Reply from:</span>
                          {isEditingReplyFrom ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={replyFrom}
                                onChange={(e) => setReplyFrom(e.target.value)}
                                className="h-6 px-2 text-xs font-mono rounded bg-surface border border-brand-500 text-ink focus:outline-none w-52 sm:w-64"
                              />
                              <button
                                type="button"
                                onClick={() => setIsEditingReplyFrom(false)}
                                className="p-1 rounded bg-brand-500 text-white hover:bg-brand-600 transition-colors cursor-pointer"
                              >
                                <Check className="size-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setIsEditingReplyFrom(true)}
                              className="font-mono text-ink text-[11px] underline decoration-dotted hover:text-brand-500 cursor-pointer"
                            >
                              {replyFrom}
                            </button>
                          )}
                        </div>

                        {/* Quick Alias Chips */}
                        <div className="flex items-center gap-1">
                          {['hello', 'contact', 'support'].map((alias) => (
                            <button
                              key={alias}
                              type="button"
                              onClick={() => setReplyFrom(`Md Zahid Hasan <${alias}@zahidp.com>`)}
                              className={`px-1.5 py-0.2 rounded text-[9.5px] font-mono border transition-colors cursor-pointer ${
                                replyFrom.includes(alias)
                                  ? 'bg-brand-500/10 border-brand-500 text-brand-600 dark:text-brand-400 font-bold'
                                  : 'bg-surface border-line text-ink-3 hover:text-ink'
                              }`}
                            >
                              {alias}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Compact auto-expanding textarea */}
                      <textarea
                        ref={replyTextareaRef}
                        value={replyText}
                        onChange={(e) => handleReplyChange(e.target.value)}
                        placeholder="Write your reply... (Draft auto-saves)"
                        rows={3}
                        className="w-full p-3 rounded-xl bg-surface-2/60 border border-line text-xs text-ink placeholder:text-ink-4 focus:outline-none focus:ring-1 focus:ring-brand-500/40 resize-none font-sans"
                      />

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-ink-3">
                          Sent via Resend API with RFC-2822 reply headers.
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsReplyExpanded(false)}
                            className="px-3 py-1.5 rounded-xl border border-line hover:bg-surface-2 text-ink-3 hover:text-ink text-xs font-semibold cursor-pointer"
                          >
                            Collapse
                          </button>
                          <button
                            type="submit"
                            disabled={isSendingReply || !replyText.trim() || loadError}
                            className="h-8 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            {isSendingReply ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Send className="size-3.5" />
                            )}
                            <span>{isSendingReply ? 'Sending...' : 'Send Reply'}</span>
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 bg-surface">
              {/* Mobile back button header when no active thread is selected */}
              <div className="lg:hidden p-3 border-b border-line flex items-center gap-2 bg-surface shrink-0">
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="p-1.5 text-ink-3 hover:text-ink hover:bg-surface-2 rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 text-xs font-semibold"
                  title="Back to conversation list"
                >
                  <ArrowLeft className="size-4" />
                  <span>Back to list</span>
                </button>
              </div>
              <div className="flex-1 grid place-items-center p-8 text-center text-ink-3">
                <div className="space-y-3">
                  <Mail className="size-10 mx-auto opacity-30" />
                  <h4 className="text-sm font-bold text-ink">Select a conversation to read</h4>
                  <p className="text-xs">Or press &apos;New Message&apos; above to compose and dispatch an email.</p>
                  <button
                    type="button"
                    onClick={handleBackToList}
                    className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-surface-2 hover:bg-surface-3 text-xs font-semibold text-ink transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="size-3.5" />
                    <span>Return to conversation list</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FULL-WIDTH READING MODAL (Expand Button) */}
      {isExpandModalOpen && activeThread && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 lg:p-10 select-text">
          <div className="w-full max-w-4xl h-[90vh] bg-surface rounded-2xl border border-line flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-line flex items-center justify-between bg-surface-2/60 shrink-0">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-ink truncate leading-tight">
                  {activeThread.subject || '(No Subject)'}
                </h3>
                <p className="text-xs text-ink-3 truncate mt-0.5">
                  Participants: {formatParticipants(activeThread)} · {activeThread.messageCount} messages
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsExpandModalOpen(false)}
                className="p-1.5 rounded-lg border border-line text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
                title="Close full view (Esc)"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Messages View */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 [scrollbar-width:thin]">
              {activeThread.messages.map((msg) => {
                const isOutbound = msg.direction === 'outbound' || msg.folder === 'sent';
                return (
                  <div
                    key={msg.id}
                    className={`rounded-2xl border p-5 space-y-3 ${
                      isOutbound ? 'border-emerald-500/30 bg-emerald-500/[0.02]' : 'border-line bg-surface'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-line/60 pb-3 text-xs">
                      <div>
                        <span className="font-bold text-ink">
                          {isOutbound ? 'You (Sent)' : msg.from?.name || msg.from?.email}
                        </span>
                        <span className="text-ink-3 ml-2">&lt;{msg.from?.email}&gt;</span>
                      </div>
                      <span className="text-ink-3 font-mono text-[11px]">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <SanitizedEmailBody html={msg.htmlBody} text={msg.textBody || msg.body} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* COMPOSE NEW EMAIL MODAL DIALOG */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-text">
          <div className="rounded-2xl border border-line bg-surface max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-3.5 border-b border-line flex items-center justify-between bg-surface-2/50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 grid place-items-center">
                  <Send className="size-3.5" />
                </div>
                <h3 className="text-sm font-bold text-ink">Compose New Email</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsComposeOpen(false)}
                className="p-1 rounded-lg text-ink-3 hover:text-ink transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitCompose} className="p-5 space-y-4 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-ink-3 uppercase tracking-wider">
                  From (Sender Identity)
                </label>
                <input
                  type="text"
                  value={composeFrom}
                  onChange={(e) => setComposeFrom(e.target.value)}
                  placeholder="Md Zahid Hasan <hello@zahidp.com>"
                  required
                  className="w-full h-9 px-3 rounded-xl bg-surface-2 border border-line text-xs font-mono text-ink placeholder:text-ink-4 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-ink-3 uppercase tracking-wider mb-1">
                  To (Recipient Email)
                </label>
                <input
                  type="email"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  placeholder="client@example.com"
                  required
                  className="w-full h-9 px-3 rounded-xl bg-surface-2 border border-line text-xs font-medium text-ink placeholder:text-ink-4 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-ink-3 uppercase tracking-wider mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Subject line"
                  required
                  className="w-full h-9 px-3 rounded-xl bg-surface-2 border border-line text-xs font-medium text-ink placeholder:text-ink-4 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-ink-3 uppercase tracking-wider mb-1">
                  Message Body
                </label>
                <textarea
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder="Write your email message..."
                  rows={6}
                  required
                  className="w-full p-3 rounded-xl bg-surface-2 border border-line text-xs text-ink placeholder:text-ink-4 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none font-sans"
                />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-line">
                <span className="text-[11px] text-ink-3 flex items-center gap-1">
                  <span>Delivered via Resend</span>
                  <ExternalLink className="size-3" />
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsComposeOpen(false)}
                    className="h-9 px-4 rounded-xl border border-line hover:bg-surface-2 text-ink-3 hover:text-ink text-xs font-semibold cursor-pointer"
                  >
                    Discard
                  </button>

                  <button
                    type="submit"
                    disabled={isSendingCompose || !composeTo || !composeSubject || !composeBody || loadError}
                    className="h-9 px-5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSendingCompose ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Send className="size-3.5" />
                    )}
                    <span>{isSendingCompose ? 'Sending...' : 'Send Message'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
