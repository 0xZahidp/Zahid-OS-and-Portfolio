'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Sparkles,
  Terminal,
  ExternalLink,
  Copy,
  Check,
  Headphones,
  Mic,
  Star,
  ArrowRight,
  ArrowUpRight,
  X,
  Play,
} from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';
import { defaultLibraryData } from '@/data/default-library';
import { LibraryContent } from '@/types/library';
import { YouTubeIcon } from '@/components/ui/Icons';
import { playSuccessSound, playSparkleSound, playKeyPressSound } from '@/lib/sound';

export const LibrarySection: React.FC = () => {
  const { content } = usePortfolio();
  const library: LibraryContent = content.libraryData || defaultLibraryData;

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showBookmarkModal, setShowBookmarkModal] = useState<boolean>(false);

  const handleCopyCommand = async (id: string, command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedId(id);
      playSuccessSound();
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      // Fallback
    }
  };

  const handleOpenBookmarkModal = () => {
    setShowBookmarkModal(true);
    playSparkleSound();
  };

  const handleCloseBookmarkModal = () => {
    setShowBookmarkModal(false);
    playKeyPressSound();
  };

  return (
    <div className="space-y-12 pb-8">
      {/* 1. Header Banner with Bookmark Site Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-2">
            <span>Library</span>
            <span className="inline-flex items-center rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-semibold text-brand-600 dark:text-brand-400">
              Curated
            </span>
          </h1>
          <p className="mt-1 text-sm text-ink-2 leading-relaxed max-w-xl">
            Curated agent skills, bookmarks, engineering tools, and reflective audio.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={handleOpenBookmarkModal}
            className="btn btn-secondary h-9 px-4 rounded-xl text-xs font-semibold inline-flex items-center gap-2 hover:border-brand-500/40"
          >
            <Star className="size-4 text-amber-500 fill-amber-500" />
            <span>Bookmark this site</span>
          </button>
        </div>
      </div>

      {/* Bookmark Guide Modal */}
      {showBookmarkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="card-raised relative w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-amber-500/10 text-amber-500">
                  <Star className="size-5 fill-amber-500" />
                </span>
                <h3 className="text-base font-bold text-ink">Keep this library one tap away</h3>
              </div>
              <button
                type="button"
                onClick={handleCloseBookmarkModal}
                className="p-1 rounded-lg text-ink-3 hover:text-ink transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <p className="text-xs text-ink-2 leading-relaxed">
              New things land here often. Press the keyboard shortcut below to save it in your browser bookmarks:
            </p>

            <div className="rounded-xl border border-line bg-surface-2/60 p-4 text-center space-y-2">
              <p className="text-xs font-medium text-ink-3">Quick Shortcut</p>
              <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-ink bg-surface px-3 py-1.5 rounded-lg border border-line shadow-xs">
                <kbd className="rounded bg-surface-2 px-1.5 py-0.5">Ctrl</kbd> + <kbd className="rounded bg-surface-2 px-1.5 py-0.5">D</kbd>
                <span className="text-ink-3 font-normal ml-1">(or Cmd + D on Mac)</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleCloseBookmarkModal}
                className="btn btn-primary h-8 px-4 rounded-xl text-xs font-semibold"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. AI Skills Section */}
      <section id="ai-skills" className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="btn btn-secondary grid size-11 shrink-0 place-items-center rounded-xl text-brand-500">
              <Terminal className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-ink flex items-center gap-2">
                <span>AI Skills</span>
                <span className="text-xs font-mono text-ink-3 font-normal">
                  ({library.aiSkills.length})
                </span>
              </h2>
              <p className="text-xs text-ink-3">
                The agent skills I use every day in my agentic development workflow.
              </p>
            </div>
          </div>

          <a
            href="https://skills.sh"
            target="_blank"
            rel="noopener noreferrer"
            className="group hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-ink-2 hover:text-ink transition-colors"
          >
            <span>Explore skills.sh</span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>

        {/* Skills Grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {library.aiSkills.map((skill) => {
            const isCopied = copiedId === skill.id;

            return (
              <div
                key={skill.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-line bg-surface p-5 transition-all duration-200 hover:border-line-strong hover:shadow-sm"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-ink font-mono flex items-center gap-1">
                        <span className="text-brand-500">/</span>
                        <span>{skill.name}</span>
                      </h3>
                      <p className="text-xs text-ink-3 mt-0.5">by {skill.author}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {skill.badge && (
                        <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[10px] font-semibold text-ink-3">
                          {skill.badge}
                        </span>
                      )}
                      {skill.url && (
                        <a
                          href={skill.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded-lg text-ink-3 hover:text-ink transition-colors"
                          title="View skill documentation"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-ink-2 leading-relaxed">
                    {skill.description}
                  </p>
                </div>

                {/* Command Copy Box */}
                <div className="mt-4 pt-3 border-t border-line/60">
                  <div className="flex items-center justify-between gap-2 rounded-xl bg-surface-2/70 px-3 py-2 font-mono text-[11px] text-ink border border-line/50">
                    <span className="text-brand-500 font-bold select-none shrink-0">$</span>
                    <span className="truncate flex-1 select-all">{skill.command}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyCommand(skill.id, skill.command)}
                      className="shrink-0 p-1 rounded-md text-ink-3 hover:text-ink transition-colors cursor-pointer"
                      title="Copy install command"
                    >
                      {isCopied ? (
                        <Check className="size-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Bookmarks Section */}
      <section id="bookmarks" className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="btn btn-secondary grid size-11 shrink-0 place-items-center rounded-xl text-brand-500">
              <Star className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-ink flex items-center gap-2">
                <span>Bookmarks</span>
                <span className="text-xs font-mono text-ink-3 font-normal">
                  ({library.bookmarks.length})
                </span>
              </h2>
              <p className="text-xs text-ink-3">
                Courses, tools and sites worth your time, plus the browser extensions I can’t live without.
              </p>
            </div>
          </div>
        </div>

        {/* Featured Top Pick Card */}
        {library.bookmarks.find((b) => b.isTopPick) && (() => {
          const topPick = library.bookmarks.find((b) => b.isTopPick)!;
          return (
            <div className="rounded-[28px] border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-surface p-5 sm:p-7 shadow-xs relative overflow-hidden">
              <div className="grid gap-6 md:grid-cols-[1.1fr_1fr] items-center">
                {topPick.image_url ? (
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl ring-1 ring-line shadow-xs">
                    <Image
                      src={topPick.image_url}
                      alt={topPick.title}
                      fill
                      className="object-cover transition-transform duration-500 hover:scale-105"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="aspect-[16/9] w-full rounded-2xl bg-surface-2 grid place-items-center border border-line">
                    <Star className="size-8 text-amber-500" />
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {topPick.badges?.map((badge) => (
                      <span
                        key={badge}
                        className="inline-flex items-center gap-1 rounded-full bg-brand-500/15 px-3 py-1 text-xs font-semibold text-brand-700 dark:text-emerald-400 border border-brand-500/20"
                      >
                        <Sparkles className="size-3" />
                        <span>{badge}</span>
                      </span>
                    )) || (
                      <span className="rounded-full bg-brand-500/15 px-3 py-1 text-xs font-semibold text-brand-700 dark:text-emerald-400">
                        Top Pick
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold tracking-tight text-ink">
                    {topPick.title}
                  </h3>

                  {topPick.author && (
                    <p className="text-xs font-medium text-ink-3">by {topPick.author}</p>
                  )}

                  <p className="text-sm leading-relaxed text-ink-2">
                    {topPick.description}
                  </p>

                  <div className="pt-2">
                    <a
                      href={topPick.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary h-9 px-4 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <span>Visit Resource</span>
                      <ArrowUpRight className="size-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Regular Bookmarks Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {library.bookmarks.filter((b) => !b.isTopPick).map((bm) => (
            <a
              key={bm.id}
              href={bm.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col justify-between rounded-2xl border border-line bg-surface p-5 transition-all duration-200 hover:border-line-strong hover:shadow-xs"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-ink group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {bm.title}
                  </h3>
                  {bm.badge && (
                    <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[10px] font-semibold text-ink-3">
                      {bm.badge}
                    </span>
                  )}
                </div>

                <p className="text-xs text-ink-2 leading-relaxed">
                  {bm.description}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs font-medium text-ink-3 pt-3 border-t border-line/60">
                <span className="truncate">
                  {new URL(bm.url).hostname.replace(/^www\./, '')}
                </span>
                <ArrowUpRight className="size-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* 4. Music & Nasheeds (Focus Audio) */}
      <section id="music" className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="btn btn-secondary grid size-11 shrink-0 place-items-center rounded-xl text-brand-500">
              <Headphones className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-ink flex items-center gap-2">
                <span>Music & Nasheeds</span>
                <span className="text-xs font-mono text-ink-3 font-normal">
                  ({library.music.length})
                </span>
              </h2>
              <p className="text-xs text-ink-3">
                The nasheeds on repeat, most loved first. All vocals only.
              </p>
            </div>
          </div>
        </div>

        {/* Audio Track List */}
        <div className="rounded-2xl border border-line bg-surface overflow-hidden divide-y divide-line/60 shadow-xs">
          {library.music.map((track, idx) => (
            <div
              key={track.id}
              className="flex items-center justify-between gap-4 p-4 hover:bg-surface-2/60 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <span className="text-xs font-mono font-semibold text-ink-3 w-6 shrink-0 text-center">
                  0{idx + 1}
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-ink truncate">{track.title}</span>
                    {track.arabic_title && (
                      <span className="text-xs font-serif text-brand-600 dark:text-emerald-400 font-semibold" dir="rtl">
                        {track.arabic_title}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-3 truncate mt-0.5">{track.artist}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {track.duration && (
                  <span className="text-xs font-mono text-ink-3">{track.duration}</span>
                )}
                {track.url && (
                  <a
                    href={track.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="size-8 rounded-full border border-line bg-surface hover:bg-surface-2 grid place-items-center text-ink-2 hover:text-ink transition-colors"
                    title={`Listen to ${track.title}`}
                  >
                    <Play className="size-3.5 fill-current ml-0.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Voiceovers & Media */}
      {library.voiceovers && library.voiceovers.items && library.voiceovers.items.length > 0 && (
        <section id="voiceovers" className="space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="btn btn-secondary grid size-11 shrink-0 place-items-center rounded-xl text-brand-500">
                <Mic className="size-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-ink flex items-center gap-2">
                  <span>Voiceovers & Spoken Media</span>
                </h2>
                <p className="text-xs text-ink-3">
                  {library.voiceovers.description}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-full bg-gradient-to-tr from-brand-600 to-teal-500 grid place-items-center text-white font-black text-lg shadow-sm">
                  {library.voiceovers.channelName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink">{library.voiceovers.channelName}</h3>
                  <p className="text-xs text-ink-3">{library.voiceovers.handle} · {library.voiceovers.subscriberCount}</p>
                </div>
              </div>

              <a
                href={library.voiceovers.subscribeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary h-9 px-4 rounded-xl text-xs font-semibold inline-flex items-center gap-2 hover:border-red-500/40 hover:text-red-500 transition-colors"
              >
                <YouTubeIcon className="size-4 text-red-500" />
                <span>Subscribe on YouTube</span>
              </a>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {library.voiceovers.items.map((vo) => (
                <a
                  key={vo.id}
                  href={vo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-line bg-surface-2/40 hover:bg-surface-2 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink line-clamp-2 leading-relaxed">
                      {vo.title}
                    </p>
                    {vo.duration && (
                      <span className="text-[11px] font-mono text-ink-3 mt-1 inline-block">
                        {vo.duration}
                      </span>
                    )}
                  </div>
                  <ArrowUpRight className="size-4 text-ink-3 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
