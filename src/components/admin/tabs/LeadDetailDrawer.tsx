'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Globe,
  Save,
  Check,
  Loader2,
  Mail,
  Copy,
  Sparkles,
  Zap,
  Archive,
  ArchiveRestore,
  Trash2,
  ArrowRight,
  Send,
  Calendar,
  Briefcase,
  User,
  AlertCircle,
} from 'lucide-react';
import {
  StartupLead,
  StartupLeadMetrics,
  StartupLeadTrack,
  StartupLeadSignalType,
  StartupLeadStatus,
  StartupLeadEmailConfidence,
} from '@/types/leads';
import { generateOutreachEmailDraft } from '@/lib/leads/email-template';
import { confirmModal } from '@/components/ui/ConfirmDialog';

interface LeadDetailDrawerProps {
  lead: StartupLead | null;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated: (updatedLead: StartupLead, newMetrics?: StartupLeadMetrics) => void;
  onLeadDeleted: (leadId: string, newMetrics?: StartupLeadMetrics) => void;
  onPromoteToCareer: (lead: StartupLead) => void;
}

function formatFullDate(dateString?: string | null): string {
  if (!dateString) return 'Unknown';
  try {
    const d = new Date(dateString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateString;
  }
}

export const LeadDetailDrawer: React.FC<LeadDetailDrawerProps> = ({
  lead,
  isOpen,
  onClose,
  onLeadUpdated,
  onLeadDeleted,
  onPromoteToCareer,
}) => {
  const [localLead, setLocalLead] = useState<StartupLead | null>(lead);
  const [draftBody, setDraftBody] = useState<string>('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedDraft, setCopiedDraft] = useState<boolean>(false);
  const [copiedEmail, setCopiedEmail] = useState<boolean>(false);
  const [isLookingUpHunter, setIsLookingUpHunter] = useState<boolean>(false);

  // Sync state whenever active lead changes
  useEffect(() => {
    if (lead) {
      setLocalLead(lead);
      setDraftBody(generateOutreachEmailDraft(lead));
      setSaveState('idle');
      setErrorMessage(null);
    }
  }, [lead]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !localLead) return null;

  // Track / Field changes
  const handleFieldChange = <K extends keyof StartupLead>(field: K, value: StartupLead[K]) => {
    setLocalLead((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, [field]: value };
      // Regenerate default draft if relevant fields changed
      if (field === 'pitch_hook' || field === 'contact_name' || field === 'company_name' || field === 'track') {
        setDraftBody(generateOutreachEmailDraft(updated));
      }
      return updated;
    });
    setSaveState('idle');
  };

  // Persist edits via PATCH /api/admin/leads/[id]
  const handleSaveChanges = async () => {
    if (!localLead) return;
    setSaveState('saving');
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/admin/leads/${localLead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: localLead.company_name.trim(),
          role_or_headline: localLead.role_or_headline.trim(),
          track: localLead.track,
          signal_type: localLead.signal_type,
          status: localLead.status,
          website_domain: localLead.website_domain?.trim() || null,
          source_url: localLead.source_url,
          startup_summary: localLead.startup_summary?.trim() || null,
          contact_name: localLead.contact_name?.trim() || null,
          contact_title: localLead.contact_title?.trim() || null,
          contact_email: localLead.contact_email?.trim() || null,
          email_confidence: localLead.email_confidence,
          pitch_hook: localLead.pitch_hook?.trim() || null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.lead) {
        setLocalLead(data.lead);
        setSaveState('saved');
        onLeadUpdated(data.lead, data.metrics);
        setTimeout(() => setSaveState('idle'), 2000);
      } else {
        setSaveState('error');
        setErrorMessage(data.error || 'Failed to save changes.');
      }
    } catch (err: unknown) {
      setSaveState('error');
      setErrorMessage(err instanceof Error ? err.message : 'Network error saving changes');
    }
  };

  // Toggle Archive status
  const handleToggleArchive = async () => {
    if (!localLead) return;
    const newStatus: StartupLeadStatus = localLead.status === 'archived' ? 'new' : 'archived';
    handleFieldChange('status', newStatus);

    try {
      const res = await fetch(`/api/admin/leads/${localLead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.lead) {
        setLocalLead(data.lead);
        onLeadUpdated(data.lead, data.metrics);
      }
    } catch {
      // Revert if error
      handleFieldChange('status', localLead.status);
    }
  };

  // Permanent Delete
  const handlePermanentDelete = async () => {
    if (!localLead) return;
    const ok = await confirmModal({
      title: 'Permanently Delete Startup Lead?',
      message: `Are you sure you want to permanently delete "${localLead.company_name}" from Leads Radar? This removes the record from Supabase completely. (If you only want to hide it while blocking duplicates, use Archive instead).`,
      confirmText: 'Delete Permanently',
      type: 'danger',
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/leads/${localLead.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onLeadDeleted(localLead.id, data.metrics);
        onClose();
      } else {
        setErrorMessage(data.error || 'Failed to delete lead.');
      }
    } catch {
      setErrorMessage('Network error during deletion.');
    }
  };

  // On-demand Hunter.io lookup
  const handleHunterLookup = async () => {
    if (!localLead) return;
    if (!localLead.website_domain || !localLead.contact_name) {
      setErrorMessage('Website Domain and Contact Name are required to lookup email on Hunter.io.');
      return;
    }

    setIsLookingUpHunter(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: localLead.id, action: 'lookup_hunter' }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.lead) {
        setLocalLead(data.lead);
        onLeadUpdated(data.lead, data.metrics);
      } else {
        setErrorMessage(data.error || 'No verified email found on Hunter.io.');
      }
    } catch {
      setErrorMessage('Network error during Hunter.io lookup.');
    } finally {
      setIsLookingUpHunter(false);
    }
  };

  // Copy 4-Line Email Draft
  const handleCopyDraft = async () => {
    try {
      await navigator.clipboard.writeText(draftBody);
      setCopiedDraft(true);
      setTimeout(() => setCopiedDraft(false), 2000);
    } catch {
      // ignore
    }
  };

  // Copy Email address
  const handleCopyEmail = async () => {
    if (!localLead.contact_email) return;
    try {
      await navigator.clipboard.writeText(localLead.contact_email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      // ignore
    }
  };

  // Construct Email Subject & Mailto URLs
  const emailSubject = `${localLead.role_or_headline || 'Engineering & Growth'} — Zahid x ${localLead.company_name}`;
  const gmailComposeUrl = localLead.contact_email
    ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
        localLead.contact_email
      )}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(draftBody)}`
    : `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(
        emailSubject
      )}&body=${encodeURIComponent(draftBody)}`;

  const mailtoUrl = localLead.contact_email
    ? `mailto:${encodeURIComponent(localLead.contact_email)}?subject=${encodeURIComponent(
        emailSubject
      )}&body=${encodeURIComponent(draftBody)}`
    : `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(draftBody)}`;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity"
        aria-hidden="true"
      />

      {/* Slide-Over Aside Panel */}
      <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-[540px] lg:w-[600px] bg-surface border-l border-line shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 select-text">
        {/* Header */}
        <div className="p-4 border-b border-line bg-surface-2/40 flex items-center justify-between shrink-0 gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                {localLead.company_name.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-sm font-bold text-ink truncate">{localLead.company_name}</h2>
              {localLead.website_domain && (
                <a
                  href={`https://${localLead.website_domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink-4 hover:text-ink transition-colors shrink-0"
                  title="Visit Website"
                >
                  <Globe className="size-3.5" />
                </a>
              )}
            </div>
            <p className="text-xs text-brand-600 dark:text-brand-400 truncate font-medium mt-0.5">
              {localLead.role_or_headline}
            </p>
          </div>

          {/* Top Actions: Status Select, Save, Close */}
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={localLead.status}
              onChange={(e) => handleFieldChange('status', e.target.value as StartupLeadStatus)}
              className="h-8 px-2.5 rounded-xl border border-line bg-surface text-xs font-semibold text-ink cursor-pointer focus:outline-none focus:border-brand-500 transition-colors"
            >
              <option value="new">● New</option>
              <option value="emailed">✉ Emailed</option>
              <option value="replied">✓ Replied</option>
              <option value="promoted">★ Promoted</option>
              <option value="archived">◫ Archived</option>
            </select>

            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={saveState === 'saving'}
              className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              title="Save changes to lead"
            >
              {saveState === 'saving' ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Saving…</span>
                </>
              ) : saveState === 'saved' ? (
                <>
                  <Check className="size-3.5 text-emerald-200" />
                  <span>Saved ✓</span>
                </>
              ) : (
                <>
                  <Save className="size-3.5" />
                  <span>Save</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="size-8 rounded-xl border border-line bg-surface hover:bg-surface-3 flex items-center justify-center text-ink-3 hover:text-ink transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Feedback / Error banner */}
        {errorMessage && (
          <div className="p-3 bg-rose-500/10 border-b border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="size-4 shrink-0" />
            <span className="flex-1">{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-500 hover:text-rose-700 font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Scrollable Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Metadata & Origin Strip */}
          <div className="p-3 rounded-xl bg-surface-2/40 border border-line/60 flex flex-wrap items-center justify-between gap-3 text-[11px] text-ink-3 font-mono">
            <div className="flex items-center gap-1.5">
              <Calendar className="size-3.5 text-ink-4" />
              <span>Published: {formatFullDate(localLead.post_published_at || localLead.created_at)}</span>
            </div>
            {localLead.source_url && (
              <a
                href={localLead.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
              >
                <span>View Original Post / Story</span>
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>

          {/* Section 1: Company & Role Details */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="size-3.5 text-brand-600 dark:text-brand-400" />
              <span>Company & Role Intel</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-ink-2">Company Name</label>
                <input
                  type="text"
                  value={localLead.company_name}
                  onChange={(e) => handleFieldChange('company_name', e.target.value)}
                  className="w-full h-8 px-2.5 text-xs rounded-lg bg-surface border border-line focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-ink-2">Role or Headline</label>
                <input
                  type="text"
                  value={localLead.role_or_headline}
                  onChange={(e) => handleFieldChange('role_or_headline', e.target.value)}
                  className="w-full h-8 px-2.5 text-xs rounded-lg bg-surface border border-line focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-ink-2">Track</label>
                <select
                  value={localLead.track}
                  onChange={(e) => handleFieldChange('track', e.target.value as StartupLeadTrack)}
                  className="w-full h-8 px-2 text-xs rounded-lg bg-surface border border-line focus:border-brand-500 focus:outline-none"
                >
                  <option value="Web3 Growth">Web3 Growth</option>
                  <option value="Full-Stack">Full-Stack</option>
                  <option value="Salesforce">Salesforce</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-ink-2">Signal Type</label>
                <select
                  value={localLead.signal_type}
                  onChange={(e) => handleFieldChange('signal_type', e.target.value as StartupLeadSignalType)}
                  className="w-full h-8 px-2 text-xs rounded-lg bg-surface border border-line focus:border-brand-500 focus:outline-none"
                >
                  <option value="early_hiring_post">Early Hiring Post</option>
                  <option value="seed_funding">Seed Funding</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-ink-2">Website Domain</label>
                <input
                  type="text"
                  value={localLead.website_domain || ''}
                  onChange={(e) => handleFieldChange('website_domain', e.target.value)}
                  placeholder="e.g. monad.xyz"
                  className="w-full h-8 px-2.5 text-xs rounded-lg bg-surface border border-line focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Untruncated Startup Summary */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-ink-2">Startup Summary & Context</label>
              <textarea
                rows={3}
                value={localLead.startup_summary || ''}
                onChange={(e) => handleFieldChange('startup_summary', e.target.value)}
                placeholder="What they are building, team background, recent funding..."
                className="w-full p-2.5 text-xs rounded-lg bg-surface border border-line focus:border-brand-500 focus:outline-none leading-relaxed"
              />
            </div>
          </div>

          {/* Section 2: Contact & Outreach Intel */}
          <div className="space-y-3.5 pt-4 border-t border-line">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                <User className="size-3.5 text-brand-600 dark:text-brand-400" />
                <span>Contact & Email Intelligence</span>
              </h3>

              {localLead.website_domain && localLead.contact_name && (
                <button
                  type="button"
                  disabled={isLookingUpHunter}
                  onClick={handleHunterLookup}
                  className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Lookup email on Hunter.io"
                >
                  {isLookingUpHunter ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Sparkles className="size-3" />
                  )}
                  <span>Lookup with Hunter.io</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-ink-2">Contact Name</label>
                <input
                  type="text"
                  value={localLead.contact_name || ''}
                  onChange={(e) => handleFieldChange('contact_name', e.target.value)}
                  placeholder="Founder / Hiring Lead name"
                  className="w-full h-8 px-2.5 text-xs rounded-lg bg-surface border border-line focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-ink-2">Contact Title</label>
                <input
                  type="text"
                  value={localLead.contact_title || ''}
                  onChange={(e) => handleFieldChange('contact_title', e.target.value)}
                  placeholder="e.g. Founder & CEO, Head of Eng"
                  className="w-full h-8 px-2.5 text-xs rounded-lg bg-surface border border-line focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-ink-2">Contact Email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={localLead.contact_email || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleFieldChange('contact_email', val);
                      if (val && localLead.email_confidence === 'missing') {
                        handleFieldChange('email_confidence', 'extracted');
                      }
                    }}
                    placeholder="e.g. founder@startup.com"
                    className="w-full h-8 pl-2.5 pr-8 text-xs font-mono rounded-lg bg-surface border border-line focus:border-brand-500 focus:outline-none"
                  />
                  {localLead.contact_email && (
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-4 hover:text-ink cursor-pointer"
                      title="Copy Email"
                    >
                      {copiedEmail ? (
                        <Check className="size-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-ink-2">Email Confidence</label>
                <select
                  value={localLead.email_confidence}
                  onChange={(e) =>
                    handleFieldChange('email_confidence', e.target.value as StartupLeadEmailConfidence)
                  }
                  className="w-full h-8 px-2 text-xs rounded-lg bg-surface border border-line focus:border-brand-500 focus:outline-none"
                >
                  <option value="verified">Verified (Hunter.io 80%+)</option>
                  <option value="extracted">Extracted (Found in post)</option>
                  <option value="guessed">Guessed (Pattern match)</option>
                  <option value="missing">Missing</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Pitch Hook & Interactive Cold Email Composer */}
          <div className="space-y-3.5 pt-4 border-t border-line">
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="size-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Tailored Pitch Hook & Cold Outreach Draft</span>
            </h3>

            {/* Pitch Hook Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-ink-2">1-Sentence Pitch Hook</label>
              <textarea
                rows={2}
                value={localLead.pitch_hook || ''}
                onChange={(e) => handleFieldChange('pitch_hook', e.target.value)}
                placeholder="Personalized hook connecting your achievements to their specific needs..."
                className="w-full p-2.5 text-xs rounded-lg bg-surface border border-line focus:border-brand-500 focus:outline-none leading-relaxed italic"
              />
            </div>

            {/* Interactive 4-Line Email Draft Box */}
            <div className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Mail className="size-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-ink">4-Line Plain-Text Cold Email Draft</span>
                </div>

                {/* Email Action Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopyDraft}
                    className="h-7 px-2.5 rounded-lg border border-line bg-surface hover:bg-surface-3 text-ink text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                    title="Copy full 4-line email draft"
                  >
                    {copiedDraft ? (
                      <>
                        <Check className="size-3 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3 text-ink-3" />
                        <span>Copy Draft</span>
                      </>
                    )}
                  </button>

                  <a
                    href={gmailComposeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-7 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                    title="Open in Gmail Web with draft pre-filled"
                  >
                    <Send className="size-3" />
                    <span>Gmail</span>
                  </a>

                  <a
                    href={mailtoUrl}
                    className="h-7 px-2 rounded-lg border border-line bg-surface hover:bg-surface-3 text-ink-3 hover:text-ink text-[11px] inline-flex items-center justify-center transition-colors cursor-pointer"
                    title="Open in Default Mail Client (mailto)"
                  >
                    <Mail className="size-3" />
                  </a>
                </div>
              </div>

              {/* Editable Draft Body Textarea */}
              <div className="space-y-1">
                <textarea
                  rows={8}
                  value={draftBody}
                  onChange={(e) => setDraftBody(e.target.value)}
                  className="w-full p-3 font-mono text-xs text-ink-2 bg-surface rounded-lg border border-line focus:border-brand-500 focus:outline-none leading-relaxed"
                />
                <p className="text-[10px] text-ink-4">
                  Subject: <span className="font-mono text-ink-3">{emailSubject}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-line bg-surface-2/40 flex items-center justify-between shrink-0 gap-2">
          {/* Left Actions: Archive Toggle & Permanent Delete */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleArchive}
              className="h-8 px-2.5 rounded-xl border border-line bg-surface hover:bg-surface-3 text-ink-3 hover:text-ink text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              title={localLead.status === 'archived' ? 'Restore lead to active radar' : 'Archive lead (preserves deduplication)'}
            >
              {localLead.status === 'archived' ? (
                <>
                  <ArchiveRestore className="size-3.5 text-emerald-500" />
                  <span>Restore Lead</span>
                </>
              ) : (
                <>
                  <Archive className="size-3.5" />
                  <span>Archive Lead</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePermanentDelete}
              className="h-8 px-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Completely remove this lead from database"
            >
              <Trash2 className="size-3.5" />
              <span>Delete Permanently</span>
            </button>
          </div>

          {/* Right Actions: Promote & Save */}
          <div className="flex items-center gap-2">
            {localLead.status !== 'promoted' && (
              <button
                type="button"
                onClick={() => {
                  onPromoteToCareer(localLead);
                  handleFieldChange('status', 'promoted');
                }}
                className="h-8 px-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Promote directly into Career Pipeline"
              >
                <span>Promote to Pipeline</span>
                <ArrowRight className="size-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={saveState === 'saving'}
              className="h-8 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Save className="size-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
