'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  UserPlus,
  ArrowUpRight,
  ArrowRight,
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
        {activeSection !== 'people' && (
          <section id="who-to-follow" className="card-raised p-4 hover:translate-0">
            <h2 className="mb-2 flex items-center gap-2 text-body font-semibold text-ink">
              <UserPlus className="size-4.5 text-link shrink-0" />
              <span>Who to follow</span>
            </h2>

            <ul className="-mx-2">
              {suggestedPeople.map((person) => {
                const isFollowing = followedState[person.id] || false;
                const isGitHub = person.url.includes('github.com');

                return (
                  <li
                    key={person.id}
                    className="flex items-center gap-2 rounded-xl px-2 py-2 transition-colors hover:bg-surface-2"
                  >
                    <a
                      href={person.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-w-0 flex-1 items-center gap-3"
                      title={person.name}
                    >
                      <span className="relative inline-block shrink-0 self-start">
                        <Image
                          src={person.avatar_url}
                          alt={person.name}
                          width={36}
                          height={36}
                          className="rounded-full object-cover size-9 text-meta ring-1 ring-line"
                        />
                        <span
                          className="absolute grid place-items-center rounded-full bg-surface text-ink shadow-sm ring-2 ring-surface size-4.5 -right-0.5 -bottom-0.5"
                          title={isGitHub ? 'GitHub' : 'X'}
                        >
                          {isGitHub ? (
                            <GitHubIcon className="size-2.75 text-ink" />
                          ) : (
                            <XIcon className="size-2.75 text-ink" />
                          )}
                        </span>
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-body font-semibold text-ink">
                          {person.name}
                        </span>
                        <span className="block truncate text-meta text-ink-3">
                          {person.role}
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
            <a
              href="/people"
              className="-mx-2 mt-1 flex items-center justify-between gap-2 rounded-xl px-2 py-2 transition-colors hover:bg-surface-2"
            >
              <span className="text-meta font-semibold whitespace-nowrap text-link">
                See all 11 people
              </span>

              <span className="facepile flex items-center" aria-hidden="true">
                <span className="relative inline-block shrink-0 self-start">
                  <Image
                    src="/images/face-1.jpg"
                    alt=""
                    width={28}
                    height={28}
                    className="rounded-full object-cover size-7 text-micro ring-2 ring-surface"
                  />
                </span>
                <span className="relative inline-block shrink-0 self-start -ml-2">
                  <Image
                    src="/images/face-2.jpg"
                    alt=""
                    width={28}
                    height={28}
                    className="rounded-full object-cover size-7 text-micro ring-2 ring-surface"
                  />
                </span>
                <span className="relative inline-block shrink-0 self-start -ml-2">
                  <Image
                    src="/images/face-3.jpg"
                    alt=""
                    width={28}
                    height={28}
                    className="rounded-full object-cover size-7 text-micro ring-2 ring-surface"
                  />
                </span>
                <span className="grid size-7 place-items-center rounded-full bg-surface-2 text-micro font-semibold text-ink-2 ring-1 ring-line -ml-2">
                  +5
                </span>
              </span>
            </a>
          </section>
        )}

        {/* 3. Find me on Section */}
        {activeSection !== 'contact' && (
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
                        {getSocialIcon(social.platform)}
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
              <span>See all 7 profiles</span>
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
