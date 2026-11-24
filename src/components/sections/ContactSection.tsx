'use client';

import React, { useState } from 'react';
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ArrowUpRight,
} from 'lucide-react';
import {
  GitHubIcon,
  XIcon,
  LinkedInIcon,
  TelegramIcon,
} from '@/components/ui/Icons';
import { PremiumFlipButton } from '@/components/ui/PremiumFlipButton';

export const ContactSection: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/mail/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          subject: subject || 'New Project Collaboration',
          message,
        }),
      });
      const data = await res.json();
      setIsSubmitting(false);

      if (data.success) {
        setFeedback({
          type: 'success',
          message: 'Thank you! Your message has been sent to hello@zahidp.com.',
        });
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
        setTimeout(() => {
          setIsModalOpen(false);
          setFeedback(null);
        }, 2200);
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'Failed to deliver message. Please email directly.',
        });
      }
    } catch {
      setIsSubmitting(false);
      setFeedback({
        type: 'error',
        message: 'Network error. Please try emailing directly at hello@zahidp.com.',
      });
    }
  };

  const socialLinks = [
    {
      platform: 'Telegram',
      handle: '@0xZahidP',
      url: 'https://t.me/0xZahidP',
      icon: TelegramIcon,
    },
    {
      platform: 'GitHub',
      handle: '@0xZahidp',
      url: 'https://github.com/0xZahidp',
      icon: GitHubIcon,
    },
    {
      platform: 'X',
      handle: '@0xZahidP',
      url: 'https://x.com/0xZahidP',
      icon: XIcon,
    },
    {
      platform: 'LinkedIn',
      handle: 'in/0xZahidp',
      url: 'https://linkedin.com/in/0xZahidp',
      icon: LinkedInIcon,
    },
  ];

  return (
    <section id="connect" aria-labelledby="connect-heading" className="scroll-mt-20 space-y-6">
      <div className="flex items-center gap-2.5">
        <Mail className="size-5 text-accent" />
        <h2
          id="connect-heading"
          className="text-xl font-bold tracking-tight text-text"
        >
          Connect
        </h2>
      </div>

      {/* Main Full-Width Connect Card */}
      <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8 space-y-6 shadow-2xs">
        <div className="max-w-xl space-y-2">
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-text">
            Let&apos;s build something practical and impactful together.
          </h3>
          <p className="text-xs sm:text-sm text-muted leading-relaxed">
            Whether you need a full-stack engineer, an offline-first web architecture, or automated workflows for operations—I&apos;m always glad to talk through ideas.
          </p>
        </div>

        {/* Primary Contact Actions */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <PremiumFlipButton
            textOne="Send a message"
            textTwo="Let's build →"
            onClick={() => setIsModalOpen(true)}
            size="md"
          />

          <a
            href="mailto:hello@zahidp.com"
            className="btn btn-secondary h-10 px-4 rounded-xl text-xs sm:text-sm font-semibold text-text gap-2 hover:border-accent/40 cursor-pointer"
          >
            <Mail className="size-4 text-accent" />
            <span>hello@zahidp.com</span>
          </a>
        </div>

        {/* Social Links Row */}
        <div className="pt-6 border-t border-line/60">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
            Find me on
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {socialLinks.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.platform}
                  href={item.url}
                  target="_blank"
                  rel="me noopener noreferrer"
                  className="group flex items-center justify-between p-3 rounded-xl border border-line bg-surface-2/60 hover:border-accent/60 hover:bg-surface-2 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="size-4 text-muted group-hover:text-accent transition-colors shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-text truncate">
                        {item.platform}
                      </div>
                      <div className="text-[11px] font-mono text-muted truncate">
                        {item.handle}
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight className="size-3 text-muted/60 group-hover:text-accent transition-colors shrink-0" />
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* Direct Contact Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-lg rounded-2xl border border-line bg-surface p-6 sm:p-7 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between pb-4 border-b border-line">
              <div>
                <h3 className="text-base font-bold text-text">Direct Message</h3>
                <p className="text-xs text-muted mt-0.5">Delivered directly to hello@zahidp.com</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn btn-secondary size-8 grid place-items-center rounded-lg text-muted hover:text-text cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Chen"
                  className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-xs sm:text-sm text-text placeholder:text-muted/60 focus:border-accent focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. alex@example.com"
                  className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-xs sm:text-sm text-text placeholder:text-muted/60 focus:border-accent focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text mb-1">Subject (optional)</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Technical partnership or project inquiry"
                  className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-xs sm:text-sm text-text placeholder:text-muted/60 focus:border-accent focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text mb-1">Message</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell me about what you're building, timelines, or your questions..."
                  className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-xs sm:text-sm text-text placeholder:text-muted/60 focus:border-accent focus:outline-none transition-colors resize-none"
                />
              </div>

              {feedback && (
                <div
                  className={`p-3 rounded-xl flex items-center gap-2 text-xs font-medium ${
                    feedback.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="size-4 shrink-0" />
                  ) : (
                    <AlertCircle className="size-4 shrink-0" />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary h-9 px-4 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary h-9 px-4.5 rounded-xl text-xs font-semibold gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Send className="size-3.5" />
                  )}
                  <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
