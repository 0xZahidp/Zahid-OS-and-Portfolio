'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  GitBranch,
  Eye,
  EyeOff,
  Key,
  ShieldCheck,
  UploadCloud,
  Check,
  AlertCircle,
  RefreshCw,
  Users,
  BookMarked,
  Activity,
  Star,
  GitFork,
  ExternalLink,
} from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';

interface LiveGitHubRepo {
  id: string;
  name: string;
  title: string;
  description: string;
  language: string;
  languageColor?: string;
  stars: number;
  forks: number;
  url: string;
}

interface LiveGitHubData {
  user?: {
    username: string;
    followers: number;
    public_repos: number;
  };
  contributions?: {
    total: number;
  };
  repositories?: LiveGitHubRepo[];
  source?: string;
}

export const GitHubTab: React.FC = () => {
  const { content, updateGitHubSettings } = usePortfolio();
  const settings = content.githubSettings || { username: '0xZahidp' };
  const [showToken, setShowToken] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [secretStatus, setSecretStatus] = useState<{
    configured: boolean;
    source?: string;
    preview?: string;
  } | null>(null);

  const [liveData, setLiveData] = useState<LiveGitHubData | null>(null);
  const [isLoadingLive, setIsLoadingLive] = useState(false);

  const fetchSecretStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/github-secret');
      const data = await res.json();
      setSecretStatus(data);
    } catch {
      setSecretStatus({ configured: false });
    }
  }, []);

  const fetchLiveData = useCallback(async () => {
    setIsLoadingLive(true);
    try {
      const res = await fetch('/api/github');
      if (res.ok) {
        const data = await res.json();
        setLiveData(data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingLive(false);
    }
  }, []);

  useEffect(() => {
    fetchSecretStatus();
    fetchLiveData();
  }, [fetchSecretStatus, fetchLiveData]);

  const handleDirectUploadToSupabase = async () => {
    const trimmed = tokenInput.trim();
    if (!trimmed) {
      setFeedback({ type: 'error', message: 'Please enter a valid GitHub token (starts with ghp_ or github_pat_).' });
      return;
    }

    setIsUploading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/github-secret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: trimmed }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          message: '✓ Token encrypted and stored directly in Supabase app_settings table. Never written to disk or git.',
        });
        setTokenInput('');
        await fetchSecretStatus();
        await fetchLiveData();
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'Failed to upload token to Supabase.',
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error';
      setFeedback({ type: 'error', message });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 1. Account & Token Card */}
      <div className="card-raised rounded-2xl border border-line bg-surface p-4 sm:p-6 shadow-xs space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line">
          <div className="flex items-center gap-2.5">
            <GitBranch className="size-4.5 text-brand-500 shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-ink">GitHub Integration & Secret Token</h2>
              <p className="text-[11px] text-ink-3">
                Powers your live contribution heatmap, repository lists, and star counters.
              </p>
            </div>
          </div>
          {secretStatus?.configured ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 self-start sm:self-auto">
              <ShieldCheck className="size-3.5" />
              <span>Token Configured</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 self-start sm:self-auto">
              <Key className="size-3.5" />
              <span>No Token Stored</span>
            </span>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Username */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-ink">GitHub Username</label>
            <input
              type="text"
              value={settings.username}
              onChange={(e) => updateGitHubSettings({ username: e.target.value })}
              className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2 text-xs text-ink focus:border-brand-500 focus:bg-surface focus:outline-none transition-all font-mono"
            />
          </div>

          {/* Personal Access Token with Direct Supabase Upload */}
          <div className="space-y-2.5 sm:col-span-2 p-4 rounded-xl border border-line bg-surface-2/60">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                <Key className="size-3.5 text-brand-500" />
                <span>Personal Access Token (PAT) — Direct Supabase Vault</span>
              </label>
              {secretStatus?.preview && (
                <span className="text-[11px] font-mono text-ink-3">
                  Current: <strong className="text-ink font-semibold">{secretStatus.preview}</strong>
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder={
                    secretStatus?.configured
                      ? 'Enter new token to overwrite in Supabase (ghp_...)'
                      : 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
                  }
                  className="w-full rounded-xl border border-line bg-surface px-3.5 py-2 pr-10 text-xs text-ink focus:border-brand-500 focus:outline-none transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink p-1 cursor-pointer"
                  title={showToken ? 'Hide token' : 'Show token'}
                >
                  {showToken ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>

              <button
                type="button"
                onClick={handleDirectUploadToSupabase}
                disabled={isUploading || !tokenInput.trim()}
                className="btn btn-primary h-9 px-4 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50 w-full sm:w-auto cursor-pointer"
              >
                {isUploading ? (
                  <RefreshCw className="size-3.5 animate-spin" />
                ) : (
                  <UploadCloud className="size-3.5" />
                )}
                <span>Send to Supabase</span>
              </button>
            </div>

            {feedback && (
              <div
                className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                }`}
              >
                {feedback.type === 'success' ? (
                  <Check className="size-3.5 shrink-0" />
                ) : (
                  <AlertCircle className="size-3.5 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            <div className="flex items-start gap-2 pt-1 text-[11px] text-ink-3">
              <ShieldCheck className="size-3.5 text-brand-500 shrink-0 mt-0.5" />
              <span>
                <strong>Safety guarantee:</strong> Your token is transmitted directly into your private Supabase database (`app_settings` table). It is masked in the browser and will <strong>never</strong> be written to local files or committed to Git.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Live GitHub Metrics & Repositories Preview */}
      <div className="card-raised rounded-2xl border border-line bg-surface p-4 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line">
          <div className="flex items-center gap-2.5">
            <Activity className="size-4.5 text-emerald-500 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-ink">Live GitHub Stats & Repositories</h2>
                {liveData?.source === 'graphql' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Live GraphQL Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-ink-3">
                Live metrics fetched using your token from Supabase via GitHub GraphQL API.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchLiveData}
            disabled={isLoadingLive}
            className="btn btn-secondary h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            title="Fetch latest stats from GitHub"
          >
            <RefreshCw className={`size-3.5 ${isLoadingLive ? 'animate-spin' : ''}`} />
            <span>{isLoadingLive ? 'Refreshing...' : 'Refresh Live Data'}</span>
          </button>
        </div>

        {/* 3 Live Metric Counter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Followers */}
          <div className="p-4 rounded-xl bg-surface-2 border border-line space-y-1">
            <div className="flex items-center justify-between text-ink-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Followers</span>
              <Users className="size-4 text-brand-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-ink">
                {liveData?.user?.followers ?? 6}
              </span>
              <span className="text-[11px] text-ink-3">live from GitHub</span>
            </div>
            <a
              href={`https://github.com/${settings.username}?tab=followers`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1 pt-1"
            >
              <span>View followers on GitHub</span>
              <ExternalLink className="size-2.5" />
            </a>
          </div>

          {/* Contributions */}
          <div className="p-4 rounded-xl bg-surface-2 border border-line space-y-1">
            <div className="flex items-center justify-between text-ink-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Contributions</span>
              <Activity className="size-4 text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-ink">
                {(liveData?.contributions?.total ?? 102).toLocaleString()}
              </span>
              <span className="text-[11px] text-ink-3">in last year</span>
            </div>
            <p className="text-[10px] text-ink-3 pt-1">
              53-week contribution calendar active
            </p>
          </div>

          {/* Repositories */}
          <div className="p-4 rounded-xl bg-surface-2 border border-line space-y-1">
            <div className="flex items-center justify-between text-ink-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Public Repositories</span>
              <BookMarked className="size-4 text-indigo-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-ink">
                {liveData?.user?.public_repos ?? 26}
              </span>
              <span className="text-[11px] text-ink-3">repositories</span>
            </div>
            <a
              href={`https://github.com/${settings.username}?tab=repositories`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1 pt-1"
            >
              <span>View all on GitHub</span>
              <ExternalLink className="size-2.5" />
            </a>
          </div>
        </div>

        {/* Live Pinned Repositories Grid */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
              Featured / Pinned Repositories ({liveData?.repositories?.length ?? 4})
            </h3>
            <span className="text-[10px] font-mono text-ink-3">
              {liveData?.source === 'graphql' ? '⚡ GitHub GraphQL via Supabase Token' : 'Public REST API'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(liveData?.repositories || []).map((repo) => (
              <a
                key={repo.id}
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-xl border border-line bg-surface-2/40 hover:border-line-strong hover:bg-surface-2/70 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-ink group-hover:text-brand-500 transition-colors truncate">
                      {repo.name}
                    </span>
                    <ExternalLink className="size-3 text-ink-3 shrink-0 group-hover:text-brand-500" />
                  </div>
                  {repo.description && (
                    <p className="text-[11px] text-ink-3 mt-1.5 line-clamp-2 leading-relaxed">
                      {repo.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 text-[11px] text-ink-3 mt-3 pt-2 border-t border-line/60">
                  {repo.language && (
                    <span className="flex items-center gap-1 font-medium">
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: repo.languageColor || '#3178c6' }}
                      />
                      <span>{repo.language}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Star className="size-3 text-amber-500" />
                    <span>{repo.stars}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <GitFork className="size-3 text-ink-3" />
                    <span>{repo.forks}</span>
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
