'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Inbox,
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
} from 'lucide-react';
import { MailMessage, MailFolder } from '@/types/mail';

export const InboxTab: React.FC = () => {
  const [folder, setFolder] = useState<MailFolder>('inbox');
  const [mobileView, setMobileView] = useState<'list' | 'message'>('list');
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Quick reply state
  const [quickReplyText, setQuickReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Compose Modal state
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeFrom, setComposeFrom] = useState('Md Zahid Hasan <hello@zahidp.com>');
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [isSendingCompose, setIsSendingCompose] = useState(false);

  // Fetch messages from API
  const fetchMessages = useCallback(async (currentFolder = folder, query = searchQuery) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentFolder) params.set('folder', currentFolder);
      if (query.trim()) params.set('search', query.trim());

      const res = await fetch(`/api/mail/messages?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setUnreadCount(data.unreadCount || 0);

        // Auto select first message if none selected
        if (!selectedMessageId && data.messages?.length > 0) {
          setSelectedMessageId(data.messages[0].id);
        } else if (selectedMessageId) {
          // If selected message is not in new list, reset or select first
          const exists = data.messages?.some((m: MailMessage) => m.id === selectedMessageId);
          if (!exists && data.messages?.length > 0) {
            setSelectedMessageId(data.messages[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [folder, searchQuery, selectedMessageId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const selectedMessage = messages.find((m) => m.id === selectedMessageId) || null;

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
        setUnreadCount(data.unreadCount ?? unreadCount);
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
        setMessages((prev) =>
          prev.map((m) => (m.id === message.id ? { ...m, isStarred: newStarred } : m))
        );
      }
    } catch {
      // ignore
    }
  };

  // Move to Trash or Restore
  const handleMoveToTrash = async (message: MailMessage) => {
    const isAlreadyTrash = message.folder === 'trash';
    try {
      if (isAlreadyTrash) {
        // Permanent delete
        const res = await fetch(`/api/mail/messages?id=${message.id}&permanent=true`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setMessages((prev) => prev.filter((m) => m.id !== message.id));
          setSelectedMessageId(null);
          setStatusMessage({ type: 'success', text: 'Message deleted permanently.' });
        }
      } else {
        // Move to trash
        const res = await fetch('/api/mail/messages', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: message.id, folder: 'trash' }),
        });
        if (res.ok) {
          setMessages((prev) => prev.filter((m) => m.id !== message.id));
          setSelectedMessageId(null);
          setStatusMessage({ type: 'success', text: 'Message moved to Trash.' });
        }
      }
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {
      // ignore
    }
  };

  // Select a message and mark as read
  const handleSelectMessage = (msg: MailMessage) => {
    setSelectedMessageId(msg.id);
    setMobileView('message');
    if (!msg.isRead) {
      handleToggleRead(msg);
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

    try {
      const res = await fetch('/api/mail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipient,
          subject: replySubject,
          text: quickReplyText.trim(),
          from: 'Md Zahid Hasan <hello@zahidp.com>',
          replyTo: 'hello@zahidp.com',
        }),
      });

      const data = await res.json();
      setIsSendingReply(false);

      if (data.success) {
        setQuickReplyText('');
        setStatusMessage({
          type: 'success',
          text: `Reply dispatched via Resend to ${recipient}!`,
        });
        // Refresh sent
        fetchMessages(folder);
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

    try {
      const res = await fetch('/api/mail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: composeFrom,
          to: composeTo.trim(),
          subject: composeSubject.trim(),
          text: composeBody.trim(),
          replyTo: 'hello@zahidp.com',
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
          text: `Email successfully delivered to ${composeTo} via Resend!`,
        });
        // Switch to Sent folder to view sent message
        setFolder('sent');
        fetchMessages('sent');
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
          {(['inbox', 'starred', 'sent', 'trash'] as MailFolder[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                setFolder(f);
                fetchMessages(f);
                setMobileView('list');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize flex items-center gap-1.5 transition-colors cursor-pointer ${
                folder === f
                  ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold border border-brand-500/20'
                  : 'text-ink-3 hover:text-ink hover:bg-surface-2'
              }`}
            >
              <span>{f}</span>
              {f === 'inbox' && unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-brand-500 text-white">
                  {unreadCount}
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
                  fetchMessages('inbox');
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  folder === 'inbox'
                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                    : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Inbox className="size-4" />
                  <span>Inbox</span>
                </div>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-500 text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setFolder('starred');
                  fetchMessages('starred');
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  folder === 'starred'
                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                    : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Star className="size-4 text-amber-500" />
                  <span>Starred</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFolder('sent');
                  fetchMessages('sent');
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  folder === 'sent'
                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                    : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Send className="size-4 text-emerald-500" />
                  <span>Sent</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFolder('trash');
                  fetchMessages('trash');
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  folder === 'trash'
                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                    : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Trash2 className="size-4 text-rose-500" />
                  <span>Trash</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Resend Connection Info */}
          <div className="pt-3 border-t border-line text-[11px] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink-3">Resend Status</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-[10px] text-ink-3 truncate">
              Domain: <span className="font-mono text-ink">zahidp.com</span>
            </p>
            <p className="text-[10px] text-ink-3 truncate">
              Sender: <span className="text-ink">hello@zahidp.com</span>
            </p>
          </div>
        </div>

        {/* PANE 2: Message List */}
        <div
          className={`w-full md:w-72 xl:w-80 shrink-0 flex flex-col bg-surface-2/30 ${
            mobileView === 'message' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Search bar */}
          <div className="p-3 border-b border-line flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  fetchMessages(folder, e.target.value);
                }}
                placeholder="Search subject or sender..."
                className="w-full h-8 pl-8 pr-3 rounded-lg bg-surface border border-line text-xs text-ink placeholder:text-ink-4 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <button
              type="button"
              onClick={() => fetchMessages(folder, searchQuery)}
              className="p-1.5 rounded-lg border border-line text-ink-3 hover:text-ink hover:bg-surface transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
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
                <p className="text-[11px] opacity-75">All clear!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isSelected = selectedMessageId === msg.id;
                const formattedDate = new Date(msg.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <div
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg)}
                    className={`p-3.5 transition-all cursor-pointer relative ${
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

                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {msg.tags?.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-surface-2 border border-line text-ink-3"
                          >
                            {t}
                          </span>
                        ))}
                      </div>

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
                  <button
                    type="button"
                    onClick={() => handleToggleStar(selectedMessage)}
                    className="p-2 rounded-lg border border-line text-ink-3 hover:text-amber-500 hover:bg-surface-2 transition-colors cursor-pointer"
                    title={selectedMessage.isStarred ? 'Unstar' : 'Star'}
                  >
                    <Star className={`size-4 ${selectedMessage.isStarred ? 'fill-amber-400 text-amber-500' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleRead(selectedMessage)}
                    className="p-2 rounded-lg border border-line text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
                    title={selectedMessage.isRead ? 'Mark as Unread' : 'Mark as Read'}
                  >
                    {selectedMessage.isRead ? <Mail className="size-4" /> : <MailCheck className="size-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMoveToTrash(selectedMessage)}
                    className="p-2 rounded-lg border border-line text-ink-3 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title={selectedMessage.folder === 'trash' ? 'Delete permanently' : 'Move to Trash'}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              {/* Message Content View */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-line/60 text-xs text-ink-3">
                  <div>
                    To: <span className="font-medium text-ink">Md Zahid Hasan &lt;hello@zahidp.com&gt;</span>
                  </div>
                  {selectedMessage.resendId && (
                    <div className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Resend ID: {selectedMessage.resendId.substring(0, 16)}...
                    </div>
                  )}
                </div>

                <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-ink leading-relaxed whitespace-pre-wrap">
                  {selectedMessage.body}
                </div>
              </div>

              {/* Quick Reply Box */}
              {selectedMessage.folder !== 'trash' && (
                <div className="p-4 border-t border-line bg-surface-2/40">
                  <form onSubmit={handleSendQuickReply} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                        <CornerUpLeft className="size-3.5 text-brand-500" />
                        <span>Reply to {selectedMessage.from.name || selectedMessage.from.email}</span>
                      </label>
                      <span className="text-[11px] text-ink-3">
                        Sending from <strong className="text-ink">hello@zahidp.com</strong> via Resend
                      </span>
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
                        Enter sends email directly to recipient inbox.
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
              <div>
                <label className="block text-[11px] font-semibold text-ink-3 uppercase tracking-wider mb-1">
                  From (Verified Domain: zahidp.com)
                </label>
                <select
                  value={composeFrom}
                  onChange={(e) => setComposeFrom(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-surface-2 border border-line text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                >
                  <option value="Md Zahid Hasan <hello@zahidp.com>">Md Zahid Hasan &lt;hello@zahidp.com&gt;</option>
                  <option value="Md Zahid Hasan <contact@zahidp.com>">Md Zahid Hasan &lt;contact@zahidp.com&gt;</option>
                  <option value="Md Zahid Hasan <zahid@zahidp.com>">Md Zahid Hasan &lt;zahid@zahidp.com&gt;</option>
                  <option value="FolioFrame <onboarding@resend.dev>">FolioFrame &lt;onboarding@resend.dev&gt; (Testing Sandbox)</option>
                </select>
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
                  <span>Powered by Resend API</span>
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

