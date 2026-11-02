'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { supabase } from '@/lib/supabase/client';
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
  AtSign,
  Check,
  Lock,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { MailMessage, MailFolder } from '@/types/mail';

interface FolderCounts {
  inbox: number;
  unread: number;
  sent: number;
  starred: number;
  archive: number;
  trash: number;
  official?: number;
  temp?: number;
}

const LOCKED_OFFICIAL_ALIASES = [
  { id: 'all', label: 'All Official (Locked)', alias: 'all' },
  { id: 'hello', label: 'hello@zahidp.com', alias: 'hello@zahidp.com' },
  { id: 'test', label: 'test@zahidp.com', alias: 'test@zahidp.com' },
  { id: 'contact', label: 'contact@zahidp.com', alias: 'contact@zahidp.com' },
  { id: 'support', label: 'support@zahidp.com', alias: 'support@zahidp.com' },
  { id: 'reply', label: 'reply@zahidp.com', alias: 'reply@zahidp.com' },
  { id: 'noreply', label: 'noreply@zahidp.com', alias: 'noreply@zahidp.com' },
] as const;

export const InboxTab: React.FC = () => {
  const [folder, setFolder] = useState<MailFolder>('inbox');
  const [mobileView, setMobileView] = useState<'list' | 'message'>('list');
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlias, setSelectedAlias] = useState<string>('all');
  const [mailCategory, setMailCategory] = useState<'official' | 'temp' | 'all'>('official');
  const [counts, setCounts] = useState<FolderCounts>({
    inbox: 0,
    unread: 0,
    sent: 0,
    starred: 0,
    archive: 0,
    trash: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Quick reply state
  const [quickReplyText, setQuickReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replyFrom, setReplyFrom] = useState('Md Zahid Hasan <hello@zahidp.com>');
  const [isEditingReplyFrom, setIsEditingReplyFrom] = useState(false);
  const [isSavingSenderDefault, setIsSavingSenderDefault] = useState(false);

  // Compose Modal state
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeFrom, setComposeFrom] = useState('Md Zahid Hasan <hello@zahidp.com>');
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [isSendingCompose, setIsSendingCompose] = useState(false);

  // Fetch dynamic default sender configuration
  useEffect(() => {
    fetch('/api/mail/status')
      .then((res) => res.json())
      .then((data) => {
        if (data?.defaultSender) {
          setComposeFrom(data.defaultSender);
          setReplyFrom(data.defaultSender);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch messages from API
  const fetchMessages = useCallback(
    async (
      currentFolder = folder,
      query = searchQuery,
      alias = selectedAlias,
      category = mailCategory,
      forceSync = false
    ) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (currentFolder) params.set('folder', currentFolder);
        if (query.trim()) params.set('search', query.trim());
        if (alias && alias !== 'all') params.set('alias', alias.trim());
        if (category) params.set('category', category);
        if (forceSync) params.set('forceSync', 'true');

        const res = await fetch(`/api/mail/messages?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const msgs: MailMessage[] = data.messages || [];
          setMessages(msgs);
          if (data.counts) {
            setCounts(data.counts);
          }

          // Auto select first message if none selected
          if (!selectedMessageId && msgs.length > 0) {
            setSelectedMessageId(msgs[0].id);
          } else if (selectedMessageId) {
            const exists = msgs.some((m) => m.id === selectedMessageId);
            if (!exists && msgs.length > 0) {
              setSelectedMessageId(msgs[0].id);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [folder, searchQuery, selectedAlias, mailCategory, selectedMessageId]
  );

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime Supabase Subscription for incoming emails & status updates
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('placeholder.supabase.co')) return;

    try {
      const channel = supabase
        .channel('realtime_inbox_messages')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'inbox_messages' },
          () => {
            fetchMessages(folder, searchQuery, selectedAlias);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (e) {
      console.warn('Realtime subscription not available:', e);
    }
  }, [fetchMessages, folder, searchQuery, selectedAlias]);



  // Sync from Resend Receiving API
  const handleSyncResend = async () => {
    setIsSyncing(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/mail/backfill', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: `Synced ${data.count} emails from Resend Receiving!`,
        });
        fetchMessages(folder, searchQuery, selectedAlias);
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Failed to sync from Resend.',
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error syncing from Resend',
      });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const selectedMessage = messages.find((m) => m.id === selectedMessageId) || null;

  // Whenever a new message is selected, automatically update replyFrom to match the recipient alias if it's @zahidp.com
  useEffect(() => {
    if (selectedMessage && selectedMessage.to && selectedMessage.to.length > 0) {
      const recipientEmail = selectedMessage.to[0].email;
      if (recipientEmail && recipientEmail.includes('@zahidp.com')) {
        setReplyFrom(`Md Zahid Hasan <${recipientEmail}>`);
      }
    }
  }, [selectedMessage]);

  // Toggle Read
  const handleToggleRead = async (message: MailMessage, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newStatus = !message.isRead;
    try {
      const res = await fetch('/api/mail/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: message.id, isRead: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, isRead: newStatus } : m)));
        if (data.counts) setCounts(data.counts);
      }
    } catch {
      // ignore
    }
  };

  // Toggle Star
  const handleToggleStar = async (message: MailMessage, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newStarred = !message.isStarred;
    try {
      const res = await fetch('/api/mail/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: message.id, isStarred: newStarred }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) =>
          prev.map((m) => (m.id === message.id ? { ...m, isStarred: newStarred } : m))
        );
        if (data.counts) setCounts(data.counts);
      }
    } catch {
      // ignore
    }
  };

  // Toggle Archive
  const handleToggleArchive = async (message: MailMessage, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isCurrentlyArchived = message.folder === 'archive' || message.isArchived;
    const targetFolder = isCurrentlyArchived ? 'inbox' : 'archive';
    try {
      const res = await fetch('/api/mail/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: message.id,
          folder: targetFolder,
          isArchived: !isCurrentlyArchived,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => prev.filter((m) => m.id !== message.id));
        if (selectedMessageId === message.id) {
          setSelectedMessageId(null);
        }
        if (data.counts) setCounts(data.counts);
        setStatusMessage({
          type: 'success',
          text: isCurrentlyArchived ? 'Message moved to Inbox.' : 'Message archived.',
        });
      }
    } catch {
      // ignore
    }
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Move to Trash or Permanent Delete
  const handleMoveToTrash = async (message: MailMessage, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isAlreadyTrash = message.folder === 'trash' || message.isTrashed;
    try {
      if (isAlreadyTrash) {
        // Permanent delete
        const res = await fetch(`/api/mail/messages?id=${message.id}&permanent=true`, {
          method: 'DELETE',
        });
        if (res.ok) {
          const data = await res.json();
          setMessages((prev) => prev.filter((m) => m.id !== message.id));
          if (selectedMessageId === message.id) setSelectedMessageId(null);
          if (data.counts) setCounts(data.counts);
          setStatusMessage({ type: 'success', text: 'Message deleted permanently from Supabase.' });
        }
      } else {
        // Move to trash
        const res = await fetch('/api/mail/messages', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: message.id, folder: 'trash', isTrashed: true }),
        });
        if (res.ok) {
          const data = await res.json();
          setMessages((prev) => prev.filter((m) => m.id !== message.id));
          if (selectedMessageId === message.id) setSelectedMessageId(null);
          if (data.counts) setCounts(data.counts);
          setStatusMessage({ type: 'success', text: 'Message moved to Trash.' });
        }
      }
    } catch {
      // ignore
    }
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Empty Trash
  const handleEmptyTrash = async () => {
    if (!window.confirm('Are you sure you want to permanently delete all messages in Trash?')) return;
    try {
      const res = await fetch('/api/mail/messages?emptyTrash=true', { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        setMessages([]);
        setSelectedMessageId(null);
        if (data.counts) setCounts(data.counts);
        setStatusMessage({
          type: 'success',
          text: `Emptied trash (${data.removedCount} messages removed).`,
        });
      }
    } catch {
      // ignore
    }
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Select a message and mark as read
  const handleSelectMessage = (msg: MailMessage) => {
    setSelectedMessageId(msg.id);
    setMobileView('message');
    if (!msg.isRead) {
      handleToggleRead(msg);
    }
  };

  // Save customized sender as system default in Supabase
  const handleSaveSenderAsDefault = async (senderToSave: string) => {
    setIsSavingSenderDefault(true);
    try {
      const res = await fetch('/api/mail/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultSender: senderToSave }),
      });
      if (res.ok) {
        setStatusMessage({
          type: 'success',
          text: `Default sender saved to Supabase: ${senderToSave}`,
        });
      }
    } catch {
      // ignore
    } finally {
      setIsSavingSenderDefault(false);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // Quick Reply handler
  const handleSendQuickReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage || !quickReplyText.trim()) return;

    setIsSendingReply(true);
    setStatusMessage(null);

    const recipient = selectedMessage.replyTo || selectedMessage.from.email;
    const replySubject = selectedMessage.subject.startsWith('Re:')
      ? selectedMessage.subject
      : `Re: ${selectedMessage.subject}`;

    const inReplyTo =
      selectedMessage.headers?.['message-id'] ||
      selectedMessage.headers?.['Message-ID'] ||
      (selectedMessage.resendId ? `<${selectedMessage.resendId}@resend.com>` : undefined);
    const references = selectedMessage.headers?.references || inReplyTo;

    const senderEmailOnly = (replyFrom.match(/<(.+?)>/)?.[1] || replyFrom.trim() || 'hello@zahidp.com');

    try {
      const res = await fetch('/api/mail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipient,
          subject: replySubject,
          text: quickReplyText.trim(),
          from: replyFrom.trim() || 'Md Zahid Hasan <hello@zahidp.com>',
          replyTo: senderEmailOnly,
          inReplyTo,
          references,
        }),
      });

      const data = await res.json();
      setIsSendingReply(false);

      if (data.success) {
        setQuickReplyText('');
        setStatusMessage({
          type: 'success',
          text: `Reply dispatched from ${senderEmailOnly} to ${recipient}!`,
        });
        fetchMessages(folder, searchQuery, selectedAlias);
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Failed to send reply via Resend.',
        });
      }
    } catch (err) {
      setIsSendingReply(false);
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Network error sending email.',
      });
    }

    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Compose Send handler
  const handleSendCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) return;

    setIsSendingCompose(true);
    setStatusMessage(null);

    const senderEmailOnly = composeFrom.match(/<(.+?)>/)?.[1] || composeFrom.trim() || 'hello@zahidp.com';

    try {
      const res = await fetch('/api/mail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: composeFrom.trim() || 'Md Zahid Hasan <hello@zahidp.com>',
          to: composeTo.trim(),
          subject: composeSubject.trim(),
          text: composeBody.trim(),
          replyTo: senderEmailOnly,
        }),
      });

      const data = await res.json();
      setIsSendingCompose(false);

      if (data.success) {
        setIsComposeOpen(false);
        setComposeTo('');
        setComposeSubject('');
        setComposeBody('');
        setStatusMessage({
          type: 'success',
          text: `Email delivered to ${composeTo} via Resend!`,
        });
        setFolder('sent');
        fetchMessages('sent', '', selectedAlias);
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Failed to deliver email.',
        });
      }
    } catch (err) {
      setIsSendingCompose(false);
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error sending email',
      });
    }

    setTimeout(() => setStatusMessage(null), 5000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] sm:h-[calc(100vh-8.5rem)] rounded-2xl border border-line bg-surface overflow-hidden shadow-xs">
      {/* Toast Feedback */}
      {statusMessage && (
        <div
          className={`px-4 py-2 text-xs font-semibold flex items-center justify-between border-b ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <AlertCircle className="size-4" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button type="button" onClick={() => setStatusMessage(null)} className="opacity-70 hover:opacity-100">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Mobile/Tablet Folder Selector Bar (< lg) */}
      <div className="lg:hidden p-2.5 border-b border-line bg-surface flex items-center justify-between gap-2 overflow-x-auto shrink-0">
        <div className="flex items-center gap-1.5 shrink-0">
          {(['inbox', 'starred', 'sent', 'archive', 'trash'] as MailFolder[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                setFolder(f);
                fetchMessages(f, searchQuery, selectedAlias);
                setMobileView('list');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize flex items-center gap-1.5 transition-colors cursor-pointer ${
                folder === f
                  ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold border border-brand-500/20'
                  : 'text-ink-3 hover:text-ink hover:bg-surface-2'
              }`}
            >
              <span>{f}</span>
              {f === 'inbox' && counts.unread > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-brand-500 text-white">
                  {counts.unread}
                </span>
              )}
              {f === 'archive' && counts.archive > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-surface-2 text-ink-3">
                  {counts.archive}
                </span>
              )}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIsComposeOpen(true)}
          className="h-7.5 px-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
        >
          <Plus className="size-3.5" />
          <span className="hidden xs:inline">Compose</span>
        </button>
      </div>

      {/* 3-Column Split Interface */}
      <div className="flex flex-1 min-h-0 divide-x divide-line">
        {/* PANE 1: Folder Navigation & Actions (Desktop only >= lg) */}
        <div className="hidden lg:flex w-48 xl:w-52 shrink-0 bg-surface flex-col justify-between p-3.5">
          <div className="space-y-4">
            {/* Compose Button */}
            <button
              type="button"
              onClick={() => setIsComposeOpen(true)}
              className="w-full h-10 px-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="size-4" />
              <span>Compose Email</span>
            </button>

            {/* Folder List */}
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setFolder('inbox');
                  setMailCategory('official');
                  fetchMessages('inbox', searchQuery, selectedAlias, 'official');
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  folder === 'inbox' && mailCategory === 'official'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30'
                    : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="size-4 text-emerald-500" />
                  <span>Official Inbox</span>
                </div>
                {counts.unread > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white">
                    {counts.unread}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setFolder('inbox');
                  setMailCategory('temp');
                  fetchMessages('inbox', searchQuery, 'all', 'temp');
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  folder === 'inbox' && mailCategory === 'temp'
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30'
                    : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Zap className="size-4 text-amber-500" />
                  <span>Temp Mail Vault</span>
                </div>
                {typeof counts.temp === 'number' && counts.temp > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-500">
                    {counts.temp}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setFolder('starred');
                  fetchMessages('starred', searchQuery, selectedAlias);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  folder === 'starred'
                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold'
                    : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Star className="size-4 text-amber-500" />
                  <span>Starred</span>
                </div>
                {counts.starred > 0 && (
                  <span className="text-[10px] text-ink-3 font-semibold">{counts.starred}</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setFolder('sent');
                  fetchMessages('sent', searchQuery, selectedAlias);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  folder === 'sent'
                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold'
                    : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Send className="size-4 text-emerald-500" />
                  <span>Sent</span>
                </div>
                {counts.sent > 0 && (
                  <span className="text-[10px] text-ink-3 font-semibold">{counts.sent}</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setFolder('archive');
                  fetchMessages('archive', searchQuery, selectedAlias);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  folder === 'archive'
                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold'
                    : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Archive className="size-4 text-indigo-500" />
                  <span>Archive</span>
                </div>
                {counts.archive > 0 && (
                  <span className="text-[10px] text-ink-3 font-semibold">{counts.archive}</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setFolder('trash');
                  fetchMessages('trash', searchQuery, selectedAlias);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  folder === 'trash'
                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold'
                    : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Trash2 className="size-4 text-rose-500" />
                  <span>Trash</span>
                </div>
                {counts.trash > 0 && (
                  <span className="text-[10px] text-ink-3 font-semibold">{counts.trash}</span>
                )}
              </button>
            </nav>
          </div>

          {/* Resend Connection Info & Sender Setup */}
          <div className="pt-3 border-t border-line text-[11px] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink-3">Resend Receiving</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] text-ink-3 truncate">
                Domain: <span className="font-mono text-ink">zahidp.com</span>
              </p>
              <p className="text-[10px] text-ink-3 truncate" title="Catch-all enabled: Any address @zahidp.com works">
                Catch-all: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">*@zahidp.com</span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleSyncResend}
              disabled={isSyncing}
              className="w-full mt-1.5 h-7.5 px-2.5 rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink-2 hover:text-ink text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`size-3 ${isSyncing ? 'animate-spin text-brand-500' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync from Resend'}</span>
            </button>
          </div>
        </div>

        {/* PANE 2: Message List & Alias Filter */}
        <div
          className={`w-full md:w-80 xl:w-96 shrink-0 flex flex-col bg-surface-2/30 ${
            mobileView === 'message' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Search bar & Refresh */}
          <div className="p-3 border-b border-line space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    fetchMessages(folder, e.target.value, selectedAlias);
                  }}
                  placeholder="Search subject, sender, alias..."
                  className="w-full h-8 pl-8 pr-3 rounded-lg bg-surface border border-line text-xs text-ink placeholder:text-ink-4 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <button
                type="button"
                onClick={() => fetchMessages(folder, searchQuery, selectedAlias)}
                className="p-1.5 rounded-lg border border-line text-ink-3 hover:text-ink hover:bg-surface transition-colors cursor-pointer shrink-0"
                title="Refresh messages"
              >
                <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              {folder === 'trash' && messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleEmptyTrash}
                  className="p-1.5 rounded-lg border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                  title="Empty Trash"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>

            {/* Alias Switcher & Locked Official Pill Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 text-[11px] no-scrollbar">
              <div className="flex items-center gap-1 text-ink-3 shrink-0 mr-0.5">
                <Lock className="size-3 text-emerald-500" />
                <span className="text-[10px] font-semibold uppercase text-emerald-600 dark:text-emerald-400">Locked:</span>
              </div>
              {LOCKED_OFFICIAL_ALIASES.map((al) => {
                const isActive = selectedAlias === al.alias && mailCategory === 'official';
                return (
                  <button
                    key={al.id}
                    type="button"
                    onClick={() => {
                      setSelectedAlias(al.alias);
                      setMailCategory('official');
                      fetchMessages(folder, searchQuery, al.alias, 'official');
                    }}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono whitespace-nowrap transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                      isActive
                        ? 'bg-emerald-600 text-white font-bold shadow-xs'
                        : 'bg-surface border border-line text-ink-3 hover:text-ink hover:border-emerald-500/40'
                    }`}
                  >
                    {al.id !== 'all' && <Lock className="size-2.5 opacity-60" />}
                    <span>{al.id === 'all' ? 'All Official' : al.id}</span>
                  </button>
                );
              })}
              <div className="h-3 w-px bg-line shrink-0 mx-0.5" />
              <button
                type="button"
                onClick={() => {
                  const nextCat = mailCategory === 'temp' ? 'official' : 'temp';
                  setMailCategory(nextCat);
                  fetchMessages(folder, searchQuery, 'all', nextCat);
                }}
                className={`px-2 py-0.5 rounded-md text-[10px] font-mono whitespace-nowrap transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                  mailCategory === 'temp'
                    ? 'bg-amber-500 text-black font-bold shadow-xs'
                    : 'bg-surface border border-amber-500/30 text-amber-500 hover:bg-amber-500/10'
                }`}
              >
                <Zap className="size-2.5" />
                <span>Temp Mail {typeof counts.temp === 'number' && counts.temp > 0 ? `(${counts.temp})` : ''}</span>
              </button>
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-line/60">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-ink-3 flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin text-brand-500" />
                <span>Loading emails...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="p-8 text-center text-xs text-ink-3 space-y-1">
                <Mail className="size-6 mx-auto opacity-30" />
                <p className="font-semibold">No messages in {folder}</p>
                <p className="text-[11px] opacity-75">
                  {selectedAlias !== 'all' ? `Filtered by ${selectedAlias}` : 'All clear!'}
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isSelected = selectedMessageId === msg.id;
                const formattedDate = new Date(msg.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                });
                const recipientEmail = msg.to?.[0]?.email || 'hello@zahidp.com';

                return (
                  <div
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg)}
                    className={`p-3.5 transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-brand-500/10 border-l-2 border-brand-500'
                        : msg.isRead
                        ? 'bg-surface hover:bg-surface-2/60'
                        : 'bg-surface-2/80 hover:bg-surface-2'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        {!msg.isRead && (
                          <span className="size-2 rounded-full bg-brand-500 shrink-0" />
                        )}
                        <span className={`text-xs truncate ${!msg.isRead ? 'font-bold text-ink' : 'font-medium text-ink-2'}`}>
                          {msg.from.name || msg.from.email}
                        </span>
                      </div>
                      <span className="text-[10px] text-ink-3 shrink-0 font-medium">
                        {formattedDate}
                      </span>
                    </div>

                    <h4 className={`text-xs truncate mb-1 ${!msg.isRead ? 'font-bold text-ink' : 'font-medium text-ink-2'}`}>
                      {msg.subject}
                    </h4>

                    <p className="text-[11px] text-ink-3 line-clamp-2 leading-relaxed">
                      {msg.snippet || msg.body}
                    </p>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      {/* Alias pill & tags */}
                      <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                        {msg.tags?.includes('Temp Mail') || recipientEmail.toLowerCase().includes('tmp_') ? (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 truncate"
                            title={`Delivered to disposable address: ${recipientEmail}`}
                          >
                            <Zap className="size-2.5 shrink-0" />
                            temp: {recipientEmail.split('@')[0]}
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 truncate"
                            title={`Official locked address: ${recipientEmail}`}
                          >
                            <Lock className="size-2.5 shrink-0" />
                            to: {recipientEmail.split('@')[0]}
                          </span>
                        )}
                        {msg.folder === 'archive' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            Archived
                          </span>
                        )}
                        {msg.tags?.slice(0, 1).map((t) => (
                          <span
                            key={t}
                            className="hidden xs:inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold bg-surface-2 border border-line text-ink-3 truncate"
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      {/* Row Hover Actions (Star, Archive, Trash) */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleToggleArchive(msg, e)}
                          className="opacity-0 group-hover:opacity-100 text-ink-4 hover:text-indigo-500 p-0.5 rounded transition-opacity"
                          title={msg.folder === 'archive' ? 'Move to Inbox' : 'Archive'}
                        >
                          {msg.folder === 'archive' ? (
                            <ArchiveRestore className="size-3.5" />
                          ) : (
                            <Archive className="size-3.5" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleMoveToTrash(msg, e)}
                          className="opacity-0 group-hover:opacity-100 text-ink-4 hover:text-rose-500 p-0.5 rounded transition-opacity"
                          title={msg.folder === 'trash' ? 'Delete permanently' : 'Move to Trash'}
                        >
                          <Trash2 className="size-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleToggleStar(msg, e)}
                          className="text-ink-4 hover:text-amber-500 p-0.5 rounded transition-colors"
                          title={msg.isStarred ? 'Unstar' : 'Star'}
                        >
                          <Star className={`size-3.5 ${msg.isStarred ? 'fill-amber-400 text-amber-500' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* PANE 3: Reading Pane & Quick Reply (Flexible Width) */}
        <div
          className={`flex-1 flex flex-col min-w-0 bg-surface ${
            mobileView === 'list' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {selectedMessage ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Header Toolbar */}
              <div className="p-3 sm:p-4 border-b border-line flex items-center justify-between gap-3 bg-surface">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => setMobileView('list')}
                    className="md:hidden p-1.5 -ml-1 text-ink-3 hover:text-ink hover:bg-surface-2 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Back to messages list"
                  >
                    <ArrowLeft className="size-4" />
                  </button>

                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-ink truncate leading-tight">
                      {selectedMessage.subject}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-ink-3">
                      <span className="font-semibold text-ink truncate">{selectedMessage.from.name}</span>
                      <span className="truncate">&lt;{selectedMessage.from.email}&gt;</span>
                      <span className="hidden sm:inline">·</span>
                      <span className="hidden sm:inline">{new Date(selectedMessage.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Archive Action */}
                  <button
                    type="button"
                    onClick={() => handleToggleArchive(selectedMessage)}
                    className="p-2 rounded-lg border border-line text-ink-3 hover:text-indigo-500 hover:bg-indigo-500/10 transition-colors cursor-pointer"
                    title={selectedMessage.folder === 'archive' ? 'Move to Inbox' : 'Archive message'}
                  >
                    {selectedMessage.folder === 'archive' ? (
                      <ArchiveRestore className="size-4" />
                    ) : (
                      <Archive className="size-4" />
                    )}
                  </button>

                  {/* Star Action */}
                  <button
                    type="button"
                    onClick={() => handleToggleStar(selectedMessage)}
                    className="p-2 rounded-lg border border-line text-ink-3 hover:text-amber-500 hover:bg-surface-2 transition-colors cursor-pointer"
                    title={selectedMessage.isStarred ? 'Unstar' : 'Star'}
                  >
                    <Star className={`size-4 ${selectedMessage.isStarred ? 'fill-amber-400 text-amber-500' : ''}`} />
                  </button>

                  {/* Read / Unread */}
                  <button
                    type="button"
                    onClick={() => handleToggleRead(selectedMessage)}
                    className="p-2 rounded-lg border border-line text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
                    title={selectedMessage.isRead ? 'Mark as Unread' : 'Mark as Read'}
                  >
                    {selectedMessage.isRead ? <Mail className="size-4" /> : <MailCheck className="size-4" />}
                  </button>

                  {/* Delete / Trash */}
                  <button
                    type="button"
                    onClick={() => handleMoveToTrash(selectedMessage)}
                    className="p-2 rounded-lg border border-line text-ink-3 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title={selectedMessage.folder === 'trash' ? 'Delete permanently from Supabase' : 'Move to Trash'}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              {/* Message Content View */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-line/60 text-xs text-ink-3">
                  <div className="flex items-center gap-1.5">
                    <span>Delivered To:</span>
                    <span className="font-mono font-medium text-ink bg-surface-2 px-2 py-0.5 rounded border border-line">
                      {selectedMessage.to?.map((t) => t.email || t.name).join(', ') || 'hello@zahidp.com'}
                    </span>
                  </div>
                  {selectedMessage.resendId && (
                    <div className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Resend: {selectedMessage.resendId.substring(0, 16)}...
                    </div>
                  )}
                </div>

                {/* Sanitized HTML Body with fallback to Text Body */}
                {selectedMessage.htmlBody ? (
                  <div
                    className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-ink leading-relaxed overflow-x-auto bg-surface p-4 rounded-xl border border-line/60 shadow-xs"
                    dangerouslySetInnerHTML={{
                      __html: typeof window !== 'undefined' ? DOMPurify.sanitize(selectedMessage.htmlBody) : selectedMessage.htmlBody,
                    }}
                  />
                ) : (
                  <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-ink leading-relaxed whitespace-pre-wrap">
                    {selectedMessage.textBody || selectedMessage.body}
                  </div>
                )}

                {/* Attachments if present */}
                {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                  <div className="pt-3 border-t border-line/60 space-y-2">
                    <span className="text-[11px] font-semibold text-ink-3 flex items-center gap-1.5">
                      <Paperclip className="size-3.5 text-brand-500" />
                      <span>Attachments ({selectedMessage.attachments.length})</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedMessage.attachments.map((att, idx) => (
                        <div
                          key={att.id || idx}
                          className="px-2.5 py-1.5 rounded-lg border border-line bg-surface-2/80 text-xs flex items-center gap-2"
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
                              className="text-brand-500 hover:underline text-[10px]"
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

              {/* Quick Reply Box */}
              {selectedMessage.folder !== 'trash' && (
                <div className="p-4 border-t border-line bg-surface-2/40">
                  <form onSubmit={handleSendQuickReply} className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                        <CornerUpLeft className="size-3.5 text-brand-500" />
                        <span>Reply to {selectedMessage.from.name || selectedMessage.from.email}</span>
                      </label>

                      {/* Dynamic Any @zahidp.com Sender Identity Customizer */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-ink-3">
                        <span className="font-semibold text-ink-2">From:</span>
                        {isEditingReplyFrom ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={replyFrom}
                              onChange={(e) => setReplyFrom(e.target.value)}
                              placeholder="e.g. anything@zahidp.com"
                              className="h-6 px-2 text-xs font-mono rounded bg-surface border border-brand-500 text-ink focus:outline-none w-56 sm:w-64"
                            />
                            <button
                              type="button"
                              onClick={() => setIsEditingReplyFrom(false)}
                              className="p-1 rounded bg-brand-500 text-white hover:bg-brand-600 transition-colors"
                              title="Done"
                            >
                              <Check className="size-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setIsEditingReplyFrom(true)}
                              className="font-mono text-ink hover:text-brand-500 underline decoration-dotted cursor-pointer transition-colors"
                              title="Click to type ANY @zahidp.com sender identity"
                            >
                              {replyFrom || 'hello@zahidp.com'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsEditingReplyFrom(true)}
                              className="text-[10px] text-brand-500 hover:underline cursor-pointer"
                            >
                              Change
                            </button>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleSaveSenderAsDefault(replyFrom)}
                          disabled={isSavingSenderDefault}
                          className="text-[9.5px] text-ink-4 hover:text-ink hover:underline cursor-pointer ml-1"
                          title="Save this sender address as system default in Supabase"
                        >
                          {isSavingSenderDefault ? 'Saving...' : 'Set as default'}
                        </button>
                      </div>
                    </div>

                    {/* Quick Alias Chips for Quick Reply */}
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-[10px] text-ink-4 font-semibold uppercase">Preset Aliases:</span>
                      {[
                        selectedMessage.to?.[0]?.email || 'hello@zahidp.com',
                        'hello@zahidp.com',
                        'test@zahidp.com',
                        'contact@zahidp.com',
                        'admin@zahidp.com',
                        'support@zahidp.com',
                      ]
                        .filter((v, i, a) => a.indexOf(v) === i)
                        .map((alias) => (
                          <button
                            key={alias}
                            type="button"
                            onClick={() => setReplyFrom(`Md Zahid Hasan <${alias}>`)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer border ${
                              replyFrom.includes(alias)
                                ? 'bg-brand-500/10 border-brand-500 text-brand-600 dark:text-brand-400 font-bold'
                                : 'bg-surface border-line text-ink-3 hover:text-ink'
                            }`}
                          >
                            {alias.split('@')[0]}
                          </button>
                        ))}
                    </div>

                    <textarea
                      value={quickReplyText}
                      onChange={(e) => setQuickReplyText(e.target.value)}
                      placeholder="Type your response here..."
                      rows={3}
                      className="w-full p-3 rounded-xl bg-surface border border-line text-xs text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-none"
                    />

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-ink-3">
                        Dispatches via Resend API to recipient inbox with reply threading.
                      </span>

                      <button
                        type="submit"
                        disabled={isSendingReply || !quickReplyText.trim()}
                        className="btn btn-primary h-8 px-4 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isSendingReply ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Send className="size-3.5" />
                        )}
                        <span>{isSendingReply ? 'Sending via Resend...' : 'Send Reply'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 grid place-items-center p-8 text-center text-ink-3">
              <div className="space-y-2">
                <Mail className="size-10 mx-auto opacity-30" />
                <h4 className="text-sm font-bold text-ink">Select an email to read</h4>
                <p className="text-xs">Or click Compose above to write and dispatch a new message.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* COMPOSE MODAL DIALOG */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="card-raised rounded-2xl border border-line bg-surface max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-4 sm:px-5 py-3.5 border-b border-line flex items-center justify-between bg-surface-2/50 shrink-0">
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

            {/* Compose Form */}
            <form onSubmit={handleSendCompose} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold text-ink-3 uppercase tracking-wider">
                    From (Sender Identity - Any @zahidp.com)
                  </label>
                  <span className="text-[10px] text-ink-4 flex items-center gap-1 font-mono">
                    <AtSign className="size-3" />
                    zahidp.com
                  </span>
                </div>
                <input
                  type="text"
                  value={composeFrom}
                  onChange={(e) => setComposeFrom(e.target.value)}
                  placeholder="e.g. anything@zahidp.com or Md Zahid Hasan <anything@zahidp.com>"
                  required
                  className="w-full h-9 px-3 rounded-xl bg-surface-2 border border-line text-xs font-mono text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-ink-4 uppercase font-semibold">Presets:</span>
                  {[
                    'Md Zahid Hasan <hello@zahidp.com>',
                    'Md Zahid Hasan <test@zahidp.com>',
                    'Md Zahid Hasan <contact@zahidp.com>',
                    'Md Zahid Hasan <admin@zahidp.com>',
                    'Md Zahid Hasan <support@zahidp.com>',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setComposeFrom(preset)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono border transition-colors cursor-pointer ${
                        composeFrom === preset
                          ? 'bg-brand-500/10 border-brand-500 text-brand-600 dark:text-brand-400 font-bold'
                          : 'bg-surface border-line text-ink-3 hover:text-ink'
                      }`}
                    >
                      {preset.match(/<(.+?)>/)?.[1] || preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-ink-3 uppercase tracking-wider mb-1">
                  To (Recipient Email)
                </label>
                <input
                  type="email"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  placeholder="recipient@example.com"
                  required
                  className="w-full h-9 px-3 rounded-xl bg-surface-2 border border-line text-xs font-medium text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
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
                  className="w-full h-9 px-3 rounded-xl bg-surface-2 border border-line text-xs font-medium text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
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
                  className="w-full p-3 rounded-xl bg-surface-2 border border-line text-xs text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-none font-sans"
                />
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex items-center justify-between border-t border-line">
                <span className="text-[11px] text-ink-3 flex items-center gap-1">
                  <span>Delivered via Resend</span>
                  <ExternalLink className="size-3" />
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsComposeOpen(false)}
                    className="btn btn-secondary h-9 px-4 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Discard
                  </button>

                  <button
                    type="submit"
                    disabled={isSendingCompose || !composeTo || !composeSubject || !composeBody}
                    className="btn btn-primary h-9 px-5 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
