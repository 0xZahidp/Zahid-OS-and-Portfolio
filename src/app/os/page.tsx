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
              Public access to Zahid OS has not been enabled yet. If you are the owner, sign in to the CMS to configure OS permissions.
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
      gradient: 'from-cyan-500 via-blue-600 to-indigo-600',
      icon: Link2,
      enabled: settings.app_permissions?.shortener?.is_public !== false,
      badge: `${links.length}`,
    },
    {
      id: 'qr' as ZahidOsAppId,
      name: 'QR Studio',
      gradient: 'from-fuchsia-500 via-purple-600 to-indigo-700',
      icon: QrCode,
      enabled: settings.app_permissions?.qr?.is_public !== false,
    },
    {
      id: 'snippets' as ZahidOsAppId,
      name: 'Snippets',
      gradient: 'from-emerald-400 via-teal-500 to-emerald-700',
      icon: Code2,
      enabled: settings.app_permissions?.snippets?.is_public !== false,
    },
    {
      id: 'focus' as ZahidOsAppId,
      name: 'Focus',
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
          <div className="p-4 sm:p-6 space-y-4">
            <div className="text-center pb-3 border-b border-white/10">
              <h3 className="font-bold text-sm text-white">Public Links Directory</h3>
              <p className="text-[11px] text-white/60">Short shortcuts curated by 0xZahidP.</p>
            </div>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {links
                .filter((l) => l.is_active !== false)
                .map((link) => (
                  <div
                    key={link.id}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white truncate block">
                        {link.title}
                      </span>
                      <span className="text-[11px] font-mono text-cyan-400">/s/{link.slug}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopy(link.slug)}
                        className="h-7 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedSlug === link.slug ? (
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

                      <a
                        href={`/s/${link.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="size-7 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white grid place-items-center cursor-pointer"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        );

      case 'qr':
        return (
          <div className="p-6 text-center space-y-4">
            <h3 className="font-bold text-sm text-white">Instant QR Code Generator</h3>
            <input
              type="text"
              value={customQrUrl}
              onChange={(e) => setCustomQrUrl(e.target.value)}
              placeholder="Enter web link to generate QR..."
              className="w-full h-8 px-3 rounded-lg border border-white/10 bg-white/5 text-xs text-white outline-hidden font-mono"
            />
            <div className="p-4 bg-white rounded-2xl shadow-xl inline-block mx-auto border border-white/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  customQrUrl || origin
                )}`}
                alt="QR Code"
                className="size-40 object-contain rounded-lg"
              />
            </div>
          </div>
        );

      case 'focus':
        const mins = Math.floor(focusSeconds / 60);
        const secs = focusSeconds % 60;
        return (
          <div className="p-6 text-center space-y-6">
            <h3 className="font-bold text-sm text-white">Pomodoro Focus</h3>
            <div className="size-40 rounded-full border-4 border-rose-500/30 mx-auto grid place-items-center bg-white/5">
              <span className="text-3xl font-black font-mono text-white">
                {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsFocusRunning(!isFocusRunning)}
              className="h-10 px-6 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-2 mx-auto cursor-pointer"
            >
              {isFocusRunning ? <Pause className="size-4" /> : <Play className="size-4" />}
              <span>{isFocusRunning ? 'Pause' : 'Start Session'}</span>
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Top Navigation */}
      <div className="w-full max-w-sm mb-3 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Portfolio</span>
        </Link>
        <span className="text-[11px] font-mono text-white/50">0xZahidP OS</span>
      </div>

      {/* iPhone Mockup Frame */}
      <div className="w-full max-w-[390px] h-[780px] rounded-[50px] border-[7px] border-[#222326] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.12)] overflow-hidden bg-black relative">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950 via-teal-950 to-black -z-10" />

        {/* Dynamic Island & Status Bar */}
        <div className="relative pt-2.5 px-6 pb-2 flex items-center justify-between text-white text-xs z-30">
          <span className="font-semibold text-xs tracking-tight font-sans pl-1">
            {currentTime}
          </span>
          <div className="w-28 h-6.5 bg-black rounded-full flex items-center justify-between px-3 shadow-inner">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="size-2.5 rounded-full bg-neutral-900 border border-neutral-700" />
          </div>
          <div className="flex items-center gap-1.5 pr-1">
            <span className="text-[10px] font-semibold text-white/80">5G</span>
            <Wifi className="size-3 text-white" />
            <Battery className="size-3.5 text-white" />
          </div>
        </div>

        {openApp ? (
          <div className="h-[calc(100%-40px)] flex flex-col justify-between overflow-hidden bg-black/40 backdrop-blur-2xl">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-black/30">
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

            <div className="flex-1 overflow-y-auto">{renderPublicApp()}</div>

            <div
              onClick={() => setOpenApp(null)}
              className="py-2.5 grid place-items-center cursor-pointer"
            >
              <div className="w-32 h-1 bg-white/40 rounded-full" />
            </div>
          </div>
        ) : (
          <div className="h-[calc(100%-40px)] flex flex-col justify-between p-6">
            <div className="text-center pt-2">
              <h1 className="text-5xl font-black text-white tracking-tight drop-shadow-md">
                {currentTime}
              </h1>
              <p className="text-xs font-medium text-white/80 mt-1">Zahid OS • Public Beta</p>
            </div>

            <div className="grid grid-cols-3 gap-y-7 gap-x-4 my-auto px-2">
              {publicApps.map((app) => {
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

            <div className="mt-auto">
              <div className="p-2.5 rounded-[30px] bg-white/10 backdrop-blur-2xl border border-white/15 shadow-2xl flex items-center justify-around max-w-xs mx-auto">
                {publicApps.slice(0, 4).map((dockApp) => {
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
              <div className="w-32 h-1 bg-white/40 rounded-full mx-auto mt-3" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
