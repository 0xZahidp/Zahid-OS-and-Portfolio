'use client';

import React, { useState, useEffect } from 'react';
import {
  Rocket,
  Lightbulb,
  Video,
  MessagesSquare,
  Mail,
  ArrowUpRight,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import {
  servicesData,
  directContactData,
  contactSocialsData,
} from '@/data/profile';
import {
  XIcon,
  GitHubIcon,
  LinkedInIcon,
  FacebookIcon,
  DevToIcon,
  BehanceIcon,
  PeerlistIcon,
  LogosWhatsAppIcon,
  MessengerIcon,
} from '@/components/ui/Icons';

export const ContactSection: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<string>('7:17 PM');

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const formatted = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Dhaka',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }).format(now);
        setCurrentTime(formatted);
      } catch {
        setCurrentTime('7:17 PM');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const renderServiceIcon = (icon: string) => {
    switch (icon) {
      case 'consultation':
        return <Lightbulb className="size-5 text-emerald-600 dark:text-emerald-400" />;
      case 'call':
        return <Video className="size-5 text-emerald-600 dark:text-emerald-400" />;
      case 'english':
      default:
        return <MessagesSquare className="size-5 text-emerald-600 dark:text-emerald-400" />;
    }
  };

  const renderDirectIcon = (icon: string) => {
    switch (icon) {
      case 'x':
        return <XIcon className="size-4.5" />;
      case 'messenger':
        return <MessengerIcon className="size-4.5 text-blue-500" />;
      case 'whatsapp':
        return <LogosWhatsAppIcon className="size-4.5" />;
      case 'email':
      default:
        return <Mail className="size-4.5" />;
    }
  };

  const renderSocialIcon = (platform: string) => {
    switch (platform) {
      case 'github':
        return <GitHubIcon className="size-4.5" />;
      case 'x':
        return <XIcon className="size-4.5" />;
      case 'linkedin':
        return <LinkedInIcon className="size-4.5" />;
      case 'peerlist':
        return <PeerlistIcon className="size-4.5 text-emerald-600 dark:text-emerald-400" />;
      case 'facebook':
        return <FacebookIcon className="size-4.5 text-blue-600" />;
      case 'devto':
        return <DevToIcon className="size-4.5" />;
      case 'behance':
        return <BehanceIcon className="size-4.5 text-blue-500" />;
      default:
        return <ArrowUpRight className="size-4.5" />;
    }
  };

  return (
    <div className="space-y-12">
      {/* 1. Hero Banner Card (Image 4) */}
      <div className="rounded-[28px] p-6 sm:p-7 bg-gradient-to-br from-emerald-100/70 via-teal-50/40 to-emerald-50/30 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-900/10 border border-emerald-500/20 shadow-xs relative overflow-hidden">
        <h2 className="text-xl font-bold tracking-tight text-ink">
          Let&apos;s build something
        </h2>
        <p className="mt-1.5 text-sm text-ink-2 leading-relaxed max-w-xl">
          Have a project, a role or just a question? Pick whatever&apos;s easiest and I&apos;ll get back to you.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-4 text-xs font-semibold">
          {/* Status pill */}
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/25">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Open to new conversations</span>
          </span>

          {/* Time & Location */}
          <span className="inline-flex items-center gap-1.5 text-ink-2 font-medium">
            <MapPin className="size-3.5 text-ink-3" />
            <span>Dhaka, GMT+6 · {currentTime}</span>
          </span>
        </div>
      </div>

      {/* 2. Work with me Section (Image 4) */}
      <section aria-labelledby="work-with-me-heading" className="space-y-4">
        <h3
          id="work-with-me-heading"
          className="text-base font-bold tracking-tight text-ink"
        >
          Work with me
        </h3>

        {/* Featured Service Card */}
        <div className="rounded-[24px] p-6 sm:p-7 bg-gradient-to-br from-emerald-50/80 to-teal-50/40 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-500/20 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-white dark:bg-zinc-800 shadow-xs border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Rocket className="size-4.5" />
            </span>
            <h4 className="text-base font-bold text-ink">
              Build something together
            </h4>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-ink-2 max-w-2xl">
            Founders and teams building ambitious products: I take features from idea to production with agentic engineering, from database design to polished UI, real-time systems and AI included.
          </p>

          <div className="mt-5">
            <div className="tactile-button-wrap">
              <a
                href="mailto:mdzahidhasanpatwary@gmail.com?subject=Build%20Something%20Together"
                className="tactile-button"
              >
                <span>Let&apos;s talk</span>
                <ArrowRight className="size-4" />
              </a>
            </div>
          </div>
        </div>

        {/* 3-Column Sub-Services Grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          {servicesData.map((srv) => (
            <div
              key={srv.id}
              className="rounded-[22px] border border-line bg-surface p-5 flex flex-col justify-between hover:border-line-strong transition-all shadow-xs"
            >
              <div>
                <span className="grid size-9 place-items-center rounded-xl bg-surface-2 border border-line">
                  {renderServiceIcon(srv.icon)}
                </span>

                <h4 className="mt-3 text-sm font-bold text-ink">
                  {srv.title}
                </h4>

                <p className="mt-1.5 text-xs text-ink-2 leading-relaxed">
                  {srv.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-line/60">
                <a
                  href={srv.actionUrl}
                  className="btn btn-secondary w-full h-8 px-3 rounded-[12px] text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                >
                  <span>{srv.actionText}</span>
                  <ArrowRight className="size-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Reach me Section (Image 5) */}
      <section aria-labelledby="reach-me-heading" className="space-y-4">
        <h3
          id="reach-me-heading"
          className="text-base font-bold tracking-tight text-ink"
        >
          Reach me
        </h3>

        <div className="grid gap-3.5 sm:grid-cols-2">
          {directContactData.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-[20px] border border-line bg-surface p-4 flex items-center justify-between hover:border-line-strong hover:bg-surface-2/40 transition-all shadow-xs cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <span className="grid size-11 place-items-center rounded-full bg-surface-2 border border-line text-ink group-hover:scale-105 transition-transform shrink-0">
                  {renderDirectIcon(item.icon)}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-ink group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-ink-3 mt-0.5">{item.handle}</p>
                </div>
              </div>

              <ArrowUpRight className="size-4 text-ink-3 group-hover:text-ink transition-colors mr-1" />
            </a>
          ))}
        </div>
      </section>

      {/* 4. Find me on Section (Image 5) */}
      <section aria-labelledby="contact-find-me-heading" className="space-y-4">
        <h3
          id="contact-find-me-heading"
          className="text-base font-bold tracking-tight text-ink"
        >
          Find me on
        </h3>

        <div className="grid gap-3.5 sm:grid-cols-3">
          {contactSocialsData.map((social) => (
            <a
              key={social.id}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-[20px] border border-line bg-surface p-4 flex items-center justify-between hover:border-line-strong hover:bg-surface-2/40 transition-all shadow-xs cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-surface-2 border border-line text-ink group-hover:scale-105 transition-transform shrink-0">
                  {renderSocialIcon(social.platform)}
                </span>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-ink truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {social.label}
                  </h4>
                  <p className="text-xs text-ink-3 mt-0.5 truncate">{social.handle}</p>
                </div>
              </div>

              <ArrowUpRight className="size-4 text-ink-3 group-hover:text-ink transition-colors shrink-0 ml-1" />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
};
