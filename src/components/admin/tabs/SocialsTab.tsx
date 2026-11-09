'use client';

import React from 'react';
import { Share2, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';
import { SocialLink } from '@/types/profile';

export const SocialsTab: React.FC = () => {
  const { content, updateSocialLinks } = usePortfolio();
  const socialLinks = Array.isArray(content.socialLinks) ? content.socialLinks : [];

  const handleUpdate = (idx: number, patch: Partial<SocialLink>) => {
    const updated = [...socialLinks];
    updated[idx] = { ...updated[idx], ...patch };
    updateSocialLinks(updated);
  };

  const handleAdd = () => {
    const newSocial: SocialLink = {
      id: `soc-${Date.now()}`,
      platform: 'github',
      label: 'GitHub',
      handle: '@username',
      url: 'https://github.com',
    };
    updateSocialLinks([...socialLinks, newSocial]);
  };

  const handleRemove = (idx: number) => {
    updateSocialLinks(socialLinks.filter((_, i) => i !== idx));
  };

  const handleMove = (idx: number, direction: 'up' | 'down') => {
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === socialLinks.length - 1) return;
    const target = direction === 'up' ? idx - 1 : idx + 1;
    const updated = [...socialLinks];
    const temp = updated[idx];
    updated[idx] = updated[target];
    updated[target] = temp;
    updateSocialLinks(updated);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="card-raised rounded-2xl border border-line bg-surface p-4 sm:p-6 shadow-xs space-y-5 sm:space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-line">
          <div className="flex items-center gap-2.5">
            <Share2 className="size-4.5 text-brand-500" />
            <div>
              <h2 className="text-sm font-bold text-ink">Social Channels & Links</h2>
              <p className="text-[11px] text-ink-3">
                Shown in the right sidebar &quot;Find me on&quot; card and the footer.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="btn btn-secondary h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="size-3.5" />
            <span>Add Channel</span>
          </button>
        </div>

        <div className="space-y-3">
          {socialLinks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-surface-2/40 p-8 text-center">
              <div className="size-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 grid place-items-center mx-auto mb-2.5">
                <Share2 className="size-4.5" />
              </div>
              <h3 className="text-xs font-semibold text-ink">No social channels listed</h3>
              <p className="text-[11px] text-ink-3 mt-1 max-w-xs mx-auto leading-relaxed">
                Click &quot;Add Channel&quot; above to link your social accounts.
              </p>
            </div>
          ) : (
            socialLinks.map((social, idx) => (
            <div
              key={social.id || idx}
              className="p-4 rounded-xl border border-line bg-surface-2/60 hover:bg-surface-2 transition-all space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <select
                    value={social.platform}
                    onChange={(e) =>
                      handleUpdate(idx, { platform: e.target.value as SocialLink['platform'] })
                    }
                    className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs text-ink font-semibold"
                  >
                    <option value="github">GitHub</option>
                    <option value="x">X / Twitter</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="telegram">Telegram</option>
                    <option value="facebook">Facebook</option>
                    <option value="youtube">YouTube</option>
                    <option value="peerlist">Peerlist</option>
                    <option value="producthunt">ProductHunt</option>
                    <option value="devto">Dev.to</option>
                    <option value="behance">Behance</option>
                  </select>

                  <span className="text-xs font-medium text-ink-3">
                    {social.handle || 'No handle set'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMove(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg text-ink-3 hover:text-ink disabled:opacity-30"
                    title="Move up"
                  >
                    <ChevronUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(idx, 'down')}
                    disabled={idx === socialLinks.length - 1}
                    className="p-1.5 rounded-lg text-ink-3 hover:text-ink disabled:opacity-30"
                    title="Move down"
                  >
                    <ChevronDown className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="p-1.5 rounded-lg text-ink-3 hover:text-rose-500 transition-colors ml-1"
                    title="Delete channel"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[11px] font-semibold text-ink-3">Display Handle</label>
                  <input
                    type="text"
                    value={social.handle}
                    onChange={(e) => handleUpdate(idx, { handle: e.target.value })}
                    placeholder="@username"
                    className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-ink-3">Profile URL</label>
                  <input
                    type="text"
                    value={social.url}
                    onChange={(e) => handleUpdate(idx, { url: e.target.value })}
                    placeholder="https://..."
                    className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))
        )}
        </div>
      </div>
    </div>
  );
};
