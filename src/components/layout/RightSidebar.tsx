'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Users,
  ExternalLink,
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
        return <GitHubIcon className="size-4" />;
      case 'x':
        return <XIcon className="size-4" />;
      case 'linkedin':
        return <LinkedInIcon className="size-4" />;
      case 'facebook':
        return <FacebookIcon className="size-4" />;
      default:
        return <ExternalLink className="size-4" />;
    }
  };

  return (
    <aside className="sticky top-0 hidden h-dvh w-80 shrink-0 flex-col gap-5 overflow-y-auto px-4 py-5 [scrollbar-width:none] lg:flex border-l border-line bg-surface/30">
      {/* Top Follow Button */}
      <div className="flex justify-end">
        <a
          href="https://x.com/0xZahidP"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setIsFollowingMain(!isFollowingMain)}
          className={`btn ${
            isFollowingMain
              ? 'btn-secondary text-brand-500'
              : 'bg-zinc-100 hover:bg-white text-zinc-900 shadow-md'
          } h-9 px-4.5 rounded-xl font-semibold text-xs tracking-tight transition-all`}
        >
          <span className="btn-content inline-flex items-center gap-1.5">
            <XIcon className="size-3.5" />
            <span>{isFollowingMain ? 'Following' : 'Follow'}</span>
          </span>
        </a>
      </div>

      {/* Open to Conversations Mini Card */}
      <div className="card-raised p-4 bg-surface/80">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-500">
          <span className="size-1.5 rounded-full bg-brand-500 animate-pulse" />
          <span>Open to new conversations</span>
        </p>
        <p className="mt-1 text-xs text-ink-2 leading-relaxed">
          Developer & Growth Strategist. Always happy to talk products, SaaS architectures, collaborations and consultations.
        </p>
        <button
          type="button"
          onClick={onContactClick}
          className="mt-3 btn btn-primary h-7 px-3 rounded-lg text-xs font-bold"
        >
          Let’s talk
        </button>
      </div>

      {/* Who to Follow Card */}
      <div id="who-to-follow" className="card-raised p-4">
        <div className="mb-3.5 flex items-center gap-2">
          <Users className="size-4 text-ink-3" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-2">
            Who to follow
          </h3>
        </div>

        <ul className="space-y-3">
          {suggestedPeople.map((person) => {
            const isFollowing = followedState[person.id] || false;

            return (
              <li key={person.id} className="flex items-center justify-between gap-3">
                <a
                  href={person.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-w-0 items-center gap-2.5 group"
                >
                  <div className="relative size-8 shrink-0 rounded-full overflow-hidden ring-1 ring-line">
                    <Image
                      src={person.avatar_url}
                      alt={person.name}
                      width={32}
                      height={32}
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-ink group-hover:text-link transition-colors">
                      {person.name}
                    </p>
                    <p className="truncate text-[11px] text-ink-3">{person.role}</p>
                  </div>
                </a>

                <button
                  type="button"
                  onClick={() => toggleFollow(person.id)}
                  className={`btn ${
                    isFollowing ? 'btn-secondary text-brand-500' : 'btn-secondary'
                  } h-7 px-2.5 rounded-lg text-xs font-medium shrink-0`}
                >
                  {isFollowing ? (
                    <Check className="size-3" />
                  ) : (
                    <span>Follow</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Footer with mini avatars stack */}
        <div className="mt-4 flex items-center justify-between pt-3 border-t border-line/70">
          <a
            href="https://github.com/0xZahidp?tab=following"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-link hover:underline inline-flex items-center gap-1"
          >
            See all 11 people →
          </a>

          <div className="flex -space-x-1.5">
            {suggestedPeople.slice(0, 3).map((p) => (
              <div
                key={p.id}
                className="size-5 rounded-full ring-2 ring-surface overflow-hidden"
              >
                <Image
                  src={p.avatar_url}
                  alt={p.name}
                  width={20}
                  height={20}
                  className="size-full object-cover"
                />
              </div>
            ))}
            <span className="grid size-5 place-items-center rounded-full bg-surface-2 text-[9px] font-bold text-ink-3 ring-2 ring-surface">
              +5
            </span>
          </div>
        </div>
      </div>

      {/* Find me on Socials Section */}
      <div className="space-y-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-2">
          <span className="size-1.5 rounded-full bg-brand-500" />
          <span>Find me on</span>
        </p>

        <ul className="space-y-1">
          {socialLinksData.map((social) => (
            <li key={social.id}>
              <a
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between rounded-xl px-3 py-2 text-xs text-ink-2 hover:bg-surface-2 hover:text-ink transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-ink-3 group-hover:text-ink transition-colors">
                    {getSocialIcon(social.platform)}
                  </span>
                  <span className="font-medium text-ink">{social.label}</span>
                  <span className="text-ink-3">{social.handle}</span>
                </span>
                <ExternalLink className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-ink-3" />
              </a>
            </li>
          ))}
        </ul>

        <div className="px-3 pt-1">
          <a
            href="https://github.com/0xZahidp"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-link hover:underline"
          >
            See all profiles →
          </a>
        </div>
      </div>

      {/* DMCA & Security Badge */}
      <div className="mt-auto pt-4 flex items-center gap-2 text-[10px] text-ink-3">
        <span className="inline-flex items-center gap-1 rounded bg-brand-500/10 px-1.5 py-0.5 font-semibold text-brand-600 ring-1 ring-brand-500/20">
          <ShieldCheck className="size-3" />
          DMCA PROTECTED
        </span>
      </div>
    </aside>
  );
};
