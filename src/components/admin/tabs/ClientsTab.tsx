'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Search,
  Globe,
  Server,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  X,
  Loader2,
  FolderKanban,
  Lock,
  Copy,
  Check,
  Database,
  GitBranch,
  Mail,
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import type { ClientProject, ClientProjectStatus } from '@/lib/clients/types';
import { ClientDetailDrawer } from './clients/ClientDetailDrawer';

const SQL_SETUP_SNIPPET = `-- Run in Supabase SQL Editor to create Client Infrastructure Vault tables
CREATE TABLE IF NOT EXISTS public.client_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_name TEXT NOT NULL,
  project_name TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  primary_domain TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'live', 'maintenance', 'completed', 'paused')),
  contact_name TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '',
  contact_handle TEXT NOT NULL DEFAULT '',
  tech_stack TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS public.client_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.client_projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  category TEXT NOT NULL CHECK (category IN ('domain', 'hosting', 'database', 'git', 'email', 'payments', 'other')),
  provider TEXT NOT NULL,
  resource_name TEXT NOT NULL,
  account_email TEXT NOT NULL DEFAULT '',
  account_username TEXT NOT NULL DEFAULT '',
  connected_git_repo TEXT NOT NULL DEFAULT '',
  dashboard_url TEXT NOT NULL DEFAULT '',
  renewal_date DATE,
  billing_notes TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  encrypted_secrets TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT ''
);

ALTER TABLE public.client_projects ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.client_projects FROM anon, authenticated, PUBLIC;
GRANT ALL ON public.client_projects TO service_role;

ALTER TABLE public.client_resources ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.client_resources FROM anon, authenticated, PUBLIC;
GRANT ALL ON public.client_resources TO service_role;`;

const STATUS_BADGE: Record<ClientProjectStatus, string> = {
  active: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  live: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  maintenance: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  completed: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  paused: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
};

export const ClientsTab: React.FC = () => {
  const { session } = useAdminAuth();
  const [clients, setClients] = useState<ClientProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);
  const [vaultConfigured, setVaultConfigured] = useState(true);
  const [copiedSql, setCopiedSql] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ClientProjectStatus>('all');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Add Client Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newClient, setNewClient] = useState({
    client_name: '',
    project_name: '',
    primary_domain: '',
    summary: '',
    status: 'active' as ClientProjectStatus,
    contact_name: '',
    contact_email: '',
    contact_handle: '',
    tech_stack: '',
  });

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/clients', {
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setClients(data.clients || []);
        setTableMissing(Boolean(data.tableMissing));
        setVaultConfigured(data.vaultConfigured !== false);
      }
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId) || null,
    [clients, selectedClientId]
  );

  const filteredClients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return clients.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (!q) return true;
      const inClient =
        c.client_name.toLowerCase().includes(q) ||
        c.project_name.toLowerCase().includes(q) ||
        c.primary_domain.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q) ||
        c.contact_email.toLowerCase().includes(q);
      const inResources = c.resources.some(
        (r) =>
          r.provider.toLowerCase().includes(q) ||
          r.resource_name.toLowerCase().includes(q) ||
          r.account_email.toLowerCase().includes(q) ||
          r.connected_git_repo.toLowerCase().includes(q)
      );
      return inClient || inResources;
    });
  }, [clients, searchQuery, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    let totalServices = 0;
    let expiringSoon = 0;
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    for (const c of clients) {
      totalServices += c.resources.length;
      for (const r of c.resources) {
        if (r.renewal_date) {
          const diff = new Date(r.renewal_date).getTime() - now;
          if (diff >= -86400000 && diff <= thirtyDaysMs) expiringSoon++;
        }
      }
    }
    return {
      totalClients: clients.length,
      liveProjects: clients.filter((c) => c.status === 'live').length,
      totalServices,
      expiringSoon,
    };
  }, [clients]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.client_name.trim() || !newClient.project_name.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          ...newClient,
          tech_stack: newClient.tech_stack
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.client) {
        setIsAddOpen(false);
        setNewClient({
          client_name: '',
          project_name: '',
          primary_domain: '',
          summary: '',
          status: 'active',
          contact_name: '',
          contact_email: '',
          contact_handle: '',
          tech_stack: '',
        });
        await fetchClients();
        setSelectedClientId(data.client.id);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm('Delete this client record and all of its encrypted services?')) return;
    const res = await fetch(`/api/admin/clients/${id}`, {
      method: 'DELETE',
      headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
    });
    if (res.ok) {
      setSelectedClientId(null);
      await fetchClients();
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex items-center justify-center text-muted text-sm gap-2">
        <Loader2 className="size-4 animate-spin text-accent" />
        <span>Loading Client Infrastructure Vault...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Missing Table Setup Banner */}
      {tableMissing && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-ink">
                  Database Migration Required (`client_projects` & `client_resources`)
                </h3>
                <p className="text-xs text-muted mt-1">
                  Run the migration SQL below in your Supabase SQL Editor once to activate the
                  Client Infrastructure Vault.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(SQL_SETUP_SNIPPET);
                setCopiedSql(true);
                setTimeout(() => setCopiedSql(false), 2000);
              }}
              className="h-8 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              {copiedSql ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL'}</span>
            </button>
          </div>
        </div>
      )}

      {!vaultConfigured && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-300 flex items-center gap-2">
          <Lock className="size-4 shrink-0" />
          <span>
            Notice: <code>VAULT_ENCRYPTION_KEY</code> is not configured in environment variables.
            Add a 32-byte base64 key to enable AES-256-GCM encryption at rest.
          </span>
        </div>
      )}

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
            Total Clients
          </div>
          <div className="text-2xl font-bold text-ink mt-1">{stats.totalClients}</div>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
            Live Projects
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{stats.liveProjects}</div>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
            Tracked Services
          </div>
          <div className="text-2xl font-bold text-accent mt-1">{stats.totalServices}</div>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
            Renewals &lt; 30d
          </div>
          <div
            className={`text-2xl font-bold mt-1 ${
              stats.expiringSoon > 0 ? 'text-rose-400' : 'text-ink'
            }`}
          >
            {stats.expiringSoon}
          </div>
        </div>
      </div>

      {/* Toolbar: Search, Filter, Add Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="size-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search client, domain, email, Supabase, GitHub..."
              className="w-full h-10 pl-10 pr-3 rounded-xl bg-surface border border-line focus:border-accent outline-none text-xs text-ink"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(['all', 'active', 'live', 'maintenance', 'completed'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize border transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-accent/15 border-accent text-accent'
                    : 'bg-surface border-line text-muted hover:text-ink'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="h-10 px-4 rounded-xl bg-accent hover:opacity-90 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Plus className="size-4" />
          <span>New Client Project</span>
        </button>
      </div>

      {/* Client Cards Grid */}
      {filteredClients.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-line bg-surface/40">
          <FolderKanban className="size-10 text-muted/40 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-ink">
            {clients.length === 0 ? 'No client projects yet' : 'No matching clients found'}
          </h3>
          <p className="text-xs text-muted max-w-md mx-auto mt-1 mb-4">
            Create a client record to track their project scope, domain registrar, purchase email,
            Supabase/Vercel/VPS accounts, connected GitHub repos, and 2FA-protected passwords.
          </p>
          {clients.length === 0 && (
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="h-9 px-4 rounded-xl bg-accent text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="size-4" />
              <span>Add Your First Client</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClients.map((c) => {
            const domainRes = c.resources.find((r) => r.category === 'domain');
            const dbRes = c.resources.find((r) => r.category === 'database');
            const hostRes = c.resources.find((r) => r.category === 'hosting');
            const secretCount = c.resources.filter((r) => r.has_secrets).length;

            return (
              <div
                key={c.id}
                onClick={() => setSelectedClientId(c.id)}
                className="group rounded-2xl border border-line bg-surface p-5 hover:border-accent/50 transition-all cursor-pointer flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-ink truncate group-hover:text-accent transition-colors">
                          {c.project_name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border shrink-0 ${
                            STATUS_BADGE[c.status]
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted mt-0.5">{c.client_name}</p>
                    </div>
                    {c.primary_domain && (
                      <a
                        href={
                          c.primary_domain.startsWith('http')
                            ? c.primary_domain
                            : `https://${c.primary_domain}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-2 border border-line text-[11px] font-medium text-ink hover:text-accent shrink-0"
                      >
                        <Globe className="size-3" />
                        <span>{c.primary_domain}</span>
                        <ExternalLink className="size-2.5" />
                      </a>
                    )}
                  </div>

                  {c.summary && (
                    <p className="text-xs text-muted line-clamp-2 leading-relaxed">{c.summary}</p>
                  )}

                  {/* Quick Infrastructure Snapshot */}
                  <div className="space-y-1.5 pt-1">
                    {domainRes && (
                      <div className="flex items-center gap-2 text-[11px] text-muted">
                        <Globe className="size-3 text-sky-400 shrink-0" />
                        <span className="font-semibold text-ink/90">{domainRes.provider}</span>
                        {domainRes.account_email && (
                          <span className="truncate flex items-center gap-1">
                            · <Mail className="size-2.5" /> {domainRes.account_email}
                          </span>
                        )}
                      </div>
                    )}
                    {dbRes && (
                      <div className="flex items-center gap-2 text-[11px] text-muted">
                        <Database className="size-3 text-emerald-400 shrink-0" />
                        <span className="font-semibold text-ink/90">{dbRes.provider}</span>
                        {dbRes.account_email && <span className="truncate">· {dbRes.account_email}</span>}
                        {dbRes.connected_git_repo && (
                          <span className="truncate font-mono flex items-center gap-0.5 text-orange-400">
                            · <GitBranch className="size-2.5" /> {dbRes.connected_git_repo}
                          </span>
                        )}
                      </div>
                    )}
                    {hostRes && (
                      <div className="flex items-center gap-2 text-[11px] text-muted">
                        <Server className="size-3 text-violet-400 shrink-0" />
                        <span className="font-semibold text-ink/90">{hostRes.provider}</span>
                        {hostRes.account_email && (
                          <span className="truncate">· {hostRes.account_email}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-line flex items-center justify-between text-[11px] text-muted">
                  <span>{c.resources.length} tracked services</span>
                  <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                    <ShieldCheck className="size-3.5" />
                    {secretCount > 0 ? `${secretCount} 2FA-locked` : 'Click to manage'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create New Client Modal */}
      {isAddOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl border border-line bg-surface shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line bg-surface-2/60">
              <h3 className="text-sm font-bold text-ink">New Client & Project</h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 rounded-lg text-muted hover:text-ink cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={handleCreateClient} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Client / Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newClient.client_name}
                    onChange={(e) =>
                      setNewClient((f) => ({ ...f, client_name: e.target.value }))
                    }
                    placeholder="e.g. Aroma Curtains Ltd"
                    className="w-full h-9 px-3 rounded-xl bg-surface-2 border border-line focus:border-accent outline-none text-xs text-ink"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newClient.project_name}
                    onChange={(e) =>
                      setNewClient((f) => ({ ...f, project_name: e.target.value }))
                    }
                    placeholder="e.g. Aroma E-Commerce Platform"
                    className="w-full h-9 px-3 rounded-xl bg-surface-2 border border-line focus:border-accent outline-none text-xs text-ink"
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
                    value={newClient.primary_domain}
                    onChange={(e) =>
                      setNewClient((f) => ({ ...f, primary_domain: e.target.value }))
                    }
                    placeholder="e.g. aromacurtains.com"
                    className="w-full h-9 px-3 rounded-xl bg-surface-2 border border-line focus:border-accent outline-none text-xs text-ink"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Status</label>
                  <select
                    value={newClient.status}
                    onChange={(e) =>
                      setNewClient((f) => ({
                        ...f,
                        status: e.target.value as ClientProjectStatus,
                      }))
                    }
                    className="w-full h-9 px-3 rounded-xl bg-surface-2 border border-line focus:border-accent outline-none text-xs text-ink"
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
                  rows={2}
                  value={newClient.summary}
                  onChange={(e) => setNewClient((f) => ({ ...f, summary: e.target.value }))}
                  placeholder="Brief scope of work, architecture, or deliverables..."
                  className="w-full p-2.5 rounded-xl bg-surface-2 border border-line focus:border-accent outline-none text-xs text-ink"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Client Contact Name"
                  value={newClient.contact_name}
                  onChange={(e) =>
                    setNewClient((f) => ({ ...f, contact_name: e.target.value }))
                  }
                  className="h-9 px-3 rounded-xl bg-surface-2 border border-line text-xs text-ink outline-none focus:border-accent"
                />
                <input
                  type="email"
                  placeholder="Client Email"
                  value={newClient.contact_email}
                  onChange={(e) =>
                    setNewClient((f) => ({ ...f, contact_email: e.target.value }))
                  }
                  className="h-9 px-3 rounded-xl bg-surface-2 border border-line text-xs text-ink outline-none focus:border-accent"
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Tech Stack (e.g. Next.js, Supabase, Vercel)"
                  value={newClient.tech_stack}
                  onChange={(e) => setNewClient((f) => ({ ...f, tech_stack: e.target.value }))}
                  className="w-full h-9 px-3 rounded-xl bg-surface-2 border border-line text-xs text-ink outline-none focus:border-accent"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="h-9 px-4 rounded-xl border border-line text-xs font-semibold text-muted cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="h-9 px-5 rounded-xl bg-accent text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  {isCreating && <Loader2 className="size-3.5 animate-spin" />}
                  <span>Create & Add Services</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Detail & 2FA Vault Drawer */}
      <ClientDetailDrawer
        client={selectedClient}
        accessToken={session?.access_token}
        onClose={() => setSelectedClientId(null)}
        onRefresh={fetchClients}
        onDeleteClient={handleDeleteClient}
      />
    </div>
  );
};
