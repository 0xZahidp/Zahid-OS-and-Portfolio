'use client';

import React, { useRef, useState } from 'react';
import {
  Archive,
  Download,
  Upload,
  RotateCcw,
  FileCode,
  Database,
  Check,
  Copy,
  ExternalLink,
  Layers,
  Sparkles,
  Loader2,
  Table as TableIcon,
  User,
  Briefcase,
  Code,
  Languages,
  Share2,
  Users,
  Settings as SettingsIcon,
  FileText,
  Mail,
} from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';

interface TableMetaInfo {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  count: number;
}

export const BackupsTab: React.FC = () => {
  const { content, exportJson, importJson, resetToDefault } = usePortfolio();

  const zipInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const [activeImportTable, setActiveImportTable] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 6000);
  };

  const tablesMeta: TableMetaInfo[] = [
    {
      id: 'profiles',
      name: 'profiles',
      description: 'Personal identity, bio headline, avatar URL, availability & company roles',
      icon: User,
      count: 1,
    },
    {
      id: 'experiences',
      name: 'experiences',
      description: 'Career positions, company affiliations, date ranges, and achievement highlights',
      icon: Briefcase,
      count: content.experience?.length || 0,
    },
    {
      id: 'projects',
      name: 'projects',
      description: 'Featured products, SaaS tools, repositories, live URLs, badges & stars',
      icon: Code,
      count: content.projects?.length || 0,
    },
    {
      id: 'skills',
      name: 'skills',
      description: 'Categorized 3D tactile pills across AI, Frameworks, and Tools',
      icon: Layers,
      count: content.skills?.length || 0,
    },
    {
      id: 'languages',
      name: 'languages',
      description: 'Language proficiencies, accent ratings, notes, and pronunciation indicators',
      icon: Languages,
      count: content.languages?.length || 0,
    },
    {
      id: 'social_links',
      name: 'social_links',
      description: 'External handles and profile URLs for GitHub, LinkedIn, X, and platforms',
      icon: Share2,
      count: content.socialLinks?.length || 0,
    },
    {
      id: 'suggested_people',
      name: 'suggested_people',
      description: 'Right sidebar mentor and peer follow recommendations',
      icon: Users,
      count: content.suggestedPeople?.length || 0,
    },
    {
      id: 'site_settings',
      name: 'site_settings',
      description: 'Works configuration, based in clock settings, and GitHub synchronization keys',
      icon: SettingsIcon,
      count: 3,
    },
    {
      id: 'bio_paragraphs',
      name: 'bio_paragraphs',
      description: 'Multi-paragraph storytelling blocks rendered in the About section',
      icon: FileText,
      count: content.bioParagraphs?.length || 0,
    },
    {
      id: 'inbox_messages',
      name: 'inbox_messages',
      description: 'Incoming inquiry emails, client contact messages, and dispatch records',
      icon: Mail,
      count: 6,
    },
  ];

  // 1. Download Database ZIP (all tables as CSVs)
  const handleDownloadZip = () => {
    window.location.href = '/api/backup/zip';
    showStatus('success', '✓ Downloaded complete database archive (ZIP)');
  };

  // 2. Upload Database ZIP
  const handleUploadZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/backup/zip', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        showStatus('success', `✓ Database restored! ${data.message || 'All tables imported successfully.'}`);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showStatus('error', `✕ Restore failed: ${data.error || 'Invalid ZIP archive'}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      showStatus('error', `✕ Restore failed: ${msg}`);
    } finally {
      setIsProcessing(false);
      if (zipInputRef.current) zipInputRef.current.value = '';
    }
  };

  // 3. Export Single Table CSV
  const handleExportCsv = (tableName: string) => {
    window.location.href = `/api/backup/csv?table=${tableName}`;
    showStatus('success', `✓ Exported '${tableName}.csv'`);
  };

  // 4. Trigger Import Single Table CSV
  const handleTriggerImportCsv = (tableName: string) => {
    setActiveImportTable(tableName);
    csvInputRef.current?.click();
  };

  const handleUploadCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeImportTable) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/api/backup/csv?table=${activeImportTable}`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        showStatus('success', `✓ Table '${activeImportTable}' updated: ${data.message || 'Rows imported'}`);
        setTimeout(() => window.location.reload(), 1200);
      } else {
        showStatus('error', `✕ Import failed: ${data.error || 'Invalid CSV format'}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Import failed';
      showStatus('error', `✕ Import failed: ${msg}`);
    } finally {
      setIsProcessing(false);
      setActiveImportTable(null);
      if (csvInputRef.current) csvInputRef.current.value = '';
    }
  };

  // 5. JSON Snapshot handlers
  const handleFileChangeJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const success = importJson(text);
      if (success) {
        showStatus('success', '✓ Backup snapshot restored successfully!');
      } else {
        showStatus('error', '✕ Invalid JSON file format. Restore failed.');
      }
    };
    reader.readAsText(file);
    if (jsonInputRef.current) jsonInputRef.current.value = '';
  };

  const handleReset = () => {
    if (
      window.confirm(
        'Are you sure you want to reset all data to the default template? Any unsaved edits will be discarded.'
      )
    ) {
      resetToDefault();
      showStatus('success', '✓ Reset all sections to default template.');
    }
  };

  const copySqlToClipboard = async () => {
    try {
      const res = await fetch('/api/supabase/schema-sql');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 3000);
      showStatus('success', '✓ Relational Schema SQL copied to clipboard!');
    } catch {
      // Fallback
      await navigator.clipboard.writeText(`GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;\nGRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;\nALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;`);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Hidden File Inputs */}
      <input
        ref={zipInputRef}
        type="file"
        accept=".zip"
        onChange={handleUploadZip}
        className="hidden"
      />
      <input
        ref={jsonInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChangeJson}
        className="hidden"
      />
      <input
        ref={csvInputRef}
        type="file"
        accept=".csv"
        onChange={handleUploadCsv}
        className="hidden"
      />

      {/* Main Container Card */}
      <div className="card-raised rounded-2xl border border-line bg-surface p-4 sm:p-6 shadow-xs space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line">
          <div className="flex items-center gap-2.5">
            <Archive className="size-5 text-brand-500" />
            <div>
              <h2 className="text-sm font-bold text-ink">Section Relational Backups & Data Portability</h2>
              <p className="text-[11px] text-ink-3">
                Export and restore section-wise tables via ZIP archives or individual CSV spreadsheets.
              </p>
            </div>
          </div>

          <a
            href="https://supabase.com/dashboard/project/txrnbazpdyoaazszkwwq/sql/new"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>Supabase SQL Editor</span>
            <ExternalLink className="size-3 text-ink-3" />
          </a>
        </div>

        {/* Status Toast / Banner */}
        {statusMessage && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
              statusMessage.type === 'success'
                ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-[10px] opacity-75 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* 1. Complete Database ZIP Backup & Restore */}
        <div className="p-4 sm:p-5 rounded-2xl border border-brand-500/20 bg-brand-500/5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-xs sm:text-sm font-bold text-ink flex items-center gap-2">
                <Database className="size-4.5 text-brand-500" />
                <span>Full Database ZIP Archive (All Tables)</span>
              </h3>
              <p className="text-[11px] text-ink-3 leading-relaxed max-w-xl">
                Packages all 10 individual section tables into formatted <code>.csv</code> spreadsheets enclosed inside a single portable <code>.zip</code> file with metadata manifest.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDownloadZip}
                className="btn btn-primary h-9 px-4 rounded-xl text-xs font-semibold inline-flex items-center gap-2 shadow-xs"
              >
                <Download className="size-3.5" />
                <span>Download All (.zip)</span>
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => zipInputRef.current?.click()}
                className="btn btn-secondary h-9 px-4 rounded-xl text-xs font-semibold inline-flex items-center gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Upload className="size-3.5" />
                )}
                <span>Restore (.zip)</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Section Tables Grid (Individual CSV Import / Export) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TableIcon className="size-4 text-ink-3" />
              <h3 className="text-xs font-bold text-ink">Individual Section Tables (CSV Spreadsheets)</h3>
            </div>
            <span className="text-[10px] text-ink-3">10 Registered Tables</span>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {tablesMeta.map((t) => {
              const IconComponent = t.icon;
              return (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl border border-line bg-surface-2/40 hover:bg-surface-2/70 transition-colors flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-8 rounded-lg bg-surface border border-line flex items-center justify-center shrink-0">
                        <IconComponent className="size-4 text-brand-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-ink font-mono">{t.name}</span>
                          <span className="text-[10px] font-semibold text-ink-3 px-1.5 py-0.2 rounded bg-surface border border-line">
                            {t.count} rows
                          </span>
                        </div>
                        <p className="text-[10px] text-ink-3 line-clamp-1 mt-0.5">{t.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-line/50">
                    <button
                      type="button"
                      onClick={() => handleExportCsv(t.id)}
                      className="btn btn-secondary h-7 px-2.5 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1"
                      title={`Export ${t.name}.csv`}
                    >
                      <Download className="size-3 text-ink-3" />
                      <span>Export CSV</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTriggerImportCsv(t.id)}
                      className="btn btn-secondary h-7 px-2.5 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1"
                      title={`Upload CSV into ${t.name}`}
                    >
                      <Upload className="size-3 text-ink-3" />
                      <span>Import CSV</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Relational Schema Setup / SQL Migration */}
        <div className="p-4 sm:p-5 rounded-2xl border border-line bg-surface-2/60 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-emerald-500" />
              <div>
                <h3 className="text-xs font-bold text-ink">Supabase Relational Tables Migration</h3>
                <p className="text-[11px] text-ink-3">
                  Creates all 10 normalized tables, seeds initial data, and grants read/write permissions.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={copySqlToClipboard}
                className="btn btn-secondary h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
              >
                {copiedSql ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                <span>{copiedSql ? 'Copied SQL!' : 'Copy Schema SQL'}</span>
              </button>

              <a
                href="https://supabase.com/dashboard/project/txrnbazpdyoaazszkwwq/sql/new"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <span>Run in Supabase</span>
                <ExternalLink className="size-3" />
              </a>
            </div>
          </div>

          <pre className="p-3 rounded-xl bg-surface border border-line font-mono text-[10px] text-ink-3 overflow-x-auto leading-relaxed max-h-32 [scrollbar-width:thin]">
            {`-- 1. Create all 10 section tables (profiles, experiences, projects, skills, etc.)
-- 2. Grant permissions to standard Supabase roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;`}
          </pre>
        </div>

        {/* 4. Single-file JSON Snapshot & Reset */}
        <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-line">
          {/* JSON Export */}
          <div className="p-4 rounded-xl border border-line bg-surface-2/40 space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-ink flex items-center gap-2">
                <FileCode className="size-3.5 text-brand-500" />
                <span>Export JSON Snapshot</span>
              </h4>
              <p className="text-[10px] text-ink-3">
                Downloads a single <code>.json</code> document containing your complete portfolio state.
              </p>
            </div>
            <button
              type="button"
              onClick={exportJson}
              className="btn btn-secondary h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 w-full"
            >
              <Download className="size-3.5" />
              <span>Download .json</span>
            </button>
          </div>

          {/* JSON Import */}
          <div className="p-4 rounded-xl border border-line bg-surface-2/40 space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-ink flex items-center gap-2">
                <Upload className="size-3.5 text-brand-500" />
                <span>Restore JSON Snapshot</span>
              </h4>
              <p className="text-[10px] text-ink-3">
                Upload a previously saved <code>.json</code> snapshot to restore all sections.
              </p>
            </div>
            <button
              type="button"
              onClick={() => jsonInputRef.current?.click()}
              className="btn btn-secondary h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 w-full"
            >
              <Upload className="size-3.5" />
              <span>Upload .json</span>
            </button>
          </div>

          {/* Factory Reset */}
          <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 sm:col-span-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <RotateCcw className="size-3.5" />
                <span>Reset to Factory Defaults</span>
              </h4>
              <p className="text-[10px] text-ink-3">
                Clears unsaved customizations and resets local data to template defaults.
              </p>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="btn btn-secondary h-7.5 px-3 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border-rose-500/30 shrink-0"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
