import { promises as fs } from 'node:fs';
import path from 'node:path';
import { supabaseServer } from '@/lib/supabase/server';
import { CareerApplication, CareerMetrics } from '@/types/career';

const CAREER_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'career-applications.json');

let memoryCache: { applications: CareerApplication[]; timestamp: number } | null = null;
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
}> {
  if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_TTL_MS) {
    return {
      applications: memoryCache.applications,
      metrics: calculateMetrics(memoryCache.applications),
    };
  }

  let list: CareerApplication[] = [];
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
        } else if (typeof data.value === 'object' && Array.isArray((data.value as { data?: unknown }).data)) {
          list = (data.value as { data: CareerApplication[] }).data;
        } else {
          list = [];
        }
      } else {
        list = [];
      }

      memoryCache = {
        applications: list,
        timestamp: Date.now(),
      };

      return {
        applications: list,
        metrics: calculateMetrics(list),
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
    }
  } catch {
    list = [];
  }

  memoryCache = {
    applications: list,
    timestamp: Date.now(),
  };

  return {
    applications: list,
    metrics: calculateMetrics(list),
  };
}

export async function saveCareerApplications(
  applications: CareerApplication[]
): Promise<boolean> {
  let fileSaved = false;
  let supabaseSaved = false;

  // 1. Local JSON write (safely ignore EROFS in read-only production, skip on Vercel)
  if (!process.env.VERCEL) {
    try {
      await fs.writeFile(CAREER_FILE_PATH, JSON.stringify(applications, null, 2), 'utf-8');
      fileSaved = true;
    } catch (err) {
      console.warn('[CareerStore] Local file write skipped (read-only environment):', err);
    }
  }

  // 2. Supabase site_settings
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      const { error } = await supabase.from('site_settings').upsert(
        {
          key: 'career_applications',
          value: applications,
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
    timestamp: Date.now(),
  };

  return true;
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

