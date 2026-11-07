import { supabaseServer } from '@/lib/supabase/server';
import {
  encryptVaultValue,
  decryptVaultValue,
  maskSecretValue,
} from '@/lib/crypto/vault';

export { maskSecretValue } from '@/lib/crypto/vault';

export interface EnvVaultItem {
  key: string;
  value?: string;
  maskedValue?: string;
  hasValue: boolean;
  isSecret: boolean;
  source: 'supabase' | 'env_file' | 'none';
  description?: string;
  updatedAt?: string;
}

// In-memory cache with 30s TTL to prevent database latency on frequent requests
interface CacheEntry {
  value: string | undefined;
  timestamp: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30_000;

/**
 * Evaluates whether a secret or environment variable is considered unset.
 * Returns true if value is missing, empty, or a placeholder starting with "your-".
 */
export function isValueUnset(val?: string | null): boolean {
  if (val === undefined || val === null) return true;
  const trimmed = String(val).trim();
  if (trimmed === '') return true;
  if (trimmed.toLowerCase().startsWith('your-')) return true;
  return false;
}

/**
 * Get an environment variable or secret dynamically.
 * Prioritizes Supabase `app_settings` table (NO Vercel redeployment required!).
 * Falls back to process.env if not found in Supabase.
 * Empty values and placeholders starting with "your-" are treated as unset.
 */
export async function getAppSecret(
  key: string,
  fallbackEnvName?: string
): Promise<string | undefined> {
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.value;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // 1. Try Supabase app_settings table
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', key)
        .maybeSingle();

      if (!error && data?.value !== undefined && data.value !== null) {
        const decrypted = decryptVaultValue(data.value);
        if (!isValueUnset(decrypted)) {
          cache.set(key, { value: decrypted, timestamp: now });
          return decrypted;
        }
      }
    } catch {
      // Supabase unavailable or table pending
    }
  }

  // 2. Fallback to process.env
  const rawFallback = process.env[fallbackEnvName || key];
  const fallbackVal = isValueUnset(rawFallback) ? undefined : rawFallback?.trim();
  cache.set(key, { value: fallbackVal, timestamp: now });
  return fallbackVal;
}

/**
 * Alias for getAppSecret
 */
export const getSecret = getAppSecret;

/**
 * Save or update an environment variable / secret directly in Supabase `app_settings`.
 * It takes effect immediately across all server APIs without redeploying Vercel.
 */
export async function setAppSecret(
  key: string,
  value: string,
  isSecret = true,
  description?: string
): Promise<{ success: boolean; error?: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl || supabaseUrl.includes('placeholder.supabase.co')) {
    return { success: false, error: 'Supabase is not configured in .env.local' };
  }

  try {
    const supabase = supabaseServer();
    const storedValue = isSecret ? encryptVaultValue(value) : value;
    const payloadWithDesc: Record<string, unknown> = {
      key,
      value: storedValue,
      is_secret: isSecret,
      description: description || '',
      updated_at: new Date().toISOString(),
    };

    let { error } = await supabase.from('app_settings').upsert(payloadWithDesc);

    // If remote table was created without 'description' column, fallback gracefully
    if (error && error.message && error.message.includes('description')) {
      const payloadWithoutDesc: Record<string, unknown> = {
        key,
        value: storedValue,
        is_secret: isSecret,
        updated_at: new Date().toISOString(),
      };
      const retry = await supabase.from('app_settings').upsert(payloadWithoutDesc);
      error = retry.error;
    }

    if (error) {
      return { success: false, error: error.message };
    }

    // Invalidate cache immediately
    cache.delete(key);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return { success: false, error: message };
  }
}

/**
 * Delete an environment variable / secret from Supabase `app_settings`.
 */
export async function deleteAppSecret(key: string): Promise<{ success: boolean; error?: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('placeholder.supabase.co')) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    const supabase = supabaseServer();
    const { error } = await supabase.from('app_settings').delete().eq('key', key);
    if (error) {
      return { success: false, error: error.message };
    }
    cache.delete(key);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return { success: false, error: message };
  }
}

/**
 * List all configured secrets & environment variables for CMS display.
 * Secrets have their values safely masked (e.g. `re_ZDp••••••••••••`).
 */
export async function listAppSecrets(): Promise<EnvVaultItem[]> {
  const commonSystemKeys: Array<{ key: string; isSecret: boolean; description: string }> = [
    {
      key: 'RESEND_API_KEY',
      isSecret: true,
      description: 'Resend API key for inbox communications and contact form dispatches',
    },
    {
      key: 'GITHUB_TOKEN',
      isSecret: true,
      description: 'GitHub Personal Access Token for private contribution graphs and API limits',
    },
    {
      key: 'CONTACT_TO_EMAIL',
      isSecret: false,
      description: 'Destination email address where public contact inquiries are sent',
    },
    {
      key: 'RESEND_DEFAULT_SENDER',
      isSecret: false,
      description: 'Default sender address for emails dispatched by Resend (e.g. "Md Zahid Hasan <hello@zahidp.com>" or "test@zahidp.com")',
    },
    {
      key: 'CONTACT_FROM_EMAIL',
      isSecret: false,
      description: 'Sender header for emails dispatched by Resend (e.g. "Md Zahid <hello@zahidp.com>")',
    },
    {
      key: 'CONTACT_RATE_LIMIT_SECRET',
      isSecret: true,
      description: 'HMAC secret key used to generate IP rate-limiting tokens on public forms',
    },
    {
      key: 'NEXT_PUBLIC_SITE_URL',
      isSecret: false,
      description: 'Canonical live domain URL for OpenGraph cards and metadata',
    },
  ];

  const resultsMap = new Map<string, EnvVaultItem>();

  // 1. Initialize with standard system keys and check process.env
  for (const item of commonSystemKeys) {
    const envVal = process.env[item.key];
    const isUnset = isValueUnset(envVal);
    resultsMap.set(item.key, {
      key: item.key,
      hasValue: !isUnset,
      isSecret: item.isSecret,
      source: !isUnset ? 'env_file' : 'none',
      maskedValue: !isUnset ? maskSecretValue(envVal, item.isSecret) : undefined,
      description: item.description,
    });
  }

  // 2. Fetch all keys from Supabase app_settings
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      const { data, error } = await supabase.from('app_settings').select('*');

      if (!error && Array.isArray(data)) {
        for (const row of data) {
          const rawVal = row.value || '';
          const isSecret = Boolean(row.is_secret);
          const clearVal = isSecret ? decryptVaultValue(rawVal) : rawVal;
          const isUnset = isValueUnset(clearVal);
          resultsMap.set(row.key, {
            key: row.key,
            hasValue: !isUnset,
            isSecret,
            source: 'supabase',
            maskedValue: !isUnset ? maskSecretValue(clearVal, isSecret) : undefined,
            value: isSecret || isUnset ? undefined : clearVal, // Only send plaintext value if not a secret
            description: row.description || resultsMap.get(row.key)?.description || '',
            updatedAt: row.updated_at,
          });
        }
      }
    } catch {
      // Supabase unavailable or table pending
    }
  }

  return Array.from(resultsMap.values());
}
