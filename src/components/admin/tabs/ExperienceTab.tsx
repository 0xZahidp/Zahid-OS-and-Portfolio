'use client';

import React from 'react';
import Image from 'next/image';
import { Plus, Trash2, ChevronUp, ChevronDown, Briefcase, Sparkles, Rocket, Code, Smartphone } from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';
import { Experience } from '@/types/profile';
import { CompanyLogoUploader } from '@/components/admin/CompanyLogoUploader';
import { DEFAULT_COMPANY_LOGO } from '@/lib/constants';

export const ExperienceTab: React.FC = () => {
  const { content, updateExperience } = usePortfolio();
  const experiences = Array.isArray(content.experience) ? content.experience : [];

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
      company_logo: '',
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

  const handleAddHighlight = (expIdx: number) => {
    const updated = [...experiences];
    const currentHighlights = updated[expIdx].highlights || [];
    updated[expIdx] = {
      ...updated[expIdx],
      highlights: [
        ...currentHighlights,
        { label: 'Highlight Label', value: 'Value', icon: 'rocket' },
      ],
    };
    updateExperience(updated);
  };

  const handleUpdateHighlight = (
    expIdx: number,
    hIdx: number,
    patch: Partial<{ label: string; value: string; icon: 'rocket' | 'code' | 'mobile' }>
  ) => {
    const updated = [...experiences];
    const currentHighlights = [...(updated[expIdx].highlights || [])];
    currentHighlights[hIdx] = { ...currentHighlights[hIdx], ...patch };
    updated[expIdx] = { ...updated[expIdx], highlights: currentHighlights };
    updateExperience(updated);
  };

  const handleRemoveHighlight = (expIdx: number, hIdx: number) => {
    const updated = [...experiences];
    const currentHighlights = (updated[expIdx].highlights || []).filter((_, i) => i !== hIdx);
    updated[expIdx] = { ...updated[expIdx], highlights: currentHighlights };
    updateExperience(updated);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="card-raised rounded-2xl border border-line bg-surface p-4 sm:p-6 shadow-xs space-y-5 sm:space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-line">
          <div className="flex items-center gap-2.5">
            <Briefcase className="size-4.5 text-brand-500 shrink-0" />
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
            className="btn btn-secondary h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shrink-0"
          >
            <Plus className="size-3.5" />
            <span className="hidden xs:inline">Add Position</span>
          </button>
        </div>

        {/* Clear Image & Icon Sizing Guideline Banner */}
        <div className="p-3.5 rounded-xl border border-brand-500/20 bg-brand-500/5 text-xs text-ink-2 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-brand-700 dark:text-brand-300">
            <Sparkles className="size-3.5" />
            <span>Company Logo & Icon Upload Instructions</span>
          </div>
          <p className="text-[11px] leading-relaxed text-ink-3">
            • <strong>Target Dimensions</strong>: Exactly <strong>64 × 64 px</strong> (1:1 square ratio) for high-DPI retina sharpness.
            <br />
            • <strong>Automatic Optimization</strong>: Upload any image of any size (e.g. 500×500, 1080p, or 4K photo). It is automatically center-cropped and optimized to <strong>exact 64×64 px</strong> without distortion or file bloat.
            <br />
            • <strong>Recommended Formats</strong>: Transparent PNG, SVG, or WebP for optimal contrast in dark and light modes.
          </p>
        </div>

        <div className="space-y-4">
          {experiences.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-surface-2/40 p-8 text-center">
              <div className="size-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 grid place-items-center mx-auto mb-2.5">
                <Briefcase className="size-4.5" />
              </div>
              <h3 className="text-xs font-semibold text-ink">No experiences listed</h3>
              <p className="text-[11px] text-ink-3 mt-1 max-w-xs mx-auto leading-relaxed">
                Click &quot;Add Experience&quot; above to create your first career timeline entry.
              </p>
            </div>
          ) : (
            experiences.map((exp, idx) => (
            <div
              key={exp.id || idx}
              className="p-3.5 sm:p-5 rounded-2xl border border-line bg-surface-2/60 hover:bg-surface-2 transition-all space-y-4"
            >
              {/* Header row with move/delete controls */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative size-10 rounded-xl overflow-hidden bg-surface border border-line shrink-0 flex items-center justify-center">
                    <Image
                      src={exp.company_logo?.trim() || DEFAULT_COMPANY_LOGO}
                      alt={exp.company}
                      fill
                      sizes="40px"
                      className="object-cover"
                      unoptimized
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = DEFAULT_COMPANY_LOGO;
                      }}
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

              {/* Company Logo / Icon Uploader with Auto-Optimization */}
              <div className="pt-2 border-t border-line/60">
                <CompanyLogoUploader
                  currentLogo={exp.company_logo || ''}
                  companyName={exp.company}
                  label="Company Logo / Icon"
                  onLogoChange={(newLogoUrl) => handleUpdate(idx, { company_logo: newLogoUrl })}
                />
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

              {/* Stat Highlights (Callout Cards) */}
              <div className="space-y-2 pt-2 border-t border-line/60">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-[11px] font-semibold text-ink-3">Stat Highlights / Metrics</label>
                    <p className="text-[10px] text-ink-4">Callout cards displayed below the role summary (e.g. &quot;3 Real Projects&quot;, &quot;Salesforce&quot;)</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddHighlight(idx)}
                    className="text-[10px] font-medium text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="size-3" />
                    <span>Add Highlight</span>
                  </button>
                </div>

                {(exp.highlights || []).length === 0 ? (
                  <p className="text-[11px] text-ink-4 italic">No highlights added yet (optional).</p>
                ) : (
                  <div className="grid gap-2.5 sm:grid-cols-3">
                    {(exp.highlights || []).map((h, hIdx) => (
                      <div
                        key={hIdx}
                        className="p-2.5 rounded-xl border border-line bg-surface space-y-2 relative"
                      >
                        <div className="flex items-center justify-between gap-1">
                          {/* Icon Selector */}
                          <div className="flex items-center gap-1">
                            {(['rocket', 'code', 'mobile'] as const).map((ic) => (
                              <button
                                key={ic}
                                type="button"
                                onClick={() => handleUpdateHighlight(idx, hIdx, { icon: ic })}
                                className={`size-6 rounded-md grid place-items-center text-xs transition-colors cursor-pointer ${
                                  h.icon === ic
                                    ? 'bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/30'
                                    : 'text-ink-4 hover:text-ink hover:bg-surface-2'
                                }`}
                                title={`Icon: ${ic}`}
                              >
                                {ic === 'rocket' && <Rocket className="size-3" />}
                                {ic === 'code' && <Code className="size-3" />}
                                {ic === 'mobile' && <Smartphone className="size-3" />}
                              </button>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveHighlight(idx, hIdx)}
                            className="p-1 rounded text-ink-4 hover:text-rose-500 transition-colors cursor-pointer"
                            title="Remove highlight"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>

                        <div>
                          <label className="text-[9px] uppercase font-bold tracking-wider text-ink-4 block">Value</label>
                          <input
                            type="text"
                            value={h.value}
                            onChange={(e) => handleUpdateHighlight(idx, hIdx, { value: e.target.value })}
                            placeholder="e.g. 3 Real Projects"
                            className="w-full rounded-lg border border-line bg-surface-2 px-2 py-1 text-xs font-semibold text-ink focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] uppercase font-bold tracking-wider text-ink-4 block">Label</label>
                          <input
                            type="text"
                            value={h.label}
                            onChange={(e) => handleUpdateHighlight(idx, hIdx, { label: e.target.value })}
                            placeholder="e.g. Projects Completed"
                            className="w-full rounded-lg border border-line bg-surface-2 px-2 py-1 text-xs text-ink focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
          ))
        )}
        </div>
      </div>
    </div>
  );
};
