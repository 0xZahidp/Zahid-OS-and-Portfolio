import React from 'react';
import { Target, Wrench, Download } from 'lucide-react';
import { topSkillsData } from '@/data/profile';
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

export const SkillsSection: React.FC = () => {
  return (
    <div id="skills" className="space-y-10 mt-10 scroll-mt-20">
      {/* Top Skills */}
      <section aria-labelledby="top-skills-heading">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2
            id="top-skills-heading"
            className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-ink"
          >
            <Target className="size-6 shrink-0 text-ink" />
            <span>Top skills</span>
          </h2>
        </div>
        <ul className="flex flex-wrap gap-2.5">
          {topSkillsData.map((skill) => (
            <li key={skill} className="badge">
              {skill}
            </li>
          ))}
        </ul>
      </section>

      {/* Skills and Tools */}
      <section aria-labelledby="skills-heading">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2
            id="skills-heading"
            className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-ink"
          >
            <Wrench className="size-6 shrink-0 text-ink" />
            <span>Skills and tools</span>
          </h2>
        </div>

        <div className="space-y-2">
          {/* AI Tools */}
          <ul className="flex flex-wrap gap-1.5" aria-label="AI tools">
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

          {/* Tech Stack */}
          <ul className="flex flex-wrap gap-1.5" aria-label="Tech stack">
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
            <li>
              <span className="pill">
                <TailwindIcon className="size-3.5 shrink-0" />
                <span>Tailwind CSS</span>
              </span>
            </li>
            <li>
              <span className="pill">
                <VSCodeIcon className="size-3.5 shrink-0" />
                <span>VS Code</span>
              </span>
            </li>
            <li>
              <span className="pill">
                <PhpStormIcon className="size-3.5 shrink-0" />
                <span>PhpStorm</span>
              </span>
            </li>
            <li>
              <span className="pill">
                <GitIcon className="size-3.5 shrink-0" />
                <span>Git</span>
              </span>
            </li>
            <li>
              <span className="pill">
                <GitHubIcon className="size-3.5 shrink-0" />
                <span>GitHub</span>
              </span>
            </li>
          </ul>
        </div>

        {/* PDF Resume Note Card */}
        <div className="mt-8 rounded-xl border border-line bg-surface/50 p-4 text-center text-sm text-ink-2">
          <p className="flex items-center justify-center gap-2">
            <Download className="size-4 text-link" />
            <span>
              PDF résumé coming later. Then again, after seeing this site, do you really need one?
            </span>
          </p>
        </div>
      </section>
    </div>
  );
};

