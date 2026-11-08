'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { TempMailDomainRecord, TempMailDnsRecord } from '@/lib/os/temp-mail-domains';

interface TempMailDomainManagerProps {
  adminHeaders?: HeadersInit;
}

export const TempMailDomainManager: React.FC<TempMailDomainManagerProps> = ({ adminHeaders }) => {
  const [domains, setDomains] = useState<TempMailDomainRecord[]>([]);
  const [defaultDomain, setDefaultDomain] = useState<string>('zahidp.com');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAddingDomain, setIsAddingDomain] = useState<boolean>(false);
  const [verifyingDomain, setVerifyingDomain] = useState<string | null>(null);

  // New domain form
  const [newDomain, setNewDomain] = useState<string>('');
  const [newDomainResendKey, setNewDomainResendKey] = useState<string>('');
  const [newDomainIsDefault, setNewDomainIsDefault] = useState<boolean>(false);

  // Feedback & DNS inspection
  const [domainFeedback, setDomainFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    dnsRecords?: TempMailDnsRecord[];
  } | null>(null);
  const [expandedDomainDns, setExpandedDomainDns] = useState<string | null>(null);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const fetchDomains = useCallback(async () => {
    try {
      const res = await fetch('/api/os/temp-mail/domains');
      if (res.ok) {
        const data = await res.json();
        if (data.domains && Array.isArray(data.domains)) {
          setDomains(data.domains);
          if (data.defaultDomain) {
            setDefaultDomain(data.defaultDomain);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch temp mail domains:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedValue(text);
    setTimeout(() => setCopiedValue(null), 2000);
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;

    setIsAddingDomain(true);
    setDomainFeedback(null);

    try {
      const res = await fetch('/api/os/temp-mail/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(adminHeaders || {}),
        },
        body: JSON.stringify({
          domain: newDomain.trim(),
          resendApiKey: newDomainResendKey.trim() || undefined,
          isDefault: newDomainIsDefault,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setDomainFeedback({
          type: 'error',
          message: data.error || 'Failed to register domain.',
        });
        return;
      }

      setDomainFeedback({
        type: 'success',
        message: data.message || `Domain '${data.domain?.domain}' registered successfully!`,
        dnsRecords: data.dnsRecords,
      });

      setNewDomain('');
      setNewDomainResendKey('');
      setNewDomainIsDefault(false);
      await fetchDomains();
    } catch (err: unknown) {
      setDomainFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Network error adding domain',
      });
    } finally {
      setIsAddingDomain(false);
    }
  };

  const handleDeleteDomain = async (domainName: string) => {
    if (!window.confirm(`Are you sure you want to remove domain '${domainName}'?`)) return;
    try {
      const res = await fetch(`/api/os/temp-mail/domains?domain=${encodeURIComponent(domainName)}`, {
        method: 'DELETE',
        headers: {
          ...(adminHeaders || {}),
        },
      });
      if (res.ok) {
        await fetchDomains();
      }
    } catch (err) {
      console.warn('Failed to remove domain:', err);
    }
  };

  const handleVerifyDomain = async (domainName: string) => {
    setVerifyingDomain(domainName);
    try {
      const res = await fetch('/api/os/temp-mail/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(adminHeaders || {}),
        },
        body: JSON.stringify({
          domain: domainName,
          action: 'verify',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDomainFeedback({
          type: data.isReceivingReady ? 'success' : 'error',
          message: data.message || `Status updated for ${domainName}`,
          dnsRecords: data.dnsRecords,
        });
        await fetchDomains();
      } else {
        setDomainFeedback({
          type: 'error',
          message: data.error || 'Failed to verify domain with Resend.',
        });
      }
    } catch (err: unknown) {
      setDomainFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Verification request failed',
      });
    } finally {
      setVerifyingDomain(null);
    }
  };

  const handleSetDefault = async (domainName: string) => {
    try {
      const res = await fetch('/api/os/temp-mail/domains', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(adminHeaders || {}),
        },
        body: JSON.stringify({
          domain: domainName,
        }),
      });
      if (res.ok) {
        setDefaultDomain(domainName);
        await fetchDomains();
      }
    } catch (err) {
      console.warn('Failed to set default domain:', err);
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 grid place-items-center shrink-0">
            <Globe className="size-4" />
          </div>
          <div>
            <span className="text-sm font-bold text-white block">
              Inbound Email Domains (Resend API)
            </span>
            <span className="text-xs text-white/60 block">
              Manage custom domains and verify MX records for disposable inboxes.
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchDomains}
          disabled={isLoading}
          className="size-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white grid place-items-center transition-colors cursor-pointer"
          title="Refresh domains list"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
        </button>
      </div>

      {/* Register New Domain */}
      <form onSubmit={handleAddDomain} className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white/90 font-mono flex items-center gap-1.5">
            <Plus className="size-3 text-amber-400" />
            <span>Add Inbound Domain</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-white/70 block mb-1">Domain Name</label>
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value.toLowerCase().trim())}
              placeholder="e.g. mail.domain.com"
              required
              className="w-full h-8 px-3 rounded-lg border border-white/15 bg-black/80 text-xs font-mono text-white focus:border-amber-400 outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-white/70 block mb-1">
              Resend API Key <span className="text-white/40">(Optional)</span>
            </label>
            <input
              type="password"
              value={newDomainResendKey}
              onChange={(e) => setNewDomainResendKey(e.target.value.trim())}
              placeholder="re_... (leave empty for default vault key)"
              className="w-full h-8 px-3 rounded-lg border border-white/15 bg-black/80 text-xs font-mono text-white focus:border-amber-400 outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-white/70">
            <input
              type="checkbox"
              checked={newDomainIsDefault}
              onChange={(e) => setNewDomainIsDefault(e.target.checked)}
              className="rounded border-white/20 bg-black/40 text-amber-500 focus:ring-0"
            />
            <span>Set as default receiving domain</span>
          </label>

          <button
            type="submit"
            disabled={isAddingDomain || !newDomain.trim()}
            className="h-8 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-xs shrink-0"
          >
            {isAddingDomain ? (
              <>
                <RefreshCw className="size-3 animate-spin" />
                <span>Registering...</span>
              </>
            ) : (
              <>
                <Sparkles className="size-3" />
                <span>Register Domain</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Feedback Banner */}
      {domainFeedback && (
        <div
          className={`p-3 rounded-xl border text-xs space-y-2 ${
            domainFeedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {domainFeedback.type === 'success' ? (
              <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="size-4 text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{domainFeedback.message}</span>
          </div>

          {domainFeedback.dnsRecords && domainFeedback.dnsRecords.length > 0 && (
            <div className="pt-2 border-t border-white/10 space-y-2 text-[11px] font-mono">
              <span className="font-bold text-white block">Required DNS Records:</span>
              <div className="overflow-x-auto space-y-1.5">
                {domainFeedback.dnsRecords.map((r, i) => (
                  <div key={i} className="p-2 rounded bg-black/60 border border-white/10 flex items-center justify-between gap-2">
                    <span className="text-amber-300 font-bold">{r.type}</span>
                    <span className="text-white/70 truncate flex-1">{r.name} → {r.value}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(r.value)}
                      className="p-1 rounded bg-white/10 hover:bg-white/20 text-white shrink-0 cursor-pointer"
                    >
                      {copiedValue === r.value ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Domain List */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-white/80 block">Configured Domains ({domains.length})</span>

        {domains.length === 0 ? (
          <p className="text-xs text-white/40 italic p-3 rounded-xl bg-white/5 border border-white/5">
            No custom domains configured. Uses system fallback domain.
          </p>
        ) : (
          <div className="space-y-2">
            {domains.map((dom) => {
              const isDefault = dom.domain === defaultDomain || dom.isDefault;
              const isVerifying = verifyingDomain === dom.domain;
              const isExpanded = expandedDomainDns === dom.domain;
              const mxRecord = dom.dnsRecords?.find((r) => r.type === 'MX');
              const isMxMissing = !mxRecord || mxRecord.status !== 'verified';

              return (
                <div
                  key={dom.domain}
                  className={`p-3 rounded-xl border transition-all space-y-2.5 ${
                    isDefault
                      ? 'border-amber-500/40 bg-amber-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-bold text-xs text-white truncate">
                        @{dom.domain}
                      </span>
                      {isDefault && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30">
                          Default
                        </span>
                      )}
                      {isMxMissing ? (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                          MX Pending
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                          ✓ Verified
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleVerifyDomain(dom.domain)}
                        disabled={isVerifying}
                        className="h-7 px-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-medium cursor-pointer transition-colors flex items-center gap-1"
                        title="Query Resend to check DNS verification"
                      >
                        <RefreshCw className={`size-3 ${isVerifying ? 'animate-spin text-amber-400' : ''}`} />
                        <span>{isVerifying ? 'Checking...' : 'Check DNS'}</span>
                      </button>

                      {dom.dnsRecords && dom.dnsRecords.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setExpandedDomainDns(isExpanded ? null : dom.domain)}
                          className="h-7 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-mono cursor-pointer transition-colors flex items-center gap-1"
                        >
                          <span>DNS ({dom.dnsRecords.length})</span>
                          {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                        </button>
                      )}

                      {!isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(dom.domain)}
                          className="h-7 px-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-medium cursor-pointer transition-colors"
                        >
                          Make Default
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteDomain(dom.domain)}
                        className="size-7 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 grid place-items-center transition-colors cursor-pointer"
                        title="Remove domain"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded DNS view */}
                  {isExpanded && dom.dnsRecords && (
                    <div className="pt-2 border-t border-white/10 space-y-1.5 text-[11px] font-mono">
                      {dom.dnsRecords.map((r, i) => (
                        <div key={i} className="p-2 rounded bg-black/60 border border-white/10 flex items-center justify-between gap-2">
                          <span className="text-amber-300 font-bold">{r.type}</span>
                          <span className="text-white/60 truncate flex-1">{r.name} → {r.value}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(r.value)}
                            className="p-1 rounded bg-white/10 hover:bg-white/20 text-white shrink-0 cursor-pointer"
                          >
                            {copiedValue === r.value ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

