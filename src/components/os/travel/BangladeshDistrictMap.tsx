'use client';

import React, { useMemo, useState, useCallback } from 'react';
import {
  BANGLADESH_MAP_PATHS,
  BANGLADESH_MAP_VIEWBOX,
  DistrictPathData,
} from '@/lib/travel/bangladesh-map-paths';
import type { DistrictCode } from '@/lib/travel/bangladesh-districts';
import type { DistrictTravelData, DistrictTravelStatus } from '@/types/travel.types';
import { Navigation, ZoomIn, ZoomOut, RotateCcw, Compass, MapPin } from 'lucide-react';

const STATUS_FILL: Record<
  DistrictTravelStatus,
  { normal: string; hover: string; stroke: string; label: string; badgeBg: string; text: string }
> = {
  visited: {
    normal: 'fill-emerald-500',
    hover: 'hover:fill-emerald-400',
    stroke: '#10b981',
    label: 'Visited',
    badgeBg: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
    text: 'text-emerald-400',
  },
  planned: {
    normal: 'fill-amber-500',
    hover: 'hover:fill-amber-400',
    stroke: '#f59e0b',
    label: 'Wishlist / Planned',
    badgeBg: 'bg-amber-500/20 border-amber-500/30 text-amber-300',
    text: 'text-amber-400',
  },
  revisit_planned: {
    normal: 'fill-violet-500',
    hover: 'hover:fill-violet-400',
    stroke: '#8b5cf6',
    label: 'Revisit Planned',
    badgeBg: 'bg-violet-500/20 border-violet-500/30 text-violet-300',
    text: 'text-violet-400',
  },
  not_visited: {
    normal: 'fill-zinc-800',
    hover: 'hover:fill-zinc-700',
    stroke: '#3f3f46',
    label: 'Unexplored',
    badgeBg: 'bg-zinc-800/60 border-zinc-700/40 text-zinc-400',
    text: 'text-zinc-400',
  },
};

const MAP_PATHS_LIST = Object.values(BANGLADESH_MAP_PATHS);

// Memoized Individual District Path (skips re-rendering 62 untouched districts on hover)
interface DistrictPathProps {
  item: DistrictPathData;
  status: DistrictTravelStatus;
  isSelected: boolean;
  isHovered: boolean;
  district?: DistrictTravelData;
  onSelect: (district: DistrictTravelData) => void;
  onHoverEnter: (code: DistrictCode) => void;
  onHoverLeave: () => void;
}

const DistrictPath = React.memo(
  ({
    item,
    status,
    isSelected,
    isHovered,
    district,
    onSelect,
    onHoverEnter,
    onHoverLeave,
  }: DistrictPathProps) => {
    const style = STATUS_FILL[status];

    const handleClick = useCallback(() => {
      if (district) {
        onSelect(district);
      }
    }, [district, onSelect]);

    const handlePointerEnter = useCallback(() => {
      onHoverEnter(item.code);
    }, [item.code, onHoverEnter]);

    return (
      <path
        id={item.mapIdentifier}
        data-code={item.code}
        d={item.d}
        role="button"
        vectorEffect="non-scaling-stroke"
        aria-label={`${item.name}, ${item.bnName}, ${style.label}`}
        onClick={handleClick}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={onHoverLeave}
        className={`transition-colors duration-100 cursor-pointer ${style.normal} ${style.hover} ${
          isSelected
            ? 'stroke-white stroke-[3] fill-emerald-400'
            : isHovered
            ? 'stroke-white stroke-[2.2] brightness-125'
            : 'stroke-zinc-950/90 stroke-[1.2]'
        }`}
      />
    );
  },
  (prev, next) =>
    prev.item.code === next.item.code &&
    prev.status === next.status &&
    prev.isSelected === next.isSelected &&
    prev.isHovered === next.isHovered &&
    prev.district === next.district &&
    prev.onSelect === next.onSelect &&
    prev.onHoverEnter === next.onHoverEnter &&
    prev.onHoverLeave === next.onHoverLeave
);

DistrictPath.displayName = 'DistrictPath';

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
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const hoveredCode = externalHoveredCode !== undefined ? externalHoveredCode : internalHoveredCode;

  const districtMap = useMemo(() => {
    const map = new Map<DistrictCode, DistrictTravelData>();
    for (const d of districts) {
      map.set(d.code, d);
    }
    return map;
  }, [districts]);

  // Purely hover-driven HUD inspector (selected district on right panel is completely independent)
  const activeHoveredDistrict = hoveredCode ? districtMap.get(hoveredCode) : null;

  // Selected district centroid for smooth zoom focus
  const selectedCentroid = useMemo(() => {
    if (zoomLevel > 1 && selectedCode && BANGLADESH_MAP_PATHS[selectedCode]) {
      return BANGLADESH_MAP_PATHS[selectedCode].centroid;
    }
    return [350, 440] as const;
  }, [selectedCode, zoomLevel]);

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

  const handleZoomIn = () => {
    setZoomLevel((z) => Math.min(2.2, Number((z + 0.3).toFixed(1))));
  };

  const handleZoomOut = () => {
    setZoomLevel((z) => Math.max(1, Number((z - 0.3).toFixed(1))));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  // Pointer event callbacks (stable references for memoized DistrictPath)
  const handleHoverEnter = useCallback(
    (code: DistrictCode) => {
      if (setExternalHovered) {
        setExternalHovered(code);
      } else {
        setInternalHoveredCode(code);
      }
    },
    [setExternalHovered]
  );

  const handleHoverLeave = useCallback(() => {
    if (setExternalHovered) {
      setExternalHovered(null);
    } else {
      setInternalHoveredCode(null);
    }
  }, [setExternalHovered]);

  return (
    <div className="space-y-3.5 select-none">
      {/* 
        FIX 1 & 2: Fixed-height HUD Inspector Bar (Exact 68px height)
        Never changes height or mounts/unmounts, preventing any vertical layout shift.
        Placeholder and active hovered district both exist permanently, toggled via opacity.
      */}
      <div className="relative h-[68px] min-h-[68px] max-h-[68px] rounded-2xl bg-zinc-900/80 border border-white/10 backdrop-blur-xl shadow-xl overflow-hidden">
        {/* Layer 1: Placeholder State (Visible when nothing is hovered) */}
        <div
          className={`absolute inset-0 px-4 flex items-center justify-between transition-opacity duration-150 pointer-events-none ${
            activeHoveredDistrict ? 'opacity-0 invisible' : 'opacity-100 visible'
          }`}
        >
          <div className="flex items-center gap-3 text-white/50 text-xs min-w-0">
            <Compass className="size-4 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-white/80 truncate">Interactive 64 Districts Canvas</p>
              <p className="text-[11px] text-white/40 truncate">
                Hover a district to inspect details • Click to view records
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-lg bg-white/5 text-white/40 border border-white/5 shrink-0 hidden sm:inline">
            Mercator BD-ADM2
          </span>
        </div>

        {/* Layer 2: Active Hovered District State (Visible when district is hovered) */}
        <div
          className={`absolute inset-0 px-4 flex items-center justify-between transition-opacity duration-150 ${
            activeHoveredDistrict ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span
              className={`size-3.5 rounded-full shrink-0 shadow-md ${
                activeHoveredDistrict?.status === 'visited'
                  ? 'bg-emerald-400 shadow-emerald-400/80 ring-2 ring-emerald-500/30'
                  : activeHoveredDistrict?.status === 'planned'
                  ? 'bg-amber-400 shadow-amber-400/80 ring-2 ring-amber-500/30'
                  : activeHoveredDistrict?.status === 'revisit_planned'
                  ? 'bg-violet-400 shadow-violet-400/80 ring-2 ring-violet-500/30'
                  : 'bg-zinc-600'
              }`}
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-nowrap truncate">
                <span className="font-black text-white text-base sm:text-lg tracking-tight truncate">
                  {activeHoveredDistrict?.name || ''}
                </span>
                <span className="font-serif text-emerald-400 font-bold text-sm sm:text-base shrink-0">
                  ({activeHoveredDistrict?.bnName || ''})
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-white/10 text-white/70 shrink-0">
                  {activeHoveredDistrict?.code ? activeHoveredDistrict.code.toUpperCase() : ''}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-white/60 truncate mt-0.5">
                <span className="text-emerald-300 font-medium capitalize shrink-0">
                  {activeHoveredDistrict?.division || ''} Division
                </span>
                <span>•</span>
                <span className="shrink-0">
                  {activeHoveredDistrict ? STATUS_FILL[activeHoveredDistrict.status].label : ''}
                </span>
                {(activeHoveredDistrict?.visitsCount ?? 0) > 0 && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-white font-medium shrink-0">
                      {activeHoveredDistrict?.visitsCount}{' '}
                      {activeHoveredDistrict?.visitsCount === 1 ? 'visit' : 'visits'}
                    </span>
                  </>
                )}
                {activeHoveredDistrict?.rating ? (
                  <>
                    <span>•</span>
                    <span className="text-amber-400 font-medium shrink-0">
                      ★ {activeHoveredDistrict.rating}/5
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div className="shrink-0 pl-3 hidden sm:block">
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
              Click to Open Details
            </span>
          </div>
        </div>
      </div>

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
      <div className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-950 via-zinc-900 to-black p-4 sm:p-6 shadow-2xl overflow-hidden min-h-[680px] sm:min-h-[760px] flex flex-col items-center justify-center">
        {/* Subtle mesh background grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#10b98115_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-60" />

        {/* Floating Interactive Zoom Controls in Bottom Right */}
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1 p-1 rounded-2xl bg-black/80 border border-white/10 backdrop-blur-xl shadow-xl">
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 2.2}
            title="Zoom In"
            className="size-8 rounded-xl bg-white/5 hover:bg-white/15 disabled:opacity-40 text-white grid place-items-center transition-colors cursor-pointer"
          >
            <ZoomIn className="size-4" />
          </button>

          <span className="px-2 text-[11px] font-mono text-white/60">
            {zoomLevel.toFixed(1)}x
          </span>

          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 1}
            title="Zoom Out"
            className="size-8 rounded-xl bg-white/5 hover:bg-white/15 disabled:opacity-40 text-white grid place-items-center transition-colors cursor-pointer"
          >
            <ZoomOut className="size-4" />
          </button>

          {zoomLevel > 1 && (
            <button
              type="button"
              onClick={handleResetZoom}
              title="Reset Zoom"
              className="size-8 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 grid place-items-center transition-colors cursor-pointer ml-0.5"
            >
              <RotateCcw className="size-3.5" />
            </button>
          )}
        </div>

        {/* Floating Quick Hint Pin in Bottom Left */}
        <div className="absolute bottom-4 left-4 z-20 pointer-events-none hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md text-[11px] text-white/50 font-mono">
          <MapPin className="size-3 text-emerald-400" />
          <span>Mercator ADM2 64-District Projection</span>
        </div>

        {/* SVG Map of Bangladesh (viewBox 0 0 700 880) - 100% full bounds visible */}
        <div className="w-full flex-1 flex items-center justify-center p-2 sm:p-4">
          <svg
            viewBox={BANGLADESH_MAP_VIEWBOX}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Interactive Map of the 64 districts of Bangladesh"
            className="w-full h-auto max-w-[500px] sm:max-w-[540px] max-h-[740px] mx-auto block cursor-pointer transition-transform duration-300 select-none"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: `${selectedCentroid[0]}px ${selectedCentroid[1]}px`,
            }}
          >
            <g>
              {MAP_PATHS_LIST.map((item) => {
                const district = districtMap.get(item.code);
                const status = district?.status || 'not_visited';
                const isSelected = selectedCode === item.code;
                const isHovered = hoveredCode === item.code;

                return (
                  <DistrictPath
                    key={item.code}
                    item={item}
                    status={status}
                    isSelected={isSelected}
                    isHovered={isHovered}
                    district={district}
                    onSelect={onSelectDistrict}
                    onHoverEnter={handleHoverEnter}
                    onHoverLeave={handleHoverLeave}
                  />
                );
              })}
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};
