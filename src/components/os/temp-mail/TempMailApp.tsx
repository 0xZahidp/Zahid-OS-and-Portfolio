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
} from 'lucide-react';

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

  // Audio notification reference
  const lastMsgCountRef = useRef<number>(0);

  // Play audio chime when a new real email arrives
  const playChime = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
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

  // Fetch live messages for active inbox
  const fetchMessages = useCallback(
    async (address: string, token: string, silent = false) => {
      if (!address) return;
      if (!silent) setIsRefreshing(true);
      try {
        const res = await fetch(
          `/api/os/temp-mail?inbox=${encodeURIComponent(address)}&token=${encodeURIComponent(token)}`
        );
        const data = await res.json();

        if (res.ok && data.success) {
          if (data.domain) setInboxDomain(data.domain);

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
          // Inbox expired on server, clear cache
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
  const handleCreateInbox = async (customSlug?: string, ttlOpt: TempMailTTL = selectedTtl) => {
    setIsCreating(true);
    setErrorMessage(null);
    try {
      const matchTtl = TTL_OPTIONS.find((t) => t.value === ttlOpt);
      const ttlSec = matchTtl ? matchTtl.seconds : 3600;

      const res = await fetch('/api/os/temp-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: customSlug || undefined,
          ttlSeconds: ttlSec,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to create temp mail');
        return;
      }

      const newInbox = data.inbox;
      setInboxAddress(newInbox.address);
      setInboxToken(newInbox.token);
      setInboxDomain(newInbox.domain);
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

  // Restore cached inbox on mount or create fresh one
  useEffect(() => {
    async function initInbox() {
      setIsLoading(true);
      try {
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              const expTime = new Date(parsed.expiresAt).getTime();
              const now = Date.now();

              // If still valid (at least 30s left), restore it
              if (expTime - now > 30000) {
                setInboxAddress(parsed.address);
                setInboxToken(parsed.token);
                setInboxDomain(parsed.domain || '');
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

        // Otherwise generate brand new inbox
        await handleCreateInbox(undefined, '1h');
      } finally {
        setIsLoading(false);
      }
    }

    initInbox();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Live polling every 6 seconds
  useEffect(() => {
    if (!inboxAddress || !inboxToken) return;

    const interval = setInterval(() => {
      fetchMessages(inboxAddress, inboxToken, true);
    }, 6000);

    return () => clearInterval(interval);
  }, [inboxAddress, inboxToken, fetchMessages]);

  // Live second-by-second countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Expired
          return 0;
        }
        return prev - 1;
      });
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

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Disposable Mailbox</span>
              {inboxDomain && (
                <span className="text-xs font-mono font-medium text-amber-300/80 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                  @{inboxDomain}
                </span>
              )}
            </h2>

            <p className="text-xs text-white/60 leading-relaxed max-w-2xl">
              Live inbound email router powered by Resend Webhooks. Receive OTP codes, test signups,
              and auth verification emails with anti-flooding rate limits and automatic expiration.
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
              onClick={() => fetchMessages(inboxAddress, inboxToken)}
              disabled={isRefreshing}
              className="size-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white grid place-items-center cursor-pointer transition-colors"
              title="Poll for new emails now"
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
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-white/50 block">
                Active Temporary Address
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Persistent on Refresh
              </span>
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
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowCustomModal(true)}
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
            <span>Anti-Flood Active: Max 15 messages/inbox • Floods dropped automatically</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Capacity:</span>
            <span className="text-amber-300 font-bold">{messages.length} / 15 emails</span>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {errorMessage}
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
              Enter your desired username slug. It will be created under your active domain{' '}
              <strong className="text-amber-300">@{inboxDomain || 'zahidp.com'}</strong>.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/70 block">Username Slug</label>
              <div className="flex items-center rounded-xl border border-white/10 bg-white/5 px-3 h-10 focus-within:border-amber-400">
                <input
                  type="text"
                  value={customUsername}
                  onChange={(e) => setCustomUsername(e.target.value.toLowerCase())}
                  placeholder="e.g. github-test, dev-stripe, mytoken"
                  className="bg-transparent flex-1 text-xs text-white outline-hidden font-mono"
                />
                <span className="text-xs font-mono text-white/40">@{inboxDomain || 'zahidp.com'}</span>
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
                onClick={() => handleCreateInbox(customUsername)}
                disabled={!customUsername.trim() || isCreating}
                className="h-9 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold text-xs cursor-pointer transition-colors"
              >
                {isCreating ? 'Provisioning...' : 'Create Inbox'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
