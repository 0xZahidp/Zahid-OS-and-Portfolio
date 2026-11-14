'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Sparkles,
  Edit2,
  Loader2,
  Globe,
  User,
  Mail,
  Zap,
  AlertCircle,
  Link as LinkIcon,
} from 'lucide-react';
import {
  StartupLead,
  StartupLeadMetrics,
  StartupLeadTrack,
  StartupLeadSignalType,
} from '@/types/leads';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadCreated: (lead: StartupLead, metrics?: StartupLeadMetrics) => void;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({
  isOpen,
  onClose,
  onLeadCreated,
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tab A: AI Quick Paste State
  const [pasteText, setPasteText] = useState<string>('');
  const [aiSourceUrl, setAiSourceUrl] = useState<string>('');

  // Tab B: Manual Form State
  const [companyName, setCompanyName] = useState<string>('');
  const [roleOrHeadline, setRoleOrHeadline] = useState<string>('');
  const [sourceUrl, setSourceUrl] = useState<string>('');
  const [track, setTrack] = useState<StartupLeadTrack>('Full-Stack');
  const [signalType, setSignalType] = useState<StartupLeadSignalType>('early_hiring_post');
  const [websiteDomain, setWebsiteDomain] = useState<string>('');
  const [contactName, setContactName] = useState<string>('');
  const [contactTitle, setContactTitle] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [tryHunter, setTryHunter] = useState<boolean>(true);
  const [startupSummary, setStartupSummary] = useState<string>('');
  const [pitchHook, setPitchHook] = useState<string>('');

  const pasteTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea on open
  useEffect(() => {
    if (isOpen && activeTab === 'ai') {
      setTimeout(() => pasteTextareaRef.current?.focus(), 80);
    }
  }, [isOpen, activeTab]);

  // Keyboard Escape shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Handle Tab A Submission: AI Extract & Add
  const handleAiExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteText.trim()) {
      setErrorMessage('Please paste the raw post text or snippet.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/admin/leads/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: pasteText.trim(),
          source_url: aiSourceUrl.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onLeadCreated(data.lead, data.metrics);
        onClose();
      } else {
        setErrorMessage(data.error || 'Failed to extract lead with AI.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error during AI extraction';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-generate pitch hook based on track & company
  const handleGenerateDefaultHook = () => {
    const cName = companyName.trim() || 'your team';
    if (track === 'Web3 Growth') {
      setPitchHook(
        `Saw what ${cName} is building in Web3 and want to help scale your user acquisition loops like I did at NexGami (500K+ registered users, $5M raised).`
      );
    } else if (track === 'Salesforce') {
      setPitchHook(
        `Noticed your team at ${cName} is expanding Salesforce and CRM automation; I bring certified Apex/LWC and custom integration engineering.`
      );
    } else {
      setPitchHook(
        `Saw your engineering needs at ${cName}; I build fast, production-grade full-stack systems with TypeScript/Next.js/Node.`
      );
    }
  };

  // Handle Tab B Submission: Manual Form Save
  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setErrorMessage('Company Name is required.');
      return;
    }
    if (!roleOrHeadline.trim()) {
      setErrorMessage('Role or Headline is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName.trim(),
          role_or_headline: roleOrHeadline.trim(),
          source_url: sourceUrl.trim() || undefined,
          track,
          signal_type: signalType,
          website_domain: websiteDomain.trim() || undefined,
          contact_name: contactName.trim() || undefined,
          contact_title: contactTitle.trim() || undefined,
          contact_email: contactEmail.trim() || undefined,
          try_hunter: tryHunter,
          startup_summary: startupSummary.trim() || undefined,
          pitch_hook: pitchHook.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onLeadCreated(data.lead, data.metrics);
        onClose();
      } else {
        setErrorMessage(data.error || 'Failed to save lead.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error saving lead';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl border border-line bg-surface shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Plus className="size-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-ink">Add Startup Lead</h3>
              <p className="text-[11px] text-ink-3">
                Auto-triage founder posts with AI or fill manually
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-7 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-2 grid place-items-center cursor-pointer transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 [scrollbar-width:thin]">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span className="flex-1 leading-snug">{errorMessage}</span>
            </div>
          )}

          {/* Mode Switcher Tabs */}
          <div className="inline-flex rounded-xl border border-line bg-surface-2 p-0.5 w-full">
            <button
              type="button"
              onClick={() => {
                setActiveTab('ai');
                setErrorMessage(null);
              }}
              className={`flex-1 h-8 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'ai'
                  ? 'bg-surface text-ink shadow-2xs font-bold'
                  : 'text-ink-3 hover:text-ink'
              }`}
            >
              <Sparkles className="size-3.5 text-brand-500" />
              <span>Quick Paste (AI Auto-Fill)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('manual');
                setErrorMessage(null);
              }}
              className={`flex-1 h-8 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'manual'
                  ? 'bg-surface text-ink shadow-2xs font-bold'
                  : 'text-ink-3 hover:text-ink'
              }`}
            >
              <Edit2 className="size-3.5" />
              <span>Manual Entry Form</span>
            </button>
          </div>

          {/* ================= TAB A: AI QUICK PASTE ================= */}
          {activeTab === 'ai' ? (
            <form onSubmit={handleAiExtract} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-semibold text-ink-2 mb-1 block">
                  Paste Post Text or Snippet *
                </label>
                <textarea
                  ref={pasteTextareaRef}
                  required
                  rows={5}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Paste a LinkedIn post, X/Twitter update, or funding announcement snippet here...&#10;&#10;e.g. &quot;We just raised $3M seed led by Founders Fund to build decentralized compute! Hiring our founding full-stack engineer: DM or email alex@acmelabs.xyz&quot;"
                  className="w-full p-3 rounded-xl border border-line bg-surface-2 text-xs text-ink placeholder:text-ink-4 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 leading-relaxed font-sans"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-ink-2 mb-1 block">
                  Source URL <span className="text-ink-4 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-ink-3 pointer-events-none" />
                  <input
                    type="url"
                    value={aiSourceUrl}
                    onChange={(e) => setAiSourceUrl(e.target.value)}
                    placeholder="https://x.com/... or https://linkedin.com/posts/..."
                    className="w-full h-9 pl-8 pr-3 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-2/40 border border-line/60 text-[11px] text-ink-3 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-ink-2">
                  <Zap className="size-3 text-brand-500" />
                  <span>How AI Extraction Works:</span>
                </div>
                <p>
                  Gemini Flash extracts company name, role/headline, track, contacts, and emails from your pasted snippet, writes a tailored 1-sentence outreach hook for your profile, and verifies deduplication before saving.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary h-9 px-4 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !pasteText.trim()}
                  className="h-9 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Extracting with Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-3.5" />
                      <span>Extract & Add Lead</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* ================= TAB B: MANUAL ENTRY FORM ================= */
            <form onSubmit={handleManualSave} className="space-y-3.5">
              {/* Row 1: Company & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-ink-2 mb-1 block">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Monad Labs"
                    className="w-full h-9 px-3 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-ink-2 mb-1 block">
                    Role or Headline *
                  </label>
                  <input
                    type="text"
                    required
                    value={roleOrHeadline}
                    onChange={(e) => setRoleOrHeadline(e.target.value)}
                    placeholder="e.g. Founding Full-Stack Engineer"
                    className="w-full h-9 px-3 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Row 2: Track & Signal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-ink-2 mb-1 block">
                    Track
                  </label>
                  <select
                    value={track}
                    onChange={(e) => setTrack(e.target.value as StartupLeadTrack)}
                    className="w-full h-9 px-3 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden cursor-pointer"
                  >
                    <option value="Full-Stack">Full-Stack</option>
                    <option value="Web3 Growth">Web3 Growth</option>
                    <option value="Salesforce">Salesforce</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-ink-2 mb-1 block">
                    Signal Type
                  </label>
                  <select
                    value={signalType}
                    onChange={(e) => setSignalType(e.target.value as StartupLeadSignalType)}
                    className="w-full h-9 px-3 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden cursor-pointer"
                  >
                    <option value="early_hiring_post">Early Hiring Post</option>
                    <option value="seed_funding">Seed Funding</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Website Domain & Source URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-ink-2 mb-1 block">
                    Website Domain
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-ink-3 pointer-events-none" />
                    <input
                      type="text"
                      value={websiteDomain}
                      onChange={(e) => setWebsiteDomain(e.target.value)}
                      placeholder="e.g. monad.xyz"
                      className="w-full h-9 pl-8 pr-3 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-ink-2 mb-1 block">
                    Source URL <span className="text-ink-4 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-ink-3 pointer-events-none" />
                    <input
                      type="text"
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      placeholder="Auto-generated if left blank"
                      className="w-full h-9 pl-8 pr-3 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-ink-2 mb-1 block">
                    Contact Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-ink-3 pointer-events-none" />
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g. Keone Hon"
                      className="w-full h-9 pl-8 pr-3 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-ink-2 mb-1 block">
                    Contact Title
                  </label>
                  <input
                    type="text"
                    value={contactTitle}
                    onChange={(e) => setContactTitle(e.target.value)}
                    placeholder="e.g. Co-founder & CEO"
                    className="w-full h-9 px-3 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-ink-2 mb-1 block">
                    Contact Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-ink-3 pointer-events-none" />
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="keone@monad.xyz"
                      className="w-full h-9 pl-8 pr-3 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Hunter.io Checkbox if email is blank */}
              {!contactEmail && websiteDomain && contactName && (
                <label className="flex items-center gap-2 text-xs text-ink-2 cursor-pointer bg-surface-2/40 p-2.5 rounded-xl border border-line/60">
                  <input
                    type="checkbox"
                    checked={tryHunter}
                    onChange={(e) => setTryHunter(e.target.checked)}
                    className="rounded border-line text-emerald-500 focus:ring-emerald-500/20"
                  />
                  <span>Try Hunter.io email lookup on save (respects free quota guard)</span>
                </label>
              )}

              {/* Row 5: Startup Summary */}
              <div>
                <label className="text-[11px] font-semibold text-ink-2 mb-1 block">
                  Startup Summary
                </label>
                <textarea
                  rows={2}
                  value={startupSummary}
                  onChange={(e) => setStartupSummary(e.target.value)}
                  placeholder="1-2 lines on product and funding (e.g. High-performance EVM L1 blockchain raised $225M led by Paradigm)."
                  className="w-full p-2.5 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 font-sans"
                />
              </div>

              {/* Row 6: Pitch Hook */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="text-[11px] font-semibold text-ink-2">
                    Pitch Hook <span className="text-ink-4 font-normal">(1-line tailored angle)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateDefaultHook}
                    className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Draft Default Hook
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={pitchHook}
                  onChange={(e) => setPitchHook(e.target.value)}
                  placeholder="1-sentence angle connecting their startup to your triple-threat background..."
                  className="w-full p-2.5 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 font-sans italic"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary h-9 px-4 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !companyName.trim() || !roleOrHeadline.trim()}
                  className="h-9 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Saving Lead...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="size-3.5" />
                      <span>Save Lead</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
