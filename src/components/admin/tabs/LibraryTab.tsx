'use client';

import React, { useState } from 'react';
import {
  Bookmark,
  Terminal,
  Star,
  Headphones,
  Mic,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Check,
} from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';
import { defaultLibraryData } from '@/data/default-library';
import {
  AiSkillItem,
  BookmarkItem,
  FocusAudioItem,
  VoiceoverItem,
  LibraryContent,
} from '@/types/library';
import { confirmModal } from '@/components/ui/ConfirmDialog';

type ActiveLibrarySubTab = 'skills' | 'bookmarks' | 'music' | 'voiceovers';

export const LibraryTab: React.FC = () => {
  const { content, updateLibraryData } = usePortfolio();
  const library: LibraryContent = content.libraryData || defaultLibraryData;
  const [activeTab, setActiveTab] = useState<ActiveLibrarySubTab>('skills');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleResetToDefault = async () => {
    const ok = await confirmModal({
      title: 'Reset Library Showcase',
      message: 'Reset all library sections to the default curated showcase from nahian.bd/library?',
      confirmText: 'Reset Library',
      type: 'warning',
    });
    if (ok) {
      updateLibraryData(defaultLibraryData);
      showToast('Library reset to default showcase data!');
    }
  };

  // --- AI SKILLS HANDLERS ---
  const handleAddSkill = () => {
    const newSkill: AiSkillItem = {
      id: `skill-${Date.now()}`,
      name: 'new-skill',
      author: 'Creator',
      description: 'Describe what this AI agent skill accomplishes and when to run it.',
      command: 'npx skills add author/repo --skill new-skill',
      url: 'https://skills.sh',
      badge: 'Agent',
    };
    updateLibraryData({
      ...library,
      aiSkills: [...library.aiSkills, newSkill],
    });
    showToast('Added new AI skill.');
  };

  const handleUpdateSkill = (idx: number, patch: Partial<AiSkillItem>) => {
    const updated = [...library.aiSkills];
    updated[idx] = { ...updated[idx], ...patch };
    updateLibraryData({ ...library, aiSkills: updated });
  };

  const handleRemoveSkill = (idx: number) => {
    const updated = library.aiSkills.filter((_, i) => i !== idx);
    updateLibraryData({ ...library, aiSkills: updated });
  };

  const handleMoveSkill = (idx: number, direction: 'up' | 'down') => {
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === library.aiSkills.length - 1) return;
    const target = direction === 'up' ? idx - 1 : idx + 1;
    const updated = [...library.aiSkills];
    const temp = updated[idx];
    updated[idx] = updated[target];
    updated[target] = temp;
    updateLibraryData({ ...library, aiSkills: updated });
  };

  // --- BOOKMARKS HANDLERS ---
  const handleAddBookmark = () => {
    const newBm: BookmarkItem = {
      id: `bm-${Date.now()}`,
      title: 'New Resource',
      description: 'A helpful developer tool, course, or reference link.',
      url: 'https://example.com',
      badge: 'Tool',
      isTopPick: false,
    };
    updateLibraryData({
      ...library,
      bookmarks: [...library.bookmarks, newBm],
    });
    showToast('Added new bookmark.');
  };

  const handleUpdateBookmark = (idx: number, patch: Partial<BookmarkItem>) => {
    const updated = [...library.bookmarks];
    updated[idx] = { ...updated[idx], ...patch };
    updateLibraryData({ ...library, bookmarks: updated });
  };

  const handleRemoveBookmark = (idx: number) => {
    const updated = library.bookmarks.filter((_, i) => i !== idx);
    updateLibraryData({ ...library, bookmarks: updated });
  };

  const handleMoveBookmark = (idx: number, direction: 'up' | 'down') => {
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === library.bookmarks.length - 1) return;
    const target = direction === 'up' ? idx - 1 : idx + 1;
    const updated = [...library.bookmarks];
    const temp = updated[idx];
    updated[idx] = updated[target];
    updated[target] = temp;
    updateLibraryData({ ...library, bookmarks: updated });
  };

  // --- MUSIC HANDLERS ---
  const handleAddMusic = () => {
    const newTrack: FocusAudioItem = {
      id: `track-${Date.now()}`,
      title: 'Track Title',
      artist: 'Artist',
      arabic_title: '',
      duration: '3:30',
      url: 'https://youtube.com',
    };
    updateLibraryData({
      ...library,
      music: [...library.music, newTrack],
    });
    showToast('Added focus track.');
  };

  const handleUpdateMusic = (idx: number, patch: Partial<FocusAudioItem>) => {
    const updated = [...library.music];
    updated[idx] = { ...updated[idx], ...patch };
    updateLibraryData({ ...library, music: updated });
  };

  const handleRemoveMusic = (idx: number) => {
    const updated = library.music.filter((_, i) => i !== idx);
    updateLibraryData({ ...library, music: updated });
  };

  // --- VOICEOVER HANDLERS ---
  const handleUpdateVoiceoverChannel = (patch: Partial<LibraryContent['voiceovers']>) => {
    updateLibraryData({
      ...library,
      voiceovers: { ...library.voiceovers, ...patch },
    });
  };

  const handleAddVoiceoverItem = () => {
    const newItem: VoiceoverItem = {
      id: `vo-${Date.now()}`,
      title: 'Voiceover Title in Bangla',
      url: 'https://youtube.com',
      duration: '10:00',
    };
    updateLibraryData({
      ...library,
      voiceovers: {
        ...library.voiceovers,
        items: [...library.voiceovers.items, newItem],
      },
    });
  };

  const handleUpdateVoiceoverItem = (idx: number, patch: Partial<VoiceoverItem>) => {
    const updated = [...library.voiceovers.items];
    updated[idx] = { ...updated[idx], ...patch };
    updateLibraryData({
      ...library,
      voiceovers: { ...library.voiceovers, items: updated },
    });
  };

  const handleRemoveVoiceoverItem = (idx: number) => {
    const updated = library.voiceovers.items.filter((_, i) => i !== idx);
    updateLibraryData({
      ...library,
      voiceovers: { ...library.voiceovers, items: updated },
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Card */}
      <div className="card-raised rounded-2xl border border-line bg-surface p-4 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line">
          <div className="flex items-center gap-2.5">
            <Bookmark className="size-5 text-brand-500 shrink-0" />
            <div>
              <h2 className="text-base font-bold text-ink">Library & Curations</h2>
              <p className="text-xs text-ink-3 mt-0.5">
                Manage AI agent skills, developer bookmarks, focus audio tracks, and voiceovers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="btn btn-secondary h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 hover:text-brand-500 transition-colors"
              title="Reset all library content to default showcase from nahian.bd/library"
            >
              <Sparkles className="size-3.5 text-brand-500" />
              <span>Reset to Showcase Data</span>
            </button>
          </div>
        </div>

        {toastMessage && (
          <div className="flex items-center gap-2 rounded-xl bg-brand-500/10 border border-brand-500/20 px-3.5 py-2.5 text-xs font-medium text-brand-600 dark:text-brand-400">
            <Check className="size-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Section Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] pb-1 border-b border-line">
          <button
            type="button"
            onClick={() => setActiveTab('skills')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'skills'
                ? 'bg-surface-2 text-ink shadow-xs'
                : 'text-ink-3 hover:text-ink hover:bg-surface-2/60'
            }`}
          >
            <Terminal className="size-3.5" />
            <span>AI Skills</span>
            <span className="opacity-70 font-mono">({library.aiSkills.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bookmarks')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'bookmarks'
                ? 'bg-surface-2 text-ink shadow-xs'
                : 'text-ink-3 hover:text-ink hover:bg-surface-2/60'
            }`}
          >
            <Star className="size-3.5" />
            <span>Bookmarks</span>
            <span className="opacity-70 font-mono">({library.bookmarks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('music')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'music'
                ? 'bg-surface-2 text-ink shadow-xs'
                : 'text-ink-3 hover:text-ink hover:bg-surface-2/60'
            }`}
          >
            <Headphones className="size-3.5" />
            <span>Focus Music</span>
            <span className="opacity-70 font-mono">({library.music.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('voiceovers')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'voiceovers'
                ? 'bg-surface-2 text-ink shadow-xs'
                : 'text-ink-3 hover:text-ink hover:bg-surface-2/60'
            }`}
          >
            <Mic className="size-3.5" />
            <span>Voiceovers</span>
            <span className="opacity-70 font-mono">({library.voiceovers?.items?.length || 0})</span>
          </button>
        </div>

        {/* 1. AI SKILLS TAB */}
        {activeTab === 'skills' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink-3">Agent Skills List</span>
              <button
                type="button"
                onClick={handleAddSkill}
                className="btn btn-primary h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Plus className="size-3.5" />
                <span>Add Skill</span>
              </button>
            </div>

            <div className="space-y-3">
              {library.aiSkills.map((skill, idx) => (
                <div
                  key={skill.id || idx}
                  className="rounded-xl border border-line bg-surface-2/40 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 font-mono font-bold text-xs text-ink">
                      <span className="text-brand-500">/{skill.name}</span>
                      <span className="text-[11px] font-sans font-normal text-ink-3">by {skill.author}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveSkill(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded-lg text-ink-3 hover:text-ink disabled:opacity-20"
                        title="Move up"
                      >
                        <ChevronUp className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveSkill(idx, 'down')}
                        disabled={idx === library.aiSkills.length - 1}
                        className="p-1 rounded-lg text-ink-3 hover:text-ink disabled:opacity-20"
                        title="Move down"
                      >
                        <ChevronDown className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(idx)}
                        className="p-1 rounded-lg text-ink-3 hover:text-rose-500 ml-1"
                        title="Delete skill"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="text-[11px] font-semibold text-ink-3">Skill Name</label>
                      <input
                        type="text"
                        value={skill.name}
                        onChange={(e) => handleUpdateSkill(idx, { name: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink font-mono focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-ink-3">Author</label>
                      <input
                        type="text"
                        value={skill.author}
                        onChange={(e) => handleUpdateSkill(idx, { author: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-ink-3">Badge (Optional)</label>
                      <input
                        type="text"
                        value={skill.badge || ''}
                        onChange={(e) => handleUpdateSkill(idx, { badge: e.target.value })}
                        placeholder="e.g. Planning, 24 skills"
                        className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="text-[11px] font-semibold text-ink-3">Description</label>
                      <input
                        type="text"
                        value={skill.description}
                        onChange={(e) => handleUpdateSkill(idx, { description: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-semibold text-ink-3">Install Command</label>
                      <input
                        type="text"
                        value={skill.command}
                        onChange={(e) => handleUpdateSkill(idx, { command: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink font-mono focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-ink-3">Docs / Source URL</label>
                      <input
                        type="text"
                        value={skill.url}
                        onChange={(e) => handleUpdateSkill(idx, { url: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. BOOKMARKS TAB */}
        {activeTab === 'bookmarks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink-3">Bookmarks List</span>
              <button
                type="button"
                onClick={handleAddBookmark}
                className="btn btn-primary h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Plus className="size-3.5" />
                <span>Add Bookmark</span>
              </button>
            </div>

            <div className="space-y-3">
              {library.bookmarks.map((bm, idx) => (
                <div
                  key={bm.id || idx}
                  className="rounded-xl border border-line bg-surface-2/40 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-ink">{bm.title}</span>
                      {bm.isTopPick && (
                        <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          ★ Top Pick
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveBookmark(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded-lg text-ink-3 hover:text-ink disabled:opacity-20"
                        title="Move up"
                      >
                        <ChevronUp className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveBookmark(idx, 'down')}
                        disabled={idx === library.bookmarks.length - 1}
                        className="p-1 rounded-lg text-ink-3 hover:text-ink disabled:opacity-20"
                        title="Move down"
                      >
                        <ChevronDown className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveBookmark(idx)}
                        className="p-1 rounded-lg text-ink-3 hover:text-rose-500 ml-1"
                        title="Delete bookmark"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 items-center">
                    <div>
                      <label className="text-[11px] font-semibold text-ink-3">Title</label>
                      <input
                        type="text"
                        value={bm.title}
                        onChange={(e) => handleUpdateBookmark(idx, { title: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-ink-3">Author (Optional)</label>
                      <input
                        type="text"
                        value={bm.author || ''}
                        onChange={(e) => handleUpdateBookmark(idx, { author: e.target.value })}
                        placeholder="e.g. Aaron Francis"
                        className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                      />
                    </div>
                    <div className="pt-4">
                      <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-surface border border-line">
                        <input
                          type="checkbox"
                          checked={Boolean(bm.isTopPick)}
                          onChange={(e) => handleUpdateBookmark(idx, { isTopPick: e.target.checked })}
                          className="size-4 rounded text-brand-600 focus:ring-brand-500"
                        />
                        <span className="text-xs font-semibold text-ink">Feature as Top Pick</span>
                      </label>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-semibold text-ink-3">URL</label>
                      <input
                        type="text"
                        value={bm.url}
                        onChange={(e) => handleUpdateBookmark(idx, { url: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-ink-3">Badge (e.g. Free course, Guide)</label>
                      <input
                        type="text"
                        value={bm.badge || ''}
                        onChange={(e) => handleUpdateBookmark(idx, { badge: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="text-[11px] font-semibold text-ink-3">Description</label>
                      <input
                        type="text"
                        value={bm.description}
                        onChange={(e) => handleUpdateBookmark(idx, { description: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                      />
                    </div>
                    {bm.isTopPick && (
                      <div className="sm:col-span-3">
                        <label className="text-[11px] font-semibold text-ink-3">Top Pick Preview Image URL</label>
                        <input
                          type="text"
                          value={bm.image_url || ''}
                          onChange={(e) => handleUpdateBookmark(idx, { image_url: e.target.value })}
                          placeholder="https://..."
                          className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. FOCUS MUSIC TAB */}
        {activeTab === 'music' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink-3">Focus Audio & Nasheeds</span>
              <button
                type="button"
                onClick={handleAddMusic}
                className="btn btn-primary h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Plus className="size-3.5" />
                <span>Add Track</span>
              </button>
            </div>

            <div className="space-y-3">
              {library.music.map((track, idx) => (
                <div
                  key={track.id || idx}
                  className="rounded-xl border border-line bg-surface-2/40 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-xs text-ink">#{idx + 1} {track.title}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMusic(idx)}
                      className="p-1 rounded-lg text-ink-3 hover:text-rose-500"
                      title="Delete track"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-4">
                    <div>
                      <label className="text-[11px] font-semibold text-ink-3">Title</label>
                      <input
                        type="text"
                        value={track.title}
                        onChange={(e) => handleUpdateMusic(idx, { title: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-ink-3">Artist</label>
                      <input
                        type="text"
                        value={track.artist}
                        onChange={(e) => handleUpdateMusic(idx, { artist: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-ink-3">Arabic Title</label>
                      <input
                        type="text"
                        value={track.arabic_title || ''}
                        onChange={(e) => handleUpdateMusic(idx, { arabic_title: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none font-serif"
                        dir="rtl"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-ink-3">Duration</label>
                      <input
                        type="text"
                        value={track.duration || ''}
                        onChange={(e) => handleUpdateMusic(idx, { duration: e.target.value })}
                        placeholder="4:30"
                        className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink font-mono focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <label className="text-[11px] font-semibold text-ink-3">Track / YouTube URL</label>
                      <input
                        type="text"
                        value={track.url || ''}
                        onChange={(e) => handleUpdateMusic(idx, { url: e.target.value })}
                        placeholder="https://youtube.com/watch?v=..."
                        className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. VOICEOVERS TAB */}
        {activeTab === 'voiceovers' && (
          <div className="space-y-5">
            <div className="rounded-xl border border-line bg-surface-2/40 p-4 space-y-3">
              <h3 className="text-xs font-bold text-ink">Channel Information</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[11px] font-semibold text-ink-3">Channel Name</label>
                  <input
                    type="text"
                    value={library.voiceovers.channelName}
                    onChange={(e) => handleUpdateVoiceoverChannel({ channelName: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-ink-3">Handle</label>
                  <input
                    type="text"
                    value={library.voiceovers.handle}
                    onChange={(e) => handleUpdateVoiceoverChannel({ handle: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-ink-3">Subscribe URL</label>
                  <input
                    type="text"
                    value={library.voiceovers.subscribeUrl}
                    onChange={(e) => handleUpdateVoiceoverChannel({ subscribeUrl: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-ink-3">Description</label>
                  <input
                    type="text"
                    value={library.voiceovers.description}
                    onChange={(e) => handleUpdateVoiceoverChannel({ description: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink-3">Recorded Voiceovers List</span>
                <button
                  type="button"
                  onClick={handleAddVoiceoverItem}
                  className="btn btn-primary h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Plus className="size-3.5" />
                  <span>Add Voiceover</span>
                </button>
              </div>

              {library.voiceovers.items.map((vo, idx) => (
                <div
                  key={vo.id || idx}
                  className="rounded-xl border border-line bg-surface-2/40 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-xs text-ink">#{idx + 1} {vo.title}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveVoiceoverItem(idx)}
                      className="p-1 rounded-lg text-ink-3 hover:text-rose-500"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-semibold text-ink-3">Title</label>
                      <input
                        type="text"
                        value={vo.title}
                        onChange={(e) => handleUpdateVoiceoverItem(idx, { title: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-ink-3">Duration</label>
                      <input
                        type="text"
                        value={vo.duration || ''}
                        onChange={(e) => handleUpdateVoiceoverItem(idx, { duration: e.target.value })}
                        placeholder="14:22"
                        className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink font-mono focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="text-[11px] font-semibold text-ink-3">Video / Media URL</label>
                      <input
                        type="text"
                        value={vo.url}
                        onChange={(e) => handleUpdateVoiceoverItem(idx, { url: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
