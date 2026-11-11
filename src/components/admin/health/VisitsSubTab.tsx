'use client';

import React, { useState, useMemo } from 'react';
import {
  Stethoscope,
  Plus,
  Search,
  User,
  Trash2,
  Edit3,
  X,
  FileText,
  BellRing,
} from 'lucide-react';
import { Visit, HealthDocument } from '@/types/health';
import { confirmModal } from '@/components/ui/ConfirmDialog';

interface VisitsSubTabProps {
  visits: Visit[];
  documents: HealthDocument[];
  onSaveVisit: (visit: Visit) => Promise<void>;
  onDeleteVisit: (id: string) => Promise<void>;
  onSyncFollowUpReminder: (visit: Visit, removed?: boolean) => Promise<void>;
  showToast: (msg: string) => void;
  disabled?: boolean;
}

export const VisitsSubTab: React.FC<VisitsSubTabProps> = ({
  visits,
  documents,
  onSaveVisit,
  onDeleteVisit,
  onSyncFollowUpReminder,
  showToast,
  disabled = false,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSlideOverOpen, setIsSlideOverOpen] = useState<boolean>(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [formData, setFormData] = useState<Partial<Visit>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Filtered & sorted visits
  const filteredVisits = useMemo(() => {
    return visits
      .filter((v) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          v.doctor.toLowerCase().includes(q) ||
          v.reason.toLowerCase().includes(q) ||
          (v.diagnosis && v.diagnosis.toLowerCase().includes(q)) ||
          (v.notes && v.notes.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [visits, searchQuery]);

  const openCreateModal = () => {
    if (disabled) return;
    setEditingVisit(null);
    setFormData({
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      doctor: '',
      reason: '',
      diagnosis: '',
      notes: '',
      followUpDate: '',
      documentIds: [],
    });
    setIsSlideOverOpen(true);
  };

  const openEditModal = (visit: Visit) => {
    if (disabled) return;
    setEditingVisit(visit);
    setFormData({ ...visit, documentIds: visit.documentIds || [] });
    setIsSlideOverOpen(true);
  };

  const closeSlideOver = () => {
    setIsSlideOverOpen(false);
    setEditingVisit(null);
  };

  const toggleDocumentLink = (docId: string) => {
    const current = formData.documentIds || [];
    if (current.includes(docId)) {
      setFormData({ ...formData, documentIds: current.filter((id) => id !== docId) });
    } else {
      setFormData({ ...formData, documentIds: [...current, docId] });
    }
  };

  const handleSaveForm = async () => {
    if (disabled) return;
    if (!formData.doctor?.trim()) {
      showToast('✕ Doctor name is required');
      return;
    }
    if (!formData.reason?.trim()) {
      showToast('✕ Reason for visit is required');
      return;
    }
    if (!formData.date) {
      showToast('✕ Visit date is required');
      return;
    }

    setIsSaving(true);
    try {
      const visitToSave: Visit = {
        id: formData.id || crypto.randomUUID(),
        date: formData.date,
        doctor: formData.doctor.trim(),
        reason: formData.reason.trim(),
        diagnosis: formData.diagnosis?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
        followUpDate: formData.followUpDate || undefined,
        documentIds: formData.documentIds || [],
        updatedAt: new Date().toISOString(),
      };

      await onSaveVisit(visitToSave);
      await onSyncFollowUpReminder(visitToSave, !visitToSave.followUpDate);
      showToast('✓ Doctor visit saved');
      closeSlideOver();
    } catch {
      showToast('✕ Save failed, retry');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar: Search, Add */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
          <input
            type="text"
            placeholder="Search visits, doctor, diagnosis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8.5 pl-8 pr-3 rounded-xl border border-line bg-surface text-xs text-ink placeholder:text-ink-4 focus:outline-hidden"
          />
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          disabled={disabled}
          className="btn btn-primary h-8.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="size-3.5" />
          <span>Log Doctor Visit</span>
        </button>
      </div>

      {/* Visits Timeline */}
      <div className="space-y-3.5">
        {filteredVisits.map((visit) => {
          const linkedDocs = documents.filter((d) => visit.documentIds?.includes(d.id));

          return (
            <div
              key={visit.id}
              className="p-4 sm:p-5 rounded-2xl bg-surface/80 border border-line hover:border-brand-500/40 shadow-xs transition-all space-y-3"
            >
              {/* Header: Date, Doctor, Actions */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div className="size-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center shrink-0">
                    <Stethoscope className="size-4.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-ink">{visit.reason}</h4>
                    <div className="text-xs text-ink-3 flex flex-wrap items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1 font-semibold text-ink">
                        <User className="size-3 text-ink-4" /> Dr. {visit.doctor}
                      </span>
                      <span>·</span>
                      <span className="font-mono">{visit.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => openEditModal(visit)}
                    disabled={disabled}
                    className="btn btn-secondary size-7.5 grid place-items-center rounded-lg text-ink-3 hover:text-ink cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Edit visit"
                  >
                    <Edit3 className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (disabled) return;
                      const ok = await confirmModal({
                        title: 'Delete Visit Record',
                        message: `Delete visit record for Dr. ${visit.doctor}? This will also remove any linked follow-up reminders.`,
                        confirmText: 'Delete Visit',
                        type: 'danger',
                      });
                      if (ok) {
                        await onDeleteVisit(visit.id);
                        await onSyncFollowUpReminder(visit, true);
                        showToast('✓ Visit record deleted');
                      }
                    }}
                    disabled={disabled}
                    className="btn btn-secondary size-7.5 grid place-items-center rounded-lg text-ink-3 hover:text-rose-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete visit"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Diagnosis */}
              {visit.diagnosis && (
                <div className="p-2.5 rounded-xl bg-surface-2/60 border border-line/60 text-xs">
                  <span className="font-bold text-ink">Diagnosis: </span>
                  <span className="text-ink-2">{visit.diagnosis}</span>
                </div>
              )}

              {/* Doctor's Notes */}
              {visit.notes && (
                <p className="text-xs text-ink-3 leading-relaxed bg-surface-2/30 p-2.5 rounded-xl border border-line/40">
                  {visit.notes}
                </p>
              )}

              {/* Follow-up reminder banner */}
              {visit.followUpDate && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-xs font-semibold">
                  <BellRing className="size-3.5" />
                  <span>Scheduled Follow-up: {visit.followUpDate}</span>
                </div>
              )}

              {/* Linked Documents Pills */}
              {linkedDocs.length > 0 && (
                <div className="pt-2 border-t border-line/60 space-y-1.5">
                  <span className="text-[11px] font-bold text-ink-4 uppercase tracking-wider">
                    Linked Medical Documents ({linkedDocs.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {linkedDocs.map((doc) => (
                      <span
                        key={doc.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-2 border border-line text-xs font-medium text-ink"
                      >
                        <FileText className="size-3 text-emerald-500" />
                        <span>{doc.title}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredVisits.length === 0 && (
          <div className="py-16 text-center rounded-2xl bg-surface-2/30 border border-line">
            <Stethoscope className="size-8 text-ink-4 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-bold text-ink">No doctor visits recorded</p>
            <p className="text-[11px] text-ink-3 mt-0.5">
              Keep a record of your medical appointments, prescriptions, and follow-ups
            </p>
          </div>
        )}
      </div>

      {/* Slide-over Form */}
      {isSlideOverOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in"
          onClick={closeSlideOver}
        >
          <div
            className="w-full max-w-md h-full bg-surface border-l border-line p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <div className="flex items-center gap-2">
                  <Stethoscope className="size-4 text-purple-500" />
                  <h3 className="text-sm font-bold text-ink">
                    {editingVisit ? 'Edit Doctor Visit' : 'Log Doctor Visit'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={closeSlideOver}
                  className="size-7 grid place-items-center rounded-lg text-ink-4 hover:text-ink"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Doctor & Date */}
                <div className="space-y-1">
                  <label className="font-semibold text-ink">Doctor / Specialist *</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Arthur Evans (Cardiology)"
                    value={formData.doctor || ''}
                    onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                    className="w-full h-8.5 px-3 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-ink">Date of Visit *</label>
                    <input
                      type="date"
                      value={formData.date || ''}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full h-8.5 px-3 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-ink">Follow-up Date</label>
                    <input
                      type="date"
                      value={formData.followUpDate || ''}
                      onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                      className="w-full h-8.5 px-3 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden font-mono"
                    />
                  </div>
                </div>

                {/* Reason */}
                <div className="space-y-1">
                  <label className="font-semibold text-ink">Reason for Visit *</label>
                  <input
                    type="text"
                    placeholder="e.g. Annual Health Checkup, Persistent Back Pain"
                    value={formData.reason || ''}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full h-8.5 px-3 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden"
                  />
                </div>

                {/* Diagnosis */}
                <div className="space-y-1">
                  <label className="font-semibold text-ink">Diagnosis / Findings</label>
                  <input
                    type="text"
                    placeholder="e.g. Mild lumbar strain, Normal ECG"
                    value={formData.diagnosis || ''}
                    onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                    className="w-full h-8.5 px-3 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden"
                  />
                </div>

                {/* Doctor Notes */}
                <div className="space-y-1">
                  <label className="font-semibold text-ink">Clinical Notes / Recommendations</label>
                  <textarea
                    rows={3}
                    placeholder="Advice on diet, exercise, medication changes..."
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-line bg-surface-2 text-xs text-ink placeholder:text-ink-4 focus:outline-hidden resize-none"
                  />
                </div>

                {/* Link Available Documents */}
                {documents.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-line">
                    <label className="font-semibold text-ink">Link Attached Documents</label>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-surface-2/60 border border-line">
                      {documents.map((doc) => {
                        const isChecked = formData.documentIds?.includes(doc.id);
                        return (
                          <label
                            key={doc.id}
                            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface text-xs cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleDocumentLink(doc.id)}
                              className="rounded border-line text-brand-500"
                            />
                            <span className="font-medium text-ink truncate">{doc.title}</span>
                            <span className="text-[10px] text-ink-4 font-mono ml-auto">
                              {doc.date}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-line flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeSlideOver}
                className="btn btn-secondary h-8.5 px-3 rounded-xl text-xs font-semibold text-ink-3 hover:text-ink cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveForm}
                disabled={isSaving || disabled}
                className="btn btn-primary h-8.5 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{isSaving ? 'Saving...' : 'Save Visit'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
