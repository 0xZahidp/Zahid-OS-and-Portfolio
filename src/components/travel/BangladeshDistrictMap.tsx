'use client';

import React, { useMemo, useState } from 'react';
import { BANGLADESH_MAP_PATHS, BANGLADESH_MAP_VIEWBOX } from '@/lib/travel/bangladesh-map-paths';
import type { DistrictCode } from '@/lib/travel/bangladesh-districts';
import type { DistrictTravelData, DistrictTravelStatus } from '@/types/travel.types';
import { Navigation } from 'lucide-react';

const STATUS_FILL: Record<DistrictTravelStatus, { normal: string; hover: string; stroke: string; label: string; badgeBg: string; text: string }> = {
  visited: {
    normal: 'fill-emerald-500/90',
    hover: 'hover:fill-emerald-400',
    stroke: '#10b981',
    label: 'Visited',
    badgeBg: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
    text: 'text-emerald-400',
  },
  planned: {
    normal: 'fill-amber-500/90',
    hover: 'hover:fill-amber-400',
    stroke: '#f59e0b',
    label: 'Wishlist / Planned',
    badgeBg: 'bg-amber-500/20 border-amber-500/30 text-amber-300',
    text: 'text-amber-400',
  },
  revisit_planned: {
    normal: 'fill-violet-500/90',
    hover: 'hover:fill-violet-400',
    stroke: '#8b5cf6',
    label: 'Revisit Planned',
    badgeBg: 'bg-violet-500/20 border-violet-500/30 text-violet-300',
    text: 'text-violet-400',
  },
  not_visited: {
    normal: 'fill-zinc-800/80',
    hover: 'hover:fill-zinc-700/90',
    stroke: '#3f3f46',
    label: 'Not Visited',
    badgeBg: 'bg-zinc-800/60 border-zinc-700/40 text-zinc-400',
    text: 'text-zinc-400',
  },
};

const MAP_PATHS_LIST = Object.values(BANGLADESH_MAP_PATHS);

interface BangladeshDistrictMapProps {
  districts: DistrictTravelData[];
  selectedCode: DistrictCode | null;
  onSelectDistrict: (district: DistrictTravelData) => void;
  hoveredCode?: DistrictCode | null;
  onHoverDistrict?: (code: DistrictCode | null) => void;
}

export const BangladeshDistrictMap: React.FC<BangladeshDistrictMapProps> = ({
  districts,
  selectedCode,
  onSelectDistrict,
  hoveredCode: externalHoveredCode,
  onHoverDistrict: setExternalHovered,
}) => {
  const [internalHoveredCode, setInternalHoveredCode] = useState<DistrictCode | null>(null);
  const hoveredCode = externalHoveredCode !== undefined ? externalHoveredCode : internalHoveredCode;

  const districtMap = useMemo(() => {
    const map = new Map<DistrictCode, DistrictTravelData>();
    for (const d of districts) {
      map.set(d.code, d);
    }
    return map;
  }, [districts]);

  const activeHoveredDistrict = hoveredCode ? districtMap.get(hoveredCode) : null;
  const activeSelectedDistrict = selectedCode ? districtMap.get(selectedCode) : null;
  const tooltipData = activeHoveredDistrict || activeSelectedDistrict;

  // Counts for legend
  const counts = useMemo(() => {
    let visited = 0;
    let planned = 0;
    let revisit = 0;
    let notVisited = 0;
    for (const d of districts) {
      if (d.status === 'visited') visited++;
      else if (d.status === 'planned') planned++;
      else if (d.status === 'revisit_planned') revisit++;
      else notVisited++;
    }
    return { visited, planned, revisit, notVisited };
  }, [districts]);

  return (
    <div className="space-y-4 select-none">
      {/* Legend & Stats Pill Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-3 py-2.5 rounded-2xl bg-zinc-900/60 border border-white/5 backdrop-blur-md text-xs">
        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span className="text-white/80 font-medium">Visited ({counts.visited})</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
            <span className="text-white/80 font-medium">Planned ({counts.planned})</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-violet-500 shadow-sm shadow-violet-500/50" />
            <span className="text-white/80 font-medium">Revisit ({counts.revisit})</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-zinc-700" />
            <span className="text-white/40">Unexplored ({counts.notVisited})</span>
          </div>
        </div>

        <div className="text-[11px] font-mono text-emerald-400/90 flex items-center gap-1.5 ml-auto">
          <Navigation className="size-3" />
          <span>Click any district to view details</span>
        </div>
      </div>

      {/* Map Canvas Card */}
      <div className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-950 via-zinc-900 to-black p-3 sm:p-6 shadow-2xl overflow-hidden min-h-[460px] flex items-center justify-center">
        {/* Subtle mesh background grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#10b98115_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-60" />

        {/* Floating Tooltip Indicator */}
        {tooltipData && (
          <div className="absolute top-4 left-4 z-20 pointer-events-none transition-all">
            <div className="px-3.5 py-2 rounded-2xl bg-black/85 backdrop-blur-xl border border-white/15 shadow-2xl flex items-center gap-3">
              <div
                className={`size-3 rounded-full ${
                  tooltipData.status === 'visited'
                    ? 'bg-emerald-500 shadow-md shadow-emerald-500/50'
                    : tooltipData.status === 'planned'
                    ? 'bg-amber-500 shadow-md shadow-amber-500/50'
                    : tooltipData.status === 'revisit_planned'
                    ? 'bg-violet-500 shadow-md shadow-violet-500/50'
                    : 'bg-zinc-600'
                }`}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-white">{tooltipData.name}</span>
                  <span className="text-xs text-white/50 font-serif">({tooltipData.bnName})</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-white/60 capitalize mt-0.5">
                  <span className="text-emerald-400 font-medium">{tooltipData.division} Division</span>
                  <span>•</span>
                  <span>{STATUS_FILL[tooltipData.status].label}</span>
                  {tooltipData.visitsCount > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-white font-mono">{tooltipData.visitsCount} visits</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SVG Map of Bangladesh (viewBox 700x880) */}
        <svg
          viewBox={BANGLADESH_MAP_VIEWBOX}
          role="img"
          aria-label="Interactive Map of the 64 districts of Bangladesh"
          className="mx-auto h-auto max-h-[580px] w-full max-w-[620px] filter drop-shadow-[0_12px_28px_rgba(0,0,0,0.6)] cursor-pointer"
        >
          <g>
            {MAP_PATHS_LIST.map((item) => {
              const district = districtMap.get(item.code);
              const status = district?.status || 'not_visited';
              const isSelected = selectedCode === item.code;
              const isHovered = hoveredCode === item.code;
              const style = STATUS_FILL[status];

              return (
                <path
                  key={item.code}
                  id={item.mapIdentifier}
                  data-code={item.code}
                  d={item.d}
                  tabIndex={0}
                  role="button"
                  aria-label={`${item.name}, ${item.bnName}, ${style.label}`}
                  onClick={() => {
                    if (district) onSelectDistrict(district);
                  }}
                  onMouseEnter={() => {
                    if (setExternalHovered) setExternalHovered(item.code);
                    else setInternalHoveredCode(item.code);
                  }}
                  onMouseLeave={() => {
                    if (setExternalHovered) setExternalHovered(null);
                    else setInternalHoveredCode(null);
                  }}
                  className={`transition-all duration-150 cursor-pointer ${style.normal} ${style.hover} ${
                    isSelected
                      ? 'stroke-white stroke-[3.5] drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]'
                      : isHovered
                      ? 'stroke-white/90 stroke-[2.5] drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]'
                      : 'stroke-zinc-950/70 stroke-[1.2]'
                  }`}
                />
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
};
