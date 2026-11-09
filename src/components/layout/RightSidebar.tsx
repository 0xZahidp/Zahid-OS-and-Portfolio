'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  UserPlus,
  ArrowUpRight,
  ArrowRight,
  ShieldCheck,
  Check,
  Globe,
} from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';
import { DEFAULT_PERSON_AVATAR } from '@/lib/constants';
import {
  GitHubIcon,
  XIcon,
  LinkedInIcon,
  FacebookIcon,
  YouTubeIcon,
  TelegramIcon,
  getPlatformIcon,
} from '@/components/ui/Icons';

interface RightSidebarProps {
  onContactClick: () => void;
  onNavigate?: (section: string) => void;
  activeSection?: string;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  onContactClick,
  onNavigate,
  activeSection = 'profile',
}) => {
  const { content } = usePortfolio();
  const suggestedPeople = Array.isArray(content.suggestedPeople) ? content.suggestedPeople : [];
  const socialLinksData = Array.isArray(content.socialLinks) ? content.socialLinks : [];
  const [followedState, setFollowedState] = useState<Record<string, boolean>>({});
  const [isFollowingMain, setIsFollowingMain] = useState(false);

  const renderSidebarPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'x':
        return <XIcon className="size-2.75 text-ink" />;
      case 'github':
        return <GitHubIcon className="size-2.75 text-ink" />;
      case 'linkedin':
        return <LinkedInIcon className="size-2.75 text-ink" />;
      case 'telegram':
        return <TelegramIcon className="size-2.75 text-ink" />;
      case 'facebook':
        return <FacebookIcon className="size-2.75 text-ink" />;
      case 'youtube':
        return <YouTubeIcon className="size-2.75 text-red-500" />;
      case 'website':
      default:
        return <Globe className="size-2.75 text-ink" />;
    }
  };

  const toggleFollow = (id: string) => {
    setFollowedState((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getSocialIcon = (platform: string, url?: string) => {
    return getPlatformIcon(platform, url, 'size-4');
  };

  return (
    <aside className="sticky top-0 hidden min-h-dvh w-80 shrink-0 self-start border-line lg:block xl:w-[22.5rem] xl:border-r bg-surface">
      {/* Top Header Bar with Follow Button - Aligned with desktop main header at h-[4.375rem] */}
      <div className="sticky top-0 z-10 flex h-[4.375rem] items-center justify-end px-6 border-b border-line bg-surface/85 backdrop-blur-md">
        <button
          type="button"
          onClick={() => {
            setIsFollowingMain(!isFollowingMain);
            window.open('https://x.com/0xZahidP', '_blank', 'noopener,noreferrer');
          }}
          className="btn btn-inverse h-10 px-4.5 text-body gap-2"
          title="Follow @0xZahidP on X"
        >
          <XIcon className="size-3.5 fill-current" />
          <span>{isFollowingMain ? 'Following' : 'Follow'}</span>
        </button>
      </div>

      <div className="flex flex-col gap-9 px-6 py-7 overflow-y-auto [scrollbar-width:none]">
        {/* 1. Open to Conversations Card (Halo + rotating conic glow + glass surface) */}
        {activeSection !== 'contact' && (
          <div className="halo relative rounded-3xl" data-halo="">
            <div className="halo-glow" aria-hidden="true" />
            <div className="glass h-full overflow-hidden p-4">
              <div className="halo-spot" aria-hidden="true" />
              <div className="relative">
                <p className="flex items-center gap-2.5 text-body font-semibold text-ink">
                  <span className="relative flex size-2 shrink-0" aria-hidden="true">
                    <span className="absolute inline-flex size-full rounded-full bg-brand-400 opacity-75 motion-safe:animate-ping" />
                    <span className="relative inline-flex size-2 rounded-full bg-brand-500" />
                  </span>
                  Open to new conversations
                </p>

                <p className="mt-2 text-meta leading-relaxed text-ink-2">
                  Software engineer and agentic builder. Always happy to talk products, collaborations and consultations.
                </p>

                <button
                  type="button"
                  onClick={onContactClick}
                  className="btn btn-primary h-8 px-3.5 text-meta mt-3.5"
                >
                  Let&apos;s talk
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. Who to Follow Card (Card Raised - solid surface, subtle border, shadow) */}
        {activeSection !== 'people' && suggestedPeople.length > 0 && (
          <section id="who-to-follow" className="card-raised p-4 hover:translate-0">
            <h2 className="mb-2 flex items-center gap-2 text-body font-semibold text-ink">
              <UserPlus className="size-4.5 text-link shrink-0" />
              <span>Who to follow</span>
            </h2>

            <ul className="-mx-2">
              {suggestedPeople.slice(0, 3).map((person) => {
                const isFollowing = followedState[person.id] || false;
                const platformKey =
                  person.primaryPlatform ||
                  (person.url?.includes('github.com')
                    ? 'github'
                    : person.url?.includes('youtube.com')
                    ? 'youtube'
                    : person.url?.includes('linkedin.com')
                    ? 'linkedin'
                    : person.url?.includes('facebook.com')
                    ? 'facebook'
                    : 'x');
                const targetUrl = person.primaryUrl || person.url || '#';

                return (
                  <li
                    key={person.id}
                    className="flex items-center gap-2 rounded-xl px-2 py-2 transition-colors hover:bg-surface-2"
                  >
                    <a
                      href={targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-w-0 flex-1 items-center gap-3"
                      title={person.name}
                    >
                      <span className="relative inline-block shrink-0 self-start">
                        <Image
                          src={person.avatar_url?.trim() || DEFAULT_PERSON_AVATAR}
                          alt={person.name}
                          width={36}
                          height={36}
                          className="rounded-full object-cover size-9 text-meta ring-1 ring-line"
                          unoptimized
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = DEFAULT_PERSON_AVATAR;
                          }}
                        />
                        <span
                          className="absolute grid place-items-center rounded-full bg-surface text-ink shadow-sm ring-2 ring-surface size-4.5 -right-0.5 -bottom-0.5"
                          title={platformKey.toUpperCase()}
                        >
                          {renderSidebarPlatformIcon(platformKey)}
                        </span>
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1 text-body font-semibold text-ink truncate">
                          <span className="truncate">{person.name}</span>
                          {person.verified && (
                            <span className="text-emerald-500 text-xs shrink-0 select-none" title="Verified">
                              💚
                            </span>
                          )}
                        </span>
                        <span className="block truncate text-meta text-ink-3">
                          {person.primaryHandle ? `${person.primaryHandle} · ` : ''}{person.role}
                        </span>
                      </span>
                    </a>

                    <button
                      type="button"
                      onClick={() => toggleFollow(person.id)}
                      aria-label={`Follow ${person.name}`}
                      className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl font-semibold tracking-[-0.01em] whitespace-nowrap select-none btn btn-secondary h-8 px-3.5 text-meta"
                    >
                      {isFollowing ? (
                        <span className="btn-content inline-flex items-center gap-1.5">
                          <Check className="size-3.5 text-brand-500 mr-1" />
                          Following
                        </span>
                      ) : (
                        <span className="btn-content inline-flex items-center gap-1.5">
                          Follow
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Footer with avatar stack */}
            <button
              type="button"
              onClick={() => {
                if (onNavigate) {
                  onNavigate('people');
                } else {
                  window.location.href = '#people';
                }
              }}
              className="w-full -mx-2 mt-1 flex items-center justify-between gap-2 rounded-xl px-2 py-2 transition-colors hover:bg-surface-2 cursor-pointer text-left"
            >
              <span className="text-meta font-semibold whitespace-nowrap text-link">
                See all {suggestedPeople.length} people
              </span>

              <span className="facepile flex items-center" aria-hidden="true">
                {suggestedPeople.slice(0, 3).map((p, idx) => (
                  <span
                    key={p.id}
                    className={`relative inline-block shrink-0 self-start ${idx > 0 ? '-ml-2' : ''}`}
                  >
                    <Image
                      src={p.avatar_url?.trim() || DEFAULT_PERSON_AVATAR}
                      alt=""
                      width={28}
                      height={28}
                      className="rounded-full object-cover size-7 text-micro ring-2 ring-surface"
                      unoptimized
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = DEFAULT_PERSON_AVATAR;
                      }}
                    />
                  </span>
                ))}
                {suggestedPeople.length > 3 && (
                  <span className="relative inline-flex items-center justify-center rounded-full bg-surface-2 text-micro font-semibold text-ink-3 size-7 ring-2 ring-surface -ml-2">
                    +{suggestedPeople.length - 3}
                  </span>
                )}
              </span>
            </button>
          </section>
        )}

        {/* 3. Find me on Section */}
        {activeSection !== 'contact' && socialLinksData.length > 0 && (
          <section>
            <h2 className="mb-3 flex items-center gap-2.5 text-body font-semibold text-ink">
              <span className="size-2 rounded-full bg-brand-500" aria-hidden="true" />
              Find me on
            </h2>

            <ul className="-mx-2">
              {socialLinksData.map((social) => (
                <li key={social.id}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="me noopener noreferrer"
                    className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface-2"
                  >
                    <span className="btn btn-secondary grid size-9 place-items-center rounded-full shrink-0">
                      <span className="btn-content">
                        {getSocialIcon(social.platform, social.url)}
                      </span>
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-body font-medium text-ink">{social.label}</span>
                      <span className="block truncate text-meta text-ink-3">{social.handle}</span>
                    </span>

                    <ArrowUpRight className="size-4 text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </li>
              ))}
            </ul>

            <a
              href="/contact#find-me-on"
              className="group -mx-2 mt-1 flex items-center gap-1 rounded-xl px-2 py-2 text-meta font-semibold text-link transition-colors hover:bg-surface-2"
            >
              <span>See all {socialLinksData.length} profiles</span>
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </a>
          </section>
        )}

        {/* 4. DMCA & Protected Badge */}
        <div className="pt-2 flex items-center gap-2 text-micro text-ink-3">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-500/10 px-2 py-1 font-semibold text-brand-600 dark:text-brand-400 ring-1 ring-brand-500/20">
            <ShieldCheck className="size-3.5" />
            DMCA PROTECTED
          </span>
        </div>
      </div>
    </aside>
  );
};
