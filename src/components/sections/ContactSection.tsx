'use client';

import React, { useState } from 'react';
import { Mail, Send, Check, Copy } from 'lucide-react';
import { TactileButton } from '@/components/ui/TactileButton';

export const ContactSection: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const email = 'mdzahidhasanpatwary@gmail.com';

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessageSent(true);
    setTimeout(() => setMessageSent(false), 4000);
  };

  return (
    <section id="contact" aria-labelledby="contact-heading" className="mt-14 scroll-mt-20">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2
          id="contact-heading"
          className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-ink"
        >
          <Mail className="size-6 shrink-0 text-ink" />
          <span>Get in touch</span>
        </h2>
      </div>

      <div className="card-raised p-6">
        <p className="text-body leading-relaxed text-ink-2 max-w-xl">
          Whether you’re building a remote venture, need architectural advisory on high-concurrency systems, or just want to chat about agentic AI—my inbox is open.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-surface-2 px-4 py-2 border border-line">
            <Mail className="size-4 text-link" />
            <span className="text-sm font-medium text-ink select-all">{email}</span>
            <button
              type="button"
              onClick={handleCopyEmail}
              className="ml-2 text-ink-3 hover:text-ink transition-colors cursor-pointer"
              title="Copy email"
            >
              {copied ? (
                <Check className="size-4 text-brand-500" />
              ) : (
                <Copy className="size-4" />
              )}
            </button>
          </div>

          <TactileButton
            href={`mailto:${email}`}
            size="md"
          >
            <Send className="size-4" />
            <span>Send Email</span>
          </TactileButton>
        </div>

        {/* Quick Message Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-3 pt-6 border-t border-line/70">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Your Name"
              required
              className="w-full rounded-xl border border-line bg-surface-2/60 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-link"
            />
            <input
              type="email"
              placeholder="Your Email"
              required
              className="w-full rounded-xl border border-line bg-surface-2/60 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-link"
            />
          </div>
          <textarea
            rows={3}
            placeholder="How can we collaborate?"
            required
            className="w-full rounded-xl border border-line bg-surface-2/60 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-link resize-none"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-ink-3">Typically replies within 24 hours.</p>
            <button
              type="submit"
              className="btn btn-secondary h-9 px-4 rounded-xl text-xs font-semibold"
            >
              {messageSent ? 'Message Received!' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

