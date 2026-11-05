'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { YOUTUBE_PICKS } from '@/data/focus-data';
import { YouTubeIcon } from '@/components/ui/Icons';
import { Play, Volume2, VolumeX, ExternalLink, Trash2 } from 'lucide-react';

interface CustomLink {
  id: string;
  title: string;
  sub: string;
  url: string;
  createdAt: number;
}

function extractYouTubeId(urlOrId: string): string | null {
  const trimmed = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export const YouTubeSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'picks' | 'custom'>('picks');
  const [currentVideo, setCurrentVideo] = useState<{ id: string; title: string; sub?: string } | null>(null);
  const [inputUrl, setInputUrl] = useState('');
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  const [ytVolume, setYtVolume] = useState<number>(80);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Load custom links from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('focus_custom_yt_links');
      if (saved) {
        setCustomLinks(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveCustomLinks = (links: CustomLink[]) => {
    setCustomLinks(links);
    try {
      localStorage.setItem('focus_custom_yt_links', JSON.stringify(links));
    } catch {
      // ignore
    }
  };

  const handlePlayVideo = (video: { id: string; title: string; sub?: string }) => {
    setCurrentVideo(video);
  };

  const handleAddCustomLink = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputUrl.trim()) return;

    const vidId = extractYouTubeId(inputUrl);
    if (!vidId) {
      alert('Please enter a valid YouTube video URL or ID.');
      return;
    }

    const newLink: CustomLink = {
      id: vidId,
      title: `Custom Track (${vidId})`,
      sub: 'User Video',
      url: inputUrl.trim(),
      createdAt: Date.now(),
    };

    const updated = [newLink, ...customLinks.filter((l) => l.id !== vidId)];
    saveCustomLinks(updated);
    setInputUrl('');
    handlePlayVideo(newLink);
    setActiveTab('custom');
  };

  const handleDeleteCustomLink = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customLinks.filter((l) => l.id !== id);
    saveCustomLinks(updated);
    if (currentVideo?.id === id) {
      setCurrentVideo(null);
    }
  };

  return (
    <section className="space-y-6 pt-4" aria-labelledby="focus-youtube">
      <div className="flex items-center gap-2.5">
        <div className="size-8 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 grid place-items-center">
          <YouTubeIcon className="size-4" />
        </div>
        <h2 id="focus-youtube" className="text-xl font-bold tracking-tight text-ink">
          YouTube
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Player & Volume Bar */}
        <div className="lg:col-span-6 space-y-3">
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-surface-2 border border-line shadow-xs flex items-center justify-center">
            {currentVideo ? (
              <iframe
                ref={iframeRef}
                src={`https://www.youtube-nocookie.com/embed/${currentVideo.id}?autoplay=1&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
                title={currentVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="size-full border-0"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 text-ink-3 p-6 text-center">
                <div className="size-16 rounded-2xl bg-surface-3 grid place-items-center text-ink-3">
                  <YouTubeIcon className="size-8 opacity-50" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-ink-2">No YouTube video playing</p>
                  <p className="text-xs text-ink-3">Pick a track from the playlist or paste your own link</p>
                </div>
              </div>
            )}
          </div>

          {/* Under player controls & status */}
          <div className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-surface-2 border border-line">
            <div className="min-w-0 flex items-center gap-2.5">
              {currentVideo ? (
                <>
                  <span className="flex items-center gap-0.5 h-3 text-brand-500 shrink-0">
                    <span className="w-0.5 h-3 bg-brand-500 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-0.5 h-3 bg-brand-500 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-0.5 h-3 bg-brand-500 rounded-full animate-bounce [animation-delay:300ms]" />
                  </span>
                  <div className="truncate">
                    <span className="text-xs font-semibold text-ink truncate block">
                      {currentVideo.title}
                    </span>
                    {currentVideo.sub && (
                      <span className="text-[10px] text-ink-3 truncate block">{currentVideo.sub}</span>
                    )}
                  </div>
                </>
              ) : (
                <span className="text-xs text-ink-3 font-medium">Not playing</span>
              )}
            </div>

            {/* Volume capsule */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="size-7 rounded-lg text-ink-3 hover:text-ink grid place-items-center transition-colors cursor-pointer"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || ytVolume === 0 ? (
                  <VolumeX className="size-4 text-ink-3" />
                ) : (
                  <Volume2 className="size-4 text-ink-2" />
                )}
              </button>

              <div className="w-24 relative flex items-center">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : ytVolume}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setYtVolume(val);
                    if (isMuted) setIsMuted(false);
                  }}
                  className="w-full h-1.5 rounded-full appearance-none bg-surface-3 cursor-pointer accent-brand-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: "Your own video" & Playlist tabs */}
        <div className="lg:col-span-6 space-y-4">
          {/* Custom video adder box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-surface-2 border border-line space-y-3.5">
            <h3 className="text-sm font-bold text-ink">Your own video</h3>

            <div className="space-y-1.5 text-xs text-ink-3">
              <div className="flex items-center gap-2">
                <span className="size-4 rounded-full bg-surface-3 text-ink-2 font-mono text-[10px] font-bold grid place-items-center">
                  1
                </span>
                <a
                  href="https://www.youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-link hover:underline font-medium"
                >
                  <span>Find a video on YouTube</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-4 rounded-full bg-surface-3 text-ink-2 font-mono text-[10px] font-bold grid place-items-center">
                  2
                </span>
                <span>Copy its link</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-4 rounded-full bg-surface-3 text-ink-2 font-mono text-[10px] font-bold grid place-items-center">
                  3
                </span>
                <span>Paste it below</span>
              </div>
            </div>

            <form onSubmit={handleAddCustomLink} className="flex gap-2">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Paste a YouTube link"
                className="flex-1 px-3.5 py-2 rounded-xl bg-surface border border-line text-xs text-ink placeholder:text-ink-3 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
              >
                Play
              </button>
            </form>
          </div>

          {/* Playlist selector tabs */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('picks')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'picks'
                    ? 'bg-surface border border-line text-ink shadow-xs'
                    : 'text-ink-3 hover:text-ink hover:bg-surface-2'
                }`}
              >
                <span>My picks</span>
                <span className="ml-1.5 px-1.5 py-0.2 rounded-md bg-surface-3 text-[10px] font-mono text-ink-2">
                  {YOUTUBE_PICKS.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('custom')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'custom'
                    ? 'bg-surface border border-line text-ink shadow-xs'
                    : 'text-ink-3 hover:text-ink hover:bg-surface-2'
                }`}
              >
                <span>Your links</span>
                <span className="ml-1.5 px-1.5 py-0.2 rounded-md bg-surface-3 text-[10px] font-mono text-ink-2">
                  {customLinks.length}
                </span>
              </button>
            </div>

            {/* Scrollable list */}
            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
              {activeTab === 'picks' ? (
                YOUTUBE_PICKS.map((pick) => {
                  const isCurrent = currentVideo?.id === pick.id;
                  const thumbUrl = `https://i.ytimg.com/vi/${pick.id}/mqdefault.jpg`;

                  return (
                    <button
                      key={pick.id}
                      type="button"
                      onClick={() => handlePlayVideo(pick)}
                      className={`group flex w-full cursor-pointer items-center gap-3 rounded-2xl p-2 text-left transition-colors ${
                        isCurrent
                          ? 'bg-surface-2 ring-1 ring-line'
                          : 'hover:bg-surface-2'
                      }`}
                    >
                      <div className="relative aspect-video w-20 shrink-0 overflow-hidden rounded-lg bg-surface-3 ring-1 ring-line">
                        <Image
                          src={thumbUrl}
                          alt={pick.title}
                          fill
                          sizes="80px"
                          unoptimized
                          className="size-full object-cover"
                        />
                        {isCurrent && (
                          <div className="absolute inset-0 bg-black/40 grid place-items-center">
                            <span className="flex items-center gap-0.5 h-3 text-white">
                              <span className="w-0.5 h-3 bg-white rounded-full animate-bounce [animation-delay:0ms]" />
                              <span className="w-0.5 h-3 bg-white rounded-full animate-bounce [animation-delay:150ms]" />
                              <span className="w-0.5 h-3 bg-white rounded-full animate-bounce [animation-delay:300ms]" />
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <span
                          className={`block truncate text-xs font-semibold ${
                            isCurrent ? 'text-link' : 'text-ink'
                          }`}
                        >
                          {pick.title}
                        </span>
                        <span className="block truncate text-[11px] text-ink-3">{pick.sub}</span>
                      </div>

                      <div className="size-7 rounded-lg text-ink-3 group-hover:text-ink grid place-items-center transition-colors">
                        <Play className="size-3.5 fill-current opacity-70 group-hover:opacity-100" />
                      </div>
                    </button>
                  );
                })
              ) : customLinks.length === 0 ? (
                <div className="p-8 text-center text-xs text-ink-3 rounded-2xl bg-surface-2 border border-line">
                  You haven’t added any YouTube links yet. Paste one above to save it here.
                </div>
              ) : (
                customLinks.map((link) => {
                  const isCurrent = currentVideo?.id === link.id;
                  const thumbUrl = `https://i.ytimg.com/vi/${link.id}/mqdefault.jpg`;

                  return (
                    <div
                      key={link.id}
                      onClick={() => handlePlayVideo(link)}
                      className={`group flex w-full cursor-pointer items-center gap-3 rounded-2xl p-2 text-left transition-colors ${
                        isCurrent
                          ? 'bg-surface-2 ring-1 ring-line'
                          : 'hover:bg-surface-2'
                      }`}
                    >
                      <div className="relative aspect-video w-20 shrink-0 overflow-hidden rounded-lg bg-surface-3 ring-1 ring-line">
                        <Image
                          src={thumbUrl}
                          alt={link.title}
                          fill
                          sizes="80px"
                          unoptimized
                          className="size-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <span
                          className={`block truncate text-xs font-semibold ${
                            isCurrent ? 'text-link' : 'text-ink'
                          }`}
                        >
                          {link.title}
                        </span>
                        <span className="block truncate text-[11px] text-ink-3 font-mono">{link.id}</span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteCustomLink(link.id, e)}
                        className="size-7 rounded-lg text-ink-3 hover:text-red-500 hover:bg-red-500/10 grid place-items-center transition-colors cursor-pointer"
                        title="Remove link"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
