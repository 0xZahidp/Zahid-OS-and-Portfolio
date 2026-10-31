'use client';

import React, { useRef, useState } from 'react';
import { Archive, Download, Upload, RotateCcw, FileCode } from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';

export const BackupsTab: React.FC = () => {
  const { content, exportJson, importJson, resetToDefault } = usePortfolio();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleExport = () => {
    exportJson();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const success = importJson(text);
      if (success) {
        setImportStatus('✓ Backup snapshot restored successfully!');
      } else {
        setImportStatus('✕ Invalid JSON file format. Restore failed.');
      }
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (
      window.confirm(
        'Are you sure you want to reset all data to the default template? Any unsaved edits will be discarded.'
      )
    ) {
      resetToDefault();
      setImportStatus('✓ Reset all sections to default template.');
      setTimeout(() => setImportStatus(null), 4000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="card-raised rounded-2xl border border-line bg-surface p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-line">
          <Archive className="size-4.5 text-brand-500" />
          <div>
            <h2 className="text-sm font-bold text-ink">Backups, Snapshots & Data Portability</h2>
            <p className="text-[11px] text-ink-3">
              Export your portfolio state as JSON, restore previous versions, or reset to template defaults.
            </p>
          </div>
        </div>

        {importStatus && (
          <div className="p-3.5 rounded-xl border border-brand-500/20 bg-brand-500/10 text-xs font-semibold text-brand-600 dark:text-brand-400">
            {importStatus}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Download Snapshot */}
          <div className="p-5 rounded-xl border border-line bg-surface-2/60 space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-ink flex items-center gap-2">
                <Download className="size-4 text-brand-500" />
                <span>Export JSON Snapshot</span>
              </h3>
              <p className="text-[11px] text-ink-3 leading-relaxed">
                Downloads a clean, portable <code>.json</code> file containing your complete portfolio content, settings, and profile.
              </p>
            </div>

            <button
              type="button"
              onClick={handleExport}
              className="btn btn-secondary h-9 px-4 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-2 w-full"
            >
              <Download className="size-3.5" />
              <span>Download Backup (.json)</span>
            </button>
          </div>

          {/* Restore Snapshot */}
          <div className="p-5 rounded-xl border border-line bg-surface-2/60 space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-ink flex items-center gap-2">
                <Upload className="size-4 text-brand-500" />
                <span>Restore JSON Snapshot</span>
              </h3>
              <p className="text-[11px] text-ink-3 leading-relaxed">
                Upload a previously downloaded portfolio snapshot to instantly restore all sections and content.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary h-9 px-4 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-2 w-full"
            >
              <Upload className="size-3.5" />
              <span>Upload Backup File</span>
            </button>
          </div>

          {/* Reset to Default */}
          <div className="p-5 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-3 sm:col-span-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <RotateCcw className="size-4" />
                <span>Reset to Factory Defaults</span>
              </h3>
              <p className="text-[11px] text-ink-3 leading-relaxed">
                Clears all customizations and restores the default profile data for <strong>Md Zahid Hasan Patwary</strong>.
              </p>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="btn btn-secondary h-8.5 px-4 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border-rose-500/30 shrink-0"
            >
              Reset to Defaults
            </button>
          </div>
        </div>

        {/* Live Data Preview */}
        <div className="space-y-2 pt-2 border-t border-line">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-ink-3 flex items-center gap-1.5">
              <FileCode className="size-3.5" />
              <span>Current In-Memory JSON Schema</span>
            </label>
            <span className="text-[10px] text-ink-3">
              Last Updated: {content.updatedAt ? new Date(content.updatedAt).toLocaleTimeString() : 'Initial'}
            </span>
          </div>
          <pre className="rounded-xl border border-line bg-surface-2 p-4 text-[10px] font-mono text-ink-3 max-h-48 overflow-y-auto leading-relaxed [scrollbar-width:thin]">
            {JSON.stringify(content, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};
