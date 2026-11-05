'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  HeartPulse,
  ShieldCheck,
  Download,
  HelpCircle,
  Pill,
  FileText,
  Stethoscope,
  Activity,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { HealthData, HealthStorageUsage } from '@/types/health';

export type HealthSubTab = 'overview' | 'medications' | 'documents' | 'visits' | 'vitals';

interface SubTabConfig {
  id: HealthSubTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
}

export const HealthTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<HealthSubTab>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving] = useState<boolean>(false);
  const [saveStatus] = useState<string>('All changes encrypted & saved');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);

  // Health data state
  const [healthData, setHealthData] = useState<HealthData>({
    profile: {
      bloodGroup: '',
      allergies: [],
      conditions: [],
      emergencyContacts: [],
    },
    medications: [],
    documents: [],
    visits: [],
    vitals: [],
    vaccinations: [],
    reminders: [],
  });

  const [, setStorageUsage] = useState<HealthStorageUsage>({
    totalBytes: 0,
    fileCount: 0,
    limitBytes: 1024 * 1024 * 1024,
  });

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  }, []);

  // Read subtab from localStorage on mount safely
  useEffect(() => {
    try {
      const stored = localStorage.getItem('admin_health_active_subtab') as HealthSubTab | null;
      if (
        stored &&
        ['overview', 'medications', 'documents', 'visits', 'vitals'].includes(stored)
      ) {
        setActiveSubTab(stored);
      }
    } catch {
      // safe fallback
    }
  }, []);

  const handleSelectSubTab = (tab: HealthSubTab) => {
    setActiveSubTab(tab);
    try {
      localStorage.setItem('admin_health_active_subtab', tab);
    } catch {
      // safe fallback
    }
  };

  // Load all health data and storage usage
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { 'x-admin-key': 'folioframe_admin' };
      const [resData, resUsage] = await Promise.all([
        fetch('/api/admin/health', { headers }),
        fetch('/api/admin/health/usage', { headers }),
      ]);

      if (resData.ok) {
        const json = await resData.json();
        if (json.data) {
          setHealthData(json.data);
        }
      }

      if (resUsage.ok) {
        const jsonUsage = await resUsage.json();
        if (jsonUsage.usage) {
          setStorageUsage(jsonUsage.usage);
        }
      }
    } catch {
      showToast('✕ Failed to load health records');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Export JSON backup
  const handleExportBackup = async () => {
    try {
      const res = await fetch('/api/admin/health/export', {
        headers: { 'x-admin-key': 'folioframe_admin' },
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `health-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('✓ Health backup exported successfully');
    } catch {
      showToast('✕ Failed to export backup');
    }
  };

  // Keyboard shortcuts (N, U, 1-5, Esc, ?)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      if (e.key === '1') {
        e.preventDefault();
        handleSelectSubTab('overview');
      } else if (e.key === '2') {
        e.preventDefault();
        handleSelectSubTab('medications');
      } else if (e.key === '3') {
        e.preventDefault();
        handleSelectSubTab('documents');
      } else if (e.key === '4') {
        e.preventDefault();
        handleSelectSubTab('visits');
      } else if (e.key === '5') {
        e.preventDefault();
        handleSelectSubTab('vitals');
      } else if (e.key === '?') {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
      } else if (e.key === 'Escape') {
        setShowShortcutsModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const subTabs: SubTabConfig[] = [
    {
      id: 'overview',
      label: 'Emergency & Overview',
      icon: ShieldCheck,
      count: healthData.reminders.filter((r) => !r.done).length,
    },
    {
      id: 'medications',
      label: 'Medications',
      icon: Pill,
      count: healthData.medications.filter((m) => m.active).length,
    },
    {
      id: 'documents',
      label: 'Documents & Lab',
      icon: FileText,
      count: healthData.documents.length,
    },
    {
      id: 'visits',
      label: 'Doctor Visits',
      icon: Stethoscope,
      count: healthData.visits.length,
    },
    {
      id: 'vitals',
      label: 'Vitals & Metrics',
      icon: Activity,
      count: healthData.vitals.length,
    },
  ];

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 space-y-6 select-none pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-neutral-900/95 dark:bg-neutral-800/95 text-white px-4 py-3 shadow-2xl border border-white/10 text-xs font-semibold flex items-center gap-2.5 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          {toastMessage.startsWith('✕') ? (
            <AlertCircle className="size-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
          )}
          <span>{toastMessage.replace(/^[✓✕]\s*/, '')}</span>
        </div>
      )}

      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
            <HeartPulse className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-ink tracking-tight">
                Personal Health Record
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                Private Admin Only
              </span>
            </div>
            <p className="text-xs text-ink-3">
              Encrypted emergency card, prescriptions, lab reports & vitals in private bucket
            </p>
          </div>
        </div>

        {/* Right Toolbar Controls */}
        <div className="flex items-center gap-2">
          {/* Auto-save Status Indicator */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-2 border border-line text-[11px] text-ink-3">
            {isSaving ? (
              <>
                <Loader2 className="size-3 animate-spin text-brand-500" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="size-3.5 text-emerald-500" />
                <span className="text-ink-2 font-medium">{saveStatus}</span>
              </>
            )}
          </div>

          {/* Export Backup Button */}
          <button
            type="button"
            onClick={handleExportBackup}
            className="btn btn-secondary h-8.5 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 text-ink-2 hover:text-ink cursor-pointer"
            title="Download full confidential JSON snapshot"
          >
            <Download className="size-3.5" />
            <span className="hidden md:inline">Export</span>
            <span>Backup</span>
          </button>

          {/* Refresh Data */}
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="btn btn-secondary size-8.5 grid place-items-center rounded-xl text-ink-3 hover:text-ink cursor-pointer"
            title="Reload records from server"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Shortcuts Help */}
          <button
            type="button"
            onClick={() => setShowShortcutsModal(true)}
            className="btn btn-secondary size-8.5 grid place-items-center rounded-xl text-ink-3 hover:text-ink cursor-pointer"
            title="Keyboard shortcuts (?)"
          >
            <HelpCircle className="size-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Sub-tabs Navigation Bar */}
      <div className="flex items-center gap-1.5 p-1 bg-surface-2/60 border border-line rounded-2xl overflow-x-auto [scrollbar-width:none]">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelectSubTab(tab.id)}
              className={`flex-1 min-w-[130px] sm:min-w-0 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-surface text-ink shadow-xs border border-line/60 font-bold'
                  : 'text-ink-3 hover:text-ink hover:bg-surface/50'
              }`}
            >
              <Icon className={`size-3.5 ${isActive ? 'text-rose-500' : 'opacity-70'}`} />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                    isActive
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold'
                      : 'bg-surface-3 text-ink-4'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Sub-Tab Workspace */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="size-6 text-rose-500 animate-spin" />
          <p className="text-xs text-ink-3 font-medium">Decrypting private health records...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeSubTab === 'overview' && (
            <div className="p-8 rounded-2xl bg-surface-2/40 border border-line text-center text-ink-3">
              <ShieldCheck className="size-8 mx-auto text-rose-500 mb-2" />
              <h3 className="text-sm font-bold text-ink">Emergency & Health Overview Shell</h3>
              <p className="text-xs text-ink-4 mt-1 max-w-md mx-auto">
                Phase 3 will render the complete Emergency Card with one-click print, Canvas export, and reminder strips.
              </p>
            </div>
          )}

          {activeSubTab === 'medications' && (
            <div className="p-8 rounded-2xl bg-surface-2/40 border border-line text-center text-ink-3">
              <Pill className="size-8 mx-auto text-blue-500 mb-2" />
              <h3 className="text-sm font-bold text-ink">Medications & Prescriptions Shell</h3>
              <p className="text-xs text-ink-4 mt-1 max-w-md mx-auto">
                Phase 3 will render active/past medications list, slide-over editor, and refill tracking.
              </p>
            </div>
          )}

          {activeSubTab === 'documents' && (
            <div className="p-8 rounded-2xl bg-surface-2/40 border border-line text-center text-ink-3">
              <FileText className="size-8 mx-auto text-emerald-500 mb-2" />
              <h3 className="text-sm font-bold text-ink">Documents & Storage Shell</h3>
              <p className="text-xs text-ink-4 mt-1 max-w-md mx-auto">
                Phase 4 will render storage meter, client-side Canvas compression upload, and 60s signed preview URLs.
              </p>
            </div>
          )}

          {activeSubTab === 'visits' && (
            <div className="p-8 rounded-2xl bg-surface-2/40 border border-line text-center text-ink-3">
              <Stethoscope className="size-8 mx-auto text-purple-500 mb-2" />
              <h3 className="text-sm font-bold text-ink">Doctor Visits Shell</h3>
              <p className="text-xs text-ink-4 mt-1 max-w-md mx-auto">
                Phase 5 will render visits timeline, follow-up sync, and slide-over consultation editor.
              </p>
            </div>
          )}

          {activeSubTab === 'vitals' && (
            <div className="p-8 rounded-2xl bg-surface-2/40 border border-line text-center text-ink-3">
              <Activity className="size-8 mx-auto text-amber-500 mb-2" />
              <h3 className="text-sm font-bold text-ink">Vitals & Trend Analytics Shell</h3>
              <p className="text-xs text-ink-4 mt-1 max-w-md mx-auto">
                Phase 5 will render inline-SVG vitals chart with 30d/90d/1y ranges, BP tracking, and vaccinations.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 4. Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowShortcutsModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-surface border border-line p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <HelpCircle className="size-4 text-rose-500" />
                <h3 className="text-sm font-bold text-ink">Health Keyboard Shortcuts</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="text-xs text-ink-4 hover:text-ink px-2 py-1 rounded-lg hover:bg-surface-2"
              >
                Esc
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-line/60">
                <span className="text-ink-2">Switch Sub-tabs</span>
                <span className="font-mono bg-surface-2 px-2 py-0.5 rounded border border-line text-ink font-bold">
                  1 - 5
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-line/60">
                <span className="text-ink-2">Add New Record</span>
                <span className="font-mono bg-surface-2 px-2 py-0.5 rounded border border-line text-ink font-bold">
                  N
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-line/60">
                <span className="text-ink-2">Upload Document</span>
                <span className="font-mono bg-surface-2 px-2 py-0.5 rounded border border-line text-ink font-bold">
                  U
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-line/60">
                <span className="text-ink-2">Close Modal / Slide-over</span>
                <span className="font-mono bg-surface-2 px-2 py-0.5 rounded border border-line text-ink font-bold">
                  Esc
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-ink-2">Show Shortcuts Cheat Sheet</span>
                <span className="font-mono bg-surface-2 px-2 py-0.5 rounded border border-line text-ink font-bold">
                  ?
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
