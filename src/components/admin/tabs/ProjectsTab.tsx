'use client';

import React, { useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, Layers, X } from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';
import { Project } from '@/types/profile';

export const ProjectsTab: React.FC = () => {
  const { content, updateProjects } = usePortfolio();
  const projects = content.projects;
  const [newTagInputs, setNewTagInputs] = useState<Record<string, string>>({});

  const handleUpdate = (idx: number, patch: Partial<Project>) => {
    const updated = [...projects];
    updated[idx] = { ...updated[idx], ...patch };
    updateProjects(updated);
  };

  const handleAddProject = () => {
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      title: 'New Project',
      description: 'A cutting-edge SaaS platform designed for high-scale developer workflows.',
      tags: ['Next.js', 'TypeScript', 'Tailwind'],
      project_url: 'https://example.com',
      repository_url: 'https://github.com/0xZahidp/example',
      highlightBadge: '$100K+ raised',
      stars: 0,
      logoType: 'bidvers',
    };
    updateProjects([newProj, ...projects]);
  };

  const handleRemove = (idx: number) => {
    updateProjects(projects.filter((_, i) => i !== idx));
  };

  const handleMove = (idx: number, direction: 'up' | 'down') => {
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === projects.length - 1) return;
    const target = direction === 'up' ? idx - 1 : idx + 1;
    const updated = [...projects];
    const temp = updated[idx];
    updated[idx] = updated[target];
    updated[target] = temp;
    updateProjects(updated);
  };

  const handleAddTag = (projId: string, idx: number) => {
    const tag = (newTagInputs[projId] || '').trim();
    if (!tag) return;
    const currentTags = projects[idx].tags || [];
    if (!currentTags.includes(tag)) {
      handleUpdate(idx, { tags: [...currentTags, tag] });
    }
    setNewTagInputs({ ...newTagInputs, [projId]: '' });
  };

  const handleRemoveTag = (projIdx: number, tagToRemove: string) => {
    const currentTags = projects[projIdx].tags || [];
    handleUpdate(projIdx, { tags: currentTags.filter((t) => t !== tagToRemove) });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="card-raised rounded-2xl border border-line bg-surface p-4 sm:p-6 shadow-xs space-y-5 sm:space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-line">
          <div className="flex items-center gap-2.5">
            <Layers className="size-4.5 text-brand-500 shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-ink">Featured Projects & Products</h2>
              <p className="text-[11px] text-ink-3">
                Displayed in the Projects view and the Work repositories section.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddProject}
            className="btn btn-secondary h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shrink-0"
          >
            <Plus className="size-3.5" />
            <span className="hidden xs:inline">Add Project</span>
          </button>
        </div>

        <div className="space-y-4">
          {projects.map((proj, idx) => (
            <div
              key={proj.id || idx}
              className="p-3.5 sm:p-5 rounded-2xl border border-line bg-surface-2/60 hover:bg-surface-2 transition-all space-y-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-black text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs ring-1 ring-white/10">
                    {proj.title.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-ink flex items-center gap-2">
                      <span>{proj.title}</span>
                      {proj.highlightBadge && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                          {proj.highlightBadge}
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-ink-3">
                      Logo: {proj.logoType || 'default'} · {proj.tags?.join(', ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMove(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg text-ink-3 hover:text-ink disabled:opacity-30"
                    title="Move up"
                  >
                    <ChevronUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(idx, 'down')}
                    disabled={idx === projects.length - 1}
                    className="p-1.5 rounded-lg text-ink-3 hover:text-ink disabled:opacity-30"
                    title="Move down"
                  >
                    <ChevronDown className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="p-1.5 rounded-lg text-ink-3 hover:text-rose-500 transition-colors ml-1"
                    title="Delete project"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-ink-3">Project Title</label>
                  <input
                    type="text"
                    value={proj.title}
                    onChange={(e) => handleUpdate(idx, { title: e.target.value })}
                    className="w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-ink-3">Highlight Badge (Optional)</label>
                  <input
                    type="text"
                    value={proj.highlightBadge || ''}
                    onChange={(e) => handleUpdate(idx, { highlightBadge: e.target.value })}
                    placeholder="e.g. $120K+ raised or Open source"
                    className="w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-ink-3">Logo Icon Style</label>
                  <select
                    value={proj.logoType || 'bidvers'}
                    onChange={(e) => handleUpdate(idx, { logoType: e.target.value as Project['logoType'] })}
                    className="w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                  >
                    <option value="bidvers">Bidvers (Dark B badge)</option>
                    <option value="laravel">Laravel (Orange wireframe)</option>
                    <option value="invo">Invo (Green rounded text)</option>
                    <option value="prompt">Prompt (Code curly braces)</option>
                    <option value="mytapcard">MyTapCard (Minimalist card)</option>
                    <option value="gymscanner">GymScanner (Fitness marker)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-ink-3">GitHub Stars Count</label>
                  <input
                    type="number"
                    value={proj.stars || 0}
                    onChange={(e) => handleUpdate(idx, { stars: parseInt(e.target.value, 10) || 0 })}
                    className="w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-semibold text-ink-3">Description</label>
                  <textarea
                    value={proj.description}
                    onChange={(e) => handleUpdate(idx, { description: e.target.value })}
                    rows={2}
                    className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs text-ink focus:outline-none resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-ink-3">Live Demo URL</label>
                  <input
                    type="text"
                    value={proj.project_url || ''}
                    onChange={(e) => handleUpdate(idx, { project_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-ink-3">GitHub Repository URL</label>
                  <input
                    type="text"
                    value={proj.repository_url || ''}
                    onChange={(e) => handleUpdate(idx, { repository_url: e.target.value })}
                    placeholder="https://github.com/..."
                    className="w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Tags Manager */}
              <div className="pt-2 border-t border-line/60 space-y-2">
                <label className="text-[11px] font-semibold text-ink-3">Tags & Tech Stack</label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(proj.tags || []).map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2 py-0.5 text-[11px] text-ink"
                    >
                      <span>{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(idx, t)}
                        className="text-ink-3 hover:text-rose-500"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}

                  <div className="inline-flex items-center gap-1">
                    <input
                      type="text"
                      value={newTagInputs[proj.id] || ''}
                      onChange={(e) => setNewTagInputs({ ...newTagInputs, [proj.id]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag(proj.id, idx);
                        }
                      }}
                      placeholder="+ Add tag..."
                      className="rounded-lg border border-line bg-surface px-2 py-0.5 text-[11px] text-ink focus:outline-none w-24"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
