'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  HeartPulse,
  ShieldCheck,
  Download,
  Upload,
  HelpCircle,
  Pill,
  FileText,
  Stethoscope,
  Activity,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  BellRing,
  Check,
  Clock,
  HardDrive,
  AlertTriangle,
  X,
} from 'lucide-react';
import {
  HealthData,
  HealthProfile,
  Medication,
  Visit,
  Vital,
  Vaccination,
  Reminder,
  HealthStorageUsage,
} from '@/types/health';
import { EmergencyCard } from '@/components/admin/health/EmergencyCard';
import { MedicationsSubTab } from '@/components/admin/health/MedicationsSubTab';
import { DocumentsSubTab } from '@/components/admin/health/DocumentsSubTab';
import { VisitsSubTab } from '@/components/admin/health/VisitsSubTab';
import { VitalsSubTab } from '@/components/admin/health/VitalsSubTab';
import { useAdminAuth } from '@/context/AdminAuthContext';

export type HealthSubTab = 'overview' | 'medications' | 'documents' | 'visits' | 'vitals';

interface SubTabConfig {
  id: HealthSubTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
}

export const HealthTab: React.FC = () => {
  const { session } = useAdminAuth();

  const getAuthHeaders = useCallback((): HeadersInit => ({
    'Content-Type': 'application/json',
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  }), [session?.access_token]);

  const [activeSubTab, setActiveSubTab] = useState<HealthSubTab>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('All changes encrypted & saved');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [showRestoreModal, setShowRestoreModal] = useState<boolean>(false);
  const [restorePayload, setRestorePayload] = useState<Partial<HealthData> | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const restoreFileRef = useRef<HTMLInputElement>(null);

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

  const [storageUsage, setStorageUsage] = useState<HealthStorageUsage>({
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
      const headers = getAuthHeaders();
      const [resData, resUsage] = await Promise.all([
        fetch('/api/admin/health', { headers }),
        fetch('/api/admin/health/usage', { headers }),
      ]);

      if (!resData.ok) {
        setLoadError(true);
        showToast("✕ Couldn't load data, retry");
        return;
      }

      const json = await resData.json();
      if (json.data) {
        setHealthData(json.data);
      }
      setLoadError(false);

      if (resUsage.ok) {
        const jsonUsage = await resUsage.json();
        if (jsonUsage.usage) {
          setStorageUsage(jsonUsage.usage);
        }
      }
    } catch {
      setLoadError(true);
      showToast("✕ Couldn't load data, retry");
    } finally {
      setLoading(false);
    }
  }, [showToast, getAuthHeaders]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Export JSON backup
  const handleExportBackup = async () => {
    try {
      const res = await fetch('/api/admin/health/export', {
        headers: getAuthHeaders(),
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

  // Select restore JSON file
  const handleSelectRestoreFile = (file: File) => {
    if (loadError) {
      showToast("✕ Couldn't load data, retry");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text) as Partial<HealthData>;

        if (!parsed || typeof parsed !== 'object') {
          showToast('✕ Invalid backup file format');
          return;
        }

        setRestorePayload(parsed);
        setShowRestoreModal(true);
      } catch {
        showToast('✕ Failed to read or parse JSON backup file');
      }
    };
    reader.readAsText(file);
  };

  // Confirm restore
  const handleConfirmRestore = async () => {
    if (loadError) {
      showToast("✕ Couldn't load data, retry");
      return;
    }
    if (!restorePayload) return;
    setIsRestoring(true);
    try {
      const res = await fetch('/api/admin/health/export', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(restorePayload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Restore failed');
      }

      setShowRestoreModal(false);
      setRestorePayload(null);
      await loadData();
      showToast('✓ Backup restored and records merged successfully');
    } catch {
      showToast('✕ Failed to restore backup');
    } finally {
      setIsRestoring(false);
    }
  };

  // Profile Save
  const handleSaveProfile = async (updated: HealthProfile) => {
    if (loadError) {
      showToast("✕ Couldn't load data, retry");
      return;
    }
    setIsSaving(true);
    setSaveStatus('Saving profile...');
    try {
      const res = await fetch('/api/admin/health', {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          collection: 'profile',
          item: updated,
        }),
      });

      if (!res.ok) throw new Error();
      setHealthData((prev) => ({ ...prev, profile: updated }));
      setSaveStatus('All changes encrypted & saved');
    } catch {
      setSaveStatus('Save failed, retry');
      throw new Error('Save failed, retry');
    } finally {
      setIsSaving(false);
    }
  };

  // Medication Save (Create or Update)
  const handleSaveMedication = async (med: Medication) => {
    if (loadError) {
      showToast("✕ Couldn't load data, retry");
      return;
    }
    setIsSaving(true);
    setSaveStatus('Saving medication...');
    try {
      const isExisting = healthData.medications.some((m) => m.id === med.id);
      const res = await fetch('/api/admin/health', {
        method: isExisting ? 'PATCH' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          collection: 'medications',
          item: med,
        }),
      });

      if (!res.ok) throw new Error();
      setHealthData((prev) => {
        const nextList = isExisting
          ? prev.medications.map((m) => (m.id === med.id ? med : m))
          : [med, ...prev.medications];
        return { ...prev, medications: nextList };
      });
      setSaveStatus('All changes encrypted & saved');
    } catch {
      setSaveStatus('Save failed, retry');
      throw new Error();
    } finally {
      setIsSaving(false);
    }
  };

  // Medication Delete
  const handleDeleteMedication = async (id: string) => {
    if (loadError) {
      showToast("✕ Couldn't load data, retry");
      return;
    }
    try {
      const res = await fetch(`/api/admin/health?collection=medications&id=${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error();
      setHealthData((prev) => ({
        ...prev,
        medications: prev.medications.filter((m) => m.id !== id),
      }));
    } catch {
      throw new Error();
    }
  };

  // Sync Refill Reminder
  const handleSyncRefillReminder = async (med: Medication, removed?: boolean) => {
    if (loadError) return;
    const existing = healthData.reminders.find(
      (r) => r.relatedId === med.id && r.kind === 'refill'
    );

    try {
      if (removed || !med.active || !med.refillDate) {
        if (existing) {
          await fetch(`/api/admin/health?collection=reminders&id=${existing.id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
          });
          setHealthData((prev) => ({
            ...prev,
            reminders: prev.reminders.filter((r) => r.id !== existing.id),
          }));
        }
      } else {
        const reminderItem: Reminder = {
          id: existing ? existing.id : crypto.randomUUID(),
          title: `Refill: ${med.name}`,
          dueDate: med.refillDate,
          kind: 'refill',
          relatedId: med.id,
          done: false,
          updatedAt: new Date().toISOString(),
        };

        const res = await fetch('/api/admin/health', {
          method: existing ? 'PATCH' : 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            collection: 'reminders',
            item: reminderItem,
          }),
        });

        if (res.ok) {
          setHealthData((prev) => {
            const nextReminders = existing
              ? prev.reminders.map((r) => (r.id === existing.id ? reminderItem : r))
              : [reminderItem, ...prev.reminders];
            return { ...prev, reminders: nextReminders };
          });
        }
      }
    } catch {
      // background sync fail safe
    }
  };

  // Toggle Reminder Done
  const handleToggleReminderDone = async (reminder: Reminder) => {
    if (loadError) {
      showToast("✕ Couldn't load data, retry");
      return;
    }
    const updated: Reminder = {
      ...reminder,
      done: !reminder.done,
      updatedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/admin/health', {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          collection: 'reminders',
          item: updated,
        }),
      });

      if (!res.ok) throw new Error();
      setHealthData((prev) => ({
        ...prev,
        reminders: prev.reminders.map((r) => (r.id === reminder.id ? updated : r)),
      }));
      showToast(updated.done ? '✓ Reminder completed' : '✓ Reminder reopened');
    } catch {
      showToast('✕ Failed to update reminder');
    }
  };

  // Visit handlers
  const handleSaveVisit = async (visit: Visit) => {
    if (loadError) {
      showToast("✕ Couldn't load data, retry");
      return;
    }
    setIsSaving(true);
    setSaveStatus('Saving visit...');
    try {
      const isExisting = healthData.visits.some((v) => v.id === visit.id);
      const res = await fetch('/api/admin/health', {
        method: isExisting ? 'PATCH' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          collection: 'visits',
          item: visit,
        }),
      });

      if (!res.ok) throw new Error();
      setHealthData((prev) => {
        const nextList = isExisting
          ? prev.visits.map((v) => (v.id === visit.id ? visit : v))
          : [visit, ...prev.visits];
        return { ...prev, visits: nextList };
      });
      setSaveStatus('All changes encrypted & saved');
    } catch {
      setSaveStatus('Save failed, retry');
      throw new Error();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteVisit = async (id: string) => {
    if (loadError) {
      showToast("✕ Couldn't load data, retry");
      return;
    }
    try {
      const res = await fetch(`/api/admin/health?collection=visits&id=${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error();
      setHealthData((prev) => ({
        ...prev,
        visits: prev.visits.filter((v) => v.id !== id),
      }));
    } catch {
      throw new Error();
    }
  };

  const handleSyncFollowUpReminder = async (visit: Visit, removed?: boolean) => {
    if (loadError) return;
    const existing = healthData.reminders.find(
      (r) => r.relatedId === visit.id && r.kind === 'followUp'
    );

    try {
      if (removed || !visit.followUpDate) {
        if (existing) {
          await fetch(`/api/admin/health?collection=reminders&id=${existing.id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
          });
          setHealthData((prev) => ({
            ...prev,
            reminders: prev.reminders.filter((r) => r.id !== existing.id),
          }));
        }
      } else {
        const reminderItem: Reminder = {
          id: existing ? existing.id : crypto.randomUUID(),
          title: `Follow-up: ${visit.reason} (Dr. ${visit.doctor})`,
          dueDate: visit.followUpDate,
          kind: 'followUp',
          relatedId: visit.id,
          done: false,
          updatedAt: new Date().toISOString(),
        };

        const res = await fetch('/api/admin/health', {
          method: existing ? 'PATCH' : 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            collection: 'reminders',
            item: reminderItem,
          }),
        });

        if (res.ok) {
          setHealthData((prev) => {
            const nextReminders = existing
              ? prev.reminders.map((r) => (r.id === existing.id ? reminderItem : r))
              : [reminderItem, ...prev.reminders];
            return { ...prev, reminders: nextReminders };
          });
        }
      }
    } catch {
      // background sync
    }
  };

  // Vital handlers
  const handleSaveVital = async (vital: Vital) => {
    if (loadError) {
      showToast("✕ Couldn't load data, retry");
      return;
    }
    try {
      const res = await fetch('/api/admin/health', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          collection: 'vitals',
          item: vital,
        }),
      });

      if (!res.ok) throw new Error();
      setHealthData((prev) => ({
        ...prev,
        vitals: [vital, ...prev.vitals],
      }));
    } catch {
      throw new Error();
    }
  };

  const handleDeleteVital = async (id: string) => {
    if (loadError) {
      showToast("✕ Couldn't load data, retry");
      return;
    }
    try {
      const res = await fetch(`/api/admin/health?collection=vitals&id=${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error();
      setHealthData((prev) => ({
        ...prev,
        vitals: prev.vitals.filter((v) => v.id !== id),
      }));
    } catch {
      throw new Error();
    }
  };

  // Vaccination handlers
  const handleSaveVaccination = async (vac: Vaccination) => {
    if (loadError) {
      showToast("✕ Couldn't load data, retry");
      return;
    }
    try {
      const isExisting = healthData.vaccinations.some((v) => v.id === vac.id);
      const res = await fetch('/api/admin/health', {
        method: isExisting ? 'PATCH' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          collection: 'vaccinations',
          item: vac,
        }),
      });

      if (!res.ok) throw new Error();
      setHealthData((prev) => {
        const nextList = isExisting
          ? prev.vaccinations.map((v) => (v.id === vac.id ? vac : v))
          : [vac, ...prev.vaccinations];
        return { ...prev, vaccinations: nextList };
      });
    } catch {
      throw new Error();
    }
  };

  const handleDeleteVaccination = async (id: string) => {
    if (loadError) {
      showToast("✕ Couldn't load data, retry");
      return;
    }
    try {
      const res = await fetch(`/api/admin/health?collection=vaccinations&id=${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error();
      setHealthData((prev) => ({
        ...prev,
        vaccinations: prev.vaccinations.filter((v) => v.id !== id),
      }));
    } catch {
      throw new Error();
    }
  };

  const handleSyncVaccineReminder = async (vac: Vaccination, removed?: boolean) => {
    if (loadError) return;
    const existing = healthData.reminders.find(
      (r) => r.relatedId === vac.id && r.kind === 'vaccination'
    );

    try {
      if (removed || !vac.nextDueDate) {
        if (existing) {
          await fetch(`/api/admin/health?collection=reminders&id=${existing.id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
          });
          setHealthData((prev) => ({
            ...prev,
            reminders: prev.reminders.filter((r) => r.id !== existing.id),
          }));
        }
      } else {
        const reminderItem: Reminder = {
          id: existing ? existing.id : crypto.randomUUID(),
          title: `Booster Due: ${vac.name}`,
          dueDate: vac.nextDueDate,
          kind: 'vaccination',
          relatedId: vac.id,
          done: false,
          updatedAt: new Date().toISOString(),
        };

        const res = await fetch('/api/admin/health', {
          method: existing ? 'PATCH' : 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            collection: 'reminders',
            item: reminderItem,
          }),
        });

        if (res.ok) {
          setHealthData((prev) => {
            const nextReminders = existing
              ? prev.reminders.map((r) => (r.id === existing.id ? reminderItem : r))
              : [reminderItem, ...prev.reminders];
            return { ...prev, reminders: nextReminders };
          });
        }
      }
    } catch {
      // background sync
    }
  };

  // Upcoming reminders categorized
  const activeReminders = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const upcomingLimit = new Date();
    upcomingLimit.setDate(todayDate.getDate() + 14);

    return healthData.reminders
      .filter((r) => !r.done)
      .map((r) => {
        let status: 'overdue' | 'today' | 'upcoming' = 'upcoming';
        if (r.dueDate < today) {
          status = 'overdue';
        } else if (r.dueDate === today) {
          status = 'today';
        }
        return { ...r, status };
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [healthData.reminders]);

  // Active routine medications
  const activeMedications = useMemo(() => {
    return healthData.medications.filter((m) => m.active);
  }, [healthData.medications]);

  // Last backup status
  const lastBackupStatus = useMemo(() => {
    const lastDate = healthData.lastBackupDate;
    if (!lastDate) {
      return { isWarning: true, label: 'No backup downloaded yet' };
    }
    const diffDays = Math.ceil(
      (Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays > 30) {
      return { isWarning: true, label: `Last backup ${diffDays} days ago (>30d recommended)` };
    }
    return { isWarning: false, label: `Backed up ${diffDays}d ago` };
  }, [healthData.lastBackupDate]);

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
      } else if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        handleSelectSubTab('documents');
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
      count: activeReminders.length,
    },
    {
      id: 'medications',
      label: 'Medications',
      icon: Pill,
      count: activeMedications.length,
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

      {/* Initial load failure banner */}
      {loadError && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between gap-3 text-rose-600 dark:text-rose-400">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0 text-rose-500" />
            <span className="text-xs sm:text-sm font-semibold">Couldn&apos;t load data, retry</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="btn btn-secondary h-8 px-3 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/15 cursor-pointer"
          >
            Retry
          </button>
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
            ) : saveStatus === 'Save failed, retry' ? (
              <>
                <AlertCircle className="size-3.5 text-rose-500" />
                <span className="text-rose-500 font-medium">Save failed, retry</span>
              </>
            ) : (
              <>
                <ShieldCheck className="size-3.5 text-emerald-500" />
                <span className="text-ink-2 font-medium">{saveStatus}</span>
              </>
            )}
          </div>

          {/* Hidden restore input */}
          <input
            ref={restoreFileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleSelectRestoreFile(file);
              e.target.value = '';
            }}
          />

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

          {/* Restore Backup Button */}
          <button
            type="button"
            onClick={() => {
              if (loadError) {
                showToast("✕ Couldn't load data, retry");
                return;
              }
              restoreFileRef.current?.click();
            }}
            disabled={loading || loadError}
            className="btn btn-secondary h-8.5 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 text-ink-2 hover:text-ink cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Restore and merge JSON health backup"
          >
            <Upload className="size-3.5" />
            <span className="hidden md:inline">Restore</span>
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
          {/* OVERVIEW SUB-TAB */}
          {activeSubTab === 'overview' && (
            <div className="space-y-6">
              {/* Emergency ID Card Component */}
              <EmergencyCard
                profile={healthData.profile}
                activeMedications={activeMedications}
                onSaveProfile={handleSaveProfile}
                showToast={showToast}
                disabled={loadError}
              />

              {/* Upcoming Reminders Strip (Due today, Overdue, Next 14 days) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-surface/80 border border-line space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BellRing className="size-4 text-blue-500" />
                    <h3 className="text-xs sm:text-sm font-bold text-ink">
                      Active Medical & Refill Reminders
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-ink-4">
                    {activeReminders.length} pending
                  </span>
                </div>

                {activeReminders.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {activeReminders.map((reminder) => (
                      <div
                        key={reminder.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 text-xs ${
                          reminder.status === 'overdue'
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200'
                            : reminder.status === 'today'
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                              : 'bg-surface-2/60 border-line text-ink'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-bold truncate">{reminder.title}</div>
                          <div className="text-[11px] opacity-75 font-mono flex items-center gap-1 mt-0.5">
                            <Clock className="size-3" />
                            <span>
                              {reminder.status === 'overdue' && 'Overdue: '}
                              {reminder.status === 'today' && 'Today: '}
                              {reminder.dueDate}
                            </span>
                          </div>
                        </div>

                        {/* Complete Reminder Button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (loadError) return;
                            handleToggleReminderDone(reminder);
                          }}
                          disabled={loadError}
                          className="size-7 grid place-items-center rounded-lg bg-surface/90 hover:bg-surface text-ink-3 hover:text-emerald-500 border border-line/60 cursor-pointer shrink-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Mark reminder as completed"
                        >
                          <Check className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-ink-3 italic py-2">
                    No pending medication refills or doctor follow-ups.
                  </p>
                )}
              </div>

              {/* Free-Tier Safety Note Card & Last Backup Indicator */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Storage & Privacy Note */}
                <div className="p-4 sm:p-5 rounded-2xl bg-surface/80 border border-line space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-ink">
                    <HardDrive className="size-4 text-emerald-500" />
                    <span>Free-Tier Storage Security</span>
                  </div>
                  <p className="text-xs text-ink-3 leading-relaxed">
                    Documents are encrypted and stored in your private Supabase bucket (
                    <code className="text-ink font-mono text-[11px]">health-private</code>). All previews use 60-second expiring signed URLs.
                  </p>
                  <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-ink-4">
                    <span>
                      {(storageUsage.totalBytes / (1024 * 1024)).toFixed(1)} MB / 1,024 MB used
                    </span>
                    <span>{storageUsage.fileCount} confidential files</span>
                  </div>
                </div>

                {/* Backup Status */}
                <div className="p-4 sm:p-5 rounded-2xl bg-surface/80 border border-line space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-ink">
                      <Download className="size-4 text-indigo-500" />
                      <span>Data Sovereignty & Backups</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {lastBackupStatus.isWarning ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <AlertTriangle className="size-3" />
                          <span>{lastBackupStatus.label}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="size-3" />
                          <span>{lastBackupStatus.label}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleExportBackup}
                      className="btn btn-secondary h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 text-ink cursor-pointer"
                    >
                      <Download className="size-3.5" />
                      <span>Download Latest Backup JSON</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MEDICATIONS SUB-TAB */}
          {activeSubTab === 'medications' && (
            <MedicationsSubTab
              medications={healthData.medications}
              onSaveMedication={handleSaveMedication}
              onDeleteMedication={handleDeleteMedication}
              onSyncRefillReminder={handleSyncRefillReminder}
              showToast={showToast}
              disabled={loadError}
            />
          )}

          {/* DOCUMENTS SUB-TAB */}
          {activeSubTab === 'documents' && (
            <DocumentsSubTab
              documents={healthData.documents}
              storageUsage={storageUsage}
              onRefreshData={loadData}
              showToast={showToast}
              disabled={loadError}
            />
          )}

          {/* VISITS SUB-TAB */}
          {activeSubTab === 'visits' && (
            <VisitsSubTab
              visits={healthData.visits}
              documents={healthData.documents}
              onSaveVisit={handleSaveVisit}
              onDeleteVisit={handleDeleteVisit}
              onSyncFollowUpReminder={handleSyncFollowUpReminder}
              showToast={showToast}
              disabled={loadError}
            />
          )}

          {/* VITALS SUB-TAB */}
          {activeSubTab === 'vitals' && (
            <VitalsSubTab
              vitals={healthData.vitals}
              vaccinations={healthData.vaccinations}
              onSaveVital={handleSaveVital}
              onDeleteVital={handleDeleteVital}
              onSaveVaccination={handleSaveVaccination}
              onDeleteVaccination={handleDeleteVaccination}
              onSyncVaccineReminder={handleSyncVaccineReminder}
              showToast={showToast}
              disabled={loadError}
            />
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

      {/* 5. Restore Backup Preview & Confirmation Modal */}
      {showRestoreModal && restorePayload && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => {
            if (!isRestoring) setShowRestoreModal(false);
          }}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-surface border border-line p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <Upload className="size-5 text-indigo-500" />
                <h3 className="text-sm font-bold text-ink">Restore & Merge Health Records</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRestoreModal(false)}
                disabled={isRestoring}
                className="size-7 grid place-items-center rounded-lg text-ink-4 hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-ink-3 leading-relaxed">
              Records will be non-destructively merged by record ID. Existing items will be preserved and incoming records will be added.
            </p>

            {/* Counts Preview Card */}
            <div className="p-4 rounded-2xl bg-surface-2 border border-line space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-line/60">
                <span className="text-ink-3">Profile Data:</span>
                <span className="font-bold text-ink">
                  {restorePayload.profile ? 'Included (Allergies & Contacts)' : 'None'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-line/60">
                <span className="text-ink-3">Medications:</span>
                <span className="font-bold font-mono text-ink">
                  {restorePayload.medications?.length || 0} records
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-line/60">
                <span className="text-ink-3">Documents Metadata:</span>
                <span className="font-bold font-mono text-ink">
                  {restorePayload.documents?.length || 0} records
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-line/60">
                <span className="text-ink-3">Doctor Visits:</span>
                <span className="font-bold font-mono text-ink">
                  {restorePayload.visits?.length || 0} records
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-line/60">
                <span className="text-ink-3">Vitals & Metrics:</span>
                <span className="font-bold font-mono text-ink">
                  {restorePayload.vitals?.length || 0} records
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-line/60">
                <span className="text-ink-3">Vaccinations:</span>
                <span className="font-bold font-mono text-ink">
                  {restorePayload.vaccinations?.length || 0} records
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-ink-3">Reminders:</span>
                <span className="font-bold font-mono text-ink">
                  {restorePayload.reminders?.length || 0} records
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowRestoreModal(false)}
                disabled={isRestoring}
                className="btn btn-secondary h-9 px-4 rounded-xl text-xs font-semibold text-ink-3 hover:text-ink cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="btn btn-primary h-9 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                {isRestoring ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Merging Records...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-3.5" />
                    <span>Confirm & Merge Records</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
