'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, ArrowRight, CornerDownLeft, Sparkles, ExternalLink } from 'lucide-react';
import { ZahidOsAppId, ShortLink } from '@/types/os';

export interface SpotlightAppItem {
  id: ZahidOsAppId;
  name: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  badge?: string;
}

interface ZosSpotlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  apps: SpotlightAppItem[];
  links: ShortLink[];
  onLaunchApp: (appId: ZahidOsAppId) => void;
}

export const ZosSpotlightModal: React.FC<ZosSpotlightModalProps> = ({
  isOpen,
  onClose,
  apps,
  links,
  onLaunchApp,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Filtered Apps
  const filteredApps = useMemo(() => {
    if (!query.trim()) return apps;
    const q = query.toLowerCase().trim();
    return apps.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.subtitle.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q)
    );
  }, [apps, query]);

  // Filtered Links
  const filteredLinks = useMemo(() => {
    if (!query.trim()) return links.slice(0, 4);
    const q = query.toLowerCase().trim();
    return links.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.slug.toLowerCase().includes(q) ||
        (l.description && l.description.toLowerCase().includes(q))
    ).slice(0, 6);
  }, [links, query]);

  const totalResults = filteredApps.length + filteredLinks.length;

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (totalResults > 0 ? (prev + 1) % totalResults : 0));
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (totalResults > 0 ? (prev - 1 + totalResults) % totalResults : 0));
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex < filteredApps.length) {
          const app = filteredApps[selectedIndex];
          if (app) {
            onLaunchApp(app.id);
            onClose();
          }
        } else {
          const linkIndex = selectedIndex - filteredApps.length;
          const link = filteredLinks[linkIndex];
          if (link) {
            window.open(`/s/${link.slug}`, '_blank', 'noopener,noreferrer');
            onClose();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, totalResults, filteredApps, filteredLinks, onLaunchApp, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150 select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-white/20 bg-zinc-950/90 p-3 shadow-2xl shadow-black/80 backdrop-blur-2xl space-y-3 animate-in zoom-in-95 duration-150 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-24 bg-emerald-500/20 blur-2xl rounded-full pointer-events-none"
          aria-hidden="true"
        />

        {/* Search Input Bar */}
        <div className="relative flex items-center px-3 py-2 border-b border-white/10">
          <Search className="size-4 text-emerald-400 shrink-0 mr-2.5" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search active tools, shortcuts, links..."
            className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-hidden font-medium"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="size-5 rounded-md hover:bg-white/10 grid place-items-center text-white/50 hover:text-white cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          ) : (
            <kbd className="px-1.5 py-0.5 rounded-md bg-white/10 border border-white/15 text-[10px] font-mono text-white/60">
              ESC
            </kbd>
          )}
        </div>

        {/* Results Body */}
        <div className="max-h-80 overflow-y-auto space-y-3 px-1 py-1 [scrollbar-width:thin]">
          {/* Applications Section */}
          {filteredApps.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 text-[10px] font-mono uppercase tracking-wider text-emerald-400/80 font-bold flex items-center justify-between">
                <span>Active Tools &amp; Micro-Apps</span>
                <span>{filteredApps.length}</span>
              </div>
              <div className="space-y-1">
                {filteredApps.map((app, idx) => {
                  const Icon = app.icon;
                  const isSelected = selectedIndex === idx;
                  return (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => {
                        onLaunchApp(app.id);
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full p-2 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500/15 border border-emerald-500/30 text-white'
                          : 'hover:bg-white/5 text-white/80 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`size-8 rounded-lg bg-gradient-to-br ${app.gradient} grid place-items-center text-white shrink-0 shadow-sm border border-white/20`}
                        >
                          <Icon className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white block truncate leading-tight">
                            {app.name}
                          </span>
                          <span className="text-[10px] text-white/50 block truncate">
                            {app.subtitle}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {app.badge && (
                          <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-emerald-300 font-mono text-[9px] border border-white/10">
                            {app.badge}
                          </span>
                        )}
                        {isSelected && (
                          <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                            <span>Open</span>
                            <CornerDownLeft className="size-3" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Short Links Section */}
          {filteredLinks.length > 0 && (
            <div className="space-y-1 pt-1 border-t border-white/10">
              <div className="px-2 text-[10px] font-mono uppercase tracking-wider text-cyan-400/80 font-bold flex items-center justify-between">
                <span>Verified Shortcuts</span>
                <span>{filteredLinks.length}</span>
              </div>
              <div className="space-y-1">
                {filteredLinks.map((link, idx) => {
                  const globalIdx = filteredApps.length + idx;
                  const isSelected = selectedIndex === globalIdx;
                  return (
                    <a
                      key={link.id}
                      href={`/s/${link.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onClose()}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`w-full p-2 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500/15 border border-cyan-500/30 text-white'
                          : 'hover:bg-white/5 text-white/80 border border-transparent'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-white truncate block">
                            {link.title}
                          </span>
                          <ExternalLink className="size-3 text-cyan-400 shrink-0" />
                        </div>
                        <span className="text-[10px] font-mono text-cyan-300/80 block truncate">
                          /s/{link.slug}
                        </span>
                      </div>

                      {isSelected && (
                        <div className="flex items-center gap-1 text-[10px] font-mono text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-md shrink-0">
                          <span>Visit</span>
                          <ArrowRight className="size-3" />
                        </div>
                      )}
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {totalResults === 0 && (
            <div className="py-8 text-center space-y-1.5">
              <p className="text-xs font-semibold text-white/70">No matching tools or links found</p>
              <p className="text-[11px] text-white/40">Try searching for &quot;Shortener&quot;, &quot;Travel&quot;, or &quot;API&quot;</p>
            </div>
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="flex items-center justify-between px-3 pt-2 border-t border-white/10 text-[10px] text-white/40 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
            <span>ESC to close</span>
          </div>
          <span className="text-emerald-400/80 flex items-center gap-1">
            <Sparkles className="size-3" />
            <span>Spotlight 18</span>
          </span>
        </div>
      </div>
    </div>
  );
};
