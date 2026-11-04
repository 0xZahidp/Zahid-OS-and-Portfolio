'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Mail,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Clock,
  Key,
  Inbox,
  ExternalLink,
  ShieldCheck,
  Plus,
  Radio,
  X,
  Code,
  Lock,
  Globe,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { TempMailDomainRecord, TempMailDnsRecord } from '@/lib/os/temp-mail-domains';

const RESERVED_OFFICIAL_SLUGS = [
  'hello',
  'test',
  'contact',
  'support',
  'reply',
  'noreply',
  'admin',
  'zahid',
  'me',
  'info',
] as const;

export type TempMailTTL = '10m' | '30m' | '1h' | '6h' | '24h';

export interface TempEmailMessage {
  id: string;
  fromName: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  snippet: string;
  bodyText: string;
  bodyHtml?: string;
  otpCode?: string | null;
  verificationLink?: string | null;
  receivedAt: string;
  isRead: boolean;
}

const LOCAL_STORAGE_KEY = 'folioframe_active_temp_inbox';

const TTL_OPTIONS: { label: string; value: TempMailTTL; seconds: number; desc: string }[] = [
  { label: '10 Min', value: '10m', seconds: 600, desc: 'Quick OTP verification' },
  { label: '30 Min', value: '30m', seconds: 1800, desc: 'Password reset / test run' },
  { label: '1 Hour', value: '1h', seconds: 3600, desc: 'Standard dev session' },
  { label: '6 Hours', value: '6h', seconds: 21600, desc: 'Multi-stage test workflow' },
  { label: '24 Hours', value: '24h', seconds: 86400, desc: 'Maximum allowable lifespan' },
];

export const TempMailApp: React.FC = () => {
  // Inbox credentials
  const [inboxAddress, setInboxAddress] = useState<string>('');
  const [inboxToken, setInboxToken] = useState<string>('');
  const [inboxDomain, setInboxDomain] = useState<string>('');
  const [selectedTtl, setSelectedTtl] = useState<TempMailTTL>('1h');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(3600);
  const [totalTtlSeconds, setTotalTtlSeconds] = useState<number>(3600);

  // Domains system state
  const [availableDomains, setAvailableDomains] = useState<TempMailDomainRecord[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [isDomainModalOpen, setIsDomainModalOpen] = useState<boolean>(false);
  const [newDomain, setNewDomain] = useState<string>('');
  const [newDomainResendKey, setNewDomainResendKey] = useState<string>('');
  const [newDomainIsDefault, setNewDomainIsDefault] = useState<boolean>(false);
  const [isAddingDomain, setIsAddingDomain] = useState<boolean>(false);
  const [domainFeedback, setDomainFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    dnsRecords?: TempMailDnsRecord[];
  } | null>(null);
  const [copiedRecordKey, setCopiedRecordKey] = useState<string | null>(null);
  const [expandedDomainDns, setExpandedDomainDns] = useState<string | null>(null);
  const [verifyingDomain, setVerifyingDomain] = useState<string | null>(null);

  // Messages & viewer
  const [messages, setMessages] = useState<TempEmailMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<TempEmailMessage | null>(null);
  const [viewMode, setViewMode] = useState<'text' | 'html'>('text');

  // Loading & status states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Custom address modal
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customUsername, setCustomUsername] = useState('');
  const [customTargetDomain, setCustomTargetDomain] = useState('');

  // Audio notification reference
  const lastMsgCountRef = useRef<number>(0);

  // Play audio chime when a new real email arrives
  const playChime = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {
      // AudioContext not allowed or not supported
    }
  }, []);

  // Fetch available domains from Temp Mail Domain System
  const fetchDomains = useCallback(async () => {
    try {
      const res = await fetch('/api/os/temp-mail/domains');
      if (res.ok) {
        const data = await res.json();
        if (data.domains && Array.isArray(data.domains)) {
          setAvailableDomains(data.domains);
          if (data.defaultDomain) {
            setSelectedDomain((prev) => prev || data.defaultDomain);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch temp mail domains:', err);
    }
  }, []);

  // Fetch live messages for active inbox (non-blocking, sub-10ms)
  const fetchMessages = useCallback(
    async (address: string, token: string, silent = false, forceSync = false) => {
      if (!address) return;
      if (!silent) setIsRefreshing(true);
      try {
        const syncParam = forceSync ? '&sync=true' : '';
        const res = await fetch(
          `/api/os/temp-mail?inbox=${encodeURIComponent(address)}&token=${encodeURIComponent(token)}${syncParam}`
        );
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) return;
        const data = await res.json();

        if (res.ok && data.success) {
          if (data.domain) {
            setInboxDomain(data.domain);
            setSelectedDomain((prev) => prev || data.domain);
          }
          if (data.domains && Array.isArray(data.domains)) {
            setAvailableDomains(data.domains);
          }

          const mapped: TempEmailMessage[] = (data.messages || []).map(
            (m: {
              id: string;
              from_name?: string;
              from_email: string;
              to_email: string;
              subject: string;
              snippet: string;
              body_text: string;
              body_html?: string;
              otp_code?: string | null;
              verification_link?: string | null;
              received_at: string;
              is_read: boolean;
            }) => {
              const d = new Date(m.received_at);
              const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d
                .getMinutes()
                .toString()
                .padStart(2, '0')}`;

              return {
                id: m.id,
                fromName: m.from_name || m.from_email.split('@')[0],
                fromEmail: m.from_email,
                toEmail: m.to_email,
                subject: m.subject || '(No Subject)',
                snippet: m.snippet || '',
                bodyText: m.body_text || '',
                bodyHtml: m.body_html || '',
                otpCode: m.otp_code,
                verificationLink: m.verification_link,
                receivedAt: timeStr,
                isRead: m.is_read || false,
              };
            }
          );

          // If new real email arrived, trigger chime
          if (mapped.length > lastMsgCountRef.current && lastMsgCountRef.current > 0) {
            playChime();
          }
          lastMsgCountRef.current = mapped.length;

          setMessages(mapped);

          // Update remaining seconds based on server expiration
          if (data.inbox?.expires_at) {
            const expTime = new Date(data.inbox.expires_at).getTime();
            const diff = Math.max(0, Math.floor((expTime - Date.now()) / 1000));
            setSecondsRemaining(diff);
          }
        } else if (data.expired) {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          setErrorMessage('Inbox has expired. Creating a fresh inbox...');
          setTimeout(() => {
            handleCreateInbox();
          }, 1000);
        }
      } catch (err) {
        console.warn('Failed to poll temp mail:', err);
      } finally {
        if (!silent) setIsRefreshing(false);
      }
    },
    [playChime] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Create a brand new inbox on server and cache to localStorage
  const handleCreateInbox = async (
    customSlug?: string,
    ttlOpt: TempMailTTL = selectedTtl,
    targetDomain?: string
  ) => {
    setIsCreating(true);
    setErrorMessage(null);
    try {
      const matchTtl = TTL_OPTIONS.find((t) => t.value === ttlOpt);
      const ttlSec = matchTtl ? matchTtl.seconds : 3600;
      const domainToSend = targetDomain || selectedDomain || inboxDomain || undefined;

      const res = await fetch('/api/os/temp-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: customSlug || undefined,
          domain: domainToSend,
          ttlSeconds: ttlSec,
          previousAddress: inboxAddress || undefined,
          previousToken: inboxToken || undefined,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(`Server returned status ${res.status}. Please try again.`);
      }
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to create temp mail');
        return;
      }

      const newInbox = data.inbox;
      setInboxAddress(newInbox.address);
      setInboxToken(newInbox.token);
      setInboxDomain(newInbox.domain);
      setSelectedDomain(newInbox.domain);
      setSelectedTtl(ttlOpt);
      setTotalTtlSeconds(newInbox.ttl_seconds);
      setSecondsRemaining(newInbox.ttl_seconds);
      setMessages([]);
      setSelectedMessage(null);
      lastMsgCountRef.current = 0;

      // Cache to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify({
            address: newInbox.address,
            token: newInbox.token,
            domain: newInbox.domain,
            expiresAt: newInbox.expires_at,
            ttl: ttlOpt,
            totalSeconds: newInbox.ttl_seconds,
          })
        );
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Network error creating inbox');
    } finally {
      setIsCreating(false);
      setShowCustomModal(false);
      setCustomUsername('');
    }
  };

  // Add new domain with Resend API
  const handleAddDomain = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newDomain.trim()) return;

    setIsAddingDomain(true);
    setDomainFeedback(null);
    try {
      const res = await fetch('/api/os/temp-mail/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        message: data.message || `Domain '${data.domain?.domain}' registered successfully in Temp Mail!`,
        dnsRecords: data.dnsRecords,
      });

      setNewDomain('');
      setNewDomainResendKey('');
      setNewDomainIsDefault(false);
      await fetchDomains();

      // Switch to this new domain immediately
      if (data.domain?.domain) {
        setSelectedDomain(data.domain.domain);
        handleCreateInbox(undefined, selectedTtl, data.domain.domain);
      }
    } catch (err: unknown) {
      setDomainFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Network error adding domain',
      });
    } finally {
      setIsAddingDomain(false);
    }
  };

  // Delete a domain
  const handleDeleteDomain = async (domainName: string) => {
    try {
      const res = await fetch(`/api/os/temp-mail/domains?domain=${encodeURIComponent(domainName)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchDomains();
      }
    } catch (err) {
      console.warn('Failed to remove domain:', err);
    }
  };

  // Check & verify domain with Resend API
  const handleVerifyDomain = async (domainName: string) => {
    setVerifyingDomain(domainName);
    try {
      const res = await fetch('/api/os/temp-mail/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  // Restore cached inbox on mount or create fresh one
  useEffect(() => {
    async function initInbox() {
      setIsLoading(true);
      fetchDomains();

      try {
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              const expTime = new Date(parsed.expiresAt).getTime();
              const now = Date.now();

              const isStale = !parsed.address || parsed.address.includes('patwary.dev');

              if (isStale) {
                localStorage.removeItem(LOCAL_STORAGE_KEY);
              } else if (expTime - now > 30000) {
                // Restore active valid inbox
                setInboxAddress(parsed.address);
                setInboxToken(parsed.token);
                setInboxDomain(parsed.domain || 'zahidp.com');
                setSelectedDomain(parsed.domain || 'zahidp.com');
                setSelectedTtl(parsed.ttl || '1h');
                const diff = Math.floor((expTime - now) / 1000);
                setSecondsRemaining(diff);
                setTotalTtlSeconds(parsed.totalSeconds || 3600);

                await fetchMessages(parsed.address, parsed.token, true);
                setIsLoading(false);
                return;
              }
            } catch {
              localStorage.removeItem(LOCAL_STORAGE_KEY);
            }
          }
        }

        // Generate fresh inbox
        await handleCreateInbox(undefined, '1h');
      } finally {
        setIsLoading(false);
      }
    }

    initInbox();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Live polling every 6 seconds (super-fast, non-blocking)
  useEffect(() => {
    if (!inboxAddress || !inboxToken) return;

    const interval = setInterval(() => {
      fetchMessages(inboxAddress, inboxToken, true, false);
    }, 6000);

    return () => clearInterval(interval);
  }, [inboxAddress, inboxToken, fetchMessages]);

  // Live countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Copy email address
  const handleCopyEmail = () => {
    if (navigator.clipboard && inboxAddress) {
      navigator.clipboard.writeText(inboxAddress).then(() => {
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
      });
    }
  };

  // Copy OTP code
  const handleCopyOtp = (code: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        setCopiedOtp(code);
        setTimeout(() => setCopiedOtp(null), 2000);
      });
    }
  };

  // Copy DNS Record value
  const handleCopyDnsValue = (key: string, val: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(val).then(() => {
        setCopiedRecordKey(key);
        setTimeout(() => setCopiedRecordKey(null), 2000);
      });
    }
  };

  // Destroy / delete current inbox
  const handleDeleteInbox = async () => {
    if (!inboxAddress) return;
    try {
      await fetch(
        `/api/os/temp-mail?inbox=${encodeURIComponent(inboxAddress)}&token=${encodeURIComponent(
          inboxToken
        )}`,
        { method: 'DELETE' }
      );
    } catch {
      // ignore
    } finally {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      handleCreateInbox(undefined, selectedTtl);
    }
  };

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.min(100, Math.max(0, (secondsRemaining / totalTtlSeconds) * 100));

  if (isLoading && !inboxAddress) {
    return (
      <div className="p-12 text-center space-y-3">
        <div className="size-10 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mx-auto" />
        <p className="text-xs font-mono text-white/50">Provisioning Real Inbound Inbox...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white max-w-7xl mx-auto p-2 sm:p-4 select-none">
      {/* Top Header Card */}
      <div className="p-5 sm:p-7 rounded-3xl border border-white/10 bg-gradient-to-r from-zinc-950 via-zinc-900 to-amber-950/30 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-mono text-amber-300">
              <Mail className="size-3.5 text-amber-400" />
              <span>Zahid OS • Real Inbound Temp Mail Engine</span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
                <span>Disposable Mailbox</span>
              </h2>

              {/* Active Domain Selector Pill */}
              <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-xl text-xs font-mono font-bold text-amber-300">
                <Globe className="size-3.5 text-amber-400" />
                <span>@{inboxDomain || 'zahidp.com'}</span>
              </div>

              {/* Manage Domains Button */}
              <button
                type="button"
                onClick={() => {
                  setDomainFeedback(null);
                  setIsDomainModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs text-white/90 hover:text-white transition-all cursor-pointer font-medium"
                title="Add and configure custom domains with Resend API"
              >
                <Plus className="size-3.5 text-amber-400" />
                <span>Add / Manage Domains</span>
              </button>
            </div>

            <p className="text-xs text-white/60 leading-relaxed max-w-2xl">
              Live inbound email router powered by Resend Webhooks & Receiving API. Receive OTP codes, test signups,
              and auth verification emails on your custom domains with anti-flooding protection and instant delivery.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-center">
            <span className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-emerald-400 flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
              </span>
              <span>Live Inbound Radar</span>
            </span>

            <button
              type="button"
              onClick={() => fetchMessages(inboxAddress, inboxToken, false, true)}
              disabled={isRefreshing}
              className="size-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white grid place-items-center cursor-pointer transition-colors"
              title="Force sync newly arrived emails from Resend"
            >
              <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Ephemeral Address Card */}
      <div className="p-5 sm:p-6 rounded-3xl border border-white/10 bg-zinc-950/80 backdrop-blur-xl shadow-2xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Email Address Display */}
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono uppercase tracking-wider text-white/50 block">
                Active Temporary Address
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Persistent on Refresh
              </span>

              {/* Domain Switch Dropdown (if multiple domains available) */}
              {availableDomains.length > 1 && (
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="text-[10px] text-white/40 font-mono">Domain:</span>
                  <select
                    value={inboxDomain}
                    onChange={(e) => {
                      const newDom = e.target.value;
                      setSelectedDomain(newDom);
                      handleCreateInbox(undefined, selectedTtl, newDom);
                    }}
                    className="bg-black/80 border border-amber-500/30 rounded-lg px-2 py-0.5 text-[11px] font-mono text-amber-300 outline-hidden cursor-pointer"
                  >
                    {availableDomains.map((d) => (
                      <option key={d.id} value={d.domain} className="bg-zinc-900 text-white">
                        @{d.domain} {d.isDefault ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              <span className="text-lg sm:text-2xl font-mono font-black text-amber-300 tracking-tight truncate">
                {inboxAddress || 'Generating...'}
              </span>

              <button
                type="button"
                onClick={handleCopyEmail}
                disabled={!inboxAddress}
                className="h-9 px-3.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs"
              >
                {copiedEmail ? (
                  <>
                    <Check className="size-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    <span>Copy Address</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons: New Inbox & Destroy */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setCustomTargetDomain(inboxDomain || selectedDomain || '');
                setShowCustomModal(true);
              }}
              className="h-10 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="size-3.5 text-amber-400" />
              <span>Custom Slug</span>
            </button>

            <button
              type="button"
              onClick={() => handleCreateInbox()}
              disabled={isCreating}
              className="h-10 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`size-3.5 ${isCreating ? 'animate-spin' : ''}`} />
              <span>Random New</span>
            </button>

            <button
              type="button"
              onClick={handleDeleteInbox}
              className="h-10 px-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Delete this inbox permanently"
            >
              <Trash2 className="size-3.5" />
              <span>Purge</span>
            </button>
          </div>
        </div>

        {/* TTL Bar with Live Expiration Clock */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-white/60 font-medium">TTL Lifespan:</span>
            <div className="flex items-center gap-1">
              {TTL_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => handleCreateInbox(undefined, t.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                    selectedTtl === t.value
                      ? 'bg-amber-500 text-black font-black shadow-sm shadow-amber-500/30'
                      : 'text-white/50 hover:text-white hover:bg-white/10'
                  }`}
                  title={t.desc}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-amber-400 font-bold flex items-center gap-1.5">
              <Clock className="size-3.5" />
              <span>Expires in {formatTime(secondsRemaining)}</span>
            </span>
            <div className="w-24 bg-white/10 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Flood Protection & Resend Receiving Details */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5 text-[11px] text-white/50 font-mono">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-emerald-400" />
            <span>Anti-Flood Active: Max 15 messages/inbox • Sub-10ms delivery router</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Capacity:</span>
            <span className="text-amber-300 font-bold">{messages.length} / 15 emails</span>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between gap-3">
            <span>{errorMessage}</span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleCreateInbox()}
                className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold text-[11px] cursor-pointer"
              >
                Retry
              </button>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-rose-400 hover:text-rose-200 cursor-pointer p-0.5"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Mailbox Split View (Messages List + Message Detail) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Messages List */}
        <div className={selectedMessage ? 'lg:col-span-5' : 'lg:col-span-12'}>
          <div className="rounded-3xl border border-white/10 bg-zinc-950/80 backdrop-blur-xl shadow-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Inbox className="size-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Received Inbound Emails</h3>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-[11px] font-mono text-white/70">
                  {messages.length}
                </span>
              </div>

              {isRefreshing && (
                <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1 animate-pulse">
                  <Radio className="size-3" />
                  <span>Checking...</span>
                </span>
              )}
            </div>

            <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1 [scrollbar-width:thin]">
              {messages.length > 0 ? (
                messages.map((msg) => {
                  const isSelected = selectedMessage?.id === msg.id;
                  return (
                    <div
                      key={msg.id}
                      onClick={() => {
                        setSelectedMessage(msg);
                        msg.isRead = true;
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10 scale-[1.01]'
                          : 'border-white/10 bg-white/5 hover:border-amber-500/30 hover:bg-white/8'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`size-2 rounded-full shrink-0 ${
                              msg.isRead
                                ? 'bg-transparent border border-white/20'
                                : 'bg-amber-400 shadow-sm shadow-amber-400'
                            }`}
                          />
                          <span className="font-bold text-xs text-white truncate">{msg.fromName}</span>
                        </div>
                        <span className="text-[10px] text-white/40 font-mono shrink-0">
                          {msg.receivedAt}
                        </span>
                      </div>

                      <h4 className="text-xs font-semibold text-white/90 truncate">{msg.subject}</h4>
                      <p className="text-[11px] text-white/50 line-clamp-1 leading-snug">
                        {msg.snippet}
                      </p>

                      {/* Prominent OTP Code Tag in Card */}
                      {msg.otpCode && (
                        <div className="flex items-center justify-between pt-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs border border-emerald-500/30">
                            <Key className="size-3" />
                            <span>OTP: {msg.otpCode}</span>
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyOtp(msg.otpCode!);
                            }}
                            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                          >
                            {copiedOtp === msg.otpCode ? '✓ Copied' : 'Copy OTP'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center text-xs text-white/40 border border-dashed border-white/10 rounded-2xl space-y-2.5">
                  <Mail className="size-8 text-white/20 mx-auto" />
                  <p className="font-semibold text-white/70">Listening for Incoming Real Emails</p>
                  <p className="text-[11px] max-w-sm mx-auto leading-relaxed">
                    Send any verification code, OTP, or webhook to{' '}
                    <code className="text-amber-300 font-mono">{inboxAddress}</code>. It will appear
                    instantly!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Full Message Reader Drawer */}
        {selectedMessage && (
          <div className="lg:col-span-7 sticky top-6">
            <div className="rounded-3xl border border-white/10 bg-zinc-950/95 backdrop-blur-2xl shadow-2xl p-5 sm:p-6 space-y-4 max-h-[700px] overflow-y-auto [scrollbar-width:thin]">
              {/* Message Header */}
              <div className="flex items-start justify-between pb-3.5 border-b border-white/10 gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                    {selectedMessage.subject}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
                    <span className="font-semibold text-white/90">{selectedMessage.fromName}</span>
                    <span className="font-mono text-[11px] text-white/40">
                      &lt;{selectedMessage.fromEmail}&gt;
                    </span>
                    <span>•</span>
                    <span className="font-mono text-[11px] text-amber-400">
                      {selectedMessage.receivedAt}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedMessage(null)}
                  className="size-8 rounded-full bg-white/10 hover:bg-white/20 text-white grid place-items-center cursor-pointer transition-colors shrink-0"
                  title="Close message"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Detected OTP Token Hero Banner */}
              {selectedMessage.otpCode && (
                <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-between gap-3 shadow-lg shadow-emerald-950/40">
                  <div className="flex items-center gap-3.5">
                    <div className="size-11 rounded-xl bg-emerald-500/20 text-emerald-300 grid place-items-center border border-emerald-500/30">
                      <Key className="size-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider font-mono">
                        One-Time Passcode (OTP)
                      </span>
                      <span className="font-mono font-black text-2xl text-white tracking-widest mt-0.5 block">
                        {selectedMessage.otpCode}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyOtp(selectedMessage.otpCode!)}
                    className="h-10 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    {copiedOtp === selectedMessage.otpCode ? (
                      <>
                        <Check className="size-4 text-black" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-4" />
                        <span>Copy OTP</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Detected Verification Link Hero Banner */}
              {selectedMessage.verificationLink && (
                <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-cyan-400 block tracking-wider font-mono">
                      Detected Verification Link
                    </span>
                    <span className="text-xs font-mono text-cyan-200 truncate block mt-0.5">
                      {selectedMessage.verificationLink}
                    </span>
                  </div>

                  <a
                    href={selectedMessage.verificationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                  >
                    <ExternalLink className="size-3.5" />
                    <span>Open</span>
                  </a>
                </div>
              )}

              {/* Text vs HTML View Tabs */}
              {selectedMessage.bodyHtml && (
                <div className="flex items-center justify-end gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setViewMode('text')}
                    className={`px-2.5 py-1 rounded-lg font-mono ${
                      viewMode === 'text'
                        ? 'bg-white/15 text-white font-bold'
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    Plain Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('html')}
                    className={`px-2.5 py-1 rounded-lg font-mono flex items-center gap-1 ${
                      viewMode === 'html'
                        ? 'bg-white/15 text-white font-bold'
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    <Code className="size-3" />
                    <span>Rich HTML</span>
                  </button>
                </div>
              )}

              {/* Message Body */}
              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 max-h-[380px] overflow-y-auto [scrollbar-width:thin]">
                {viewMode === 'html' && selectedMessage.bodyHtml ? (
                  <div
                    className="prose prose-invert max-w-none text-xs text-white/90"
                    dangerouslySetInnerHTML={{ __html: selectedMessage.bodyHtml }}
                  />
                ) : (
                  <pre className="text-xs text-white/80 font-sans whitespace-pre-wrap leading-relaxed select-text">
                    {selectedMessage.bodyText || selectedMessage.snippet}
                  </pre>
                )}
              </div>

              {/* Footer Details */}
              <div className="flex items-center justify-between text-[11px] text-white/40 pt-2 border-t border-white/5">
                <span>Delivered to: {selectedMessage.toEmail}</span>
                <button
                  type="button"
                  onClick={() => {
                    setMessages((prev) => prev.filter((m) => m.id !== selectedMessage.id));
                    setSelectedMessage(null);
                  }}
                  className="text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="size-3" />
                  <span>Dismiss</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Custom Username & Domain */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-zinc-950 border border-white/15 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="size-4 text-amber-400" />
                <span>Create Custom Disposable Inbox</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="text-white/40 hover:text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-white/60">
              Choose your username slug and target domain to receive emails on your disposable address.
            </p>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/70 block">Target Domain</label>
                <select
                  value={customTargetDomain}
                  onChange={(e) => setCustomTargetDomain(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-white/10 bg-white/5 text-xs text-amber-300 font-mono outline-hidden cursor-pointer"
                >
                  {availableDomains.map((d) => (
                    <option key={d.id} value={d.domain} className="bg-zinc-900 text-white">
                      @{d.domain} {d.isDefault ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/70 block">Username Slug</label>
                <div className="flex items-center rounded-xl border border-white/10 bg-white/5 px-3 h-10 focus-within:border-amber-400">
                  <input
                    type="text"
                    value={customUsername}
                    onChange={(e) => setCustomUsername(e.target.value.toLowerCase().trim())}
                    placeholder="e.g. github-test, dev-stripe, mytoken"
                    className="bg-transparent flex-1 text-xs text-white outline-hidden font-mono"
                  />
                  <span className="text-xs font-mono text-white/40">@{customTargetDomain || inboxDomain || 'zahidp.com'}</span>
                </div>
                {customUsername.trim() &&
                  RESERVED_OFFICIAL_SLUGS.some(
                    (s) =>
                      customUsername.toLowerCase() === s ||
                      customUsername.toLowerCase().startsWith(`${s}_`) ||
                      customUsername.toLowerCase().startsWith(`${s}-`)
                  ) && (
                    <p className="text-[11px] text-rose-400 flex items-center gap-1.5 font-medium pt-1">
                      <Lock className="size-3 shrink-0 text-rose-400" />
                      <span>&lsquo;{customUsername}&rsquo; is an official domain address. Official business aliases (hello, test, contact, support, reply, noreply) cannot be used for temp mail.</span>
                    </p>
                  )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="h-9 px-4 rounded-xl text-xs font-semibold text-white/60 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleCreateInbox(customUsername, selectedTtl, customTargetDomain)}
                disabled={
                  !customUsername.trim() ||
                  isCreating ||
                  RESERVED_OFFICIAL_SLUGS.some(
                    (s) =>
                      customUsername.toLowerCase() === s ||
                      customUsername.toLowerCase().startsWith(`${s}_`) ||
                      customUsername.toLowerCase().startsWith(`${s}-`)
                  )
                }
                className="h-9 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold text-xs cursor-pointer transition-colors"
              >
                {isCreating ? 'Provisioning...' : 'Create Inbox'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Temp Mail Domains & Resend API System */}
      {isDomainModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl p-6 sm:p-7 rounded-3xl bg-zinc-950 border border-white/15 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto [scrollbar-width:thin]">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-amber-500/20 text-amber-300 grid place-items-center border border-amber-500/30">
                  <Globe className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Temp Mail Domains & Resend API</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 text-[10px] font-mono border border-amber-500/30">
                      Multi-Domain Router
                    </span>
                  </h3>
                  <p className="text-xs text-white/60 mt-0.5">
                    Add custom domains and Resend API keys to receive temporary mail on any domain you own.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDomainModalOpen(false)}
                className="size-8 rounded-full bg-white/10 hover:bg-white/20 text-white grid place-items-center cursor-pointer transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Add New Domain Form */}
            <form onSubmit={handleAddDomain} className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Plus className="size-3.5 text-amber-400" />
                <span>Register New Domain</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/80 block">Domain Name</label>
                  <input
                    type="text"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value.toLowerCase().trim())}
                    placeholder="e.g. mail.domain.com, tempmail.dev"
                    required
                    className="w-full h-10 px-3.5 rounded-xl border border-white/15 bg-black/60 text-xs font-mono text-white focus:border-amber-400 outline-hidden"
                  />
                  <p className="text-[10px] text-white/40">FQDN domain or subdomain configured with your DNS</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/80 block">
                    Resend API Key <span className="text-white/40 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="password"
                    value={newDomainResendKey}
                    onChange={(e) => setNewDomainResendKey(e.target.value.trim())}
                    placeholder="re_... (leave blank for system key)"
                    className="w-full h-10 px-3.5 rounded-xl border border-white/15 bg-black/60 text-xs font-mono text-white focus:border-amber-400 outline-hidden"
                  />
                  <p className="text-[10px] text-white/40">Uses vault secret by default. Custom key is securely isolated.</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-white/70">
                  <input
                    type="checkbox"
                    checked={newDomainIsDefault}
                    onChange={(e) => setNewDomainIsDefault(e.target.checked)}
                    className="rounded-md border-white/20 bg-black/40 text-amber-500 focus:ring-0"
                  />
                  <span>Set as default domain for new disposable mailboxes</span>
                </label>

                <button
                  type="submit"
                  disabled={isAddingDomain || !newDomain.trim()}
                  className="h-9 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md shrink-0"
                >
                  {isAddingDomain ? (
                    <>
                      <RefreshCw className="size-3.5 animate-spin" />
                      <span>Verifying with Resend...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-3.5" />
                      <span>Add Domain</span>
                    </>
                  )}
                </button>
              </div>

              {domainFeedback && (
                <div
                  className={`p-3.5 rounded-xl border text-xs space-y-2 ${
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
                    <div className="pt-2 border-t border-emerald-500/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider block text-emerald-400">
                          Required DNS Records for Inbound Receiving:
                        </span>
                        <span className="text-[10px] text-amber-300 font-mono font-semibold">
                          ⚠️ MX Record is REQUIRED to receive emails
                        </span>
                      </div>
                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                        {domainFeedback.dnsRecords.map((r, idx) => {
                          const recordKey = `fb_${r.type}_${r.name}_${idx}`;
                          const isMx = r.type === 'MX';
                          const hostDisplay = !r.name || r.name.trim() === '' ? '@' : r.name;
                          return (
                            <div
                              key={recordKey}
                              className={`p-2.5 rounded-xl border text-[11px] font-mono flex items-center justify-between gap-2 ${
                                isMx
                                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-200 shadow-sm'
                                  : 'bg-black/50 border-emerald-500/20 text-white/90'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                                    isMx ? 'bg-amber-500 text-black font-extrabold' : 'bg-emerald-500/20 text-emerald-300'
                                  }`}>
                                    {r.type}
                                  </span>
                                  {isMx && (
                                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                                      ⭐ Receiving Endpoint
                                    </span>
                                  )}
                                  <span className="text-white/60">Host:</span>
                                  <span className="text-amber-300 font-bold">{hostDisplay}</span>
                                  {r.priority !== undefined && (
                                    <span className="text-white/50">Priority: <strong className="text-white">{r.priority}</strong></span>
                                  )}
                                  {r.status && (
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                                      r.status === 'verified'
                                        ? 'bg-emerald-500/20 text-emerald-300'
                                        : 'bg-amber-500/20 text-amber-300'
                                    }`}>
                                      {r.status.toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div className="text-emerald-300 truncate text-[10px]">
                                  Target: {r.value}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyDnsValue(recordKey, r.value)}
                                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] text-white cursor-pointer shrink-0 font-medium transition-colors"
                              >
                                {copiedRecordKey === recordKey ? 'Copied Value' : 'Copy Value'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </form>

            {/* List of Registered Domains */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center justify-between">
                <span>Configured Domains ({availableDomains.length})</span>
                <span className="text-[11px] text-white/40 normal-case font-sans">
                  Click a domain to make it active or view DNS
                </span>
              </h4>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {availableDomains.map((dom) => {
                  const isCurrent = dom.domain === inboxDomain;
                  const isExpanded = expandedDomainDns === dom.domain;
                  const isVerifying = verifyingDomain === dom.domain;
                  const mxRecord = dom.dnsRecords?.find((r) => r.type === 'MX');
                  const isMxMissing = !mxRecord || mxRecord.status === 'pending' || dom.status === 'pending' || dom.isReceivingReady === false;

                  return (
                    <div
                      key={dom.id}
                      className={`p-3.5 rounded-2xl border transition-all space-y-3 ${
                        isCurrent
                          ? 'border-amber-500 bg-amber-500/10 shadow-sm'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`size-8 rounded-xl grid place-items-center text-xs font-bold shrink-0 ${
                              isCurrent
                                ? 'bg-amber-500 text-black'
                                : 'bg-white/10 text-white/70'
                            }`}
                          >
                            <Globe className="size-4" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-xs text-white truncate">
                                @{dom.domain}
                              </span>
                              {dom.isDefault && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30">
                                  Default
                                </span>
                              )}
                              {isCurrent && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                                  Active Inbound
                                </span>
                              )}
                              {isMxMissing ? (
                                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30">
                                  ⚠️ MX Pending
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                                  ✓ Receiving Ready
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-white/40 font-mono block mt-0.5">
                              Status: {dom.status.toUpperCase()} • Key: {dom.hasCustomKey ? (dom.resendApiKeyMasked || 'Custom') : 'Global Default'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                          {/* Check / Verify with Resend */}
                          <button
                            type="button"
                            onClick={() => handleVerifyDomain(dom.domain)}
                            disabled={isVerifying}
                            className="h-8 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white/90 hover:text-white text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5"
                            title="Query Resend API to check live DNS verification"
                          >
                            <RefreshCw className={`size-3 ${isVerifying ? 'animate-spin text-amber-400' : ''}`} />
                            <span>{isVerifying ? 'Checking...' : 'Check DNS'}</span>
                          </button>

                          {/* Toggle DNS view */}
                          {dom.dnsRecords && dom.dnsRecords.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setExpandedDomainDns(isExpanded ? null : dom.domain)}
                              className="h-8 px-2.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 hover:text-white text-xs font-mono cursor-pointer transition-colors flex items-center gap-1"
                              title="View required DNS records for this domain"
                            >
                              <span>DNS ({dom.dnsRecords.length})</span>
                              {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                            </button>
                          )}

                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDomain(dom.domain);
                                handleCreateInbox(undefined, selectedTtl, dom.domain);
                                setIsDomainModalOpen(false);
                              }}
                              className="h-8 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold cursor-pointer transition-colors"
                            >
                              Switch to this
                            </button>
                          )}

                          {availableDomains.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteDomain(dom.domain)}
                              className="size-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 grid place-items-center cursor-pointer transition-colors"
                              title="Remove domain"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expandable DNS Records Details */}
                      {isExpanded && dom.dnsRecords && (
                        <div className="pt-3 border-t border-white/10 space-y-2">
                          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200/90 leading-relaxed font-mono">
                            <strong className="text-amber-300 block mb-0.5">⚡ Receiving Requirement:</strong>
                            To receive emails, you MUST configure the <strong className="text-white">MX record</strong> below in Spaceship / your DNS provider. Without this MX record, sender servers cannot route incoming emails to Resend.
                          </div>

                          <div className="space-y-1.5">
                            {dom.dnsRecords.map((r, idx) => {
                              const recordKey = `dom_${dom.id}_${r.type}_${r.name}_${idx}`;
                              const isMx = r.type === 'MX';
                              const hostDisplay = !r.name || r.name.trim() === '' ? '@' : r.name;

                              return (
                                <div
                                  key={recordKey}
                                  className={`p-2.5 rounded-xl border text-[11px] font-mono flex items-center justify-between gap-2 ${
                                    isMx
                                      ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                                      : 'bg-black/40 border-white/10 text-white/90'
                                  }`}
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                                        isMx ? 'bg-amber-500 text-black font-extrabold' : 'bg-white/10 text-white/80'
                                      }`}>
                                        {r.type}
                                      </span>
                                      {isMx && (
                                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                                          Receiving Mail Server
                                        </span>
                                      )}
                                      <span className="text-white/60">Host:</span>
                                      <span className="text-amber-300 font-bold">{hostDisplay}</span>
                                      {r.priority !== undefined && (
                                        <span className="text-white/50">Priority: <strong className="text-white">{r.priority}</strong></span>
                                      )}
                                      {r.status && (
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                                          r.status === 'verified'
                                            ? 'bg-emerald-500/20 text-emerald-300'
                                            : 'bg-amber-500/20 text-amber-300'
                                        }`}>
                                          {r.status.toUpperCase()}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-emerald-300 truncate text-[10px]">
                                      Target: {r.value}
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyDnsValue(recordKey, r.value)}
                                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] text-white cursor-pointer shrink-0 font-medium transition-colors"
                                  >
                                    {copiedRecordKey === recordKey ? 'Copied' : 'Copy'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-200/80 leading-relaxed font-mono">
              <strong className="text-amber-300 block mb-1">Spaceship DNS Instructions:</strong>
              1. Open Spaceship &gt; <strong>Domain List</strong> &gt; your domain &gt; <strong>Advanced DNS</strong>.
              <br />
              2. Add Record: <strong>Type: MX</strong>, <strong>Host: @</strong>, <strong>Mail Server: receive-apne1.forge.rmta.net</strong>, <strong>Priority: 10</strong>.
              <br />
              3. Once added, click <strong>&ldquo;Check DNS&rdquo;</strong> above to verify in real-time with Resend.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
