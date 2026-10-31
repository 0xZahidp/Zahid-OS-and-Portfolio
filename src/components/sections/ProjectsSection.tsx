'use client';

import React from 'react';
import { projectsData } from '@/data/profile';
import { GitHubIcon } from '@/components/ui/Icons';
import { Project } from '@/types/profile';

export const ProjectsSection: React.FC = () => {
  const renderFloatingBadge = (project: Project) => {
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
            G
          </div>
        );
    }
  };

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {projectsData.map((project) => {
        const link = project.project_url || project.repository_url || '#';

        return (
          <a
            key={project.id}
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-[24px] border border-line bg-surface p-4 flex flex-col justify-between hover:border-line-strong transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer"
          >
            <div>
              {/* Visual Banner with mint/teal gradient & floating 3D logo badge */}
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

              {/* Title & Description */}
              <div className="pt-4 pb-1 px-1">
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
  );
};
