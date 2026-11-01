'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Key,
  Lock,
  Eye,
  EyeOff,
  Fingerprint,
  Shield,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  LogOut,
  Mail,
  RefreshCw,
  ExternalLink,
  Sliders,
} from 'lucide-react';
import { useAdminAuth, PasskeyItem } from '@/context/AdminAuthContext';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export const SettingsTab: React.FC = () => {
  const {
    user,
    isLocalBypass,
    listPasskeys,
    registerPasskey,
    deletePasskey,
    updatePassword,
    sendPasswordResetEmail,
    signOut,
    signOutAllDevices,
  } = useAdminAuth();

  // Active sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'security' | 'passkeys' | 'mail' | 'preferences'>('security');

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Passkey state
  const [passkeys, setPasskeys] = useState<PasskeyItem[]>([]);
  const [isLoadingPasskeys, setIsLoadingPasskeys] = useState(false);
  const [passkeyLabel, setPasskeyLabel] = useState('');
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);
  const [passkeyFeedback, setPasskeyFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Mail status state
  const [mailStatus, setMailStatus] = useState<{
    configured: boolean;
    verifiedDomain?: string;
    domainStatus?: string;
    defaultSender?: string;
    unreadCount?: number;
  } | null>(null);
  const [isLoadingMailStatus, setIsLoadingMailStatus] = useState(false);

  // Load passkeys
  const loadPasskeys = useCallback(async () => {
    setIsLoadingPasskeys(true);
    try {
      const keys = await listPasskeys();
      setPasskeys(keys);
    } catch {
      // ignore
    } finally {
      setIsLoadingPasskeys(false);
    }
  }, [listPasskeys]);

  // Load mail status
  const loadMailStatus = useCallback(async () => {
    setIsLoadingMailStatus(true);
    try {
      const res = await fetch('/api/mail/status');
      if (res.ok) {
        const data = await res.json();
        setMailStatus(data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingMailStatus(false);
    }
  }, []);

  useEffect(() => {
    loadPasskeys();
    loadMailStatus();
  }, [loadPasskeys, loadMailStatus]);

  // Handle password change
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (newPassword.length < 6) {
      setPasswordFeedback({ type: 'error', message: 'Password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', message: 'Passwords do not match. Please verify.' });
      return;
    }

    setIsUpdatingPassword(true);
    const res = await updatePassword(newPassword);
    setIsUpdatingPassword(false);

    if (res.success) {
      setPasswordFeedback({
        type: 'success',
        message: 'Password updated successfully! Your new password is now active.',
      });
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordFeedback({
        type: 'error',
        message: res.error || 'Failed to update password. Check Supabase connection or permissions.',
      });
    }
  };

  // Handle password reset email
  const handleSendResetEmail = async () => {
    setPasswordFeedback(null);
    const res = await sendPasswordResetEmail();
    if (res.success) {
      setPasswordFeedback({
        type: 'success',
        message: `Password recovery link sent to ${user?.email || 'your email'}. Check your inbox!`,
      });
    } else {
      setPasswordFeedback({
        type: 'error',
        message: res.error || 'Failed to send password reset email.',
      });
    }
  };

  // Handle passkey registration
  const handleRegisterPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasskeyFeedback(null);
    setIsRegisteringPasskey(true);

    const name = passkeyLabel.trim() || undefined;
    const res = await registerPasskey(name);
    setIsRegisteringPasskey(false);

    if (res.success) {
      setPasskeyFeedback({
        type: 'success',
        message: `Passkey "${name || 'My Authenticator'}" enrolled successfully!`,
      });
      setPasskeyLabel('');
      await loadPasskeys();
    } else {
      setPasskeyFeedback({
        type: 'error',
        message: res.error || 'Passkey ceremony was cancelled or failed.',
      });
    }
  };

  // Handle passkey deletion
  const handleDeletePasskey = async (id: string, name?: string) => {
    if (!window.confirm(`Remove passkey "${name || id}"? You will not be able to use this authenticator until re-enrolled.`)) {
      return;
    }
    const res = await deletePasskey(id);
    if (res.success) {
      setPasskeyFeedback({ type: 'success', message: 'Passkey removed.' });
      await loadPasskeys();
    } else {
      setPasskeyFeedback({ type: 'error', message: res.error || 'Failed to delete passkey.' });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      {/* Session / Identity Ribbon */}
      <div className="card-raised rounded-2xl border border-line bg-surface p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 grid place-items-center shrink-0">
            <Shield className="size-5.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-ink">
                {user?.email || (isLocalBypass ? 'Development Bypass User' : 'Admin Session')}
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </div>
            <p className="text-xs text-ink-3 mt-0.5">
              Provider:{' '}
              <span className="font-semibold text-ink-2">
                {user?.app_metadata?.provider || (isLocalBypass ? 'Local Mode' : 'Supabase Auth')}
              </span>
              {' · '}
              User ID: <span className="font-mono text-[11px]">{user?.id?.substring(0, 12) || 'local-preview'}...</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={signOut}
            className="btn btn-secondary h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 hover:border-rose-500/30"
          >
            <LogOut className="size-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-1 border-b border-line pb-px overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
            activeSubTab === 'security'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-500/5'
              : 'border-transparent text-ink-3 hover:text-ink hover:bg-surface-2/40'
          }`}
        >
          <Lock className="size-3.5" />
          <span>Password & Auth</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('passkeys')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
            activeSubTab === 'passkeys'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-500/5'
              : 'border-transparent text-ink-3 hover:text-ink hover:bg-surface-2/40'
          }`}
        >
          <Fingerprint className="size-3.5" />
          <span>Passkeys & Hardware Keys</span>
          {passkeys.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-brand-500/10 text-brand-600 dark:text-brand-400 font-mono">
              {passkeys.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('mail')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
            activeSubTab === 'mail'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-500/5'
              : 'border-transparent text-ink-3 hover:text-ink hover:bg-surface-2/40'
          }`}
        >
          <Mail className="size-3.5" />
          <span>Resend & Mailing</span>
          {mailStatus?.configured && (
            <span className="size-2 rounded-full bg-emerald-500" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('preferences')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
            activeSubTab === 'preferences'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-500/5'
              : 'border-transparent text-ink-3 hover:text-ink hover:bg-surface-2/40'
          }`}
        >
          <Sliders className="size-3.5" />
          <span>Studio Preferences</span>
        </button>
      </div>

      {/* SUBTAB 1: PASSWORD & AUTH */}
      {activeSubTab === 'security' && (
        <div className="space-y-6">
          {/* Change Password Card */}
          <div className="card-raised rounded-2xl border border-line bg-surface p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 grid place-items-center">
                  <Key className="size-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">Change Password</h3>
                  <p className="text-xs text-ink-3">Update your login password securely via Supabase Auth.</p>
                </div>
              </div>
            </div>

            {passwordFeedback && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  passwordFeedback.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400'
                }`}
              >
                {passwordFeedback.type === 'success' ? (
                  <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                )}
                <span>{passwordFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-semibold text-ink-2 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full h-10 px-3.5 pr-10 rounded-xl bg-surface-2 border border-line text-xs font-medium text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink p-1 rounded-lg transition-colors cursor-pointer"
                    title={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-2 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full h-10 px-3.5 pr-10 rounded-xl bg-surface-2 border border-line text-xs font-medium text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink p-1 rounded-lg transition-colors cursor-pointer"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Password checks */}
              <div className="text-[11px] space-y-1 text-ink-3">
                <div className="flex items-center gap-1.5">
                  <span className={`size-1.5 rounded-full ${newPassword.length >= 6 ? 'bg-emerald-500' : 'bg-ink-4'}`} />
                  <span>Minimum 6 characters</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`size-1.5 rounded-full ${newPassword && newPassword === confirmPassword ? 'bg-emerald-500' : 'bg-ink-4'}`} />
                  <span>Passwords match</span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isUpdatingPassword || !newPassword || newPassword !== confirmPassword}
                  className="btn btn-primary h-9 px-4 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingPassword ? <Loader2 className="size-4 animate-spin" /> : <Key className="size-4" />}
                  <span>{isUpdatingPassword ? 'Updating...' : 'Update Password'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendResetEmail}
                  className="text-xs text-ink-3 hover:text-brand-600 dark:hover:text-brand-400 font-semibold underline decoration-dashed cursor-pointer"
                >
                  Send recovery email instead
                </button>
              </div>
            </form>
          </div>

          {/* Session Invalidation Card */}
          <div className="card-raised rounded-2xl border border-line bg-surface p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 grid place-items-center">
                <Shield className="size-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">Sign Out Everywhere</h3>
                <p className="text-xs text-ink-3">Invalidate active sessions on all browsers and devices.</p>
              </div>
            </div>

            <p className="text-xs text-ink-2 leading-relaxed max-w-lg">
              If you suspect unauthorized access or lost a device, you can revoke all session tokens immediately. You will be prompted to sign in again.
            </p>

            <div>
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Are you sure you want to sign out from all devices?')) {
                    await signOutAllDevices();
                  }
                }}
                className="btn btn-secondary h-8 px-3.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:border-rose-500/30 inline-flex items-center gap-1.5"
              >
                <LogOut className="size-3.5" />
                <span>Sign Out Everywhere</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: PASSKEYS & HARDWARE KEYS */}
      {activeSubTab === 'passkeys' && (
        <div className="space-y-6">
          <div className="card-raised rounded-2xl border border-line bg-surface p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 grid place-items-center">
                  <Fingerprint className="size-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">Passkeys & Hardware Keys (FIDO2)</h3>
                  <p className="text-xs text-ink-3">
                    Passwordless biometric login using Apple Touch ID/Face ID, YubiKey, or Windows Hello.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={loadPasskeys}
                className="p-1.5 text-ink-3 hover:text-ink rounded-lg transition-colors cursor-pointer"
                title="Refresh passkeys"
              >
                <RefreshCw className={`size-4 ${isLoadingPasskeys ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {passkeyFeedback && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  passkeyFeedback.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400'
                }`}
              >
                {passkeyFeedback.type === 'success' ? (
                  <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                )}
                <span>{passkeyFeedback.message}</span>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleRegisterPasskey} className="space-y-3 p-4 rounded-xl bg-surface-2 border border-line/60">
              <label className="block text-xs font-bold text-ink">
                + Add a New Passkey
              </label>
              <p className="text-[11px] text-ink-3 leading-relaxed">
                Enter a memorable label for your authenticator, then click Add Passkey to trigger the native device prompt.
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  value={passkeyLabel}
                  onChange={(e) => setPasskeyLabel(e.target.value)}
                  placeholder="e.g. MacBook Pro Touch ID, Blue YubiKey 5C, Office Windows Hello"
                  className="flex-1 h-9 px-3 rounded-xl bg-surface border border-line text-xs font-medium text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
                <button
                  type="submit"
                  disabled={isRegisteringPasskey}
                  className="btn btn-primary h-9 px-4 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {isRegisteringPasskey ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Fingerprint className="size-3.5" />
                  )}
                  <span>{isRegisteringPasskey ? 'Registering...' : 'Add Passkey'}</span>
                </button>
              </div>
            </form>

            {/* Enrolled Passkeys List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-ink">
                <span>Enrolled Passkeys</span>
                <span className="text-ink-3 font-normal">{passkeys.length} registered</span>
              </div>

              {passkeys.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-line text-ink-3 space-y-2">
                  <Fingerprint className="size-8 mx-auto opacity-40" />
                  <p className="text-xs font-medium">No passkeys enrolled yet</p>
                  <p className="text-[11px] max-w-sm mx-auto">
                    Register your Apple Touch ID, Face ID, or YubiKey above to unlock 1-click passwordless login on this device.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {passkeys.map((pk) => {
                    const label = pk.name || pk.friendly_name || 'Biometric Authenticator';
                    const isApple = /mac|apple|iphone|ipad/i.test(label);
                    const isYubikey = /yubi|fido|key/i.test(label);

                    return (
                      <div
                        key={pk.id}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-line bg-surface hover:border-line-strong transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-lg bg-surface-2 border border-line grid place-items-center text-ink-2">
                            {isApple ? (
                              <Laptop className="size-4" />
                            ) : isYubikey ? (
                              <Key className="size-4" />
                            ) : (
                              <Smartphone className="size-4" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-ink">{label}</h4>
                            <p className="text-[10px] text-ink-3 font-mono">
                              ID: {pk.credential_id ? pk.credential_id.substring(0, 16) + '...' : pk.id.substring(0, 16)}
                              {pk.created_at && ` · Enrolled ${new Date(pk.created_at).toLocaleDateString()}`}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeletePasskey(pk.id, label)}
                          className="p-1.5 text-ink-3 hover:text-rose-600 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete passkey"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Hardware Guide Banner */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs space-y-2">
              <h4 className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5" />
                Hardware & Ecosystem Compatibility
              </h4>
              <p className="text-ink-2 leading-relaxed text-[11px]">
                • <strong>Apple Devices</strong>: Uses Touch ID or Face ID, synced automatically across your devices via iCloud Keychain.
                <br />
                • <strong>YubiKey / Security Keys</strong>: FIDO2 / WebAuthn compliant. Touch the gold contact when prompted.
                <br />
                • <strong>Windows & Android</strong>: Windows Hello PIN / fingerprint, or Google Password Manager.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: RESEND & MAILING */}
      {activeSubTab === 'mail' && (
        <div className="space-y-6">
          <div className="card-raised rounded-2xl border border-line bg-surface p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 grid place-items-center">
                  <Mail className="size-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">Resend API & Mailing Configuration</h3>
                  <p className="text-xs text-ink-3">Live status of your Resend transactional email integration.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={loadMailStatus}
                className="p-1.5 text-ink-3 hover:text-ink rounded-lg transition-colors cursor-pointer"
                title="Refresh mail status"
              >
                <RefreshCw className={`size-4 ${isLoadingMailStatus ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-surface-2 border border-line">
                <p className="text-[11px] font-semibold text-ink-3 uppercase tracking-wider">Resend API Status</p>
                <p className="text-sm font-bold text-ink mt-1 flex items-center gap-2">
                  <span className={`size-2 rounded-full ${mailStatus?.configured ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  {mailStatus?.configured ? 'Connected & Ready' : 'Key Missing'}
                </p>
                <p className="text-[10px] text-ink-3 mt-1 font-mono">
                  {mailStatus?.configured ? 'Key: re_ZDpW... (Active)' : 'Set RESEND_API_KEY'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface-2 border border-line">
                <p className="text-[11px] font-semibold text-ink-3 uppercase tracking-wider">Verified Domain</p>
                <p className="text-sm font-bold text-ink mt-1 flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                  {mailStatus?.verifiedDomain || 'zahidp.com'}
                </p>
                <p className="text-[10px] text-ink-3 mt-1">
                  Status: <span className="capitalize font-semibold text-emerald-600 dark:text-emerald-400">{mailStatus?.domainStatus || 'Verified'}</span>
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface-2 border border-line">
                <p className="text-[11px] font-semibold text-ink-3 uppercase tracking-wider">Default Sender</p>
                <p className="text-xs font-bold text-ink mt-1 truncate">
                  {mailStatus?.defaultSender || 'hello@zahidp.com'}
                </p>
                <p className="text-[10px] text-ink-3 mt-1">
                  Unread Inquiries: <strong>{mailStatus?.unreadCount ?? 0}</strong>
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-line">
              <span className="text-xs text-ink-3">
                Send & receive client inquiries directly inside FolioFrame Studio.
              </span>
              <a
                href="https://resend.com/domains"
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <span>Resend Dashboard</span>
                <ExternalLink className="size-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: STUDIO PREFERENCES */}
      {activeSubTab === 'preferences' && (
        <div className="space-y-6">
          <div className="card-raised rounded-2xl border border-line bg-surface p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 grid place-items-center">
                <Sliders className="size-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">Studio & Editing Preferences</h3>
                <p className="text-xs text-ink-3">Interface theme, shortcuts, and default behaviors.</p>
              </div>
            </div>

            <div className="space-y-4 max-w-md">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-line bg-surface-2">
                <div>
                  <h4 className="text-xs font-bold text-ink">Interface Theme</h4>
                  <p className="text-[11px] text-ink-3">Toggle between Dark and Light mode.</p>
                </div>
                <ThemeToggle />
              </div>

              <div className="p-3.5 rounded-xl border border-line bg-surface-2 space-y-1">
                <h4 className="text-xs font-bold text-ink">Keyboard Shortcuts</h4>
                <p className="text-[11px] text-ink-3">
                  <kbd className="px-1.5 py-0.5 bg-surface border border-line rounded font-mono text-[10px]">Ctrl</kbd> +{' '}
                  <kbd className="px-1.5 py-0.5 bg-surface border border-line rounded font-mono text-[10px]">S</kbd> saves all changes immediately.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
