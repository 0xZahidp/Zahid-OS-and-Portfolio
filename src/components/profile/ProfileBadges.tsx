import React from 'react';
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

export const ProfileBadges: React.FC = () => {
  return (
    <div className="space-y-2 mt-6 max-w-2xl mx-auto">
      {/* AI Tools */}
      <ul className="flex flex-wrap gap-1.5 justify-center" aria-label="AI tools">
        <li>
          <span className="pill ai-pill">
            <ClaudeIcon className="size-3.5 shrink-0" />
            <span>Claude</span>
          </span>
        </li>
        <li>
          <span className="pill ai-pill">
            <OpenAIIcon className="size-3.5 shrink-0" />
            <span>OpenAI</span>
          </span>
        </li>
        <li>
          <span className="pill ai-pill">
            <AntigravityIcon className="size-3.5 shrink-0" />
            <span>Antigravity</span>
          </span>
        </li>
        <li>
          <span className="pill ai-pill">
            <OpenCodeIcon className="size-3.5 shrink-0" />
            <span>OpenCode</span>
          </span>
        </li>
      </ul>

      {/* Primary Tech Stack */}
      <ul className="flex flex-wrap gap-1.5 justify-center" aria-label="Tech stack">
        <li>
          <span className="pill">
            <LaravelIcon className="size-3.5 shrink-0" />
            <span>Laravel</span>
          </span>
        </li>
        <li>
          <span className="pill">
            <PHPIcon className="size-3.5 shrink-0" />
            <span>PHP</span>
          </span>
        </li>
        <li>
          <span className="pill">
            <JSIcon className="size-3.5 shrink-0" />
            <span>JavaScript</span>
          </span>
        </li>
        <li>
          <span className="pill">
            <LivewireIcon className="size-3.5 shrink-0" />
            <span>Livewire</span>
          </span>
        </li>
        <li>
          <span className="pill">
            <AlpineIcon className="size-3.5 shrink-0" />
            <span>Alpine.js</span>
          </span>
        </li>
        <li>
          <span className="pill">
            <VueIcon className="size-3.5 shrink-0" />
            <span>Vue.js</span>
          </span>
        </li>
        <li>
          <span className="pill">
            <InertiaIcon className="size-3.5 shrink-0" />
            <span>Inertia</span>
          </span>
        </li>
      </ul>

      {/* Additional Tools */}
      <ul className="flex flex-wrap gap-1.5 justify-center" aria-label="Additional tools">
        <li>
          <span className="pill">
            <TailwindIcon className="size-3.5 shrink-0" />
            <span>Tailwind CSS</span>
          </span>
        </li>
        <li className="hidden sm:inline-block">
          <span className="pill">
            <VSCodeIcon className="size-3.5 shrink-0" />
            <span>VS Code</span>
          </span>
        </li>
        <li className="hidden sm:inline-block">
          <span className="pill">
            <PhpStormIcon className="size-3.5 shrink-0" />
            <span>PhpStorm</span>
          </span>
        </li>
        <li className="hidden sm:inline-block">
          <span className="pill">
            <GitIcon className="size-3.5 shrink-0" />
            <span>Git</span>
          </span>
        </li>
        <li className="hidden sm:inline-block">
          <span className="pill">
            <GitHubIcon className="size-3.5 shrink-0" />
            <span>GitHub</span>
          </span>
        </li>
      </ul>
    </div>
  );
};

