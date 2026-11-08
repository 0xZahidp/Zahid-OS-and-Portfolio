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
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';
import {
  servicesData,
  directContactData,
} from '@/data/profile';
import { usePortfolio } from '@/context/PortfolioContext';
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
  const { content } = usePortfolio();
  const socials = Array.isArray(content.socialLinks) ? content.socialLinks : [];
  const [currentTime, setCurrentTime] = useState<string>('7:17 PM');

  // Direct message modal state
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [visitorSubject, setVisitorSubject] = useState('');
  const [visitorMessage, setVisitorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleScrollToMailbox = () => {
    const el = document.getElementById('mailbox');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        const input = el.querySelector('input');
        input?.focus();
      }, 400);
    } else {
      setIsMessageModalOpen(true);
    }
  };

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName || !visitorEmail || !visitorMessage) return;
    setIsSubmitting(true);
    setSubmitFeedback(null);
    try {
      const res = await fetch('/api/mail/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: visitorName,
          email: visitorEmail,
          subject: visitorSubject || 'New Project Collaboration',
          message: visitorMessage,
        }),
      });
      const data = await res.json();
      setIsSubmitting(false);
      if (data.success) {
        setSubmitFeedback({
          type: 'success',
          message: 'Thank you! Your message has been delivered to hello@zahidp.com.',
        });
        setVisitorName('');
        setVisitorEmail('');
        setVisitorSubject('');
        setVisitorMessage('');
        setTimeout(() => {
          setIsMessageModalOpen(false);
          setSubmitFeedback(null);
        }, 2200);
      } else {
        setSubmitFeedback({
          type: 'error',
          message: data.error || 'Failed to deliver message. Please try again.',
        });
      }
    } catch {
      setIsSubmitting(false);
      setSubmitFeedback({
        type: 'error',
        message: 'Network error. Please try sending via email client.',
      });
    }
  };

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

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="tactile-button-wrap">
              <button
                type="button"
                onClick={handleScrollToMailbox}
                className="tactile-button cursor-pointer"
              >
                <span>Send direct message</span>
                <Send className="size-4" />
              </button>
            </div>
            <a
              href="mailto:hello@zahidp.com?subject=Build%20Something%20Together"
              className="btn btn-secondary h-10 px-4 rounded-[14px] text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <span>Email Client</span>
              <ArrowUpRight className="size-3.5" />
            </a>
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

      {/* 3. Direct Mailbox (To hello@zahidp.com) */}
      <section id="mailbox" aria-labelledby="mailbox-heading" className="space-y-4 scroll-mt-20">
        <div className="flex items-center justify-between">
          <h3
            id="mailbox-heading"
            className="text-base font-bold tracking-tight text-ink"
          >
            Direct Mailbox
          </h3>
          <div className="inline-flex items-center gap-1.5 text-xs text-ink-3">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>To: <strong className="text-ink font-semibold">hello@zahidp.com</strong></span>
          </div>
        </div>

        <div className="rounded-[24px] border border-line bg-surface p-6 sm:p-7 shadow-xs relative overflow-hidden">
          {submitFeedback?.type === 'success' ? (
            <div className="py-8 flex flex-col items-center text-center space-y-3">
              <div className="size-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 grid place-items-center">
                <CheckCircle2 className="size-6" />
              </div>
              <h4 className="text-base font-bold text-ink">Email Delivered</h4>
              <p className="text-xs text-ink-2 max-w-sm">
                Your message was sent directly to <strong className="text-emerald-600 dark:text-emerald-400">hello@zahidp.com</strong>. Zahid has received your inquiry and will reply shortly.
              </p>
              <button
                type="button"
                onClick={() => setSubmitFeedback(null)}
                className="btn btn-secondary h-8 px-4 rounded-xl text-xs font-semibold mt-2 cursor-pointer"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitContact} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-line">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Mail className="size-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-ink">Write to Zahid</h4>
                    <p className="text-[11px] text-ink-3">Recipient: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">hello@zahidp.com</span></p>
                  </div>
                </div>

                <a
                  href="mailto:hello@zahidp.com"
                  className="inline-flex items-center gap-1.5 text-xs text-ink-3 hover:text-ink transition-colors"
                >
                  <span>Open in app</span>
                  <ArrowUpRight className="size-3.5" />
                </a>
              </div>

              {submitFeedback?.type === 'error' && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2 font-semibold">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{submitFeedback.message}</span>
                </div>
              )}

              {/* Name & Email 2-column */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-ink-2 mb-1.5">Your Name</label>
                  <input
                    type="text"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="Alex Morgan"
                    required
                    className="w-full h-10 px-3.5 rounded-xl bg-surface-2 border border-line text-xs font-medium text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-2 mb-1.5">Your Email</label>
                  <input
                    type="email"
                    value={visitorEmail}
                    onChange={(e) => setVisitorEmail(e.target.value)}
                    placeholder="alex@company.com"
                    required
                    className="w-full h-10 px-3.5 rounded-xl bg-surface-2 border border-line text-xs font-medium text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                  />
                </div>
              </div>

              {/* Subject with Quick Suggestion Chips */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-ink-2">Subject / Topic</label>
                  <span className="text-[11px] text-ink-4">Select or type</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {['Project Collaboration', 'Paid Consultation', '1:1 Mentoring', 'Quick Question'].map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => setVisitorSubject(topic)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        visitorSubject === topic
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-semibold'
                          : 'bg-surface-2 border-line text-ink-3 hover:text-ink hover:border-line-strong'
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={visitorSubject}
                  onChange={(e) => setVisitorSubject(e.target.value)}
                  placeholder="e.g. Project Collaboration or Web App Inquiry"
                  className="w-full h-10 px-3.5 rounded-xl bg-surface-2 border border-line text-xs font-medium text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-ink-2 mb-1.5">Message</label>
                <textarea
                  value={visitorMessage}
                  onChange={(e) => setVisitorMessage(e.target.value)}
                  placeholder="Tell me a bit about what you are looking to build or ask..."
                  rows={4}
                  required
                  className="w-full p-3.5 rounded-xl bg-surface-2 border border-line text-xs font-medium text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none font-sans transition-all"
                />
              </div>

              {/* Submit footer */}
              <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-line/60">
                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:hello@zahidp.com?subject=${encodeURIComponent(visitorSubject || 'Portfolio Message')}&body=${encodeURIComponent(visitorMessage || '')}`}
                    className="btn btn-secondary h-10 px-3.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Use mailto</span>
                    <ArrowUpRight className="size-3.5" />
                  </a>

                  <button
                    type="submit"
                    disabled={isSubmitting || !visitorName || !visitorEmail || !visitorMessage}
                    className="btn btn-primary h-10 px-5 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                  >
                    {isSubmitting ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Send className="size-3.5" />
                    )}
                    <span>{isSubmitting ? 'Sending to hello@zahidp.com...' : 'Send to hello@zahidp.com'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
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

        {socials.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-line bg-surface-2/40 p-6 text-center">
            <p className="text-xs text-ink-3">Social links coming soon.</p>
          </div>
        ) : (
          <div className="grid gap-3.5 sm:grid-cols-3">
            {socials.map((social) => (
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
        )}
      </section>

      {/* Direct Message Modal */}
      {isMessageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-raised rounded-3xl border border-line bg-surface max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-line">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Send className="size-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-ink">Send Direct Message</h3>
                  <p className="text-[11px] text-ink-3">Lands directly in Zahid&apos;s verified inbox.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMessageModalOpen(false)}
                className="p-1.5 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {submitFeedback && (
              <div
                className={`mt-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  submitFeedback.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400 font-semibold'
                }`}
              >
                {submitFeedback.type === 'success' ? (
                  <CheckCircle2 className="size-4 shrink-0" />
                ) : (
                  <AlertCircle className="size-4 shrink-0" />
                )}
                <span>{submitFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSubmitContact} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-ink-2 mb-1">Your Name</label>
                <input
                  type="text"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="Alex Morgan"
                  required
                  className="w-full h-9 px-3 rounded-xl bg-surface-2 border border-line text-xs font-medium text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-2 mb-1">Your Email</label>
                <input
                  type="email"
                  value={visitorEmail}
                  onChange={(e) => setVisitorEmail(e.target.value)}
                  placeholder="alex@company.com"
                  required
                  className="w-full h-9 px-3 rounded-xl bg-surface-2 border border-line text-xs font-medium text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-2 mb-1">Topic / Subject (Optional)</label>
                <input
                  type="text"
                  value={visitorSubject}
                  onChange={(e) => setVisitorSubject(e.target.value)}
                  placeholder="Project inquiry, consultation, advisory..."
                  className="w-full h-9 px-3 rounded-xl bg-surface-2 border border-line text-xs font-medium text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-2 mb-1">Message</label>
                <textarea
                  value={visitorMessage}
                  onChange={(e) => setVisitorMessage(e.target.value)}
                  placeholder="Tell me a bit about what you are looking to build..."
                  rows={4}
                  required
                  className="w-full p-3 rounded-xl bg-surface-2 border border-line text-xs font-medium text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none font-sans"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsMessageModalOpen(false)}
                  className="btn btn-secondary h-9 px-4 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !visitorName || !visitorEmail || !visitorMessage}
                  className="btn btn-primary h-9 px-5 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
    </div>
  );
};
