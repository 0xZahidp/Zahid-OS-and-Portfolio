'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  ArrowLeft,
  Loader2,
  AlertCircle,
  KeyRound,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { supabase } from '@/lib/supabase/client';

export default function AdminMfaChallengePage() {
  const router = useRouter();
  const { user, session, mfaLevel, checkMfaLevel, verifyMfaCode, signOut, isLoading } = useAdminAuth();

  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [factors, setFactors] = useState<Array<{ id: string; friendly_name?: string; status: string }>>([]);
  const [selectedFactorId, setSelectedFactorId] = useState<string>('');
  const [isLoadingFactors, setIsLoadingFactors] = useState(true);
  const [showEmergencyHelp, setShowEmergencyHelp] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Load user factors and check if already at AAL2
  useEffect(() => {
    let mounted = true;

    async function checkState() {
      // If no user session, go back to login
      if (!isLoading && !session && !user) {
        router.push('/admin');
        return;
      }

      // If user session is already AAL2, redirect to admin
      if (mfaLevel?.currentLevel === 'aal2') {
        router.push('/admin');
        return;
      }

      try {
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (!mounted) return;
        if (error) {
          console.warn('Could not list factors in MFA challenge:', error);
        } else if (data) {
          const verified = data.all.filter((f) => f.status === 'verified');
          setFactors(verified);
          if (verified.length > 0) {
            setSelectedFactorId(verified[0].id);
          } else {
            // No verified factors found: user doesn't actually need MFA
            await checkMfaLevel();
            router.push('/admin');
          }
        }
      } catch (err) {
        console.warn('Error loading factors:', err);
      } finally {
        if (mounted) setIsLoadingFactors(false);
      }
    }

    checkState();

    return () => {
      mounted = false;
    };
  }, [isLoading, session, user, mfaLevel, checkMfaLevel, router]);

  // Focus input automatically
  useEffect(() => {
    if (!isLoadingFactors && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoadingFactors]);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = code.replace(/\s+/g, '');
    if (cleanCode.length !== 6) {
      setErrorMessage('Please enter a complete 6-digit authentication code.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    const res = await verifyMfaCode(cleanCode, selectedFactorId || undefined);
    setIsVerifying(false);

    if (res.success) {
      // Upgraded to AAL2 -> navigate to dashboard
      router.push('/admin');
    } else {
      setErrorMessage(
        res.error || 'Invalid 6-digit authentication code. Please check your authenticator app and try again.'
      );
      setCode('');
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setCode(val);
    if (errorMessage) setErrorMessage(null);

    // Auto submit when 6 digits are reached
    if (val.length === 6) {
      setTimeout(() => {
        const cleanCode = val;
        setIsVerifying(true);
        verifyMfaCode(cleanCode, selectedFactorId || undefined).then((res) => {
          setIsVerifying(false);
          if (res.success) {
            router.push('/admin');
          } else {
            setErrorMessage(res.error || 'Invalid 6-digit authentication code.');
            setCode('');
            if (inputRef.current) inputRef.current.focus();
          }
        });
      }, 50);
    }
  };

  const currentFactor = factors.find((f) => f.id === selectedFactorId) || factors[0];

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden select-none">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34rem] h-[34rem] bg-brand-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top navigation ribbon */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-3 hover:text-ink transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Portfolio</span>
        </Link>
        <span className="text-[11px] font-mono text-ink-3">FolioFrame Security</span>
      </div>

      {/* Main 2FA Card */}
      <div className="card-raised rounded-3xl border border-line bg-surface p-7 sm:p-9 max-w-md w-full shadow-2xl relative">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="size-13 rounded-2xl bg-gradient-to-b from-brand-500 to-brand-700 shadow-md shadow-brand-500/20 grid place-items-center text-white mb-4 ring-1 ring-white/20">
            <ShieldCheck className="size-6.5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-ink">Two-Factor Authentication</h1>
          <p className="mt-1 text-xs text-ink-3 max-w-xs">
            Enter the 6-digit code from your authenticator app to step up to an AAL2 session.
          </p>
        </div>

        {/* User Identity info badge */}
        <div className="mb-5 p-3 rounded-xl bg-surface-2 border border-line flex items-center justify-between text-xs">
          <div className="truncate">
            <span className="text-ink-3 text-[11px]">Signing in as:</span>
            <p className="font-semibold text-ink truncate font-mono text-xs">{user?.email}</p>
          </div>
          {currentFactor?.friendly_name && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 shrink-0">
              {currentFactor.friendly_name}
            </span>
          )}
        </div>

        {/* Error notification banner */}
        {errorMessage && (
          <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
            <AlertCircle className="size-4.5 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* 6-digit code form */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-2 mb-2 text-center">
              6-Digit Authenticator Code
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={handleCodeChange}
                disabled={isVerifying || isLoadingFactors}
                placeholder="000 000"
                className="w-full h-12 text-center text-2xl font-mono tracking-[0.4em] font-bold rounded-xl bg-surface-2 border border-line text-ink placeholder:text-ink-4 placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all disabled:opacity-50"
              />
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-4 pointer-events-none" />
            </div>
            <p className="text-[10px] text-ink-3 text-center mt-1.5">
              Code refreshes every 30 seconds in Google Authenticator, 1Password, or Apple Keychain.
            </p>
          </div>

          {/* Factor switcher if multiple factors are enrolled */}
          {factors.length > 1 && (
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-ink-3">Select Authenticator Device:</label>
              <select
                value={selectedFactorId}
                onChange={(e) => setSelectedFactorId(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg bg-surface border border-line text-xs text-ink"
              >
                {factors.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.friendly_name || 'Authenticator App'} ({f.id.slice(0, 8)}...)
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={isVerifying || code.length !== 6 || isLoadingFactors}
            className="btn btn-primary w-full h-10 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-500/10 disabled:opacity-50"
          >
            {isVerifying ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
            <span>{isVerifying ? 'Verifying Code...' : 'Verify & Continue'}</span>
          </button>
        </form>

        {/* Secondary options & Emergency fallback */}
        <div className="mt-6 pt-5 border-t border-line/60 flex flex-col items-center gap-3 text-xs">
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={() => setShowEmergencyHelp(!showEmergencyHelp)}
              className="text-ink-3 hover:text-brand-600 dark:hover:text-brand-400 font-medium underline decoration-dashed cursor-pointer text-[11px]"
            >
              {showEmergencyHelp ? 'Hide recovery help' : 'Lost your authenticator?'}
            </button>

            <button
              type="button"
              onClick={signOut}
              className="text-rose-600 dark:text-rose-400 hover:underline font-medium inline-flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <LogOut className="size-3" />
              <span>Sign out</span>
            </button>
          </div>

          {/* REQUIREMENT 2: Emergency Helper Card with text explaining the Supabase Dashboard fallback only */}
          {showEmergencyHelp && (
            <div className="w-full mt-2 p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-[11px] space-y-2 text-left text-ink-2">
              <p className="font-semibold text-amber-800 dark:text-amber-300">
                Lost your authenticator device?
              </p>
              <p className="leading-relaxed text-ink-3">
                Supabase requires AAL2 authentication when a verified factor is active. Supabase does not have recovery codes. If you lost your device or authenticator app:
              </p>

              <div className="pt-2 border-t border-amber-500/20 text-[11px] text-ink-2">
                <span className="font-bold text-ink">Supabase Dashboard Fallback:</span> Go to{' '}
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-500 hover:underline inline-flex items-center gap-0.5 font-semibold"
                >
                  <span>Supabase Dashboard</span>
                  <ExternalLink className="size-2.5" />
                </a>{' '}
                → <strong>Authentication</strong> → <strong>Users</strong> → click{' '}
                <code className="font-mono px-1 py-0.5 rounded bg-surface border border-line text-[10px]">{user?.email}</code> → <strong>Factors</strong> → <strong>Delete</strong>.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
