'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Check } from 'lucide-react';
import { Profile } from '@/types/profile';
import {
  TablerX,
  TablerLink,
  TablerMail,
  VerifiedBadgeIcon,
  SimpleIconsX,
  LogosLinkedInIcon,
  LogosFacebookIcon,
  LogosWhatsAppIcon,
  LogosTelegramIcon,
} from './Icons';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  url?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  profile,
  url,
}) => {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('https://zahid.dev');
  const [displayUrl, setDisplayUrl] = useState('zahid.dev');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentUrl = url || window.location.href;
      setShareUrl(currentUrl);
      try {
        const parsed = new URL(currentUrl);
        setDisplayUrl(parsed.host || 'zahid.dev');
      } catch {
        setDisplayUrl('zahid.dev');
      }
    }
  }, [url]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  const handleShareTo = (platform: 'x' | 'linkedin' | 'facebook' | 'whatsapp' | 'telegram' | 'email') => {
    const text = `${profile.full_name} - ${profile.headline}`;
    let targetUrl = '';

    switch (platform) {
      case 'x':
        targetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'linkedin':
        targetUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'facebook':
        targetUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'whatsapp':
        targetUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${text} ${shareUrl}`)}`;
        break;
      case 'telegram':
        targetUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
        break;
      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent(`${profile.full_name} - Developer Profile`)}&body=${encodeURIComponent(`${text}\n\n${shareUrl}`)}`;
        return;
    }

    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer,width=600,height=520');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.full_name} (Zahid) - Developer Profile`,
          text: `${profile.full_name} - ${profile.headline}`,
          url: shareUrl,
        });
      } catch {
        // Ignored or cancelled by user
      }
    } else {
      handleCopy();
    }
  };

  const shareBlurb =
    profile.bio ||
    'Software engineer and agentic builder shipping global SaaS, now CTO at Bidvers. Always up for a chat about code, careers or English.';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[460px] overflow-hidden rounded-[28px] bg-surface border border-line shadow-2xl animate-in zoom-in-95 duration-200 text-ink"
      >
        <div className="p-5 sm:p-6">
          {/* Header */}
          <div className="mb-5 flex items-center justify-between">
            <h2 id="share-title" className="text-lg font-semibold tracking-tight text-ink">
              Share profile
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="btn btn-secondary grid size-9 place-items-center rounded-full hover:bg-surface-2 transition-colors"
            >
              <span className="btn-content">
                <TablerX className="size-4.5" />
              </span>
            </button>
          </div>

          {/* Profile Card Preview */}
          <div className="flex items-start gap-3 rounded-2xl bg-surface-2 p-3.5 ring-1 ring-line">
            <Image
              src={profile.avatar_url}
              alt={profile.full_name}
              width={48}
              height={48}
              className="size-12 rounded-full ring-1 ring-line object-cover shrink-0"
            />
            <div className="min-w-0">
              <p className="flex items-center gap-1 truncate font-semibold text-ink">
                <span>{profile.full_name}</span>
                <VerifiedBadgeIcon className="size-4 shrink-0 text-brand-500" />
              </p>
              <p className="line-clamp-3 text-meta text-ink-2 mt-0.5 leading-relaxed">
                {shareBlurb}
              </p>
            </div>
          </div>

          {/* 6 Social Share Buttons */}
          <ul className="mt-5 grid grid-cols-3 gap-1 sm:grid-cols-6">
            {/* 1. X */}
            <li>
              <button
                type="button"
                onClick={() => handleShareTo('x')}
                className="group flex w-full cursor-pointer flex-col items-center gap-2 rounded-2xl px-1 py-2.5 transition-colors hover:bg-surface-2"
              >
                <span className="btn btn-secondary grid size-12 place-items-center rounded-full group-hover:border-line-strong transition-all">
                  <span className="btn-content">
                    <SimpleIconsX className="size-5 text-ink" />
                  </span>
                </span>
                <span className="text-xs text-ink-2 group-hover:text-ink">X</span>
              </button>
            </li>

            {/* 2. LinkedIn */}
            <li>
              <button
                type="button"
                onClick={() => handleShareTo('linkedin')}
                className="group flex w-full cursor-pointer flex-col items-center gap-2 rounded-2xl px-1 py-2.5 transition-colors hover:bg-surface-2"
              >
                <span className="btn btn-secondary grid size-12 place-items-center rounded-full group-hover:border-line-strong transition-all">
                  <span className="btn-content">
                    <LogosLinkedInIcon className="size-5" />
                  </span>
                </span>
                <span className="text-xs text-ink-2 group-hover:text-ink">LinkedIn</span>
              </button>
            </li>

            {/* 3. Facebook */}
            <li>
              <button
                type="button"
                onClick={() => handleShareTo('facebook')}
                className="group flex w-full cursor-pointer flex-col items-center gap-2 rounded-2xl px-1 py-2.5 transition-colors hover:bg-surface-2"
              >
                <span className="btn btn-secondary grid size-12 place-items-center rounded-full group-hover:border-line-strong transition-all">
                  <span className="btn-content">
                    <LogosFacebookIcon className="size-5" />
                  </span>
                </span>
                <span className="text-xs text-ink-2 group-hover:text-ink">Facebook</span>
              </button>
            </li>

            {/* 4. WhatsApp */}
            <li>
              <button
                type="button"
                onClick={() => handleShareTo('whatsapp')}
                className="group flex w-full cursor-pointer flex-col items-center gap-2 rounded-2xl px-1 py-2.5 transition-colors hover:bg-surface-2"
              >
                <span className="btn btn-secondary grid size-12 place-items-center rounded-full group-hover:border-line-strong transition-all">
                  <span className="btn-content">
                    <LogosWhatsAppIcon className="size-5" />
                  </span>
                </span>
                <span className="text-xs text-ink-2 group-hover:text-ink">WhatsApp</span>
              </button>
            </li>

            {/* 5. Telegram */}
            <li>
              <button
                type="button"
                onClick={() => handleShareTo('telegram')}
                className="group flex w-full cursor-pointer flex-col items-center gap-2 rounded-2xl px-1 py-2.5 transition-colors hover:bg-surface-2"
              >
                <span className="btn btn-secondary grid size-12 place-items-center rounded-full group-hover:border-line-strong transition-all">
                  <span className="btn-content">
                    <LogosTelegramIcon className="size-5" />
                  </span>
                </span>
                <span className="text-xs text-ink-2 group-hover:text-ink">Telegram</span>
              </button>
            </li>

            {/* 6. Email */}
            <li>
              <button
                type="button"
                onClick={() => handleShareTo('email')}
                className="group flex w-full cursor-pointer flex-col items-center gap-2 rounded-2xl px-1 py-2.5 transition-colors hover:bg-surface-2"
              >
                <span className="btn btn-secondary grid size-12 place-items-center rounded-full group-hover:border-line-strong transition-all">
                  <span className="btn-content">
                    <TablerMail className="size-5 text-ink" />
                  </span>
                </span>
                <span className="text-xs text-ink-2 group-hover:text-ink">Email</span>
              </button>
            </li>
          </ul>

          {/* Copy Link Container */}
          <div className="mt-5 flex items-center gap-2 rounded-2xl bg-surface-2 p-1.5 pl-3.5 ring-1 ring-line">
            <TablerLink className="size-4.5 shrink-0 text-ink-3" />
            <span className="min-w-0 flex-1 truncate text-sm text-ink-2 select-all font-mono">
              {displayUrl}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl font-semibold tracking-[-0.01em] whitespace-nowrap select-none btn btn-primary h-8 px-3.5 text-xs"
            >
              <span className="btn-content inline-flex items-center gap-1.5">
                {copied ? (
                  <>
                    <Check className="size-3.5 text-white" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <span>Copy link</span>
                )}
              </span>
            </button>
          </div>

          {/* More Options */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleNativeShare}
              className="text-meta text-ink-3 underline underline-offset-2 transition-colors hover:text-ink cursor-pointer"
            >
              More options
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

