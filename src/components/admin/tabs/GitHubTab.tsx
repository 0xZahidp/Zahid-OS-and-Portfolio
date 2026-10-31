'use client';

import React, { useState } from 'react';
import { GitBranch, Eye, EyeOff, Key } from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';

export const GitHubTab: React.FC = () => {
  const { content, updateGitHubSettings } = usePortfolio();
  const settings = content.githubSettings || { username: '0xZahidp' };
  const [showToken, setShowToken] = useState(false);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 1. Account & Token Card */}
      <div className="card-raised rounded-2xl border border-line bg-surface p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-line">
          <GitBranch className="size-4.5 text-brand-500" />
          <div>
            <h2 className="text-sm font-bold text-ink">GitHub Integration & Token</h2>
            <p className="text-[11px] text-ink-3">
              Powers your live contribution heatmap, repository lists, and star counters.
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink">GitHub Username</label>
            <input
              type="text"
              value={settings.username}
              onChange={(e) => updateGitHubSettings({ username: e.target.value })}
              className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2 text-xs text-ink focus:border-brand-500 focus:bg-surface focus:outline-none transition-all font-mono"
            />
          </div>

          {/* Personal Access Token */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                <Key className="size-3 text-ink-3" />
                <span>Personal Access Token (PAT)</span>
              </label>
              <span className="text-[10px] text-ink-3 font-medium">Stored securely in Supabase</span>
            </div>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={settings.token || ''}
                onChange={(e) => updateGitHubSettings({ token: e.target.value })}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2 pr-10 text-xs text-ink focus:border-brand-500 focus:bg-surface focus:outline-none transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink p-1"
                title={showToken ? 'Hide token' : 'Show token'}
              >
                {showToken ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
            <p className="text-[11px] text-ink-3">
              Optional but increases GitHub API limits from 60 to 5,000 requests/hr.
            </p>
          </div>

          {/* Followers count override */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink">Followers Count Override</label>
            <input
              type="number"
              value={settings.followersCount ?? ''}
              onChange={(e) =>
                updateGitHubSettings({
                  followersCount: e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
              placeholder="e.g. 6 (leave blank for live count)"
              className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2 text-xs text-ink focus:border-brand-500 focus:bg-surface focus:outline-none transition-all font-mono"
            />
          </div>

          {/* Total Contributions Override */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink">Total Contributions Override</label>
            <input
              type="number"
              value={settings.totalContributions ?? ''}
              onChange={(e) =>
                updateGitHubSettings({
                  totalContributions: e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
              placeholder="e.g. 102 (leave blank for live count)"
              className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2 text-xs text-ink focus:border-brand-500 focus:bg-surface focus:outline-none transition-all font-mono"
            />
          </div>

          {/* Total Repos Override */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink">Total Repositories Override</label>
            <input
              type="number"
              value={settings.totalRepos ?? ''}
              onChange={(e) =>
                updateGitHubSettings({
                  totalRepos: e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
              placeholder="e.g. 26 (leave blank for live count)"
              className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2 text-xs text-ink focus:border-brand-500 focus:bg-surface focus:outline-none transition-all font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
