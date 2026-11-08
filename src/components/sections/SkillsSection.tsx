'use client';

import React from 'react';
import { Target, Download, Sparkles } from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';
import {
  TablerTools,
  ClaudeIcon,
  OpenAIIcon,
  AntigravityIcon,
  OpenCodeIcon,
  LaravelIcon,
  PHPIcon,
  JSIcon,
  LivewireIcon,
  AlpineIcon,
  VueIcon,
  InertiaIcon,
  TailwindIcon,
  VSCodeIcon,
  PhpStormIcon,
  GitIcon,
  GitHubIcon,
} from '@/components/ui/Icons';

export const SkillsSection: React.FC = () => {
  const { content, isLoading } = usePortfolio();
  const skills = content.skills || [];

  const aiSkills = skills.filter((s) => s.category === 'ai');
  const techSkills = skills.filter((s) => s.category === 'tech');
  const toolSkills = skills.filter((s) => s.category === 'tool');
  const topSkills = skills.slice(0, 5);

  const getSkillIcon = (id: string, name: string) => {
    const key = (id || name).toLowerCase();
    if (key.includes('claude')) return <ClaudeIcon className="size-3.5 shrink-0" />;
    if (key.includes('openai') || key.includes('gpt')) return <OpenAIIcon className="size-3.5 shrink-0" />;
    if (key.includes('antigravity')) return <AntigravityIcon className="size-3.5 shrink-0" />;
    if (key.includes('opencode')) return <OpenCodeIcon className="size-3.5 shrink-0" />;
    if (key.includes('laravel')) return <LaravelIcon className="size-3.5 shrink-0" />;
    if (key.includes('php')) return <PHPIcon className="size-3.5 shrink-0" />;
    if (key.includes('javascript') || key === 'js') return <JSIcon className="size-3.5 shrink-0" />;
    if (key.includes('livewire')) return <LivewireIcon className="size-3.5 shrink-0" />;
    if (key.includes('alpine')) return <AlpineIcon className="size-3.5 shrink-0" />;
    if (key.includes('vue')) return <VueIcon className="size-3.5 shrink-0" />;
    if (key.includes('inertia')) return <InertiaIcon className="size-3.5 shrink-0" />;
    if (key.includes('tailwind')) return <TailwindIcon className="size-3.5 shrink-0" />;
    if (key.includes('vscode')) return <VSCodeIcon className="size-3.5 shrink-0" />;
    if (key.includes('phpstorm')) return <PhpStormIcon className="size-3.5 shrink-0" />;
    if (key === 'git') return <GitIcon className="size-3.5 shrink-0" />;
    if (key.includes('github')) return <GitHubIcon className="size-3.5 shrink-0" />;
    return <Sparkles className="size-3 shrink-0 text-brand-500 opacity-70" />;
  };

  return (
    <div id="skills" className="space-y-10 mt-10 scroll-mt-20">
      {isLoading ? (
        <div className="space-y-6 animate-pulse" aria-hidden="true">
          <div className="h-6 w-36 bg-surface-2 rounded-md" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-10 rounded-xl bg-surface-2 ring-1 ring-line/50" />
            ))}
          </div>
        </div>
      ) : skills.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-line bg-surface-2/40 p-8 sm:p-10 text-center">
          <div className="size-12 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 grid place-items-center mx-auto mb-3">
            <Target className="size-5" />
          </div>
          <h3 className="text-sm font-semibold text-ink">Skills & Tech Stack Coming Soon</h3>
          <p className="text-xs text-ink-3 mt-1.5 max-w-sm mx-auto leading-relaxed">
            Technical competencies, frameworks, and developer toolchains are being updated in the CMS.
          </p>
        </div>
      ) : (
        <>
          {/* Top Skills */}
          {topSkills.length > 0 && (
            <section aria-labelledby="top-skills-heading">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2
                  id="top-skills-heading"
                  className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-ink"
                >
                  <Target className="size-6 shrink-0 text-ink" />
                  <span>Top skills</span>
                </h2>
              </div>
              <ul className="flex flex-wrap gap-2.5">
                {topSkills.map((skill) => (
                  <li
                    key={skill.id || skill.name}
                    className="inline-flex items-center gap-2 rounded-full bg-surface-2 px-3.5 py-1.5 text-xs font-semibold text-ink border border-line shadow-xs transition-transform hover:-translate-y-0.5 cursor-default select-none"
                  >
                    <span className="size-1.5 rounded-full bg-brand-500" />
                    <span>{skill.name}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Skills and Tools */}
          <section aria-labelledby="skills-heading">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2
            id="skills-heading"
            className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-ink"
          >
            <TablerTools className="size-6 shrink-0 text-ink" />
            <span>Skills and tools</span>
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {/* Row 1 (AI & Agents) */}
          {aiSkills.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="AI and Agents">
              {aiSkills.map((skill) => (
                <li key={skill.id || skill.name}>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-orange-200 bg-orange-50/40 text-orange-950 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_1.5px_3px_rgba(234,88,12,0.08)] dark:border-orange-500/30 dark:bg-orange-950/20 dark:text-orange-200 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_1.5px_3px_rgba(0,0,0,0.4)] transition-transform hover:-translate-y-0.5 cursor-default select-none">
                    {getSkillIcon(skill.id, skill.name)}
                    <span>{skill.name}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* Row 2 (Frameworks & Web) */}
          {techSkills.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Frameworks and Web">
              {techSkills.map((skill) => (
                <li key={skill.id || skill.name}>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-200/80 bg-gradient-to-b from-white to-gray-50/80 text-gray-800 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_1.5px_3px_rgba(0,0,0,0.05)] dark:from-zinc-800 dark:to-zinc-900/90 dark:border-white/10 dark:text-zinc-200 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_1.5px_3px_rgba(0,0,0,0.4)] transition-transform hover:-translate-y-0.5 cursor-default select-none">
                    {getSkillIcon(skill.id, skill.name)}
                    <span>{skill.name}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* Row 3 (Tools & VCS) */}
          {toolSkills.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Tools and VCS">
              {toolSkills.map((skill) => (
                <li key={skill.id || skill.name}>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-200/80 bg-gradient-to-b from-white to-gray-50/80 text-gray-800 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_1.5px_3px_rgba(0,0,0,0.05)] dark:from-zinc-800 dark:to-zinc-900/90 dark:border-white/10 dark:text-zinc-200 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_1.5px_3px_rgba(0,0,0,0.4)] transition-transform hover:-translate-y-0.5 cursor-default select-none">
                    {getSkillIcon(skill.id, skill.name)}
                    <span>{skill.name}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* PDF Resume Note Card */}
        <div className="mt-8 rounded-2xl border border-line bg-surface-2/40 p-4 text-center text-sm text-ink-2">
          <p className="flex items-center justify-center gap-2">
            <Download className="size-4 text-brand-600 dark:text-brand-400" />
            <span>
              PDF résumé coming later. Then again, after seeing this site, do you really need one?
            </span>
          </p>
        </div>
      </section>
    </>
  )}
</div>
  );
};
