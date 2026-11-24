'use client';

import React from 'react';
import Image from 'next/image';
import { Layers, ArrowUpRight, Star } from 'lucide-react';
import { Project } from '@/types/profile';
import { usePortfolio } from '@/context/PortfolioContext';
import { GitHubIcon } from '@/components/ui/Icons';
import { cn } from '@/lib/utils';

export const ProjectsSection: React.FC = () => {
  const { content, isLoading } = usePortfolio();
  const projectsData = content.projects || [];

  const renderProjectIcon = (project: Project) => {
    if (project.image_url) {
      return (
        <div className="relative size-10 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-line bg-surface-2">
          <Image
            src={project.image_url}
            alt={project.title}
            fill
            sizes="40px"
            className="object-contain p-1"
            unoptimized
          />
        </div>
      );
    }

    const initials = project.title
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    return (
      <div className="size-10 rounded-lg bg-surface-2 border border-line grid place-items-center text-text font-bold text-sm shrink-0">
        {initials || 'P'}
      </div>
    );
  };

  return (
    <section id="work" aria-labelledby="work-heading" className="scroll-mt-20">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Layers className="size-5 text-accent" />
          <h2
            id="work-heading"
            className="text-xl font-bold tracking-tight text-text"
          >
            Selected Work
          </h2>
        </div>
        <span className="text-xs font-mono text-muted">
          {projectsData.length} projects shipped
        </span>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 animate-pulse" aria-hidden="true">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 rounded-2xl border border-line bg-surface p-5 space-y-3" />
          ))}
        </div>
      ) : projectsData.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center">
          <Layers className="size-6 text-muted mx-auto mb-2" />
          <p className="text-sm font-medium text-text">Projects coming soon.</p>
        </div>
      ) : (
        /* Bento Grid with mixed card sizes */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {projectsData.map((project, idx) => {
            const link = project.project_url || project.repository_url || '#';
            const badgeText = project.highlightBadge || ((project as unknown as Record<string, unknown>).highlight_badge as string | undefined);
            // First item (e.g. Dhakaiya Bites) and 4th item span 2 columns in the bento layout
            const isFeatured = idx === 0 || (idx === 3 && projectsData.length > 3);

            return (
              <a
                key={project.id || project.title}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'group rounded-2xl border border-line bg-surface p-5 sm:p-6 transition-all duration-200 hover:border-accent/60 hover:-translate-y-0.5 shadow-2xs hover:shadow-sm flex flex-col justify-between cursor-pointer',
                  isFeatured ? 'sm:col-span-2 bg-gradient-to-br from-surface to-surface-2/40' : 'sm:col-span-1'
                )}
              >
                <div>
                  {/* Top Bar: Icon + Badge + Arrow */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      {renderProjectIcon(project)}
                      {badgeText && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/25 px-2.5 py-0.5 text-[11px] font-medium text-accent">
                          <span>↗</span>
                          <span>{badgeText}</span>
                        </span>
                      )}
                    </div>
                    <div className="size-8 rounded-lg border border-line bg-surface-2 grid place-items-center text-muted group-hover:text-accent group-hover:border-accent/40 transition-colors">
                      <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base sm:text-lg font-bold tracking-tight text-text group-hover:text-accent transition-colors">
                    {project.title}
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-muted leading-relaxed line-clamp-2 sm:line-clamp-3">
                    {project.description}
                  </p>
                </div>

                {/* Footer: Tags & Repo Link */}
                <div className="mt-5 pt-4 border-t border-line/60 flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {project.tags?.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-surface-2 border border-line px-2 py-0.5 text-[11px] font-mono text-muted select-none"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-muted shrink-0">
                    {project.stars !== undefined && project.stars > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Star className="size-3 fill-accent text-accent" />
                        <span>{project.stars}</span>
                      </span>
                    )}
                    {project.repository_url && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(project.repository_url, '_blank', 'noopener,noreferrer');
                        }}
                        className="text-muted hover:text-text transition-colors p-1"
                        title="GitHub repo"
                      >
                        <GitHubIcon className="size-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </section>
  );
};
