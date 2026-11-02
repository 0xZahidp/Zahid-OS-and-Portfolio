'use client';

import React, { useMemo, useState } from 'react';
import type { DistrictTravelData, DistrictTravelStatus } from '@/types/travel.types';
import { BANGLADESH_DIVISIONS } from '@/lib/travel/bangladesh-districts';
import { Search, X, Check, Star, RefreshCw, Compass } from 'lucide-react';

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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold shrink-0">
            <Check className="size-2.5" />
            <span>Visited</span>
          </span>
        );
      case 'planned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold shrink-0">
            <Star className="size-2.5 fill-amber-400" />
            <span>Wishlist</span>
          </span>
        );
      case 'revisit_planned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-[10px] font-bold shrink-0">
            <RefreshCw className="size-2.5" />
            <span>Revisit</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700/50 text-zinc-400 text-[10px] font-medium shrink-0">
            <span>Unexplored</span>
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
            className="w-full h-10 pl-10 pr-9 rounded-2xl border border-white/10 bg-white/5 text-xs text-white placeholder:text-white/40 outline-hidden focus:border-emerald-500/60 focus:bg-black/40 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Division Filter Pills */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs select-none [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]"
        >
          <button
            type="button"
            onClick={() => setSelectedDivision('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              selectedDivision === 'all'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25 ring-1 ring-emerald-400/30'
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
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25 ring-1 ring-emerald-400/30'
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
        <div
          className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1 select-none [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]"
        >
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
              className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                selectedStatus === st.id
                  ? 'bg-white/20 text-white font-bold ring-1 ring-white/20'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of District Cards: Polished responsive grid with fixed min-height & no word-break artifacts */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 max-h-[640px] overflow-y-auto overflow-x-hidden pr-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-white/5 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full [scrollbar-width:thin]"
      >
        {filteredDistricts.map((district) => {
          const isSelected = selectedCode === district.code;
          return (
            <div
              key={district.code}
              onClick={() => onSelectDistrict(district)}
              className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 min-h-[108px] ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-500/15 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-500/50 scale-[1.01]'
                  : 'border-white/10 bg-zinc-900/70 hover:border-emerald-500/40 hover:bg-zinc-800/90 hover:-translate-y-0.5 backdrop-blur-md'
              }`}
            >
              {/* Top Row: District Name, Bengali Name & Status Badge */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm text-white truncate group-hover:text-emerald-300 transition-colors">
                    {district.name}
                  </h4>
                  <p className="text-xs text-emerald-400 font-medium truncate mt-0.5">
                    {district.bnName}
                  </p>
                </div>
                <div className="shrink-0 pt-0.5">
                  {getStatusBadge(district.status)}
                </div>
              </div>

              {/* Bottom Row: Division Name & Visits Counter Pill */}
              <div className="flex items-center justify-between text-[11px] pt-2.5 border-t border-white/5 gap-2">
                <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 text-[10.5px] font-semibold text-zinc-400 capitalize whitespace-nowrap">
                  {district.division}
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10.5px] font-mono font-medium text-emerald-400 whitespace-nowrap">
                  {district.visitsCount > 0
                    ? `${district.visitsCount} ${district.visitsCount === 1 ? 'visit' : 'visits'}`
                    : '0 visits'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredDistricts.length === 0 && (
        <div className="p-12 text-center text-xs text-white/40 border border-dashed border-white/10 rounded-2xl space-y-2">
          <Compass className="size-6 text-white/20 mx-auto" />
          <p>No districts found matching &ldquo;{searchQuery}&rdquo;</p>
        </div>
      )}
    </div>
  );
};
