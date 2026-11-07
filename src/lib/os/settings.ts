import { promises as fs } from 'node:fs';
import path from 'node:path';
import { supabaseServer } from '@/lib/supabase/server';
import { ZahidOsSettings } from '@/types/os';
import { normalizeWallpaperId } from './wallpapers';

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'os-settings.json');

let memorySettingsCache: { settings: ZahidOsSettings; timestamp: number } | null = null;
const SETTINGS_CACHE_TTL = 15000; // 15s in-memory cache

const defaultOsSettings: ZahidOsSettings = {
  is_public_enabled: false,
  allow_public_link_creation: false,
  public_hero_title: 'Zahid OS',
  public_hero_subtitle: 'Cloud tools, web utilities & micro-apps designed by 0xZahidP',
  wallpaper: 'zos-emerald',
  sound_effects: true,
  app_permissions: {
    shortener: { is_public: true, name: 'Shortener' },
    travel: { is_public: true, name: 'Travel Map' },
    api_playground: { is_public: true, name: 'API Playground' },
    temp_mail: { is_public: true, name: 'Temp Mail' },
    qr: { is_public: true, name: 'QR Studio' },
    notes: { is_public: false, name: 'Notes' },
    snippets: { is_public: true, name: 'Snippets' },
    focus: { is_public: true, name: 'Focus Clock' },
    settings: { is_public: false, name: 'Settings' },
  },
};

function normalizeOsSettings(raw: Partial<ZahidOsSettings> | null | undefined): ZahidOsSettings {
  if (!raw || typeof raw !== 'object') return defaultOsSettings;
  return {
    ...defaultOsSettings,
    ...raw,
    is_public_enabled: Boolean(raw.is_public_enabled),
    allow_public_link_creation: Boolean(raw.allow_public_link_creation),
    wallpaper: normalizeWallpaperId(raw.wallpaper || defaultOsSettings.wallpaper),
    app_permissions: {
      ...defaultOsSettings.app_permissions,
      ...(raw.app_permissions && typeof raw.app_permissions === 'object' ? raw.app_permissions : {}),
    },
  };
}

/**
 * Get OS Settings with 3-tier fallback:
 * 1. Supabase 'site_settings' key 'zahid_os_settings' / dedicated 'os_settings' table
 * 2. Local JSON file 'src/data/os-settings.json' (offline / dev fallback)
 * 3. Default OS settings seed
 */
export async function getOsSettings(): Promise<ZahidOsSettings> {
  // 0. In-memory cache (<15s)
  if (memorySettingsCache && Date.now() - memorySettingsCache.timestamp < SETTINGS_CACHE_TTL) {
    return memorySettingsCache.settings;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // 1. Try Supabase first if configured (ensures serverless deployments on Vercel see latest updates)
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    // 1a. Try Supabase site_settings JSONB store (primary active store)
    try {
      const supabase = supabaseServer();
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'zahid_os_settings')
        .maybeSingle();

      if (!error && data?.value && typeof data.value === 'object') {
        let version = 0;
        let rawVal = data.value;
        if ('version' in data.value && typeof (data.value as { version?: unknown }).version === 'number') {
          version = (data.value as { version: number }).version;
        }
        if (
          'data' in data.value &&
          (data.value as { data?: unknown }).data &&
          typeof (data.value as { data?: unknown }).data === 'object'
        ) {
          rawVal = (data.value as { data: Record<string, unknown> }).data;
        }
        const settings = {
          ...normalizeOsSettings(rawVal),
          version,
        };
        memorySettingsCache = { settings, timestamp: Date.now() };
        return settings;
      }
    } catch (err) {
      console.warn('[getOsSettings] Supabase site_settings fallback:', err);
    }

    // 1b. Try dedicated table 'os_settings'
    try {
      const supabase = supabaseServer();
      const { data, error } = await supabase
        .from('os_settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();

      if (!error && data && typeof data === 'object') {
        const settings = {
          ...normalizeOsSettings(data),
          version: 0,
        };
        memorySettingsCache = { settings, timestamp: Date.now() };
        return settings;
      }
    } catch {
      // Fall through to local file
    }
  }

  // 2. Try Local File fallback
  try {
    const content = await fs.readFile(SETTINGS_FILE_PATH, 'utf-8');
    let parsed = JSON.parse(content);
    let version = 0;
    if (parsed && typeof parsed === 'object') {
      if ('version' in parsed && typeof parsed.version === 'number') {
        version = parsed.version;
      }
      if ('data' in parsed && parsed.data && typeof parsed.data === 'object') {
        parsed = parsed.data;
      }
    }
    const settings = {
      ...normalizeOsSettings(parsed),
      version,
    };
    memorySettingsCache = { settings, timestamp: Date.now() };
    return settings;
  } catch (err) {
    console.warn('[getOsSettings] Failed to read os-settings.json, using defaults:', err);
  }

  return { ...defaultOsSettings, version: 0 };
}

/**
 * Save OS Settings across:
 * 1. Memory cache (instant consistency for subsequent requests)
 * 2. Supabase site_settings (key: 'zahid_os_settings')
 * 3. Supabase dedicated table 'os_settings' (if exists)
 * 4. Local JSON file (offline / dev fallback)
 */
export async function saveOsSettings(
  settings: Partial<ZahidOsSettings>,
  expectedVersion?: number
): Promise<ZahidOsSettings> {
  let currentVersion = 0;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Retrieve current version to check optimistic concurrency
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      const { data: row } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'zahid_os_settings')
        .maybeSingle();
      if (row?.value && typeof row.value === 'object') {
        if (typeof (row.value as { version?: unknown }).version === 'number') {
          currentVersion = (row.value as { version: number }).version;
        } else if (
          'data' in row.value &&
          typeof (row.value as { data?: { version?: unknown } }).data?.version === 'number'
        ) {
          currentVersion = (row.value as { data: { version: number } }).data.version;
        }
      }
    } catch {
      if (memorySettingsCache) {
        currentVersion = memorySettingsCache.settings.version ?? 0;
      }
    }
  } else if (memorySettingsCache) {
    currentVersion = memorySettingsCache.settings.version ?? 0;
  }

  const targetExpectedVersion =
    expectedVersion !== undefined
      ? expectedVersion
      : typeof settings.version === 'number'
      ? settings.version
      : undefined;

  if (targetExpectedVersion !== undefined && targetExpectedVersion !== currentVersion) {
    const err = new Error('This data changed elsewhere, reload before saving');
    (err as unknown as { status: number; statusCode: number }).status = 409;
    (err as unknown as { status: number; statusCode: number }).statusCode = 409;
    throw err;
  }

  const newVersion = currentVersion + 1;
  const current = await getOsSettings();
  const merged: ZahidOsSettings = {
    ...current,
    ...settings,
    version: newVersion,
    updated_at: new Date().toISOString(),
  };

  const payload = {
    version: newVersion,
    data: merged,
  };

  let fileSaved = false;
  let supabaseSaved = false;

  // 1. Save to local file (safely ignore EROFS in read-only / Vercel environments, skip on Vercel)
  if (!process.env.VERCEL) {
    try {
      await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(payload, null, 2), 'utf-8');
      fileSaved = true;
    } catch (err) {
      console.warn('[saveOsSettings] Local file write skipped (read-only environment):', err);
    }
  }

  // 2. Sync to Supabase
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();

      // 2a. Sync to site_settings (active JSON store)
      const { error: settingsError } = await supabase.from('site_settings').upsert(
        {
          key: 'zahid_os_settings',
          value: payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );
      if (!settingsError) {
        supabaseSaved = true;
      } else {
        console.warn('[saveOsSettings] Error saving OS settings to site_settings:', settingsError.message);
      }

      // 2b. Sync to dedicated table 'os_settings' if present
      try {
        await supabase.from('os_settings').upsert(
          {
            id: 'default',
            is_public_enabled: merged.is_public_enabled,
            allow_public_link_creation: merged.allow_public_link_creation ?? false,
            public_hero_title: merged.public_hero_title,
            public_hero_subtitle: merged.public_hero_subtitle,
            wallpaper: merged.wallpaper,
            sound_effects: merged.sound_effects,
            app_permissions: merged.app_permissions,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      } catch {
        // Table may not exist yet, site_settings already saved
      }
    } catch (err) {
      console.warn('[saveOsSettings] Error saving OS settings to Supabase:', err);
    }
  }

  if (!fileSaved && !supabaseSaved) {
    throw new Error('Failed to save OS settings to storage');
  }

  // Immediate in-memory cache update
  memorySettingsCache = { settings: merged, timestamp: Date.now() };

  return merged;
}
