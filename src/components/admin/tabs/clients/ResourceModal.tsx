'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Lock,
} from 'lucide-react';
import {
  PROVIDER_PRESETS,
  RESOURCE_CATEGORIES,
  type ClientResource,
  type ProviderPreset,
  type ResourceCategory,
  type ResourceSecretItem,
} from '@/lib/clients/types';

interface ResourceModalProps {
  isOpen: boolean;
  clientId: string;
  editingResource: ClientResource | null;
  accessToken?: string;
  onClose: () => void;
  onSaved: () => void;
}

export const ResourceModal: React.FC<ResourceModalProps> = ({
  isOpen,
  clientId,
  editingResource,
  accessToken,
  onClose,
  onSaved,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('custom');
  const [category, setCategory] = useState<ResourceCategory>('domain');
  const [provider, setProvider] = useState('');
  const [resourceName, setResourceName] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [accountUsername, setAccountUsername] = useState('');
  const [connectedGitRepo, setConnectedGitRepo] = useState('');
  const [dashboardUrl, setDashboardUrl] = useState('');
  const [renewalDate, setRenewalDate] = useState('');
  const [billingNotes, setBillingNotes] = useState('');
  const [notes, setNotes] = useState('');
  const [metadataList, setMetadataList] = useState<{ key: string; value: string }[]>([]);
  const [secrets, setSecrets] = useState<ResourceSecretItem[]>([]);
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setVisibleSecrets({});

    if (editingResource) {
      setSelectedPresetId('custom');
      setCategory(editingResource.category);
      setProvider(editingResource.provider);
      setResourceName(editingResource.resource_name);
      setAccountEmail(editingResource.account_email);
      setAccountUsername(editingResource.account_username);
      setConnectedGitRepo(editingResource.connected_git_repo);
      setDashboardUrl(editingResource.dashboard_url);
      setRenewalDate(editingResource.renewal_date || '');
      setBillingNotes(editingResource.billing_notes);
      setNotes(editingResource.notes);
      setMetadataList(
        Object.entries(editingResource.metadata || {}).map(([key, value]) => ({
          key,
          value: String(value),
        }))
      );
      setSecrets(
        editingResource.secrets.length > 0
          ? editingResource.secrets
          : [{ id: crypto.randomUUID(), label: 'Password', value: '', isSecret: true }]
      );
    } else {
      // Default to Domain Registrar preset for new resource
      applyPreset(PROVIDER_PRESETS[0]);
      setAccountEmail('');
      setAccountUsername('');
      setConnectedGitRepo('');
      setDashboardUrl('');
      setRenewalDate('');
      setBillingNotes('');
      setNotes('');
    }
  }, [isOpen, editingResource]);

  const applyPreset = (preset: ProviderPreset) => {
    setSelectedPresetId(preset.id);
    setCategory(preset.category);
    setProvider(preset.provider);
    setResourceName('');
    setMetadataList(preset.metadataKeys.map((m) => ({ key: m.key, value: '' })));
    setSecrets(
      preset.defaultSecretLabels.map((label) => ({
        id: crypto.randomUUID(),
        label,
        value: '',
        isSecret: true,
      }))
    );
  };

  if (!isOpen) return null;

  const handleAddMetadata = () => {
    setMetadataList((prev) => [...prev, { key: '', value: '' }]);
  };

  const handleAddSecret = () => {
    setSecrets((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: '', value: '', isSecret: true },
    ]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!provider.trim() || !resourceName.trim()) {
      setError('Provider / Platform and Resource Name are required.');
      return;
    }

    setIsSaving(true);
    try {
      const metadata: Record<string, string> = {};
      for (const item of metadataList) {
        if (item.key.trim() && item.value.trim()) {
          metadata[item.key.trim()] = item.value.trim();
        }
      }

      const res = await fetch(`/api/admin/clients/${clientId}/resources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          id: editingResource?.id,
          category,
          provider: provider.trim(),
          resource_name: resourceName.trim(),
          account_email: accountEmail.trim(),
          account_username: accountUsername.trim(),
          connected_git_repo: connectedGitRepo.trim(),
          dashboard_url: dashboardUrl.trim(),
          renewal_date: renewalDate || null,
          billing_notes: billingNotes.trim(),
          metadata,
          secrets: secrets.filter((s) => s.label.trim() && s.value.trim()),
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to save infrastructure resource.');
      } else {
        onSaved();
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl rounded-2xl border border-line bg-surface shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line bg-surface-2/60">
          <div>
            <h3 className="text-sm font-bold text-ink">
              {editingResource ? `Edit ${editingResource.provider}` : 'Add Service / Infrastructure'}
            </h3>
            <p className="text-[11px] text-muted">
              Unified tracker for Domains, Supabase, Vercel, GitHub, VPS, or any future platform
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-3 cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-start gap-2 text-xs text-rose-400">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Smart Provider Presets (only on create) */}
          {!editingResource && (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted mb-2">
                Quick Platform Template
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PROVIDER_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      selectedPresetId === preset.id
                        ? 'bg-accent/15 border-accent text-accent'
                        : 'bg-surface-2 border-line text-muted hover:text-ink'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Core Identification */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ResourceCategory)}
                className="w-full h-9 px-3 rounded-xl bg-surface-2 border border-line focus:border-accent outline-none text-xs text-ink"
              >
                {RESOURCE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Platform / Provider *
              </label>
              <input
                type="text"
                required
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="e.g. Namecheap, Supabase, Vercel, Hetzner"
                className="w-full h-9 px-3 rounded-xl bg-surface-2 border border-line focus:border-accent outline-none text-xs text-ink"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Resource / Project Name *
              </label>
              <input
                type="text"
                required
                value={resourceName}
                onChange={(e) => setResourceName(e.target.value)}
                placeholder="e.g. domain.com or prod-db"
                className="w-full h-9 px-3 rounded-xl bg-surface-2 border border-line focus:border-accent outline-none text-xs text-ink"
              />
            </div>
          </div>

          {/* Account & Ownership */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Connected / Purchased Email
              </label>
              <input
                type="email"
                value={accountEmail}
                onChange={(e) => setAccountEmail(e.target.value)}
                placeholder="Which email owns/purchased this?"
                className="w-full h-9 px-3 rounded-xl bg-surface-2 border border-line focus:border-accent outline-none text-xs text-ink"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Connected GitHub / Git Repo
              </label>
              <input
                type="text"
                value={connectedGitRepo}
                onChange={(e) => setConnectedGitRepo(e.target.value)}
                placeholder="e.g. 0xZahidP/client-repo (main)"
                className="w-full h-9 px-3 rounded-xl bg-surface-2 border border-line focus:border-accent outline-none text-xs text-ink"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Account Username</label>
              <input
                type="text"
                value={accountUsername}
                onChange={(e) => setAccountUsername(e.target.value)}
                placeholder="Optional username / org"
                className="w-full h-9 px-3 rounded-xl bg-surface-2 border border-line focus:border-accent outline-none text-xs text-ink"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Renewal / Expiry Date
              </label>
              <input
                type="date"
                value={renewalDate}
                onChange={(e) => setRenewalDate(e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-surface-2 border border-line focus:border-accent outline-none text-xs text-ink"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Billing / Cost</label>
              <input
                type="text"
                value={billingNotes}
                onChange={(e) => setBillingNotes(e.target.value)}
                placeholder="e.g. $12/yr, Free tier"
                className="w-full h-9 px-3 rounded-xl bg-surface-2 border border-line focus:border-accent outline-none text-xs text-ink"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Dashboard / Endpoint URL
            </label>
            <input
              type="url"
              value={dashboardUrl}
              onChange={(e) => setDashboardUrl(e.target.value)}
              placeholder="https://..."
              className="w-full h-9 px-3 rounded-xl bg-surface-2 border border-line focus:border-accent outline-none text-xs text-ink"
            />
          </div>

          {/* Flexible Metadata */}
          <div className="p-3.5 rounded-xl border border-line bg-surface-2/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink">
                Platform Metadata (Region, Project ID, Nameservers, IP...)
              </span>
              <button
                type="button"
                onClick={handleAddMetadata}
                className="text-[11px] font-semibold text-accent hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="size-3" /> Add Field
              </button>
            </div>
            {metadataList.length === 0 ? (
              <p className="text-[11px] text-muted">No extra metadata fields.</p>
            ) : (
              <div className="space-y-2">
                {metadataList.map((m, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={m.key}
                      onChange={(e) =>
                        setMetadataList((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, key: e.target.value } : item))
                        )
                      }
                      placeholder="Key (e.g. region)"
                      className="w-1/3 h-8 px-2.5 rounded-lg bg-surface border border-line text-xs text-ink outline-none focus:border-accent"
                    />
                    <input
                      type="text"
                      value={m.value}
                      onChange={(e) =>
                        setMetadataList((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, value: e.target.value } : item
                          )
                        )
                      }
                      placeholder="Value"
                      className="flex-1 h-8 px-2.5 rounded-lg bg-surface border border-line text-xs text-ink outline-none focus:border-accent"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setMetadataList((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="p-1.5 text-muted hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Encrypted Secrets Section */}
          <div className="p-3.5 rounded-xl border border-amber-500/25 bg-amber-500/5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Lock className="size-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-ink">
                  Encrypted Credentials (AES-256-GCM · 2FA Gated)
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddSecret}
                className="text-[11px] font-semibold text-accent hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="size-3" /> Add Secret
              </button>
            </div>
            <div className="space-y-2">
              {secrets.map((sec, idx) => {
                const isVis = Boolean(visibleSecrets[sec.id]);
                const isMaskedPlaceholder = sec.value.startsWith('••••••••');
                return (
                  <div key={sec.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={sec.label}
                      onChange={(e) =>
                        setSecrets((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, label: e.target.value } : item
                          )
                        )
                      }
                      placeholder="Label (e.g. Password)"
                      className="w-1/3 h-8 px-2.5 rounded-lg bg-surface border border-line text-xs text-ink outline-none focus:border-accent"
                    />
                    <div className="relative flex-1">
                      <KeyRound className="size-3 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={isVis && !isMaskedPlaceholder ? 'text' : 'password'}
                        value={sec.value}
                        onChange={(e) =>
                          setSecrets((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, value: e.target.value } : item
                            )
                          )
                        }
                        placeholder={
                          isMaskedPlaceholder
                            ? 'Leave as-is to keep existing secret, or type new'
                            : 'Secret value / password / API key'
                        }
                        className="w-full h-8 pl-7 pr-8 rounded-lg bg-surface border border-line text-xs font-mono text-ink outline-none focus:border-accent"
                      />
                      {!isMaskedPlaceholder && (
                        <button
                          type="button"
                          onClick={() =>
                            setVisibleSecrets((prev) => ({ ...prev, [sec.id]: !prev[sec.id] }))
                          }
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer"
                        >
                          {isVis ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSecrets((prev) => prev.filter((_, i) => i !== idx))}
                      className="p-1.5 text-muted hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Deployment notes, 2FA recovery notes, DNS instructions..."
              className="w-full p-2.5 rounded-xl bg-surface-2 border border-line focus:border-accent outline-none text-xs text-ink"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-xl border border-line text-xs font-semibold text-muted hover:text-ink cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="h-9 px-5 rounded-xl bg-accent hover:opacity-90 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              {isSaving && <Loader2 className="size-3.5 animate-spin" />}
              <span>{editingResource ? 'Update Service' : 'Save Service'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
