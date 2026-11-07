import { promises as fs } from 'node:fs';
import path from 'node:path';
import { supabaseServer } from '@/lib/supabase/server';
import {
  HealthData,
  HealthProfile,
  Medication,
  HealthDocument,
  Visit,
  Vital,
  Vaccination,
  Reminder,
  HealthCollectionKey,
  HealthCollections,
} from '@/types/health';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');

const FILE_PATHS: Record<HealthCollectionKey, string> = {
  profile: path.join(DATA_DIR, 'health-profile.json'),
  medications: path.join(DATA_DIR, 'health-medications.json'),
  documents: path.join(DATA_DIR, 'health-documents.json'),
  visits: path.join(DATA_DIR, 'health-visits.json'),
  vitals: path.join(DATA_DIR, 'health-vitals.json'),
  vaccinations: path.join(DATA_DIR, 'health-vaccinations.json'),
  reminders: path.join(DATA_DIR, 'health-reminders.json'),
};

const SITE_SETTING_KEYS: Record<HealthCollectionKey, string> = {
  profile: 'health_profile',
  medications: 'health_medications',
  documents: 'health_documents',
  visits: 'health_visits',
  vitals: 'health_vitals',
  vaccinations: 'health_vaccinations',
  reminders: 'health_reminders',
};

const DEFAULT_PROFILE: HealthProfile = {
  bloodGroup: '',
  allergies: [],
  conditions: [],
  emergencyContacts: [],
  notes: '',
  updatedAt: new Date().toISOString(),
};

interface CacheEntry {
  data: HealthCollections[HealthCollectionKey];
  timestamp: number;
}

const memoryCache: Partial<Record<HealthCollectionKey, CacheEntry>> = {};
const CACHE_TTL_MS = 10000; // 10s TTL

async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs = 4000): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Supabase query timed out')), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}

export function clearHealthCache(collection?: HealthCollectionKey): void {
  if (collection) {
    delete memoryCache[collection];
  } else {
    for (const key of Object.keys(memoryCache) as HealthCollectionKey[]) {
      delete memoryCache[key];
    }
  }
}

/**
 * Fetch a single health collection from Supabase site_settings with local JSON fallback
 */
export async function getHealthCollection<K extends HealthCollectionKey>(
  collection: K
): Promise<HealthCollections[K]> {
  const cached = memoryCache[collection];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data as HealthCollections[K];
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const settingKey = SITE_SETTING_KEYS[collection];

  // 1. Primary: Supabase site_settings
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      const { data, error } = await withTimeout(
        supabase
          .from('site_settings')
          .select('value')
          .eq('key', settingKey)
          .maybeSingle()
      );

      if (error) {
        throw new Error(`Failed to read health collection ${collection}: ${error.message}`);
      }

      let value: HealthCollections[K];
      if (data && data.value) {
        let rawVal = data.value;
        if (typeof rawVal === 'object' && rawVal !== null && 'data' in rawVal && !Array.isArray(rawVal)) {
          rawVal = (rawVal as { data: unknown }).data;
        }

        if (collection === 'profile') {
          value = { ...DEFAULT_PROFILE, ...(rawVal as HealthProfile) } as HealthCollections[K];
        } else if (!Array.isArray(rawVal)) {
          value = [] as unknown as HealthCollections[K];
        } else {
          value = rawVal as HealthCollections[K];
        }
      } else {
        // Key does not exist in DB yet
        value = (collection === 'profile' ? DEFAULT_PROFILE : []) as HealthCollections[K];
      }

      memoryCache[collection] = { data: value, timestamp: Date.now() };

      if (!process.env.VERCEL) {
        fs.writeFile(FILE_PATHS[collection], JSON.stringify(value, null, 2), 'utf-8').catch(() => {});
      }

      return value;
    } catch (err) {
      if (process.env.VERCEL || supabaseUrl) {
        throw err;
      }
    }
  }

  // 2. Fallback: Local gitignored JSON file (offline local dev without Supabase only)
  try {
    const raw = await fs.readFile(FILE_PATHS[collection], 'utf-8');
    const parsed = JSON.parse(raw);
    let value = parsed;
    if (collection === 'profile') {
      value = { ...DEFAULT_PROFILE, ...(parsed as HealthProfile) };
    } else if (!Array.isArray(value)) {
      value = [];
    }

    memoryCache[collection] = { data: value, timestamp: Date.now() };
    return value as HealthCollections[K];
  } catch {
    // Return empty default
    const defaultValue = (collection === 'profile' ? DEFAULT_PROFILE : []) as HealthCollections[K];
    memoryCache[collection] = { data: defaultValue, timestamp: Date.now() };
    return defaultValue;
  }
}

/**
 * Persist a single health collection to Supabase site_settings + local gitignored file
 */
export async function saveHealthCollection<K extends HealthCollectionKey>(
  collection: K,
  data: HealthCollections[K]
): Promise<boolean> {
  let supabaseSaved = false;
  let fileSaved = false;

  // 1. Local JSON write (gitignored file path, skip on Vercel)
  if (!process.env.VERCEL) {
    try {
      await fs.writeFile(FILE_PATHS[collection], JSON.stringify(data, null, 2), 'utf-8');
      fileSaved = true;
    } catch {
      // EROFS in read-only serverless environment is normal
    }
  }

  // 2. Supabase site_settings
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      const { error } = await supabase.from('site_settings').upsert(
        {
          key: SITE_SETTING_KEYS[collection],
          value: data,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );

      if (!error) {
        supabaseSaved = true;
      }
    } catch {
      // Log failure code only
    }
  }

  if (!supabaseSaved && !fileSaved) {
    throw new Error(`Failed to save health collection: ${collection}`);
  }

  memoryCache[collection] = { data, timestamp: Date.now() };

  return true;
}

/**
 * Retrieve the full aggregated Health data object
 */
export async function getHealthData(): Promise<HealthData> {
  const [profile, medications, documents, visits, vitals, vaccinations, reminders] =
    await Promise.all([
      getHealthCollection('profile'),
      getHealthCollection('medications'),
      getHealthCollection('documents'),
      getHealthCollection('visits'),
      getHealthCollection('vitals'),
      getHealthCollection('vaccinations'),
      getHealthCollection('reminders'),
    ]);

  return {
    profile,
    medications,
    documents,
    visits,
    vitals,
    vaccinations,
    reminders,
    lastBackupDate: new Date().toISOString(),
  };
}

/**
 * Export all health metadata for backup
 */
export async function exportHealthData(): Promise<HealthData> {
  return await getHealthData();
}

/**
 * Restore and merge health backup metadata by id without deleting existing items
 */
export async function restoreHealthData(
  imported: Partial<HealthData>
): Promise<{ success: boolean; counts: Record<string, number> }> {
  clearHealthCache();
  const current = await getHealthData();

  const counts: Record<string, number> = {
    medications: 0,
    documents: 0,
    visits: 0,
    vitals: 0,
    vaccinations: 0,
    reminders: 0,
  };

  // 1. Profile: merge non-empty fields
  const updatedProfile: HealthProfile = {
    ...current.profile,
    ...(imported.profile || {}),
    allergies: Array.from(
      new Set([...(current.profile.allergies || []), ...(imported.profile?.allergies || [])])
    ),
    conditions: Array.from(
      new Set([...(current.profile.conditions || []), ...(imported.profile?.conditions || [])])
    ),
    emergencyContacts: imported.profile?.emergencyContacts?.length
      ? imported.profile.emergencyContacts
      : current.profile.emergencyContacts,
    updatedAt: new Date().toISOString(),
  };
  await saveHealthCollection('profile', updatedProfile);

  // Helper to merge lists by ID
  const mergeById = <T extends { id: string }>(existing: T[], incoming?: T[]): T[] => {
    if (!incoming || !Array.isArray(incoming)) return existing;
    const map = new Map<string, T>();
    for (const item of existing) {
      map.set(item.id, item);
    }
    for (const item of incoming) {
      if (item && item.id) {
        map.set(item.id, item);
      }
    }
    return Array.from(map.values());
  };

  if (imported.medications && Array.isArray(imported.medications)) {
    const merged = mergeById<Medication>(current.medications, imported.medications);
    counts.medications = merged.length;
    await saveHealthCollection('medications', merged);
  }

  if (imported.documents && Array.isArray(imported.documents)) {
    const merged = mergeById<HealthDocument>(current.documents, imported.documents);
    counts.documents = merged.length;
    await saveHealthCollection('documents', merged);
  }

  if (imported.visits && Array.isArray(imported.visits)) {
    const merged = mergeById<Visit>(current.visits, imported.visits);
    counts.visits = merged.length;
    await saveHealthCollection('visits', merged);
  }

  if (imported.vitals && Array.isArray(imported.vitals)) {
    const merged = mergeById<Vital>(current.vitals, imported.vitals);
    counts.vitals = merged.length;
    await saveHealthCollection('vitals', merged);
  }

  if (imported.vaccinations && Array.isArray(imported.vaccinations)) {
    const merged = mergeById<Vaccination>(current.vaccinations, imported.vaccinations);
    counts.vaccinations = merged.length;
    await saveHealthCollection('vaccinations', merged);
  }

  if (imported.reminders && Array.isArray(imported.reminders)) {
    const merged = mergeById<Reminder>(current.reminders, imported.reminders);
    counts.reminders = merged.length;
    await saveHealthCollection('reminders', merged);
  }

  return { success: true, counts };
}

