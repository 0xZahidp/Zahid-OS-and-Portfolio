'use client';

import React, { useState, useEffect } from 'react';
import {
  Database,
  Copy,
  ExternalLink,
  RefreshCw,
  Server,
  Shield,
  Layers,
  Check,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';

export const SupabaseTab: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [copiedGrant, setCopiedGrant] = useState(false);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<{
    configured: boolean;
    projectRef?: string;
    sqlEditorUrl?: string;
    restConnected: boolean;
    tablesInSchema?: boolean;
    tables: {
      portfolio_content: boolean;
      app_settings: boolean;
    };
    needsGrant?: boolean;
    isReady: boolean;
    grantSql?: string;
  } | null>(null);

  const fetchStatus = async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/supabase-status');
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error(e);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const grantSql = status?.grantSql || `-- 1. Grant table privileges to standard Supabase roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.portfolio_content TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.app_settings TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;`;

  const migrationSql = `-- 1. Create portfolio_content table
CREATE TABLE IF NOT EXISTS public.portfolio_content (
  id TEXT PRIMARY KEY DEFAULT 'current',
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.portfolio_content ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON public.portfolio_content
  FOR SELECT TO public USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access" ON public.portfolio_content
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 2. Create app_settings table
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  is_secret BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access to settings" ON public.app_settings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3. Automatic timestamp updater
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_portfolio_content_updated_at ON public.portfolio_content;
CREATE TRIGGER set_portfolio_content_updated_at
  BEFORE UPDATE ON public.portfolio_content
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. Grant table privileges to standard Supabase roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.portfolio_content TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.app_settings TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(migrationSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleCopyGrant = () => {
    navigator.clipboard.writeText(grantSql);
    setCopiedGrant(true);
    setTimeout(() => setCopiedGrant(false), 3000);
  };

  const sqlEditorUrl =
    status?.sqlEditorUrl ||
    'https://supabase.com/dashboard/project/txrnbazpdyoaazszkwwq/sql/new';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 1. Live Diagnostic Card */}
      <div className="card-raised rounded-2xl border border-line bg-surface p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-line">
          <div className="flex items-center gap-2.5">
            <Database className="size-4.5 text-brand-500" />
            <div>
              <h2 className="text-sm font-bold text-ink">Supabase Cloud Database Status</h2>
              <p className="text-[11px] text-ink-3">
                Real-time connection diagnostic to your configured Supabase project.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchStatus}
            disabled={checking}
            className="btn btn-secondary h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Checking...' : 'Refresh Status'}</span>
          </button>
        </div>

        {/* 3 Metric Pills */}
        <div className="grid gap-3.5 sm:grid-cols-3">
          {/* REST API Status */}
          <div className="p-4 rounded-xl border border-line bg-surface-2/60 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-ink-3">
              <span>REST API Connection</span>
              <Server className="size-3.5" />
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`size-2.5 rounded-full ${
                  status?.restConnected ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
              <span className="text-xs font-bold text-ink">
                {status?.restConnected ? 'Connected (200 OK)' : 'Offline / Unreachable'}
              </span>
            </div>
            <p className="text-[10px] text-ink-3 font-mono truncate">
              {status?.projectRef ? `Project: ${status.projectRef}` : 'Checking...'}
            </p>
          </div>

          {/* portfolio_content table */}
          <div className="p-4 rounded-xl border border-line bg-surface-2/60 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-ink-3">
              <span>portfolio_content Table</span>
              <Layers className="size-3.5" />
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`size-2.5 rounded-full ${
                  status?.tables.portfolio_content ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span className="text-xs font-bold text-ink">
                {status?.tables.portfolio_content ? 'Active & Ready' : 'Permission Required'}
              </span>
            </div>
            <p className="text-[10px] text-ink-3">
              {status?.tables.portfolio_content
                ? 'Synced with cloud storage'
                : status?.tablesInSchema
                ? 'Table exists, run grants below'
                : 'Run migration schema below'}
            </p>
          </div>

          {/* app_settings table */}
          <div className="p-4 rounded-xl border border-line bg-surface-2/60 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-ink-3">
              <span>app_settings Table</span>
              <Shield className="size-3.5" />
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`size-2.5 rounded-full ${
                  status?.tables.app_settings ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span className="text-xs font-bold text-ink">
                {status?.tables.app_settings ? 'Active & Ready' : 'Permission Required'}
              </span>
            </div>
            <p className="text-[10px] text-ink-3">
              {status?.tables.app_settings
                ? 'PAT & secrets protected'
                : status?.tablesInSchema
                ? 'Table exists, run grants below'
                : 'Run migration schema below'}
            </p>
          </div>
        </div>

        {/* Priority Callout if tables exist but need GRANT */}
        {status?.needsGrant && (
          <div className="p-4.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-3">
            <div className="flex items-start gap-3">
              <KeyRound className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-xs font-bold text-ink">Tables Detected in Database — 1 Click to Enable</h3>
                <p className="text-[11px] text-ink-2 mt-0.5 leading-relaxed">
                  Both <code>portfolio_content</code> and <code>app_settings</code> tables exist in your PostgreSQL database! To enable the API and service role to read/write, run this grant SQL in your Supabase SQL Editor.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleCopyGrant}
                className="btn btn-primary h-8.5 px-3.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
              >
                {copiedGrant ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                <span>{copiedGrant ? 'Copied Grant SQL!' : 'Copy Grant SQL'}</span>
              </button>

              <a
                href={sqlEditorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary h-8.5 px-3.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <span>Open Supabase SQL Editor</span>
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Success Banner if All Ready */}
        {status?.isReady && (
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-3">
            <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <h3 className="text-xs font-bold text-ink">Supabase Cloud Sync is 100% Active</h3>
              <p className="text-[11px] text-ink-2 mt-0.5">
                Every edit saved from the CMS Studio automatically uploads to Supabase and caches locally.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2. SQL Schema Migration Card */}
      <div className="card-raised rounded-2xl border border-line bg-surface p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div>
            <h3 className="text-xs font-bold text-ink">Complete Schema Migration</h3>
            <p className="text-[11px] text-ink-3">
              Full PostgreSQL migration script with tables, RLS policies, and triggers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySql}
              className="btn btn-secondary h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              <span>{copied ? 'Copied' : 'Copy All SQL'}</span>
            </button>
            <a
              href={sqlEditorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <span>SQL Editor</span>
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>

        <pre className="p-4 rounded-xl bg-surface-2 border border-line text-[11px] font-mono text-ink overflow-x-auto max-h-72 leading-relaxed">
          {migrationSql}
        </pre>
      </div>
    </div>
  );
};
