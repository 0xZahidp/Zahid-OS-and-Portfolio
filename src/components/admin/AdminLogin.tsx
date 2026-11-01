'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Fingerprint,
  ArrowRight,
  Shield,
  Loader2,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { GoogleIcon } from '@/components/ui/Icons';

export const AdminLogin: React.FC = () => {
  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithPasskey,
    bypassLocalAuth,
    error,
    clearError,
  } = useAdminAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
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
      if (mode === 'signin') {
        const res = await signInWithEmail(email, password);
        if (!res.success) {
          setIsSubmitting(false);
        }
      } else {
        const res = await signUpWithEmail(email, password);
        setIsSubmitting(false);
        if (res.success && res.message) {
          setSuccessMessage(res.message);
        }
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
    await signInWithPasskey();
    setIsPasskeyLoading(false);
  };

  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden select-none">
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34rem] h-[34rem] bg-brand-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Back to Portfolio Link */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-3 hover:text-ink transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Portfolio</span>
        </Link>
        <span className="text-[11px] font-mono text-ink-3">FolioFrame Studio v1.0</span>
      </div>

      {/* Main Login Card */}
      <div className="card-raised rounded-3xl border border-line bg-surface p-7 sm:p-9 max-w-md w-full shadow-2xl relative">
        {/* Header with Brand Icon */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="size-13 rounded-2xl bg-gradient-to-b from-brand-500 to-brand-700 shadow-md shadow-brand-500/20 grid place-items-center text-white mb-4.5 ring-1 ring-white/20">
            <Shield className="size-6.5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            {mode === 'signin' ? 'Sign in to CMS Studio' : 'Create Admin Account'}
          </h1>
          <p className="mt-1.5 text-xs text-ink-3 max-w-xs">
            {mode === 'signin'
              ? 'Authenticate to edit your portfolio identity, skills, projects, and secrets.'
              : 'Register your email and password to secure your personal portfolio CMS.'}
          </p>
        </div>

        {/* Success Feedback */}
        {successMessage && (
          <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs">
            <CheckCircle2 className="size-4.5 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{successMessage}</p>
          </div>
        )}

        {/* Error Feedback */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
            <AlertCircle className="size-4.5 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading || isSubmitting || isPasskeyLoading}
          className="w-full h-11 rounded-2xl border border-line bg-surface-2/60 hover:bg-surface-2 text-ink font-semibold text-xs tracking-[-0.01em] transition-all flex items-center justify-center gap-2.5 shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
        >
          {isGoogleLoading ? (
            <Loader2 className="size-4 animate-spin text-ink-2" />
          ) : (
            <GoogleIcon className="size-4.5 shrink-0" />
          )}
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-line" />
          </div>
          <span className="relative bg-surface px-3 text-[11px] font-medium text-ink-3 uppercase tracking-wider">
            or continue with email
          </span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-ink-2 mb-1.5">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-3" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full h-10.5 rounded-xl border border-line bg-surface px-3.5 pl-10 text-xs text-ink placeholder:text-ink-3/70 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-sans"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-semibold text-ink-2">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-10.5 rounded-xl border border-line bg-surface px-3.5 pl-10 pr-10 text-xs text-ink placeholder:text-ink-3/70 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-3 hover:text-ink transition-colors cursor-pointer rounded-md"
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isGoogleLoading || isPasskeyLoading}
            className="w-full h-11 mt-1 rounded-xl bg-gradient-to-b from-brand-500 to-brand-700 hover:from-brand-600 hover:to-brand-800 text-white font-semibold text-xs tracking-[-0.01em] shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="size-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Passkey / FIDO2 Authentication Section */}
        <div className="mt-6 pt-5 border-t border-line">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-semibold text-ink-2 flex items-center gap-1.5">
              <KeyRound className="size-3.5 text-brand-500" />
              <span>Biometric & Hardware Key</span>
            </span>
            <span className="text-[10px] text-ink-3 uppercase tracking-wider">WebAuthn</span>
          </div>

          <button
            type="button"
            onClick={handlePasskeySignIn}
            disabled={isPasskeyLoading || isSubmitting || isGoogleLoading}
            className="w-full h-11 rounded-xl border border-line bg-surface hover:bg-surface-2 text-ink font-semibold text-xs transition-all flex items-center justify-center gap-2.5 shadow-xs cursor-pointer disabled:opacity-60 group"
          >
            {isPasskeyLoading ? (
              <Loader2 className="size-4 animate-spin text-brand-500" />
            ) : (
              <Fingerprint className="size-4.5 text-brand-500 group-hover:scale-110 transition-transform" />
            )}
            <span>Sign in with Passkey</span>
          </button>
          <p className="mt-2 text-center text-[10.5px] text-ink-3">
            Use Apple Touch ID / Face ID, YubiKey, or Windows Hello.
          </p>
        </div>

        {/* Switch Signin / Signup Mode */}
        <div className="mt-6 text-center text-xs text-ink-3">
          {mode === 'signin' ? (
            <>
              Don&apos;t have an admin account?{' '}
              <button
                type="button"
                onClick={() => {
                  clearError();
                  setMode('signup');
                }}
                className="font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  clearError();
                  setMode('signin');
                }}
                className="font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </>
          )}
        </div>

        {/* Local Dev Bypass for zero-friction local testing */}
        {isLocalhost && (
          <div className="mt-6 pt-4 border-t border-dashed border-line text-center">
            <button
              type="button"
              onClick={bypassLocalAuth}
              className="text-[11px] font-semibold text-ink-3 hover:text-ink underline decoration-dashed transition-colors cursor-pointer"
            >
              Development Bypass (Preview CMS without logging in)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
