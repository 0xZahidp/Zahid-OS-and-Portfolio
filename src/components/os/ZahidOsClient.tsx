'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  Wifi,
  Battery,
  Link2,
  QrCode,
  Code2,
  Clock,
  ExternalLink,
  Copy,
  Check,
  ChevronLeft,
  X,
  Play,
  Pause,
  Compass,
  Mail,
  FileText,
  Search,
  ShieldCheck,
  Palette,
  Terminal,
  Flame,
} from 'lucide-react';
import { ShortLink, ZahidOsSettings, ZahidOsAppId, ZahidOsWallpaper } from '@/types/os';
import { ZosWallpaper } from '@/components/os/ZosWallpaper';
import { ZosBootScreen } from '@/components/os/ZosBootScreen';
import { ZosSpotlightModal, SpotlightAppItem } from '@/components/os/ZosSpotlightModal';

// Code-split heavy micro-apps so Zahid OS Desktop boots with a lightweight initial bundle
const TravelWorkspace = dynamic(
  () => import('@/components/os/travel/TravelWorkspace').then((m) => m.TravelWorkspace),
  {
    loading: () => (
      <div className="min-h-[460px] flex flex-col items-center justify-center gap-3 text-white/50 select-none">
        <div className="size-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 grid place-items-center shadow-lg">
          <Compass className="size-5.5 animate-spin" />
        </div>
        <p className="text-xs font-mono text-amber-300">Launching Bangladesh Travel Odyssey...</p>
      </div>
    ),
    ssr: false,
  }
);

const ApiPlaygroundApp = dynamic(
  () => import('@/components/os/api-playground').then((m) => m.ApiPlaygroundApp),
  {
    loading: () => (
      <div className="min-h-[460px] flex flex-col items-center justify-center gap-3 text-white/50 select-none">
        <div className="size-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 grid place-items-center shadow-lg">
          <Code2 className="size-5.5 animate-spin" />
        </div>
        <p className="text-xs font-mono text-cyan-300">Launching API Playground...</p>
      </div>
    ),
    ssr: false,
  }
);

const TempMailApp = dynamic(
  () => import('@/components/os/temp-mail').then((m) => m.TempMailApp),
  {
    loading: () => (
      <div className="min-h-[460px] flex flex-col items-center justify-center gap-3 text-white/50 select-none">
        <div className="size-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 grid place-items-center shadow-lg">
          <Mail className="size-5.5 animate-spin" />
        </div>
        <p className="text-xs font-mono text-amber-300">Launching Temp Mail...</p>
      </div>
    ),
    ssr: false,
  }
);

const IosNotesApp = dynamic(
  () => import('@/components/os/IosNotesApp').then((m) => m.IosNotesApp),
  { ssr: false }
);

interface ZahidOsClientProps {
  initialSettings: ZahidOsSettings;
  initialLinks: ShortLink[];
}

// Subtle Wallpaper Switcher
const WALLPAPER_CYCLE: ZahidOsWallpaper[] = [
  'zos-emerald',
  'zos-cyber',
  'zos-midnight',
  'zos-sunset',
];

export const ZahidOsClient: React.FC<ZahidOsClientProps> = ({
  initialSettings,
  initialLinks,
}) => {
  // SSR Seeded State: Zero UI flashing!
  const [settings, setSettings] = useState<ZahidOsSettings>(initialSettings);
  const [links, setLinks] = useState<ShortLink[]>(initialLinks);
  const [openApp, setOpenApp] = useState<ZahidOsAppId | null>(null);

  // Minimalist macOS/iPadOS dark emerald boot animation state
  const [isBooting, setIsBooting] = useState<boolean>(true);
  const [isBootFading, setIsBootFading] = useState<boolean>(false);

  // Time & Date state (Separated: Date in top status bar, Time in large hero clock)
  const [currentDate, setCurrentDate] = useState<string>('Tue, Nov 24');
  const [currentTime, setCurrentTime] = useState<string>('12:00');

  // Spotlight quick search (⌘K)
  const [isSpotlightOpen, setIsSpotlightOpen] = useState<boolean>(false);

  // Short links interaction
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [customQrUrl, setCustomQrUrl] = useState<string>('');

  // Public link creation
  const [publicUrlInput, setPublicUrlInput] = useState<string>('');
  const [publicSlugInput, setPublicSlugInput] = useState<string>('');
  const [isCreatingPublicLink, setIsCreatingPublicLink] = useState<boolean>(false);
  const [publicCreateError, setPublicCreateError] = useState<string | null>(null);
  const [publicCreateSuccess, setPublicCreateSuccess] = useState<string | null>(null);

  // Focus clock state
  const [focusSeconds, setFocusSeconds] = useState<number>(25 * 60);
  const [isFocusRunning, setIsFocusRunning] = useState<boolean>(false);

  // Smooth boot screen fade-out
  useEffect(() => {
    const fadeTimer = setTimeout(() => setIsBootFading(true), 250);
    const endTimer = setTimeout(() => setIsBooting(false), 550);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(endTimer);
    };
  }, []);

  // Update Live Clock & Date
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      // Status bar date: e.g., "Tue, Nov 24"
      const dateStr = now.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      // Center hero clock: e.g., "12:45"
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;

      setCurrentDate(dateStr);
      setCurrentTime(timeStr);
    };

    updateClock();
    const interval = setInterval(updateClock, 10000);
    return () => clearInterval(interval);
  }, []);

  // Focus Timer ticker
  useEffect(() => {
    let t: NodeJS.Timeout;
    if (isFocusRunning && focusSeconds > 0) {
      t = setInterval(() => setFocusSeconds((s) => s - 1), 1000);
    } else if (focusSeconds === 0) {
      setIsFocusRunning(false);
    }
    return () => clearInterval(t);
  }, [isFocusRunning, focusSeconds]);

  // Global ⌘K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSpotlightOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://0xZahidP.com';

  const handleCopy = (slug: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${origin}/s/${slug}`);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    }
  };

  const handleCycleWallpaper = useCallback(() => {
    setSettings((prev) => {
      const current = prev.wallpaper;
      const curIdx = WALLPAPER_CYCLE.indexOf(current);
      const nextIdx = (curIdx + 1) % WALLPAPER_CYCLE.length;
      return { ...prev, wallpaper: WALLPAPER_CYCLE[nextIdx] };
    });
  }, []);

  const handleCreatePublicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicUrlInput.trim()) return;

    setIsCreatingPublicLink(true);
    setPublicCreateError(null);
    setPublicCreateSuccess(null);

    try {
      const res = await fetch('/api/os/short-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_url: publicUrlInput.trim(),
          slug: publicSlugInput.trim() || undefined,
          title: publicSlugInput.trim() || 'Shared Shortcut',
        }),
      });

      let data: { success?: boolean; error?: string; link?: ShortLink } | null = null;
      try {
        data = await res.json();
      } catch {
        setPublicCreateError(`Server returned an invalid response (HTTP ${res.status}).`);
        return;
      }

      if (!res.ok || !data?.success) {
        setPublicCreateError(data?.error || 'Failed to create short link');
        return;
      }

      if (data?.link) {
        const createdLink = data.link;
        setLinks((prev) => [
          createdLink,
          ...(Array.isArray(prev) ? prev : []).filter((l) => l.id !== createdLink.id),
        ]);
        setPublicUrlInput('');
        setPublicSlugInput('');
        setPublicCreateSuccess(`/s/${createdLink.slug}`);
        if (navigator.clipboard) {
          navigator.clipboard.writeText(`${origin}/s/${createdLink.slug}`);
        }
        setTimeout(() => setPublicCreateSuccess(null), 4000);
      }
    } catch (err: unknown) {
      setPublicCreateError(err instanceof Error ? err.message : 'Network error creating link');
    } finally {
      setIsCreatingPublicLink(false);
    }
  };

  // Full Active Public Apps Filtered by Server Settings
  const publicApps = useMemo(() => {
    const list = [
      {
        id: 'shortener' as ZahidOsAppId,
        name: 'Shortener',
        subtitle: 'URL Engine',
        gradient: 'from-cyan-500 via-blue-600 to-indigo-600',
        icon: Link2,
        enabled: settings?.app_permissions?.shortener?.is_public !== false,
        numericBadge: (Array.isArray(links) ? links : []).length > 0 ? `${(Array.isArray(links) ? links : []).length}` : undefined,
      },
      {
        id: 'travel' as ZahidOsAppId,
        name: 'Travel Map',
        subtitle: 'BD Explorer',
        gradient: 'from-emerald-500 via-teal-600 to-cyan-700',
        icon: Compass,
        enabled: settings?.app_permissions?.travel?.is_public !== false,
        numericBadge: '64',
      },
      {
        id: 'api_playground' as ZahidOsAppId,
        name: 'API Console',
        subtitle: 'HTTP Workbench',
        gradient: 'from-blue-600 via-indigo-600 to-violet-700',
        icon: Terminal,
        tagBadge: 'REST', // Glass pill tag instead of red badge
        enabled: settings?.app_permissions?.api_playground?.is_public !== false,
      },
      {
        id: 'temp_mail' as ZahidOsAppId,
        name: 'Temp Mail',
        subtitle: 'Disposable Inboxes',
        gradient: 'from-amber-500 via-orange-600 to-rose-600',
        icon: Mail,
        tagBadge: 'OTP', // Glass pill tag instead of red badge
        enabled: settings?.app_permissions?.temp_mail?.is_public !== false,
      },
      {
        id: 'qr' as ZahidOsAppId,
        name: 'QR Studio',
        subtitle: 'Matrix Generator',
        gradient: 'from-fuchsia-500 via-purple-600 to-indigo-700',
        icon: QrCode,
        enabled: settings?.app_permissions?.qr?.is_public !== false,
      },
      {
        id: 'snippets' as ZahidOsAppId,
        name: 'Snippets',
        subtitle: 'Code Cheat Sheet',
        gradient: 'from-emerald-400 via-teal-500 to-emerald-700',
        icon: Code2,
        enabled: settings?.app_permissions?.snippets?.is_public !== false,
      },
      {
        id: 'focus' as ZahidOsAppId,
        name: 'Focus',
        subtitle: 'Pomodoro Timer',
        gradient: 'from-orange-500 via-rose-600 to-red-600',
        icon: Clock,
        enabled: settings?.app_permissions?.focus?.is_public !== false,
      },
      {
        id: 'notes' as ZahidOsAppId,
        name: 'Notes',
        subtitle: 'Instant Scratchpad',
        gradient: 'from-amber-400 via-orange-500 to-amber-600',
        icon: FileText,
        enabled: settings?.app_permissions?.notes?.is_public === true,
      },
    ];

    return list.filter((a) => a.enabled);
  }, [settings, links]);

  // Spotlight App Items
  const spotlightApps: SpotlightAppItem[] = useMemo(() => {
    return publicApps.map((a) => ({
      id: a.id,
      name: a.name,
      subtitle: a.subtitle,
      icon: a.icon,
      gradient: a.gradient,
      badge: a.numericBadge || a.tagBadge,
    }));
  }, [publicApps]);

  // Distinct Core Dock Items (Not a duplication of the desktop grid!)
  const dockPinnedApps = useMemo(() => {
    return publicApps.slice(0, 3);
  }, [publicApps]);

  // Render open micro-app
  const renderOpenApp = () => {
    switch (openApp) {
      case 'travel':
        return (
          <div className="p-2 sm:p-5">
            <TravelWorkspace mode="public" />
          </div>
        );
      case 'api_playground':
        return (
          <div className="p-2 sm:p-5">
            <ApiPlaygroundApp />
          </div>
        );
      case 'temp_mail':
        return (
          <div className="p-2 sm:p-5">
            <TempMailApp />
          </div>
        );
      case 'shortener':
        return (
          <div className="p-4 sm:p-7 space-y-4 max-w-3xl mx-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="font-bold text-base text-white">URL Shortener &amp; Shortcuts</h3>
                <p className="text-xs text-white/60">
                  {settings?.allow_public_link_creation
                    ? 'Shorten custom links or browse verified shortcuts.'
                    : 'Curated shortcuts created and managed by 0xZahidP.'}
                </p>
              </div>
            </div>

            {settings?.allow_public_link_creation ? (
              <form
                onSubmit={handleCreatePublicLink}
                className="p-4 rounded-2xl bg-white/5 border border-cyan-500/20 space-y-3"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
                  <Link2 className="size-4" />
                  <span>Shorten a Web URL</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={publicUrlInput}
                    onChange={(e) => setPublicUrlInput(e.target.value)}
                    placeholder="https://your-destination-url.com"
                    className="flex-1 h-9 px-3 rounded-xl border border-white/10 bg-white/5 text-xs text-white outline-hidden font-mono focus:border-cyan-500"
                  />
                  <input
                    type="text"
                    value={publicSlugInput}
                    onChange={(e) => setPublicSlugInput(e.target.value)}
                    placeholder="custom-slug (optional)"
                    className="w-full sm:w-44 h-9 px-3 rounded-xl border border-white/10 bg-white/5 text-xs text-white outline-hidden font-mono focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    disabled={isCreatingPublicLink || !publicUrlInput.trim()}
                    className="h-9 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
                  >
                    {isCreatingPublicLink ? 'Shortening...' : 'Shorten'}
                  </button>
                </div>

                {publicCreateError && (
                  <p className="text-xs text-rose-400 font-mono">{publicCreateError}</p>
                )}
                {publicCreateSuccess && (
                  <p className="text-xs text-amber-400 font-mono flex items-center gap-1.5">
                    <Check className="size-3.5" />
                    <span>Short link created and copied: {origin}{publicCreateSuccess}</span>
                  </p>
                )}
              </form>
            ) : (
              <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 flex items-center gap-3 text-xs text-cyan-200">
                <ShieldCheck className="size-4 text-cyan-400 shrink-0" />
                <div className="leading-relaxed">
                  <span className="font-bold text-white block">Curated Developer Shortcuts</span>
                  <span className="text-cyan-300/80">
                    Browse and use verified links shared by 0xZahidP. (Link creation is restricted to the administrator).
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {(Array.isArray(links) ? links : [])
                .filter((l) => l.is_active !== false)
                .map((link) => (
                  <div
                    key={link.id}
                    className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <span className="text-xs sm:text-sm font-bold text-white truncate block">
                        {link.title}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5 text-xs font-mono text-cyan-400">
                        <span>/s/{link.slug}</span>
                        <span className="text-white/40">•</span>
                        <span className="text-white/60 flex items-center gap-1">
                          <Flame className="size-3 text-amber-400 fill-amber-400" />
                          <span>{link.clicks || 0}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopy(link.slug)}
                        className="h-8 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedSlug === link.slug ? (
                          <>
                            <Check className="size-3.5 text-amber-400" />
                            <span className="text-amber-300">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <a
                        href={`/s/${link.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="size-8 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white grid place-items-center cursor-pointer transition-colors"
                        title="Visit Link"
                      >
                        <ExternalLink className="size-4" />
                      </a>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        );

      case 'qr':
        return (
          <div className="p-4 sm:p-7 text-center space-y-5 max-w-lg mx-auto">
            <div>
              <h3 className="font-bold text-base text-white">Instant QR Code Generator</h3>
              <p className="text-xs text-white/60">Generate and download scannable codes.</p>
            </div>

            <input
              type="text"
              value={customQrUrl}
              onChange={(e) => setCustomQrUrl(e.target.value)}
              placeholder="Enter web link to generate QR..."
              className="w-full h-10 px-3.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white outline-hidden font-mono"
            />

            <div className="p-4 bg-white rounded-2xl shadow-xl inline-block mx-auto border border-white/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  customQrUrl || origin
                )}`}
                alt="QR Code"
                className="size-48 object-contain rounded-lg"
              />
            </div>

            <div>
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
                  customQrUrl || origin
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 h-9 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-md cursor-pointer transition-all"
              >
                <ExternalLink className="size-4" />
                <span>Open High-Res Vector</span>
              </a>
            </div>
          </div>
        );

      case 'focus':
        const mins = Math.floor(focusSeconds / 60);
        const secs = focusSeconds % 60;
        return (
          <div className="p-6 sm:p-8 text-center space-y-6 max-w-md mx-auto">
            <div>
              <h3 className="font-bold text-base text-white">Pomodoro Focus Timer</h3>
              <p className="text-xs text-white/60">Timed interval work session.</p>
            </div>

            <div className="size-48 sm:size-52 rounded-full border-4 border-rose-500/30 mx-auto grid place-items-center bg-white/5 shadow-2xl">
              <span className="text-4xl sm:text-5xl font-black font-mono text-white tracking-wider">
                {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsFocusRunning(!isFocusRunning)}
              className="h-11 px-7 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-2 mx-auto cursor-pointer shadow-md transition-all"
            >
              {isFocusRunning ? <Pause className="size-4" /> : <Play className="size-4" />}
              <span>{isFocusRunning ? 'Pause Session' : 'Start Focus'}</span>
            </button>
          </div>
        );

      case 'notes':
        return (
          <div className="p-4 sm:p-7 max-w-4xl mx-auto">
            <IosNotesApp isAdmin={false} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      suppressHydrationWarning
      className="min-h-screen relative flex flex-col justify-center items-center p-3 sm:p-6 select-none overflow-hidden"
    >
      {/* Minimalist macOS/iPadOS dark emerald boot screen */}
      {isBooting && <ZosBootScreen isFadingOut={isBootFading} />}

      {/* Full-bleed Dynamic ZOS Desktop Wallpaper */}
      <ZosWallpaper wallpaperId={settings?.wallpaper} />

      {/* Top Header Navigation */}
      <div className="w-full max-w-4xl mb-3 flex items-center justify-between px-2 z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Portfolio</span>
        </Link>
        <span className="text-xs font-mono text-white/50">0xZahidP OS • Public Suite</span>
      </div>

      {/* Main Responsive Launchpad Container (wide on desktop, mobile-fluid on phone) */}
      <div className="w-full max-w-4xl min-h-[640px] rounded-3xl border border-white/15 shadow-2xl overflow-hidden bg-black/40 backdrop-blur-2xl relative flex flex-col justify-between z-10">
        {/* Inner ambient light overlay matching current ZOS wallpaper */}
        <ZosWallpaper wallpaperId={settings?.wallpaper} isContainer className="rounded-3xl opacity-80" />

        {/* Top Status Bar: FIXED DUPLICATE CLOCK & SHOWS CURRENT DATE */}
        <div className="relative pt-3 px-6 pb-2.5 flex items-center justify-between text-white text-xs z-30 border-b border-white/5 bg-black/20 shrink-0">
          <span
            suppressHydrationWarning
            className="font-medium text-[11px] tracking-tight font-mono text-white/80"
          >
            {currentDate}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-[11px] font-mono text-white/80 font-semibold">Zahid OS 18</span>
          </div>
          <div className="flex items-center gap-2">
            <Wifi className="size-3.5 text-white/80" />
            <Battery className="size-4 text-white/80" />
          </div>
        </div>

        {/* Open App View vs Springboard Desktop */}
        {openApp ? (
          <div className="flex-1 flex flex-col justify-between overflow-hidden bg-black/40 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between bg-black/30 shrink-0">
              <button
                type="button"
                onClick={() => setOpenApp(null)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white hover:text-white/80 cursor-pointer"
              >
                <ChevronLeft className="size-4" />
                <span>Back to Desktop</span>
              </button>
              <h3 className="font-bold text-xs text-white capitalize">{openApp}</h3>
              <button
                type="button"
                onClick={() => setOpenApp(null)}
                className="size-7 rounded-xl bg-white/10 text-white/80 grid place-items-center cursor-pointer text-xs hover:bg-white/20 transition-colors"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">{renderOpenApp()}</div>

            {/* Bottom Grab Indicator Bar */}
            <div
              onClick={() => setOpenApp(null)}
              className="py-3 grid place-items-center cursor-pointer hover:bg-white/5 transition-colors shrink-0"
              title="Return to Desktop"
            >
              <div className="w-32 h-1 bg-white/40 rounded-full" />
            </div>
          </div>
        ) : (
          /* Springboard App Launcher */
          <div className="flex-1 flex flex-col justify-between p-6 sm:p-8">
            {/* Hero Clock & Quick Search */}
            <div className="text-center pt-2 space-y-1">
              <h1
                suppressHydrationWarning
                className="text-4xl sm:text-6xl font-black text-white tracking-tight drop-shadow-md font-sans"
              >
                {currentTime}
              </h1>
              <p className="text-xs sm:text-sm font-medium text-white/80">
                {settings?.public_hero_title || 'Zahid OS'} • {settings?.public_hero_subtitle || 'Cloud Tools & Web Utilities'}
              </p>

              {/* Quick Search Spotlight Bar Trigger */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsSpotlightOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-xs text-white/70 hover:text-white transition-all shadow-sm backdrop-blur-md cursor-pointer group"
                >
                  <Search className="size-3.5 text-white/50 group-hover:text-emerald-400 transition-colors" />
                  <span>Search tools, shortcuts &amp; docs...</span>
                  <kbd className="px-1.5 py-0.5 rounded-md bg-black/40 border border-white/20 text-[10px] font-mono text-white/60">
                    ⌘K
                  </kbd>
                </button>
              </div>
            </div>

            {/* Balanced Dynamic App Grid (Centered flexbox: visually balanced regardless of app count) */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 max-w-2xl mx-auto w-full px-2 py-6 my-auto">
              {publicApps.map((app) => {
                const Icon = app.icon;
                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => setOpenApp(app.id)}
                    className="w-24 sm:w-28 flex flex-col items-center gap-2 cursor-pointer text-center group transition-transform duration-200 ease-out hover:scale-105 hover:-translate-y-1 active:scale-95"
                  >
                    <div
                      className={`size-20 sm:size-22 rounded-[24%] bg-gradient-to-br ${app.gradient} shadow-xl shadow-black/40 border border-white/20 flex items-center justify-center text-white relative overflow-hidden`}
                    >
                      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent" />
                      <Icon className="size-9 sm:size-10 drop-shadow-md" />

                      {/* Numeric Badge (e.g. 64, link count) */}
                      {app.numericBadge && (
                        <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-bold shadow-xs">
                          {app.numericBadge}
                        </span>
                      )}

                      {/* Consistent Glass Pill Tag for Text Labels (REST, OTP) */}
                      {app.tagBadge && (
                        <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-white/20 backdrop-blur-md border border-white/30 text-white font-mono text-[9px] font-bold tracking-tight shadow-xs">
                          {app.tagBadge}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block leading-tight">
                        {app.name}
                      </span>
                      <span className="text-[10px] text-white/60 block mt-0.5">
                        {app.subtitle}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Distinct Core Dock (Spotlight, Pinned Utilities, Wallpaper Toggle, Admin Gateway) */}
            <div className="mt-auto shrink-0 pt-2">
              <div className="p-2.5 rounded-[30px] bg-white/10 backdrop-blur-2xl border border-white/15 shadow-2xl flex items-center justify-center gap-3 max-w-sm mx-auto">
                {/* 1. Quick Spotlight Search Icon */}
                <button
                  type="button"
                  onClick={() => setIsSpotlightOpen(true)}
                  className="size-11 sm:size-12 rounded-[22%] bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-emerald-300 transition-all transform hover:scale-110 active:scale-95 cursor-pointer shadow-md"
                  title="Spotlight Quick Search (⌘K)"
                >
                  <Search className="size-5" />
                </button>

                {/* Divider */}
                <div className="w-px h-6 bg-white/20" />

                {/* 2. Pinned Active Utilities (Max 3 favorites) */}
                {dockPinnedApps.map((dockApp) => {
                  const DockIcon = dockApp.icon;
                  return (
                    <button
                      key={dockApp.id}
                      type="button"
                      onClick={() => setOpenApp(dockApp.id)}
                      className={`size-11 sm:size-12 rounded-[22%] bg-gradient-to-br ${dockApp.gradient} shadow-md border border-white/20 flex items-center justify-center text-white transition-all transform hover:scale-110 active:scale-95 cursor-pointer`}
                      title={dockApp.name}
                    >
                      <DockIcon className="size-5.5 text-white" />
                    </button>
                  );
                })}

                {/* Divider */}
                <div className="w-px h-6 bg-white/20" />

                {/* 3. Quick Wallpaper Switcher */}
                <button
                  type="button"
                  onClick={handleCycleWallpaper}
                  className="size-11 sm:size-12 rounded-[22%] bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-teal-300 transition-all transform hover:scale-110 active:scale-95 cursor-pointer shadow-md"
                  title="Cycle Desktop Theme / Wallpaper"
                >
                  <Palette className="size-5" />
                </button>

                {/* 4. Admin / CMS Gateway */}
                <Link
                  href="/admin"
                  className="size-11 sm:size-12 rounded-[22%] bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-amber-300 transition-all transform hover:scale-110 active:scale-95 cursor-pointer shadow-md"
                  title="FolioFrame Admin Studio Gateway"
                >
                  <ShieldCheck className="size-5" />
                </Link>
              </div>

              {/* Centered Grab Indicator */}
              <div className="w-32 h-1 bg-white/40 rounded-full mx-auto mt-3" />
            </div>
          </div>
        )}
      </div>

      {/* Spotlight Command Modal */}
      <ZosSpotlightModal
        isOpen={isSpotlightOpen}
        onClose={() => setIsSpotlightOpen(false)}
        apps={spotlightApps}
        links={links}
        onLaunchApp={(id) => setOpenApp(id)}
      />
    </div>
  );
};
