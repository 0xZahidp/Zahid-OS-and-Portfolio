import { promises as fs } from 'node:fs';
import path from 'node:path';
import { supabaseServer } from '@/lib/supabase/server';
import { ZahidOsSettings } from '@/types/os';

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'os-settings.json');

const defaultOsSettings: ZahidOsSettings = {
  is_public_enabled: false,
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

export async function getOsSettings(): Promise<ZahidOsSettings> {
  // 1. Try Supabase site_settings
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
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
    }
  } catch (err) {
    console.warn('Supabase getOsSettings fallback to file:', err);
  }

  // 2. Try Local File
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

  // 2. Sync to Supabase site_settings
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
      const supabase = supabaseServer();
      await supabase.from('site_settings').upsert(
        {
          key: 'zahid_os_settings',
          value: merged,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );
    }
  } catch (err) {
    console.warn('Error saving os settings to Supabase:', err);
  }

  return merged;
}

