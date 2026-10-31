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
import { TactileButton } from '@/components/ui/TactileButton';

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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mx', `${x}px`);
    e.currentTarget.style.setProperty('--my', `${y}px`);
  };

  return (
    <aside className="sticky top-0 hidden min-h-dvh w-80 shrink-0 self-start border-line lg:block xl:w-90 xl:border-r">
      {/* Top Header Bar with Follow Button */}
      <div className="sticky top-0 z-10 flex h-17.5 items-center justify-end gap-2 border-b border-line bg-surface/85 px-6 backdrop-blur-md">
        <TactileButton
          variant="obsidian"
          size="sm"
          onClick={() => {
            setIsFollowingMain(!isFollowingMain);
            window.open('https://x.com/0xZahidP', '_blank', 'noopener,noreferrer');
          }}
          title="Follow @0xZahidP on X"
        >
          <XIcon className="size-3.5 text-white" />
          <span>{isFollowingMain ? 'Following' : 'Follow'}</span>
        </TactileButton>
      </div>

      <div className="flex flex-col gap-6 p-6 overflow-y-auto [scrollbar-width:none]">
        {/* Open to Conversations Mini Card with Halo Hover Glow */}
        <div
          className="halo relative rounded-3xl cursor-default"
          onMouseMove={handleMouseMove}
        >
          <div className="halo-glow" aria-hidden="true" />
          <div className="glass relative z-10 h-full overflow-hidden p-5 rounded-3xl border border-line bg-surface/90 backdrop-blur-md">
            <div className="halo-spot" aria-hidden="true" />
            <div className="relative z-10">
              <p className="flex items-center gap-2.5 text-body font-semibold text-ink">
                <span className="relative flex size-2 shrink-0" aria-hidden="true">
                  <span className="absolute inline-flex size-full rounded-full bg-brand-400 opacity-75 motion-safe:animate-ping" />
                  <span className="relative inline-flex size-2 rounded-full bg-brand-500" />
                </span>
                <span>Open to new conversations</span>
              </p>
              <p className="mt-2 text-meta text-ink-2 leading-relaxed">
                Software engineer and agentic builder. Always happy to talk products, collaborations and consultations.
              </p>
              <div className="mt-4">
                <TactileButton size="sm" onClick={onContactClick}>
                  Let’s talk
                </TactileButton>
              </div>
            </div>
          </div>
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
      </div>
    </aside>
  );
};
