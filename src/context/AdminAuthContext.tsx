'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import {
  isWebAuthnSupported,
  parseCreationOptions,
  serializeCreationResponse,
  parseRequestOptions,
  serializeRequestResponse,
} from '@/lib/auth/webauthn-client';

interface PasskeyApi {
  startRegistration: () => Promise<{ data: { challenge_id: string; options: Record<string, unknown> } | null; error: Error | null }>;
  verifyRegistration: (params: { challengeId: string; credential: Record<string, unknown> }) => Promise<{ data: { id: string } | null; error: Error | null }>;
  startAuthentication: () => Promise<{ data: { challenge_id: string; options: Record<string, unknown> } | null; error: Error | null }>;
  verifyAuthentication: (params: { challengeId: string; credential: Record<string, unknown> }) => Promise<{ data: { session: Session | null; user: User | null } | null; error: Error | null }>;
  list: () => Promise<{ data: PasskeyItem[] | null; error: Error | null }>;
  delete: (params: { passkeyId: string }) => Promise<{ error: Error | null }>;
  update?: (params: { passkeyId: string; friendlyName: string }) => Promise<{ error: Error | null }>;
}

export interface PasskeyItem {
  id: string;
  name?: string;
  friendly_name?: string;
  created_at?: string;
  credential_id?: string;
}

export interface MfaAssuranceLevel {
  currentLevel: 'aal1' | 'aal2' | null;
  nextLevel: 'aal1' | 'aal2' | null;
}

interface AdminAuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isLocalBypass: boolean;
  error: string | null;
  mfaLevel: MfaAssuranceLevel | null;
  checkMfaLevel: () => Promise<MfaAssuranceLevel>;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; requiresMfa?: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInWithPasskey: () => Promise<{ success: boolean; error?: string }>;
  verifyMfaCode: (code: string, factorId?: string) => Promise<{ success: boolean; error?: string }>;
  unenrollMfaFactor: (factorId: string) => Promise<{ success: boolean; error?: string }>;
  registerPasskey: (name?: string) => Promise<{ success: boolean; requiresAal2StepUp?: boolean; error?: string }>;
  listPasskeys: () => Promise<PasskeyItem[]>;
  deletePasskey: (id: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  sendPasswordResetEmail: (email?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  signOutAllDevices: () => Promise<{ success: boolean; error?: string }>;
  bypassLocalAuth: () => void;
  clearError: () => void;
}

function formatPasskeyError(rawMsg: string): string {
  if (!rawMsg) return 'Passkey operation failed';
  const domain = typeof window !== 'undefined' ? window.location.hostname : 'zahidp.com';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://zahidp.com';

  if (rawMsg.includes('Credential verification failed') || rawMsg.includes('verification_failed')) {
    if (domain !== 'zahidp.com') {
      return `Credential verification failed: Your browser origin is "${origin}", but Supabase WebAuthn RP is registered for "https://zahidp.com". Please access admin directly via https://zahidp.com/admin.`;
    }
    return `Credential verification failed by Supabase server. Please ensure you are accessing via https://zahidp.com (clean root domain, without www or localhost) and retry.`;
  }

  if (
    rawMsg.includes('RP ID') ||
    rawMsg.toLowerCase().includes('relying party') ||
    rawMsg.includes('valid domain suffix') ||
    rawMsg.includes('SecurityError')
  ) {
    if (domain === 'localhost' || domain === '127.0.0.1') {
      return `Passkeys are cryptographically bound to "zahidp.com". Browsers strictly prohibit registering or authenticating a "zahidp.com" passkey on localhost (${domain}). Please test on https://zahidp.com/admin.`;
    }
    return `The WebAuthn RP ID in your Supabase Dashboard is configured for "zahidp.com". Please ensure you are accessing via https://zahidp.com.`;
  }

  if (
    rawMsg.includes('The operation either timed out or was not allowed') ||
    rawMsg.includes('NotAllowedError') ||
    rawMsg.toLowerCase().includes('cancelled') ||
    rawMsg.toLowerCase().includes('abort')
  ) {
    return 'Passkey prompt was cancelled or timed out.';
  }

  return rawMsg;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLocalBypass, setIsLocalBypass] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mfaLevel, setMfaLevel] = useState<MfaAssuranceLevel | null>(null);

  // Helper to query current Authenticator Assurance Level (AAL)
  const checkMfaLevel = useCallback(async (): Promise<MfaAssuranceLevel> => {
    try {
      // 1.5s hard timeout so slow/unreachable network never blocks authentication
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('MFA check timeout')), 1500)
      );

      const mfaCheckPromise = Promise.all([
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
        supabase.auth.mfa.listFactors(),
      ]);

      const [aalRes, factorsRes] = await Promise.race([mfaCheckPromise, timeoutPromise]);

      const verifiedFactors = factorsRes.data?.all?.filter((f) => f.status === 'verified') || [];
      const hasVerified = verifiedFactors.length > 0;

      const currentLevel = (aalRes.data?.currentLevel as 'aal1' | 'aal2' | null) ?? 'aal1';
      // CRITICAL: If no verified factor exists, nextLevel MUST be 'aal1', never 'aal2'!
      // This completely eliminates stale nextLevel flags and prevents redirect loops.
      const nextLevel = hasVerified
        ? ((aalRes.data?.nextLevel as 'aal1' | 'aal2' | null) ?? 'aal1')
        : 'aal1';

      const lvl: MfaAssuranceLevel = { currentLevel, nextLevel };
      setMfaLevel(lvl);
      return lvl;
    } catch (e) {
      console.warn('MFA assurance level check skipped or timed out:', e);
    }
    const fallback: MfaAssuranceLevel = { currentLevel: 'aal1', nextLevel: 'aal1' };
    setMfaLevel(fallback);
    return fallback;
  }, []);

  // Check initial session & subscribe to auth state changes
  useEffect(() => {
    let mounted = true;

    // Check if any Supabase auth token exists in localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('folioframe_admin_local_bypass');
      } catch { }

      let hasSupabaseSession = false;
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (
            key &&
            ((key.startsWith('sb-') && key.endsWith('-auth-token')) || key === 'supabase.auth.token')
          ) {
            hasSupabaseSession = true;
            break;
          }
        }
      } catch {
        // localStorage might be blocked or restricted
      }

      // If no auth token is stored, don't hold the UI on a loading screen
      if (!hasSupabaseSession) {
        setIsLoading(false);
      }
    }

    // Unconditional safety timeout (450ms max) so slow network / paused DB NEVER hangs UI
    const safetyTimer = setTimeout(() => {
      if (mounted) {
        setIsLoading(false);
      }
    }, 450);

    // Fast session fetch with 400ms hard ceiling
    const fetchSession = async () => {
      try {
        const timeoutPromise = new Promise<{ data: { session: null }; error: null }>((resolve) =>
          setTimeout(() => resolve({ data: { session: null }, error: null }), 400)
        );
        const sessionPromise = supabase.auth.getSession();
        const { data, error: sessionErr } = await Promise.race([sessionPromise, timeoutPromise]);

        if (!mounted) return;
        if (sessionErr) {
          console.warn('Supabase getSession error:', sessionErr);
        }
        if (data?.session) {
          setSession(data.session);
          setUser(data.session.user);
          setIsLocalBypass(false);
          if (typeof document !== 'undefined') {
            const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
            document.cookie = `sb-access-token=${encodeURIComponent(data.session.access_token)}; path=/; SameSite=Lax; max-age=3600${isSecure}`;
          }
          checkMfaLevel().catch(() => { });
        }
      } catch (err) {
        console.warn('Supabase getSession failed:', err);
      } finally {
        if (mounted) {
          clearTimeout(safetyTimer);
          setIsLoading(false);
        }
      }
    };

    fetchSession();

    // Subscribe to auth state updates (e.g. login, logout, token refresh, OAuth redirect)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!mounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);
      if (currentSession) {
        setIsLocalBypass(false);
        if (typeof document !== 'undefined') {
          const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
          document.cookie = `sb-access-token=${encodeURIComponent(currentSession.access_token)}; path=/; SameSite=Lax; max-age=3600${isSecure}`;
        }
        checkMfaLevel().catch(() => { });
      } else {
        setMfaLevel(null);
        if (typeof document !== 'undefined') {
          const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
          document.cookie = `sb-access-token=; path=/; SameSite=Lax; max-age=0${isSecure}`;
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [checkMfaLevel]);

  const clearError = useCallback(() => setError(null), []);

  // 1. Email + Password Sign In with MFA Step-up detection
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInErr) {
        setError(signInErr.message);
        return { success: false, error: signInErr.message };
      }

      setSession(data.session);
      setUser(data.user);
      setIsLocalBypass(false);

      // Evaluate MFA requirement
      const lvl = await checkMfaLevel();
      const requiresMfa = lvl.currentLevel === 'aal1' && lvl.nextLevel === 'aal2';

      return { success: true, requiresMfa };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      setError(msg);
      return { success: false, error: msg };
    }
  }, [checkMfaLevel]);

  // 2. Email + Password Sign Up
  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/admin` : undefined,
        },
      });

      if (signUpErr) {
        setError(signUpErr.message);
        return { success: false, error: signUpErr.message };
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.user);
        setIsLocalBypass(false);
        await checkMfaLevel();
        return { success: true, message: 'Account created and signed in!' };
      }

      return {
        success: true,
        message: 'Account created! Please check your email inbox to confirm your registration.',
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign up failed';
      setError(msg);
      return { success: false, error: msg };
    }
  }, [checkMfaLevel]);

  // 3. OAuth Sign In (Google)
  const signInWithGoogle = useCallback(async () => {
    setError(null);
    try {
      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
        },
      });

      if (oauthErr) {
        setError(oauthErr.message);
        return { success: false, error: oauthErr.message };
      }

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google OAuth failed';
      setError(msg);
      return { success: false, error: msg };
    }
  }, []);

  // 4. Passkey Sign In (WebAuthn)
  const signInWithPasskey = useCallback(async () => {
    setError(null);
    try {
      if (!isWebAuthnSupported()) {
        const msg = 'WebAuthn passkeys are not supported on this platform/browser.';
        setError(msg);
        return { success: false, error: msg };
      }

      const passkeyApi = (supabase.auth as unknown as { passkey?: PasskeyApi }).passkey;
      if (!passkeyApi || typeof passkeyApi.startAuthentication !== 'function') {
        const msg = 'Passkey authentication API is not available in this client build.';
        setError(msg);
        return { success: false, error: msg };
      }

      // Try official high-level signInWithPasskey() first
      const authWithPasskey = supabase.auth as unknown as {
        signInWithPasskey?: () => Promise<{ data: { session: Session | null; user: User | null } | null; error: Error | null }>;
      };

      if (typeof authWithPasskey.signInWithPasskey === 'function') {
        const { data: authData, error: authErr } = await authWithPasskey.signInWithPasskey();
        if (!authErr && authData?.session) {
          setSession(authData.session);
          setUser(authData.user);
          setIsLocalBypass(false);
          await checkMfaLevel();
          return { success: true };
        }
        if (
          authErr &&
          (authErr.message?.toLowerCase().includes('cancel') ||
            authErr.message?.toLowerCase().includes('abort') ||
            authErr.message?.toLowerCase().includes('notallowed'))
        ) {
          const msg = formatPasskeyError(authErr.message);
          setError(msg);
          return { success: false, error: msg };
        }
      }

      // 1. Request authentication challenge options from Supabase
      const { data: optData, error: optErr } = await passkeyApi.startAuthentication();
      if (optErr) {
        const errorMsg = formatPasskeyError(optErr.message);
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      if (!optData?.options) {
        const errorMsg = 'Failed to obtain passkey authentication options from Supabase.';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // 2. Perform WebAuthn browser ceremony
      const requestOptions = parseRequestOptions(optData.options);
      const finalOptions: CredentialRequestOptions = requestOptions.publicKey
        ? requestOptions
        : { publicKey: requestOptions as unknown as PublicKeyCredentialRequestOptions };
      const credential = await navigator.credentials.get(finalOptions);

      if (!credential || !(credential instanceof PublicKeyCredential)) {
        const errorMsg = 'No passkey credential selected.';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // 3. Serialize credential response
      const credentialPayload = serializeRequestResponse(credential);

      // 4. Verify assertion with Supabase and establish session
      const { data: authData, error: verifyErr } = await passkeyApi.verifyAuthentication({
        challengeId: optData.challenge_id,
        credential: credentialPayload,
      });

      if (verifyErr) {
        const errorMsg = formatPasskeyError(verifyErr.message);
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      if (authData?.session) {
        setSession(authData.session);
        setUser(authData.user);
        setIsLocalBypass(false);
        await checkMfaLevel();
      }

      return { success: true };
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : 'Passkey ceremony failed';
      const msg = formatPasskeyError(rawMsg);
      setError(msg);
      return { success: false, error: msg };
    }
  }, [checkMfaLevel]);

  // 5. Verify 6-digit TOTP MFA Code (Step-up to AAL2)
  const verifyMfaCode = useCallback(async (code: string, factorId?: string) => {
    setError(null);
    try {
      let targetFactorId = factorId;
      if (!targetFactorId) {
        const { data: factors, error: listErr } = await supabase.auth.mfa.listFactors();
        if (listErr || !factors) {
          const msg = listErr?.message || 'Failed to list authentication factors.';
          setError(msg);
          return { success: false, error: msg };
        }
        const verifiedFactor =
          factors.totp.find((f) => f.status === 'verified') ||
          factors.all.find((f) => f.status === 'verified');
        if (!verifiedFactor) {
          const msg = 'No active two-factor authentication factor found.';
          setError(msg);
          return { success: false, error: msg };
        }
        targetFactorId = verifiedFactor.id;
      }

      const { data, error: verifyErr } = await supabase.auth.mfa.challengeAndVerify({
        factorId: targetFactorId,
        code: code.trim(),
      });

      if (verifyErr) {
        setError(verifyErr.message);
        return { success: false, error: verifyErr.message };
      }

      // Upgrade session & mfaLevel to AAL2
      if (data?.user) {
        setUser(data.user);
      }
      await supabase.auth.refreshSession();
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        setSession(sessionData.session);
      }
      await checkMfaLevel();
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'MFA verification failed';
      setError(msg);
      return { success: false, error: msg };
    }
  }, [checkMfaLevel]);

  // 6. Unenroll an MFA factor (with AAL1 server fallback)
  const unenrollMfaFactor = useCallback(async (factorId: string) => {
    setError(null);
    try {
      // 1. Attempt standard client unenroll (succeeds if session is AAL2)
      const { error: unenrollErr } = await supabase.auth.mfa.unenroll({ factorId });
      if (!unenrollErr) {
        await supabase.auth.refreshSession();
        await checkMfaLevel();
        return { success: true };
      }

      // 2. If client-side failed (e.g. AAL2 required error), attempt via server admin API
      const currentToken = session?.access_token;
      if (currentToken) {
        const res = await fetch('/api/auth/mfa/remove-factor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentToken}`,
          },
          body: JSON.stringify({ factorId }),
        });
        const data = await res.json();
        if (data.success) {
          await supabase.auth.refreshSession();
          await checkMfaLevel();
          return { success: true };
        }
      }

      return {
        success: false,
        error:
          unenrollErr.message ||
          'Failed to remove factor. Fallback: delete factor in Supabase Dashboard (Authentication -> Users -> Factors).',
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to unenroll factor';
      return { success: false, error: msg };
    }
  }, [checkMfaLevel, session?.access_token]);

  // 7. Register Passkey (Handles AAL2 requirement when MFA factor exists)
  const registerPasskey = useCallback(async (name?: string) => {
    setError(null);
    try {
      if (!isWebAuthnSupported()) {
        const msg = 'WebAuthn passkeys are not supported on this platform/browser.';
        setError(msg);
        return { success: false, error: msg };
      }

      const passkeyApi = (supabase.auth as unknown as { passkey?: PasskeyApi }).passkey;
      if (!passkeyApi || typeof passkeyApi.startRegistration !== 'function') {
        const msg = 'Passkey registration API is not available in this client build.';
        setError(msg);
        return { success: false, error: msg };
      }

      // Check AAL requirement: only demand step-up if user has a verified factor
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.nextLevel === 'aal2' && aal?.currentLevel !== 'aal2') {
        return {
          success: false,
          requiresAal2StepUp: true,
          error: 'AAL2 session is required to manage passkeys when MFA is enabled.',
        };
      }

      // Try official high-level registerPasskey() method first
      const authWithPasskey = supabase.auth as unknown as {
        registerPasskey?: () => Promise<{ data: { id: string } | null; error: Error | null }>;
      };

      if (typeof authWithPasskey.registerPasskey === 'function') {
        const { data: regData, error: regErr } = await authWithPasskey.registerPasskey();
        if (!regErr) {
          if (name && regData?.id && passkeyApi.update) {
            try {
              await passkeyApi.update({ passkeyId: regData.id, friendlyName: name });
            } catch {}
          }
          return { success: true };
        }
        if (
          regErr.message?.toLowerCase().includes('cancel') ||
          regErr.message?.toLowerCase().includes('abort') ||
          regErr.message?.toLowerCase().includes('notallowed')
        ) {
          const msg = formatPasskeyError(regErr.message);
          setError(msg);
          return { success: false, error: msg };
        }
      }

      // 1. Request registration options from Supabase
      const { data: optData, error: optErr } = await passkeyApi.startRegistration();

      if (optErr) {
        if (optErr.message?.includes('AAL2') || optErr.message?.includes('aal2')) {
          return { success: false, requiresAal2StepUp: true, error: optErr.message };
        }
        const errorMsg = formatPasskeyError(optErr.message);
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      if (!optData?.options) {
        const errorMsg = 'Failed to obtain passkey registration options from Supabase.';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // 2. Perform WebAuthn browser ceremony
      const creationOptions = parseCreationOptions(optData.options);
      const finalOptions: CredentialCreationOptions = creationOptions.publicKey
        ? creationOptions
        : { publicKey: creationOptions as unknown as PublicKeyCredentialCreationOptions };
      const credential = await navigator.credentials.create(finalOptions);

      if (!credential || !(credential instanceof PublicKeyCredential)) {
        const errorMsg = 'No credential created by the authenticator.';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // 3. Serialize credential response
      const credentialPayload = serializeCreationResponse(credential);

      // 4. Verify registration with Supabase
      const { data: verifyData, error: verifyErr } = await passkeyApi.verifyRegistration({
        challengeId: optData.challenge_id,
        credential: credentialPayload,
      });

      if (verifyErr) {
        const errorMsg = formatPasskeyError(verifyErr.message);
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // 5. Update friendly name if provided
      if (name && verifyData && 'id' in verifyData && typeof verifyData.id === 'string') {
        if (passkeyApi.update) {
          try {
            await passkeyApi.update({ passkeyId: verifyData.id, friendlyName: name });
          } catch (nameErr) {
            console.warn('Could not set friendly name for passkey:', nameErr);
          }
        }
      }

      return { success: true };
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : 'Passkey registration ceremony failed';
      const msg = formatPasskeyError(rawMsg);
      setError(msg);
      return { success: false, error: msg };
    }
  }, []);

  // 8. List Registered Passkeys
  const listPasskeys = useCallback(async (): Promise<PasskeyItem[]> => {
    try {
      const passkeyApi = (supabase.auth as unknown as { passkey?: PasskeyApi }).passkey;
      if (passkeyApi && typeof passkeyApi.list === 'function') {
        const { data, error: listErr } = await passkeyApi.list();
        if (listErr) {
          console.warn('Error listing passkeys:', listErr);
          return [];
        }
        return Array.isArray(data) ? data : [];
      }
      return [];
    } catch (err) {
      console.warn('Failed to query passkeys list:', err);
      return [];
    }
  }, []);

  // 9. Delete a Passkey
  const deletePasskey = useCallback(async (id: string) => {
    try {
      const passkeyApi = (supabase.auth as unknown as { passkey?: PasskeyApi }).passkey;
      if (passkeyApi && typeof passkeyApi.delete === 'function') {
        const { error: delErr } = await passkeyApi.delete({ passkeyId: id });
        if (delErr) {
          return { success: false, error: delErr.message };
        }
        return { success: true };
      }
      return { success: false, error: 'Passkey delete API unavailable' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete passkey';
      return { success: false, error: msg };
    }
  }, []);

  // 10. Update Password
  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      const { data, error: updateErr } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateErr) {
        return { success: false, error: updateErr.message };
      }
      if (data?.user) {
        setUser(data.user);
      }
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update password';
      return { success: false, error: msg };
    }
  }, []);

  // 11. Send Password Reset Email
  const sendPasswordResetEmail = useCallback(async (targetEmail?: string) => {
    try {
      const emailToSend = targetEmail || user?.email;
      if (!emailToSend) {
        return { success: false, error: 'No email address available to send reset link.' };
      }
      const redirectUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/admin/reset-password`
          : undefined;

      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(emailToSend, {
        redirectTo: redirectUrl,
      });
      if (resetErr) {
        return { success: false, error: resetErr.message };
      }
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send reset email';
      return { success: false, error: msg };
    }
  }, [user]);

  // 12. Sign Out
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Error during signOut:', err);
    }
    setSession(null);
    setUser(null);
    setIsLocalBypass(false);
    setMfaLevel(null);
  }, []);

  // 13. Sign Out Everywhere
  const signOutAllDevices = useCallback(async () => {
    try {
      const { error: signErr } = await supabase.auth.signOut({ scope: 'global' });
      if (signErr) {
        return { success: false, error: signErr.message };
      }
      setSession(null);
      setUser(null);
      setIsLocalBypass(false);
      setMfaLevel(null);
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to sign out all devices';
      return { success: false, error: msg };
    }
  }, []);

  // 14. Bypass local dev auth (deprecated, disabled)
  const bypassLocalAuth = useCallback(() => {
    setIsLocalBypass(false);
    setIsLoading(false);
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      isLoading,
      isLocalBypass,
      error,
      mfaLevel,
      checkMfaLevel,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signInWithPasskey,
      verifyMfaCode,
      unenrollMfaFactor,
      registerPasskey,
      listPasskeys,
      deletePasskey,
      updatePassword,
      sendPasswordResetEmail,
      signOut,
      signOutAllDevices,
      bypassLocalAuth,
      clearError,
    }),
    [
      user,
      session,
      isLoading,
      isLocalBypass,
      error,
      mfaLevel,
      checkMfaLevel,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signInWithPasskey,
      verifyMfaCode,
      unenrollMfaFactor,
      registerPasskey,
      listPasskeys,
      deletePasskey,
      updatePassword,
      sendPasswordResetEmail,
      signOut,
      signOutAllDevices,
      bypassLocalAuth,
      clearError,
    ]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
