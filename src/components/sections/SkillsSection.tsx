'use client';

import React from 'react';
import { Target, Sparkles, Code2, Server, Wrench, Bot } from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';
import {
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
  TailwindIcon,
  VSCodeIcon,
  GitIcon,
  GitHubIcon,
} from '@/components/ui/Icons';
import { Skill } from '@/types/profile';

export const SkillsSection: React.FC = () => {
  const { content, isLoading } = usePortfolio();
  const skills = content.skills || [];

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
    if (key.includes('tailwind')) return <TailwindIcon className="size-3.5 shrink-0" />;
    if (key.includes('vscode')) return <VSCodeIcon className="size-3.5 shrink-0" />;
    if (key === 'git') return <GitIcon className="size-3.5 shrink-0" />;
    if (key.includes('github')) return <GitHubIcon className="size-3.5 shrink-0" />;
    return <Sparkles className="size-3 shrink-0 text-accent opacity-75" />;
  };

  // Groupings as specified: AI tools, Frontend, Backend, Tools
  const aiSkills = skills.filter(
    (s) =>
      s.category === 'ai' ||
      ['claude', 'openai', 'antigravity', 'opencode', 'telegram-bot', 'python'].includes(s.id?.toLowerCase() || '')
  );

  const frontendSkills = skills.filter((s) => {
    const k = (s.id || s.name).toLowerCase();
    return (
      ['react', 'nextjs', 'typescript', 'javascript', 'tailwind', 'tanstack', 'vue', 'alpine'].some((t) => k.includes(t)) &&
      !aiSkills.includes(s)
    );
  });

  const backendSkills = skills.filter((s) => {
    const k = (s.id || s.name).toLowerCase();
    return (
      ['laravel', 'php', 'supabase', 'indexeddb', 'livewire', 'sql', 'postgres'].some((t) => k.includes(t)) &&
      !aiSkills.includes(s) &&
      !frontendSkills.includes(s)
  );
  });

  const toolSkills = skills.filter(
    (s) =>
      s.category === 'tool' ||
      (!aiSkills.includes(s) && !frontendSkills.includes(s) && !backendSkills.includes(s))
  );

  const skillGroups = [
    { title: 'AI & Automation', icon: Bot, items: aiSkills },
    { title: 'Frontend', icon: Code2, items: frontendSkills },
    { title: 'Backend & Data', icon: Server, items: backendSkills },
    { title: 'Tools & Platforms', icon: Wrench, items: toolSkills },
  ];

  return (
    <section id="skills" aria-labelledby="skills-heading" className="scroll-mt-20 space-y-6">
      <div className="flex items-center gap-2.5">
        <Target className="size-5 text-accent" />
        <h2
          id="skills-heading"
          className="text-xl font-bold tracking-tight text-text"
        >
          Skills &amp; Technologies
        </h2>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse" aria-hidden="true">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-surface border border-line" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {skillGroups.map((group) => {
            const Icon = group.icon;
            if (group.items.length === 0) return null;

            return (
              <div
                key={group.title}
                className="rounded-2xl border border-line bg-surface p-5 space-y-3.5"
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  <Icon className="size-3.5 text-accent" />
                  <span>{group.title}</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {group.items.map((skill: Skill) => (
                    <span
                      key={skill.id || skill.name}
                      className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-2 px-2.5 py-1 text-xs font-mono text-text transition-colors hover:border-accent select-none"
                    >
                      {getSkillIcon(skill.id, skill.name)}
                      <span>{skill.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
