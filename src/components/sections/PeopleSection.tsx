'use client';

import React, { useState, useRef, useMemo } from 'react';
import Image from 'next/image';
import {
  Users,
  ChevronLeft,
  ChevronRight,
  Globe,
  ArrowUpRight,
  Quote as QuoteIcon,
} from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';
import { defaultRecommendedPeople } from '@/data/default-people';
import { FollowerRecommendation } from '@/types/profile';
import {
  GitHubIcon,
  XIcon,
  LinkedInIcon,
  FacebookIcon,
  YouTubeIcon,
} from '@/components/ui/Icons';

type PlatformFilter = 'all' | 'github' | 'x' | 'linkedin' | 'facebook' | 'website' | 'youtube';

export const PeopleSection: React.FC = () => {
  const { content } = usePortfolio();
  const [activeFilter, setActiveFilter] = useState<PlatformFilter>('all');
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // 1. Gather raw people list and normalize fields
  const people: FollowerRecommendation[] = useMemo(() => {
    const rawList =
      content.suggestedPeople && content.suggestedPeople.length > 0
        ? content.suggestedPeople
        : defaultRecommendedPeople;

    return rawList.map((p, idx) => {
      const primaryPlatform =
        p.primaryPlatform ||
        (p.url?.includes('github.com')
          ? 'github'
          : p.url?.includes('youtube.com')
          ? 'youtube'
          : p.url?.includes('linkedin.com')
          ? 'linkedin'
          : p.url?.includes('facebook.com')
          ? 'facebook'
          : 'x');

      const primaryUrl = p.primaryUrl || p.url || '#';
      const handleClean = p.primaryHandle || (p.handle ? (p.handle.startsWith('@') ? p.handle : `@${p.handle}`) : `@creator${idx + 1}`);

      // Ensure platforms list has at least the primary platform
      const platforms =
        p.platforms && p.platforms.length > 0
          ? p.platforms
          : [{ platform: primaryPlatform, url: primaryUrl }];

      return {
        ...p,
        primaryPlatform,
        primaryUrl,
        primaryHandle: handleClean,
        platforms,
      };
    });
  }, [content.suggestedPeople]);

  // Compute unique platforms count across all people
  const uniquePlatformsCount = useMemo(() => {
    const set = new Set<string>();
    people.forEach((p) => {
      p.platforms?.forEach((pl) => set.add(pl.platform));
    });
    return Math.max(set.size, 1);
  }, [people]);

  // Dynamic filter tabs with calculated live counts
  const filterTabs: { id: PlatformFilter; label: string; count: number; icon?: React.ReactNode }[] = useMemo(() => {
    const githubCount = people.filter((p) => p.platforms?.some((pl) => pl.platform === 'github')).length;
    const xCount = people.filter((p) => p.platforms?.some((pl) => pl.platform === 'x')).length;
    const linkedinCount = people.filter((p) => p.platforms?.some((pl) => pl.platform === 'linkedin')).length;
    const facebookCount = people.filter((p) => p.platforms?.some((pl) => pl.platform === 'facebook')).length;
    const websiteCount = people.filter((p) => p.platforms?.some((pl) => pl.platform === 'website')).length;
    const youtubeCount = people.filter((p) => p.platforms?.some((pl) => pl.platform === 'youtube')).length;

    const tabs: { id: PlatformFilter; label: string; count: number; icon?: React.ReactNode }[] = [
      { id: 'all', label: 'All', count: people.length },
      { id: 'github', label: 'GitHub', count: githubCount, icon: <GitHubIcon className="size-3.5" /> },
      { id: 'x', label: 'X', count: xCount, icon: <XIcon className="size-3" /> },
      { id: 'linkedin', label: 'LinkedIn', count: linkedinCount, icon: <LinkedInIcon className="size-3.5" /> },
      { id: 'facebook', label: 'Facebook', count: facebookCount, icon: <FacebookIcon className="size-3.5" /> },
      { id: 'website', label: 'Website', count: websiteCount, icon: <Globe className="size-3.5" /> },
    ];

    if (youtubeCount > 0) {
      tabs.push({
        id: 'youtube',
        label: 'YouTube',
        count: youtubeCount,
        icon: <YouTubeIcon className="size-3.5 text-red-500" />,
      });
    }

    return tabs;
  }, [people]);

  // Filtered people according to active pill
  const filteredPeople = useMemo(() => {
    if (activeFilter === 'all') return people;
    return people.filter((p) => p.platforms?.some((pl) => pl.platform === activeFilter));
  }, [people, activeFilter]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -220, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 220, behavior: 'smooth' });
    }
  };

  const renderPlatformIcon = (platform: string, className = 'size-3.5') => {
    switch (platform) {
      case 'x':
        return <XIcon className={className} />;
      case 'github':
        return <GitHubIcon className={className} />;
      case 'linkedin':
        return <LinkedInIcon className={className} />;
      case 'facebook':
        return <FacebookIcon className={className} />;
      case 'youtube':
        return <YouTubeIcon className={`${className} text-red-500`} />;
      case 'website':
      default:
        return <Globe className={className} />;
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Hero Banner Card */}
      <div className="rounded-[28px] p-6 sm:p-7 bg-gradient-to-br from-emerald-100/70 via-teal-50/40 to-emerald-50/30 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-900/10 border border-emerald-500/20 shadow-xs relative overflow-hidden">
        {/* Avatar Stack Facepile */}
        <div className="flex items-center -space-x-2">
          {people.slice(0, 5).map((person) => (
            <div
              key={person.id}
              className="size-9 rounded-full ring-2 ring-white dark:ring-zinc-900 overflow-hidden shrink-0 shadow-xs bg-surface"
            >
              <Image
                src={person.avatar_url || '/images/avatar.webp'}
                alt={person.name}
                width={36}
                height={36}
                className="size-full object-cover"
                unoptimized
              />
            </div>
          ))}
          {people.length > 5 && (
            <span className="grid size-9 place-items-center rounded-full bg-white dark:bg-zinc-800 text-xs font-bold text-ink ring-2 ring-white dark:ring-zinc-900 shadow-xs">
              +{people.length - 5}
            </span>
          )}
        </div>

        <h2 className="mt-5 text-xl font-bold tracking-tight text-ink">
          People I learn from
        </h2>
        <p className="mt-1.5 text-sm text-ink-2 leading-relaxed max-w-xl">
          Builders, founders and teachers whose work keeps me sharp. Filter by where I follow them, and follow them too.
        </p>

        <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <Users className="size-4" />
          <span>
            {people.length} {people.length === 1 ? 'person' : 'people'} · {uniquePlatformsCount} platforms
          </span>
        </div>
      </div>

      {/* 2. Platform Filter Pill Carousel Tabs */}
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

      {/* 3. Sub-counter label */}
      <div>
        <p className="text-xs font-semibold text-ink-3">
          {activeFilter === 'all'
            ? `All ${people.length} people`
            : `${filteredPeople.length} ${filteredPeople.length === 1 ? 'person' : 'people'} I follow on ${
                filterTabs.find((t) => t.id === activeFilter)?.label || activeFilter
              }`}
        </p>
      </div>

      {/* 4. Rich People Cards */}
      <div className="space-y-4">
        {filteredPeople.map((person) => {
          const followUrl = person.primaryUrl || person.url || '#';
          const primaryPlat = person.primaryPlatform || 'x';

          return (
            <div
              key={person.id}
              className="rounded-[24px] border border-line bg-surface p-5 sm:p-6 transition-all duration-200 hover:border-line-strong shadow-xs"
            >
              {/* Top Row: Avatar, Name, Handle, Follow Button */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Avatar with Platform Overlay Badge */}
                  <div className="relative size-11 rounded-full shrink-0">
                    <Image
                      src={person.avatar_url || '/images/avatar.webp'}
                      alt={person.name}
                      width={44}
                      height={44}
                      className="size-11 rounded-full object-cover ring-1 ring-line"
                      unoptimized
                    />
                    <span className="absolute -bottom-1 -right-1 grid size-4.5 place-items-center rounded-full bg-surface border border-line shadow-xs text-ink">
                      {renderPlatformIcon(primaryPlat, 'size-2.75')}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <h3 className="flex items-center gap-1.5 text-base font-bold text-ink truncate">
                      <span className="truncate">{person.name}</span>
                      {person.verified && (
                        <span
                          className="inline-flex items-center select-none text-emerald-500 text-sm shrink-0"
                          title="Verified mentor / builder"
                          aria-label="Verified"
                        >
                          💚
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-ink-3 mt-0.5 truncate">
                      {person.primaryHandle} · {primaryPlat.toUpperCase()}
                    </p>
                  </div>
                </div>

                <a
                  href={followUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary h-8 px-3.5 rounded-[12px] text-xs font-semibold shrink-0 inline-flex items-center gap-1 hover:border-brand-500/40"
                >
                  <span>Follow</span>
                  <ArrowUpRight className="size-3.5" />
                </a>
              </div>

              {/* Role / Headline */}
              {person.role && (
                <p className="mt-3.5 text-sm leading-relaxed text-ink-2">
                  {person.role}
                </p>
              )}

              {/* Personal Endorsement / Quote */}
              {person.quote && (
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-surface-2/40 px-3.5 py-2.5 text-xs text-ink-3 border-l-2 border-emerald-500 leading-relaxed">
                  <QuoteIcon className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="italic">{person.quote}</span>
                </div>
              )}

              {/* Bottom Row: Tags & Multi-Platform Links */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-line/60">
                {/* Topic Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {person.tags && person.tags.length > 0 ? (
                    person.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-surface-2 px-2.5 py-0.5 text-[11px] font-medium text-ink-3"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-ink-3/60 italic">Engineering & Product</span>
                  )}
                </div>

                {/* Platforms Icons Row */}
                <div className="flex items-center gap-3 text-ink-3 ml-auto">
                  {person.platforms &&
                    person.platforms.map((p, pIdx) => (
                      <a
                        key={`${p.platform}-${pIdx}`}
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${person.name} on ${p.platform}`}
                        className="hover:text-ink transition-colors"
                        title={`${person.name} on ${p.platform}`}
                      >
                        {renderPlatformIcon(p.platform, 'size-3.5')}
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
