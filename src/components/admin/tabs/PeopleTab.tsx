'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Users,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Check,
  Globe,
  Quote as QuoteIcon,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';
import { FollowerRecommendation } from '@/types/profile';
import { CompanyLogoUploader } from '@/components/admin/CompanyLogoUploader';
import { defaultRecommendedPeople } from '@/data/default-people';
import {
  GitHubIcon,
  XIcon,
  LinkedInIcon,
  FacebookIcon,
  YouTubeIcon,
} from '@/components/ui/Icons';

type SupportedPlatform = 'x' | 'github' | 'linkedin' | 'facebook' | 'youtube' | 'website';

const PLATFORM_OPTIONS: { id: SupportedPlatform; label: string; icon: React.ReactNode; placeholder: string }[] = [
  { id: 'x', label: 'X (Twitter)', icon: <XIcon className="size-3.5" />, placeholder: 'https://x.com/username' },
  { id: 'github', label: 'GitHub', icon: <GitHubIcon className="size-3.5" />, placeholder: 'https://github.com/username' },
  { id: 'linkedin', label: 'LinkedIn', icon: <LinkedInIcon className="size-3.5" />, placeholder: 'https://linkedin.com/in/username' },
  { id: 'facebook', label: 'Facebook', icon: <FacebookIcon className="size-3.5" />, placeholder: 'https://facebook.com/username' },
  { id: 'youtube', label: 'YouTube', icon: <YouTubeIcon className="size-3.5 text-red-500" />, placeholder: 'https://youtube.com/@channel' },
  { id: 'website', label: 'Website / Blog', icon: <Globe className="size-3.5" />, placeholder: 'https://example.com' },
];

export const PeopleTab: React.FC = () => {
  const { content, updateSuggestedPeople } = usePortfolio();
  const people = Array.isArray(content.suggestedPeople) ? content.suggestedPeople : [];
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(people[0]?.id || null);

  const showNotification = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setSyncMessage({ text, type });
    setTimeout(() => setSyncMessage(null), 4500);
  };

  const handleSyncFromGitHub = async () => {
    try {
      setIsSyncing(true);
      const username = content.githubSettings?.username || '0xZahidp';
      const res = await fetch(`/api/github/following?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      if (data.people && Array.isArray(data.people) && data.people.length > 0) {
        updateSuggestedPeople(data.people);
        showNotification(`Successfully synced ${data.people.length} creators from @${username} on GitHub!`, 'success');
      } else {
        showNotification('No following profiles found to sync on GitHub.', 'info');
      }
    } catch (err) {
      console.error(err);
      showNotification('Failed to sync from GitHub. Please try again.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetToDefaultMentors = () => {
    if (window.confirm('Reset the list to the 11 recommended mentors & builders from the reference showcase?')) {
      updateSuggestedPeople(defaultRecommendedPeople);
      setExpandedId(defaultRecommendedPeople[0]?.id || null);
      showNotification('Loaded 11 mentors & builders with rich quotes, tags, and multi-platform links!', 'success');
    }
  };

  const handleUpdate = (idx: number, patch: Partial<FollowerRecommendation>) => {
    const updated = [...people];
    updated[idx] = { ...updated[idx], ...patch };
    updateSuggestedPeople(updated);
  };

  const handleAdd = () => {
    const newId = `person-${Date.now()}`;
    const newPerson: FollowerRecommendation = {
      id: newId,
      name: 'New Person',
      role: 'Full Stack Engineer & Open Source Contributor',
      avatar_url: '/images/avatar.webp',
      url: 'https://x.com',
      handle: 'username',
      verified: false,
      primaryHandle: '@username',
      primaryPlatform: 'x',
      primaryUrl: 'https://x.com/username',
      quote: '',
      tags: ['Engineering', 'Open source'],
      platforms: [{ platform: 'x', url: 'https://x.com/username' }],
    };
    updateSuggestedPeople([...people, newPerson]);
    setExpandedId(newId);
    showNotification('Added new person. Fill out their profile options below.', 'info');
  };

  const handleRemove = (idx: number) => {
    const personName = people[idx]?.name || 'Person';
    if (window.confirm(`Delete "${personName}" from Who to Connect?`)) {
      const updated = people.filter((_, i) => i !== idx);
      updateSuggestedPeople(updated);
      showNotification(`Removed "${personName}".`, 'info');
    }
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

  const handlePlatformUrlChange = (personIdx: number, platform: SupportedPlatform, url: string) => {
    const person = people[personIdx];
    const currentPlatforms = [...(person.platforms || [])];
    const cleanUrl = url.trim();

    const existingIdx = currentPlatforms.findIndex((p) => p.platform === platform);
    if (cleanUrl) {
      if (existingIdx >= 0) {
        currentPlatforms[existingIdx] = { platform, url: cleanUrl };
      } else {
        currentPlatforms.push({ platform, url: cleanUrl });
      }
    } else {
      if (existingIdx >= 0) {
        currentPlatforms.splice(existingIdx, 1);
      }
    }

    const patch: Partial<FollowerRecommendation> = { platforms: currentPlatforms };
    // If updating the primary platform's url, sync primaryUrl & url
    if (person.primaryPlatform === platform && cleanUrl) {
      patch.primaryUrl = cleanUrl;
      patch.url = cleanUrl;
    }
    handleUpdate(personIdx, patch);
  };

  const handlePrimaryPlatformChange = (personIdx: number, newPlatform: SupportedPlatform) => {
    const person = people[personIdx];
    const currentPlatforms = person.platforms || [];
    const matchingPlatform = currentPlatforms.find((p) => p.platform === newPlatform);
    const primaryUrl = matchingPlatform ? matchingPlatform.url : person.primaryUrl || person.url || '';

    handleUpdate(personIdx, {
      primaryPlatform: newPlatform,
      primaryUrl,
      url: primaryUrl,
    });
  };

  const renderPlatformBadgeIcon = (platform: string) => {
    switch (platform) {
      case 'x':
        return <XIcon className="size-3" />;
      case 'github':
        return <GitHubIcon className="size-3" />;
      case 'linkedin':
        return <LinkedInIcon className="size-3" />;
      case 'facebook':
        return <FacebookIcon className="size-3" />;
      case 'youtube':
        return <YouTubeIcon className="size-3 text-red-500" />;
      case 'website':
      default:
        return <Globe className="size-3" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Toolbar */}
      <div className="card-raised rounded-2xl border border-line bg-surface p-4 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line">
          <div className="flex items-center gap-2.5">
            <Users className="size-5 text-brand-500 shrink-0" />
            <div>
              <h2 className="text-base font-bold text-ink flex items-center gap-2">
                <span>Who to Connect & Learn From</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-ink-3 font-semibold">
                  {people.length}
                </span>
              </h2>
              <p className="text-xs text-ink-3 mt-0.5">
                Builders, mentors, and peers displayed on the People page (/people) and right sidebar.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={handleResetToDefaultMentors}
              className="btn btn-secondary h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 hover:text-brand-500 transition-colors"
              title="Populate with the 11 reference mentors (Shaon, Emran, Caleb, etc.)"
            >
              <Sparkles className="size-3.5 text-brand-500" />
              <span>Reset to 11 Mentors</span>
            </button>

            <button
              type="button"
              onClick={handleSyncFromGitHub}
              disabled={isSyncing}
              className="btn btn-secondary h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
              title="Fetch followed developers directly from GitHub"
            >
              <RefreshCw className={`size-3.5 ${isSyncing ? 'animate-spin text-brand-500' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync GitHub'}</span>
            </button>

            <button
              type="button"
              onClick={handleAdd}
              className="btn btn-primary h-8 px-3.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="size-3.5" />
              <span>Add Person</span>
            </button>
          </div>
        </div>

        {syncMessage && (
          <div
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-medium border ${
              syncMessage.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                : 'bg-brand-500/10 border-brand-500/20 text-brand-600 dark:text-brand-400'
            }`}
          >
            <Check className="size-4 shrink-0" />
            <span>{syncMessage.text}</span>
          </div>
        )}

        {/* People List */}
        <div className="space-y-3.5">
          {people.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-surface-2/40 p-8 text-center">
              <div className="size-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 grid place-items-center mx-auto mb-2.5">
                <Users className="size-4.5" />
              </div>
              <h3 className="text-xs font-semibold text-ink">No people or mentors listed</h3>
              <p className="text-[11px] text-ink-3 mt-1 max-w-xs mx-auto leading-relaxed">
                Click &quot;Add Person&quot; above or &quot;Sync GitHub Following&quot; to populate your curated directory.
              </p>
            </div>
          ) : (
            people.map((person, idx) => {
            const isExpanded = expandedId === person.id;
            const primaryPlat = person.primaryPlatform || 'x';
            const platformsList = person.platforms || [];

            return (
              <div
                key={person.id || idx}
                className={`rounded-2xl border transition-all duration-200 ${
                  isExpanded
                    ? 'border-brand-500/40 bg-surface shadow-sm'
                    : 'border-line bg-surface-2/40 hover:bg-surface-2/80'
                }`}
              >
                {/* Person Header / Summary Row */}
                <div
                  className="flex items-center justify-between gap-3 p-3.5 sm:p-4 cursor-pointer select-none"
                  onClick={() => setExpandedId(isExpanded ? null : person.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono font-semibold text-ink-3/70 w-5 shrink-0 text-center">
                      #{idx + 1}
                    </span>

                    {/* Avatar with Platform Overlay Badge */}
                    <div className="relative size-10 rounded-full shrink-0 overflow-hidden bg-surface border border-line">
                      <Image
                        src={person.avatar_url || '/images/avatar.webp'}
                        alt={person.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                        unoptimized
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 grid size-4 place-items-center rounded-full bg-surface border border-line shadow-xs">
                        {renderPlatformBadgeIcon(primaryPlat)}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-ink truncate">{person.name}</span>
                        {person.verified && (
                          <span
                            className="inline-flex items-center text-emerald-500 text-xs shrink-0"
                            title="Verified Mentor"
                          >
                            💚
                          </span>
                        )}
                        <span className="rounded-md bg-surface-2 px-1.5 py-0.2 text-[10px] font-mono text-ink-3 uppercase">
                          {primaryPlat}
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-3 truncate mt-0.5">
                        {person.primaryHandle || `@${person.handle || 'user'}`} · {person.role}
                      </p>
                    </div>
                  </div>

                  {/* Actions & Expand Chevron */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleMove(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg text-ink-3 hover:text-ink disabled:opacity-25"
                      title="Move up"
                    >
                      <ChevronUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(idx, 'down')}
                      disabled={idx === people.length - 1}
                      className="p-1.5 rounded-lg text-ink-3 hover:text-ink disabled:opacity-25"
                      title="Move down"
                    >
                      <ChevronDown className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      className="p-1.5 rounded-lg text-ink-3 hover:text-rose-500 transition-colors ml-1"
                      title="Delete person"
                    >
                      <Trash2 className="size-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : person.id)}
                      className="p-1.5 rounded-lg text-ink-3 hover:text-ink ml-1"
                      title={isExpanded ? 'Collapse' : 'Expand full options'}
                    >
                      <ChevronRight
                        className={`size-4 transition-transform duration-200 ${isExpanded ? 'rotate-90 text-brand-500' : ''}`}
                      />
                    </button>
                  </div>
                </div>

                {/* Expanded Detailed Edit Panel */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 pt-1 border-t border-line space-y-5 bg-surface/50 rounded-b-2xl">
                    {/* 1. Name & Verification Toggle */}
                    <div className="grid gap-3 sm:grid-cols-12 items-center">
                      <div className="sm:col-span-8">
                        <label className="text-[11px] font-semibold text-ink-3">Full Name</label>
                        <input
                          type="text"
                          value={person.name}
                          onChange={(e) => handleUpdate(idx, { name: e.target.value })}
                          placeholder="e.g. Ahmed Shamim Hassan Shaon"
                          className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-brand-500 font-medium"
                        />
                      </div>

                      <div className="sm:col-span-4 pt-4 sm:pt-4">
                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-surface border border-line hover:border-brand-500/40 transition-colors">
                          <input
                            type="checkbox"
                            checked={Boolean(person.verified)}
                            onChange={(e) => handleUpdate(idx, { verified: e.target.checked })}
                            className="size-4 rounded border-line text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-xs font-semibold text-ink flex items-center gap-1">
                            Verified Badge <span>💚</span>
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* 2. Avatar Uploader & Image URL */}
                    <div className="rounded-xl border border-line/70 bg-surface-2/30 p-3 sm:p-4">
                      <label className="text-[11px] font-semibold text-ink-3 block mb-2">Avatar Photo</label>
                      <CompanyLogoUploader
                        currentLogo={person.avatar_url}
                        companyName={person.name}
                        onLogoChange={(newUrl) => handleUpdate(idx, { avatar_url: newUrl })}
                        label="Avatar Photo"
                      />
                    </div>

                    {/* 3. Role / Headline */}
                    <div>
                      <label className="text-[11px] font-semibold text-ink-3">Role / Bio Headline</label>
                      <input
                        type="text"
                        value={person.role || ''}
                        onChange={(e) => handleUpdate(idx, { role: e.target.value })}
                        placeholder="e.g. CEO of Megaminds Learning, software architect and Laravel contributor"
                        className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-brand-500"
                      />
                    </div>

                    {/* 4. Primary Network & Follow Action Link */}
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <label className="text-[11px] font-semibold text-ink-3">Primary Platform</label>
                        <select
                          value={person.primaryPlatform || 'x'}
                          onChange={(e) => handlePrimaryPlatformChange(idx, e.target.value as SupportedPlatform)}
                          className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-brand-500"
                        >
                          {PLATFORM_OPTIONS.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-ink-3">Primary Handle</label>
                        <input
                          type="text"
                          value={person.primaryHandle || person.handle || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUpdate(idx, {
                              primaryHandle: val,
                              handle: val.replace(/^@/, ''),
                            });
                          }}
                          placeholder="@username"
                          className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-ink-3">Primary Follow URL</label>
                        <div className="relative mt-1">
                          <input
                            type="text"
                            value={person.primaryUrl || person.url || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleUpdate(idx, { primaryUrl: val, url: val });
                            }}
                            placeholder="https://x.com/username"
                            className="w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none pr-8"
                          />
                          {(person.primaryUrl || person.url) && (
                            <a
                              href={person.primaryUrl || person.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute right-2 top-2 text-ink-3 hover:text-ink"
                              title="Open URL"
                            >
                              <ExternalLink className="size-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 5. Personal Quote / Endorsement Note */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-ink-3 flex items-center gap-1.5">
                          <QuoteIcon className="size-3 text-emerald-500" />
                          <span>Personal Quote / Endorsement (Optional)</span>
                        </label>
                      </div>
                      <textarea
                        rows={2}
                        value={person.quote || ''}
                        onChange={(e) => handleUpdate(idx, { quote: e.target.value })}
                        placeholder="e.g. My mentor and the senior brother everyone wants by their side. I admire him the most."
                        className="mt-1 w-full rounded-xl border border-line bg-surface p-3 text-xs text-ink focus:outline-none focus:border-brand-500 leading-relaxed"
                      />
                      {person.quote && (
                        <div className="mt-2 flex items-start gap-2 rounded-lg bg-surface-2/60 px-3 py-2 text-xs italic text-ink-3 border-l-2 border-emerald-500">
                          <span className="text-emerald-500 font-bold select-none">&rdquo;</span>
                          <span>{person.quote}</span>
                        </div>
                      )}
                    </div>

                    {/* 6. Topic Tags */}
                    <div>
                      <label className="text-[11px] font-semibold text-ink-3">
                        Topic Tags (comma-separated, e.g. Laravel, Open source, PHP)
                      </label>
                      <input
                        type="text"
                        value={person.tags ? person.tags.join(', ') : ''}
                        onChange={(e) => {
                          const tagList = e.target.value
                            .split(',')
                            .map((t) => t.trim())
                            .filter(Boolean);
                          handleUpdate(idx, { tags: tagList });
                        }}
                        placeholder="Laravel, Open source, DevTools"
                        className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-brand-500"
                      />
                      {person.tags && person.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {person.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-ink-3"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 7. Connected Social Platform Links (6 Platform Slots) */}
                    <div className="space-y-2 pt-2 border-t border-line/70">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-ink-3">
                          Connected Social Platforms (displayed as bottom icons on card)
                        </label>
                        <span className="text-[10px] text-ink-3 font-mono">
                          {platformsList.length} connected
                        </span>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        {PLATFORM_OPTIONS.map((plat) => {
                          const currentVal = platformsList.find((p) => p.platform === plat.id)?.url || '';

                          return (
                            <div
                              key={plat.id}
                              className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-1.5 focus-within:border-brand-500 transition-colors"
                            >
                              <span className="text-ink-3 shrink-0">{plat.icon}</span>
                              <span className="text-[11px] font-medium text-ink-2 w-16 shrink-0 truncate">
                                {plat.label}
                              </span>
                              <input
                                type="text"
                                value={currentVal}
                                onChange={(e) => handlePlatformUrlChange(idx, plat.id, e.target.value)}
                                placeholder={plat.placeholder}
                                className="w-full bg-transparent text-xs text-ink placeholder:text-ink-3/40 focus:outline-none"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        </div>
      </div>
    </div>
  );
};
