'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { DistrictTravelData, DistrictTravelStatus, TravelMemory, TravelStats } from '@/types/travel.types';
import type { DistrictCode } from '@/lib/travel/bangladesh-districts';
import { BangladeshDistrictMap } from './BangladeshDistrictMap';
import { DistrictDetailDrawer } from './DistrictDetailDrawer';
import { DistrictExplorer } from './DistrictExplorer';
import {
  Compass,
  Calendar,
  Layers,
  BookOpen,
  Navigation,
} from 'lucide-react';

interface TravelWorkspaceProps {
  mode: 'admin' | 'public';
  adminHeaders?: HeadersInit;
  initialDistrictCode?: DistrictCode;
}

export const TravelWorkspace: React.FC<TravelWorkspaceProps> = ({
  mode,
  adminHeaders,
  initialDistrictCode,
}) => {
  const [districts, setDistricts] = useState<DistrictTravelData[]>([]);
  const [stats, setStats] = useState<TravelStats>({
    visitedCount: 0,
    totalCount: 64,
    visitedPercentage: 0,
    divisionsVisitedCount: 0,
    totalDivisions: 8,
    plannedCount: 0,
    totalMemoriesCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'map' | 'explorer' | 'journal'>('map');
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictTravelData | null>(null);

  // Load travel data from API
  const loadTravelData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/os/travel', {
        headers: adminHeaders || {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDistricts(data.districts || []);
        if (data.stats) {
          setStats(data.stats);
        }

        // Set initial selected district if none active
        if (data.districts?.length > 0) {
          if (initialDistrictCode) {
            const initMatch = data.districts.find(
              (d: DistrictTravelData) => d.code === initialDistrictCode
            );
            if (initMatch) setSelectedDistrict(initMatch);
            else setSelectedDistrict(data.districts[0]);
          } else if (!selectedDistrict) {
            // Default to Dhaka or Cox's Bazar
            const dhk = data.districts.find((d: DistrictTravelData) => d.code === 'bd-dhk');
            setSelectedDistrict(dhk || data.districts[0]);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load travel data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [adminHeaders, initialDistrictCode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadTravelData();
  }, [loadTravelData]);

  // Keep selectedDistrict in sync when districts state updates
  const selectedDistrictCode = selectedDistrict?.code;
  useEffect(() => {
    if (selectedDistrictCode && districts.length > 0) {
      const refreshed = districts.find((d) => d.code === selectedDistrictCode);
      if (refreshed) {
        setSelectedDistrict(refreshed);
      }
    }
  }, [districts, selectedDistrictCode]);

  // Admin Handler: Update district status
  const handleUpdateStatus = async (code: string, newStatus: DistrictTravelStatus) => {
    try {
      const res = await fetch('/api/os/travel', {
        method: 'POST',
        headers: adminHeaders || {
          'Content-Type': 'application/json',
          'x-admin-key': 'folioframe_admin',
        },
        body: JSON.stringify({ code, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDistricts(data.districts);
        setStats(data.stats);
        if (data.district) setSelectedDistrict(data.district);
      }
    } catch (err) {
      console.warn('Failed to update district status:', err);
    }
  };

  // Admin Handler: Update district metadata (visitsCount, rating, notes)
  const handleUpdateDistrict = async (code: string, updates: Partial<DistrictTravelData>) => {
    try {
      const res = await fetch('/api/os/travel', {
        method: 'POST',
        headers: adminHeaders || {
          'Content-Type': 'application/json',
          'x-admin-key': 'folioframe_admin',
        },
        body: JSON.stringify({ code, ...updates }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDistricts(data.districts);
        setStats(data.stats);
        if (data.district) setSelectedDistrict(data.district);
      }
    } catch (err) {
      console.warn('Failed to update district:', err);
    }
  };

  // Admin Handler: Add trip memory
  const handleAddMemory = async (code: string, memory: Omit<TravelMemory, 'id'>) => {
    try {
      const res = await fetch('/api/os/travel', {
        method: 'POST',
        headers: adminHeaders || {
          'Content-Type': 'application/json',
          'x-admin-key': 'folioframe_admin',
        },
        body: JSON.stringify({ code, memory }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDistricts(data.districts);
        setStats(data.stats);
        if (data.district) setSelectedDistrict(data.district);
      }
    } catch (err) {
      console.warn('Failed to add memory:', err);
    }
  };

  // Admin Handler: Delete trip memory
  const handleDeleteMemory = async (code: string, memoryId: string) => {
    try {
      const res = await fetch(
        `/api/os/travel?code=${encodeURIComponent(code)}&memoryId=${encodeURIComponent(memoryId)}`,
        {
          method: 'DELETE',
          headers: adminHeaders || {
            'x-admin-key': 'folioframe_admin',
          },
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setDistricts(data.districts);
        setStats(data.stats);
        if (data.district) setSelectedDistrict(data.district);
      }
    } catch (err) {
      console.warn('Failed to delete memory:', err);
    }
  };

  // Compute all trip memories sorted by date descending for Journal tab
  const allJournalMemories = React.useMemo(() => {
    const list: Array<{ districtName: string; bnName: string; division: string; memory: TravelMemory }> = [];
    for (const d of districts) {
      if (d.memories && d.memories.length > 0) {
        for (const m of d.memories) {
          list.push({
            districtName: d.name,
            bnName: d.bnName,
            division: d.division,
            memory: m,
          });
        }
      }
    }
    return list.sort((a, b) => (b.memory.date || '').localeCompare(a.memory.date || ''));
  }, [districts]);

  if (isLoading && districts.length === 0) {
    return (
      <div className="p-12 text-center space-y-3">
        <div className="size-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto" />
        <p className="text-xs font-mono text-white/50">Loading Bangladesh Travel Map...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white max-w-7xl mx-auto p-2 sm:p-4">
      {/* Top Header Card with Stats */}
      <div className="p-5 sm:p-7 rounded-3xl border border-white/10 bg-gradient-to-r from-zinc-950 via-zinc-900 to-emerald-950/40 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-300">
              <Compass className="size-3.5 text-emerald-400" />
              <span>Bangladesh Travel Tracker • 0xZahidP</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              64 Districts Odyssey
            </h2>

            <p className="text-xs text-white/60 leading-relaxed">
              Personal geographical ledger tracking district expeditions, road trips, regional cuisine,
              and historical heritage across all 8 divisions of Bangladesh.
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Visited Progress */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md space-y-1">
              <span className="text-[10px] uppercase font-bold text-white/50 block">Explored</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                  {stats.visitedCount}
                </span>
                <span className="text-xs text-white/40 font-mono">/ 64</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${stats.visitedPercentage}%` }}
                />
              </div>
              <span className="text-[10px] text-emerald-300/80 font-mono block">
                {stats.visitedPercentage}% of BD
              </span>
            </div>

            {/* Divisions */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md space-y-1">
              <span className="text-[10px] uppercase font-bold text-white/50 block">Divisions</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">
                  {stats.divisionsVisitedCount}
                </span>
                <span className="text-xs text-white/40 font-mono">/ 8</span>
              </div>
              <span className="text-[10px] text-white/50 block mt-2">Regional coverage</span>
            </div>

            {/* Planned */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md space-y-1">
              <span className="text-[10px] uppercase font-bold text-white/50 block">Wishlist</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                  {stats.plannedCount}
                </span>
                <span className="text-xs text-white/40">places</span>
              </div>
              <span className="text-[10px] text-white/50 block mt-2">Planned expeditions</span>
            </div>

            {/* Total Memories */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md space-y-1">
              <span className="text-[10px] uppercase font-bold text-white/50 block">Journal</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-violet-400 font-mono">
                  {stats.totalMemoriesCount}
                </span>
                <span className="text-xs text-white/40">entries</span>
              </div>
              <span className="text-[10px] text-white/50 block mt-2">Memories recorded</span>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('map')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'map'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Compass className="size-3.5" />
            <span>Interactive SVG Map</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('explorer')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'explorer'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Layers className="size-3.5" />
            <span>64 Districts Directory</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('journal')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'journal'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            <BookOpen className="size-3.5" />
            <span>Travel Journal ({allJournalMemories.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: INTERACTIVE MAP & DETAIL DRAWER */}
      {activeTab === 'map' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* SVG Map (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <BangladeshDistrictMap
              districts={districts}
              selectedCode={selectedDistrict?.code || null}
              onSelectDistrict={(d) => setSelectedDistrict(d)}
            />
          </div>

          {/* District Details & CRUD Drawer (5 Cols) */}
          <div className="lg:col-span-5 sticky top-6">
            {selectedDistrict ? (
              <DistrictDetailDrawer
                district={selectedDistrict}
                onClose={() => setSelectedDistrict(null)}
                mode={mode}
                onUpdateStatus={handleUpdateStatus}
                onUpdateDistrict={handleUpdateDistrict}
                onAddMemory={handleAddMemory}
                onDeleteMemory={handleDeleteMemory}
              />
            ) : (
              <div className="p-8 rounded-3xl border border-dashed border-white/10 text-center text-white/40 space-y-2">
                <Navigation className="size-8 mx-auto text-emerald-400/50" />
                <p className="text-xs">Click any district on the map to open its travel record.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DISTRICTS DIRECTORY */}
      {activeTab === 'explorer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-8">
            <DistrictExplorer
              districts={districts}
              selectedCode={selectedDistrict?.code || null}
              onSelectDistrict={(d) => {
                setSelectedDistrict(d);
                // Also scroll into view or show drawer
              }}
            />
          </div>

          <div className="lg:col-span-4 sticky top-6">
            {selectedDistrict && (
              <DistrictDetailDrawer
                district={selectedDistrict}
                onClose={() => setSelectedDistrict(null)}
                mode={mode}
                onUpdateStatus={handleUpdateStatus}
                onUpdateDistrict={handleUpdateDistrict}
                onAddMemory={handleAddMemory}
                onDeleteMemory={handleDeleteMemory}
              />
            )}
          </div>
        </div>
      )}

      {/* TAB 3: TRAVEL JOURNAL TIMELINE */}
      {activeTab === 'journal' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
            <span className="font-bold text-white">Chronological Journey Across Bangladesh</span>
            <span className="font-mono text-emerald-400">{allJournalMemories.length} adventures recorded</span>
          </div>

          <div className="space-y-3">
            {allJournalMemories.map(({ districtName, bnName, division, memory }) => (
              <div
                key={memory.id}
                className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-white/10 hover:border-emerald-500/30 transition-all space-y-2.5 backdrop-blur-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/5">
                  <div className="flex items-center gap-2.5">
                    <span className="size-8 rounded-xl bg-emerald-500/20 text-emerald-400 grid place-items-center font-bold text-xs">
                      {districtName.substring(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-white">{memory.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-emerald-300/80">
                        <span>{districtName} ({bnName})</span>
                        <span>•</span>
                        <span className="capitalize">{division} Division</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-white/50">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3.5 text-emerald-400" />
                      <span>{memory.date}</span>
                    </span>
                    {memory.transport && (
                      <span className="px-2 py-0.5 rounded-full bg-white/10 text-[11px] text-cyan-300">
                        {memory.transport}
                      </span>
                    )}
                  </div>
                </div>

                {memory.notes && (
                  <p className="text-xs text-white/80 leading-relaxed">{memory.notes}</p>
                )}

                {memory.tags && memory.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {memory.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] text-white/60 font-mono"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {allJournalMemories.length === 0 && (
              <div className="p-8 text-center text-xs text-white/40 border border-dashed border-white/10 rounded-2xl">
                No memories logged yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
