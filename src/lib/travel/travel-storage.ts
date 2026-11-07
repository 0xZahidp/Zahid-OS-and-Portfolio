import { promises as fs } from 'node:fs';
import path from 'node:path';
import { supabaseServer } from '@/lib/supabase/server';
import { BANGLADESH_DISTRICTS, DistrictCode } from './bangladesh-districts';
import { DistrictTravelData, TravelStats } from '@/types/travel.types';

const TRAVEL_DATA_FILE = path.join(process.cwd(), 'src', 'data', 'travel-data.json');

/**
 * Canonical Code Aliases mapping legacy codes to official BBS/ISO BD codes.
 * Ensures 100% interoperability across database versions and local json caches.
 */
export const CODE_ALIASES: Record<string, DistrictCode> = {
  'bd-cha': 'bd-chn',   // Chandpur
  'bd-bar2': 'bd-brg',  // Barguna
  'bd-jes': 'bd-jas',   // Jashore
  'bd-jal': 'bd-jha',   // Jhalakathi
  'bd-nae': 'bd-nao',   // Naogaon
  'bd-nar3': 'bd-nrl',  // Narail
  'bd-nar2': 'bd-nsd',  // Narsingdi
  'bd-cha2': 'bd-cwn',  // Chapai Nawabganj
  'bd-pii': 'bd-pir',   // Pirojpur
  'bd-raj2': 'bd-rjb',  // Rajbari
  'bd-ran2': 'bd-rgp',  // Rangpur
};

export function normalizeDistrictCode(rawCode: string): DistrictCode {
  if (!rawCode) return 'bd-dhk';
  const lower = rawCode.toLowerCase();
  return CODE_ALIASES[lower] || (lower as DistrictCode);
}

// Ultra-fast in-memory cache (30-second TTL) for instant sub-millisecond API responses
let memoryTravelCache: { districts: DistrictTravelData[]; stats: TravelStats; timestamp: number } | null = null;
const CACHE_TTL_MS = 30000;

/**
 * Generate default seed dataset for all 64 districts with authentic initial records for 0xZahidP
 */
export function getDefaultTravelData(): DistrictTravelData[] {
  return BANGLADESH_DISTRICTS.map((d) => {
    // Curated initial seed records for 0xZahidP
    if (d.code === 'bd-dhk') {
      return {
        code: d.code,
        name: d.name,
        bnName: d.bnName,
        division: d.division,
        slug: d.slug,
        status: 'visited',
        visitsCount: 15,
        rating: 5,
        notes: 'Home base & engineering hub. Explored extensively across Dhanmondi, Gulshan, Uttara and Old Dhaka.',
        lastVisitedAt: '2026-10-28',
        memories: [
          {
            id: 'mem-dhk-1',
            title: 'Old Dhaka Heritage & Food Walk',
            date: '2026-08-14',
            transport: 'Rickshaw & Walking',
            rating: 5,
            notes: 'Explored Lalbagh Fort, Ahsan Manzil, and sampled traditional Kacchi & Beauty Lassi.',
            tags: ['Heritage', 'Food', 'Culture'],
          },
          {
            id: 'mem-dhk-2',
            title: 'Tech Meetup & Developer Summit',
            date: '2026-05-20',
            transport: 'Metro Rail',
            rating: 5,
            notes: 'Attended full-stack engineering conference at Agargaon.',
            tags: ['Tech', 'Networking'],
          },
        ],
      };
    }

    if (d.code === 'bd-cox') {
      return {
        code: d.code,
        name: d.name,
        bnName: d.bnName,
        division: d.division,
        slug: d.slug,
        status: 'visited',
        visitsCount: 4,
        rating: 5,
        notes: 'Worlds longest natural sea beach. Marine Drive route is breathtaking during golden hour.',
        lastVisitedAt: '2025-12-18',
        memories: [
          {
            id: 'mem-cox-1',
            title: 'Marine Drive Road Trip & Inani Beach',
            date: '2025-12-18',
            transport: 'Open Jeep',
            rating: 5,
            notes: 'Cruised the 80km Marine Drive with hills on left and ocean on right. Sunset at coral beach Inani.',
            tags: ['Beach', 'Road Trip', 'Nature'],
          },
        ],
      };
    }

    if (d.code === 'bd-ctg') {
      return {
        code: d.code,
        name: d.name,
        bnName: d.bnName,
        division: d.division,
        slug: d.slug,
        status: 'visited',
        visitsCount: 3,
        rating: 5,
        notes: 'Port city of green hills and sea breeze. CRB and Patenga are personal favorites.',
        lastVisitedAt: '2025-11-04',
        memories: [
          {
            id: 'mem-ctg-1',
            title: 'Patenga Sunset & CRB Shirishtola',
            date: '2025-11-04',
            transport: 'Train (Suborno Express)',
            rating: 5,
            notes: 'Walked under century-old rain trees at CRB, followed by fresh spicy sea crab at Patenga.',
            tags: ['Nature', 'Sea', 'Train'],
          },
        ],
      };
    }

    if (d.code === 'bd-syl') {
      return {
        code: d.code,
        name: d.name,
        bnName: d.bnName,
        division: d.division,
        slug: d.slug,
        status: 'visited',
        visitsCount: 2,
        rating: 5,
        notes: 'Land of two leaves and a bud. Pristine hills, freshwater swamps, and crystal clear streams.',
        lastVisitedAt: '2025-07-22',
        memories: [
          {
            id: 'mem-syl-1',
            title: 'Ratargul Swamp Forest & Jaflong',
            date: '2025-07-22',
            transport: 'Microbus & Canoe',
            rating: 5,
            notes: 'Paddled through the submerged freshwater forest canopy and viewed Meghalaya waterfalls at Jaflong.',
            tags: ['Swamp', 'Adventure', 'Canoe'],
          },
        ],
      };
    }

    if (d.code === 'bd-cum') {
      return {
        code: d.code,
        name: d.name,
        bnName: d.bnName,
        division: d.division,
        slug: d.slug,
        status: 'visited',
        visitsCount: 3,
        rating: 4,
        notes: 'Ancient Buddhist civilization relics and world-famous sweetmeats.',
        lastVisitedAt: '2025-04-12',
        memories: [
          {
            id: 'mem-cum-1',
            title: 'Shalban Vihara Archaeological Tour',
            date: '2025-04-12',
            transport: 'Car',
            rating: 5,
            notes: 'Explored 8th-century archaeological monastery ruins at Mainamati ridge and tasted authentic Matri Bhandar Rashmalai.',
            tags: ['Archaeology', 'History', 'Food'],
          },
        ],
      };
    }

    if (d.code === 'bd-gaz') {
      return {
        code: d.code,
        name: d.name,
        bnName: d.bnName,
        division: d.division,
        slug: d.slug,
        status: 'visited',
        visitsCount: 5,
        rating: 4,
        notes: 'Lush Sal forest belt and resort escapes just outside capital city limits.',
        lastVisitedAt: '2026-02-10',
        memories: [
          {
            id: 'mem-gaz-1',
            title: 'Bhawal National Park Woodland Walk',
            date: '2026-02-10',
            transport: 'Bike',
            rating: 4,
            notes: 'Cycling through quiet Sal forest trails on a cool winter morning.',
            tags: ['Forest', 'Cycling', 'Outdoors'],
          },
        ],
      };
    }

    if (d.code === 'bd-nar') {
      return {
        code: d.code,
        name: d.name,
        bnName: d.bnName,
        division: d.division,
        slug: d.slug,
        status: 'visited',
        visitsCount: 2,
        rating: 4,
        notes: 'Ancient capital Sonargaon and the ghost town of Panam Nagar.',
        lastVisitedAt: '2024-10-05',
        memories: [
          {
            id: 'mem-nar-1',
            title: 'Panam City Heritage Architecture Exploration',
            date: '2024-10-05',
            transport: 'Bus & Auto',
            rating: 5,
            notes: 'Studied intricate British-colonial merchant mansions lined along single street in historic Panam Nagar.',
            tags: ['Architecture', 'History'],
          },
        ],
      };
    }

    if (d.code === 'bd-ban') {
      return {
        code: d.code,
        name: d.name,
        bnName: d.bnName,
        division: d.division,
        slug: d.slug,
        status: 'planned',
        visitsCount: 0,
        rating: 5,
        notes: 'Top wishlist expedition: Trekking to Keokradong, exploring Nafakhum water falls, and staying above clouds at Nilgiri.',
        lastVisitedAt: null,
        memories: [],
      };
    }

    if (d.code === 'bd-ran') {
      return {
        code: d.code,
        name: d.name,
        bnName: d.bnName,
        division: d.division,
        slug: d.slug,
        status: 'planned',
        visitsCount: 0,
        rating: 5,
        notes: 'Kaptai Lake boat voyage to Shuvolong waterfall and visiting tribal textile weavers.',
        lastVisitedAt: null,
        memories: [],
      };
    }

    if (d.code === 'bd-khu') {
      return {
        code: d.code,
        name: d.name,
        bnName: d.bnName,
        division: d.division,
        slug: d.slug,
        status: 'planned',
        visitsCount: 0,
        rating: 5,
        notes: 'Expedition into Sundarbans mangrove forest, Kotka wildlife sanctuary and Jamtola beach.',
        lastVisitedAt: null,
        memories: [],
      };
    }

    if (d.code === 'bd-raj') {
      return {
        code: d.code,
        name: d.name,
        bnName: d.bnName,
        division: d.division,
        slug: d.slug,
        status: 'planned',
        visitsCount: 0,
        rating: 4,
        notes: 'Silk city on the banks of mighty river Padma, famous for Fazli mangoes and terracotta Bagha Mosque.',
        lastVisitedAt: null,
        memories: [],
      };
    }

    if (d.code === 'bd-bar') {
      return {
        code: d.code,
        name: d.name,
        bnName: d.bnName,
        division: d.division,
        slug: d.slug,
        status: 'planned',
        visitsCount: 0,
        rating: 4,
        notes: 'Venice of Bengal: Floating guava market in canals and sunset over Kirtankhola river.',
        lastVisitedAt: null,
        memories: [],
      };
    }

    // Default for remaining districts
    return {
      code: d.code,
      name: d.name,
      bnName: d.bnName,
      division: d.division,
      slug: d.slug,
      status: 'not_visited',
      visitsCount: 0,
      rating: null as unknown as number,
      notes: '',
      lastVisitedAt: null,
      memories: [],
    };
  });
}

/**
 * Calculate dynamic travel metrics across all 64 districts
 */
export function calculateTravelStats(districts: DistrictTravelData[]): TravelStats {
  const visitedDistricts = districts.filter(
    (d) => d.status === 'visited' || d.status === 'revisit_planned'
  );
  const plannedDistricts = districts.filter((d) => d.status === 'planned');

  const visitedDivisions = new Set(visitedDistricts.map((d) => d.division));
  const totalMemories = districts.reduce((acc, d) => acc + (d.memories?.length || 0), 0);

  const totalCount = 64;
  const visitedCount = visitedDistricts.length;
  const visitedPercentage = Math.round((visitedCount / totalCount) * 100);

  return {
    visitedCount,
    totalCount,
    visitedPercentage,
    divisionsVisitedCount: visitedDivisions.size,
    totalDivisions: 8,
    plannedCount: plannedDistricts.length,
    totalMemoriesCount: totalMemories,
  };
}

/**
 * Retrieve travel data with 3-tier fallback:
 * 1. Supabase dedicated tables (os_travel_districts + os_travel_memories)
 * 2. Supabase site_settings (key: 'zahid_os_travel_data')
 * 3. Local JSON file (src/data/travel-data.json)
 * 4. Seed dataset initialized from CANONICAL 64 districts
 */
export async function getTravelData(): Promise<{
  districts: DistrictTravelData[];
  stats: TravelStats;
}> {
  // 0. Instant in-memory cache (<30s)
  if (memoryTravelCache && Date.now() - memoryTravelCache.timestamp < CACHE_TTL_MS) {
    return memoryTravelCache;
  }

  // 1. Instant local file read (<1ms)
  try {
    const content = await fs.readFile(TRAVEL_DATA_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed) && parsed.length === 64) {
      const districts = parsed.map((d: DistrictTravelData) => ({ ...d, code: normalizeDistrictCode(d.code) }));
      const result = { districts, stats: calculateTravelStats(districts) };
      memoryTravelCache = { ...result, timestamp: Date.now() };
      return result;
    }
  } catch {
    // fall through to Supabase
  }
  let districts: DistrictTravelData[] | null = null;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // 1. Try Supabase dedicated relational tables (os_travel_districts)
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      const { data: dbDistricts, error: distError } = await supabase
        .from('os_travel_districts')
        .select('*');

      if (!distError && dbDistricts && Array.isArray(dbDistricts) && dbDistricts.length === 64) {
        // Fetch memories to associate with districts
        const { data: dbMemories } = await supabase
          .from('os_travel_memories')
          .select('*')
          .order('date', { ascending: false });

        const memoriesMap = new Map<string, DistrictTravelData['memories']>();
        if (dbMemories && Array.isArray(dbMemories)) {
          for (const m of dbMemories) {
            const list = memoriesMap.get(m.district_code) || [];
            list.push({
              id: m.id,
              title: m.title,
              date: m.date,
              transport: m.transport,
              rating: m.rating,
              notes: m.notes,
              tags: m.tags || [],
            });
            memoriesMap.set(m.district_code, list);
          }
        }

        districts = dbDistricts.map((row) => ({
          code: normalizeDistrictCode(row.code),
          name: row.name,
          bnName: row.bn_name,
          division: row.division,
          slug: row.slug,
          status: row.status,
          visitsCount: row.visits_count || 0,
          rating: row.rating,
          notes: row.notes || '',
          places: row.places || [],
          lastVisitedAt: row.last_visited_at,
          memories: (memoriesMap.get(row.code) || memoriesMap.get(normalizeDistrictCode(row.code))) || [],
        }));
      }
    } catch {
      // Table may not exist yet in Supabase, smoothly proceed to tier 2
    }
  }

  // 2. Try Supabase site_settings
  if (!districts && supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'zahid_os_travel_data')
        .maybeSingle();

      if (!error && data?.value && Array.isArray(data.value) && data.value.length === 64) {
        districts = (data.value as DistrictTravelData[]).map((d: DistrictTravelData) => ({ ...d, code: normalizeDistrictCode(d.code) }));
      }
    } catch (err) {
      console.warn('Supabase travel data lookup failed, falling back:', err);
    }
  }

  // 3. Try Local File
  if (!districts) {
    try {
      const content = await fs.readFile(TRAVEL_DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length === 64) {
        districts = parsed.map((d: DistrictTravelData) => ({ ...d, code: normalizeDistrictCode(d.code) }));
      }
    } catch {
      // Local file does not exist yet or is invalid
    }
  }

  // 4. Fallback to default seed dataset
  if (!districts) {
    districts = getDefaultTravelData();
    // Persist default seed locally so next reads are instant (skip on Vercel)
    if (!process.env.VERCEL) {
      try {
        await fs.writeFile(TRAVEL_DATA_FILE, JSON.stringify(districts, null, 2), 'utf-8');
      } catch (err) {
        console.warn('Failed to write initial travel-data.json:', err);
      }
    }
  }

  return {
    districts,
    stats: calculateTravelStats(districts),
  };
}

/**
 * Save updated travel data across local disk and Supabase (relational + backup)
 */
export async function saveTravelData(districts: DistrictTravelData[]): Promise<boolean> {
  memoryTravelCache = null;
  let fileSaved = false;
  let supabaseSaved = false;

  // 1. Save to local file (skip on Vercel)
  if (!process.env.VERCEL) {
    try {
      await fs.writeFile(TRAVEL_DATA_FILE, JSON.stringify(districts, null, 2), 'utf-8');
      fileSaved = true;
    } catch (err) {
      console.warn('Error writing travel-data.json:', err);
    }
  }

  // 2. Sync to Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();

      // Upsert to os_travel_districts table if present
      try {
        const rows = districts.map((d) => ({
          code: d.code,
          name: d.name,
          bn_name: d.bnName,
          division: d.division,
          slug: d.slug,
          status: d.status,
          visits_count: d.visitsCount,
          rating: d.rating || null,
          notes: d.notes || '',
          places: d.places || [],
          last_visited_at: d.lastVisitedAt || null,
          updated_at: new Date().toISOString(),
        }));

        await supabase.from('os_travel_districts').upsert(rows, { onConflict: 'code' });

        // Upsert all memories
        const allMemories: Array<{
          id: string;
          district_code: string;
          title: string;
          date: string;
          transport?: string;
          rating?: number;
          notes?: string;
          tags?: string[];
        }> = [];

        for (const d of districts) {
          if (d.memories && d.memories.length > 0) {
            for (const m of d.memories) {
              allMemories.push({
                id: m.id,
                district_code: d.code,
                title: m.title,
                date: m.date || new Date().toISOString().split('T')[0],
                transport: m.transport,
                rating: m.rating,
                notes: m.notes,
                tags: m.tags || [],
              });
            }
          }
        }

        if (allMemories.length > 0) {
          await supabase.from('os_travel_memories').upsert(allMemories, { onConflict: 'id' });
        }
      } catch {
        // Table might not exist yet
      }

      // Also persist to site_settings as resilient backup
      const { error: settingsErr } = await supabase.from('site_settings').upsert(
        {
          key: 'zahid_os_travel_data',
          value: districts,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );
      if (!settingsErr) {
        supabaseSaved = true;
      }
    } catch (err) {
      console.warn('Error syncing travel data to Supabase:', err);
    }
  }

  if (!fileSaved && !supabaseSaved) {
    throw new Error('Failed to save travel data to storage');
  }

  return true;
}

