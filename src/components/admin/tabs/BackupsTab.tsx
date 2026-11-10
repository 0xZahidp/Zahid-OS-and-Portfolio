'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Archive,
  Download,
  Upload,
  RotateCcw,
  FileCode,
  Database,
  ExternalLink,
  Layers,
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
  MapPin,
  Key,
  Terminal,
  Link2,
  Inbox,
  Sparkles,
  Eye,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';
import { useAdminAuth } from '@/context/AdminAuthContext';

interface TableMetaInfo {
  id: string;
  name: string;
  category: 'Portfolio' | 'Settings' | 'Mail' | 'Zahid OS' | string;
  description: string;
  count: number;
  isEmpty?: boolean;
  hasSample?: boolean;
  columns?: Array<{ name: string; type: string; nullable: boolean; sample: unknown }>;
  sampleRow?: Record<string, unknown> | null;
  icon?: React.ElementType;
}

export const BackupsTab: React.FC = () => {
  const { exportJson, importJson, resetToDefault } = usePortfolio();
  const { session } = useAdminAuth();

  const zipInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const [activeImportTable, setActiveImportTable] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [inspectTable, setInspectTable] = useState<TableMetaInfo | null>(null);
  const [tablesList, setTablesList] = useState<TableMetaInfo[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState<boolean>(true);

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 6000);
  };

  const getAdminHeaders = useCallback((): HeadersInit => ({
    'Content-Type': 'application/json',
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  }), [session?.access_token]);

  // Load tables metadata & live row counts
  const loadTables = useCallback(async () => {
    try {
      setIsLoadingTables(true);
      const res = await fetch('/api/backup/tables', { headers: getAdminHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.tables)) {
          setTablesList(data.tables);
        }
      }
    } catch (err) {
      console.warn('Failed to load backup tables list:', err);
    } finally {
      setIsLoadingTables(false);
    }
  }, [getAdminHeaders]);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  const getTableIcon = (name: string): React.ElementType => {
    switch (name) {
      case 'profiles':
        return User;
      case 'experiences':
        return Briefcase;
      case 'projects':
        return Code;
      case 'skills':
        return Layers;
      case 'languages':
        return Languages;
      case 'social_links':
        return Share2;
      case 'suggested_people':
        return Users;
      case 'bio_paragraphs':
      case 'portfolio_content':
      case 'os_notes':
        return FileText;
      case 'site_settings':
      case 'os_settings':
        return SettingsIcon;
      case 'app_settings':
        return Key;
      case 'inbox_messages':
      case 'inbox_deleted_resend_ids':
      case 'os_mail_domains':
        return Mail;
      case 'os_short_links':
        return Link2;
      case 'os_snippets':
      case 'os_api_saved_requests':
        return Terminal;
      case 'os_temp_inboxes':
      case 'os_temp_messages':
        return Inbox;
      case 'os_travel_districts':
      case 'os_travel_memories':
        return MapPin;
      default:
        return TableIcon;
    }
  };

  // 1. Download Database ZIP (all tables as CSVs + manifest)
  const handleDownloadZip = () => {
    window.location.href = '/api/backup/zip';
    showStatus('success', '✓ Downloaded complete database archive (ZIP) with 23 tables.');
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
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        showStatus('success', `✓ Database restored! ${data.message || 'All tables imported successfully.'}`);
        loadTables();
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
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        showStatus('success', `✓ Table '${activeImportTable}' updated: ${data.message || 'Rows imported'}`);
        loadTables();
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

  const filteredTables = tablesList.filter((t) => {
    if (activeCategory === 'all') return true;
    return t.category.toLowerCase().includes(activeCategory.toLowerCase());
  });

  const categories = [
    { id: 'all', label: 'All Tables', count: tablesList.length },
    { id: 'portfolio', label: 'Portfolio', count: tablesList.filter((t) => t.category === 'Portfolio').length },
    { id: 'zahid os', label: 'Zahid OS', count: tablesList.filter((t) => t.category === 'Zahid OS').length },
    { id: 'mail', label: 'Mail & Inboxes', count: tablesList.filter((t) => t.category === 'Mail').length },
    { id: 'settings', label: 'Settings', count: tablesList.filter((t) => t.category === 'Settings').length },
  ];

  return (
    <div className="space-y-6 max-w-5xl select-none">
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
              <h2 className="text-sm font-bold text-ink">Database Backups, Schema Snapshots & Data Portability</h2>
              <p className="text-[11px] text-ink-3">
                Export and restore 23 normalized tables. Empty tables automatically include typed sample rows illustrating schema row types.
              </p>
            </div>
          </div>

          <a
            href="https://supabase.com/dashboard/project/txrnbazpdyoaazszkwwq/sql/new"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>Supabase Dashboard</span>
            <ExternalLink className="size-3 text-ink-3" />
          </a>
        </div>

        {/* Status Toast / Banner */}
        {statusMessage && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between animate-in fade-in ${
              statusMessage.type === 'success'
                ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-[10px] opacity-75 hover:opacity-100 cursor-pointer"
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
                <span>Full Database ZIP Archive (All 23 Tables)</span>
              </h3>
              <p className="text-[11px] text-ink-3 leading-relaxed max-w-xl">
                Packages all 23 database tables into RFC-4180 CSV spreadsheets enclosed in a single <code>.zip</code> file with metadata manifest. Empty tables include typed sample row schema templates.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDownloadZip}
                className="btn btn-primary h-9 px-4 rounded-xl text-xs font-semibold inline-flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Download className="size-3.5" />
                <span>Download All (.zip)</span>
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => zipInputRef.current?.click()}
                className="btn btn-secondary h-9 px-4 rounded-xl text-xs font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
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

        {/* 2. Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-line pb-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`h-7 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-brand-500 text-white shadow-xs'
                  : 'bg-surface-2 text-ink-3 hover:text-ink hover:bg-surface-3'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                  activeCategory === cat.id ? 'bg-white/20 text-white' : 'bg-surface text-ink-4'
                }`}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* 3. Section Tables Grid (Individual CSV Import / Export) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TableIcon className="size-4 text-ink-3" />
              <h3 className="text-xs font-bold text-ink">
                Database Tables ({filteredTables.length} of {tablesList.length})
              </h3>
            </div>
            {isLoadingTables && (
              <span className="text-[11px] text-ink-3 flex items-center gap-1">
                <Loader2 className="size-3 animate-spin" />
                <span>Checking live counts…</span>
              </span>
            )}
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {filteredTables.map((t) => {
              const IconComponent = getTableIcon(t.name);
              const isEmpty = t.count === 0;

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
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-ink font-mono">{t.name}</span>
                          {isEmpty ? (
                            <span className="text-[9px] font-semibold text-amber-500 dark:text-amber-400 px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20">
                              Empty • Sample Row Typed
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20 font-mono">
                              {t.count} rows
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-ink-3 line-clamp-1 mt-0.5">{t.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-line/50">
                    <button
                      type="button"
                      onClick={() => setInspectTable(t)}
                      className="text-[11px] font-semibold text-ink-3 hover:text-brand-500 flex items-center gap-1 cursor-pointer"
                      title="Inspect Schema & Sample Data"
                    >
                      <Eye className="size-3" />
                      <span>Schema & Types</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleExportCsv(t.id)}
                        className="btn btn-secondary h-7 px-2.5 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                        title={
                          isEmpty
                            ? `Export ${t.name}.csv with typed sample row`
                            : `Export ${t.name}.csv (${t.count} rows)`
                        }
                      >
                        <Download className="size-3 text-ink-3" />
                        <span>Export CSV</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTriggerImportCsv(t.id)}
                        className="btn btn-secondary h-7 px-2.5 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                        title={`Upload CSV into ${t.name}`}
                      >
                        <Upload className="size-3 text-ink-3" />
                        <span>Import CSV</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal: Inspect Schema & Sample Row */}
        {inspectTable && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-surface border border-line rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
              <div className="px-5 py-4 border-b border-line flex items-center justify-between bg-surface-2/50 shrink-0">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="size-4.5 text-brand-500" />
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-ink font-mono">
                      {inspectTable.name}
                    </h3>
                    <p className="text-[11px] text-ink-3">
                      {inspectTable.description} • {inspectTable.count} actual rows
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectTable(null)}
                  className="size-7 rounded-lg border border-line bg-surface hover:bg-surface-3 flex items-center justify-center text-ink-3 hover:text-ink cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 text-xs font-sans [scrollbar-width:thin]">
                {inspectTable.count === 0 && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center gap-2 text-xs">
                    <Sparkles className="size-4 shrink-0" />
                    <span>
                      This table is currently empty in the database. When exported to CSV or ZIP, the backup engine supplies the typed sample row below with proper column headers and row types.
                    </span>
                  </div>
                )}

                <div>
                  <h4 className="font-bold text-ink mb-1.5 text-xs">PostgreSQL Schema Columns & Types</h4>
                  <div className="border border-line rounded-xl overflow-hidden">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-surface-2 border-b border-line font-mono text-[10px] text-ink-3">
                        <tr>
                          <th className="p-2">Column Name</th>
                          <th className="p-2">Data Type</th>
                          <th className="p-2">Nullable</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line font-mono">
                        {(inspectTable.columns || []).map((col) => (
                          <tr key={col.name} className="hover:bg-surface-2/30">
                            <td className="p-2 font-semibold text-ink">{col.name}</td>
                            <td className="p-2 text-brand-500">{col.type}</td>
                            <td className="p-2 text-ink-4">{col.nullable ? 'YES' : 'NO'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-ink mb-1.5 text-xs">Typed Sample Row Data</h4>
                  <pre className="p-3.5 rounded-xl bg-surface-2 border border-line font-mono text-[11px] text-ink-2 overflow-x-auto leading-relaxed max-h-56">
                    {JSON.stringify(inspectTable.sampleRow, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-line bg-surface-2/50 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => handleExportCsv(inspectTable.id)}
                  className="btn btn-primary h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="size-3.5" />
                  <span>Download Table CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectTable(null)}
                  className="btn btn-secondary h-8 px-3 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

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
              className="btn btn-secondary h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 w-full cursor-pointer"
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
              className="btn btn-secondary h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 w-full cursor-pointer"
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
              className="btn btn-secondary h-7.5 px-3 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border-rose-500/30 shrink-0 cursor-pointer"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
