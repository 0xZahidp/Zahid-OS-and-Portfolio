'use client';

import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';
import { Skill } from '@/types/profile';

export const SkillsTab: React.FC = () => {
  const { content, updateSkills } = usePortfolio();
  const skills = content.skills;

  const [inputAI, setInputAI] = useState('');
  const [inputWeb, setInputWeb] = useState('');
  const [inputTools, setInputTools] = useState('');

  // Group into 3 categories
  const aiSkills = skills.filter((s) => s.category === 'ai');
  const webSkills = skills.filter((s) => s.category === 'tech');
  const toolSkills = skills.filter((s) => s.category === 'tool');

  const handleAddSkill = (category: Skill['category'], name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) return;

    const newSkill: Skill = {
      id: trimmed.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: trimmed,
      category,
    };
    updateSkills([...skills, newSkill]);
  };

  const handleRemoveSkill = (name: string) => {
    updateSkills(skills.filter((s) => s.name !== name));
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="card-raised rounded-2xl border border-line bg-surface p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-line">
          <Sparkles className="size-4.5 text-brand-500" />
          <div>
            <h2 className="text-sm font-bold text-ink">Skills and Tools (3D Tactile Pills)</h2>
            <p className="text-[11px] text-ink-3">
              Grouped into 3 distinct tactile rows matching your reference design system.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Group 1: AI & Agents */}
          <div className="p-4.5 rounded-xl border border-line bg-surface-2/60 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-ink flex items-center gap-2">
                <span className="size-2 rounded-full bg-violet-500" />
                Row 1: AI & Agents ({aiSkills.length})
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {aiSkills.map((s) => (
                <span
                  key={s.name}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink shadow-xs hover:border-line-strong transition-all"
                >
                  <span>{s.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(s.name)}
                    className="text-ink-3 hover:text-rose-500 transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}

              <div className="inline-flex items-center gap-1.5">
                <input
                  type="text"
                  value={inputAI}
                  onChange={(e) => setInputAI(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill('ai', inputAI);
                      setInputAI('');
                    }
                  }}
                  placeholder="+ Add AI tool (Enter)..."
                  className="rounded-full border border-line bg-surface px-3 py-1 text-xs text-ink focus:outline-none w-38 shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Group 2: Frameworks & Web */}
          <div className="p-4.5 rounded-xl border border-line bg-surface-2/60 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-ink flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500" />
                Row 2: Frameworks & Web ({webSkills.length})
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {webSkills.map((s) => (
                <span
                  key={s.name}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink shadow-xs hover:border-line-strong transition-all"
                >
                  <span>{s.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(s.name)}
                    className="text-ink-3 hover:text-rose-500 transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}

              <div className="inline-flex items-center gap-1.5">
                <input
                  type="text"
                  value={inputWeb}
                  onChange={(e) => setInputWeb(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill('tech', inputWeb);
                      setInputWeb('');
                    }
                  }}
                  placeholder="+ Add framework (Enter)..."
                  className="rounded-full border border-line bg-surface px-3 py-1 text-xs text-ink focus:outline-none w-44 shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Group 3: Tools & VCS */}
          <div className="p-4.5 rounded-xl border border-line bg-surface-2/60 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-ink flex items-center gap-2">
                <span className="size-2 rounded-full bg-blue-500" />
                Row 3: Tools & VCS ({toolSkills.length})
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {toolSkills.map((s) => (
                <span
                  key={s.name}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink shadow-xs hover:border-line-strong transition-all"
                >
                  <span>{s.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(s.name)}
                    className="text-ink-3 hover:text-rose-500 transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}

              <div className="inline-flex items-center gap-1.5">
                <input
                  type="text"
                  value={inputTools}
                  onChange={(e) => setInputTools(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill('tool', inputTools);
                      setInputTools('');
                    }
                  }}
                  placeholder="+ Add tool (Enter)..."
                  className="rounded-full border border-line bg-surface px-3 py-1 text-xs text-ink focus:outline-none w-36 shadow-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
