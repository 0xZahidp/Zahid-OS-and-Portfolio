import React from 'react';
import { Globe, Layers } from 'lucide-react';
import { projectsData } from '@/data/profile';
import { Button } from '@/components/ui/Button';
import { GitHubIcon } from '@/components/ui/Icons';

export const ProjectsSection: React.FC = () => {
  return (
    <section id="projects" aria-labelledby="projects-heading" className="space-y-6 scroll-mt-20">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2
          id="projects-heading"
          className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-ink"
        >
          <Layers className="size-6 shrink-0 text-ink" />
          <span>Featured Projects & Systems</span>
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {projectsData.map((project) => (
          <div
            key={project.id}
            className="group card-raised p-5 flex flex-col justify-between hover:border-line-strong transition-all duration-200"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-semibold text-ink group-hover:text-link transition-colors">
                  {project.title}
                </h3>
                <div className="flex items-center gap-1.5 shrink-0">
                  {project.project_url && (
                    <Button
                      variant="dark"
                      size="sm"
                      href={project.project_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-[12px] h-8 px-3 text-xs"
                      title={`Visit ${project.title}`}
                    >
                      <Globe className="size-3.5" />
                      <span>Website</span>
                    </Button>
                  )}
                  {project.repository_url && (
                    <Button
                      variant="dark"
                      size="sm"
                      href={project.repository_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-[12px] h-8 px-3 text-xs"
                      title={`View ${project.title} repository`}
                    >
                      <GitHubIcon className="size-3.5" />
                      <span>Source</span>
                    </Button>
                  )}
                </div>
              </div>

              <p className="mt-2.5 text-body leading-relaxed text-ink-2">
                {project.description}
              </p>
            </div>

            {project.tags && (
              <div className="mt-5 flex flex-wrap gap-1.5 pt-2 border-t border-line/60">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-surface-2 px-2 py-0.5 text-meta text-ink-3"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

