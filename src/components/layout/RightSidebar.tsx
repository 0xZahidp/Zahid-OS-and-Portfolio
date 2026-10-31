'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  UserPlus,
  ArrowUpRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { suggestedPeople, socialLinksData } from '@/data/profile';
import {
  GitHubIcon,
  XIcon,
  LinkedInIcon,
  FacebookIcon,
} from '@/components/ui/Icons';

interface RightSidebarProps {
  onContactClick: () => void;
  activeSection?: string;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  onContactClick,
  activeSection = 'profile',
}) => {
  const [followedState, setFollowedState] = useState<Record<string, boolean>>({});
  const [isFollowingMain, setIsFollowingMain] = useState(false);

  const toggleFollow = (id: string) => {
    setFollowedState((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'github':
        return <GitHubIcon className="size-4" />;
      case 'x':
        return <XIcon className="size-3.5" />;
      case 'linkedin':
        return <LinkedInIcon className="size-4" />;
      case 'facebook':
        return <FacebookIcon className="size-4" />;
      default:
        return <ArrowUpRight className="size-4" />;
    }
  };

  return (
    <aside className="sticky top-0 hidden min-h-dvh w-[22.5rem] shrink-0 self-start border-r border-line lg:block bg-surface">
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
        {activeSection !== 'people' && (
          <section id="who-to-follow" className="card-raised p-4">
            <h2 className="mb-2 flex items-center gap-2 text-body font-semibold text-ink">
              <UserPlus className="size-4.5 text-link shrink-0" />
              <span>Who to follow</span>
            </h2>

            <ul className="divide-y divide-line/60">
              {suggestedPeople.map((person) => {
                const isFollowing = followedState[person.id] || false;
                const isGitHub = person.url.includes('github.com');

                return (
                  <li key={person.id} className="flex items-center justify-between gap-3 py-3 first:pt-2 last:pb-1">
                    <a
                      href={person.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-w-0 items-center gap-3 group"
                    >
                      <div className="relative size-10 shrink-0 rounded-full">
                        <Image
                          src={person.avatar_url}
                          alt={person.name}
                          width={40}
                          height={40}
                          className="size-10 rounded-full object-cover ring-1 ring-line"
                        />
                        <span className="absolute -bottom-1 -right-1 grid size-4.5 place-items-center rounded-full bg-surface border border-line shadow-xs">
                          {isGitHub ? (
                            <GitHubIcon className="size-2.5 text-ink" />
                          ) : (
                            <XIcon className="size-2 text-ink" />
                          )}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-meta font-semibold text-ink group-hover:text-link transition-colors">
                          {person.name}
                        </p>
                        <p className="truncate text-micro text-ink-3 mt-0.5">{person.role}</p>
                      </div>
                    </a>

                    <button
                      type="button"
                      onClick={() => toggleFollow(person.id)}
                      className="btn btn-secondary h-8 px-3.5 text-meta shrink-0"
                    >
                      {isFollowing ? (
                        <>
                          <Check className="size-3.5 text-brand-500 mr-1" />
                          <span>Following</span>
                        </>
                      ) : (
                        <span>Follow</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Footer with avatar stack */}
            <div className="mt-3 flex items-center justify-between pt-3 border-t border-line">
              <a
                href="https://github.com/0xZahidp?tab=following"
                target="_blank"
                rel="noopener noreferrer"
                className="text-meta font-semibold text-link hover:underline"
              >
                See all 11 people
              </a>

              <div className="flex items-center -space-x-1.5">
                {suggestedPeople.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    className="size-5.5 rounded-full ring-2 ring-surface overflow-hidden"
                  >
                    <Image
                      src={p.avatar_url}
                      alt={p.name}
                      width={22}
                      height={22}
                      className="size-full object-cover"
                    />
                  </div>
                ))}
                <span className="grid size-5.5 place-items-center rounded-full bg-surface-2 text-[10px] font-semibold text-ink-2 ring-2 ring-surface">
                  +5
                </span>
              </div>
            </div>
          </section>
        )}

        {/* 3. Find me on Section */}
        {activeSection !== 'contact' && (
          <section>
            <h2 className="mb-3 flex items-center gap-2.5 text-body font-semibold text-ink">
              <span className="size-2 rounded-full bg-brand-500" aria-hidden="true" />
              Find me on
            </h2>

            <ul className="-mx-2 space-y-0.5">
              {socialLinksData.map((social) => (
                <li key={social.id}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-xl px-2 py-2 hover:bg-surface-2 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="btn btn-secondary grid size-9 place-items-center rounded-full shrink-0">
                        {getSocialIcon(social.platform)}
                      </span>
                      <div className="min-w-0 leading-tight">
                        <p className="text-meta font-semibold text-ink">{social.label}</p>
                        <p className="text-micro text-ink-3 mt-0.5">{social.handle}</p>
                      </div>
                    </div>
                    <ArrowUpRight className="size-4 text-ink-3 group-hover:text-ink transition-colors mr-1" />
                  </a>
                </li>
              ))}
            </ul>

            <div className="pt-2">
              <a
                href="https://github.com/0xZahidp"
                target="_blank"
                rel="noopener noreferrer"
                className="text-meta font-semibold text-link hover:underline"
              >
                See all 7 profiles →
              </a>
            </div>
          </section>
        )}

        {/* 4. DMCA & Protected Badge */}
        <div className="pt-2 border-t border-line flex items-center gap-2 text-micro text-ink-3">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-500/10 px-2 py-1 font-semibold text-brand-600 dark:text-brand-400 ring-1 ring-brand-500/20">
            <ShieldCheck className="size-3.5" />
            DMCA PROTECTED
          </span>
        </div>
      </div>
    </aside>
  );
};
