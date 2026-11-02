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
  // Device Frame Viewport: 'iphone' (phone mockup) vs 'canvas' (desktop studio)
  const [viewMode, setViewMode] = useState<'iphone' | 'canvas'>('iphone');

  // Active Open App: null means Home Screen (Springboard)
  const [openApp, setOpenApp] = useState<ZahidOsAppId | null>(null);

  // Time state for iOS status bar
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

  // Fetch short links, OS settings, and snippets on mount
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

    // Load scratchpad from localStorage
    if (typeof window !== 'undefined') {
      const savedNote = localStorage.getItem('zahid_os_scratchpad') || '';
      setScratchpadNote(savedNote);
    }

    // Default snippets
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

  // Current origin
  const currentOrigin =
    typeof window !== 'undefined' ? window.location.origin : 'https://0xZahidP.com';

  // Stats
  const totalClicks = useMemo(
    () => links.reduce((acc, l) => acc + (l.clicks || 0), 0),
    [links]
  );
  const activeCount = useMemo(
    () => links.filter((l) => l.is_active !== false).length,
    [links]
  );

  // Filter links
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

  // Save scratchpad
  const handleSaveScratchpad = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('zahid_os_scratchpad', scratchpadNote);
      setScratchpadSaved(true);
      setTimeout(() => setScratchpadSaved(false), 2000);
    }
  };

  // Copy helper
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

  // Save OS settings
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

  // Wallpaper themes
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

  // Apps configuration
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
          <div className="p-4 sm:p-6 space-y-4">
            {/* Header info */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Link2 className="size-4 text-cyan-400" />
                  <span>Link Shortener Engine</span>
                </h3>
                <p className="text-[11px] text-white/60">
                  {links.length} total links • {totalClicks} redirect clicks
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenCreateLink}
                className="h-8 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="size-3.5" />
                <span>New Link</span>
              </button>
            </div>

            {/* Quick stats row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                <span className="text-[10px] text-white/60 block">Links</span>
                <span className="text-base font-bold text-white font-mono">{links.length}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                <span className="text-[10px] text-white/60 block">Clicks</span>
                <span className="text-base font-bold text-amber-400 font-mono flex items-center justify-center gap-1">
                  <Flame className="size-3.5 fill-amber-400" />
                  <span>{totalClicks}</span>
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                <span className="text-[10px] text-white/60 block">Active</span>
                <span className="text-base font-bold text-emerald-400 font-mono">{activeCount}</span>
              </div>
            </div>

            {/* Search & Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="size-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search short links..."
                  className="w-full h-8 pl-8 pr-3 rounded-lg border border-white/10 bg-white/5 focus:bg-white/10 text-xs text-white placeholder:text-white/40 outline-hidden transition-all"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
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
                  className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
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
                  className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                    filterMode === 'inactive'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  Paused ({links.length - activeCount})
                </button>
              </div>
            </div>

            {/* Links list */}
            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
              {filteredLinks.map((link) => {
                const isCopied = copiedSlug === link.slug;

                return (
                  <div
                    key={link.id}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white truncate block">
                          {link.title}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-cyan-400">
                          <span>/s/{link.slug}</span>
                          <span className="text-white/40">•</span>
                          <span className="text-white/60 flex items-center gap-0.5">
                            <Flame className="size-2.5 text-amber-400" />
                            <span>{link.clicks || 0}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Copy button */}
                        <button
                          type="button"
                          onClick={() => handleCopyLink(link.slug)}
                          className="size-7 rounded-lg bg-white/10 hover:bg-white/20 text-white grid place-items-center transition-colors cursor-pointer"
                          title="Copy Link"
                        >
                          {isCopied ? (
                            <Check className="size-3 text-emerald-400" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </button>
                        {/* QR button */}
                        <button
                          type="button"
                          onClick={() => {
                            setCustomQrUrl(`${currentOrigin}/s/${link.slug}`);
                            setOpenApp('qr');
                          }}
                          className="size-7 rounded-lg bg-white/10 hover:bg-white/20 text-white grid place-items-center transition-colors cursor-pointer"
                          title="Generate QR code"
                        >
                          <QrCode className="size-3" />
                        </button>
                        {/* Test redirect */}
                        <a
                          href={`/s/${link.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="size-7 rounded-lg bg-white/10 hover:bg-white/20 text-white grid place-items-center transition-colors cursor-pointer"
                          title="Test Redirect"
                        >
                          <ExternalLink className="size-3" />
                        </a>
                        {/* Toggle active */}
                        <button
                          type="button"
                          onClick={() => handleToggleActive(link)}
                          className={`size-7 rounded-lg grid place-items-center transition-colors cursor-pointer ${
                            link.is_active !== false
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                          title="Toggle Active"
                        >
                          <Power className="size-3" />
                        </button>
                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditLink(link)}
                          className="size-7 rounded-lg bg-white/10 hover:bg-white/20 text-white grid place-items-center transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="size-3" />
                        </button>
                        {/* Delete with 2-step confirm */}
                        {deletingId === link.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteLink(link.id)}
                              className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                            >
                              Del
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingId(null)}
                              className="size-5 rounded bg-white/10 text-white text-[10px] grid place-items-center cursor-pointer"
                            >
                              <X className="size-2.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeletingId(link.id)}
                            className="size-7 rounded-lg bg-white/10 hover:bg-rose-500/20 text-white hover:text-rose-400 grid place-items-center transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-[10px] text-white/50 truncate font-mono">
                      ↳ {link.original_url}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'qr':
        return (
          <div className="p-4 sm:p-6 space-y-4 text-center">
            <div className="size-11 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-400 mx-auto grid place-items-center">
              <QrCode className="size-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">QR Code Studio</h3>
              <p className="text-[11px] text-white/60">
                Generate high-resolution scannable QR codes.
              </p>
            </div>

            <div className="text-left space-y-1.5">
              <label className="text-xs font-semibold text-white/80 block">URL or Text to encode:</label>
              <input
                type="text"
                value={customQrUrl || (links[0] ? `${currentOrigin}/s/${links[0].slug}` : '')}
                onChange={(e) => setCustomQrUrl(e.target.value)}
                placeholder="https://0xZahidP.com"
                className="w-full h-8 px-3 rounded-lg border border-white/10 bg-white/5 text-xs text-white outline-hidden font-mono"
              />
            </div>

            {/* QR Preview Box */}
            <div className="p-4 bg-white rounded-2xl shadow-xl inline-block mx-auto border border-white/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  customQrUrl || (links[0] ? `${currentOrigin}/s/${links[0].slug}` : currentOrigin)
                )}`}
                alt="QR Code"
                className="size-44 object-contain rounded-lg"
              />
            </div>

            <div>
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
                  customQrUrl || (links[0] ? `${currentOrigin}/s/${links[0].slug}` : currentOrigin)
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-md cursor-pointer transition-all"
              >
                <ExternalLink className="size-3.5" />
                <span>Open High-Res Vector</span>
              </a>
            </div>
          </div>
        );

      case 'notes':
        return (
          <div className="p-4 sm:p-6 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div>
                <h3 className="font-bold text-sm text-amber-300 flex items-center gap-1.5">
                  <FileText className="size-4 text-amber-400" />
                  <span>iOS Scratchpad</span>
                </h3>
                <p className="text-[11px] text-white/60">
                  {scratchpadNote.trim() ? `${scratchpadNote.trim().split(/\s+/).length} words` : 'Empty note'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveScratchpad}
                className="h-7 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition-all flex items-center gap-1 cursor-pointer"
              >
                {scratchpadSaved ? <Check className="size-3" /> : null}
                <span>{scratchpadSaved ? 'Saved!' : 'Save'}</span>
              </button>
            </div>

            <textarea
              value={scratchpadNote}
              onChange={(e) => setScratchpadNote(e.target.value)}
              placeholder="Jot down quick thoughts, project ideas, commands, or scratch data..."
              rows={12}
              className="w-full p-3 rounded-xl border border-white/10 bg-amber-950/20 text-xs font-mono text-amber-100 placeholder:text-amber-200/30 outline-hidden leading-relaxed resize-y"
            />
          </div>
        );

      case 'snippets':
        return (
          <div className="p-4 sm:p-6 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div>
                <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
                  <Code2 className="size-4" />
                  <span>Developer Snippets</span>
                </h3>
                <p className="text-[11px] text-white/60">Curated code blocks for quick copying.</p>
              </div>
            </div>

            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {snippets.map((snip) => (
                <div
                  key={snip.id}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">{snip.title}</span>
                      <span className="text-[10px] text-emerald-400 font-mono">{snip.language}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopySnippet(snip.id, snip.code)}
                      className="h-7 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedSnippetId === snip.id ? (
                        <>
                          <Check className="size-3 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-2.5 rounded-lg bg-black/60 border border-white/5 text-[10px] font-mono text-emerald-300 overflow-x-auto">
                    {snip.code}
                  </pre>
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
          <div className="p-6 text-center space-y-6">
            <div className="size-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 mx-auto grid place-items-center">
              <Clock className="size-6" />
            </div>

            <div>
              <h3 className="font-bold text-sm text-white">Pomodoro Focus Timer</h3>
              <p className="text-[11px] text-white/60">Deep work interval session.</p>
            </div>

            <div className="size-48 rounded-full border-4 border-rose-500/30 mx-auto grid place-items-center bg-white/5 shadow-2xl relative">
              <span className="text-4xl font-black font-mono text-white tracking-wider">
                {timeDisplay}
              </span>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`h-10 px-6 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all ${
                  isTimerRunning
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                }`}
              >
                {isTimerRunning ? <Pause className="size-4" /> : <Play className="size-4" />}
                <span>{isTimerRunning ? 'Pause' : 'Start Focus'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsTimerRunning(false);
                  setFocusSecondsLeft(25 * 60);
                }}
                className="h-10 px-4 rounded-xl border border-white/20 hover:bg-white/10 text-white text-xs font-semibold cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="p-4 sm:p-6 space-y-5 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                  <SettingsIcon className="size-4 text-slate-300" />
                  <span>Zahid OS System Settings</span>
                </h3>
                <p className="text-[11px] text-white/60">Configure public access and permissions.</p>
              </div>

              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="h-8 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
              >
                {settingsSaveSuccess ? <Check className="size-3" /> : null}
                <span>{settingsSaveSuccess ? 'Saved!' : isSavingSettings ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>

            {/* 1. Public Access Master Switch */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {osSettings.is_public_enabled ? (
                    <Unlock className="size-4 text-emerald-400" />
                  ) : (
                    <Lock className="size-4 text-amber-400" />
                  )}
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Public Access to Zahid OS (`/os`)
                    </span>
                    <span className="text-[10px] text-white/60 block">
                      {osSettings.is_public_enabled
                        ? 'Active: Public visitors can launch apps at /os'
                        : 'Disabled: Private admin mode only'}
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
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    osSettings.is_public_enabled ? 'bg-emerald-500' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`size-4.5 rounded-full bg-white transition-transform absolute top-0.75 left-0.75 shadow-xs ${
                      osSettings.is_public_enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {osSettings.is_public_enabled && (
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                  <span className="font-mono text-emerald-400">{currentOrigin}/os</span>
                  <a
                    href="/os"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-white hover:underline text-[10px]"
                  >
                    <span>Test Public OS</span>
                    <ExternalLink className="size-2.5" />
                  </a>
                </div>
              )}
            </div>

            {/* 2. Per-App Public Visibility Permissions */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white block">
                Individual App Permissions (Public vs Private)
              </label>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs">
                {(['shortener', 'qr', 'snippets', 'focus', 'notes'] as ZahidOsAppId[]).map(
                  (appKey) => {
                    const isPub = osSettings.app_permissions?.[appKey]?.is_public ?? false;

                    return (
                      <div
                        key={appKey}
                        className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0"
                      >
                        <span className="text-white/80 capitalize font-medium">{appKey} App</span>

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
                          className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                            isPub
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
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

            {/* 3. Wallpaper Theme */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white block">iOS Wallpaper Style</label>
              <div className="grid grid-cols-2 gap-2">
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
                    className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${
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
      {/* 1. Top Ribbon & Viewport Switcher */}
      <div className="rounded-3xl border border-line bg-surface p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Radio className="size-3 animate-pulse text-emerald-500" />
              <span>Zahid OS 18</span>
            </span>
            <span className="text-xs font-mono text-ink-3">Springboard Engine</span>
          </div>
          <h2 className="text-lg font-bold text-ink">iPhone & Micro-App Studio</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="p-1 rounded-xl bg-surface-2 border border-line flex items-center gap-1 text-xs">
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
              <span>iPhone Mode</span>
            </button>
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
              <span>Studio Canvas</span>
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

      {/* 2. Main OS Container (renders either iPhone chassis or wide canvas) */}
      <div className="flex justify-center items-center py-2">
        <div
          className={`transition-all duration-300 relative select-none ${
            viewMode === 'iphone'
              ? 'w-full max-w-[400px] h-[780px] rounded-[50px] border-[7px] border-[#222326] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.12)] overflow-hidden bg-black'
              : 'w-full max-w-4xl min-h-[680px] rounded-3xl border border-line shadow-2xl overflow-hidden bg-black'
          }`}
        >
          {/* Wallpaper background */}
          <div
            className={`absolute inset-0 bg-gradient-to-b ${wallpaperClass} transition-colors duration-500 -z-10`}
          />

          {/* Ambient glass light effects */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none -z-10" />

          {/* iOS Dynamic Island & Status Bar */}
          <div className="relative pt-2.5 px-6 pb-2 flex items-center justify-between text-white text-xs z-30">
            {/* Clock */}
            <span className="font-semibold text-xs tracking-tight font-sans pl-1">
              {currentTime}
            </span>

            {/* Dynamic Island */}
            {viewMode === 'iphone' && (
              <div className="w-28 h-6.5 bg-black rounded-full flex items-center justify-between px-3 shadow-inner">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="size-2.5 rounded-full bg-neutral-900 border border-neutral-700" />
              </div>
            )}

            {/* Signal & Battery */}
            <div className="flex items-center gap-1.5 pr-1">
              <span className="text-[10px] font-semibold text-white/80">5G</span>
              <Wifi className="size-3 text-white" />
              <Battery className="size-3.5 text-white" />
            </div>
          </div>

          {/* VIEW A: An App is Open */}
          {openApp ? (
            <div className="h-[calc(100%-40px)] flex flex-col justify-between overflow-hidden bg-black/40 backdrop-blur-2xl">
              {/* App Navigation Bar */}
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-black/30 shrink-0">
                <button
                  type="button"
                  onClick={() => setOpenApp(null)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-white hover:text-white/80 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="size-4" />
                  <span>Home</span>
                </button>

                <h3 className="font-bold text-xs text-white capitalize">{openApp}</h3>

                <button
                  type="button"
                  onClick={() => setOpenApp(null)}
                  className="size-6 rounded-full bg-white/10 hover:bg-white/20 text-white/80 grid place-items-center cursor-pointer text-xs"
                >
                  <X className="size-3.5" />
                </button>
              </div>

              {/* Scrollable App Body */}
              <div className="flex-1 overflow-y-auto">{renderAppContent()}</div>

              {/* Bottom Home Indicator Bar (Swipe/Click to Home) */}
              <div
                onClick={() => setOpenApp(null)}
                className="py-2.5 grid place-items-center cursor-pointer group hover:bg-white/5 transition-colors shrink-0"
                title="Tap to return Home"
              >
                <div className="w-32 h-1 bg-white/40 group-hover:bg-white/80 rounded-full transition-all" />
              </div>
            </div>
          ) : (
            /* VIEW B: Springboard (Home Screen App Launcher) */
            <div className="h-[calc(100%-40px)] flex flex-col justify-between p-5 sm:p-7 relative">
              {/* Header Widget */}
              <div className="text-center pt-2">
                <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md">
                  {currentTime}
                </h1>
                <p className="text-xs font-medium text-white/80 mt-1 drop-shadow-xs">
                  {new Date().toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>

              {/* App Icons Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-3 gap-y-7 gap-x-4 my-auto px-2">
                {apps.map((app) => {
                  const Icon = app.icon;

                  return (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => setOpenApp(app.id)}
                      className="group flex flex-col items-center gap-1.5 focus:outline-hidden cursor-pointer"
                    >
                      {/* iOS Squircle Icon */}
                      <div
                        className={`size-16 sm:size-17 rounded-[22%] bg-gradient-to-br ${app.gradient} shadow-lg shadow-black/40 border border-white/20 flex items-center justify-center text-white transition-all transform duration-200 group-hover:scale-105 group-active:scale-95 relative overflow-hidden`}
                      >
                        {/* Glass Glossy Highlight */}
                        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />

                        {/* Icon */}
                        <Icon className="size-8 drop-shadow-md" />

                        {/* Badge */}
                        {app.badge && (
                          <span className="absolute top-1 right-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold shadow-xs">
                            {app.badge}
                          </span>
                        )}
                      </div>

                      {/* App Label */}
                      <span className="text-[11px] font-medium text-white/95 tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        {app.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Bottom iOS Frosted Glass Dock */}
              <div className="mt-auto">
                <div className="p-2.5 rounded-[30px] bg-white/10 backdrop-blur-2xl border border-white/15 shadow-2xl flex items-center justify-around max-w-xs mx-auto">
                  {apps
                    .filter((a) => a.inDock)
                    .map((dockApp) => {
                      const DockIcon = dockApp.icon;

                      return (
                        <button
                          key={dockApp.id}
                          type="button"
                          onClick={() => setOpenApp(dockApp.id)}
                          title={dockApp.name}
                          className="size-13 rounded-[22%] bg-gradient-to-br shadow-md border border-white/20 flex items-center justify-center text-white transition-all transform hover:scale-110 active:scale-95 relative overflow-hidden cursor-pointer"
                          style={{
                            backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))`,
                          }}
                        >
                          <div className={`absolute inset-0 bg-gradient-to-br ${dockApp.gradient}`} />
                          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent" />
                          <DockIcon className="size-6 text-white drop-shadow-sm relative z-10" />
                        </button>
                      );
                    })}
                </div>

                {/* Home Indicator */}
                <div className="w-32 h-1 bg-white/40 rounded-full mx-auto mt-3" />
              </div>
            </div>
          )}
        </div>
      </div>

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
