'use client';

import React, { useMemo, useState } from 'react';
import type { DistrictTravelData, DistrictTravelStatus } from '@/types/travel.types';
import { BANGLADESH_DIVISIONS } from '@/lib/travel/bangladesh-districts';
import { Search } from 'lucide-react';

interface DistrictExplorerProps {
  districts: DistrictTravelData[];
  selectedCode: string | null;
  onSelectDistrict: (district: DistrictTravelData) => void;
}

export const DistrictExplorer: React.FC<DistrictExplorerProps> = ({
  districts,
  selectedCode,
  onSelectDistrict,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredDistricts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return districts.filter((d) => {
      const matchesQuery =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.bnName.includes(q) ||
        d.division.toLowerCase().includes(q) ||
        (d.notes && d.notes.toLowerCase().includes(q));

      const matchesDivision = selectedDivision === 'all' || d.division === selectedDivision;
      const matchesStatus = selectedStatus === 'all' || d.status === selectedStatus;

      return matchesQuery && matchesDivision && matchesStatus;
    });
  }, [districts, searchQuery, selectedDivision, selectedStatus]);

  const getStatusBadge = (status: DistrictTravelStatus) => {
    switch (status) {
      case 'visited':
        return (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
            Visited
          </span>
        );
      case 'planned':
        return (
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
            Planned
          </span>
        );
      case 'revisit_planned':
        return (
          <span className="px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-[10px] font-bold">
            Revisit
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40 text-[10px] font-medium">
            Unexplored
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 select-none">
      {/* Search & Division Filters */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search district by name (e.g. Sylhet, কক্সবাজার, Chattogram)..."
            className="w-full h-10 pl-10 pr-4 rounded-2xl border border-white/10 bg-white/5 text-xs text-white placeholder:text-white/40 outline-hidden focus:border-emerald-500/60 transition-colors"
          />
        </div>

        {/* Division Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedDivision('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedDivision === 'all'
                ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            All Divisions ({districts.length})
          </button>
          {BANGLADESH_DIVISIONS.map((div) => {
            const count = districts.filter((d) => d.division === div.id).length;
            const isSelected = selectedDivision === div.id;
            return (
              <button
                key={div.id}
                type="button"
                onClick={() => setSelectedDivision(div.id)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{div.name}</span>
                <span className="ml-1 opacity-60">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All Statuses' },
            { id: 'visited', label: 'Visited' },
            { id: 'planned', label: 'Wishlist / Planned' },
            { id: 'revisit_planned', label: 'Revisit Planned' },
            { id: 'not_visited', label: 'Unexplored' },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setSelectedStatus(st.id)}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                selectedStatus === st.id
                  ? 'bg-white/20 text-white font-bold'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of District Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 max-h-[560px] overflow-y-auto pr-1">
        {filteredDistricts.map((district) => {
          const isSelected = selectedCode === district.code;
          return (
            <div
              key={district.code}
              onClick={() => onSelectDistrict(district)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10 scale-[1.01]'
                  : 'border-white/10 bg-white/5 hover:border-emerald-500/30 hover:bg-white/8'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-white">{district.name}</h4>
                  <p className="text-xs text-emerald-400/90 font-serif">{district.bnName}</p>
                </div>
                {getStatusBadge(district.status)}
              </div>

              <div className="flex items-center justify-between text-[11px] text-white/50 pt-2 border-t border-white/5">
                <span className="capitalize">{district.division} Division</span>
                <span className="font-mono">
                  {district.visitsCount > 0 ? `${district.visitsCount} visits` : '0 visits'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredDistricts.length === 0 && (
        <div className="p-8 text-center text-xs text-white/40 border border-dashed border-white/10 rounded-2xl">
          No districts found matching your filters.
        </div>
      )}
    </div>
  );
};
