'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Mail,
  Check,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Authentication & session state
  const [isVerifyingToken, setIsVerifyingToken] = useState<boolean>(true);
  const [isAuthenticatedForReset, setIsAuthenticatedForReset] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [hasMfaEnrolled, setHasMfaEnrolled] = useState<boolean>(false);

  // Form states
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Fallback request new link states
  const [requestEmail, setRequestEmail] = useState<string>('');
  const [isSendingLink, setIsSendingLink] = useState<boolean>(false);
  const [requestSuccess, setRequestSuccess] = useState<boolean>(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  // Helper to check if user has MFA enrolled
  const checkMfaStatus = async () => {
    try {
      const [aalRes, factorsRes] = await Promise.all([
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
        supabase.auth.mfa.listFactors(),
      ]);
      const verified = factorsRes.data?.all?.filter((f) => f.status === 'verified') || [];
      if (verified.length > 0 || aalRes.data?.nextLevel === 'aal2') {
        setHasMfaEnrolled(true);
      }
    } catch {
      // Non-blocking MFA check
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        if (typeof window === 'undefined') return;

        const hash = window.location.hash || '';
        const search = window.location.search || '';

        // 1. Check for URL error fragments from Supabase
        if (hash.includes('error=') || search.includes('error=')) {
          const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
          const errCode = hashParams.get('error_code') || searchParams.get('error_code');
          const errDesc = hashParams.get('error_description') || searchParams.get('error_description');

          if (errCode === 'otp_expired' || errDesc?.toLowerCase().includes('expired')) {
            setTokenError('This password reset link has expired or has already been used. Please request a new one.');
          } else {
            setTokenError(errDesc ? decodeURIComponent(errDesc.replace(/\+/g, ' ')) : 'Invalid or expired password reset link.');
          }
          setIsVerifyingToken(false);
          return;
        }

        // 2. Check for PKCE exchange code in query string
        const code = searchParams.get('code');
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.warn('PKCE exchange error:', error);
            setTokenError(error.message);
          } else if (data?.user) {
            setUserEmail(data.user.email || '');
            setIsAuthenticatedForReset(true);
            await checkMfaStatus();
            setIsVerifyingToken(false);
            return;
          }
        }

        // 3. Inspect existing active session or recovery session
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          setUserEmail(sessionData.session.user.email || '');
          setIsAuthenticatedForReset(true);
          await checkMfaStatus();
          setIsVerifyingToken(false);
          return;
        }

        // 4. If URL hash contains access_token with type=recovery, give Supabase a moment to set session
        if (hash.includes('access_token=') && hash.includes('type=recovery')) {
          await new Promise((r) => setTimeout(r, 600));
          const { data: refreshedSession } = await supabase.auth.getSession();
          if (refreshedSession?.session?.user) {
            setUserEmail(refreshedSession.session.user.email || '');
            setIsAuthenticatedForReset(true);
            await checkMfaStatus();
            setIsVerifyingToken(false);
            return;
          }
        }

        // No session found
        setIsVerifyingToken(false);
      } catch (err: unknown) {
        console.error('Password reset session error:', err);
        if (mounted) {
          setTokenError(err instanceof Error ? err.message : 'Failed to verify reset session');
          setIsVerifyingToken(false);
        }
      }
    }

    // Subscribe to auth state changes (catches PASSWORD_RECOVERY event)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        if (session?.user) {
          setUserEmail(session.user.email || '');
          setIsAuthenticatedForReset(true);
          setTokenError(null);
          await checkMfaStatus();
          setIsVerifyingToken(false);
        }
      }
    });

    initSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [searchParams]);

  // Validation rules
  const hasMinLength = newPassword.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const isFormValid = hasMinLength && hasLetter && hasNumberOrSymbol && passwordsMatch;

  // Handle password submission: Updates via backend admin endpoint to avoid client AAL2 block
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Get current recovery access token
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (token) {
        // Send to administrative endpoint which updates password directly without AAL2 block
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ password: newPassword }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          // Terminate temporary recovery session so user can log in cleanly with their new password
          await supabase.auth.signOut();
          setIsSuccess(true);
          setIsSubmitting(false);

          // Auto-redirect to /admin after 3 seconds
          setTimeout(() => {
            router.replace('/admin');
          }, 3000);
          return;
        }

        // If server returned an error, show it
        if (!res.ok || data.error) {
          setErrorMessage(data.error || 'Failed to update password. Please try again.');
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Client-side fallback if token wasn't in memory
      const { error: clientErr } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (clientErr) {
        setErrorMessage(clientErr.message);
        setIsSubmitting(false);
        return;
      }

      await supabase.auth.signOut();
      setIsSuccess(true);
      setIsSubmitting(false);

      setTimeout(() => {
        router.replace('/admin');
      }, 3000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred while resetting password.');
      setIsSubmitting(false);
    }
  };

  // Handle requesting a fresh reset link
  const handleRequestNewLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = (requestEmail || userEmail).trim();
    if (!email) return;

    setIsSendingLink(true);
    setRequestError(null);
    setRequestSuccess(false);

    try {
      const redirectUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/admin/reset-password`
          : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      setIsSendingLink(false);

      if (error) {
        setRequestError(error.message);
      } else {
        setRequestSuccess(true);
      }
    } catch (err: unknown) {
      setIsSendingLink(false);
      setRequestError(err instanceof Error ? err.message : 'Failed to send password reset email.');
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden select-none">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34rem] h-[34rem] bg-brand-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top navigation ribbon */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-3 hover:text-ink transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Sign In</span>
        </Link>
        <span className="text-[11px] font-mono text-ink-3">FolioFrame Security</span>
      </div>

      {/* Main Card */}
      <div className="card-raised rounded-3xl border border-line bg-surface p-7 sm:p-9 max-w-md w-full shadow-2xl relative">
        {/* 1. Loading / Token verification state */}
        {isVerifyingToken && (
          <div className="py-12 flex flex-col items-center text-center">
            <div className="size-13 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 grid place-items-center mb-4">
              <Loader2 className="size-6.5 animate-spin" />
            </div>
            <h2 className="text-base font-bold text-ink">Verifying Reset Token...</h2>
            <p className="mt-1 text-xs text-ink-3">Confirming your secure recovery credentials.</p>
          </div>
        )}

        {/* 2. Success state */}
        {!isVerifyingToken && isSuccess && (
          <div className="py-4 flex flex-col items-center text-center">
            <div className="size-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 grid place-items-center mb-4 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="size-7" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-ink">Password Updated!</h2>
            <p className="mt-2 text-xs text-ink-3 max-w-xs leading-relaxed">
              Your new password is now active. Please sign in with your new password to access the Admin Studio.
            </p>

            <Link
              href="/admin"
              className="mt-6 w-full h-11 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-brand-500/20"
            >
              <span>Sign In with New Password</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        )}

        {/* 3. Valid Recovery Session Form (Set new password) */}
        {!isVerifyingToken && !isSuccess && isAuthenticatedForReset && (
          <div>
            <div className="flex flex-col items-center text-center mb-6">
              <div className="size-13 rounded-2xl bg-gradient-to-b from-brand-500 to-brand-700 shadow-md shadow-brand-500/20 grid place-items-center text-white mb-4 ring-1 ring-white/20">
                <KeyRound className="size-6.5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-ink">Set New Password</h1>
              <p className="mt-1 text-xs text-ink-3 max-w-xs">
                Enter your new password below to secure your admin account.
              </p>
            </div>

            {/* User Identity Info */}
            {userEmail && (
              <div className="mb-5 p-3 rounded-xl bg-surface-2 border border-line flex items-center justify-between text-xs">
                <div className="truncate">
                  <span className="text-ink-3 text-[11px]">Account:</span>
                  <p className="font-semibold text-ink truncate font-mono text-xs">{userEmail}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <Check className="size-3" />
                    <span>Verified</span>
                  </span>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                <AlertCircle className="size-4.5 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-ink-2 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-3">
                    <Lock className="size-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Enter new password (min. 8 chars)"
                    autoComplete="new-password"
                    required
                    className="w-full h-11 pl-9 pr-10 rounded-xl border border-line bg-surface hover:bg-surface-2 focus:bg-surface focus:border-brand-500 text-ink placeholder:text-ink-4 text-xs font-medium outline-hidden transition-all shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-3 hover:text-ink cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-ink-2 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-3">
                    <Lock className="size-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Re-enter your new password"
                    autoComplete="new-password"
                    required
                    className="w-full h-11 pl-9 pr-10 rounded-xl border border-line bg-surface hover:bg-surface-2 focus:bg-surface focus:border-brand-500 text-ink placeholder:text-ink-4 text-xs font-medium outline-hidden transition-all shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-3 hover:text-ink cursor-pointer"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Password Requirements Checklist */}
              <div className="p-3 rounded-xl bg-surface-2 border border-line space-y-1.5 text-[11px]">
                <div className={`flex items-center gap-1.5 transition-colors ${hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-ink-3'}`}>
                  <Check className={`size-3.5 ${hasMinLength ? 'opacity-100' : 'opacity-40'}`} />
                  <span>At least 8 characters</span>
                </div>
                <div className={`flex items-center gap-1.5 transition-colors ${hasLetter && hasNumberOrSymbol ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-ink-3'}`}>
                  <Check className={`size-3.5 ${hasLetter && hasNumberOrSymbol ? 'opacity-100' : 'opacity-40'}`} />
                  <span>Letters and numbers or symbols</span>
                </div>
                <div className={`flex items-center gap-1.5 transition-colors ${passwordsMatch ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-ink-3'}`}>
                  <Check className={`size-3.5 ${passwordsMatch ? 'opacity-100' : 'opacity-40'}`} />
                  <span>Passwords match</span>
                </div>
              </div>

              {/* 2FA Reassurance Note */}
              {hasMfaEnrolled && (
                <div className="p-3 rounded-xl bg-brand-500/5 border border-brand-500/15 flex items-start gap-2.5 text-[11px] text-ink-3">
                  <ShieldCheck className="size-4 text-brand-500 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    2FA is active on your account. After updating your password, you will be prompted to enter your 6-digit authenticator code upon signing in.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="w-full h-11 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-brand-500/20 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* 4. Expired Token / Missing Session / Manual Request View */}
        {!isVerifyingToken && !isSuccess && !isAuthenticatedForReset && (
          <div>
            <div className="flex flex-col items-center text-center mb-6">
              <div className="size-13 rounded-2xl bg-gradient-to-b from-brand-500 to-brand-700 shadow-md shadow-brand-500/20 grid place-items-center text-white mb-4 ring-1 ring-white/20">
                <KeyRound className="size-6.5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-ink">Reset Your Password</h1>
              <p className="mt-1 text-xs text-ink-3 max-w-xs">
                {tokenError
                  ? 'Your password reset link is invalid or expired.'
                  : 'Enter your admin email to receive a secure recovery link.'}
              </p>
            </div>

            {tokenError && (
              <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs">
                <AlertCircle className="size-4.5 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{tokenError}</p>
              </div>
            )}

            {requestSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs text-center space-y-2">
                <CheckCircle2 className="size-5 mx-auto" />
                <p className="font-semibold">Reset Link Sent!</p>
                <p className="text-ink-3 text-[11px] leading-relaxed">
                  We sent a fresh password reset link to <strong className="text-ink font-mono">{requestEmail || userEmail}</strong>. Please check your inbox and click the link to continue.
                </p>
                <button
                  type="button"
                  onClick={() => setRequestSuccess(false)}
                  className="mt-3 text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                >
                  Send another link
                </button>
              </div>
            ) : (
              <form onSubmit={handleRequestNewLink} className="space-y-4">
                {requestError && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                    <p>{requestError}</p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-ink-2 mb-1.5">
                    Admin Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-3">
                      <Mail className="size-4" />
                    </div>
                    <input
                      type="email"
                      value={requestEmail}
                      onChange={(e) => setRequestEmail(e.target.value)}
                      placeholder="admin@0xZahidP.com"
                      required
                      className="w-full h-11 pl-9 pr-3 rounded-xl border border-line bg-surface hover:bg-surface-2 focus:bg-surface focus:border-brand-500 text-ink placeholder:text-ink-4 text-xs font-medium outline-hidden transition-all shadow-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!requestEmail || isSendingLink}
                  className="w-full h-11 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-brand-500/20 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSendingLink ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Sending Reset Link...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="size-3.5" />
                      <span>Send Password Reset Link</span>
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-6 pt-4 border-t border-line text-center">
              <Link
                href="/admin"
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
              >
                Return to Admin Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-3">
          <div className="size-11 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 grid place-items-center">
            <Loader2 className="size-5.5 animate-spin" />
          </div>
          <p className="text-xs font-semibold text-ink-3">Loading password reset...</p>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
