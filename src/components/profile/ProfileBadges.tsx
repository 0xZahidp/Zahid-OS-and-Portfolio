'use client';

import React from 'react';
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
  InertiaIcon,
  TailwindIcon,
  VSCodeIcon,
  PhpStormIcon,
  GitIcon,
  GitHubIcon,
} from '@/components/ui/Icons';
import { Sparkles } from 'lucide-react';

export const ProfileBadges: React.FC = () => {
  const { content } = usePortfolio();
  const skills = content.skills || [];

  if (skills.length === 0) {
    return null;
  }

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
    return <Sparkles className="size-3 shrink-0 opacity-70" />;
  };

  const tagClass =
    'inline-flex items-center gap-1.5 bg-surface border border-line text-muted hover:border-accent hover:text-text rounded-md px-2.5 py-1 text-xs font-mono transition-colors shadow-2xs select-none';

  return (
    <div className="mt-5 w-full">
      <ul className="flex flex-wrap gap-1.5 justify-start" aria-label="Skills and Tech Stack">
        {skills.map((skill) => (
          <li key={skill.id || skill.name}>
            <span className={tagClass}>
              {getSkillIcon(skill.id, skill.name)}
              <span>{skill.name}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
