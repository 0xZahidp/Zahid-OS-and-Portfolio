'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Fingerprint,
  X,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';

interface UnlockVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlocked: (unlockToken: string, expiresAt: number) => void;
}

export const UnlockVaultModal: React.FC<UnlockVaultModalProps> = ({
  isOpen,
  onClose,
  onUnlocked,
}) => {
  const { session, isLocalBypass, signInWithPasskey } = useAdminAuth();
  const [totpCode, setTotpCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const clean = totpCode.replace(/\s+/g, '');
    if (!/^\d{6}$/.test(clean)) {
      setError('Please enter a valid 6-digit authenticator code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/clients/unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          method: 'totp',
          totpCode: clean,
          accessToken: session?.access_token,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || '2FA verification failed.');
      } else {
        setTotpCode('');
        onUnlocked(data.unlockToken, data.expiresAt);
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification request failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasskeyUnlock = async () => {
    setError(null);
    setIsPasskeyLoading(true);
    try {
      const pkRes = await signInWithPasskey();
      if (!pkRes.success) {
        setError(pkRes.error || 'Passkey verification failed.');
        setIsPasskeyLoading(false);
        return;
      }

      const res = await fetch('/api/admin/clients/unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          method: 'passkey',
          accessToken: session?.access_token,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to issue unlock token.');
      } else {
        onUnlocked(data.unlockToken, data.expiresAt);
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Passkey unlock failed');
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  const handleDevBypassUnlock = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/clients/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'dev_bypass' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Dev bypass unlock failed.');
      } else {
        onUnlocked(data.unlockToken, data.expiresAt);
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unlock failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line bg-surface-2/60">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink">2FA Step-Up Verification</h3>
              <p className="text-[11px] text-muted">
                Unlocks encrypted client passwords for 5 minutes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-3 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {error && (
            <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-start gap-2.5 text-xs text-rose-400">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Option 1: TOTP 6-Digit Code */}
          <form onSubmit={handleTotpSubmit} className="space-y-3">
            <label className="block text-xs font-semibold text-ink">
              6-Digit Authenticator Code (TOTP)
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <KeyRound className="size-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  autoFocus
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-surface-2 border border-line focus:border-accent outline-none text-sm font-mono tracking-[0.3em] text-ink placeholder:text-muted/50"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting || totpCode.length !== 6}
                className="h-10 px-4 rounded-xl bg-accent hover:opacity-90 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {isSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : <ShieldCheck className="size-3.5" />}
                <span>Verify</span>
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-line" />
            <span className="shrink mx-3 text-[10px] font-semibold uppercase tracking-wider text-muted">
              Or verify with Biometrics
            </span>
            <div className="flex-grow border-t border-line" />
          </div>

          {/* Option 2: Passkey / Windows Hello */}
          <button
            type="button"
            onClick={handlePasskeyUnlock}
            disabled={isPasskeyLoading}
            className="w-full h-10 rounded-xl border border-line bg-surface-2 hover:bg-surface-3 hover:border-accent/40 text-xs font-semibold text-ink flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isPasskeyLoading ? (
              <Loader2 className="size-4 animate-spin text-accent" />
            ) : (
              <Fingerprint className="size-4 text-accent" />
            )}
            <span>Verify with Passkey / Windows Hello</span>
          </button>

          {/* Local Dev Bypass (only shown in local dev mode) */}
          {isLocalBypass && (
            <div className="pt-2 border-t border-dashed border-line">
              <button
                type="button"
                onClick={handleDevBypassUnlock}
                disabled={isSubmitting}
                className="w-full h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-xs font-semibold text-amber-400 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Sparkles className="size-3.5" />
                <span>Local Dev Bypass: Unlock Vault</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
