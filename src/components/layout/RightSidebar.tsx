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
import { Button } from '@/components/ui/Button';

interface RightSidebarProps {
  onContactClick: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ onContactClick }) => {
  const [followedState, setFollowedState] = useState<Record<string, boolean>>({});
  const [isFollowingMain, setIsFollowingMain] = useState(false);

  const toggleFollow = (id: string) => {
    setFollowedState((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'github':
        return <GitHubIcon className="size-5" />;
      case 'x':
        return <XIcon className="size-5" />;
      case 'linkedin':
        return <LinkedInIcon className="size-5" />;
      case 'facebook':
        return <FacebookIcon className="size-5" />;
      default:
        return <ArrowUpRight className="size-5" />;
    }
  };

  return (
    <aside className="sticky top-0 hidden min-h-dvh w-[400px] xl:w-[400px] shrink-0 self-start border-r border-line lg:block bg-background">
      {/* Top Header Bar with Follow Button - 44px height, 14px radius, obsidian finish */}
      <div className="sticky top-0 z-10 flex h-[70px] items-center justify-end px-6 border-b border-line bg-surface/85 backdrop-blur-md">
        <Button
          variant="dark"
          size="sm"
          onClick={() => {
            setIsFollowingMain(!isFollowingMain);
            window.open('https://x.com/0xZahidP', '_blank', 'noopener,noreferrer');
          }}
          className="rounded-[14px] h-10 px-5 text-sm"
          title="Follow @0xZahidP on X"
        >
          <XIcon className="size-4 text-white" />
          <span>{isFollowingMain ? 'Following' : 'Follow'}</span>
        </Button>
      </div>

      <div className="flex flex-col gap-6 p-6 overflow-y-auto [scrollbar-width:none]">
        {/* 1. Open to Conversations Card (Separate component with strictly clipped internal top-right glow) */}
        <div className="card-conversations p-6">
          {/* Status Chip */}
          <div className="flex items-center gap-2">
            <span className="relative flex size-2 shrink-0" aria-hidden="true">
              <span className="absolute inline-flex size-full rounded-full bg-emerald-400 opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[15px] font-semibold text-ink">
              Open to new conversations
            </span>
          </div>

          {/* Description */}
          <p className="mt-3 text-sm leading-relaxed text-ink-2">
            Software engineer and agentic builder. Always happy to talk products, collaborations and consultations.
          </p>

          {/* Let's talk primary green button */}
          <div className="mt-5">
            <Button
              variant="primary"
              size="sm"
              onClick={onContactClick}
              className="rounded-[14px] h-9 px-5 text-sm"
            >
              Let’s talk
            </Button>
          </div>
        </div>

        {/* 2. Who to Follow Card (Solid surface, NO green tint, 28px radius) */}
        <div id="who-to-follow" className="card-panel p-6">
          <div className="mb-4 flex items-center gap-2.5">
            <UserPlus className="size-5 text-emerald-500 shrink-0" />
            <h3 className="text-base font-semibold text-ink">
              Who to follow
            </h3>
          </div>

          <ul className="space-y-4">
            {suggestedPeople.map((person) => {
              const isFollowing = followedState[person.id] || false;
              const isGitHub = person.url.includes('github.com');

              return (
                <li key={person.id} className="flex items-center justify-between gap-3">
                  <a
                    href={person.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-w-0 items-center gap-3 group"
                  >
                    {/* 44px avatar with small 20px platform badge at bottom-right */}
                    <div className="relative size-11 shrink-0 rounded-full">
                      <Image
                        src={person.avatar_url}
                        alt={person.name}
                        width={44}
                        height={44}
                        className="size-11 rounded-full object-cover ring-1 ring-line"
                      />
                      <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-surface border border-line shadow-xs">
                        {isGitHub ? (
                          <GitHubIcon className="size-3 text-ink" />
                        ) : (
                          <XIcon className="size-2.5 text-ink" />
                        )}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink group-hover:text-link transition-colors">
                        {person.name}
                      </p>
                      <p className="truncate text-xs text-ink-3 mt-0.5">{person.role}</p>
                    </div>
                  </a>

                  {/* Secondary style follow button: 12px radius, white surface, subtle border, dark semibold text */}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => toggleFollow(person.id)}
                    className="rounded-[12px] h-9 px-4 text-xs font-semibold shrink-0"
                  >
                    {isFollowing ? (
                      <>
                        <Check className="size-3.5 text-emerald-500" />
                        <span>Following</span>
                      </>
                    ) : (
                      <span>Follow</span>
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>

          {/* Footer with avatar stack and "+5" chip */}
          <div className="mt-5 flex items-center justify-between pt-4 border-t border-line">
            <a
              href="https://github.com/0xZahidp?tab=following"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              See all 11 people
            </a>

            <div className="flex items-center -space-x-2">
              {suggestedPeople.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  className="size-6 rounded-full ring-2 ring-surface overflow-hidden"
                >
                  <Image
                    src={p.avatar_url}
                    alt={p.name}
                    width={24}
                    height={24}
                    className="size-full object-cover"
                  />
                </div>
              ))}
              <span className="grid size-6 place-items-center rounded-full bg-surface-2 text-[10px] font-semibold text-ink-2 ring-2 ring-surface">
                +5
              </span>
            </div>
          </div>
        </div>

        {/* 3. Find me on Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500" />
            <h3 className="text-base font-semibold text-ink">Find me on</h3>
          </div>

          <ul className="space-y-1">
            {socialLinksData.map((social) => (
              <li key={social.id}>
                <a
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between rounded-2xl p-2.5 -mx-2.5 hover:bg-surface-2 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* 44px circular icon button */}
                    <span className="grid size-11 place-items-center rounded-full bg-surface-2 border border-line text-ink group-hover:scale-105 transition-transform shrink-0">
                      {getSocialIcon(social.platform)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">{social.label}</p>
                      <p className="text-xs text-ink-3 mt-0.5">{social.handle}</p>
                    </div>
                  </div>
                  <ArrowUpRight className="size-4 text-ink-3 group-hover:text-ink transition-colors mr-2" />
                </a>
              </li>
            ))}
          </ul>

          <div className="pt-2">
            <a
              href="https://github.com/0xZahidp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              See all 7 profiles →
            </a>
          </div>
        </div>

        {/* 4. DMCA & Footer Quiet Area */}
        <div className="mt-4 pt-4 border-t border-line flex items-center gap-2 text-xs text-ink-3">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1 font-semibold text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
            <ShieldCheck className="size-3.5" />
            DMCA PROTECTED
          </span>
        </div>
      </div>
    </aside>
  );
};
