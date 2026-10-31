'use client';

import React from 'react';
import {
  Save,
  RotateCcw,
  SplitSquareVertical,
  Download,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { AdminTab } from './AdminSidebar';

interface AdminHeaderProps {
  activeTab: AdminTab;
  tabTitle: string;
  tabDescription: string;
  isDirty: boolean;
  isSaving: boolean;
  showPreview: boolean;
  onTogglePreview: () => void;
  onSave: () => void;
  onReset: () => void;
  onExport: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTab,
  tabTitle,
  tabDescription,
  isDirty,
  isSaving,
  showPreview,
  onTogglePreview,
  onSave,
  onReset,
  onExport,
}) => {
  return (
    <header className="sticky top-0 z-20 h-16 border-b border-line bg-surface/90 backdrop-blur-md px-6 flex items-center justify-between gap-4">
      {/* Left: Tab Title & Breadcrumbs */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[11px] text-ink-3">
          <span>FolioFrame Studio</span>
          <span>/</span>
          <span className="capitalize text-ink-2 font-medium">{activeTab}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-base font-bold text-ink truncate tracking-tight">
            {tabTitle}
          </h1>
          <span className="hidden xl:inline text-xs text-ink-3">· {tabDescription}</span>
          {isDirty && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
              Unsaved
            </span>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Toggle Split Live Preview */}
        <button
          type="button"
          onClick={onTogglePreview}
          className={`btn h-8.5 px-3 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
            showPreview
              ? 'bg-brand-500/15 text-brand-600 dark:text-brand-400 border border-brand-500/30'
              : 'btn-secondary text-ink-2 hover:text-ink'
          }`}
          title="Toggle side-by-side interactive live preview"
        >
          <SplitSquareVertical className="size-4" />
          <span className="hidden sm:inline">
            {showPreview ? 'Hide Preview' : 'Live Preview'}
          </span>
        </button>

        {/* Quick JSON Backup */}
        <button
          type="button"
          onClick={onExport}
          className="btn btn-secondary h-8.5 px-2.5 rounded-xl text-xs text-ink-2 hover:text-ink hidden md:inline-flex items-center gap-1.5"
          title="Download snapshot JSON"
        >
          <Download className="size-3.5" />
          <span>Backup</span>
        </button>

        {/* Theme Toggle */}
        <ThemeToggle className="btn btn-secondary size-8.5 grid place-items-center rounded-xl" />

        {/* Reset Button */}
        <button
          type="button"
          onClick={onReset}
          className="btn btn-secondary size-8.5 grid place-items-center rounded-xl text-ink-3 hover:text-rose-500 hover:border-rose-300 dark:hover:border-rose-900 transition-colors"
          title="Reset to default template"
        >
          <RotateCcw className="size-3.5" />
        </button>

        {/* Primary Save Changes Button */}
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className={`btn btn-primary h-8.5 px-4 text-xs font-semibold flex items-center gap-2 rounded-xl shadow-xs transition-all ${
            isDirty ? 'ring-2 ring-emerald-500/30' : ''
          }`}
          title="Save changes (Ctrl+S / ⌘S)"
        >
          <Save className="size-3.5" />
          <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>
    </header>
  );
};
