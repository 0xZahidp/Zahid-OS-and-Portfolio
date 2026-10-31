import React from 'react';
import { Target, Download } from 'lucide-react';
import { topSkillsData } from '@/data/profile';
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
  return (
    <div id="skills" className="space-y-10 mt-10 scroll-mt-20">
      {/* Top Skills */}
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
          {topSkillsData.map((skill) => (
            <li
              key={skill}
              className="inline-flex items-center gap-2 rounded-full bg-surface-2 px-3.5 py-1.5 text-xs font-semibold text-ink border border-line shadow-xs transition-transform hover:-translate-y-0.5 cursor-default select-none"
            >
              <span className="size-1.5 rounded-full bg-brand-500" />
              <span>{skill}</span>
            </li>
          ))}
        </ul>
      </section>

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
          <ul className="flex flex-wrap gap-2" aria-label="AI and Agents">
            <li>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-orange-200 bg-orange-50/40 text-orange-950 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_1.5px_3px_rgba(234,88,12,0.08)] dark:border-orange-500/30 dark:bg-orange-950/20 dark:text-orange-200 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_1.5px_3px_rgba(0,0,0,0.4)] transition-transform hover:-translate-y-0.5 cursor-default select-none">
                <ClaudeIcon className="size-3.5 shrink-0" />
                <span>Claude</span>
              </span>
            </li>
            <li>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-emerald-200 bg-emerald-50/30 text-emerald-950 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_1.5px_3px_rgba(16,185,129,0.08)] dark:border-emerald-500/30 dark:bg-emerald-950/20 dark:text-emerald-200 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_1.5px_3px_rgba(0,0,0,0.4)] transition-transform hover:-translate-y-0.5 cursor-default select-none">
                <OpenAIIcon className="size-3.5 shrink-0" />
                <span>OpenAI</span>
              </span>
            </li>
            <li>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-sky-300 bg-sky-50/40 text-sky-950 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_0_8px_rgba(56,189,248,0.25)] dark:border-sky-500/40 dark:bg-sky-950/25 dark:text-sky-200 dark:shadow-[0_0_12px_rgba(56,189,248,0.2)] transition-transform hover:-translate-y-0.5 cursor-default select-none">
                <AntigravityIcon className="size-3.5 shrink-0" />
                <span>Antigravity</span>
              </span>
            </li>
            <li>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-zinc-300 bg-zinc-50/50 text-zinc-900 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_1.5px_3px_rgba(0,0,0,0.05)] dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_1.5px_3px_rgba(0,0,0,0.4)] transition-transform hover:-translate-y-0.5 cursor-default select-none">
                <OpenCodeIcon className="size-3.5 shrink-0" />
                <span>OpenCode</span>
              </span>
            </li>
          </ul>

          {/* Row 2 (Frameworks & Web) */}
          <ul className="flex flex-wrap gap-2" aria-label="Frameworks and Web">
            <li>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-200/80 bg-gradient-to-b from-white to-gray-50/80 text-gray-800 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_1.5px_3px_rgba(0,0,0,0.05)] dark:from-zinc-800 dark:to-zinc-900/90 dark:border-white/10 dark:text-zinc-200 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_1.5px_3px_rgba(0,0,0,0.4)] transition-transform hover:-translate-y-0.5 cursor-default select-none">
                <LaravelIcon className="size-3.5 shrink-0" />
                <span>Laravel</span>
              </span>
            </li>
            <li>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-200/80 bg-gradient-to-b from-white to-gray-50/80 text-gray-800 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_1.5px_3px_rgba(0,0,0,0.05)] dark:from-zinc-800 dark:to-zinc-900/90 dark:border-white/10 dark:text-zinc-200 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_1.5px_3px_rgba(0,0,0,0.4)] transition-transform hover:-translate-y-0.5 cursor-default select-none">
                <PHPIcon className="size-3.5 shrink-0" />
                <span>PHP</span>
              </span>
            </li>
            <li>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-200/80 bg-gradient-to-b from-white to-gray-50/80 text-gray-800 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_1.5px_3px_rgba(0,0,0,0.05)] dark:from-zinc-800 dark:to-zinc-900/90 dark:border-white/10 dark:text-zinc-200 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_1.5px_3px_rgba(0,0,0,0.4)] transition-transform hover:-translate-y-0.5 cursor-default select-none">
                <JSIcon className="size-3.5 shrink-0" />
                <span>JavaScript</span>
              </span>
            </li>
            <li>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-200/80 bg-gradient-to-b from-white to-gray-50/80 text-gray-800 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_1.5px_3px_rgba(0,0,0,0.05)] dark:from-zinc-800 dark:to-zinc-900/90 dark:border-white/10 dark:text-zinc-200 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_1.5px_3px_rgba(0,0,0,0.4)] transition-transform hover:-translate-y-0.5 cursor-default select-none">
                <LivewireIcon className="size-3.5 shrink-0" />
                <span>Livewire</span>
              </span>
            </li>
            <li>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-200/80 bg-gradient-to-b from-white to-gray-50/80 text-gray-800 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_1.5px_3px_rgba(0,0,0,0.05)] dark:from-zinc-800 dark:to-zinc-900/90 dark:border-white/10 dark:text-zinc-200 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_1.5px_3px_rgba(0,0,0,0.4)] transition-transform hover:-translate-y-0.5 cursor-default select-none">
                <AlpineIcon className="size-3.5 shrink-0" />
                <span>Alpine.js</span>
              </span>
            </li>
            <li>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-200/80 bg-gradient-to-b from-white to-gray-50/80 text-gray-800 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_1.5px_3px_rgba(0,0,0,0.05)] dark:from-zinc-800 dark:to-zinc-900/90 dark:border-white/10 dark:text-zinc-200 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_1.5px_3px_rgba(0,0,0,0.4)] transition-transform hover:-translate-y-0.5 cursor-default select-none">
                <VueIcon className="size-3.5 shrink-0" />
                <span>Vue.js</span>
              </span>
            </li>
            <li>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-200/80 bg-gradient-to-b from-white to-gray-50/80 text-gray-800 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_1.5px_3px_rgba(0,0,0,0.05)] dark:from-zinc-800 dark:to-zinc-900/90 dark:border-white/10 dark:text-zinc-200 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_1.5px_3px_rgba(0,0,0,0.4)] transition-transform hover:-translate-y-0.5 cursor-default select-none">
                <InertiaIcon className="size-3.5 shrink-0" />
                <span>Inertia</span>
              </span>
            </li>
            <li>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-200/80 bg-gradient-to-b from-white to-gray-50/80 text-gray-800 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_1.5px_3px_rgba(0,0,0,0.05)] dark:from-zinc-800 dark:to-zinc-900/90 dark:border-white/10 dark:text-zinc-200 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_1.5px_3px_rgba(0,0,0,0.4)] transition-transform hover:-translate-y-0.5 cursor-default select-none">
                <TailwindIcon className="size-3.5 shrink-0" />
                <span>Tailwind CSS</span>
              </span>
            </li>
          </ul>

          {/* Row 3 (Tools & VCS) */}
          <ul className="flex flex-wrap gap-2" aria-label="Tools and VCS">
            <li>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-200/80 bg-gradient-to-b from-white to-gray-50/80 text-gray-800 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_1.5px_3px_rgba(0,0,0,0.05)] dark:from-zinc-800 dark:to-zinc-900/90 dark:border-white/10 dark:text-zinc-200 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_1.5px_3px_rgba(0,0,0,0.4)] transition-transform hover:-translate-y-0.5 cursor-default select-none">
                <VSCodeIcon className="size-3.5 shrink-0" />
                <span>VS Code</span>
              </span>
            </li>
            <li>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-200/80 bg-gradient-to-b from-white to-gray-50/80 text-gray-800 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_1.5px_3px_rgba(0,0,0,0.05)] dark:from-zinc-800 dark:to-zinc-900/90 dark:border-white/10 dark:text-zinc-200 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_1.5px_3px_rgba(0,0,0,0.4)] transition-transform hover:-translate-y-0.5 cursor-default select-none">
                <PhpStormIcon className="size-3.5 shrink-0" />
                <span>PhpStorm</span>
              </span>
            </li>
            <li>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-200/80 bg-gradient-to-b from-white to-gray-50/80 text-gray-800 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_1.5px_3px_rgba(0,0,0,0.05)] dark:from-zinc-800 dark:to-zinc-900/90 dark:border-white/10 dark:text-zinc-200 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_1.5px_3px_rgba(0,0,0,0.4)] transition-transform hover:-translate-y-0.5 cursor-default select-none">
                <GitIcon className="size-3.5 shrink-0" />
                <span>Git</span>
              </span>
            </li>
            <li>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-200/80 bg-gradient-to-b from-white to-gray-50/80 text-gray-800 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_1.5px_3px_rgba(0,0,0,0.05)] dark:from-zinc-800 dark:to-zinc-900/90 dark:border-white/10 dark:text-zinc-200 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_1.5px_3px_rgba(0,0,0,0.4)] transition-transform hover:-translate-y-0.5 cursor-default select-none">
                <GitHubIcon className="size-3.5 shrink-0" />
                <span>GitHub</span>
              </span>
            </li>
          </ul>
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
    </div>
  );
};
