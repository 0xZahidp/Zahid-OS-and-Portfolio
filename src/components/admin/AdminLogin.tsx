/*
From Uiverse.io by Smit-Prajapati - https://uiverse.io/Smit-Prajapati/swift-liger-76
MIT License, Copyright (c) Smit-Prajapati (Smit Prajapati)
*/

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Eye,
  EyeOff,
  Fingerprint,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { GoogleIcon } from '@/components/ui/Icons';
import { supabase } from '@/lib/supabase/client';

export const AdminLogin: React.FC = () => {
  const {
    signInWithEmail,
    signInWithGoogle,
    signInWithPasskey,
    bypassLocalAuth,
    error,
    clearError,
  } = useAdminAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    clearError();
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const res = await signInWithEmail(email, password);
      if (res.success) {
        if (res.requiresMfa) {
          window.location.href = '/admin/mfa';
          return;
        }
      } else {
        setIsSubmitting(false);
      }
    } catch {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    clearError();
    setSuccessMessage(null);
    setIsGoogleLoading(true);
    const res = await signInWithGoogle();
    if (!res.success) {
      setIsGoogleLoading(false);
    }
  };

  const handlePasskeySignIn = async () => {
    clearError();
    setSuccessMessage(null);
    setIsPasskeyLoading(true);
    const res = await signInWithPasskey();
    setIsPasskeyLoading(false);
    if (res?.success) {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.currentLevel === 'aal1' && aal?.nextLevel === 'aal2') {
        window.location.href = '/admin/mfa';
      }
    }
  };

  const isLocalhost =
    process.env.NODE_ENV === 'development' &&
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden select-none">
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] bg-accent/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Back to Portfolio Link */}
      <div className="w-full max-w-[390px] mb-3.5 flex items-center justify-between px-1">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-text transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Portfolio</span>
        </Link>
        <span className="text-[11px] font-mono text-muted flex items-center gap-1">
          <Sparkles className="size-3 text-accent" />
          <span>ZahidP Studio</span>
        </span>
      </div>

      {/* Main Container Card (Adapted from Uiverse swift-liger-76) */}
      <div className="w-full max-w-[390px] rounded-[40px] p-7 sm:p-9 border-[5px] border-white/80 dark:border-[#27272C] bg-gradient-to-b from-white to-[#F4F7FB] dark:from-[#17171A] dark:to-[#0E0E10] shadow-[0_30px_35px_-20px_rgba(180,83,9,0.22)] dark:shadow-[0_30px_35px_-20px_rgba(0,0,0,0.7)] relative transition-all">
        {/* Heading */}
        <div className="text-center font-black text-3xl tracking-tight text-accent mb-2">
          Sign In
        </div>
        <p className="text-center text-xs text-muted mb-6">
          Manage your portfolio, projects & workspace.
        </p>

        {/* Success Feedback */}
        {successMessage && (
          <div className="mb-4 flex items-start gap-2.5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs">
            <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{successMessage}</p>
          </div>
        )}

        {/* Error Feedback */}
        {error && (
          <div className="mb-4 flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Email Input */}
          <div className="relative">
            <input
              required
              type="email"
              name="email"
              id="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              className="w-full bg-white dark:bg-[#1E1E23] text-text border-none px-5 py-3.5 rounded-[20px] text-xs sm:text-sm placeholder:text-muted/70 shadow-[0_10px_12px_-5px_rgba(180,83,9,0.12)] dark:shadow-[0_10px_12px_-5px_rgba(0,0,0,0.5)] outline-none border-x-2 border-transparent focus:border-accent transition-all font-sans"
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <input
              required
              type={showPassword ? 'text' : 'password'}
              name="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-white dark:bg-[#1E1E23] text-text border-none px-5 py-3.5 pr-11 rounded-[20px] text-xs sm:text-sm placeholder:text-muted/70 shadow-[0_10px_12px_-5px_rgba(180,83,9,0.12)] dark:shadow-[0_10px_12px_-5px_rgba(0,0,0,0.5)] outline-none border-x-2 border-transparent focus:border-accent transition-all font-sans"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors cursor-pointer"
              title={showPassword ? 'Hide password' : 'Show password'}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          {/* Forgot Password Link */}
          <div className="pt-0.5 pl-3">
            <Link
              href="/admin/reset-password"
              className="text-[11px] font-semibold text-accent hover:underline cursor-pointer"
            >
              Forgot Password ?
            </Link>
          </div>

          {/* Submit Button (Uiverse .login-button style) */}
          <button
            type="submit"
            disabled={isSubmitting || isGoogleLoading || isPasskeyLoading}
            className="w-full font-bold text-white dark:text-[#0E0E10] py-3.5 mt-4 rounded-[20px] bg-gradient-to-r from-accent to-[#D97706] dark:from-[#D97706] dark:to-accent shadow-[0_18px_14px_-12px_rgba(180,83,9,0.55)] hover:scale-[1.02] active:scale-[0.96] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="size-4.5 animate-spin" />
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Social & Biometric Authentication (Consolidated clean option) */}
        <div className="mt-6 pt-1">
          <span className="block text-center text-[10.5px] uppercase font-bold tracking-wider text-muted">
            Or Sign in with
          </span>

          <div className="grid grid-cols-2 gap-3 mt-3">
            {/* Google Social Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isSubmitting || isPasskeyLoading}
              title="Sign in with Google"
              aria-label="Sign in with Google"
              className="w-full flex items-center justify-center gap-2 py-3 px-3.5 rounded-[18px] bg-white dark:bg-[#1E1E23] text-text border border-line/60 hover:border-accent shadow-[0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 text-xs font-semibold font-sans"
            >
              {isGoogleLoading ? (
                <Loader2 className="size-4 animate-spin text-accent" />
              ) : (
                <GoogleIcon className="size-4 shrink-0" />
              )}
              <span>Google</span>
            </button>

            {/* Passkey Biometric Button */}
            <button
              type="button"
              onClick={handlePasskeySignIn}
              disabled={isPasskeyLoading || isSubmitting || isGoogleLoading}
              title="Sign in with Passkey (Touch ID, Windows Hello, YubiKey)"
              aria-label="Sign in with Passkey"
              className="w-full flex items-center justify-center gap-2 py-3 px-3.5 rounded-[18px] bg-white dark:bg-[#1E1E23] text-text border border-line/60 hover:border-accent shadow-[0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 text-xs font-semibold font-sans group"
            >
              {isPasskeyLoading ? (
                <Loader2 className="size-4 animate-spin text-accent" />
              ) : (
                <Fingerprint className="size-4.5 text-accent shrink-0 group-hover:scale-110 transition-transform" />
              )}
              <span>Passkey</span>
            </button>
          </div>
        </div>

        {/* User Workspace Agreement / Footer */}
        <span className="block text-center mt-5">
          <Link
            href="/"
            className="text-[10.5px] text-muted hover:text-accent transition-colors"
          >
            ZahidP Admin · Private Workspace
          </Link>
        </span>

        {/* Local Dev Bypass strictly restricted to local development */}
        {isLocalhost && (
          <div className="mt-5 pt-3.5 border-t border-dashed border-line text-center">
            <button
              type="button"
              onClick={bypassLocalAuth}
              className="text-[11px] font-semibold text-muted hover:text-text underline decoration-dashed transition-colors cursor-pointer"
            >
              Development Bypass (Preview CMS without logging in)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
