'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Lock,
  Unlock,
  Plus,
  Globe,
  Database,
  Server,
  GitBranch,
  Mail,
  CreditCard,
  Box,
  Copy,
  Check,
  Edit3,
  Trash2,
  ExternalLink,
  Calendar,
  Download,
  ShieldCheck,
  Clock,
  Loader2,
  User,
  Phone,
  MessageSquare,
} from 'lucide-react';
import type {
  ClientProject,
  ClientProjectStatus,
  ClientResource,
  ResourceCategory,
} from '@/lib/clients/types';
import { RESOURCE_CATEGORIES } from '@/lib/clients/types';
import { ResourceModal } from './ResourceModal';
import { UnlockVaultModal } from './UnlockVaultModal';

interface ClientDetailDrawerProps {
  client: ClientProject | null;
  accessToken?: string;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  onDeleteClient: (id: string) => Promise<void>;
}

const CATEGORY_ICONS: Record<ResourceCategory, React.ReactNode> = {
  domain: <Globe className="size-4 text-sky-400" />,
  hosting: <Server className="size-4 text-violet-400" />,
  database: <Database className="size-4 text-emerald-400" />,
  git: <GitBranch className="size-4 text-orange-400" />,
  email: <Mail className="size-4 text-amber-400" />,
  payments: <CreditCard className="size-4 text-pink-400" />,
  other: <Box className="size-4 text-zinc-400" />,
};

const STATUS_STYLES: Record<ClientProjectStatus, string> = {
  active: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  live: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  maintenance: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  completed: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  paused: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
};

export const ClientDetailDrawer: React.FC<ClientDetailDrawerProps> = ({
  client,
  accessToken,
  onClose,
  onRefresh,
  onDeleteClient,
}) => {
  const [drawerTab, setDrawerTab] = useState<'stack' | 'overview'>('stack');
  const [unlockToken, setUnlockToken] = useState<string | null>(null);
  const [unlockExpiresAt, setUnlockExpiresAt] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [revealedClient, setRevealedClient] = useState<ClientProject | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);

  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ClientResource | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit Overview state
  const [isEditingOverview, setIsEditingOverview] = useState(false);
  const [isSavingOverview, setIsSavingOverview] = useState(false);
  const [editForm, setEditForm] = useState({
    client_name: '',
    project_name: '',
    summary: '',
    primary_domain: '',
    status: 'active' as ClientProjectStatus,
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    contact_handle: '',
    tech_stack: '',
    notes: '',
  });

  // Reset revealed state when client changes
  useEffect(() => {
    setRevealedClient(null);
    setDrawerTab('stack');
    setIsEditingOverview(false);
    if (client) {
      setEditForm({
        client_name: client.client_name,
        project_name: client.project_name,
        summary: client.summary,
        primary_domain: client.primary_domain,
        status: client.status,
        contact_name: client.contact_name,
        contact_email: client.contact_email,
        contact_phone: client.contact_phone,
        contact_handle: client.contact_handle,
        tech_stack: (client.tech_stack || []).join(', '),
        notes: client.notes,
      });
    }
  }, [client]);

  const fetchRevealedData = useCallback(
    async (clientId: string, token: string) => {
      setIsRevealing(true);
      try {
        const res = await fetch(`/api/admin/clients/${clientId}/reveal`, {
          headers: {
            'x-vault-unlock-token': token,
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        });
        const data = await res.json();
        if (res.ok && data.success && data.client) {
          setRevealedClient(data.client);
        } else {
          // Token expired or invalid
          setUnlockToken(null);
          setUnlockExpiresAt(null);
          setRevealedClient(null);
        }
      } catch {
        setRevealedClient(null);
      } finally {
        setIsRevealing(false);
      }
    },
    [accessToken]
  );

  // If already unlocked and client switches, fetch decrypted secrets automatically
  useEffect(() => {
    if (client && unlockToken && unlockExpiresAt && unlockExpiresAt > Date.now()) {
      fetchRevealedData(client.id, unlockToken);
    }
  }, [client, unlockToken, unlockExpiresAt, fetchRevealedData]);

  // Ephemeral countdown timer
  useEffect(() => {
    if (!unlockExpiresAt) {
      setSecondsRemaining(0);
      return;
    }

    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((unlockExpiresAt - Date.now()) / 1000));
      setSecondsRemaining(diff);
      if (diff <= 0) {
        setUnlockToken(null);
        setUnlockExpiresAt(null);
        setRevealedClient(null);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [unlockExpiresAt]);

  if (!client) return null;

  const activeClient = revealedClient || client;
  const isUnlocked = Boolean(unlockToken && secondsRemaining > 0 && revealedClient);

  const handleLockNow = () => {
    setUnlockToken(null);
    setUnlockExpiresAt(null);
    setRevealedClient(null);
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1500);
    } catch {}
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!confirm('Remove this service/resource from the client?')) return;
    await fetch(`/api/admin/clients/${client.id}/resources?resourceId=${resourceId}`, {
      method: 'DELETE',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
    await onRefresh();
    if (unlockToken) await fetchRevealedData(client.id, unlockToken);
  };

  const handleSaveOverview = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingOverview(true);
    try {
      const res = await fetch(`/api/admin/clients/${client.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          ...editForm,
          tech_stack: editForm.tech_stack
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      if (res.ok) {
        setIsEditingOverview(false);
        await onRefresh();
      }
    } finally {
      setIsSavingOverview(false);
    }
  };

  const handleExportMarkdown = () => {
    const lines = [
      `# ${activeClient.project_name} (${activeClient.client_name})`,
      `Status: ${activeClient.status.toUpperCase()}`,
      activeClient.primary_domain ? `Primary Domain: https://${activeClient.primary_domain}` : '',
      activeClient.summary ? `\n## Project Summary\n${activeClient.summary}` : '',
      `\n## Contact\n- Name: ${activeClient.contact_name || 'N/A'}\n- Email: ${activeClient.contact_email || 'N/A'}\n- Phone: ${activeClient.contact_phone || 'N/A'}\n- Handle: ${activeClient.contact_handle || 'N/A'}`,
      `\n## Infrastructure & Services`,
      ...activeClient.resources.map((r) => {
        const secLines = r.secrets
          .map((s) => `  - ${s.label}: ${s.value}`)
          .join('\n');
        return [
          `### [${r.category.toUpperCase()}] ${r.provider} — ${r.resource_name}`,
          r.account_email ? `- Account Email: ${r.account_email}` : '',
          r.account_username ? `- Username: ${r.account_username}` : '',
          r.connected_git_repo ? `- Connected Git: ${r.connected_git_repo}` : '',
          r.dashboard_url ? `- URL: ${r.dashboard_url}` : '',
          r.renewal_date ? `- Renewal Date: ${r.renewal_date}` : '',
          r.billing_notes ? `- Billing: ${r.billing_notes}` : '',
          secLines ? `- Credentials (${isUnlocked ? 'DECRYPTED' : 'MASKED'}):\n${secLines}` : '',
          r.notes ? `- Notes: ${r.notes}` : '',
        ]
          .filter(Boolean)
          .join('\n');
      }),
    ]
      .filter(Boolean)
      .join('\n');

    const blob = new Blob([lines], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeClient.project_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-ledger.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className="fixed inset-0 z-[80] flex justify-end bg-black/60 backdrop-blur-xs">
        <div
          className="w-full max-w-3xl bg-bg border-l border-line h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
          role="dialog"
          aria-modal="true"
        >
          {/* Drawer Header */}
          <div className="px-6 py-4 border-b border-line bg-surface flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-bold text-ink truncate">
                  {activeClient.project_name}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                    STATUS_STYLES[activeClient.status]
                  }`}
                >
                  {activeClient.status}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted flex-wrap">
                <span className="font-medium text-ink/80">{activeClient.client_name}</span>
                {activeClient.primary_domain && (
                  <a
                    href={
                      activeClient.primary_domain.startsWith('http')
                        ? activeClient.primary_domain
                        : `https://${activeClient.primary_domain}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-accent hover:underline"
                  >
                    <Globe className="size-3" />
                    <span>{activeClient.primary_domain}</span>
                    <ExternalLink className="size-2.5" />
                  </a>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleExportMarkdown}
                title="Export Client Ledger (Markdown)"
                className="h-8 px-2.5 rounded-lg border border-line bg-surface-2 hover:bg-surface-3 text-xs font-medium text-muted hover:text-ink flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="size-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-2 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* 2FA Security Bar */}
          <div
            className={`px-6 py-2.5 border-b flex items-center justify-between gap-3 text-xs ${
              isUnlocked
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/25 text-amber-400'
            }`}
          >
            <div className="flex items-center gap-2">
              {isRevealing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isUnlocked ? (
                <Unlock className="size-4" />
              ) : (
                <Lock className="size-4" />
              )}
              <span className="font-medium">
                {isUnlocked
                  ? 'Vault Unlocked — Passwords & API secrets are decrypted in memory.'
                  : 'Passwords & Secrets are encrypted & masked. Verify 2FA to reveal.'}
              </span>
            </div>
            {isUnlocked ? (
              <div className="flex items-center gap-2.5 shrink-0">
                <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-emerald-500/20 px-2 py-0.5 rounded-md">
                  <Clock className="size-3" />
                  {formatTimer(secondsRemaining)}
                </span>
                <button
                  type="button"
                  onClick={handleLockNow}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 font-semibold cursor-pointer"
                >
                  Lock Now
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsUnlockModalOpen(true)}
                className="px-3 py-1 rounded-lg bg-accent hover:opacity-90 text-white font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <ShieldCheck className="size-3.5" />
                <span>Unlock with 2FA</span>
              </button>
            )}
          </div>

          {/* Navigation Sub-tabs */}
          <div className="px-6 border-b border-line bg-surface flex items-center justify-between">
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => setDrawerTab('stack')}
                className={`py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  drawerTab === 'stack'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                Infrastructure & Secrets ({activeClient.resources.length})
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab('overview')}
                className={`py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  drawerTab === 'overview'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                Project Overview & Contact
              </button>
            </div>

            {drawerTab === 'stack' && (
              <button
                type="button"
                onClick={() => {
                  setEditingResource(null);
                  setIsResourceModalOpen(true);
                }}
                className="h-7 px-3 rounded-lg bg-accent hover:opacity-90 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="size-3.5" />
                <span>Add Service</span>
              </button>
            )}
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {drawerTab === 'stack' ? (
              activeClient.resources.length === 0 ? (
                <div className="text-center py-14 border border-dashed border-line rounded-2xl bg-surface/50">
                  <Server className="size-10 text-muted/40 mx-auto mb-3" />
                  <h4 className="text-sm font-semibold text-ink">
                    No infrastructure services added yet
                  </h4>
                  <p className="text-xs text-muted max-w-sm mx-auto mt-1 mb-4">
                    Track Domain registrars, Supabase, Vercel, GitHub repos, VPS, email providers,
                    and their 2FA-locked credentials.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingResource(null);
                      setIsResourceModalOpen(true);
                    }}
                    className="h-9 px-4 rounded-xl bg-accent text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="size-4" />
                    <span>Add First Service</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {RESOURCE_CATEGORIES.map((cat) => {
                    const items = activeClient.resources.filter((r) => r.category === cat.id);
                    if (items.length === 0) return null;

                    return (
                      <div key={cat.id} className="space-y-2.5">
                        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted">
                          {CATEGORY_ICONS[cat.id]}
                          <span>{cat.label}</span>
                        </div>
                        <div className="space-y-3">
                          {items.map((res) => {
                            const isExpiringSoon =
                              res.renewal_date &&
                              new Date(res.renewal_date).getTime() - Date.now() <
                                30 * 24 * 60 * 60 * 1000;

                            return (
                              <div
                                key={res.id}
                                className="rounded-2xl border border-line bg-surface p-4 space-y-3 hover:border-line-strong transition-colors"
                              >
                                {/* Resource Header */}
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="px-2 py-0.5 rounded-md bg-surface-3 text-[11px] font-bold text-ink">
                                        {res.provider}
                                      </span>
                                      <span className="text-sm font-semibold text-ink">
                                        {res.resource_name}
                                      </span>
                                      {res.renewal_date && (
                                        <span
                                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                            isExpiringSoon
                                              ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                              : 'bg-surface-2 text-muted border-line'
                                          }`}
                                        >
                                          <Calendar className="size-2.5" />
                                          Renews {res.renewal_date}
                                        </span>
                                      )}
                                    </div>

                                    {/* Key Ownership Facts */}
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted">
                                      {res.account_email && (
                                        <span className="inline-flex items-center gap-1">
                                          <Mail className="size-3 text-accent" />
                                          <span className="text-ink/90">{res.account_email}</span>
                                        </span>
                                      )}
                                      {res.connected_git_repo && (
                                        <span className="inline-flex items-center gap-1">
                                          <GitBranch className="size-3 text-orange-400" />
                                          <span className="font-mono text-[11px] text-ink/90">
                                            {res.connected_git_repo}
                                          </span>
                                        </span>
                                      )}
                                      {res.billing_notes && (
                                        <span className="text-[11px] text-muted">
                                          • {res.billing_notes}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    {res.dashboard_url && (
                                      <a
                                        href={res.dashboard_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        title="Open Dashboard"
                                        className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-surface-2"
                                      >
                                        <ExternalLink className="size-3.5" />
                                      </a>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingResource(res);
                                        setIsResourceModalOpen(true);
                                      }}
                                      title="Edit Service"
                                      className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-2 cursor-pointer"
                                    >
                                      <Edit3 className="size-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteResource(res.id)}
                                      title="Delete Service"
                                      className="p-1.5 rounded-lg text-muted hover:text-rose-400 hover:bg-surface-2 cursor-pointer"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Metadata Badges */}
                                {Object.keys(res.metadata || {}).length > 0 && (
                                  <div className="flex flex-wrap gap-1.5">
                                    {Object.entries(res.metadata).map(([k, v]) => (
                                      <span
                                        key={k}
                                        className="px-2 py-0.5 rounded-md bg-surface-2 border border-line text-[11px] text-muted"
                                      >
                                        <span className="font-semibold text-ink/70">{k}:</span>{' '}
                                        <span className="font-mono">{v}</span>
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Secrets Box */}
                                {res.secrets.length > 0 && (
                                  <div className="rounded-xl bg-surface-2/70 border border-line p-3 space-y-2">
                                    {res.secrets.map((sec) => (
                                      <div
                                        key={sec.id}
                                        className="flex items-center justify-between gap-3 text-xs"
                                      >
                                        <span className="text-muted font-medium truncate">
                                          {sec.label}
                                        </span>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <code className="px-2 py-0.5 rounded bg-bg border border-line font-mono text-[11px] text-ink select-all">
                                            {sec.value}
                                          </code>
                                          {isUnlocked ? (
                                            <button
                                              type="button"
                                              onClick={() => handleCopy(sec.id, sec.value)}
                                              title="Copy secret"
                                              className="p-1 rounded-md text-muted hover:text-accent hover:bg-surface-3 cursor-pointer"
                                            >
                                              {copiedId === sec.id ? (
                                                <Check className="size-3.5 text-emerald-400" />
                                              ) : (
                                                <Copy className="size-3.5" />
                                              )}
                                            </button>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() => setIsUnlockModalOpen(true)}
                                              title="Unlock with 2FA to reveal & copy"
                                              className="p-1 rounded-md text-amber-400 hover:bg-amber-500/15 cursor-pointer"
                                            >
                                              <Lock className="size-3.5" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {res.notes && (
                                  <p className="text-[11px] text-muted leading-relaxed">
                                    {res.notes}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              /* Overview & Contact Tab */
              <div className="space-y-6">
                {!isEditingOverview ? (
                  <>
                    <div className="rounded-2xl border border-line bg-surface p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                          Project Details
                        </h4>
                        <button
                          type="button"
                          onClick={() => setIsEditingOverview(true)}
                          className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="size-3.5" /> Edit Details
                        </button>
                      </div>
                      <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">
                        {activeClient.summary || 'No project summary added yet.'}
                      </p>
                      {activeClient.tech_stack.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {activeClient.tech_stack.map((tech) => (
                            <span
                              key={tech}
                              className="px-2.5 py-1 rounded-lg bg-surface-2 border border-line text-xs font-medium text-ink"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-line bg-surface p-5 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                        Client Contact
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="flex items-center gap-2 text-ink">
                          <User className="size-3.5 text-muted" />
                          <span>{activeClient.contact_name || '—'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-ink">
                          <Mail className="size-3.5 text-muted" />
                          <span>{activeClient.contact_email || '—'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-ink">
                          <Phone className="size-3.5 text-muted" />
                          <span>{activeClient.contact_phone || '—'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-ink">
                          <MessageSquare className="size-3.5 text-muted" />
                          <span>{activeClient.contact_handle || '—'}</span>
                        </div>
                      </div>
                    </div>

                    {activeClient.notes && (
                      <div className="rounded-2xl border border-line bg-surface p-5 space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                          General Notes
                        </h4>
                        <p className="text-xs text-ink/90 whitespace-pre-wrap leading-relaxed">
                          {activeClient.notes}
                        </p>
                      </div>
                    )}

                    <div className="pt-4 border-t border-line flex justify-end">
                      <button
                        type="button"
                        onClick={() => onDeleteClient(activeClient.id)}
                        className="h-9 px-4 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-400 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="size-3.5" />
                        <span>Delete Client Record</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <form onSubmit={handleSaveOverview} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-ink mb-1">
                          Client Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={editForm.client_name}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, client_name: e.target.value }))
                          }
                          className="w-full h-9 px-3 rounded-xl bg-surface-2 border border-line text-xs text-ink"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-ink mb-1">
                          Project Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={editForm.project_name}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, project_name: e.target.value }))
                          }
                          className="w-full h-9 px-3 rounded-xl bg-surface-2 border border-line text-xs text-ink"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-ink mb-1">
                          Primary Domain
                        </label>
                        <input
                          type="text"
                          value={editForm.primary_domain}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, primary_domain: e.target.value }))
                          }
                          className="w-full h-9 px-3 rounded-xl bg-surface-2 border border-line text-xs text-ink"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-ink mb-1">Status</label>
                        <select
                          value={editForm.status}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              status: e.target.value as ClientProjectStatus,
                            }))
                          }
                          className="w-full h-9 px-3 rounded-xl bg-surface-2 border border-line text-xs text-ink"
                        >
                          <option value="active">Active Development</option>
                          <option value="live">Live / Production</option>
                          <option value="maintenance">Maintenance</option>
                          <option value="completed">Completed</option>
                          <option value="paused">Paused</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">
                        What is the project about?
                      </label>
                      <textarea
                        rows={3}
                        value={editForm.summary}
                        onChange={(e) => setEditForm((f) => ({ ...f, summary: e.target.value }))}
                        className="w-full p-3 rounded-xl bg-surface-2 border border-line text-xs text-ink"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Contact Name"
                        value={editForm.contact_name}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, contact_name: e.target.value }))
                        }
                        className="h-9 px-3 rounded-xl bg-surface-2 border border-line text-xs text-ink"
                      />
                      <input
                        type="email"
                        placeholder="Contact Email"
                        value={editForm.contact_email}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, contact_email: e.target.value }))
                        }
                        className="h-9 px-3 rounded-xl bg-surface-2 border border-line text-xs text-ink"
                      />
                      <input
                        type="text"
                        placeholder="Contact Phone"
                        value={editForm.contact_phone}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, contact_phone: e.target.value }))
                        }
                        className="h-9 px-3 rounded-xl bg-surface-2 border border-line text-xs text-ink"
                      />
                      <input
                        type="text"
                        placeholder="Telegram / WhatsApp Handle"
                        value={editForm.contact_handle}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, contact_handle: e.target.value }))
                        }
                        className="h-9 px-3 rounded-xl bg-surface-2 border border-line text-xs text-ink"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">
                        Tech Stack (comma separated)
                      </label>
                      <input
                        type="text"
                        value={editForm.tech_stack}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, tech_stack: e.target.value }))
                        }
                        placeholder="Next.js, Supabase, Vercel, Tailwind"
                        className="w-full h-9 px-3 rounded-xl bg-surface-2 border border-line text-xs text-ink"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">
                        General Notes
                      </label>
                      <textarea
                        rows={2}
                        value={editForm.notes}
                        onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                        className="w-full p-3 rounded-xl bg-surface-2 border border-line text-xs text-ink"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingOverview(false)}
                        className="h-9 px-4 rounded-xl border border-line text-xs font-semibold text-muted cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingOverview}
                        className="h-9 px-5 rounded-xl bg-accent text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        {isSavingOverview && <Loader2 className="size-3.5 animate-spin" />}
                        Save Changes
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2FA Unlock Modal */}
      <UnlockVaultModal
        isOpen={isUnlockModalOpen}
        onClose={() => setIsUnlockModalOpen(false)}
        onUnlocked={(token, expiresAt) => {
          setUnlockToken(token);
          setUnlockExpiresAt(expiresAt);
          fetchRevealedData(client.id, token);
        }}
      />

      {/* Add / Edit Resource Modal */}
      <ResourceModal
        isOpen={isResourceModalOpen}
        clientId={client.id}
        editingResource={editingResource}
        accessToken={accessToken}
        onClose={() => {
          setIsResourceModalOpen(false);
          setEditingResource(null);
        }}
        onSaved={async () => {
          await onRefresh();
          if (unlockToken) {
            await fetchRevealedData(client.id, unlockToken);
          }
        }}
      />
    </>
  );
};
