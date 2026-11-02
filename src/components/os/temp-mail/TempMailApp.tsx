'use client';

import React, { useState, useEffect } from 'react';
import {
  Mail,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Sparkles,
  Clock,
  Key,
  Inbox,
  Send,
  X,
} from 'lucide-react';

export type TempMailTTL = '10m' | '30m' | '1h' | '6h' | '24h';

export interface TempEmailMessage {
  id: string;
  fromName: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  snippet: string;
  body: string;
  otpCode?: string;
  receivedAt: string;
  isRead: boolean;
  tags?: string[];
}

const TTL_OPTIONS: { label: string; value: TempMailTTL; seconds: number; desc: string }[] = [
  { label: '10 Minutes', value: '10m', seconds: 600, desc: 'Quick single OTP verification token' },
  { label: '30 Minutes', value: '30m', seconds: 1800, desc: 'Short test run or password reset' },
  { label: '1 Hour', value: '1h', seconds: 3600, desc: 'Standard developer test session' },
  { label: '6 Hours', value: '6h', seconds: 21600, desc: 'Extended multi-stage verification flow' },
  { label: '24 Hours', value: '24h', seconds: 86400, desc: 'Maximum allowable inbox lifespan' },
];

export const TempMailApp: React.FC = () => {
  // Current ephemeral inbox
  const [inboxAddress, setInboxAddress] = useState<string>('zahid_test_7a4e@patwary.dev');
  const [selectedTtl, setSelectedTtl] = useState<TempMailTTL>('1h');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(3600);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState<string | null>(null);

  // Message list & reader
  const [messages, setMessages] = useState<TempEmailMessage[]>([
    {
      id: 'msg-seed-1',
      fromName: 'GitHub Security',
      fromEmail: 'noreply@github.com',
      toEmail: 'zahid_test_7a4e@patwary.dev',
      subject: 'Your GitHub one-time verification code',
      snippet: 'Please enter the code 839201 to complete your authentication process.',
      body: `Hello,\n\nWe received a sign-in attempt from a new session. Please use the following one-time verification code:\n\n    839201\n\nThis code will expire in 10 minutes. If this was not you, please secure your account immediately.\n\n— GitHub Security Team`,
      otpCode: '839201',
      receivedAt: 'Just now',
      isRead: false,
      tags: ['Security', 'OTP'],
    },
    {
      id: 'msg-seed-2',
      fromName: 'Supabase Platform',
      fromEmail: 'auth@supabase.co',
      toEmail: 'zahid_test_7a4e@patwary.dev',
      subject: 'Confirm your email address for FolioFrame dev project',
      snippet: 'Welcome to your new backend instance. Click the button inside to verify.',
      body: `Welcome to Supabase!\n\nTo verify your email address and activate your developer sandbox, enter the following confirmation token:\n\n    SUPA-9942\n\nOr click the verification link: https://supabase.com/auth/confirm?token=xyz123\n\nHappy building!`,
      otpCode: 'SUPA-9942',
      receivedAt: '3 mins ago',
      isRead: true,
      tags: ['Auth', 'Welcome'],
    },
  ]);
  const [selectedMessage, setSelectedMessage] = useState<TempEmailMessage | null>(null);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update timer when TTL selection changes
  const handleTtlChange = (newTtl: TempMailTTL) => {
    setSelectedTtl(newTtl);
    const match = TTL_OPTIONS.find((t) => t.value === newTtl);
    if (match) {
      setSecondsRemaining(match.seconds);
    }
  };

  // Generate new random inbox
  const handleGenerateNewInbox = () => {
    const randomHex = Math.random().toString(36).substring(2, 7);
    const newAddr = `dev_${randomHex}@patwary.dev`;
    setInboxAddress(newAddr);
    const match = TTL_OPTIONS.find((t) => t.value === selectedTtl);
    setSecondsRemaining(match ? match.seconds : 3600);
    setMessages([]);
    setSelectedMessage(null);
  };

  // Copy email address
  const handleCopyEmail = () => {
    navigator.clipboard.writeText(inboxAddress).then(() => {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    });
  };

  // Copy OTP code
  const handleCopyOtp = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedOtp(code);
      setTimeout(() => setCopiedOtp(null), 2000);
    });
  };

  // Simulate incoming test message
  const handleSimulateIncomingMail = (type: 'otp' | 'welcome' | 'alert') => {
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    let newMsg: TempEmailMessage;

    if (type === 'otp') {
      newMsg = {
        id: `sim_${Date.now()}`,
        fromName: 'Stripe Payments',
        fromEmail: 'verification@stripe.com',
        toEmail: inboxAddress,
        subject: `Your Stripe test verification code is ${randomOtp}`,
        snippet: `Use verification code ${randomOtp} to confirm your test integration.`,
        body: `Hello Developer,\n\nHere is your requested verification code for testing API keys and checkout workflows:\n\n    ${randomOtp}\n\nNever share this code with anyone.\n\n— Stripe Security`,
        otpCode: randomOtp,
        receivedAt: 'Just now',
        isRead: false,
        tags: ['Payment', 'OTP'],
      };
    } else if (type === 'welcome') {
      newMsg = {
        id: `sim_${Date.now()}`,
        fromName: 'Vercel Deployment',
        fromEmail: 'deployments@vercel.com',
        toEmail: inboxAddress,
        subject: 'Production promotion successful: folioframe-main',
        snippet: 'Deployment ready across 18 edge regions with 0 build warnings.',
        body: `Hi Zahid,\n\nYour deployment has been promoted to production:\n\n• Domain: folioframe.dev\n• Edge Regions: Global (18 POPs)\n• Build time: 14.2s\n\nView analytics and server logs in your Vercel Dashboard.`,
        receivedAt: 'Just now',
        isRead: false,
        tags: ['DevOps', 'Deploy'],
      };
    } else {
      newMsg = {
        id: `sim_${Date.now()}`,
        fromName: 'Cloudflare Zero Trust',
        fromEmail: 'security@cloudflare.com',
        toEmail: inboxAddress,
        subject: `Security Alert: New OAuth authorization code ${randomOtp}`,
        snippet: `A new client requested temporary access. Token: ${randomOtp}`,
        body: `Notice: A new application token was provisioned.\n\nAuthorization Code:\n    ${randomOtp}\n\nTimestamp: ${new Date().toUTCString()}`,
        otpCode: randomOtp,
        receivedAt: 'Just now',
        isRead: false,
        tags: ['Security', 'Alert'],
      };
    }

    setMessages((prev) => [newMsg, ...prev]);
  };

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h}h ${m.toString().padStart(2, '0')}m`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalTtlSeconds = TTL_OPTIONS.find((t) => t.value === selectedTtl)?.seconds || 3600;
  const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / totalTtlSeconds) * 100));

  return (
    <div className="space-y-6 text-white max-w-6xl mx-auto p-2 sm:p-5 select-none">
      {/* Top App Header */}
      <div className="p-5 sm:p-7 rounded-3xl border border-white/10 bg-gradient-to-r from-zinc-950 via-zinc-900 to-amber-950/40 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-[11px] font-mono text-amber-300">
              <Mail className="size-3.5 text-amber-400" />
              <span>Zahid OS • Ephemeral Disposable Inboxes</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Temp Mail Studio</span>
            </h2>

            <p className="text-xs text-white/60 leading-relaxed max-w-2xl">
              Owner-only disposable inbox router with configurable TTL and zero telemetry retention.
              Test OTP verifications, auth workflows, and webhooks safely.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-emerald-400 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Listening for Incoming Mail</span>
            </span>
          </div>
        </div>
      </div>

      {/* Ephemeral Address Card */}
      <div className="p-5 sm:p-6 rounded-3xl border border-white/10 bg-zinc-950/80 backdrop-blur-xl shadow-2xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Email Address Display */}
          <div className="space-y-1 min-w-0 flex-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-white/50 block">
              Active Ephemeral Inbox
            </span>
            <div className="flex items-center gap-3">
              <span className="text-lg sm:text-2xl font-mono font-black text-amber-300 tracking-tight truncate">
                {inboxAddress}
              </span>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="h-9 px-3.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                {copiedEmail ? (
                  <>
                    <Check className="size-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons: New Inbox & Destroy */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleGenerateNewInbox}
              className="h-10 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className="size-3.5" />
              <span>New Address</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMessages([]);
                setSelectedMessage(null);
              }}
              className="h-10 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <Trash2 className="size-3.5" />
              <span>Clear Inbox</span>
            </button>
          </div>
        </div>

        {/* TTL Bar with Live Expiration Clock */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/60 font-medium">Inbox TTL:</span>
            <div className="flex items-center gap-1">
              {TTL_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => handleTtlChange(t.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                    selectedTtl === t.value
                      ? 'bg-amber-500 text-black font-black shadow-sm shadow-amber-500/30'
                      : 'text-white/50 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {t.label.split(' ')[0]}
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

        {/* Quick Simulation Bar for Developer Testing */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-white/50">
            <Sparkles className="size-3.5 text-amber-400" />
            <span>Developer Sandbox Testing:</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleSimulateIncomingMail('otp')}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Key className="size-3.5" />
              <span>Simulate OTP Code</span>
            </button>

            <button
              type="button"
              onClick={() => handleSimulateIncomingMail('welcome')}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Send className="size-3.5" />
              <span>Simulate Webhook</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Mailbox Split View (Messages List + Message Detail) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Messages List (5 cols or 12 cols if no message selected) */}
        <div className={selectedMessage ? 'lg:col-span-5' : 'lg:col-span-12'}>
          <div className="rounded-3xl border border-white/10 bg-zinc-950/80 backdrop-blur-xl shadow-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Inbox className="size-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Received Messages</h3>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-[11px] font-mono text-white/70">
                  {messages.length}
                </span>
              </div>
            </div>

            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1 [scrollbar-width:thin]">
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
                              msg.isRead ? 'bg-transparent border border-white/20' : 'bg-amber-400 shadow-sm shadow-amber-400'
                            }`}
                          />
                          <span className="font-bold text-xs text-white truncate">{msg.fromName}</span>
                        </div>
                        <span className="text-[10px] text-white/40 font-mono shrink-0">{msg.receivedAt}</span>
                      </div>

                      <h4 className="text-xs font-semibold text-white/90 truncate">{msg.subject}</h4>
                      <p className="text-[11px] text-white/50 line-clamp-1 leading-snug">{msg.snippet}</p>

                      {msg.otpCode && (
                        <div className="flex items-center justify-between pt-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono font-bold text-[11px] border border-amber-500/30">
                            <Key className="size-2.5" />
                            <span>OTP: {msg.otpCode}</span>
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyOtp(msg.otpCode!);
                            }}
                            className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                          >
                            {copiedOtp === msg.otpCode ? '✓ Copied' : 'Copy Token'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center text-xs text-white/40 border border-dashed border-white/10 rounded-2xl space-y-2">
                  <Mail className="size-8 text-white/20 mx-auto" />
                  <p className="font-semibold text-white/70">Inbox is waiting for emails</p>
                  <p className="text-[11px]">Send a test email to the address above or click &ldquo;Simulate OTP Code&rdquo;</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Full Message Reader Drawer (7 cols) */}
        {selectedMessage && (
          <div className="lg:col-span-7 sticky top-6">
            <div className="rounded-3xl border border-white/10 bg-zinc-950/95 backdrop-blur-2xl shadow-2xl p-5 sm:p-6 space-y-4 max-h-[680px] overflow-y-auto [scrollbar-width:thin]">
              {/* Message Header */}
              <div className="flex items-start justify-between pb-3.5 border-b border-white/10 gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                    {selectedMessage.subject}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
                    <span className="font-semibold text-white/90">{selectedMessage.fromName}</span>
                    <span className="font-mono text-[11px] text-white/40">&lt;{selectedMessage.fromEmail}&gt;</span>
                    <span>•</span>
                    <span className="font-mono text-[11px] text-amber-400">{selectedMessage.receivedAt}</span>
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
                <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-amber-500/20 text-amber-300 grid place-items-center">
                      <Key className="size-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">
                        Extracted Verification Token
                      </span>
                      <span className="font-mono font-black text-xl text-white tracking-wider">
                        {selectedMessage.otpCode}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyOtp(selectedMessage.otpCode!)}
                    className="h-9 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    {copiedOtp === selectedMessage.otpCode ? (
                      <>
                        <Check className="size-3.5 text-black" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        <span>Copy Token</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Message Plain Text Body */}
              <div className="p-4 rounded-2xl bg-black/60 border border-white/10">
                <pre className="text-xs text-white/80 font-sans whitespace-pre-wrap leading-relaxed select-text">
                  {selectedMessage.body}
                </pre>
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
                  <span>Delete Message</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
