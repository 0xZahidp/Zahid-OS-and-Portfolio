import { promises as fs } from 'node:fs';
import path from 'node:path';
import { supabaseServer } from '@/lib/supabase/server';
import { CareerApplication, CareerMetrics } from '@/types/career';

const CAREER_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'career-applications.json');

let memoryCache: { applications: CareerApplication[]; version: number; timestamp: number } | null = null;
const CACHE_TTL_MS = 10000;

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

export async function getCareerApplications(): Promise<{
  applications: CareerApplication[];
  metrics: CareerMetrics;
  version: number;
}> {
  if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_TTL_MS) {
    return {
      applications: memoryCache.applications,
      metrics: calculateMetrics(memoryCache.applications),
      version: memoryCache.version,
    };
  }

  let list: CareerApplication[] = [];
  let version = 0;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // 1. Try Supabase site_settings
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      const { data, error } = await withTimeout(
        supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'career_applications')
          .maybeSingle()
      );

      if (error) {
        throw new Error(`Failed to read career applications from database: ${error.message}`);
      }

      // If data is null or empty, key does not exist yet (return empty list)
      if (data && data.value) {
        if (Array.isArray(data.value)) {
          list = data.value as CareerApplication[];
          version = 0;
        } else if (typeof data.value === 'object') {
          const valObj = data.value as { version?: unknown; data?: unknown };
          if (typeof valObj.version === 'number') {
            version = valObj.version;
          }
          if (Array.isArray(valObj.data)) {
            list = valObj.data as CareerApplication[];
          } else if (Array.isArray(data.value)) {
            list = data.value as CareerApplication[];
          } else {
            list = [];
          }
        } else {
          list = [];
        }
      } else {
        list = [];
      }

      memoryCache = {
        applications: list,
        version,
        timestamp: Date.now(),
      };

      return {
        applications: list,
        metrics: calculateMetrics(list),
        version,
      };
    } catch (err) {
      if (process.env.VERCEL || supabaseUrl) {
        throw err;
      }
    }
  }

  // 2. Fallback to local JSON file (offline local dev without Supabase only)
  try {
    const raw = await fs.readFile(CAREER_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      list = parsed;
      version = 0;
    } else if (parsed && typeof parsed === 'object') {
      if (typeof parsed.version === 'number') {
        version = parsed.version;
      }
      if (Array.isArray(parsed.data)) {
        list = parsed.data;
      }
    }
  } catch {
    list = [];
    version = 0;
  }

  memoryCache = {
    applications: list,
    version,
    timestamp: Date.now(),
  };

  return {
    applications: list,
    metrics: calculateMetrics(list),
    version,
  };
}

export async function saveCareerApplications(
  applications: CareerApplication[],
  expectedVersion?: number
): Promise<{ success: boolean; version: number }> {
  let currentVersion = 0;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Retrieve current version to check optimistic concurrency
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      const { data } = await withTimeout(
        supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'career_applications')
          .maybeSingle(),
        3000
      );
      if (data?.value && typeof data.value === 'object' && !Array.isArray(data.value)) {
        const valObj = data.value as { version?: unknown };
        if (typeof valObj.version === 'number') {
          currentVersion = valObj.version;
        }
      }
    } catch {
      if (memoryCache) {
        currentVersion = memoryCache.version;
      }
    }
  } else if (memoryCache) {
    currentVersion = memoryCache.version;
  }

  // Concurrency check: reject if stale
  if (expectedVersion !== undefined && expectedVersion !== currentVersion) {
    const err = new Error('This data changed elsewhere, reload before saving');
    (err as unknown as { status: number; statusCode: number }).status = 409;
    (err as unknown as { status: number; statusCode: number }).statusCode = 409;
    throw err;
  }

  const newVersion = currentVersion + 1;
  const payload = {
    version: newVersion,
    data: applications,
  };

  let fileSaved = false;
  let supabaseSaved = false;

  // 1. Local JSON write (safely ignore EROFS in read-only production, skip on Vercel)
  if (!process.env.VERCEL) {
    try {
      await fs.writeFile(CAREER_FILE_PATH, JSON.stringify(payload, null, 2), 'utf-8');
      fileSaved = true;
    } catch (err) {
      console.warn('[CareerStore] Local file write skipped (read-only environment):', err);
    }
  }

  // 2. Supabase site_settings
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      const { error } = await supabase.from('site_settings').upsert(
        {
          key: 'career_applications',
          value: payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );
      if (!error) {
        supabaseSaved = true;
      } else {
        console.warn('[CareerStore] Supabase write error:', error.message);
      }
    } catch (err) {
      console.warn('[CareerStore] Supabase write error:', err);
    }
  }

  if (!fileSaved && !supabaseSaved) {
    throw new Error('Failed to save career applications to storage');
  }

  memoryCache = {
    applications,
    version: newVersion,
    timestamp: Date.now(),
  };

  return { success: true, version: newVersion };
}

export function calculateMetrics(applications: CareerApplication[]): CareerMetrics {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  let active = 0;
  let interviewsScheduled = 0;
  let offers = 0;
  let rejected = 0;
  let overdueFollowups = 0;

  applications.forEach((app) => {
    if (app.archived) return;

    if (['applied', 'screening', 'technical', 'manager'].includes(app.status)) {
      active++;
    }
    if (app.status === 'offer') {
      offers++;
    }
    if (app.status === 'rejected') {
      rejected++;
    }

    // Check interviews
    if (Array.isArray(app.interviews)) {
      const upcoming = app.interviews.filter((i) => !i.completed);
      interviewsScheduled += upcoming.length;
    }

    // Check overdue follow-ups
    if (app.next_followup_date && app.next_followup_date < todayStr && app.status !== 'rejected' && app.status !== 'withdrawn') {
      overdueFollowups++;
    }
  });

  return {
    total: applications.filter((a) => !a.archived).length,
    active,
    interviewsScheduled,
    offers,
    rejected,
    overdueFollowups,
  };
}

