'use client';

import React from 'react';
import Image from 'next/image';
import { Plus, Trash2, ChevronUp, ChevronDown, Briefcase } from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';
import { Experience } from '@/types/profile';

export const ExperienceTab: React.FC = () => {
  const { content, updateExperience } = usePortfolio();
  const experiences = content.experience;

  const handleUpdate = (idx: number, patch: Partial<Experience>) => {
    const updated = [...experiences];
    updated[idx] = { ...updated[idx], ...patch };
    updateExperience(updated);
  };

  const handleAddExperience = () => {
    const newExp: Experience = {
      id: `exp-${Date.now()}`,
      position: 'Software Engineer',
      company: 'New Company',
      company_url: 'https://example.com',
      company_logo: '/images/bidvers.webp',
      period: 'Jan 2025 – Present',
      type: 'Full-time',
      workplace_type: 'Remote',
      description: 'Architecting scalable applications and high-throughput systems.',
      bullet_points: [
        'Built modern full-stack features and API endpoints.',
        'Improved application performance and developer velocity.',
      ],
      tags: ['Next.js', 'TypeScript', 'Tailwind CSS'],
      is_current: true,
    };
    updateExperience([newExp, ...experiences]);
  };

  const handleRemove = (idx: number) => {
    updateExperience(experiences.filter((_, i) => i !== idx));
  };

  const handleMove = (idx: number, direction: 'up' | 'down') => {
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === experiences.length - 1) return;
    const target = direction === 'up' ? idx - 1 : idx + 1;
    const updated = [...experiences];
    const temp = updated[idx];
    updated[idx] = updated[target];
    updated[target] = temp;
    updateExperience(updated);
  };

  const handleAddBullet = (expIdx: number) => {
    const updated = [...experiences];
    const bullets = [...(updated[expIdx].bullet_points || []), 'Key achievement or responsibility'];
    updated[expIdx] = { ...updated[expIdx], bullet_points: bullets };
    updateExperience(updated);
  };

  const handleUpdateBullet = (expIdx: number, bIdx: number, text: string) => {
    const updated = [...experiences];
    const bullets = [...(updated[expIdx].bullet_points || [])];
    bullets[bIdx] = text;
    updated[expIdx] = { ...updated[expIdx], bullet_points: bullets };
    updateExperience(updated);
  };

  const handleRemoveBullet = (expIdx: number, bIdx: number) => {
    const updated = [...experiences];
    const bullets = (updated[expIdx].bullet_points || []).filter((_, i) => i !== bIdx);
    updated[expIdx] = { ...updated[expIdx], bullet_points: bullets };
    updateExperience(updated);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="card-raised rounded-2xl border border-line bg-surface p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-line">
          <div className="flex items-center gap-2.5">
            <Briefcase className="size-4.5 text-brand-500" />
            <div>
              <h2 className="text-sm font-bold text-ink">Career Experience</h2>
              <p className="text-[11px] text-ink-3">
                Timeline positions rendered in your Experience section.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddExperience}
            className="btn btn-secondary h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="size-3.5" />
            <span>Add Position</span>
          </button>
        </div>

        <div className="space-y-4">
          {experiences.map((exp, idx) => (
            <div
              key={exp.id || idx}
              className="p-5 rounded-2xl border border-line bg-surface-2/60 hover:bg-surface-2 transition-all space-y-4"
            >
              {/* Header row with move/delete controls */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative size-10 rounded-xl overflow-hidden bg-surface border border-line shrink-0 flex items-center justify-center">
                    <Image
                      src={exp.company_logo || '/images/bidvers.webp'}
                      alt={exp.company}
                      fill
                      sizes="40px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-ink">
                      {exp.position} <span className="text-ink-3 font-normal">at</span> {exp.company}
                    </h3>
                    <p className="text-[11px] text-ink-3 font-medium">
                      {exp.period} · {exp.type} · {exp.workplace_type}
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
                    disabled={idx === experiences.length - 1}
                    className="p-1.5 rounded-lg text-ink-3 hover:text-ink disabled:opacity-30"
                    title="Move down"
                  >
                    <ChevronDown className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="p-1.5 rounded-lg text-ink-3 hover:text-rose-500 transition-colors ml-1"
                    title="Delete position"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Fields Grid */}
              <div className="grid gap-3.5 sm:grid-cols-3">
                <div>
                  <label className="text-[11px] font-semibold text-ink-3">Job Title / Position</label>
                  <input
                    type="text"
                    value={exp.position}
                    onChange={(e) => handleUpdate(idx, { position: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-ink-3">Company Name</label>
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => handleUpdate(idx, { company: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-ink-3">Period / Dates</label>
                  <input
                    type="text"
                    value={exp.period}
                    onChange={(e) => handleUpdate(idx, { period: e.target.value })}
                    placeholder="e.g. Nov 2025 – Present"
                    className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-ink-3">Employment Type</label>
                  <select
                    value={exp.type}
                    onChange={(e) => handleUpdate(idx, { type: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Advisory">Advisory</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-ink-3">Workplace Type</label>
                  <input
                    type="text"
                    value={exp.workplace_type}
                    onChange={(e) => handleUpdate(idx, { workplace_type: e.target.value })}
                    placeholder="e.g. Remote or Dhaka, Bangladesh"
                    className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-ink-3">Company Website</label>
                  <input
                    type="text"
                    value={exp.company_url || ''}
                    onChange={(e) => handleUpdate(idx, { company_url: e.target.value })}
                    placeholder="https://..."
                    className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                  />
                </div>
              </div>

              {/* Main Role Description */}
              <div>
                <label className="text-[11px] font-semibold text-ink-3">Role Summary</label>
                <textarea
                  rows={2}
                  value={exp.description || ''}
                  onChange={(e) => handleUpdate(idx, { description: e.target.value })}
                  placeholder="Overview of your responsibilities and ownership..."
                  className="mt-1 w-full rounded-xl border border-line bg-surface p-3 text-xs leading-relaxed text-ink focus:outline-none resize-y"
                />
              </div>

              {/* Achievements / Bullet Points */}
              <div className="space-y-2 pt-2 border-t border-line/60">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-ink-3">Key Bullet Points</label>
                  <button
                    type="button"
                    onClick={() => handleAddBullet(idx)}
                    className="text-[10px] font-medium text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="size-3" />
                    <span>Add Bullet</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  {(exp.bullet_points || []).map((bullet, bIdx) => (
                    <div key={bIdx} className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-brand-500 shrink-0" />
                      <input
                        type="text"
                        value={bullet}
                        onChange={(e) => handleUpdateBullet(idx, bIdx, e.target.value)}
                        className="flex-1 rounded-lg border border-line bg-surface px-2.5 py-1 text-xs text-ink focus:outline-none"
                        placeholder="Bullet description..."
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveBullet(idx, bIdx)}
                        className="p-1 text-ink-3 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
