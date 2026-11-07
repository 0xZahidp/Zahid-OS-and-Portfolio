'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { YOUTUBE_PICKS } from '@/data/focus-data';
import { Play, Volume2, ExternalLink, Trash2, SquarePlay, Video, VideoOff } from 'lucide-react';

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
  const [isVideoHidden, setIsVideoHidden] = useState<boolean>(false);
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
    setIsVideoHidden(false);
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
      {/* Section Heading: Outlined square play icon + YouTube title */}
      <div className="flex items-center gap-2.5">
        <SquarePlay className="size-5 text-ink" />
        <h2 id="focus-youtube" className="text-xl font-bold tracking-tight text-ink">
          YouTube
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 16:9 Video Box & Controls underneath */}
        <div className="lg:col-span-6 space-y-3">
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-surface-2 border border-line shadow-xs flex items-center justify-center">
            {currentVideo ? (
              <>
                <iframe
                  ref={iframeRef}
                  src={`https://www.youtube-nocookie.com/embed/${currentVideo.id}?autoplay=1&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
                  title={currentVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className={`size-full border-0 ${isVideoHidden ? 'opacity-0 pointer-events-none' : ''}`}
                />
                {isVideoHidden && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface-2 text-ink-3">
                    <VideoOff className="size-8 text-ink-3/60" />
                    <p className="text-xs text-ink-3">Video hidden · Audio only</p>
                  </div>
                )}
              </>
            ) : (
              /* Reference screenshot 3: Centered clean outline play rectangle */
              <div className="size-16 rounded-2xl border-2 border-ink-3/30 flex items-center justify-center text-ink-3/50">
                <Play className="size-7 ml-0.5 fill-current opacity-70" />
              </div>
            )}
          </div>

          {/* Under player controls & status matching screenshot 3 */}
          <div className="flex items-center justify-between gap-4 pt-1">
            <div className="min-w-0 flex items-center gap-2">
              {currentVideo ? (
                <>
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                    {currentVideo.title}
                  </span>
                </>
              ) : (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Not playing
                </span>
              )}
            </div>

            {/* Right side: Green volume pill + camera-off toggle button */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center h-8 px-3 rounded-full bg-[#0E9F6E] text-white gap-2 shadow-xs">
                <Volume2 className="size-3.5 shrink-0" />
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
                  className="w-16 sm:w-20 h-1.5 rounded-full appearance-none bg-emerald-800/60 cursor-pointer accent-white"
                  aria-label="YouTube volume"
                />
              </div>

              {/* Hide/Show Video button */}
              <button
                type="button"
                onClick={() => setIsVideoHidden(!isVideoHidden)}
                className="size-8 rounded-full border border-line bg-surface-2 hover:bg-surface-3 grid place-items-center text-ink-2 hover:text-ink transition-colors cursor-pointer"
                title={isVideoHidden ? 'Show video' : 'Hide video'}
                aria-label={isVideoHidden ? 'Show video' : 'Hide video'}
              >
                {isVideoHidden ? (
                  <Video className="size-3.5 text-emerald-600" />
                ) : (
                  <VideoOff className="size-3.5 text-ink-2" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: "Your own video" card & Segmented Playlist switcher */}
        <div className="lg:col-span-6 space-y-4">
          {/* Custom video adder box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-surface-2 border border-line space-y-3.5">
            <h3 className="text-sm font-bold text-ink">Your own video</h3>

            <div className="space-y-1.5 text-xs text-ink-3">
              <div className="flex items-center gap-2">
                <span className="text-ink-3 font-mono text-xs">1</span>
                <a
                  href="https://www.youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                >
                  <span>Find a video on YouTube</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-ink-3 font-mono text-xs">2</span>
                <span>Copy its link</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-ink-3 font-mono text-xs">3</span>
                <span>Paste it below</span>
              </div>
            </div>

            <form onSubmit={handleAddCustomLink} className="flex gap-2">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Paste a YouTube link"
                className="flex-1 h-10 px-3.5 rounded-xl bg-surface border border-line text-xs text-ink placeholder:text-ink-4 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              <button
                type="submit"
                className="h-10 px-6 rounded-xl bg-[#0E9F6E] hover:bg-[#0c8a5f] text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
              >
                Play
              </button>
            </form>
          </div>

          {/* Playlist selector segmented pill matching screenshot 3 */}
          <div className="space-y-2">
            <div className="inline-flex items-center p-1 rounded-full bg-surface-2 border border-line gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('picks')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'picks'
                    ? 'bg-surface text-ink shadow-2xs'
                    : 'text-ink-3 hover:text-ink'
                }`}
              >
                My picks {YOUTUBE_PICKS.length}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('custom')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'custom'
                    ? 'bg-surface text-ink shadow-2xs'
                    : 'text-ink-3 hover:text-ink'
                }`}
              >
                Your links {customLinks.length}
              </button>
            </div>

            {/* Scrollable list with larger thumbnails and no per-row play buttons */}
            <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
              {activeTab === 'picks' ? (
                YOUTUBE_PICKS.map((pick) => {
                  const isCurrent = currentVideo?.id === pick.id;
                  const thumbUrl = `https://i.ytimg.com/vi/${pick.id}/mqdefault.jpg`;

                  return (
                    <button
                      key={pick.id}
                      type="button"
                      onClick={() => handlePlayVideo(pick)}
                      className={`group flex w-full cursor-pointer items-center gap-3 rounded-xl p-2 text-left transition-colors ${
                        isCurrent
                          ? 'bg-surface-2 ring-1 ring-line'
                          : 'hover:bg-surface-2'
                      }`}
                    >
                      <div className="relative aspect-video w-16 h-12 shrink-0 overflow-hidden rounded-xl bg-surface-3 ring-1 ring-line">
                        <Image
                          src={thumbUrl}
                          alt={pick.title}
                          fill
                          sizes="64px"
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
                        <p
                          className={`truncate text-xs sm:text-sm font-semibold ${
                            isCurrent ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink'
                          }`}
                        >
                          {pick.title}
                        </p>
                        <p className="truncate text-[11px] text-ink-3 mt-0.5">{pick.sub}</p>
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
                      className={`group flex w-full cursor-pointer items-center gap-3 rounded-xl p-2 text-left transition-colors ${
                        isCurrent
                          ? 'bg-surface-2 ring-1 ring-line'
                          : 'hover:bg-surface-2'
                      }`}
                    >
                      <div className="relative aspect-video w-16 h-12 shrink-0 overflow-hidden rounded-xl bg-surface-3 ring-1 ring-line">
                        <Image
                          src={thumbUrl}
                          alt={link.title}
                          fill
                          sizes="64px"
                          unoptimized
                          className="size-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-xs sm:text-sm font-semibold ${
                            isCurrent ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink'
                          }`}
                        >
                          {link.title}
                        </p>
                        <p className="truncate text-[11px] text-ink-3 font-mono mt-0.5">{link.id}</p>
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
