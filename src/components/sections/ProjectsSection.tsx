'use client';

import React from 'react';
import Image from 'next/image';
import { GitHubIcon } from '@/components/ui/Icons';
import { Project } from '@/types/profile';
import { Layers } from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';

export const ProjectsSection: React.FC = () => {
  const { content, isLoading } = usePortfolio();
  const projectsData = content.projects || [];
  const openSourceProjects = projectsData.filter(
    (p) => p.tags?.some((t) => t.toLowerCase().includes('open source')) || p.repository_url
  );

  const renderFloatingBadge = (project: Project) => {
    if (project.image_url) {
      return (
        <div className="relative size-16 sm:size-20 rounded-2xl overflow-hidden shadow-lg ring-4 ring-white/40 dark:ring-white/15 transition-transform group-hover:scale-105 duration-200 bg-surface-2 flex items-center justify-center">
          <Image
            src={project.image_url}
            alt={project.title}
            fill
            sizes="80px"
            className="object-cover"
            unoptimized
          />
        </div>
      );
    }

    switch (project.logoType) {
      case 'bidvers':
        return (
          <div className="size-16 sm:size-18 rounded-2xl bg-black text-white font-extrabold text-2xl grid place-items-center shadow-lg ring-4 ring-white/40 dark:ring-white/15 transition-transform group-hover:scale-105 duration-200">
            B
          </div>
        );
      case 'laravel':
        return (
          <div className="size-16 sm:size-18 rounded-2xl bg-white dark:bg-zinc-800 grid place-items-center shadow-lg ring-4 ring-white/40 dark:ring-white/15 transition-transform group-hover:scale-105 duration-200">
            <svg
              viewBox="0 0 40 40"
              className="size-10 text-[#FF2D20]"
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
      case 'invo':
        return (
          <div className="px-5 py-2.5 rounded-2xl bg-emerald-600/90 text-white font-bold text-lg tracking-tight grid place-items-center shadow-lg ring-4 ring-white/40 dark:ring-white/15 transition-transform group-hover:scale-105 duration-200">
            Invo
          </div>
        );
      case 'prompt':
        return (
          <div className="size-16 sm:size-18 rounded-2xl bg-emerald-600/90 text-white font-mono font-bold text-2xl grid place-items-center shadow-lg ring-4 ring-white/40 dark:ring-white/15 transition-transform group-hover:scale-105 duration-200">
            {'{ }'}
          </div>
        );
      case 'mytapcard':
        return (
          <div className="size-16 sm:size-18 rounded-2xl bg-zinc-900 text-white font-bold text-sm tracking-wider grid place-items-center shadow-lg ring-4 ring-white/40 dark:ring-white/15 transition-transform group-hover:scale-105 duration-200">
            MTC
          </div>
        );
      case 'gymscanner':
      default:
        return (
          <div className="size-16 sm:size-18 rounded-2xl bg-zinc-900 text-white font-bold text-2xl grid place-items-center shadow-lg ring-4 ring-white/40 dark:ring-white/15 transition-transform group-hover:scale-105 duration-200">
            {project.title.charAt(0) || 'P'}
          </div>
        );
    }
  };

  return (
    <div className="space-y-12">
      {/* Featured Projects Grid */}
      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 animate-pulse" aria-hidden="true">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-[24px] border border-line bg-surface p-4 space-y-4">
              <div className="h-44 sm:h-48 rounded-[20px] bg-surface-2" />
              <div className="h-5 w-40 bg-surface-2 rounded-md" />
              <div className="h-12 w-full bg-surface-2/60 rounded-md" />
            </div>
          ))}
        </div>
      ) : projectsData.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-line bg-surface-2/40 p-8 sm:p-10 text-center">
          <div className="size-12 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 grid place-items-center mx-auto mb-3">
            <Layers className="size-5" />
          </div>
          <h3 className="text-sm font-semibold text-ink">Featured Projects Coming Soon</h3>
          <p className="text-xs text-ink-3 mt-1.5 max-w-sm mx-auto leading-relaxed">
            Case studies, client products, and systems are currently being compiled in the CMS.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {projectsData.map((project) => {
          const link = project.project_url || project.repository_url || '#';
          const hasVisual = !!project.image_url || !!project.logoType;

          return (
            <a
              key={project.id}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-[24px] border border-line bg-surface p-4 flex flex-col justify-between hover:border-line-strong transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer"
            >
              <div>
                {/* Visual Banner with mint/teal gradient & floating 3D logo badge (if has logoType) */}
                {hasVisual && (
                  <div className="h-44 sm:h-48 rounded-[20px] bg-gradient-to-br from-emerald-100/70 via-teal-50/50 to-emerald-50/40 dark:from-emerald-950/60 dark:via-teal-950/40 dark:to-emerald-900/30 border border-emerald-500/15 relative overflow-hidden flex items-center justify-center">
                    {/* Ambient radial glow */}
                    <div
                      className="absolute -top-10 -right-10 size-40 rounded-full bg-emerald-400/20 blur-2xl pointer-events-none"
                      aria-hidden="true"
                    />

                    {/* Top-left Pill Badge (e.g. ↗ $120K+ raised) */}
                    {project.highlightBadge && (
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/85 dark:bg-black/90 px-3 py-1 text-xs font-semibold text-white shadow-sm ring-1 ring-white/10">
                        <span className="text-emerald-400">↗</span>
                        <span>{project.highlightBadge}</span>
                      </span>
                    )}

                    {/* Floating Centered 3D Badge */}
                    {renderFloatingBadge(project)}
                  </div>
                )}

                {/* Title & Description */}
                <div className={`${hasVisual ? 'pt-4' : 'pt-2'} pb-1 px-1`}>
                  <h3 className="text-base font-bold text-ink group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {project.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-ink-2 line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>
                </div>
              </div>

              {/* Bottom Row: Tags & Stars / GitHub */}
              <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-line/60 px-1">
                <div className="flex flex-wrap gap-1.5">
                  {project.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-surface-2 px-2 py-0.5 text-xs font-medium text-ink-3"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2.5 text-xs font-medium text-ink-3 shrink-0">
                  {project.stars !== undefined && (
                    <span className="inline-flex items-center gap-1">
                      <span className="text-sm">☆</span>
                      <span className="tabular-nums">{project.stars}</span>
                    </span>
                  )}
                  {project.repository_url && (
                    <span
                      className="hover:text-ink transition-colors"
                      title="View GitHub repository"
                    >
                      <GitHubIcon className="size-4" />
                    </span>
                  )}
                </div>
              </div>
            </a>
          );
        })}
        </div>
      )}

      {/* Open Source Repositories Section */}
      <section aria-labelledby="open-source-heading" className="pt-4">
        <div className="mb-5 flex items-center gap-2.5">
          <GitHubIcon className="size-5.5 text-ink" />
          <h2
            id="open-source-heading"
            className="text-lg font-bold tracking-tight text-ink"
          >
            Open source
          </h2>
        </div>

        {openSourceProjects.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-line bg-surface-2/30 p-6 text-center">
            <p className="text-xs text-ink-3">Public repositories and open source packages coming soon.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {openSourceProjects.map((project) => {
              const link = project.repository_url || project.project_url || '#';
              return (
                <a
                  key={project.id}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-[20px] border border-line bg-surface p-5 flex flex-col justify-between hover:border-line-strong transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer"
                >
                  <div>
                    <h3 className="text-sm font-bold text-ink group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors font-mono">
                      {project.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-ink-2 line-clamp-2">
                      {project.description}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center gap-4 text-xs text-ink-3 pt-3 border-t border-line/50">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <span className="size-2.5 rounded-full shrink-0 bg-brand-500" />
                      <span>{project.tags?.[0] || 'Repository'}</span>
                    </span>

                    {project.stars !== undefined && project.stars > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <span>☆</span>
                        <span className="tabular-nums">{project.stars}</span>
                      </span>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
