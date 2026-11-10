'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { MailThread, MailFolder } from '@/types/mail';

export interface FolderCounts {
  inbox: number;
  unread: number;
  unofficial: number;
  unofficialUnread: number;
  sent: number;
  starred: number;
  archive: number;
  trash: number;
  official?: number;
}

interface InboxContextType {
  threads: MailThread[];
  activeThreadId: string | null;
  activeThread: MailThread | null;
  folder: MailFolder;
  searchQuery: string;
  selectedAlias: string;
  mailCategory: 'official' | 'temp' | 'all';
  unreadThreadCount: number;
  counts: FolderCounts;
  isLoading: boolean;
  isSyncing: boolean;
  loadError: boolean;
  defaultSender: string;
  lastSyncedAt: Date | null;
  page: number;
  totalPages: number;
  totalCount: number;

  // Setters
  setActiveThreadId: (id: string | null) => void;
  setFolder: (folder: MailFolder) => void;
  setSearchQuery: (query: string) => void;
  setSelectedAlias: (alias: string) => void;
  setMailCategory: (category: 'official' | 'temp' | 'all') => void;
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;

  // Operations
  fetchThreads: (forceSync?: boolean) => Promise<void>;
  markThreadRead: (threadId: string, isRead: boolean) => Promise<void>;
  toggleThreadStar: (threadId: string, isStarred: boolean) => Promise<void>;
  moveThread: (threadId: string, targetFolder: MailFolder) => Promise<void>;
  deleteThreadById: (threadId: string, permanent?: boolean) => Promise<void>;
  emptyTrashAction: () => Promise<void>;
  sendReply: (params: {
    threadId: string;
    to: string;
    subject: string;
    body: string;
    inReplyTo?: string;
    references?: string[];
    from?: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

const InboxContext = createContext<InboxContextType | undefined>(undefined);

export const InboxProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [threads, setThreads] = useState<MailThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [folder, setFolder] = useState<MailFolder>('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlias, setSelectedAlias] = useState<string>('all');
  const [mailCategory, setMailCategory] = useState<'official' | 'temp' | 'all'>('official');
  const [unreadThreadCount, setUnreadThreadCount] = useState<number>(0);
  const [counts, setCounts] = useState<FolderCounts>({
    inbox: 0,
    unread: 0,
    unofficial: 0,
    unofficialUnread: 0,
    sent: 0,
    starred: 0,
    archive: 0,
    trash: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [defaultSender, setDefaultSender] = useState<string>('Md Zahid Hasan <hello@zahidp.com>');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  // Pagination states (25 threads per page)
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [folder, searchQuery, selectedAlias, mailCategory]);

  // 1. Initial status fetch (for defaultSender & initial unread count)
  useEffect(() => {
    async function loadStatus() {
      try {
        const res = await fetch('/api/mail/status');
        if (res.ok) {
          const data = await res.json();
          if (data.defaultSender) setDefaultSender(data.defaultSender);
          if (typeof data.unreadCount === 'number') setUnreadThreadCount(data.unreadCount);
        }
      } catch {
        // non-blocking
      }
    }
    loadStatus();
  }, []);

  // 2. Main fetch function (reads from Supabase paginated, never polls Resend automatically)
  const fetchThreads = useCallback(
    async (forceSync = false) => {
      if (forceSync) setIsSyncing(true);
      else if (threads.length === 0) setIsLoading(true);

      try {
        const params = new URLSearchParams();
        if (folder) params.set('folder', folder);
        if (searchQuery.trim()) params.set('search', searchQuery.trim());
        if (selectedAlias && selectedAlias !== 'all') params.set('alias', selectedAlias.trim());
        if (mailCategory) params.set('category', mailCategory);
        if (forceSync) params.set('forceSync', 'true');
        params.set('page', String(page));
        params.set('limit', '25');

        const res = await fetch(`/api/mail/messages?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        if (data.success && Array.isArray(data.threads)) {
          setThreads(data.threads);
          if (typeof data.unreadCount === 'number') setUnreadThreadCount(data.unreadCount);
          if (data.counts) setCounts(data.counts);
          if (typeof data.totalPages === 'number') setTotalPages(data.totalPages);
          if (typeof data.totalCount === 'number') setTotalCount(data.totalCount);
          setLoadError(false);
          setLastSyncedAt(new Date());
        }
      } catch (err) {
        console.warn('[InboxContext] Fetch threads error:', err);
        setLoadError(true);
      } finally {
        setIsLoading(false);
        setIsSyncing(false);
      }
    },
    [folder, searchQuery, selectedAlias, mailCategory, page, threads.length]
  );

  // Re-fetch on filter or page change
  useEffect(() => {
    fetchThreads(false);
  }, [fetchThreads]);

  // 4. Derive active thread
  const activeThread = useMemo(() => {
    if (!activeThreadId) return null;
    return threads.find((t) => t.id === activeThreadId) || null;
  }, [threads, activeThreadId]);

  // 4b. On-demand load full message bodies for the active thread view
  useEffect(() => {
    if (!activeThreadId) return;
    const thread = threads.find((t) => t.id === activeThreadId);
    if (!thread) return;

    const needsBodies = thread.messages.some((m) => !m.htmlBody && !m.textBody && !m.body);
    if (needsBodies) {
      fetch(`/api/mail/messages?threadId=${encodeURIComponent(activeThreadId)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.thread) {
            setThreads((prev) =>
              prev.map((t) => (t.id === activeThreadId ? data.thread : t))
            );
          }
        })
        .catch((err) => {
          console.warn('[InboxContext] Failed to fetch thread bodies:', err);
        });
    }
  }, [activeThreadId, threads]);

  const nextPage = useCallback(() => {
    setPage((p) => Math.min(totalPages, p + 1));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPage((p) => Math.max(1, p - 1));
  }, []);

  // 5. Auto-mark thread as read after 500ms of viewing
  useEffect(() => {
    if (!activeThreadId) return;
    const thread = threads.find((t) => t.id === activeThreadId);
    if (!thread || !thread.hasUnread) return;

    const timeout = setTimeout(() => {
      markThreadRead(activeThreadId, true);
    }, 500);

    return () => clearTimeout(timeout);
  }, [activeThreadId, threads]); // eslint-disable-line react-hooks/exhaustive-deps

  // 6. Optimistic Mark as Read / Unread
  const markThreadRead = useCallback(
    async (threadId: string, isRead: boolean) => {
      // Optimistic update
      setThreads((prev) =>
        prev.map((t) => {
          if (t.id !== threadId) return t;
          return {
            ...t,
            hasUnread: !isRead,
            messages: t.messages.map((m) => ({
              ...m,
              isRead,
              readAt: isRead ? m.readAt || new Date().toISOString() : undefined,
            })),
          };
        })
      );

      setUnreadThreadCount((prev) => {
        if (isRead) return Math.max(0, prev - 1);
        return prev + 1;
      });

      setCounts((prev) => ({
        ...prev,
        unread: isRead ? Math.max(0, prev.unread - 1) : prev.unread + 1,
      }));

      try {
        const res = await fetch('/api/mail/messages', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ threadId, isRead }),
        });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.unreadCount === 'number') setUnreadThreadCount(data.unreadCount);
          if (data.counts) setCounts(data.counts);
        }
      } catch (err) {
        console.warn('[InboxContext] markThreadRead server sync failed:', err);
      }
    },
    []
  );

  // 7. Optimistic Toggle Star
  const toggleThreadStar = useCallback(
    async (threadId: string, isStarred: boolean) => {
      setThreads((prev) =>
        prev.map((t) => {
          if (t.id !== threadId) return t;
          return {
            ...t,
            isStarred,
            messages: t.messages.map((m) => ({ ...m, isStarred })),
          };
        })
      );

      setCounts((prev) => ({
        ...prev,
        starred: isStarred ? prev.starred + 1 : Math.max(0, prev.starred - 1),
      }));

      try {
        const res = await fetch('/api/mail/messages', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ threadId, isStarred }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.counts) setCounts(data.counts);
        }
      } catch (err) {
        console.warn('[InboxContext] toggleThreadStar server sync failed:', err);
      }
    },
    []
  );

  // 8. Optimistic Move (Archive, Trash, Inbox)
  const moveThread = useCallback(
    async (threadId: string, targetFolder: MailFolder) => {
      // Optimistic remove from current view if folder differs
      setThreads((prev) => {
        if (folder === targetFolder) return prev;
        return prev.filter((t) => t.id !== threadId);
      });

      if (activeThreadId === threadId) {
        setActiveThreadId(null);
      }

      try {
        const res = await fetch('/api/mail/messages', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ threadId, folder: targetFolder }),
        });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.unreadCount === 'number') setUnreadThreadCount(data.unreadCount);
          if (data.counts) setCounts(data.counts);
        }
      } catch (err) {
        console.warn('[InboxContext] moveThread server sync failed:', err);
      }
    },
    [folder, activeThreadId]
  );

  // 9. Optimistic Delete (Trash or Permanent)
  const deleteThreadById = useCallback(
    async (threadId: string, permanent = false) => {
      setThreads((prev) => prev.filter((t) => t.id !== threadId));
      if (activeThreadId === threadId) {
        setActiveThreadId(null);
      }

      try {
        const params = new URLSearchParams({
          threadId,
          permanent: permanent ? 'true' : 'false',
        });
        const res = await fetch(`/api/mail/messages?${params.toString()}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.unreadCount === 'number') setUnreadThreadCount(data.unreadCount);
          if (data.counts) setCounts(data.counts);
        }
      } catch (err) {
        console.warn('[InboxContext] deleteThreadById server sync failed:', err);
      }
    },
    [activeThreadId]
  );

  // 10. Empty Trash
  const emptyTrashAction = useCallback(async () => {
    try {
      const res = await fetch('/api/mail/messages?emptyTrash=true', { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        if (folder === 'trash') setThreads([]);
        if (data.counts) setCounts(data.counts);
      }
    } catch (err) {
      console.warn('[InboxContext] emptyTrashAction failed:', err);
    }
  }, [folder]);

  // 11. Send Reply
  const sendReply = useCallback(
    async (params: {
      threadId: string;
      to: string;
      subject: string;
      body: string;
      inReplyTo?: string;
      references?: string[];
      from?: string;
    }): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch('/api/mail/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          return { success: false, error: data.error || 'Failed to send reply' };
        }

        // Refetch to pull the newly inserted sent message and refresh the thread
        await fetchThreads(false);
        return { success: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Network error';
        return { success: false, error: msg };
      }
    },
    [fetchThreads]
  );

  const value = useMemo(
    () => ({
      threads,
      activeThreadId,
      activeThread,
      folder,
      searchQuery,
      selectedAlias,
      mailCategory,
      unreadThreadCount,
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
      setMailCategory,
      setPage,
      nextPage,
      prevPage,
      fetchThreads,
      markThreadRead,
      toggleThreadStar,
      moveThread,
      deleteThreadById,
      emptyTrashAction,
      sendReply,
    }),
    [
      threads,
      activeThreadId,
      activeThread,
      folder,
      searchQuery,
      selectedAlias,
      mailCategory,
      unreadThreadCount,
      counts,
      isLoading,
      isSyncing,
      loadError,
      defaultSender,
      lastSyncedAt,
      page,
      totalPages,
      totalCount,
      setPage,
      nextPage,
      prevPage,
      fetchThreads,
      markThreadRead,
      toggleThreadStar,
      moveThread,
      deleteThreadById,
      emptyTrashAction,
      sendReply,
    ]
  );

  return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>;
};

export function useInbox(): InboxContextType {
  const context = useContext(InboxContext);
  if (!context) {
    throw new Error('useInbox must be used within an InboxProvider');
  }
  return context;
}
