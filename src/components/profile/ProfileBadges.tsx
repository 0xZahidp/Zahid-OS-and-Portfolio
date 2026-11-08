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

  const aiSkills = skills.filter((s) => s.category === 'ai');
  const techSkills = skills.filter((s) => s.category === 'tech' || s.category === 'top');
  const toolSkills = skills.filter((s) => s.category === 'tool');
  const fallbackSkills = skills.filter(
    (s) => s.category !== 'ai' && s.category !== 'tech' && s.category !== 'top' && s.category !== 'tool'
  );

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

  const getAiColor = (id: string, name: string, color?: string) => {
    if (color) return color;
    const key = (id || name).toLowerCase();
    if (key.includes('claude')) return '#d97757';
    if (key.includes('openai') || key.includes('gpt')) return '#10a37f';
    if (key.includes('antigravity')) return '#3186ff';
    if (key.includes('opencode')) return '#9a9897';
    return '#8b5cf6';
  };

  return (
    <div className="space-y-2 mt-6 max-w-2xl mx-auto">
      {aiSkills.length > 0 && (
        <ul className="flex flex-wrap gap-1.5 justify-center" aria-label="AI tools">
          {aiSkills.map((skill) => (
            <li key={skill.id || skill.name}>
              <span
                className="pill ai-pill font-medium"
                style={{ ['--ai' as string]: getAiColor(skill.id, skill.name, skill.color) }}
              >
                {getSkillIcon(skill.id, skill.name)}
                <span>{skill.name}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {techSkills.length > 0 && (
        <ul className="flex flex-wrap gap-1.5 justify-center" aria-label="Tech stack">
          {techSkills.map((skill) => (
            <li key={skill.id || skill.name}>
              <span className="pill font-medium">
                {getSkillIcon(skill.id, skill.name)}
                <span>{skill.name}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {(toolSkills.length > 0 || fallbackSkills.length > 0) && (
        <ul className="flex flex-wrap gap-1.5 justify-center" aria-label="Additional tools">
          {[...toolSkills, ...fallbackSkills].map((skill) => (
            <li key={skill.id || skill.name}>
              <span className="pill font-medium">
                {getSkillIcon(skill.id, skill.name)}
                <span>{skill.name}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};