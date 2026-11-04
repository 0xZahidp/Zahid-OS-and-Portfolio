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
        const settings = normalizeOsSettings(data.value);
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
        const settings = normalizeOsSettings(data);
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
    const parsed = JSON.parse(content);
    const settings = normalizeOsSettings(parsed);
    memorySettingsCache = { settings, timestamp: Date.now() };
    return settings;
  } catch (err) {
    console.warn('[getOsSettings] Failed to read os-settings.json, using defaults:', err);
  }

  return defaultOsSettings;
}

/**
 * Save OS Settings across:
 * 1. Memory cache (instant consistency for subsequent requests)
 * 2. Supabase site_settings (key: 'zahid_os_settings')
 * 3. Supabase dedicated table 'os_settings' (if exists)
 * 4. Local JSON file (offline / dev fallback)
 */
export async function saveOsSettings(settings: Partial<ZahidOsSettings>): Promise<ZahidOsSettings> {
  const current = await getOsSettings();
  const merged: ZahidOsSettings = {
    ...current,
    ...settings,
    updated_at: new Date().toISOString(),
  };

  // Immediate in-memory cache update
  memorySettingsCache = { settings: merged, timestamp: Date.now() };

  // 1. Save to local file (safely ignore EROFS in read-only / Vercel environments)
  try {
    await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(merged, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[saveOsSettings] Local file write skipped (read-only environment):', err);
  }

  // 2. Sync to Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    const supabase = supabaseServer();

    // 2a. Sync to site_settings (active JSON store)
    try {
      await supabase.from('site_settings').upsert(
        {
          key: 'zahid_os_settings',
          value: merged,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );
    } catch (err) {
      console.warn('[saveOsSettings] Error saving OS settings to site_settings:', err);
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
  }

  return merged;
}
