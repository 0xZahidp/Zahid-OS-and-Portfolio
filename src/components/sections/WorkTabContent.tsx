'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  Layers,
  ArrowUpRight,
  GitFork,
  Tag,
  Calendar,
  Smile,
  Users,
  BookMarked,
  Activity,
} from 'lucide-react';
import { GitHubIcon } from '@/components/ui/Icons';
import { usePortfolio } from '@/context/PortfolioContext';

interface ContributionDay {
  date: string;
  count: number;
  level: number;
}

interface PinnedRepo {
  id: string;
  name: string;
  title: string;
  description: string;
  language: string;
  languageColor?: string;
  stars: number;
  forks?: number;
  url: string;
}

const DEFAULT_PINNED_REPOS: PinnedRepo[] = [
  {
    id: 'MyTapCard',
    name: '0xZahidp/MyTapCard',
    title: 'MyTapCard',
    description:
      'MyTapCard is an NFC-powered digital business card and profile-sharing platform. It allows users to create a personalized profile with links, contact details, and social media.',
    language: 'TypeScript',
    languageColor: '#3178c6',
    stars: 0,
    forks: 0,
    url: 'https://github.com/0xZahidp/MyTapCard',
  },
  {
    id: 'Orbit',
    name: '0xZahidp/Orbit',
    title: 'Orbit',
    description:
      'Shared plans, clearly managed - Manage memberships, recurring dues, payment approvals, reminders, and group history in one place.',
    language: 'TypeScript',
    languageColor: '#3178c6',
    stars: 0,
    forks: 0,
    url: 'https://github.com/0xZahidp/Orbit',
  },
  {
    id: 'GhuraFira',
    name: '0xZahidp/GhuraFira_Mobile_APP_Flutter',
    title: 'GhuraFira_Mobile_APP_Flutter',
    description:
      'GhuraFira - a smart travel companion app built with Flutter. Discover attractions, plan itineraries, and navigate with ease.',
    language: 'Dart',
    languageColor: '#00B4AB',
    stars: 0,
    forks: 0,
    url: 'https://github.com/0xZahidp/GhuraFira_Mobile_APP_Flutter',
  },
  {
    id: 'CompilerX',
    name: '0xZahidp/CompilerX',
    title: 'CompilerX',
    description:
      'A lightweight web-based online code compiler supporting multiple programming languages with instant stdout/stderr feedback.',
    language: 'JavaScript',
    languageColor: '#f1e05a',
    stars: 0,
    forks: 0,
    url: 'https://github.com/0xZahidp/CompilerX',
  },
];

interface WorkTabContentProps {
  onNavigateToProjects: () => void;
}

export const WorkTabContent: React.FC<WorkTabContentProps> = ({
  onNavigateToProjects,
}) => {
  const { content } = usePortfolio();
  const projectsData = content.projects;
  const [totalContributions, setTotalContributions] = useState<number>(102);
  const [totalRepos, setTotalRepos] = useState<number>(26);
  const [followersCount, setFollowersCount] = useState<number>(6);
  const [pinnedRepos, setPinnedRepos] = useState<PinnedRepo[]>(DEFAULT_PINNED_REPOS);
  const [liveWeeks, setLiveWeeks] = useState<ContributionDay[][] | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{
    day: ContributionDay;
    x: number;
    y: number;
  } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch live GitHub data from /api/github
  useEffect(() => {
    let isMounted = true;
    const fetchGitHubData = async () => {
      try {
        const res = await fetch('/api/github');
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;

        if (data.contributions?.total !== undefined) {
          setTotalContributions(data.contributions.total);
        }
        if (data.user?.public_repos !== undefined) {
          setTotalRepos(data.user.public_repos);
        }
        if (data.user?.followers !== undefined) {
          setFollowersCount(data.user.followers);
        }
        if (Array.isArray(data.repositories) && data.repositories.length > 0) {
          setPinnedRepos(data.repositories);
        }
        if (Array.isArray(data.contributions?.weeks) && data.contributions.weeks.length > 0) {
          const weekData: ContributionDay[][] = data.contributions.weeks.map(
            (w: { date?: string; count?: number; level: number }[]) =>
              w.map((d) => ({
                date: d.date || '',
                count: d.count || 0,
                level: d.level ?? 0,
              }))
          );
          setLiveWeeks(weekData);
        }
      } catch (err) {
        console.error('Error fetching live GitHub data:', err);
      }
    };

    fetchGitHubData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Generate realistic 53-week GitHub contribution heatmap fallback with dates
  const fallbackContributionWeeks = useMemo<ContributionDay[][]>(() => {
    const weeks: ContributionDay[][] = [];
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - (52 * 7 + today.getDay()));

    let seed = 42;
    const seededRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    for (let w = 0; w < 53; w++) {
      const days: ContributionDay[] = [];
      for (let d = 0; d < 7; d++) {
        const curDate = new Date(start);
        curDate.setDate(start.getDate() + (w * 7 + d));
        const dateStr = curDate.toISOString().split('T')[0];

        const rand = seededRandom();
        let level = 0;
        let count = 0;
        const intensityBoost = w > 36 ? 0.35 : w > 20 ? 0.2 : 0;
        const adjusted = rand - intensityBoost;

        if (adjusted < 0.2) {
          level = 4;
          count = Math.floor(rand * 10) + 14;
        } else if (adjusted < 0.4) {
          level = 3;
          count = Math.floor(rand * 6) + 7;
        } else if (adjusted < 0.65) {
          level = 2;
          count = Math.floor(rand * 3) + 3;
        } else if (adjusted < 0.85) {
          level = 1;
          count = Math.floor(rand * 2) + 1;
        } else {
          level = 0;
          count = 0;
        }

        days.push({ date: dateStr, count, level });
      }
      weeks.push(days);
    }
    return weeks;
  }, []);

  // Ensure displayedWeeks is always exactly 53 weeks (371 days)
  const displayedWeeks = useMemo(() => {
    const raw = liveWeeks && liveWeeks.length > 0 ? liveWeeks : fallbackContributionWeeks;
    if (raw.length === 53) return raw;
    if (raw.length > 53) return raw.slice(-53);
    // Pad start if fewer than 53 weeks
    const diff = 53 - raw.length;
    const padding: ContributionDay[][] = Array.from({ length: diff }, () =>
      Array.from({ length: 7 }, () => ({ date: '', count: 0, level: 0 }))
    );
    return [...padding, ...raw];
  }, [liveWeeks, fallbackContributionWeeks]);

  // Auto-scroll the heatmap to show the most recent weeks first on smaller screens
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [displayedWeeks]);

  // Compute month labels aligned with column indices across the 53 weeks
  const monthLabels = useMemo(() => {
    const list: { name: string; col: number }[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let lastMonth = -1;

    displayedWeeks.forEach((week, wIdx) => {
      if (!week || week.length === 0) return;
      const firstDay = week[0];
      if (!firstDay?.date) return;
      const d = new Date(firstDay.date + 'T00:00:00Z');
      if (!isNaN(d.getTime())) {
        const m = d.getUTCMonth();
        if (m !== lastMonth) {
          list.push({ name: monthNames[m], col: wIdx + 1 });
          lastMonth = m;
        }
      }
    });

    if (list.length === 0) {
      const currentMonthIdx = new Date().getMonth();
      for (let i = 11; i >= 0; i--) {
        const idx = (currentMonthIdx - i + 12) % 12;
        const col = Math.floor(((11 - i) * 52) / 12) + 1;
        list.push({ name: monthNames[idx], col });
      }
    }

    return list;
  }, [displayedWeeks]);

  // Always use authentic live metrics fetched directly from GitHub (no manual overrides)
  const effectiveContributions = totalContributions;
  const effectiveRepos = totalRepos;
  const effectiveFollowers = followersCount;
  const githubUsername = content.githubSettings?.username || '0xZahidp';
  const effectivePinnedRepos = useMemo(() => {
    if (content.githubSettings?.pinnedRepos && content.githubSettings.pinnedRepos.length > 0) {
      const selectedNames = content.githubSettings.pinnedRepos;
      const matched = pinnedRepos.filter((r) =>
        selectedNames.some(
          (n) => r.id.toLowerCase() === n.toLowerCase() || r.name.toLowerCase().includes(n.toLowerCase())
        )
      );
      if (matched.length > 0) return matched;
    }
    return pinnedRepos;
  }, [content.githubSettings?.pinnedRepos, pinnedRepos]);

  const renderRowIcon = (id: string) => {
    switch (id) {
      case 'proj-1': // Bidvers
        return (
          <div className="size-12 rounded-[16px] bg-black text-white font-extrabold text-xl grid place-items-center shrink-0 shadow-xs ring-1 ring-white/10">
            B
          </div>
        );
      case 'proj-2': // Learn Laravel
        return (
          <div className="size-12 rounded-[16px] bg-black text-white grid place-items-center shrink-0 shadow-xs ring-1 ring-white/10">
            <svg
              viewBox="0 0 40 40"
              className="size-7 text-[#FF2D20]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 5 L33 12.5 L33 27.5 L20 35 L7 27.5 L7 12.5 Z" />
              <path d="M20 5 L20 35" />
              <path d="M20 20 L33 12.5" />
              <path d="M20 20 L7 12.5" />
            </svg>
          </div>
        );
      case 'proj-3': // Invo
        return (
          <div className="size-12 rounded-[16px] bg-black text-white font-bold text-xs tracking-tight grid place-items-center shrink-0 shadow-xs ring-1 ring-white/10">
            Invo
          </div>
        );
      case 'proj-4': // Prompt Filler
        return (
          <div className="size-12 rounded-[16px] bg-black text-white font-mono font-bold text-sm grid place-items-center shrink-0 shadow-xs ring-1 ring-white/10">
            {'{ }'}
          </div>
        );
      case 'proj-5': // Year
        return (
          <div className="size-12 rounded-[16px] bg-black text-white grid place-items-center shrink-0 shadow-xs ring-1 ring-white/10">
            <Calendar className="size-6 text-white" />
          </div>
        );
      case 'proj-6': // Murad Takla
        return (
          <div className="size-12 rounded-[16px] bg-black text-white grid place-items-center shrink-0 shadow-xs ring-1 ring-white/10">
            <Smile className="size-6 text-white" />
          </div>
        );
      case 'proj-7': // KajKam
        return (
          <div className="size-12 rounded-[16px] bg-black text-white font-mono font-bold text-sm grid place-items-center shrink-0 shadow-xs ring-1 ring-white/10">
            0ō
          </div>
        );
      case 'proj-8': // Hatlar (VS Code)
      default:
        return (
          <div className="size-12 rounded-[16px] bg-black text-white grid place-items-center shrink-0 shadow-xs ring-1 ring-white/10">
            <svg viewBox="0 0 24 24" className="size-6 text-[#007ACC]" fill="currentColor">
              <path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .32 8.704L4.398 12 .32 15.296a1 1 0 0 0 .007 1.442l1.322 1.202a1 1 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="space-y-12">
      {/* 1. GitHub Contributions Heatmap & Pinned Repos */}
      <section aria-labelledby="github-section-heading">
        {/* Header & Quick Profile Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <GitHubIcon className="size-5 text-ink shrink-0" />
            <h2
              id="github-section-heading"
              className="text-lg font-semibold tracking-tight text-ink"
            >
              GitHub
            </h2>
            <a
              href={`https://github.com/${githubUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-ink-3 hover:text-ink transition-colors inline-flex items-center gap-1"
            >
              <span>@{githubUsername}</span>
              <ArrowUpRight className="size-3" />
            </a>
          </div>

          {/* Quick Metrics Badges: Followers, Repos, Contributions */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <a
              href={`https://github.com/${githubUsername}?tab=followers`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-surface-2 border border-line hover:border-line-strong text-ink hover:text-brand-500 transition-all font-medium"
              title="View GitHub Followers"
            >
              <Users className="size-3.5 text-ink-3" />
              <span><strong>{effectiveFollowers}</strong> followers</span>
            </a>

            <a
              href={`https://github.com/${githubUsername}?tab=repositories`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-surface-2 border border-line hover:border-line-strong text-ink hover:text-brand-500 transition-all font-medium"
              title="View Public Repositories"
            >
              <BookMarked className="size-3.5 text-ink-3" />
              <span><strong>{effectiveRepos}</strong> repos</span>
            </a>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
              <Activity className="size-3.5" />
              <span><strong>{effectiveContributions.toLocaleString()}</strong> contributions</span>
            </span>
          </div>
        </div>

        {/* Summary text - Muted gray with uniform weight */}
        <p className="mt-2 mb-4 text-body text-ink-3 font-normal">
          {effectiveContributions.toLocaleString()} contributions in the last year
        </p>

        {/* Heatmap Card Wrapper (.card-raised) */}
        <div className="card-raised relative rounded-3xl border border-line bg-surface p-6 sm:p-7 shadow-xs">
          {/* Scroll container for responsiveness */}
          <div
            ref={scrollRef}
            className="overflow-x-auto pb-1 [scrollbar-width:thin] sm:overflow-visible sm:pb-0"
          >
            <div className="w-[686px] min-w-[686px]">
              {/* Month Labels Grid */}
              <div
                className="grid gap-[3px] mb-2.5 text-micro text-ink-3 font-normal select-none"
                style={{
                  gridTemplateColumns: 'repeat(53, 10px)',
                }}
              >
                {monthLabels.map((m) => (
                  <span
                    key={`${m.name}-${m.col}`}
                    className="whitespace-nowrap overflow-visible"
                    style={{ gridColumnStart: m.col }}
                  >
                    {m.name}
                  </span>
                ))}
              </div>

              {/* Cells Grid (53 columns x 7 rows) */}
              <div
                className="grid grid-flow-col gap-[3px] h-[88px]"
                style={{
                  gridTemplateColumns: 'repeat(53, 10px)',
                  gridTemplateRows: 'repeat(7, 10px)',
                }}
                role="img"
                aria-label={`${effectiveContributions} GitHub contributions in the last year`}
              >
                {displayedWeeks.flatMap((week, wIdx) =>
                  week.map((day, dIdx) => {
                    let bgClass = 'bg-graph-0';
                    if (day.level === 1) bgClass = 'bg-graph-1 ring-1 ring-black/5 dark:ring-white/10';
                    else if (day.level === 2) bgClass = 'bg-graph-2 ring-1 ring-black/5 dark:ring-white/10';
                    else if (day.level === 3) bgClass = 'bg-graph-3 ring-1 ring-black/5 dark:ring-white/10';
                    else if (day.level === 4) bgClass = 'bg-graph-4 ring-1 ring-black/5 dark:ring-white/10';

                    const formattedDate = day.date
                      ? new Date(day.date + 'T00:00:00Z').toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          timeZone: 'UTC',
                        })
                      : '';
                    const tooltipText = day.count === 0
                      ? `No contributions on ${formattedDate}`
                      : `${day.count} contribution${day.count === 1 ? '' : 's'} on ${formattedDate}`;

                    return (
                      <span
                        key={`${wIdx}-${dIdx}`}
                        className={`size-2.5 rounded-[2px] cursor-pointer transition-shadow hover:ring-2 hover:ring-ink/40 ${bgClass}`}
                        title={tooltipText}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const cardEl = e.currentTarget.closest('.card-raised');
                          if (cardEl) {
                            const cardRect = cardEl.getBoundingClientRect();
                            setHoveredCell({
                              day,
                              x: rect.left - cardRect.left + rect.width / 2,
                              y: rect.top - cardRect.top,
                            });
                          }
                        }}
                        onMouseLeave={() => setHoveredCell(null)}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Floating Tooltip */}
          {hoveredCell && (
            <div
              className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-full rounded-lg bg-ink px-2.5 py-1.5 text-meta whitespace-nowrap text-surface shadow-lg transition-opacity duration-150"
              style={{
                left: `${hoveredCell.x}px`,
                top: `${hoveredCell.y - 8}px`,
              }}
            >
              <span className="font-medium">
                {hoveredCell.day.count === 0
                  ? 'No contributions'
                  : `${hoveredCell.day.count} contribution${hoveredCell.day.count === 1 ? '' : 's'}`}
              </span>
              {hoveredCell.day.date && (
                <span className="text-surface/80 ml-1.5">
                  on{' '}
                  {new Date(hoveredCell.day.date + 'T00:00:00Z').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    timeZone: 'UTC',
                  })}
                </span>
              )}
            </div>
          )}

          {/* Legend inside bottom-right */}
          <div className="mt-3.5 flex items-center justify-end gap-1.5 text-micro text-ink-3 select-none">
            <span>Less</span>
            <span className="size-2.5 rounded-[2px] bg-graph-0" />
            <span className="size-2.5 rounded-[2px] bg-graph-1 ring-1 ring-black/5 dark:ring-white/10" />
            <span className="size-2.5 rounded-[2px] bg-graph-2 ring-1 ring-black/5 dark:ring-white/10" />
            <span className="size-2.5 rounded-[2px] bg-graph-3 ring-1 ring-black/5 dark:ring-white/10" />
            <span className="size-2.5 rounded-[2px] bg-graph-4 ring-1 ring-black/5 dark:ring-white/10" />
            <span>More</span>
          </div>
        </div>

        {/* Repositories Sub-heading & Action */}
        <div className="mt-8 mb-4 flex items-center justify-between gap-4">
          <p className="text-body font-semibold text-ink">
            Total {effectiveRepos} repositories
          </p>
          <a
            href={`https://github.com/${githubUsername}?tab=repositories`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-[13.5px] font-semibold tracking-[-0.01em] whitespace-nowrap select-none btn btn-secondary h-9 px-4 text-meta shadow-xs ring-1 ring-line/50 hover:bg-surface-2 transition-all"
            title="View all repositories on GitHub"
          >
            <span className="btn-content inline-flex items-center gap-1.5">
              <span>View all</span>
              <ArrowUpRight className="size-3.5" />
            </span>
          </a>
        </div>

        {/* 2-Column Grid of 4 Pinned Repositories */}
        <div className="grid gap-4 sm:grid-cols-2">
          {effectivePinnedRepos.map((repo) => (
            <a
              key={repo.id}
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-[20px] border border-line bg-surface p-5 flex flex-col justify-between hover:border-line-strong transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer"
            >
              <div>
                <h3 className="text-sm font-bold text-ink group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors font-mono">
                  {repo.name}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-ink-2 line-clamp-2">
                  {repo.description}
                </p>
              </div>

              <div className="mt-4 flex items-center gap-4 text-xs text-ink-3 pt-3 border-t border-line/50">
                {repo.language && (
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <span
                      className="size-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: repo.languageColor }}
                    />
                    <span>{repo.language}</span>
                  </span>
                )}

                <span className="inline-flex items-center gap-1">
                  <span>☆</span>
                  <span className="tabular-nums">{repo.stars}</span>
                </span>

                {repo.forks !== undefined && (
                  <span className="inline-flex items-center gap-1">
                    <GitFork className="size-3.5" />
                    <span className="tabular-nums">{repo.forks}</span>
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* 2. Projects List Section (Screenshots 2 & 3) */}
      <section aria-labelledby="work-projects-heading" className="space-y-4 pt-4">
        {/* Header with See all link */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Layers className="size-5.5 text-ink" />
            <h2
              id="work-projects-heading"
              className="text-base font-bold tracking-tight text-ink"
            >
              Projects
            </h2>
          </div>

          <button
            type="button"
            onClick={onNavigateToProjects}
            className="text-xs font-medium text-ink-3 hover:text-ink hover:underline cursor-pointer"
          >
            See all
          </button>
        </div>

        {/* Vertical Rows List */}
        <div className="space-y-2">
          {projectsData.map((project) => {
            const link = project.project_url || project.repository_url || '#';

            return (
              <a
                key={project.id}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-4 rounded-[20px] border border-line bg-surface p-4 hover:border-line-strong hover:bg-surface-2/40 transition-all duration-200 shadow-xs cursor-pointer"
              >
                {/* 48px square icon badge */}
                {renderRowIcon(project.id)}

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-ink group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {project.title}
                  </h3>

                  <p className="mt-1 text-xs text-ink-2 leading-relaxed">
                    {project.description}
                  </p>

                  {/* Tags */}
                  {project.tags && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-ink-3">
                      <Tag className="size-3 text-ink-3" />
                      <span>{project.tags.join(', ')}</span>
                    </div>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      </section>
    </div>
  );
};
