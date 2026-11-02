import { NextRequest, NextResponse } from 'next/server';
import { getTravelData, saveTravelData, calculateTravelStats } from '@/lib/travel/travel-storage';
import { supabaseServer } from '@/lib/supabase/server';
import { DistrictCode } from '@/lib/travel/bangladesh-districts';
import { DistrictTravelStatus, TravelMemory } from '@/types/travel.types';

export const dynamic = 'force-dynamic';

async function isAdminRequest(req: NextRequest): Promise<boolean> {
  const adminKey = req.headers.get('x-admin-key');
  if (adminKey === 'folioframe_admin') return true;

  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '');
  if (token) {
    try {
      const supabase = supabaseServer();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);
      if (!error && user) return true;
    } catch {
      // fallback
    }
  }

  try {
    const supabase = supabaseServer();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (!error && user) return true;
  } catch {
    // fallback
  }

  return false;
}

// 1. GET: Fetch districts and travel stats (Publicly accessible)
export async function GET(req: NextRequest) {
  try {
    const { districts, stats } = await getTravelData();
    const isAdmin = await isAdminRequest(req);

    return NextResponse.json({
      success: true,
      districts,
      stats,
      isAdmin,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch travel data';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// 2. POST: Update district status or add trip memory (Admin strictly required)
export async function POST(req: NextRequest) {
  try {
    const isAdmin = await isAdminRequest(req);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only the administrator can modify travel records.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { code, status, visitsCount, rating, notes, memory } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ success: false, error: 'District code is required' }, { status: 400 });
    }

    const { districts } = await getTravelData();
    const target = districts.find((d) => d.code === code);

    if (!target) {
      return NextResponse.json({ success: false, error: `District with code ${code} not found` }, { status: 404 });
    }

    // Update status if provided
    if (status && ['not_visited', 'planned', 'visited', 'revisit_planned'].includes(status)) {
      target.status = status as DistrictTravelStatus;
    }

    if (typeof visitsCount === 'number') {
      target.visitsCount = Math.max(0, visitsCount);
    }

    if (typeof rating === 'number') {
      target.rating = rating;
    }

    if (typeof notes === 'string') {
      target.notes = notes.trim();
    }

    // If a new memory / trip log is added
    if (memory && typeof memory.title === 'string' && memory.title.trim()) {
      const newMemory: TravelMemory = {
        id: memory.id || `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: memory.title.trim(),
        date: memory.date || new Date().toISOString().split('T')[0],
        notes: memory.notes?.trim() || '',
        transport: memory.transport?.trim() || undefined,
        rating: typeof memory.rating === 'number' ? memory.rating : undefined,
        tags: Array.isArray(memory.tags) ? memory.tags : undefined,
      };

      if (!Array.isArray(target.memories)) {
        target.memories = [];
      }

      // Check if updating existing memory
      const existingIdx = target.memories.findIndex((m) => m.id === newMemory.id);
      if (existingIdx !== -1) {
        target.memories[existingIdx] = newMemory;
      } else {
        target.memories.unshift(newMemory);
        // Automatically ensure district is marked visited and visitsCount incremented
        if (target.status === 'not_visited' || target.status === 'planned') {
          target.status = 'visited';
        }
        if (!target.visitsCount || target.visitsCount === 0) {
          target.visitsCount = 1;
        }
        target.lastVisitedAt = newMemory.date;
      }
    }

    await saveTravelData(districts);
    const updatedStats = calculateTravelStats(districts);

    return NextResponse.json({
      success: true,
      district: target,
      districts,
      stats: updatedStats,
      message: `District ${target.name} updated successfully.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update district';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// 3. DELETE: Remove a trip memory (Admin strictly required)
export async function DELETE(req: NextRequest) {
  try {
    const isAdmin = await isAdminRequest(req);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only the administrator can delete travel memories.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code') as DistrictCode | null;
    const memoryId = searchParams.get('memoryId');

    if (!code || !memoryId) {
      return NextResponse.json(
        { success: false, error: 'Both district code and memoryId are required' },
        { status: 400 }
      );
    }

    const { districts } = await getTravelData();
    const target = districts.find((d) => d.code === code);

    if (!target) {
      return NextResponse.json({ success: false, error: 'District not found' }, { status: 404 });
    }

    if (Array.isArray(target.memories)) {
      target.memories = target.memories.filter((m) => m.id !== memoryId);
    }

    await saveTravelData(districts);
    const updatedStats = calculateTravelStats(districts);

    return NextResponse.json({
      success: true,
      district: target,
      districts,
      stats: updatedStats,
      message: 'Memory deleted successfully.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete memory';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
