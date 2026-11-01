'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

interface PasskeyApi {
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

interface AdminAuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isLocalBypass: boolean;
  error: string | null;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInWithPasskey: () => Promise<{ success: boolean; error?: string }>;
  registerPasskey: (name?: string) => Promise<{ success: boolean; error?: string }>;
  listPasskeys: () => Promise<PasskeyItem[]>;
  deletePasskey: (id: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  bypassLocalAuth: () => void;
  clearError: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const LOCAL_BYPASS_KEY = 'folioframe_admin_local_bypass';

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLocalBypass, setIsLocalBypass] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check initial session & subscribe to auth state changes
  useEffect(() => {
    let mounted = true;

    // Check if local dev bypass was previously enabled
    if (typeof window !== 'undefined') {
      const storedBypass = localStorage.getItem(LOCAL_BYPASS_KEY);
      if (storedBypass === 'true') {
        setIsLocalBypass(true);
      }
    }

    // Get current session
    supabase.auth
      .getSession()
      .then(({ data, error: sessionErr }) => {
        if (!mounted) return;
        if (sessionErr) {
          console.warn('Supabase getSession error:', sessionErr);
        }
        if (data?.session) {
          setSession(data.session);
          setUser(data.session.user);
          setIsLocalBypass(false);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        console.warn('Failed to retrieve Supabase session:', err);
        setIsLoading(false);
      });

    // Subscribe to auth state updates (e.g. login, logout, token refresh, OAuth redirect)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!mounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession) {
        setIsLocalBypass(false);
        if (typeof window !== 'undefined') {
          localStorage.removeItem(LOCAL_BYPASS_KEY);
        }
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // 1. Email + Password Sign In
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
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      setError(msg);
      return { success: false, error: msg };
    }
  }, []);

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
        return { success: true, message: 'Account created and signed in!' };
      }

      return {
        success: true,
        message: 'Account created! Please check your email inbox to confirm your registration.',
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg);
      return { success: false, error: msg };
    }
  }, []);

  // 3. Google OAuth Sign In
  const signInWithGoogle = useCallback(async () => {
    setError(null);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectTo = `${origin}/auth/callback?next=/admin`;

      const { error: oAuthErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (oAuthErr) {
        setError(oAuthErr.message);
        return { success: false, error: oAuthErr.message };
      }

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google OAuth failed';
      setError(msg);
      return { success: false, error: msg };
    }
  }, []);

  // 4. Passkey (WebAuthn / FIDO2) Sign In
  const signInWithPasskey = useCallback(async () => {
    setError(null);
    try {
      if (typeof window === 'undefined' || !window.PublicKeyCredential) {
        const msg = 'Your browser or device does not support WebAuthn / Passkeys.';
        setError(msg);
        return { success: false, error: msg };
      }

      if (typeof supabase.auth.signInWithPasskey !== 'function') {
        const msg = 'Passkey authentication is not available in current Supabase client.';
        setError(msg);
        return { success: false, error: msg };
      }

      const { data, error: passkeyErr } = await supabase.auth.signInWithPasskey();

      if (passkeyErr) {
        setError(passkeyErr.message);
        return { success: false, error: passkeyErr.message };
      }

      if (data?.session) {
        setSession(data.session);
        setUser(data.user);
        setIsLocalBypass(false);
      }

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Passkey ceremony failed';
      setError(msg);
      return { success: false, error: msg };
    }
  }, []);

  // 5. Register a new Passkey (Apple Touch ID, YubiKey, Windows Hello, etc.)
  const registerPasskey = useCallback(async (name?: string) => {
    setError(null);
    try {
      if (typeof window === 'undefined' || !window.PublicKeyCredential) {
        const msg = 'WebAuthn passkeys are not supported on this platform.';
        setError(msg);
        return { success: false, error: msg };
      }

      if (typeof supabase.auth.registerPasskey !== 'function') {
        const msg = 'Passkey registration function is not available.';
        setError(msg);
        return { success: false, error: msg };
      }

      const { data, error: regErr } = await supabase.auth.registerPasskey();

      if (regErr) {
        setError(regErr.message);
        return { success: false, error: regErr.message };
      }

      if (name && data && 'id' in data && typeof data.id === 'string') {
        const passkeyApi = (supabase.auth as unknown as { passkey?: PasskeyApi }).passkey;
        if (passkeyApi?.update) {
          try {
            await passkeyApi.update({ passkeyId: data.id, friendlyName: name });
          } catch (nameErr) {
            console.warn('Could not set friendly name for passkey:', nameErr);
          }
        }
      }

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Passkey registration ceremony failed';
      setError(msg);
      return { success: false, error: msg };
    }
  }, []);

  // 6. List Registered Passkeys
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

  // 7. Delete a Passkey
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

  // 8. Sign Out
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Error during signOut:', err);
    }
    setSession(null);
    setUser(null);
    setIsLocalBypass(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_BYPASS_KEY);
    }
  }, []);

  // 9. Local Dev Bypass (for offline preview or testing without remote setup)
  const bypassLocalAuth = useCallback(() => {
    setIsLocalBypass(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_BYPASS_KEY, 'true');
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      isLoading,
      isLocalBypass,
      error,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signInWithPasskey,
      registerPasskey,
      listPasskeys,
      deletePasskey,
      signOut,
      bypassLocalAuth,
      clearError,
    }),
    [
      user,
      session,
      isLoading,
      isLocalBypass,
      error,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signInWithPasskey,
      registerPasskey,
      listPasskeys,
      deletePasskey,
      signOut,
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
