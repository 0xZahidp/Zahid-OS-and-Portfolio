'use client';

import React from 'react';
import {
  Save,
  RotateCcw,
  SplitSquareVertical,
  Download,
  LogOut,
  Menu,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SoundToggle } from '@/components/ui/SoundToggle';
import { useAdminAuth } from '@/context/AdminAuthContext';
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
  onToggleMobileMenu?: () => void;
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
  onToggleMobileMenu,
}) => {
  const { signOut } = useAdminAuth();

  return (
    <header className="sticky top-0 z-20 h-14 sm:h-16 border-b border-line bg-surface/90 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between gap-2.5 sm:gap-4 select-none">
      {/* Left: Mobile Hamburger Toggle + Tab Title & Breadcrumbs */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Menu Button (< 1024px) */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 -ml-1 text-ink-3 hover:text-ink hover:bg-surface-2 rounded-xl transition-colors shrink-0 cursor-pointer"
          aria-label="Open navigation menu"
          title="Open CMS navigation"
        >
          <Menu className="size-5" />
        </button>

        <div className="min-w-0">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-ink-3 leading-none mb-1">
            <span>FolioFrame Studio</span>
            <span>/</span>
            <span className="capitalize text-ink-2 font-medium">{activeTab}</span>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-xs sm:text-base font-bold text-ink truncate tracking-tight">
              {tabTitle}
            </h1>
            <span className="hidden xl:inline text-xs text-ink-3 truncate">· {tabDescription}</span>
            {isDirty && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 shrink-0">
                <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="hidden sm:inline">Unsaved</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Toggle Split / Fullscreen Live Preview */}
        <button
          type="button"
          onClick={onTogglePreview}
          className={`btn h-8 sm:h-8.5 px-2.5 sm:px-3 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
            showPreview
              ? 'bg-brand-500/15 text-brand-600 dark:text-brand-400 border border-brand-500/30 font-semibold'
              : 'btn-secondary text-ink-2 hover:text-ink'
          }`}
          title="Toggle interactive live preview"
        >
          <SplitSquareVertical className="size-3.5 sm:size-4" />
          <span className="hidden md:inline">
            {showPreview ? 'Hide Preview' : 'Live Preview'}
          </span>
        </button>

        {/* Quick JSON Backup (Desktop only) */}
        <button
          type="button"
          onClick={onExport}
          className="btn btn-secondary h-8.5 px-2.5 rounded-xl text-xs text-ink-2 hover:text-ink hidden lg:inline-flex items-center gap-1.5 cursor-pointer"
          title="Download snapshot JSON"
        >
          <Download className="size-3.5" />
          <span>Backup</span>
        </button>

        {/* Sound Toggle */}
        <SoundToggle className="btn btn-secondary size-8 sm:size-8.5 grid place-items-center rounded-xl cursor-pointer" />

        {/* Theme Toggle */}
        <ThemeToggle className="btn btn-secondary size-8 sm:size-8.5 grid place-items-center rounded-xl cursor-pointer" />

        {/* Reset Button (Hidden on small screens) */}
        <button
          type="button"
          onClick={onReset}
          className="btn btn-secondary size-8 sm:size-8.5 hidden md:grid place-items-center rounded-xl text-ink-3 hover:text-rose-500 hover:border-rose-300 dark:hover:border-rose-900 transition-colors cursor-pointer"
          title="Reset to default template"
        >
          <RotateCcw className="size-3.5" />
        </button>

        {/* Sign Out Button (Hidden on small screens, accessible in drawer) */}
        <button
          type="button"
          onClick={signOut}
          className="btn btn-secondary size-8 sm:size-8.5 hidden sm:grid place-items-center rounded-xl text-ink-3 hover:text-rose-500 hover:border-rose-300 dark:hover:border-rose-900 transition-colors cursor-pointer"
          title="Sign out of CMS Studio"
        >
          <LogOut className="size-3.5" />
        </button>

        {/* Primary Save Changes Button (Hidden on Career and Health tabs which have dedicated auto-saving) */}
        {activeTab !== 'career' && activeTab !== 'health' && (
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className={`btn btn-primary h-8 sm:h-8.5 px-2.5 sm:px-4 text-xs font-semibold flex items-center gap-1.5 sm:gap-2 rounded-xl shadow-xs transition-all cursor-pointer ${
              isDirty ? 'ring-2 ring-emerald-500/30' : ''
            }`}
            title="Save changes (Ctrl+S / ⌘S)"
          >
            <Save className="size-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
            <span className="hidden sm:inline">{!isSaving && ' Changes'}</span>
          </button>
        )}
      </div>
    </header>
  );
};
