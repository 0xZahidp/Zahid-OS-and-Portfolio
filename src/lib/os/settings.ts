import { promises as fs } from 'node:fs';
import path from 'node:path';
import { supabaseServer } from '@/lib/supabase/server';
import { ZahidOsSettings } from '@/types/os';

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'os-settings.json');

const defaultOsSettings: ZahidOsSettings = {
  is_public_enabled: false,
  allow_public_link_creation: false,
  public_hero_title: 'Zahid OS',
  public_hero_subtitle: 'Cloud tools, web utilities & micro-apps designed by 0xZahidP',
  wallpaper: 'emerald-mesh',
  sound_effects: true,
  app_permissions: {
    shortener: { is_public: true, name: 'Shortener' },
    qr: { is_public: true, name: 'QR Studio' },
    notes: { is_public: false, name: 'Notes' },
    snippets: { is_public: true, name: 'Snippets' },
    focus: { is_public: true, name: 'Focus Clock' },
    settings: { is_public: false, name: 'Settings' },
  },
};

/**
 * Get OS Settings with 3-tier fallback:
 * 1. Dedicated Supabase table 'os_settings' (if created)
 * 2. Supabase 'site_settings' key 'zahid_os_settings' (active store)
 * 3. Local JSON file 'src/data/os-settings.json' (offline / dev fallback)
 */
export async function getOsSettings(): Promise<ZahidOsSettings> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    // 1. Try dedicated table 'os_settings'
    try {
      const supabase = supabaseServer();
      const { data, error } = await supabase
        .from('os_settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();

      if (!error && data && typeof data === 'object') {
        return {
          ...defaultOsSettings,
          ...data,
        };
      }
    } catch {
      // Fall through to site_settings
    }

    // 2. Try Supabase site_settings JSONB store
    try {
      const supabase = supabaseServer();
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'zahid_os_settings')
        .maybeSingle();

      if (!error && data?.value && typeof data.value === 'object') {
        return {
          ...defaultOsSettings,
          ...data.value,
        };
      }
    } catch (err) {
      console.warn('Supabase getOsSettings fallback to file:', err);
    }
  }

  // 3. Try Local File
  try {
    const content = await fs.readFile(SETTINGS_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(content);
    return {
      ...defaultOsSettings,
      ...parsed,
    };
  } catch (err) {
    console.warn('Failed to read os-settings.json, using defaults:', err);
  }

  return defaultOsSettings;
}

/**
 * Save OS Settings across:
 * 1. Local JSON file
 * 2. Supabase site_settings (key: 'zahid_os_settings')
 * 3. Supabase dedicated table 'os_settings' (if exists)
 */
export async function saveOsSettings(settings: Partial<ZahidOsSettings>): Promise<ZahidOsSettings> {
  const current = await getOsSettings();
  const merged: ZahidOsSettings = {
    ...current,
    ...settings,
    updated_at: new Date().toISOString(),
  };

  // 1. Save to local file
  try {
    await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(merged, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving os-settings.json:', err);
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
      console.warn('Error saving OS settings to site_settings:', err);
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
