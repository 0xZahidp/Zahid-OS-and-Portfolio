'use client';

import React, { useState, useEffect } from 'react';
import { GitBranch, Eye, EyeOff, Key, ShieldCheck, UploadCloud, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';

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

  const fetchSecretStatus = async () => {
    try {
      const res = await fetch('/api/github-secret');
      const data = await res.json();
      setSecretStatus(data);
    } catch {
      setSecretStatus({ configured: false });
    }
  };

  useEffect(() => {
    fetchSecretStatus();
  }, []);

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
        fetchSecretStatus();
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
          <div className="space-y-1.5 sm:col-span-2">
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
