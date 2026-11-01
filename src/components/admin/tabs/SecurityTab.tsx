'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Fingerprint,
  Key,
  Trash2,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Laptop,
  KeyRound,
  UserCheck,
  LogOut,
} from 'lucide-react';
import { useAdminAuth, PasskeyItem } from '@/context/AdminAuthContext';

export const SecurityTab: React.FC = () => {
  const {
    user,
    isLocalBypass,
    registerPasskey,
    listPasskeys,
    deletePasskey,
    signOut,
  } = useAdminAuth();

  const [passkeys, setPasskeys] = useState<PasskeyItem[]>([]);
  const [isLoadingPasskeys, setIsLoadingPasskeys] = useState<boolean>(true);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [passkeyLabel, setPasskeyLabel] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchPasskeys = useCallback(async () => {
    setIsLoadingPasskeys(true);
    try {
      const items = await listPasskeys();
      setPasskeys(items);
    } catch (err) {
      console.warn('Failed to load passkeys:', err);
    } finally {
      setIsLoadingPasskeys(false);
    }
  }, [listPasskeys]);

  useEffect(() => {
    fetchPasskeys();
  }, [fetchPasskeys]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    setFeedback(null);

    const name = passkeyLabel.trim() || 'My Passkey';
    const res = await registerPasskey(name);

    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Passkey "${name}" successfully registered with Supabase!`,
      });
      setPasskeyLabel('');
      fetchPasskeys();
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Failed to register passkey. Ensure your browser/device supports WebAuthn.',
      });
    }
    setIsRegistering(false);
  };

  const handleDelete = async (id: string, name?: string) => {
    if (!window.confirm(`Are you sure you want to remove the passkey "${name || 'Unnamed'}"?`)) {
      return;
    }

    const res = await deletePasskey(id);
    if (res.success) {
      setFeedback({
        type: 'success',
        message: 'Passkey removed successfully.',
      });
      fetchPasskeys();
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Failed to delete passkey.',
      });
    }
  };

  const provider = user?.app_metadata?.provider || 'Email/Password';

  return (
    <div className="space-y-6 max-w-4xl select-none">
      {/* 1. Current Session & Identity Card */}
      <div className="card-raised rounded-2xl border border-line bg-surface p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 grid place-items-center">
              <UserCheck className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink">Admin Session Information</h2>
              <p className="text-[11px] text-ink-3">
                {isLocalBypass ? 'Development preview mode active' : 'Authenticated via Supabase Auth'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="btn btn-secondary h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all cursor-pointer"
          >
            <LogOut className="size-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="p-3.5 rounded-xl border border-line bg-surface-2/60">
            <span className="text-[11px] font-semibold text-ink-3 block">User Email</span>
            <span className="text-xs font-bold text-ink truncate block mt-0.5">
              {user?.email || (isLocalBypass ? 'local-dev@folioframe.test' : 'Not available')}
            </span>
          </div>
          <div className="p-3.5 rounded-xl border border-line bg-surface-2/60">
            <span className="text-[11px] font-semibold text-ink-3 block">Auth Provider</span>
            <span className="text-xs font-bold text-ink capitalize block mt-0.5">
              {isLocalBypass ? 'Local Bypass' : provider}
            </span>
          </div>
          <div className="p-3.5 rounded-xl border border-line bg-surface-2/60">
            <span className="text-[11px] font-semibold text-ink-3 block">Security Status</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
              ● Protected Session
            </span>
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`flex items-start gap-2.5 p-4 rounded-xl text-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="size-4.5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="size-4.5 shrink-0 mt-0.5" />
          )}
          <p className="leading-relaxed">{feedback.message}</p>
        </div>
      )}

      {/* 2. Passkey / WebAuthn Management Section */}
      <div className="card-raised rounded-2xl border border-line bg-surface p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 grid place-items-center">
              <Fingerprint className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink">Passkeys & Hardware Keys (FIDO2)</h2>
              <p className="text-[11px] text-ink-3">
                Sign in without passwords using Apple Touch ID/Face ID, YubiKey, or Windows Hello.
              </p>
            </div>
          </div>
        </div>

        {/* Register New Passkey Form */}
        <form onSubmit={handleRegister} className="p-4 rounded-xl border border-line bg-surface-2/60 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-ink">
            <Plus className="size-4 text-brand-500" />
            <span>Register a New Passkey</span>
          </div>
          <p className="text-[11px] text-ink-3">
            Click below to start the WebAuthn ceremony. Your device will prompt you to scan your fingerprint, look at the camera, or tap your YubiKey.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
            <input
              type="text"
              value={passkeyLabel}
              onChange={(e) => setPasskeyLabel(e.target.value)}
              placeholder="e.g. MacBook Touch ID, Blue YubiKey 5C, Work PC"
              className="flex-1 h-9 rounded-xl border border-line bg-surface px-3 text-xs text-ink placeholder:text-ink-3/70 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
            <button
              type="submit"
              disabled={isRegistering}
              className="btn btn-secondary h-9 px-4 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-60"
            >
              {isRegistering ? (
                <>
                  <Loader2 className="size-3.5 animate-spin text-brand-500" />
                  <span>Prompting Device...</span>
                </>
              ) : (
                <>
                  <Fingerprint className="size-4 text-brand-500" />
                  <span>Add Passkey</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* List of Registered Passkeys */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-ink flex items-center justify-between">
            <span>Enrolled Passkeys</span>
            <span className="text-[11px] font-normal text-ink-3">
              {passkeys.length} {passkeys.length === 1 ? 'device' : 'devices'}
            </span>
          </h3>

          {isLoadingPasskeys ? (
            <div className="py-8 text-center text-xs text-ink-3 flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin text-brand-500" />
              <span>Querying registered passkeys...</span>
            </div>
          ) : passkeys.length === 0 ? (
            <div className="p-6 rounded-xl border border-dashed border-line text-center space-y-1.5 bg-surface-2/20">
              <KeyRound className="size-6 text-ink-3 mx-auto opacity-60" />
              <p className="text-xs font-medium text-ink">No passkeys enrolled yet</p>
              <p className="text-[11px] text-ink-3 max-w-sm mx-auto">
                Register your Apple Touch ID, Face ID, or YubiKey above to unlock 1-click passwordless login on your device.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-line rounded-xl border border-line overflow-hidden bg-surface">
              {passkeys.map((pk) => (
                <div key={pk.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-surface-2/40 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-8 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 grid place-items-center shrink-0">
                      <Key className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink truncate">
                        {pk.name || 'Unnamed Passkey'}
                      </p>
                      <p className="text-[10px] text-ink-3 font-mono truncate">
                        ID: {pk.credential_id ? `${pk.credential_id.substring(0, 16)}...` : pk.id}
                        {pk.created_at && ` · Added ${new Date(pk.created_at).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(pk.id, pk.name)}
                    className="p-1.5 text-ink-3 hover:text-rose-600 transition-colors rounded-lg cursor-pointer shrink-0"
                    title="Remove passkey"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Hardware & Compatibility Guide Cards */}
        <div className="pt-4 border-t border-line">
          <h4 className="text-xs font-bold text-ink mb-3">Supported Passkey Authenticators</h4>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="p-3 rounded-xl border border-line bg-surface-2/30 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                <Laptop className="size-3.5 text-brand-500" />
                <span>Apple Ecosystem</span>
              </div>
              <p className="text-[11px] text-ink-3 leading-relaxed">
                Touch ID, Face ID, and iCloud Keychain sync seamlessly across Mac, iPhone, and iPad.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-line bg-surface-2/30 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                <Key className="size-3.5 text-brand-500" />
                <span>YubiKey & FIDO2</span>
              </div>
              <p className="text-[11px] text-ink-3 leading-relaxed">
                Plug into USB-C or tap NFC, then touch the gold contact when prompted by the browser.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-line bg-surface-2/30 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                <Shield className="size-3.5 text-brand-500" />
                <span>Windows Hello</span>
              </div>
              <p className="text-[11px] text-ink-3 leading-relaxed">
                Hardware-backed biometric or PIN authentication built directly into Windows 11.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
