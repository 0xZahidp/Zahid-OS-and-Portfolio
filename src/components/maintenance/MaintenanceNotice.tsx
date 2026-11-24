'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Wrench, ArrowRight, ShieldCheck, Sparkles, KeyRound, Unlock } from 'lucide-react';

const REDIRECT_URL = 'https://v1.zahidp.com';
const COUNTDOWN_SECONDS = 5;
const BYPASS_PASSCODE = '3754';
const STORAGE_KEY = 'folioframe_maintenance_bypass';

export const MaintenanceNotice: React.FC = () => {
  const pathname = usePathname();
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [mounted, setMounted] = useState(false);
  const [isBypassed, setIsBypassed] = useState(false);
  const [showPasscodeInput, setShowPasscodeInput] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if previously bypassed via localStorage or URL query param ?passcode=3754
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      const urlParams = new URLSearchParams(window.location.search);
      const urlCode = urlParams.get('passcode') || urlParams.get('preview');

      if (saved === BYPASS_PASSCODE || urlCode === BYPASS_PASSCODE) {
        localStorage.setItem(STORAGE_KEY, BYPASS_PASSCODE);
        setIsBypassed(true);
      }
    }
  }, []);

  // Do NOT render on /admin or /api routes
  const isAdminOrApi =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/api') ||
    pathname?.startsWith('/auth') ||
    pathname?.startsWith('/reset-password');

  useEffect(() => {
    if (!mounted || isAdminOrApi || isBypassed) return;

    if (secondsLeft <= 0) {
      window.location.href = REDIRECT_URL;
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = REDIRECT_URL;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mounted, isAdminOrApi, isBypassed, secondsLeft]);

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === BYPASS_PASSCODE) {
      localStorage.setItem(STORAGE_KEY, BYPASS_PASSCODE);
      setIsBypassed(true);
    } else {
      setPasscodeError(true);
      setTimeout(() => setPasscodeError(false), 2000);
    }
  };

  if (!mounted || isAdminOrApi || isBypassed) {
    return null;
  }

  const progressPercent = ((COUNTDOWN_SECONDS - secondsLeft) / COUNTDOWN_SECONDS) * 100;

  return (
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-2xl select-none"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="maintenance-title"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#0E0E10]/95 p-6 sm:p-8 text-[#EDEDEE] shadow-2xl shadow-black/80 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
        {/* Ambient Top Glow */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-36 bg-[#E5A93C]/15 blur-3xl rounded-full pointer-events-none"
          aria-hidden="true"
        />

        {/* Status Badge */}
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E5A93C]/30 bg-[#E5A93C]/10 px-3 py-1 text-xs font-medium text-[#E5A93C]">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#E5A93C] opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-[#E5A93C]" />
            </span>
            Scheduled Maintenance & Redesign
          </div>

          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Sparkles className="size-3.5 text-[#E5A93C]" />
            <span>v2 In Progress</span>
          </div>
        </div>

        {/* Header Content */}
        <div className="mt-5">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl border border-white/10 bg-white/5 text-[#E5A93C]">
              <Wrench className="size-5" />
            </div>
            <div>
              <h1 id="maintenance-title" className="text-xl sm:text-2xl font-bold tracking-tight text-[#EDEDEE]">
                We&apos;re Upgrading zahidp.com
              </h1>
              <p className="text-xs sm:text-sm text-[#94949E]">
                Md Zahid Hasan Patwary — Developer Profile &amp; OS
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-[#EDEDEE]/90">
            Our portfolio is currently undergoing an extensive visual redesign and architectural upgrade.
            We will be back shortly with a brand-new experience.
          </p>
        </div>

        {/* Redirect Notice & Progress Bar */}
        <div className="mt-6 rounded-2xl border border-[#27272C] bg-[#17171A] p-4">
          <div className="flex items-center justify-between text-xs text-[#94949E]">
            <span>Redirecting to stable portfolio archive</span>
            <span className="font-semibold tabular-nums text-[#E5A93C]">
              {secondsLeft > 0 ? `${secondsLeft}s` : 'Redirecting...'}
            </span>
          </div>

          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-[#E5A93C] transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className="mt-2 text-xs text-[#94949E] flex items-center gap-1.5">
            <span className="font-mono text-[#EDEDEE]">v1.zahidp.com</span>
          </p>
        </div>

        {/* Passcode Unlock Bar for Developer (Passcode: 3754) */}
        <div className="mt-4 pt-3 border-t border-white/5">
          {!showPasscodeInput ? (
            <button
              type="button"
              onClick={() => {
                setShowPasscodeInput(true);
                // Pause countdown when opening passcode
                setSecondsLeft(9999);
              }}
              className="w-full text-center text-[11px] text-[#94949E] hover:text-[#E5A93C] transition-colors flex items-center justify-center gap-1.5 cursor-pointer py-1"
            >
              <KeyRound className="size-3.5" />
              <span>Developer Preview Access (Enter Passcode)</span>
            </button>
          ) : (
            <form onSubmit={handlePasscodeSubmit} className="flex items-center gap-2">
              <input
                type="password"
                maxLength={8}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter passcode (e.g. 3754)"
                autoFocus
                className={`flex-1 h-9 rounded-xl px-3 bg-white/5 border text-xs text-white placeholder:text-zinc-500 outline-none transition-all ${
                  passcodeError ? 'border-rose-500 focus:border-rose-500' : 'border-white/15 focus:border-[#E5A93C]'
                }`}
              />
              <button
                type="submit"
                className="h-9 px-3.5 rounded-xl bg-[#E5A93C] hover:bg-[#D97706] text-[#0E0E10] font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
              >
                <Unlock className="size-3.5" />
                <span>Unlock</span>
              </button>
            </form>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex flex-col sm:flex-row items-center gap-3">
          <a
            href={REDIRECT_URL}
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 transition-all shadow-md"
          >
            <span>Go to v1.zahidp.com</span>
            <ArrowRight className="size-4" />
          </a>

          <a
            href="/admin"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-transparent px-4 py-3 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
            title="Administrator access"
          >
            <ShieldCheck className="size-3.5" />
            <span>Admin Portal</span>
          </a>
        </div>
      </div>
    </div>
  );
};
