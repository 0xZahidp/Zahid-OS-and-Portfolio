'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Radar,
  Search,
  LayoutGrid,
  Table as TableIcon,
  ExternalLink,
  Copy,
  Check,
  Mail,
  Send,
  ArrowRight,
  Archive,
  RefreshCw,
  Lock,
  Sparkles,
  TrendingUp,
  Zap,
  Globe,
  User,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Edit2,
  Save,
  X,
  Plus,
  Trash2,
  ArchiveRestore,
} from 'lucide-react';
import {
  StartupLead,
  StartupLeadMetrics,
  StartupLeadTrack,
  StartupLeadSignalType,
  StartupLeadStatus,
} from '@/types/leads';
import { generateOutreachEmailDraft } from '@/lib/leads/email-template';
import { confirmModal } from '@/components/ui/ConfirmDialog';
import { AddLeadModal } from './AddLeadModal';
import { LeadDetailDrawer } from './LeadDetailDrawer';

function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return 'recently';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return 'just now';
    const diffMins = Math.floor(diffMs / (60 * 1000));
    if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'recently';
  }
}

export const LeadsTab: React.FC = () => {
  const [leads, setLeads] = useState<StartupLead[]>([]);
  const [metrics, setMetrics] = useState<StartupLeadMetrics>({
    newToday: 0,
    readyToEmail: 0,
    emailed: 0,
    replied: 0,
    promoted: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters & Controls
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [trackFilter, setTrackFilter] = useState<string>('all');
  const [signalFilter, setSignalFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);

  // Inline email editing state
  const [editingEmailId, setEditingEmailId] = useState<string | null>(null);
  const [editingEmailValue, setEditingEmailValue] = useState<string>('');

  // Add Lead Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Active Detail Drawer state
  const [activeDetailLead, setActiveDetailLead] = useState<StartupLead | null>(null);

  // Action in progress tracking
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const [lookingUpHunterId, setLookingUpHunterId] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 2800);
  }, []);

  const handleLeadUpdatedFromDrawer = useCallback(
    (updatedLead: StartupLead, newMetrics?: StartupLeadMetrics) => {
      setLeads((prev) =>
        prev.map((l) => (l.id === updatedLead.id ? updatedLead : l))
      );
      if (newMetrics) setMetrics(newMetrics);
      if (activeDetailLead?.id === updatedLead.id) {
        setActiveDetailLead(updatedLead);
      }
      showToast(`✓ Saved changes for ${updatedLead.company_name}`);
    },
    [activeDetailLead, showToast]
  );

  const handleLeadDeletedFromDrawer = useCallback(
    (leadId: string, newMetrics?: StartupLeadMetrics) => {
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      if (newMetrics) setMetrics(newMetrics);
      if (activeDetailLead?.id === leadId) {
        setActiveDetailLead(null);
      }
      showToast('✓ Lead permanently deleted');
    },
    [activeDetailLead, showToast]
  );

  const handleLeadCreated = useCallback(
    (newLead: StartupLead, newMetrics?: StartupLeadMetrics) => {
      setLeads((prev) => [newLead, ...prev.filter((l) => l.id !== newLead.id)]);
      if (newMetrics) {
        setMetrics(newMetrics);
      }
      showToast(`✓ Added ${newLead.company_name} to Leads Radar!`);
    },
    [showToast]
  );

  // Fetch leads from API
  const fetchLeads = useCallback(
    async (isBackground = false) => {
      if (!isBackground) setIsLoading(true);
      else setIsRefreshing(true);
      setErrorMessage(null);

      try {
        const params = new URLSearchParams();
        if (trackFilter !== 'all') params.set('track', trackFilter);
        if (signalFilter !== 'all') params.set('signal_type', signalFilter);
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (showArchived) params.set('include_archived', 'true');
        if (search.trim()) params.set('search', search.trim());

        const res = await fetch(`/api/admin/leads?${params.toString()}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setLeads(data.leads || []);
          if (data.metrics) setMetrics(data.metrics);
        } else {
          setErrorMessage(data.error || 'Failed to load startup leads');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Network error loading leads';
        setErrorMessage(msg);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [trackFilter, signalFilter, statusFilter, showArchived, search]
  );

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Keyboard shortcut '/' to search and 'n' to add lead
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (e.key === '/' && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if ((e.key === 'n' || e.key === 'N') && !isInput && !isAddModalOpen) {
        e.preventDefault();
        setIsAddModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddModalOpen]);

  // Copy helper
  const handleCopy = async (text: string, id: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItemId(id);
      showToast(`✓ Copied ${label} to clipboard!`);
      setTimeout(() => {
        setCopiedItemId((cur) => (cur === id ? null : cur));
      }, 2000);
    } catch {
      showToast('✕ Could not copy to clipboard');
    }
  };

  // Update lead status
  const handleUpdateStatus = async (leadId: string, newStatus: StartupLeadStatus) => {
    setActionInProgressId(leadId);
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: leadId,
          updates: { status: newStatus },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
        );
        if (data.metrics) setMetrics(data.metrics);
        showToast(`✓ Lead marked as ${newStatus}`);
      } else {
        showToast(`✕ ${data.error || 'Update failed'}`);
      }
    } catch {
      showToast('✕ Network error updating lead');
    } finally {
      setActionInProgressId(null);
    }
  };

  // Save edited email
  const handleSaveEmail = async (leadId: string) => {
    const trimmed = editingEmailValue.trim();
    setActionInProgressId(leadId);
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: leadId,
          updates: {
            contact_email: trimmed || null,
            email_confidence: trimmed ? 'extracted' : 'missing',
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId
              ? {
                  ...l,
                  contact_email: trimmed || null,
                  email_confidence: trimmed ? 'extracted' : 'missing',
                }
              : l
          )
        );
        if (data.metrics) setMetrics(data.metrics);
        setEditingEmailId(null);
        showToast('✓ Contact email updated!');
      } else {
        showToast(`✕ ${data.error || 'Failed to save email'}`);
      }
    } catch {
      showToast('✕ Network error saving email');
    } finally {
      setActionInProgressId(null);
    }
  };

  // Manual Hunter.io email lookup
  const handleHunterLookup = async (leadId: string) => {
    setLookingUpHunterId(leadId);
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, action: 'lookup_hunter' }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.lead) {
        setLeads((prev) => prev.map((l) => (l.id === leadId ? data.lead : l)));
        if (data.metrics) setMetrics(data.metrics);
        showToast(`✓ Found email: ${data.lead.contact_email}`);
      } else {
        showToast(`✕ ${data.error || 'No email found on Hunter.io'}`);
      }
    } catch {
      showToast('✕ Network error during Hunter.io lookup');
    } finally {
      setLookingUpHunterId(null);
    }
  };

  // Promote to Career Pipeline
  const handlePromoteToCareer = async (lead: StartupLead) => {
    if (lead.status === 'promoted') {
      showToast('ℹ This lead is already in your Career Pipeline.');
      return;
    }

    setActionInProgressId(lead.id);
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: lead.id,
          action: 'promote',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLeads((prev) =>
          prev.map((l) => (l.id === lead.id ? { ...l, status: 'promoted' } : l))
        );
        if (data.metrics) setMetrics(data.metrics);
        showToast(`🚀 Promoted ${lead.company_name} to Career & Pipeline as 'Applied'!`);
      } else {
        showToast(`✕ ${data.error || 'Failed to promote lead'}`);
      }
    } catch {
      showToast('✕ Network error promoting lead');
    } finally {
      setActionInProgressId(null);
    }
  };

  // Direct Permanent Delete from card or table row
  const handleDirectDelete = async (e: React.MouseEvent, lead: StartupLead) => {
    e.stopPropagation();
    const ok = await confirmModal({
      title: 'Permanently Delete Lead?',
      message: `Are you sure you want to permanently delete "${lead.company_name}"? This removes the record from Supabase completely. (Use Archive instead if you only want to hide it while blocking duplicates).`,
      confirmText: 'Delete Permanently',
      type: 'danger',
    });
    if (!ok) return;

    setActionInProgressId(lead.id);
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLeads((prev) => prev.filter((l) => l.id !== lead.id));
        if (data.metrics) setMetrics(data.metrics);
        if (activeDetailLead?.id === lead.id) {
          setActiveDetailLead(null);
        }
        showToast(`✓ Permanently deleted ${lead.company_name}`);
      } else {
        showToast(`✕ ${data.error || 'Failed to delete lead'}`);
      }
    } catch {
      showToast('✕ Network error during deletion');
    } finally {
      setActionInProgressId(null);
    }
  };

  // Direct Archive / Restore toggle from card or row
  const handleArchiveToggle = async (e: React.MouseEvent, lead: StartupLead) => {
    e.stopPropagation();
    const newStatus: StartupLeadStatus = lead.status === 'archived' ? 'new' : 'archived';
    setActionInProgressId(lead.id);

    try {
      const res = await fetch(`/api/admin/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLeads((prev) =>
          prev.map((l) => (l.id === lead.id ? { ...l, status: newStatus } : l))
        );
        if (data.metrics) setMetrics(data.metrics);
        if (activeDetailLead?.id === lead.id) {
          setActiveDetailLead((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
        showToast(
          newStatus === 'archived'
            ? `◫ Archived ${lead.company_name}`
            : `✓ Restored ${lead.company_name} to active radar`
        );
      } else {
        showToast(`✕ ${data.error || 'Failed to update status'}`);
      }
    } catch {
      showToast('✕ Network error updating status');
    } finally {
      setActionInProgressId(null);
    }
  };

  // Track badge renderer
  const renderTrackBadge = (track: StartupLeadTrack) => {
    switch (track) {
      case 'Web3 Growth':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <TrendingUp className="size-2.5" />
            Web3 Growth
          </span>
        );
      case 'Salesforce':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
            <Zap className="size-2.5" />
            Salesforce
          </span>
        );
      case 'Full-Stack':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Sparkles className="size-2.5" />
            Full-Stack
          </span>
        );
    }
  };

  // Signal badge renderer
  const renderSignalBadge = (signal: StartupLeadSignalType) => {
    if (signal === 'seed_funding') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <Sparkles className="size-2.5" />
          Seed Funding
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
        <Briefcase className="size-2.5" />
        Hiring Post
      </span>
    );
  };

  // Status badge renderer
  const renderStatusBadge = (status: StartupLeadStatus) => {
    switch (status) {
      case 'promoted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <CheckCircle2 className="size-2.5" />
            Promoted
          </span>
        );
      case 'replied':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="size-2.5" />
            Replied
          </span>
        );
      case 'emailed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Mail className="size-2.5" />
            Emailed
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-neutral-500/10 text-neutral-500 border border-neutral-500/20">
            <Archive className="size-2.5" />
            Archived
          </span>
        );
      case 'new':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
            New
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-2xl bg-surface-2 border border-line shadow-xl text-xs font-semibold text-ink flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchLeads()}
            className="px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-600 dark:text-rose-400 font-semibold cursor-pointer transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* 1. Compact Single-Row Metrics Strip (56px tall, matching CareerTab) */}
      <div className="h-14 px-4 rounded-2xl border border-line bg-surface-2/40 flex items-center justify-between text-xs overflow-x-auto shrink-0 [scrollbar-width:thin]">
        <div className="flex items-center gap-6 divide-x divide-line/60">
          <div className="flex items-center gap-2">
            <Radar className="size-3.5 text-ink-3" />
            <span className="text-ink-3">New Today</span>
            <span className="font-mono font-bold text-ink">{metrics.newToday}</span>
          </div>

          <div className="flex items-center gap-2 pl-6">
            <Mail className="size-3.5 text-blue-500 dark:text-blue-400" />
            <span className="text-ink-3">Ready to Email</span>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
              {metrics.readyToEmail}
            </span>
          </div>

          <div className="flex items-center gap-2 pl-6">
            <Send className="size-3.5 text-amber-500 dark:text-amber-400" />
            <span className="text-ink-3">Emailed</span>
            <span className="font-mono font-bold text-ink">{metrics.emailed}</span>
          </div>

          <div className="flex items-center gap-2 pl-6">
            <CheckCircle2 className="size-3.5 text-emerald-500 dark:text-emerald-400" />
            <span className="text-ink-3">Replied</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {metrics.replied}
            </span>
          </div>

          <div className="flex items-center gap-2 pl-6">
            <ArrowRight className="size-3.5 text-indigo-500 dark:text-indigo-400" />
            <span className="text-ink-3">Promoted to Pipeline</span>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {metrics.promoted}
            </span>
          </div>
        </div>

        {/* Private Confidential Beacon */}
        <div className="hidden md:flex items-center gap-1.5 text-[10px] text-ink-3 font-semibold px-2 py-1 rounded-lg bg-surface border border-line">
          <Lock className="size-3 text-ink-3" />
          <span>Private Radar</span>
        </div>
      </div>

      {/* 2. ONE Toolbar Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left Controls in Exact Specified Order */}
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          {/* View switch (Cards / Table) */}
          <div className="inline-flex rounded-xl border border-line bg-surface-2 p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-surface text-ink shadow-2xs font-bold'
                  : 'text-ink-3 hover:text-ink'
              }`}
            >
              <LayoutGrid className="size-3.5" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-surface text-ink shadow-2xs font-bold'
                  : 'text-ink-3 hover:text-ink'
              }`}
            >
              <TableIcon className="size-3.5" />
              <span>Table</span>
            </button>
          </div>

          {/* Track filter */}
          <select
            value={trackFilter}
            onChange={(e) => setTrackFilter(e.target.value)}
            className="h-8.5 px-2.5 rounded-xl border border-line bg-surface-2 text-xs font-medium text-ink focus:outline-hidden cursor-pointer shrink-0"
          >
            <option value="all">All Tracks</option>
            <option value="Web3 Growth">Web3 Growth</option>
            <option value="Full-Stack">Full-Stack</option>
            <option value="Salesforce">Salesforce</option>
          </select>

          {/* Signal filter */}
          <select
            value={signalFilter}
            onChange={(e) => setSignalFilter(e.target.value)}
            className="h-8.5 px-2.5 rounded-xl border border-line bg-surface-2 text-xs font-medium text-ink focus:outline-hidden cursor-pointer shrink-0"
          >
            <option value="all">All Signals</option>
            <option value="early_hiring_post">Early Hiring Post</option>
            <option value="seed_funding">Seed Funding</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8.5 px-2.5 rounded-xl border border-line bg-surface-2 text-xs font-medium text-ink focus:outline-hidden cursor-pointer shrink-0"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="ready_to_email">Ready to Email</option>
            <option value="emailed">Emailed</option>
            <option value="replied">Replied</option>
            <option value="promoted">Promoted</option>
          </select>

          {/* Show Archived toggle */}
          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className={`h-8.5 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer shrink-0 ${
              showArchived
                ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'border-line bg-surface-2 text-ink-3 hover:text-ink'
            }`}
          >
            {showArchived ? 'Viewing Archived' : 'Show Archived'}
          </button>

          {/* Search input (flex-1, max-w-sm) */}
          <div className="relative flex-1 max-w-sm min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-ink-3 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company, role, hook... (Press /)"
              className="w-full h-8.5 pl-8 pr-3 rounded-xl border border-line bg-surface-2 text-xs text-ink placeholder:text-ink-4 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Right Actions: Refresh and New Lead button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => fetchLeads(true)}
            disabled={isRefreshing}
            className="h-8.5 px-3 rounded-xl border border-line bg-surface-2 hover:bg-surface-3 text-xs font-medium text-ink inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            title="Refresh Leads"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Primary + New Lead Button (Emerald) */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="h-8.5 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>New Lead</span>
          </button>
        </div>
      </div>

      {/* 3. Main Workspace: Cards or Table */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <div className="size-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          <p className="text-xs text-ink-3">Scanning radar for startup leads...</p>
        </div>
      ) : leads.length === 0 ? (
        <div className="py-20 px-4 rounded-2xl border border-dashed border-line bg-surface-2/20 text-center max-w-xl mx-auto flex flex-col items-center gap-3">
          <div className="size-12 rounded-2xl bg-surface-2 border border-line grid place-items-center text-ink-3">
            <Radar className="size-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink">No Startup Leads Found</h3>
            <p className="text-xs text-ink-3 mt-1 max-w-md">
              {search || trackFilter !== 'all' || signalFilter !== 'all' || statusFilter !== 'all'
                ? 'No leads match your current filter parameters. Try clearing or expanding your filters.'
                : 'The radar is active. Automated background ingestion will surface new seed funding and early hiring leads every 4 hours.'}
            </p>
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        /* ================= CARDS VIEW ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {leads.map((lead) => {
            const isActing = actionInProgressId === lead.id;
            const draftEmail = generateOutreachEmailDraft(lead);

            return (
              <div
                key={lead.id}
                onClick={() => setActiveDetailLead(lead)}
                className="group rounded-2xl border border-line bg-surface-2/50 hover:bg-surface-2/80 hover:border-brand-500/40 transition-all p-4 flex flex-col justify-between gap-3 shadow-2xs cursor-pointer"
              >
                {/* Card Header: Company, Track, Signal, Time */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-ink text-sm truncate" title={lead.company_name}>
                          {lead.company_name}
                        </h4>
                        {lead.website_domain && (
                          <a
                            href={
                              lead.website_domain.startsWith('http')
                                ? lead.website_domain
                                : `https://${lead.website_domain}`
                            }
                            onClick={(e) => e.stopPropagation()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-ink-4 hover:text-ink-2 transition-colors"
                            title={`Visit ${lead.website_domain}`}
                          >
                            <Globe className="size-3" />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-brand-600 dark:text-brand-400 font-medium truncate mt-0.5">
                        {lead.role_or_headline}
                      </p>
                    </div>

                    <span className="text-[10px] text-ink-4 shrink-0 font-mono">
                      {formatRelativeTime(lead.post_published_at || lead.created_at)}
                    </span>
                  </div>

                  {/* Badges strip */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                    {renderTrackBadge(lead.track)}
                    {renderSignalBadge(lead.signal_type)}
                    {renderStatusBadge(lead.status)}
                  </div>

                  {/* Startup Summary */}
                  {lead.startup_summary && (
                    <p className="text-xs text-ink-2 leading-relaxed line-clamp-2 mb-2 bg-surface/60 rounded-xl p-2 border border-line/40">
                      {lead.startup_summary}
                    </p>
                  )}

                  {/* Contact Info Strip */}
                  <div className="rounded-xl border border-line/50 bg-surface/40 p-2.5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-ink-2 truncate">
                        <User className="size-3 text-ink-3 shrink-0" />
                        <span className="font-medium truncate">
                          {lead.contact_name || 'Founder / Team'}
                        </span>
                        {lead.contact_title && (
                          <span className="text-[10px] text-ink-4 truncate">
                            ({lead.contact_title})
                          </span>
                        )}
                      </div>

                      {/* Source Link */}
                      {lead.source_url && (
                        <a
                          href={lead.source_url}
                          onClick={(e) => e.stopPropagation()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-medium text-ink-3 hover:text-ink transition-colors shrink-0"
                          title="Open original post"
                        >
                          <span>Source</span>
                          <ExternalLink className="size-2.5" />
                        </a>
                      )}
                    </div>

                    {/* Email Row or Inline Editor */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="pt-1 border-t border-line/40 flex items-center justify-between gap-2"
                    >
                      {editingEmailId === lead.id ? (
                        <div className="flex items-center gap-1.5 w-full">
                          <input
                            type="email"
                            value={editingEmailValue}
                            onChange={(e) => setEditingEmailValue(e.target.value)}
                            placeholder="founder@company.com"
                            className="h-6 flex-1 px-2 rounded-lg border border-line bg-surface text-ink text-xs focus:outline-hidden font-mono"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEmail(lead.id);
                              if (e.key === 'Escape') setEditingEmailId(null);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEmail(lead.id)}
                            disabled={isActing}
                            className="h-6 px-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-semibold cursor-pointer"
                          >
                            <Save className="size-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingEmailId(null)}
                            className="h-6 px-1.5 rounded-lg border border-line text-ink-3 hover:text-ink text-[10px] cursor-pointer"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      ) : lead.contact_email ? (
                        <div className="flex items-center justify-between w-full gap-2">
                          <div className="flex items-center gap-1.5 truncate">
                            <Mail className="size-3 text-emerald-500 shrink-0" />
                            <span className="font-mono text-xs text-ink truncate select-all">
                              {lead.contact_email}
                            </span>
                            <span
                              className={`text-[9px] uppercase px-1 py-0.2 rounded font-bold ${
                                lead.email_confidence === 'verified'
                                  ? 'bg-emerald-500/10 text-emerald-500'
                                  : lead.email_confidence === 'extracted'
                                    ? 'bg-blue-500/10 text-blue-500'
                                    : 'bg-amber-500/10 text-amber-500'
                              }`}
                            >
                              {lead.email_confidence}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(lead.contact_email!, `email-${lead.id}`, 'email')
                              }
                              className="h-6 px-2 rounded-lg border border-line bg-surface hover:bg-surface-3 text-ink text-[10px] font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                              title="Copy Email Address"
                            >
                              {copiedItemId === `email-${lead.id}` ? (
                                <Check className="size-2.5 text-emerald-500" />
                              ) : (
                                <Copy className="size-2.5 text-ink-3" />
                              )}
                              <span>Copy</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingEmailId(lead.id);
                                setEditingEmailValue(lead.contact_email || '');
                              }}
                              className="size-6 rounded-lg border border-line bg-surface hover:bg-surface-3 text-ink-3 hover:text-ink grid place-items-center cursor-pointer transition-colors"
                              title="Edit Email"
                            >
                              <Edit2 className="size-2.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full gap-2">
                          <span className="text-[11px] text-ink-4 italic">Email missing</span>
                          <div className="flex items-center gap-1.5">
                            {lead.website_domain && lead.contact_name && (
                              <button
                                type="button"
                                disabled={lookingUpHunterId === lead.id}
                                onClick={() => handleHunterLookup(lead.id)}
                                className="h-6 px-2 rounded-lg border border-amber-500/25 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-medium inline-flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                                title="Lookup email via Hunter.io (uses dynamic HUNTER_API_KEY from Secrets Vault)"
                              >
                                {lookingUpHunterId === lead.id ? (
                                  <RefreshCw className="size-2.5 animate-spin" />
                                ) : (
                                  <Sparkles className="size-2.5" />
                                )}
                                <span>Find (Hunter)</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingEmailId(lead.id);
                                setEditingEmailValue('');
                              }}
                              className="h-6 px-2 rounded-lg border border-dashed border-line bg-surface hover:border-line-2 text-ink-3 hover:text-ink text-[10px] font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Edit2 className="size-2.5" />
                              <span>Add Email</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 1-Line Pitch Hook & Copy Draft Button */}
                  {lead.pitch_hook && (
                    <div className="mt-2.5 p-2 rounded-xl bg-indigo-500/5 border border-indigo-500/15">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                          <Zap className="size-2.5" />
                          Tailored Pitch Hook
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(draftEmail, `draft-${lead.id}`, '4-line email draft');
                          }}
                          className="h-5.5 px-2 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                          title="Copy personalized 4-line email draft"
                        >
                          {copiedItemId === `draft-${lead.id}` ? (
                            <Check className="size-2.5" />
                          ) : (
                            <Copy className="size-2.5" />
                          )}
                          <span>Copy 4-Line Draft</span>
                        </button>
                      </div>
                      <p className="text-xs text-ink-2 italic leading-snug">&ldquo;{lead.pitch_hook}&rdquo;</p>
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="pt-2.5 border-t border-line/60 flex items-center justify-between gap-1.5"
                >
                  {/* Left: Email Status Toggle */}
                  <div className="flex items-center gap-1">
                    {lead.status === 'emailed' ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateStatus(lead.id, 'replied');
                        }}
                        disabled={isActing}
                        className="h-7 px-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium hover:bg-emerald-500/20 cursor-pointer transition-colors inline-flex items-center gap-1"
                        title="Mark as Replied"
                      >
                        <CheckCircle2 className="size-3" />
                        <span>Replied</span>
                      </button>
                    ) : lead.status === 'replied' ? (
                      <span className="h-7 px-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold inline-flex items-center gap-1 border border-emerald-500/20">
                        <CheckCircle2 className="size-3" />
                        <span>Active Thread</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateStatus(lead.id, 'emailed');
                        }}
                        disabled={isActing}
                        className="h-7 px-2.5 rounded-xl border border-line bg-surface hover:bg-surface-3 text-ink text-[11px] font-medium cursor-pointer transition-colors inline-flex items-center gap-1"
                        title="Mark as Emailed"
                      >
                        <Mail className="size-3 text-ink-3" />
                        <span>Mark Emailed</span>
                      </button>
                    )}
                  </div>

                  {/* Right: Promote, Archive & Permanent Delete */}
                  <div className="flex items-center gap-1">
                    {lead.status === 'promoted' ? (
                      <span className="h-7 px-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold inline-flex items-center gap-1 border border-indigo-500/20">
                        <Check className="size-3" />
                        <span>In Pipeline</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePromoteToCareer(lead);
                        }}
                        disabled={isActing}
                        className="h-7 px-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-[11px] font-semibold cursor-pointer transition-colors inline-flex items-center gap-1 shadow-2xs disabled:opacity-50"
                        title="Add to Career & Pipeline tracker as 'Applied'"
                      >
                        <ArrowRight className="size-3" />
                        <span>Promote</span>
                      </button>
                    )}

                    {lead.status === 'archived' ? (
                      <button
                        type="button"
                        onClick={(e) => handleArchiveToggle(e, lead)}
                        disabled={isActing}
                        className="h-7 px-2 rounded-xl border border-line bg-surface hover:bg-surface-3 text-ink-3 hover:text-ink text-[11px] cursor-pointer transition-colors inline-flex items-center gap-1"
                        title="Unarchive lead"
                      >
                        <ArchiveRestore className="size-3 text-emerald-500" />
                        <span>Restore</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleArchiveToggle(e, lead)}
                        disabled={isActing}
                        className="size-7 rounded-xl border border-transparent hover:border-line hover:bg-surface text-ink-4 hover:text-ink-2 flex items-center justify-center cursor-pointer transition-colors"
                        title="Archive lead (preserves deduplication)"
                      >
                        <Archive className="size-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleDirectDelete(e, lead)}
                      disabled={isActing}
                      className="size-7 rounded-xl border border-transparent hover:border-rose-500/20 hover:bg-rose-500/10 text-ink-4 hover:text-rose-500 flex items-center justify-center cursor-pointer transition-colors"
                      title="Permanently Delete lead"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= TABLE VIEW ================= */
        <div className="rounded-2xl border border-line bg-surface-2/40 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto [scrollbar-width:thin]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-ink-3 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Company & Role</th>
                  <th className="py-3 px-3">Track & Signal</th>
                  <th className="py-3 px-3">Contact & Email</th>
                  <th className="py-3 px-3">Pitch Angle</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {leads.map((lead) => {
                  const isActing = actionInProgressId === lead.id;
                  const draftEmail = generateOutreachEmailDraft(lead);

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setActiveDetailLead(lead)}
                      className="hover:bg-surface-2/60 transition-colors group cursor-pointer"
                    >
                      {/* Column 1: Company & Role */}
                      <td className="py-3 px-4 min-w-[200px] max-w-[260px]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-ink truncate">{lead.company_name}</span>
                          {lead.website_domain && (
                            <a
                              href={
                                lead.website_domain.startsWith('http')
                                  ? lead.website_domain
                                  : `https://${lead.website_domain}`
                              }
                              onClick={(e) => e.stopPropagation()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-ink-4 hover:text-ink-2"
                            >
                              <Globe className="size-2.5" />
                            </a>
                          )}
                          {lead.source_url && (
                            <a
                              href={lead.source_url}
                              onClick={(e) => e.stopPropagation()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-ink-4 hover:text-ink-2"
                              title="Original Source"
                            >
                              <ExternalLink className="size-2.5" />
                            </a>
                          )}
                        </div>
                        <div className="text-[11px] text-ink-3 truncate mt-0.5">
                          {lead.role_or_headline}
                        </div>
                        <div className="text-[10px] text-ink-4 font-mono mt-0.5">
                          {formatRelativeTime(lead.post_published_at || lead.created_at)}
                        </div>
                      </td>

                      {/* Column 2: Track & Signal */}
                      <td className="py-3 px-3 shrink-0 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          {renderTrackBadge(lead.track)}
                          {renderSignalBadge(lead.signal_type)}
                        </div>
                      </td>

                      {/* Column 3: Contact & Email */}
                      <td className="py-3 px-3 min-w-[190px]">
                        <div className="text-ink-2 font-medium truncate">
                          {lead.contact_name || 'Founder / Team'}
                        </div>
                        {lead.contact_email ? (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[11px] text-ink truncate select-all">
                              {lead.contact_email}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(lead.contact_email!, `tbl-email-${lead.id}`, 'email');
                              }}
                              className="text-ink-4 hover:text-ink cursor-pointer"
                              title="Copy Email"
                            >
                              {copiedItemId === `tbl-email-${lead.id}` ? (
                                <Check className="size-3 text-emerald-500" />
                              ) : (
                                <Copy className="size-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-ink-4 italic">Email missing</span>
                            {lead.website_domain && lead.contact_name && (
                              <button
                                type="button"
                                disabled={lookingUpHunterId === lead.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleHunterLookup(lead.id);
                                }}
                                className="text-[9px] font-medium text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer disabled:opacity-50"
                                title="Lookup email via Hunter.io (uses dynamic HUNTER_API_KEY from Secrets Vault)"
                              >
                                {lookingUpHunterId === lead.id ? (
                                  <RefreshCw className="size-2 animate-spin" />
                                ) : (
                                  <Sparkles className="size-2" />
                                )}
                                <span>Lookup</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Column 4: Pitch Angle & Copy 4-Line Email */}
                      <td className="py-3 px-3 min-w-[240px] max-w-[340px]">
                        <p className="text-[11px] text-ink-2 line-clamp-2 italic leading-snug">
                          {lead.pitch_hook || lead.startup_summary || '—'}
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(draftEmail, `tbl-draft-${lead.id}`, '4-line email draft');
                          }}
                          className="mt-1.5 h-5 px-2 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          {copiedItemId === `tbl-draft-${lead.id}` ? (
                            <Check className="size-2.5" />
                          ) : (
                            <Copy className="size-2.5" />
                          )}
                          <span>Copy 4-Line Draft</span>
                        </button>
                      </td>

                      {/* Column 5: Status */}
                      <td className="py-3 px-3 shrink-0 whitespace-nowrap">
                        {renderStatusBadge(lead.status)}
                      </td>

                      {/* Column 6: Actions */}
                      <td className="py-3 px-4 text-right shrink-0 whitespace-nowrap">
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5"
                        >
                          {lead.status !== 'emailed' && lead.status !== 'replied' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(lead.id, 'emailed');
                              }}
                              disabled={isActing}
                              className="h-7 px-2.5 rounded-xl border border-line bg-surface hover:bg-surface-3 text-ink text-[11px] font-medium cursor-pointer transition-colors"
                              title="Mark Emailed"
                            >
                              Mark Emailed
                            </button>
                          )}

                          {lead.status === 'promoted' ? (
                            <span className="h-7 px-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold inline-flex items-center gap-1 border border-indigo-500/20">
                              <Check className="size-3" />
                              <span>Promoted</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePromoteToCareer(lead);
                              }}
                              disabled={isActing}
                              className="h-7 px-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-[11px] font-semibold cursor-pointer transition-colors inline-flex items-center gap-1 shadow-2xs"
                              title="Promote to Career Pipeline"
                            >
                              <ArrowRight className="size-3" />
                              <span>Promote</span>
                            </button>
                          )}

                          {lead.status === 'archived' ? (
                            <button
                              type="button"
                              onClick={(e) => handleArchiveToggle(e, lead)}
                              disabled={isActing}
                              className="h-7 px-2 rounded-xl border border-line bg-surface hover:bg-surface-3 text-ink-3 hover:text-ink text-[11px] cursor-pointer inline-flex items-center gap-1"
                              title="Unarchive lead"
                            >
                              <ArchiveRestore className="size-3 text-emerald-500" />
                              <span>Restore</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleArchiveToggle(e, lead)}
                              disabled={isActing}
                              className="size-7 rounded-xl border border-transparent hover:border-line hover:bg-surface text-ink-4 hover:text-ink-2 flex items-center justify-center cursor-pointer transition-colors"
                              title="Archive lead (preserves deduplication)"
                            >
                              <Archive className="size-3" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => handleDirectDelete(e, lead)}
                            disabled={isActing}
                            className="size-7 rounded-xl border border-transparent hover:border-rose-500/20 hover:bg-rose-500/10 text-ink-4 hover:text-rose-500 flex items-center justify-center cursor-pointer transition-colors"
                            title="Permanently Delete lead"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Lead Modal (Quick Paste AI & Manual Entry) */}
      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onLeadCreated={handleLeadCreated}
      />

      {/* Lead Detail Slide-Over Drawer */}
      <LeadDetailDrawer
        lead={activeDetailLead}
        isOpen={!!activeDetailLead}
        onClose={() => setActiveDetailLead(null)}
        onLeadUpdated={handleLeadUpdatedFromDrawer}
        onLeadDeleted={handleLeadDeletedFromDrawer}
        onPromoteToCareer={handlePromoteToCareer}
      />
    </div>
  );
};

