'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Users, Plus, Trash2, ChevronUp, ChevronDown, RefreshCw, Check } from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';
import { FollowerRecommendation } from '@/types/profile';

export const PeopleTab: React.FC = () => {
  const { content, updateSuggestedPeople } = usePortfolio();
  const people = content.suggestedPeople;
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleSyncFromGitHub = async () => {
    try {
      setIsSyncing(true);
      setSyncMessage(null);
      const username = content.githubSettings?.username || '0xZahidp';
      const res = await fetch(`/api/github/following?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      if (data.people && Array.isArray(data.people) && data.people.length > 0) {
        updateSuggestedPeople(data.people);
        setSyncMessage(`Successfully synced ${data.people.length} creators from @${username} on GitHub!`);
      } else {
        setSyncMessage('No people found to sync.');
      }
    } catch (err) {
      console.error(err);
      setSyncMessage('Failed to sync from GitHub.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 4000);
    }
  };

  const handleUpdate = (idx: number, patch: Partial<FollowerRecommendation>) => {
    const updated = [...people];
    updated[idx] = { ...updated[idx], ...patch };
    updateSuggestedPeople(updated);
  };

  const handleAdd = () => {
    const newPerson: FollowerRecommendation = {
      id: `person-${Date.now()}`,
      name: 'Person Name',
      role: 'Creator & Developer',
      avatar_url: '/images/avatar.webp',
      url: 'https://x.com',
      handle: 'username',
    };
    updateSuggestedPeople([...people, newPerson]);
  };

  const handleRemove = (idx: number) => {
    updateSuggestedPeople(people.filter((_, i) => i !== idx));
  };

  const handleMove = (idx: number, direction: 'up' | 'down') => {
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === people.length - 1) return;
    const target = direction === 'up' ? idx - 1 : idx + 1;
    const updated = [...people];
    const temp = updated[idx];
    updated[idx] = updated[target];
    updated[target] = temp;
    updateSuggestedPeople(updated);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="card-raised rounded-2xl border border-line bg-surface p-4 sm:p-6 shadow-xs space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line">
          <div className="flex items-center gap-2.5">
            <Users className="size-4.5 text-brand-500 shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-ink">Who to Follow & Network</h2>
              <p className="text-[11px] text-ink-3">
                Recommended peers and creators displayed in the right sidebar.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={handleSyncFromGitHub}
              disabled={isSyncing}
              className="btn btn-secondary h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
              title="Fetch followed developers directly from GitHub"
            >
              <RefreshCw className={`size-3.5 ${isSyncing ? 'animate-spin text-brand-500' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync with GitHub'}</span>
            </button>
            <button
              type="button"
              onClick={handleAdd}
              className="btn btn-secondary h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="size-3.5" />
              <span>Add Person</span>
            </button>
          </div>
        </div>

        {syncMessage && (
          <div className="flex items-center gap-2 rounded-xl bg-brand-500/10 border border-brand-500/20 px-3.5 py-2 text-xs font-medium text-brand-600 dark:text-brand-400">
            <Check className="size-4 shrink-0 text-brand-500" />
            <span>{syncMessage}</span>
          </div>
        )}

        <div className="space-y-3">
          {people.map((person, idx) => (
            <div
              key={person.id || idx}
              className="p-4 rounded-xl border border-line bg-surface-2/60 hover:bg-surface-2 transition-all space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative size-9 rounded-full overflow-hidden bg-surface border border-line shrink-0">
                    <Image
                      src={person.avatar_url}
                      alt={person.name}
                      fill
                      sizes="36px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-ink">{person.name}</h3>
                    <p className="text-[11px] text-ink-3">
                      @{person.handle} · {person.role}
                    </p>
                  </div>
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
                    disabled={idx === people.length - 1}
                    className="p-1.5 rounded-lg text-ink-3 hover:text-ink disabled:opacity-30"
                    title="Move down"
                  >
                    <ChevronDown className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="p-1.5 rounded-lg text-ink-3 hover:text-rose-500 transition-colors ml-1"
                    title="Delete person"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-[11px] font-semibold text-ink-3">Name</label>
                  <input
                    type="text"
                    value={person.name}
                    onChange={(e) => handleUpdate(idx, { name: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-ink-3">Handle</label>
                  <input
                    type="text"
                    value={person.handle}
                    onChange={(e) => handleUpdate(idx, { handle: e.target.value })}
                    placeholder="username"
                    className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-ink-3">Profile Link</label>
                  <input
                    type="text"
                    value={person.url}
                    onChange={(e) => handleUpdate(idx, { url: e.target.value })}
                    placeholder="https://..."
                    className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="text-[11px] font-semibold text-ink-3">Role / Bio</label>
                  <input
                    type="text"
                    value={person.role || ''}
                    onChange={(e) => handleUpdate(idx, { role: e.target.value })}
                    placeholder="e.g. Creator of Livewire and Alpine.js"
                    className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
