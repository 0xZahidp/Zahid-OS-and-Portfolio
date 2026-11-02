'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Lock,
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
  Home,
  ShieldCheck,
  Terminal,
  Flame,
} from 'lucide-react';
import { ShortLink, ZahidOsSettings, ZahidOsAppId } from '@/types/os';

export default function PublicZahidOsPage() {
  const [settings, setSettings] = useState<ZahidOsSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [openApp, setOpenApp] = useState<ZahidOsAppId | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('09:41');

  // Links for public consumption
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [customQrUrl, setCustomQrUrl] = useState<string>('');

  // Focus clock state
  const [focusSeconds, setFocusSeconds] = useState<number>(25 * 60);
  const [isFocusRunning, setIsFocusRunning] = useState<boolean>(false);

  // Live clock
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(
        `${d.getHours().toString().padStart(2, '0')}:${d
          .getMinutes()
          .toString()
          .padStart(2, '0')}`
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Timer
  useEffect(() => {
    let t: NodeJS.Timeout;
    if (isFocusRunning && focusSeconds > 0) {
      t = setInterval(() => setFocusSeconds((s) => s - 1), 1000);
    } else if (focusSeconds === 0) {
      setIsFocusRunning(false);
    }
    return () => clearInterval(t);
  }, [isFocusRunning, focusSeconds]);

  // Load OS settings & public links
  useEffect(() => {
    async function loadData() {
      try {
        const [settsRes, linksRes] = await Promise.all([
          fetch('/api/os/settings'),
          fetch('/api/os/short-links'),
        ]);

        if (settsRes.ok) {
          const sData = await settsRes.json();
          setSettings(sData.settings);
        }
        if (linksRes.ok) {
          const lData = await linksRes.json();
          setLinks(lData.links || []);
        }
      } catch (err) {
        console.warn('Error loading public OS:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://0xZahidP.com';

  const handleCopy = (slug: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${origin}/s/${slug}`);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    }
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-3 select-none">
        <div className="size-12 rounded-[22%] bg-gradient-to-br from-emerald-500 to-teal-700 animate-pulse grid place-items-center shadow-lg shadow-emerald-500/20 text-white font-black text-xl">
          Z
        </div>
        <p className="text-xs font-mono text-neutral-400">Booting Zahid OS...</p>
      </div>
    );
  }

  // Gated Screen if Public Access is turned off in OS Settings
  if (!settings?.is_public_enabled) {
    return (
      <div className="min-h-screen bg-surface flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden select-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="card-raised rounded-3xl border border-line bg-surface p-8 sm:p-10 max-w-md w-full shadow-2xl text-center space-y-5">
          <div className="size-16 rounded-[22%] bg-zinc-900 border border-zinc-800 text-amber-400 mx-auto grid place-items-center shadow-lg">
            <Lock className="size-8" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-2 border border-line text-[11px] font-mono text-ink-3 mb-2">
              <Terminal className="size-3 text-brand-500" />
              <span>Zahid OS 18 • Private Mode</span>
            </div>

            <h1 className="text-xl font-bold tracking-tight text-ink">
              Developer Access Only
            </h1>

            <p className="mt-2 text-xs text-ink-3 max-w-xs mx-auto leading-relaxed">
              Public access to Zahid OS is currently in private mode. Sign in to the CMS studio to enable public access and configure permissions.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <Link
              href="/"
              className="w-full sm:w-auto h-10 px-5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-brand-500/20 cursor-pointer"
            >
              <Home className="size-3.5" />
              <span>0xZahidP Portfolio</span>
            </Link>
            <Link
              href="/admin"
              className="w-full sm:w-auto h-10 px-4 rounded-xl border border-line hover:bg-surface-2 text-ink-2 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="size-3.5 text-brand-500" />
              <span>Admin Studio</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Public Apps Filtered by Permissions
  const publicApps = [
    {
      id: 'shortener' as ZahidOsAppId,
      name: 'Shortener',
      subtitle: 'URL Engine',
      gradient: 'from-cyan-500 via-blue-600 to-indigo-600',
      icon: Link2,
      enabled: settings.app_permissions?.shortener?.is_public !== false,
      badge: `${links.length}`,
    },
    {
      id: 'qr' as ZahidOsAppId,
      name: 'QR Studio',
      subtitle: 'Matrix Generator',
      gradient: 'from-fuchsia-500 via-purple-600 to-indigo-700',
      icon: QrCode,
      enabled: settings.app_permissions?.qr?.is_public !== false,
    },
    {
      id: 'snippets' as ZahidOsAppId,
      name: 'Snippets',
      subtitle: 'Code Cheat Sheet',
      gradient: 'from-emerald-400 via-teal-500 to-emerald-700',
      icon: Code2,
      enabled: settings.app_permissions?.snippets?.is_public !== false,
    },
    {
      id: 'focus' as ZahidOsAppId,
      name: 'Focus',
      subtitle: 'Pomodoro Timer',
      gradient: 'from-orange-500 via-rose-600 to-red-600',
      icon: Clock,
      enabled: settings.app_permissions?.focus?.is_public !== false,
    },
  ].filter((a) => a.enabled);

  // Render Public App
  const renderPublicApp = () => {
    switch (openApp) {
      case 'shortener':
        return (
          <div className="p-4 sm:p-7 space-y-4 max-w-3xl mx-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="font-bold text-base text-white">Public Links Directory</h3>
                <p className="text-xs text-white/60">Short shortcuts curated by 0xZahidP.</p>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {links
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

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center p-3 sm:p-6 relative select-none">
      {/* Top Navigation */}
      <div className="w-full max-w-4xl mb-3 flex items-center justify-between px-2">
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
      <div className="w-full max-w-4xl min-h-[640px] rounded-3xl border border-white/10 shadow-2xl overflow-hidden bg-black relative flex flex-col justify-between">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950 via-teal-950 to-black -z-10" />

        {/* Top Status Bar */}
        <div className="relative pt-3 px-6 pb-2.5 flex items-center justify-between text-white text-xs z-30 border-b border-white/5 bg-black/20 shrink-0">
          <span className="font-semibold text-xs tracking-tight font-sans">
            {currentTime}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono text-white/70">Zahid OS 18</span>
          </div>
          <div className="flex items-center gap-2">
            <Wifi className="size-3.5 text-white" />
            <Battery className="size-4 text-white" />
          </div>
        </div>

        {/* Open App View */}
        {openApp ? (
          <div className="flex-1 flex flex-col justify-between overflow-hidden bg-black/40 backdrop-blur-2xl">
            <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between bg-black/30 shrink-0">
              <button
                type="button"
                onClick={() => setOpenApp(null)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white hover:text-white/80 cursor-pointer"
              >
                <ChevronLeft className="size-4" />
                <span>Back to Apps</span>
              </button>
              <h3 className="font-bold text-xs text-white capitalize">{openApp}</h3>
              <button
                type="button"
                onClick={() => setOpenApp(null)}
                className="size-7 rounded-xl bg-white/10 text-white/80 grid place-items-center cursor-pointer text-xs"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">{renderPublicApp()}</div>

            <div
              onClick={() => setOpenApp(null)}
              className="py-3 grid place-items-center cursor-pointer hover:bg-white/5 transition-colors shrink-0"
            >
              <div className="w-32 h-1 bg-white/40 rounded-full" />
            </div>
          </div>
        ) : (
          /* Springboard App Launcher */
          <div className="flex-1 flex flex-col justify-between p-6 sm:p-10">
            <div className="text-center pt-2">
              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight drop-shadow-md">
                {currentTime}
              </h1>
              <p className="text-xs sm:text-sm font-medium text-white/80 mt-1">
                Zahid OS • Public Cloud Utilities
              </p>
            </div>

            {/* Responsive Apps Grid (3 cols on mobile, 4-6 cols on desktop) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 my-auto max-w-xl mx-auto w-full px-2 py-6">
              {publicApps.map((app) => {
                const Icon = app.icon;
                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => setOpenApp(app.id)}
                    className="group flex flex-col items-center gap-2 cursor-pointer text-center"
                  >
                    <div
                      className={`size-20 sm:size-24 rounded-[24%] bg-gradient-to-br ${app.gradient} shadow-xl shadow-black/40 border border-white/20 flex items-center justify-center text-white transition-all transform duration-200 group-hover:scale-105 group-hover:-translate-y-1 group-active:scale-95 relative overflow-hidden`}
                    >
                      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent" />
                      <Icon className="size-9 sm:size-10 drop-shadow-md" />
                      {app.badge && (
                        <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-bold">
                          {app.badge}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {app.name}
                      </span>
                      <span className="text-[10px] text-white/60 block">
                        {app.subtitle}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Dock */}
            <div className="mt-auto shrink-0">
              <div className="p-2.5 rounded-[30px] bg-white/10 backdrop-blur-2xl border border-white/15 shadow-2xl flex items-center justify-around max-w-xs mx-auto">
                {publicApps.map((dockApp) => {
                  const DockIcon = dockApp.icon;
                  return (
                    <button
                      key={dockApp.id}
                      type="button"
                      onClick={() => setOpenApp(dockApp.id)}
                      className={`size-12 rounded-[22%] bg-gradient-to-br ${dockApp.gradient} shadow-md border border-white/20 flex items-center justify-center text-white transition-all transform hover:scale-110 active:scale-95 cursor-pointer`}
                      title={dockApp.name}
                    >
                      <DockIcon className="size-6 text-white" />
                    </button>
                  );
                })}
              </div>
              <div className="w-32 h-1 bg-white/40 rounded-full mx-auto mt-3" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
