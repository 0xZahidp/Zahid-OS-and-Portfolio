'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Smartphone,
  Monitor,
  Link2,
  Plus,
  Search,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Edit3,
  Power,
  RotateCw,
  QrCode,
  Flame,
  FileText,
  Clock,
  Radio,
  X,
  Shuffle,
  Settings as SettingsIcon,
  Code2,
  Play,
  Pause,
  ChevronLeft,
  Wifi,
  Battery,
  Lock,
  Unlock,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { ShortLink, ZahidOsAppId, ZahidOsSettings } from '@/types/os';

interface SnippetItem {
  id: string;
  title: string;
  language: string;
  description: string;
  code: string;
}

export const ZahidOsTab: React.FC = () => {
  // Viewport mode: 'canvas' (spacious desktop app drawer, default) vs 'iphone' (phone preview)
  const [viewMode, setViewMode] = useState<'canvas' | 'iphone'>('canvas');

  // Active Open App: null means Springboard / App Drawer
  const [openApp, setOpenApp] = useState<ZahidOsAppId | null>(null);

  // Time state for iOS status bar & clock widget
  const [currentTime, setCurrentTime] = useState<string>('09:41');

  // Short links state
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'inactive'>('all');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Link editor modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOriginalUrl, setFormOriginalUrl] = useState<string>('');
  const [formSlug, setFormSlug] = useState<string>('');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [isSubmittingLink, setIsSubmittingLink] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Quick shorten bar on dashboard
  const [quickUrl, setQuickUrl] = useState<string>('');
  const [isQuickShortening, setIsQuickShortening] = useState<boolean>(false);

  // QR Target
  const [customQrUrl, setCustomQrUrl] = useState<string>('');

  // Delete Link Confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Notes / Scratchpad state
  const [scratchpadNote, setScratchpadNote] = useState<string>('');
  const [scratchpadSaved, setScratchpadSaved] = useState<boolean>(false);

  // Snippets state
  const [snippets, setSnippets] = useState<SnippetItem[]>([]);
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);

  // Focus Clock state
  const [focusSecondsLeft, setFocusSecondsLeft] = useState<number>(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // OS Settings state
  const [osSettings, setOsSettings] = useState<ZahidOsSettings>({
    is_public_enabled: false,
    public_hero_title: 'Zahid OS',
    public_hero_subtitle: 'Cloud tools, web utilities & micro-apps designed by 0xZahidP',
    wallpaper: 'emerald-mesh',
    sound_effects: true,
    app_permissions: {
      shortener: { is_public: true, name: 'Shortener' },
      qr: { is_public: true, name: 'QR Studio' },
      notes: { is_public: false, name: 'Notes' },
      snippets: { is_public: true, name: 'Snippets' },
      focus: { is_public: true, name: 'Focus Clock' },
      settings: { is_public: false, name: 'Settings' },
    },
  });
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);
  const [settingsSaveSuccess, setSettingsSaveSuccess] = useState<boolean>(false);

  // Clock ticker
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch short links and OS settings on mount
  const loadData = async () => {
    try {
      setIsLoadingLinks(true);
      const [linksRes, settingsRes] = await Promise.all([
        fetch('/api/os/short-links'),
        fetch('/api/os/settings'),
      ]);

      if (linksRes.ok) {
        const linksData = await linksRes.json();
        setLinks(linksData.links || []);
      }

      if (settingsRes.ok) {
        const settsData = await settingsRes.json();
        if (settsData.settings) {
          setOsSettings(settsData.settings);
        }
      }
    } catch (err) {
      console.warn('Error loading Zahid OS data:', err);
    } finally {
      setIsLoadingLinks(false);
    }
  };

  useEffect(() => {
    loadData();

    if (typeof window !== 'undefined') {
      const savedNote = localStorage.getItem('zahid_os_scratchpad') || '';
      setScratchpadNote(savedNote);
    }

    setSnippets([
      {
        id: 'snip-1',
        title: 'Supabase Service Role Client',
        language: 'TypeScript',
        description: 'Bypasses client AAL2 restrictions safely on server',
        code: `import { createClient } from '@supabase/supabase-js';\n\nexport const supabaseAdmin = createClient(\n  process.env.NEXT_PUBLIC_SUPABASE_URL!,\n  process.env.SUPABASE_SERVICE_ROLE_KEY!,\n  { auth: { persistSession: false, autoRefreshToken: false } }\n);`,
      },
      {
        id: 'snip-2',
        title: '307 Temporary Redirect Engine',
        language: 'TypeScript',
        description: 'Next.js App Router click-tracking redirect',
        code: `import { NextRequest, NextResponse } from 'next/server';\n\nexport async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {\n  const { slug } = await params;\n  return NextResponse.redirect(new URL('/destination', req.url), 307);\n}`,
      },
      {
        id: 'snip-3',
        title: 'iOS Squircle Card CSS',
        language: 'CSS',
        description: 'Apple-styled continuous curvature corner glass',
        code: `.ios-squircle {\n  border-radius: 22.37%;\n  backdrop-filter: blur(24px);\n  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);\n}`,
      },
    ]);
  }, []);

  // Pomodoro countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTimerRunning && focusSecondsLeft > 0) {
      timer = setInterval(() => {
        setFocusSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (focusSecondsLeft === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, focusSecondsLeft]);

  const currentOrigin =
    typeof window !== 'undefined' ? window.location.origin : 'https://0xZahidP.com';

  const totalClicks = useMemo(
    () => links.reduce((acc, l) => acc + (l.clicks || 0), 0),
    [links]
  );
  const activeCount = useMemo(
    () => links.filter((l) => l.is_active !== false).length,
    [links]
  );

  const filteredLinks = useMemo(() => {
    return links.filter((link) => {
      if (filterMode === 'active' && !link.is_active) return false;
      if (filterMode === 'inactive' && link.is_active) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        link.slug.toLowerCase().includes(q) ||
        link.title.toLowerCase().includes(q) ||
        link.original_url.toLowerCase().includes(q)
      );
    });
  }, [links, filterMode, searchQuery]);

  const handleSaveScratchpad = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('zahid_os_scratchpad', scratchpadNote);
      setScratchpadSaved(true);
      setTimeout(() => setScratchpadSaved(false), 2000);
    }
  };

  const handleCopyLink = (slug: string) => {
    const fullUrl = `${currentOrigin}/s/${slug}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    }
  };

  const handleCopySnippet = (id: string, code: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedSnippetId(id);
      setTimeout(() => setCopiedSnippetId(null), 2000);
    }
  };

  // Quick shorten directly from dashboard
  const handleQuickShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUrl.trim()) return;

    setIsQuickShortening(true);
    try {
      const res = await fetch('/api/os/short-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_url: quickUrl.trim(),
          title: 'Quick Link',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setLinks(data.links || []);
        setQuickUrl('');
        setCopiedSlug(data.link?.slug || null);
        setTimeout(() => setCopiedSlug(null), 2500);
      }
    } catch (err) {
      console.warn('Quick shorten failed:', err);
    } finally {
      setIsQuickShortening(false);
    }
  };

  // Link form handlers
  const handleOpenCreateLink = () => {
    setEditingId(null);
    setFormOriginalUrl('');
    setFormSlug('');
    setFormTitle('');
    setFormDescription('');
    setFormIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditLink = (link: ShortLink) => {
    setEditingId(link.id);
    setFormOriginalUrl(link.original_url);
    setFormSlug(link.slug);
    setFormTitle(link.title);
    setFormDescription(link.description || '');
    setFormIsActive(link.is_active !== false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleRandomSlug = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let res = '';
    for (let i = 0; i < 5; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormSlug(res);
  };

  const handleSubmitLinkForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formOriginalUrl.trim()) {
      setFormError('Destination URL is required.');
      return;
    }
    setIsSubmittingLink(true);
    setFormError(null);

    try {
      const res = await fetch('/api/os/short-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId || undefined,
          slug: formSlug.trim() || undefined,
          original_url: formOriginalUrl.trim(),
          title: formTitle.trim() || formSlug.trim() || 'Link',
          description: formDescription.trim(),
          is_active: formIsActive,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error || 'Failed to save short link.');
        setIsSubmittingLink(false);
        return;
      }

      setLinks(data.links || []);
      setIsModalOpen(false);
      setIsSubmittingLink(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Network error saving link');
      setIsSubmittingLink(false);
    }
  };

  const handleToggleActive = async (link: ShortLink) => {
    try {
      const newStatus = !link.is_active;
      setLinks((prev) =>
        prev.map((l) => (l.id === link.id ? { ...l, is_active: newStatus } : l))
      );
      await fetch('/api/os/short-links', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: link.id, is_active: newStatus }),
      });
    } catch {
      loadData();
    }
  };

  const handleDeleteLink = async (id: string) => {
    try {
      setLinks((prev) => prev.filter((l) => l.id !== id));
      setDeletingId(null);
      await fetch(`/api/os/short-links?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch {
      loadData();
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    setSettingsSaveSuccess(false);
    try {
      const res = await fetch('/api/os/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(osSettings),
      });
      if (res.ok) {
        setSettingsSaveSuccess(true);
        setTimeout(() => setSettingsSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.warn('Failed to save OS settings:', err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const wallpaperClass = useMemo(() => {
    switch (osSettings.wallpaper) {
      case 'ios-midnight':
        return 'from-slate-950 via-indigo-950 to-neutral-950';
      case 'cupertino-blue':
        return 'from-blue-950 via-sky-950 to-slate-950';
      case 'cyber-dark':
        return 'from-zinc-950 via-neutral-900 to-black';
      case 'emerald-mesh':
      default:
        return 'from-emerald-950 via-teal-950 to-slate-950';
    }
  }, [osSettings.wallpaper]);

  const apps = [
    {
      id: 'shortener' as ZahidOsAppId,
      name: 'Shortener',
      subtitle: 'URL Routing Engine',
      badge: `${links.length}`,
      gradient: 'from-cyan-500 via-blue-600 to-indigo-600',
      icon: Link2,
      inDock: true,
    },
    {
      id: 'qr' as ZahidOsAppId,
      name: 'QR Studio',
      subtitle: 'Vector Matrix Code',
      badge: undefined,
      gradient: 'from-fuchsia-500 via-purple-600 to-indigo-700',
      icon: QrCode,
      inDock: true,
    },
    {
      id: 'notes' as ZahidOsAppId,
      name: 'Notes',
      subtitle: 'Instant Scratchpad',
      badge: undefined,
      gradient: 'from-amber-400 via-amber-500 to-orange-600',
      icon: FileText,
      inDock: true,
    },
    {
      id: 'snippets' as ZahidOsAppId,
      name: 'Snippets',
      subtitle: 'Developer Cheat Sheet',
      badge: `${snippets.length}`,
      gradient: 'from-emerald-400 via-teal-500 to-emerald-700',
      icon: Code2,
      inDock: false,
    },
    {
      id: 'focus' as ZahidOsAppId,
      name: 'Focus',
      subtitle: 'Pomodoro Clock',
      badge: undefined,
      gradient: 'from-orange-500 via-rose-600 to-red-600',
      icon: Clock,
      inDock: false,
    },
    {
      id: 'settings' as ZahidOsAppId,
      name: 'Settings',
      subtitle: 'Zahid OS Controls',
      badge: undefined,
      gradient: 'from-slate-400 via-zinc-600 to-slate-800',
      icon: SettingsIcon,
      inDock: true,
    },
  ];

  // Render Inner Content of Selected App
  const renderAppContent = () => {
    switch (openApp) {
      case 'shortener':
        return (
          <div className="p-4 sm:p-7 space-y-6">
            {/* Header info with Desktop Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                  <Link2 className="size-5 text-cyan-400" />
                  <span>Link Shortener & Routing Engine</span>
                </h3>
                <p className="text-xs text-white/60 mt-0.5">
                  Manage redirects, track clicks, and generate branded short links.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenCreateLink}
                  className="h-9 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer"
                >
                  <Plus className="size-4" />
                  <span>New Short Link</span>
                </button>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[11px] text-white/60 block">Total Links</span>
                <span className="text-xl sm:text-2xl font-bold text-white font-mono mt-0.5 block">
                  {links.length}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[11px] text-white/60 block">Total Redirect Clicks</span>
                <span className="text-xl sm:text-2xl font-bold text-amber-400 font-mono mt-0.5 flex items-center gap-1.5">
                  <Flame className="size-4 fill-amber-400" />
                  <span>{totalClicks}</span>
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[11px] text-white/60 block">Active Status</span>
                <span className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono mt-0.5 block">
                  {activeCount}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[11px] text-white/60 block">Base URL</span>
                <span className="text-xs sm:text-sm font-semibold text-cyan-300 font-mono mt-1 block truncate">
                  /s/[slug]
                </span>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="relative w-full sm:max-w-md">
                <Search className="size-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter short links by slug, title, or target URL..."
                  className="w-full h-9 pl-9 pr-3 rounded-xl border border-white/10 bg-black/40 focus:bg-black/60 text-xs text-white placeholder:text-white/40 outline-hidden transition-all"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    filterMode === 'all'
                      ? 'bg-cyan-500 text-white shadow-xs'
                      : 'bg-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  All ({links.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('active')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    filterMode === 'active'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  Active ({activeCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('inactive')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    filterMode === 'inactive'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  Paused ({links.length - activeCount})
                </button>
              </div>
            </div>

            {/* Links List */}
            <div className="space-y-3">
              {filteredLinks.length === 0 ? (
                <div className="p-8 text-center text-white/50 text-xs bg-white/5 rounded-2xl border border-white/10">
                  No short links match your criteria.
                </div>
              ) : (
                filteredLinks.map((link) => {
                  const isCopied = copiedSlug === link.slug;

                  return (
                    <div
                      key={link.id}
                      className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-white">{link.title}</span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                              link.is_active !== false
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {link.is_active !== false ? 'Active' : 'Paused'}
                          </span>
                          <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded">
                            <Flame className="size-3 fill-amber-400" />
                            <span>{link.clicks || 0} clicks</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                          <span className="text-cyan-400 font-bold">
                            {currentOrigin}/s/{link.slug}
                          </span>
                          <span className="text-white/30">•</span>
                          <a
                            href={link.original_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/60 hover:text-white hover:underline truncate max-w-sm"
                          >
                            {link.original_url}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(link.slug)}
                          className="h-8 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          {isCopied ? (
                            <>
                              <Check className="size-3.5 text-emerald-400" />
                              <span className="text-emerald-300">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="size-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setCustomQrUrl(`${currentOrigin}/s/${link.slug}`);
                            setOpenApp('qr');
                          }}
                          className="size-8 rounded-lg bg-white/10 hover:bg-white/20 text-white grid place-items-center transition-colors cursor-pointer"
                          title="Generate QR code"
                        >
                          <QrCode className="size-4" />
                        </button>

                        <a
                          href={`/s/${link.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="size-8 rounded-lg bg-white/10 hover:bg-white/20 text-white grid place-items-center transition-colors cursor-pointer"
                          title="Test Redirect"
                        >
                          <ExternalLink className="size-4" />
                        </a>

                        <button
                          type="button"
                          onClick={() => handleToggleActive(link)}
                          className={`size-8 rounded-lg grid place-items-center transition-colors cursor-pointer ${
                            link.is_active !== false
                              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                          }`}
                          title={link.is_active !== false ? 'Pause link' : 'Activate link'}
                        >
                          <Power className="size-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditLink(link)}
                          className="size-8 rounded-lg bg-white/10 hover:bg-white/20 text-white grid place-items-center transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="size-4" />
                        </button>

                        {deletingId === link.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteLink(link.id)}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingId(null)}
                              className="size-7 rounded-lg bg-white/10 text-white text-xs grid place-items-center cursor-pointer"
                            >
                              <X className="size-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeletingId(link.id)}
                            className="size-8 rounded-lg bg-white/10 hover:bg-rose-500/20 text-white hover:text-rose-400 grid place-items-center transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );

      case 'qr':
        return (
          <div className="p-4 sm:p-7 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                  <QrCode className="size-5 text-purple-400" />
                  <span>QR Code Studio</span>
                </h3>
                <p className="text-xs text-white/60">
                  Generate vector QR matrix codes for links, Wi-Fi, or plain text.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Left Column: Form & Link Picker */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/80 block">
                    URL or Text to encode:
                  </label>
                  <input
                    type="text"
                    value={customQrUrl || (links[0] ? `${currentOrigin}/s/${links[0].slug}` : '')}
                    onChange={(e) => setCustomQrUrl(e.target.value)}
                    placeholder="https://0xZahidP.com"
                    className="w-full h-10 px-3 rounded-xl border border-white/10 bg-white/5 text-xs text-white outline-hidden font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/60 block">
                    Pick from Short Links:
                  </label>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {links.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => setCustomQrUrl(`${currentOrigin}/s/${l.slug}`)}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-all cursor-pointer ${
                          customQrUrl === `${currentOrigin}/s/${l.slug}`
                            ? 'border-purple-400 bg-purple-500/20 text-white font-semibold'
                            : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/70'
                        }`}
                      >
                        <span className="truncate">{l.title} (/s/{l.slug})</span>
                        <ArrowRight className="size-3.5 shrink-0 opacity-60" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: QR Code Display */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center space-y-4">
                <div className="p-4 bg-white rounded-2xl shadow-2xl inline-block border border-neutral-300">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                      customQrUrl || (links[0] ? `${currentOrigin}/s/${links[0].slug}` : currentOrigin)
                    )}`}
                    alt="QR Code"
                    className="size-52 object-contain rounded-lg"
                  />
                </div>

                <p className="font-mono text-xs text-purple-300 truncate max-w-xs">
                  {customQrUrl || currentOrigin}
                </p>

                <a
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
                    customQrUrl || (links[0] ? `${currentOrigin}/s/${links[0].slug}` : currentOrigin)
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 h-9 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-md cursor-pointer transition-all"
                >
                  <ExternalLink className="size-4" />
                  <span>Download High-Res Vector</span>
                </a>
              </div>
            </div>
          </div>
        );

      case 'notes':
        return (
          <div className="p-4 sm:p-7 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-amber-300 flex items-center gap-2">
                  <FileText className="size-5 text-amber-400" />
                  <span>Notes & Instant Scratchpad</span>
                </h3>
                <p className="text-xs text-white/60">
                  {scratchpadNote.trim()
                    ? `${scratchpadNote.trim().split(/\s+/).length} words • Saved locally`
                    : 'Blank notepad'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveScratchpad}
                className="h-8 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                {scratchpadSaved ? <Check className="size-3.5" /> : null}
                <span>{scratchpadSaved ? 'Saved to Browser!' : 'Save Note'}</span>
              </button>
            </div>

            <textarea
              value={scratchpadNote}
              onChange={(e) => setScratchpadNote(e.target.value)}
              placeholder="Jot down quick thoughts, project ideas, scratch code, or memos..."
              rows={16}
              className="w-full p-4 rounded-2xl border border-white/10 bg-amber-950/20 text-xs font-mono text-amber-100 placeholder:text-amber-200/30 outline-hidden leading-relaxed resize-y shadow-inner"
            />
          </div>
        );

      case 'snippets':
        return (
          <div className="p-4 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-emerald-400 flex items-center gap-2">
                  <Code2 className="size-5" />
                  <span>Developer Snippets & Cheat Sheet</span>
                </h3>
                <p className="text-xs text-white/60">
                  Quick production-tested code blocks ready to copy into projects.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {snippets.map((snip) => (
                <div
                  key={snip.id}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white block">{snip.title}</span>
                      <span className="text-[10px] text-emerald-400 font-mono px-2 py-0.5 rounded bg-emerald-500/10">
                        {snip.language}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/60">{snip.description}</p>
                  </div>

                  <pre className="p-3 rounded-xl bg-black/70 border border-white/5 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-48 leading-relaxed">
                    {snip.code}
                  </pre>

                  <button
                    type="button"
                    onClick={() => handleCopySnippet(snip.id, snip.code)}
                    className="w-full h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {copiedSnippetId === snip.id ? (
                      <>
                        <Check className="size-3.5 text-emerald-400" />
                        <span>Copied to Clipboard</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        <span>Copy Snippet</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'focus':
        const minutes = Math.floor(focusSecondsLeft / 60);
        const seconds = focusSecondsLeft % 60;
        const timeDisplay = `${minutes.toString().padStart(2, '0')}:${seconds
          .toString()
          .padStart(2, '0')}`;

        return (
          <div className="p-8 text-center space-y-6 max-w-md mx-auto">
            <div className="size-14 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 mx-auto grid place-items-center">
              <Clock className="size-7" />
            </div>

            <div>
              <h3 className="font-extrabold text-lg text-white">Pomodoro Focus Timer</h3>
              <p className="text-xs text-white/60 mt-0.5">Deep concentration session.</p>
            </div>

            <div className="size-56 rounded-full border-4 border-rose-500/30 mx-auto grid place-items-center bg-white/5 shadow-2xl">
              <span className="text-5xl font-black font-mono text-white tracking-wider">
                {timeDisplay}
              </span>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`h-11 px-7 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer transition-all ${
                  isTimerRunning
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                }`}
              >
                {isTimerRunning ? <Pause className="size-4" /> : <Play className="size-4" />}
                <span>{isTimerRunning ? 'Pause Session' : 'Start Focus'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsTimerRunning(false);
                  setFocusSecondsLeft(25 * 60);
                }}
                className="h-11 px-5 rounded-xl border border-white/20 hover:bg-white/10 text-white text-xs font-semibold cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="p-4 sm:p-7 space-y-6 text-left max-w-3xl mx-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                  <SettingsIcon className="size-5 text-slate-300" />
                  <span>Zahid OS System Controls</span>
                </h3>
                <p className="text-xs text-white/60">Configure public access and per-app visibility.</p>
              </div>

              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="h-9 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {settingsSaveSuccess ? <Check className="size-3.5" /> : null}
                <span>{settingsSaveSuccess ? 'Saved!' : isSavingSettings ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>

            {/* Public Access Master Switch */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {osSettings.is_public_enabled ? (
                    <Unlock className="size-5 text-emerald-400 shrink-0" />
                  ) : (
                    <Lock className="size-5 text-amber-400 shrink-0" />
                  )}
                  <div>
                    <span className="text-sm font-bold text-white block">
                      Public Access to Zahid OS (`/os`)
                    </span>
                    <span className="text-xs text-white/60 block">
                      {osSettings.is_public_enabled
                        ? 'Active: Public visitors can launch apps at /os'
                        : 'Disabled: Private developer mode (admin only)'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setOsSettings((prev) => ({
                      ...prev,
                      is_public_enabled: !prev.is_public_enabled,
                    }))
                  }
                  className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                    osSettings.is_public_enabled ? 'bg-emerald-500' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`size-5 rounded-full bg-white transition-transform absolute top-0.75 left-0.75 shadow-xs ${
                      osSettings.is_public_enabled ? 'translate-x-5.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {osSettings.is_public_enabled && (
                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="font-mono text-emerald-400">{currentOrigin}/os</span>
                  <a
                    href="/os"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-white hover:underline text-xs"
                  >
                    <span>Test Public OS</span>
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Per-App Permissions */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-white block">
                Individual App Permissions (Public vs Private)
              </label>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
                {(['shortener', 'qr', 'snippets', 'focus', 'notes'] as ZahidOsAppId[]).map(
                  (appKey) => {
                    const isPub = osSettings.app_permissions?.[appKey]?.is_public ?? false;

                    return (
                      <div
                        key={appKey}
                        className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                      >
                        <span className="text-white/80 capitalize font-medium text-xs">{appKey} App</span>

                        <button
                          type="button"
                          onClick={() => {
                            setOsSettings((prev) => ({
                              ...prev,
                              app_permissions: {
                                ...prev.app_permissions,
                                [appKey]: {
                                  ...prev.app_permissions[appKey],
                                  is_public: !isPub,
                                },
                              },
                            }));
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            isPub
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-white/10 text-white/50 border border-white/10'
                          }`}
                        >
                          {isPub ? '✓ Public' : 'Private (Admin Only)'}
                        </button>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* Wallpaper themes */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-white block">iOS Wallpaper Style</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'emerald-mesh', label: 'Emerald Mesh' },
                  { id: 'ios-midnight', label: 'Midnight Velvet' },
                  { id: 'cupertino-blue', label: 'Cupertino Blue' },
                  { id: 'cyber-dark', label: 'Cyber Dark' },
                ].map((wp) => (
                  <button
                    key={wp.id}
                    type="button"
                    onClick={() =>
                      setOsSettings((prev) => ({
                        ...prev,
                        wallpaper: wp.id as ZahidOsSettings['wallpaper'],
                      }))
                    }
                    className={`p-3 rounded-xl border text-xs font-medium text-center transition-all cursor-pointer ${
                      osSettings.wallpaper === wp.id
                        ? 'border-emerald-400 bg-emerald-500/20 text-white font-bold'
                        : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {wp.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Ribbon */}
      <div className="rounded-3xl border border-line bg-surface p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Radio className="size-3 animate-pulse text-emerald-500" />
              <span>Zahid OS 18</span>
            </span>
            <span className="text-xs font-mono text-ink-3">Springboard & App Drawer</span>
          </div>
          <h2 className="text-lg font-bold text-ink">Modular Personal OS & Tools</h2>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Mode Switcher */}
          <div className="p-1 rounded-xl bg-surface-2 border border-line flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('canvas')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'canvas'
                  ? 'bg-brand-500 text-white shadow-xs'
                  : 'text-ink-3 hover:text-ink'
              }`}
            >
              <Monitor className="size-3.5" />
              <span>App Drawer (Desktop)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('iphone')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'iphone'
                  ? 'bg-brand-500 text-white shadow-xs'
                  : 'text-ink-3 hover:text-ink'
              }`}
            >
              <Smartphone className="size-3.5" />
              <span>iPhone View</span>
            </button>
          </div>

          <button
            type="button"
            onClick={loadData}
            title="Reload OS Data"
            className="size-9 rounded-xl border border-line bg-surface hover:bg-surface-2 text-ink-2 grid place-items-center transition-colors cursor-pointer"
          >
            <RotateCw className={`size-4 ${isLoadingLinks ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mode A: Desktop Canvas (Spacious App Drawer Workspace) */}
      {viewMode === 'canvas' && (
        <div className="space-y-6">
          {/* If on App Drawer Home Screen (no app open) */}
          {!openApp ? (
            <div className="space-y-6">
              {/* App Drawer Launcher Grid */}
              <div className="rounded-3xl border border-line bg-gradient-to-b from-surface to-surface-2 p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-line">
                  <div>
                    <h3 className="font-extrabold text-base text-ink flex items-center gap-2">
                      <Layers className="size-4.5 text-brand-500" />
                      <span>Zahid OS Springboard</span>
                    </h3>
                    <p className="text-xs text-ink-3 mt-0.5">
                      Select an app to open its dedicated workspace.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-ink-3">{apps.length} Modular Apps</span>
                </div>

                {/* Big squircle desktop app drawer */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-5 sm:gap-6">
                  {apps.map((app) => {
                    const Icon = app.icon;

                    return (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => setOpenApp(app.id)}
                        className="group flex flex-col items-center gap-2.5 p-3 rounded-2xl hover:bg-surface-2/60 transition-all cursor-pointer text-center"
                      >
                        <div
                          className={`size-20 sm:size-22 rounded-[24%] bg-gradient-to-br ${app.gradient} shadow-xl shadow-black/20 flex items-center justify-center text-white transition-all transform duration-200 group-hover:scale-105 group-hover:-translate-y-1 group-active:scale-95 relative overflow-hidden`}
                        >
                          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                          <Icon className="size-9 drop-shadow-md" />
                          {app.badge && (
                            <span className="absolute top-1.5 right-1.5 px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold shadow-xs">
                              {app.badge}
                            </span>
                          )}
                        </div>

                        <div>
                          <span className="text-xs font-bold text-ink block group-hover:text-brand-500 transition-colors">
                            {app.name}
                          </span>
                          <span className="text-[10px] text-ink-4 block truncate max-w-[100px]">
                            {app.subtitle}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Action Widget: Instant Link Shorten Bar */}
              <div className="card-raised rounded-3xl border border-line bg-surface p-5 sm:p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-ink flex items-center gap-2">
                    <Link2 className="size-4 text-cyan-500" />
                    <span>Quick URL Shortener</span>
                  </span>
                  <p className="text-xs text-ink-3 mt-0.5">
                    Paste any destination URL to generate a shortcut in seconds.
                  </p>
                </div>

                <form onSubmit={handleQuickShorten} className="flex items-center gap-2 w-full md:max-w-md">
                  <input
                    type="text"
                    value={quickUrl}
                    onChange={(e) => setQuickUrl(e.target.value)}
                    placeholder="https://github.com/0xzahidp/my-repo"
                    className="flex-1 h-10 px-3.5 rounded-xl border border-line bg-surface-2 focus:bg-surface focus:border-brand-500 text-xs font-mono text-ink outline-hidden"
                  />
                  <button
                    type="submit"
                    disabled={isQuickShortening || !quickUrl.trim()}
                    className="h-10 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition-all shadow-sm shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {isQuickShortening ? 'Shortening...' : 'Shorten'}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            /* Open App Workspace in Desktop Mode */
            <div className="rounded-3xl border border-line bg-black shadow-2xl overflow-hidden relative">
              <div
                className={`absolute inset-0 bg-gradient-to-b ${wallpaperClass} transition-colors duration-500 -z-10`}
              />

              {/* Top Navigation Ribbon for Desktop App Window */}
              <div className="px-5 py-3.5 border-b border-white/10 bg-black/40 backdrop-blur-xl flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setOpenApp(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  <ChevronLeft className="size-4" />
                  <span>Back to App Drawer</span>
                </button>

                {/* Quick App Switcher Pills */}
                <div className="hidden sm:flex items-center gap-1">
                  {apps.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setOpenApp(a.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        openApp === a.id
                          ? 'bg-white/25 text-white'
                          : 'text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {a.name}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setOpenApp(null)}
                  className="size-7 rounded-xl bg-white/10 hover:bg-white/20 text-white grid place-items-center cursor-pointer text-xs"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Full Width App Workspace */}
              <div className="min-h-[560px] overflow-y-auto">{renderAppContent()}</div>
            </div>
          )}
        </div>
      )}

      {/* Mode B: iPhone View (Mobile Responsive Phone Chassis) */}
      {viewMode === 'iphone' && (
        <div className="flex justify-center items-center py-2 px-2">
          <div className="w-full max-w-[390px] min-h-[660px] max-h-[85vh] rounded-[48px] border-[6px] border-[#222326] shadow-2xl overflow-hidden bg-black relative flex flex-col justify-between select-none">
            <div
              className={`absolute inset-0 bg-gradient-to-b ${wallpaperClass} transition-colors duration-500 -z-10`}
            />

            {/* iOS Dynamic Island & Status Bar */}
            <div className="relative pt-2.5 px-6 pb-2 flex items-center justify-between text-white text-xs z-30 shrink-0">
              <span className="font-semibold text-xs tracking-tight font-sans pl-1">
                {currentTime}
              </span>
              <div className="w-26 h-6 bg-black rounded-full flex items-center justify-between px-3 shadow-inner">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="size-2.5 rounded-full bg-neutral-900 border border-neutral-700" />
              </div>
              <div className="flex items-center gap-1.5 pr-1">
                <Wifi className="size-3 text-white" />
                <Battery className="size-3.5 text-white" />
              </div>
            </div>

            {openApp ? (
              <div className="flex-1 flex flex-col justify-between overflow-hidden bg-black/40 backdrop-blur-2xl">
                <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between bg-black/30 shrink-0">
                  <button
                    type="button"
                    onClick={() => setOpenApp(null)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-white cursor-pointer"
                  >
                    <ChevronLeft className="size-4" />
                    <span>Home</span>
                  </button>
                  <h3 className="font-bold text-xs text-white capitalize">{openApp}</h3>
                  <button
                    type="button"
                    onClick={() => setOpenApp(null)}
                    className="size-6 rounded-full bg-white/10 text-white/80 grid place-items-center cursor-pointer text-xs"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto">{renderAppContent()}</div>

                <div
                  onClick={() => setOpenApp(null)}
                  className="py-2.5 grid place-items-center cursor-pointer shrink-0"
                >
                  <div className="w-32 h-1 bg-white/40 rounded-full" />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between p-5">
                <div className="text-center pt-2">
                  <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-md">
                    {currentTime}
                  </h1>
                  <p className="text-xs font-medium text-white/80 mt-1">Zahid OS 18</p>
                </div>

                <div className="grid grid-cols-3 gap-y-6 gap-x-3 my-auto px-1">
                  {apps.map((app) => {
                    const Icon = app.icon;
                    return (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => setOpenApp(app.id)}
                        className="group flex flex-col items-center gap-1.5 cursor-pointer"
                      >
                        <div
                          className={`size-16 rounded-[22%] bg-gradient-to-br ${app.gradient} shadow-lg shadow-black/40 border border-white/20 flex items-center justify-center text-white transition-all transform duration-200 group-hover:scale-105 group-active:scale-95 relative overflow-hidden`}
                        >
                          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent" />
                          <Icon className="size-8 drop-shadow-md" />
                          {app.badge && (
                            <span className="absolute top-1 right-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold">
                              {app.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-medium text-white drop-shadow-sm">
                          {app.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-auto shrink-0">
                  <div className="p-2 rounded-[28px] bg-white/10 backdrop-blur-2xl border border-white/15 shadow-2xl flex items-center justify-around max-w-xs mx-auto">
                    {apps
                      .filter((a) => a.inDock)
                      .map((dockApp) => {
                        const DockIcon = dockApp.icon;
                        return (
                          <button
                            key={dockApp.id}
                            type="button"
                            onClick={() => setOpenApp(dockApp.id)}
                            className={`size-12 rounded-[22%] bg-gradient-to-br ${dockApp.gradient} shadow-md border border-white/20 flex items-center justify-center text-white transition-all transform hover:scale-110 active:scale-95 cursor-pointer`}
                          >
                            <DockIcon className="size-6 text-white" />
                          </button>
                        );
                      })}
                  </div>
                  <div className="w-32 h-1 bg-white/40 rounded-full mx-auto mt-2.5" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal for Creating / Editing Link */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-raised rounded-3xl border border-line bg-surface p-6 sm:p-7 max-w-lg w-full shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-line mb-5">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 grid place-items-center">
                  <Link2 className="size-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-ink">
                    {editingId ? 'Edit Short Link' : 'Create Short Link'}
                  </h3>
                  <p className="text-[11px] text-ink-3">Powered by Zahid OS URL Engine.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="size-7 rounded-lg hover:bg-surface-2 text-ink-3 hover:text-ink grid place-items-center cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitLinkForm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-2 mb-1.5">
                  Destination URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formOriginalUrl}
                  onChange={(e) => setFormOriginalUrl(e.target.value)}
                  placeholder="https://github.com/0xzahidp"
                  required
                  className="w-full h-10 px-3 rounded-xl border border-line bg-surface hover:bg-surface-2 focus:bg-surface focus:border-brand-500 text-xs font-mono text-ink outline-hidden shadow-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-ink-2">Short Slug</label>
                  <button
                    type="button"
                    onClick={handleRandomSlug}
                    className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Shuffle className="size-3" />
                    <span>Generate Random</span>
                  </button>
                </div>
                <div className="flex items-center">
                  <span className="h-10 px-3 rounded-l-xl border border-r-0 border-line bg-surface-2 text-ink-3 font-mono text-xs flex items-center shrink-0">
                    /s/
                  </span>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) =>
                      setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9\-_]/g, ''))
                    }
                    placeholder="e.g. repo, cv, x"
                    className="w-full h-10 px-3 rounded-r-xl border border-line bg-surface hover:bg-surface-2 focus:bg-surface focus:border-brand-500 text-xs font-mono text-ink outline-hidden shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-2 mb-1.5">Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. My GitHub"
                  className="w-full h-10 px-3 rounded-xl border border-line bg-surface hover:bg-surface-2 focus:bg-surface focus:border-brand-500 text-xs text-ink outline-hidden shadow-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-between p-3 rounded-xl bg-surface-2 border border-line">
                <div>
                  <span className="text-xs font-semibold text-ink block">Active Status</span>
                  <span className="text-[10px] text-ink-4">Enable or pause redirection</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIsActive(!formIsActive)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    formIsActive ? 'bg-emerald-500' : 'bg-line-strong'
                  }`}
                >
                  <span
                    className={`size-4.5 rounded-full bg-white transition-transform absolute top-0.75 left-0.75 shadow-xs ${
                      formIsActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-9 px-4 rounded-xl border border-line hover:bg-surface-2 text-ink-3 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLink}
                  className="h-9 px-5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-md shadow-brand-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingLink ? 'Saving...' : editingId ? 'Update Link' : 'Create Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
