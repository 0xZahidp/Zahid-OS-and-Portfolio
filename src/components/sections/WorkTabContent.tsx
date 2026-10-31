'use client';

import React, { useMemo } from 'react';
import {
  Layers,
  ArrowUpRight,
  GitFork,
  Tag,
  Calendar,
  Smile,
} from 'lucide-react';
import { GitHubIcon } from '@/components/ui/Icons';
import { projectsData } from '@/data/profile';

interface WorkTabContentProps {
  onNavigateToProjects: () => void;
}

export const WorkTabContent: React.FC<WorkTabContentProps> = ({
  onNavigateToProjects,
}) => {
  // Generate realistic 52-week GitHub contribution heatmap
  const contributionWeeks = useMemo(() => {
    // 52 columns x 7 days
    const weeks = [];
    // Seeded random pseudo generator so grid stays stable across renders
    let seed = 42;
    const seededRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    for (let w = 0; w < 52; w++) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        const rand = seededRandom();
        let level = 0;
        // Higher intensity toward later months (Aug, Sep, Oct)
        const intensityBoost = w > 36 ? 0.35 : w > 20 ? 0.2 : 0;
        const adjusted = rand - intensityBoost;

        if (adjusted < 0.2) level = 4;
        else if (adjusted < 0.4) level = 3;
        else if (adjusted < 0.65) level = 2;
        else if (adjusted < 0.85) level = 1;
        else level = 0;

        days.push(level);
      }
      weeks.push(days);
    }
    return weeks;
  }, []);

  const months = [
    'Nov',
    'Dec',
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
  ];

  // Specific 4 pinned repos matching Screenshot 1
  const pinnedRepos = [
    {
      id: 'pin-1',
      name: 'alnahian2003/learn-laravel',
      title: 'learn-laravel',
      description:
        '🎉 Ready to level up your Laravel skills? Dive into awesome self-learning resources - tutorials, ebooks, blogs and courses.',
      language: '',
      stars: 186,
      forks: 82,
      url: 'https://github.com/0xZahidp/learn-laravel',
    },
    {
      id: 'pin-2',
      name: 'alnahian2003/year',
      title: 'year',
      description:
        'A beautifully designed, real-time year progress tracker with 8 unique themes including Windows 7, Cyberpunk and more.',
      language: 'HTML',
      languageColor: '#e34c26',
      stars: 12,
      forks: 3,
      url: 'https://github.com/0xZahidp/year-progress',
    },
    {
      id: 'pin-3',
      name: 'alnahian2003/kordova',
      title: 'kordova',
      description:
        'Simplify your uptime monitoring experience with this all-in-one solution, designed to be lightweight and easy to self-host.',
      language: 'PHP',
      languageColor: '#4F5D95',
      stars: 6,
      url: 'https://github.com/0xZahidp/kordova',
    },
    {
      id: 'pin-4',
      name: 'alnahian2003/kleon',
      title: 'kleon',
      description:
        'Freelancer CRM - Using Laravel, Vue 3 & Inertia. Submission for Laravel Daily’s Laravel Learning challenge.',
      language: 'PHP',
      languageColor: '#4F5D95',
      stars: 10,
      forks: 2,
      url: 'https://github.com/0xZahidp/kleon',
    },
  ];

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
      {/* 1. GitHub Contributions Heatmap & Pinned Repos (Screenshot 1) */}
      <section aria-labelledby="github-section-heading" className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <GitHubIcon className="size-5.5 text-ink" />
          <h2
            id="github-section-heading"
            className="text-base font-bold tracking-tight text-ink"
          >
            GitHub
          </h2>
        </div>

        <p className="text-xs text-ink-3">
          1,378 contributions in the last year
        </p>

        {/* Heatmap Matrix Container */}
        <div className="rounded-[22px] border border-line bg-surface p-5 overflow-x-auto [scrollbar-width:none]">
          <div className="min-w-[660px]">
            {/* Months Header Row */}
            <div className="flex justify-between text-[10px] font-medium text-ink-3 mb-2 px-1">
              {months.map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>

            {/* Matrix Grid (52 weeks x 7 days) */}
            <div className="flex gap-[3px]">
              {contributionWeeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-[3px]">
                  {week.map((level, dIdx) => {
                    let bgClass = 'bg-zinc-100 dark:bg-zinc-800/80';
                    if (level === 1) bgClass = 'bg-emerald-200 dark:bg-emerald-950/70 border border-emerald-500/20';
                    else if (level === 2) bgClass = 'bg-emerald-300 dark:bg-emerald-800/80';
                    else if (level === 3) bgClass = 'bg-emerald-500 dark:bg-emerald-600';
                    else if (level === 4) bgClass = 'bg-emerald-600 dark:bg-emerald-400';

                    return (
                      <span
                        key={dIdx}
                        className={`size-[10px] rounded-[2px] ${bgClass} transition-transform hover:scale-125`}
                        title={`Activity level: ${level}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Legend Bottom Row */}
            <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-ink-3">
              <span>Less</span>
              <span className="size-[9px] rounded-[2px] bg-zinc-100 dark:bg-zinc-800" />
              <span className="size-[9px] rounded-[2px] bg-emerald-200 dark:bg-emerald-950" />
              <span className="size-[9px] rounded-[2px] bg-emerald-300 dark:bg-emerald-800" />
              <span className="size-[9px] rounded-[2px] bg-emerald-500 dark:bg-emerald-600" />
              <span className="size-[9px] rounded-[2px] bg-emerald-600 dark:bg-emerald-400" />
              <span>More</span>
            </div>
          </div>
        </div>

        {/* Repositories Sub-heading & Action */}
        <div className="pt-2 flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-ink">Total 92 repositories</p>
          <a
            href="https://github.com/0xZahidp?tab=repositories"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary h-8 px-3 rounded-[12px] text-xs font-semibold inline-flex items-center gap-1"
          >
            <span>View all</span>
            <ArrowUpRight className="size-3.5" />
          </a>
        </div>

        {/* 2-Column Grid of 4 Pinned Repositories */}
        <div className="grid gap-4 sm:grid-cols-2">
          {pinnedRepos.map((repo) => (
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
