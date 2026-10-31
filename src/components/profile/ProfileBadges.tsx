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
} from '@/components/ui/Icons';

export const ProfileBadges: React.FC = () => {
  return (
    <div className="space-y-2 mt-6 max-w-2xl mx-auto">
      {/* AI Tools */}
      <ul className="flex flex-wrap gap-1.5 justify-center" aria-label="AI tools">
        <li>
          <span
            className="pill ai-pill font-medium"
            style={{ ['--ai' as string]: '#d97757' }}
          >
            <ClaudeIcon className="size-3.5 shrink-0" />
            <span>Claude</span>
          </span>
        </li>
        <li>
          <span
            className="pill ai-pill font-medium"
            style={{ ['--ai' as string]: '#10a37f' }}
          >
            <OpenAIIcon className="size-3.5 shrink-0" />
            <span>OpenAI</span>
          </span>
        </li>
        <li>
          <span
            className="pill ai-pill font-medium"
            style={{ ['--ai' as string]: '#3186ff' }}
          >
            <AntigravityIcon className="size-3.5 shrink-0" />
            <span>Antigravity</span>
          </span>
        </li>
        <li>
          <span
            className="pill ai-pill font-medium"
            style={{ ['--ai' as string]: '#9a9897' }}
          >
            <OpenCodeIcon className="size-3.5 shrink-0" />
            <span>OpenCode</span>
          </span>
        </li>
      </ul>

      {/* Primary Tech Stack */}
      <ul className="flex flex-wrap gap-1.5 justify-center" aria-label="Tech stack">
        <li>
          <span className="pill font-medium">
            <LaravelIcon className="size-3.5 shrink-0" />
            <span>Laravel</span>
          </span>
        </li>
        <li>
          <span className="pill font-medium">
            <PHPIcon className="size-3.5 shrink-0" />
            <span>PHP</span>
          </span>
        </li>
        <li>
          <span className="pill font-medium">
            <JSIcon className="size-3.5 shrink-0" />
            <span>JavaScript</span>
          </span>
        </li>
        <li>
          <span className="pill font-medium">
            <LivewireIcon className="size-3.5 shrink-0" />
            <span>Livewire</span>
          </span>
        </li>
        <li>
          <span className="pill font-medium">
            <AlpineIcon className="size-3.5 shrink-0" />
            <span>Alpine.js</span>
          </span>
        </li>
        <li>
          <span className="pill font-medium">
            <VueIcon className="size-3.5 shrink-0" />
            <span>Vue.js</span>
          </span>
        </li>
        <li>
          <span className="pill font-medium">
            <InertiaIcon className="size-3.5 shrink-0" />
            <span>Inertia</span>
          </span>
        </li>
      </ul>

      {/* Additional Tools */}
      <ul className="flex flex-wrap gap-1.5 justify-center" aria-label="Additional tools">
        <li>
          <span className="pill font-medium">
            <TailwindIcon className="size-3.5 shrink-0" />
            <span>Tailwind CSS</span>
          </span>
        </li>
      </ul>
    </div>
  );
};
