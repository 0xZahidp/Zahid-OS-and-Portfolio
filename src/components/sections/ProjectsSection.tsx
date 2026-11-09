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

  const renderTileContent = (project: Project) => {
    if (project.image_url) {
      return (
        <div className="relative size-14 sm:size-16 rounded-xl overflow-hidden flex items-center justify-center">
          <Image
            src={project.image_url}
            alt={project.title}
            fill
            sizes="64px"
            className="object-contain"
            unoptimized
          />
        </div>
      );
    }

    const lt = (project.logoType || (project as unknown as Record<string, unknown>).logo_type || '').toString().toLowerCase();

    switch (lt) {
      case 'bidvers':
        return (
          <div className="size-13 sm:size-14 rounded-xl bg-black text-white font-extrabold text-2xl sm:text-3xl grid place-items-center shadow-md">
            B
          </div>
        );
      case 'laravel':
        return (
          <svg
            viewBox="0 0 40 40"
            className="size-10 sm:size-11 text-[#FF2D20]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 5 L33 12.5 L33 27.5 L20 35 L7 27.5 L7 12.5 Z" />
            <path d="M20 5 L20 35" />
            <path d="M20 20 L33 12.5" />
            <path d="M20 20 L7 12.5" />
          </svg>
        );
      case 'invo':
        return (
          <span className="text-white font-bold text-xl sm:text-2xl tracking-tight select-none">
            Invo
          </span>
        );
      case 'prompt':
        return (
          <span className="text-white font-mono font-bold text-2xl sm:text-3xl select-none">
            {'{ }'}
          </span>
        );
      case 'mytapcard':
        return (
          <span className="text-white font-bold text-base sm:text-lg tracking-wider select-none">
            MTC
          </span>
        );
      case 'gymscanner':
        return (
          <span className="text-white font-bold text-xl select-none">
            GS
          </span>
        );
      default: {
        const words = project.title.trim().split(/\s+/);
        if (words.length === 1 && words[0].length <= 6) {
          return (
            <span className="text-white font-bold text-xl tracking-tight select-none px-2 text-center">
              {words[0]}
            </span>
          );
        }
        if (words.length === 2 && words[0].length <= 5 && words[1].length <= 5) {
          return (
            <span className="text-white font-bold text-base sm:text-lg tracking-tight select-none px-2 text-center line-clamp-1">
              {project.title}
            </span>
          );
        }
        const initials = words.map((w) => w[0]).join('').slice(0, 2).toUpperCase();
        return (
          <span className="text-white font-extrabold text-2xl tracking-wider select-none">
            {initials || 'P'}
          </span>
        );
      }
    }
  };

  return (
    <div className="space-y-10">
      {/* Featured Projects Grid */}
      {isLoading ? (
        <div className="grid gap-4.5 sm:grid-cols-2 animate-pulse" aria-hidden="true">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-[26px] border border-white/[0.08] bg-[#0e0f12] p-1.5 space-y-3">
              <div className="h-[205px] sm:h-[210px] rounded-[20px] bg-white/[0.04]" />
              <div className="px-3.5 pb-3 space-y-2">
                <div className="h-4 w-36 bg-white/[0.08] rounded-md" />
                <div className="h-8 w-full bg-white/[0.04] rounded-md" />
                <div className="h-4 w-28 bg-white/[0.06] rounded-md pt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : projectsData.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-white/[0.08] bg-white/[0.02] p-8 sm:p-10 text-center">
          <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 grid place-items-center mx-auto mb-3">
            <Layers className="size-5" />
          </div>
          <h3 className="text-sm font-semibold text-white">Featured Projects Coming Soon</h3>
          <p className="text-xs text-zinc-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
            Case studies, client products, and systems are currently being compiled in the CMS.
          </p>
        </div>
      ) : (
        <div className="grid gap-4.5 sm:grid-cols-2">
          {projectsData.map((project) => {
            const link = project.project_url || project.repository_url || '#';
            const badgeText = project.highlightBadge || ((project as unknown as Record<string, unknown>).highlight_badge as string | undefined);

            return (
              <a
                key={project.id}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-[26px] border border-white/[0.08] hover:border-white/20 bg-[#0e0f12] p-1.5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 shadow-sm hover:shadow-lg cursor-pointer"
              >
                <div>
                  {/* Card Banner with Dark Emerald Gradient, Radial Glow & Dot Matrix Overlay */}
                  <div className="relative h-[205px] sm:h-[210px] w-full rounded-[20px] sm:rounded-[22px] overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#062820] via-[#041a15] to-[#020d0a]">
                    {/* Ambient Radial Green Glow */}
                    <div
                      className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(16,185,129,0.3)_0%,rgba(4,38,29,0.45)_50%,transparent_75%)] pointer-events-none"
                      aria-hidden="true"
                    />

                    {/* Dotted Grid Pattern Overlay */}
                    <div
                      className="absolute inset-0 bg-dot-matrix opacity-70 pointer-events-none"
                      aria-hidden="true"
                    />

                    {/* Optional Top-left Pill Badge (e.g. ↗ $120K+ raised) */}
                    {badgeText && (
                      <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md border border-emerald-500/25 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 shadow-sm">
                        <span className="text-emerald-400">↗</span>
                        <span>{badgeText}</span>
                      </span>
                    )}

                    {/* Centered Glassy Rounded-Square Tile (~90-96px) */}
                    <div className="relative z-10 size-23 sm:size-24 rounded-[20px] sm:rounded-[22px] bg-[#0c211a]/70 backdrop-blur-md border border-white/12 shadow-[0_8px_28px_rgba(0,0,0,0.5)] flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                      {renderTileContent(project)}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="px-3.5 pt-3.5 pb-1">
                    <h3 className="text-[15px] font-bold text-white tracking-[-0.01em] group-hover:text-emerald-400 transition-colors">
                      {project.title}
                    </h3>
                    <p className="mt-1 text-[13px] text-zinc-400 leading-snug line-clamp-2">
                      {project.description}
                    </p>
                  </div>
                </div>

                {/* Footer Row: Tag Chips on Left, Stars & GitHub Link on Right (NO divider line!) */}
                <div className="px-3.5 pt-2 pb-2.5 flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {project.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-[#18191c] border border-white/[0.08] px-2 py-0.5 text-[11px] font-medium text-zinc-300 select-none"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2.5 text-xs font-medium text-zinc-400 shrink-0">
                    {project.stars !== undefined && (
                      <span className="inline-flex items-center gap-1 text-zinc-400">
                        <span className="text-xs">☆</span>
                        <span className="tabular-nums text-xs">{project.stars}</span>
                      </span>
                    )}
                    {project.repository_url && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(project.repository_url, '_blank', 'noopener,noreferrer');
                        }}
                        className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
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
      <section aria-labelledby="open-source-heading" className="pt-2">
        <div className="mb-4 flex items-center gap-2.5">
          <GitHubIcon className="size-5 text-white" />
          <h2
            id="open-source-heading"
            className="text-[17px] font-bold tracking-tight text-white"
          >
            Open source
          </h2>
        </div>

        {openSourceProjects.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-white/[0.08] bg-white/[0.02] p-6 text-center">
            <p className="text-xs text-zinc-400">Public repositories and open source packages coming soon.</p>
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
                  className="group rounded-[20px] border border-white/[0.08] hover:border-white/20 bg-[#0e0f12] p-4.5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 shadow-sm hover:shadow-lg cursor-pointer"
                >
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors font-mono">
                      {project.title}
                    </h3>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-zinc-400 line-clamp-2">
                      {project.description}
                    </p>
                  </div>

                  <div className="mt-3.5 flex items-center justify-between text-xs text-zinc-400 pt-3 border-t border-white/[0.08]">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <span className="size-2 rounded-full shrink-0 bg-emerald-500" />
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
