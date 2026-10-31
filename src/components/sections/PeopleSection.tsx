'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import {
  Users,
  ChevronLeft,
  ChevronRight,
  Globe,
  ArrowUpRight,
} from 'lucide-react';
import { peopleData } from '@/data/profile';
import {
  GitHubIcon,
  XIcon,
  LinkedInIcon,
  FacebookIcon,
  YouTubeIcon,
  VerifiedBadgeIcon,
} from '@/components/ui/Icons';

type PlatformFilter = 'all' | 'github' | 'x' | 'linkedin' | 'facebook' | 'website' | 'youtube';

export const PeopleSection: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<PlatformFilter>('all');
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const filterTabs: { id: PlatformFilter; label: string; count: number; icon?: React.ReactNode }[] = [
    { id: 'all', label: 'All', count: peopleData.length },
    { id: 'github', label: 'GitHub', count: 9, icon: <GitHubIcon className="size-3.5" /> },
    { id: 'x', label: 'X', count: 8, icon: <XIcon className="size-3" /> },
    { id: 'linkedin', label: 'LinkedIn', count: 6, icon: <LinkedInIcon className="size-3.5" /> },
    { id: 'facebook', label: 'Facebook', count: 5, icon: <FacebookIcon className="size-3.5" /> },
    { id: 'website', label: 'Website', count: 4, icon: <Globe className="size-3.5" /> },
    { id: 'youtube', label: 'YouTube', count: 2, icon: <YouTubeIcon className="size-3.5 text-red-500" /> },
  ];

  const filteredPeople = peopleData.filter((person) => {
    if (activeFilter === 'all') return true;
    return person.platforms.some((p) => p.platform === activeFilter);
  });

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  const renderPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'x':
        return <XIcon className="size-3.5" />;
      case 'github':
        return <GitHubIcon className="size-3.5" />;
      case 'linkedin':
        return <LinkedInIcon className="size-3.5" />;
      case 'facebook':
        return <FacebookIcon className="size-3.5" />;
      case 'youtube':
        return <YouTubeIcon className="size-3.5" />;
      case 'website':
      default:
        return <Globe className="size-3.5" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Hero Banner Card (Images 2 & 3) */}
      <div className="rounded-[28px] p-6 sm:p-7 bg-gradient-to-br from-emerald-100/70 via-teal-50/40 to-emerald-50/30 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-900/10 border border-emerald-500/20 shadow-xs relative overflow-hidden">
        {/* Avatar Stack */}
        <div className="flex items-center -space-x-2">
          {peopleData.slice(0, 5).map((person) => (
            <div
              key={person.id}
              className="size-9 rounded-full ring-2 ring-white dark:ring-zinc-900 overflow-hidden shrink-0 shadow-xs"
            >
              <Image
                src={person.avatar_url}
                alt={person.name}
                width={36}
                height={36}
                className="size-full object-cover"
                unoptimized
              />
            </div>
          ))}
          <span className="grid size-9 place-items-center rounded-full bg-white dark:bg-zinc-800 text-xs font-semibold text-ink ring-2 ring-white dark:ring-zinc-900 shadow-xs">
            +5
          </span>
        </div>

        <h2 className="mt-5 text-xl font-bold tracking-tight text-ink">
          People I learn from
        </h2>
        <p className="mt-1.5 text-sm text-ink-2 leading-relaxed max-w-xl">
          Builders, founders and teachers whose work keeps me sharp. Filter by where I follow them, and follow them too.
        </p>

        <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <Users className="size-4" />
          <span>{peopleData.length} people · 6 platforms</span>
        </div>
      </div>

      {/* 2. Platform Filter Pill Tabs with Left/Right Arrows */}
      <div className="relative flex items-center gap-2">
        <button
          type="button"
          onClick={scrollLeft}
          aria-label="Scroll filters left"
          className="size-8 rounded-full border border-line bg-surface hover:bg-surface-2 grid place-items-center shrink-0 text-ink-2 hover:text-ink cursor-pointer transition-colors"
        >
          <ChevronLeft className="size-4" />
        </button>

        <div
          ref={scrollContainerRef}
          className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] py-1"
        >
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                    : 'bg-surface border border-line text-ink-2 hover:bg-surface-2 hover:text-ink'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span className="opacity-75">{tab.count}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={scrollRight}
          aria-label="Scroll filters right"
          className="size-8 rounded-full border border-line bg-surface hover:bg-surface-2 grid place-items-center shrink-0 text-ink-2 hover:text-ink cursor-pointer transition-colors"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* 3. Sub-counter title */}
      <div>
        <p className="text-xs font-semibold text-ink-3">
          {activeFilter === 'all'
            ? `All ${peopleData.length} people`
            : `${filteredPeople.length} ${filteredPeople.length === 1 ? 'person' : 'people'} I follow on ${filterTabs.find((t) => t.id === activeFilter)?.label}`}
        </p>
      </div>

      {/* 4. People Cards List */}
      <div className="space-y-4">
        {filteredPeople.map((person) => {
          return (
            <div
              key={person.id}
              className="rounded-[24px] border border-line bg-surface p-5 sm:p-6 transition-all duration-200 hover:border-line-strong shadow-xs"
            >
              {/* Top Row: Avatar, Name, Handle, Follow Button */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative size-11 rounded-full shrink-0">
                    <Image
                      src={person.avatar_url}
                      alt={person.name}
                      width={44}
                      height={44}
                      className="size-11 rounded-full object-cover ring-1 ring-line"
                      unoptimized
                    />
                    <span className="absolute -bottom-1 -right-1 grid size-4.5 place-items-center rounded-full bg-surface border border-line shadow-xs">
                      {renderPlatformIcon(person.primaryPlatform)}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <h3 className="flex items-center gap-1.5 text-base font-bold text-ink truncate">
                      <span>{person.name}</span>
                      {person.verified && (
                        <VerifiedBadgeIcon className="size-4 text-emerald-500 shrink-0" />
                      )}
                    </h3>
                    <p className="text-xs text-ink-3 mt-0.5 truncate">
                      {person.primaryHandle} · {person.primaryPlatform.toUpperCase()}
                    </p>
                  </div>
                </div>

                <a
                  href={person.primaryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary h-8 px-3.5 rounded-[12px] text-xs font-semibold shrink-0 inline-flex items-center gap-1"
                >
                  <span>Follow</span>
                  <ArrowUpRight className="size-3.5" />
                </a>
              </div>

              {/* Role / Bio */}
              <p className="mt-3.5 text-sm leading-relaxed text-ink-2">
                {person.role}
              </p>

              {/* Personal Quote */}
              {person.quote && (
                <div className="mt-3 text-xs italic text-ink-3 pl-3 border-l-2 border-emerald-500/40 leading-relaxed">
                  &ldquo;{person.quote}&rdquo;
                </div>
              )}

              {/* Bottom Row: Tags & Platform Links */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-line/60">
                {/* Topic Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {person.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-surface-2 px-2 py-0.5 text-xs font-medium text-ink-3"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Platforms Icons Row */}
                <div className="flex items-center gap-3 text-ink-3 ml-auto">
                  {person.platforms.map((p) => (
                    <a
                      key={p.platform}
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${person.name} on ${p.platform}`}
                      className="hover:text-ink transition-colors"
                    >
                      {renderPlatformIcon(p.platform)}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
