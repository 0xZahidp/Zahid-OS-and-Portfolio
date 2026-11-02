import type { BangladeshDivision, DistrictCode } from '@/lib/travel/bangladesh-districts';

export type DistrictTravelStatus = 'not_visited' | 'planned' | 'visited' | 'revisit_planned';

export interface TravelMemory {
  id: string;
  title: string;
  date: string;
  notes?: string;
  transport?: string;
  rating?: number; // 1-5
  tags?: string[];
}

export interface DistrictTravelData {
  code: DistrictCode;
  name: string;
  bnName: string;
  division: BangladeshDivision;
  slug: string;
  status: DistrictTravelStatus;
  visitsCount: number;
  rating?: number;
  notes?: string;
  places?: string[];
  lastVisitedAt?: string | null;
  memories: TravelMemory[];
}

export interface TravelStats {
  visitedCount: number;
  totalCount: number; // 64
  visitedPercentage: number;
  divisionsVisitedCount: number;
  totalDivisions: number; // 8
  plannedCount: number;
  totalMemoriesCount: number;
}

export interface TravelApiResponse {
  success: boolean;
  districts: DistrictTravelData[];
  stats: TravelStats;
  isAdmin?: boolean;
  error?: string;
}
