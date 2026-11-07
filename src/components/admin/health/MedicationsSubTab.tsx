'use client';

import React, { useState, useMemo } from 'react';
import {
  Pill,
  Plus,
  Search,
  Calendar,
  Clock,
  User,
  AlertCircle,
  Trash2,
  Edit3,
  X,
  BellRing,
} from 'lucide-react';
import { Medication } from '@/types/health';

interface MedicationsSubTabProps {
  medications: Medication[];
  onSaveMedication: (med: Medication) => Promise<void>;
  onDeleteMedication: (id: string) => Promise<void>;
  onSyncRefillReminder: (med: Medication, removed?: boolean) => Promise<void>;
  showToast: (msg: string) => void;
}

export const MedicationsSubTab: React.FC<MedicationsSubTabProps> = ({
  medications,
  onSaveMedication,
  onDeleteMedication,
  onSyncRefillReminder,
  showToast,
}) => {
  const [filterMode, setFilterMode] = useState<'active' | 'past' | 'all'>('active');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<Partial<Medication>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Filtered list
  const filteredMeds = useMemo(() => {
    return medications.filter((med) => {
      if (filterMode === 'active' && !med.active) return false;
      if (filterMode === 'past' && med.active) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = med.name.toLowerCase().includes(q);
        const matchesDoctor = med.prescribedBy?.toLowerCase().includes(q);
        const matchesDose = med.dose.toLowerCase().includes(q);
        if (!matchesName && !matchesDoctor && !matchesDose) return false;
      }

      return true;
    });
  }, [medications, filterMode, searchQuery]);

  // Counts
  const activeCount = useMemo(() => medications.filter((m) => m.active).length, [medications]);
  const pastCount = useMemo(() => medications.filter((m) => !m.active).length, [medications]);

  const openCreateModal = () => {
    setEditingMed(null);
    setFormData({
      id: crypto.randomUUID(),
      name: '',
      dose: '',
      frequency: 'Once daily',
      schedule: '',
      startDate: new Date().toISOString().split('T')[0],
      active: true,
      notes: '',
    });
    setIsSlideOverOpen(true);
  };

  const openEditModal = (med: Medication) => {
    setEditingMed(med);
    setFormData({ ...med });
    setIsSlideOverOpen(true);
  };

  const closeSlideOver = () => {
    setIsSlideOverOpen(false);
    setEditingMed(null);
  };

  // Quick toggle active
  const toggleMedActive = async (med: Medication) => {
    const updated: Medication = {
      ...med,
      active: !med.active,
      updatedAt: new Date().toISOString(),
    };
    await onSaveMedication(updated);
    if (!updated.active) {
      await onSyncRefillReminder(updated, true);
    } else if (updated.refillDate) {
      await onSyncRefillReminder(updated, false);
    }
    showToast(updated.active ? '✓ Medication marked active' : '✓ Medication moved to past');
  };

  // Save form
  const handleSaveForm = async () => {
    if (!formData.name?.trim()) {
      showToast('✕ Medication name is required');
      return;
    }
    if (!formData.dose?.trim()) {
      showToast('✕ Dosage is required');
      return;
    }

    setIsSaving(true);
    try {
      const medToSave: Medication = {
        id: formData.id || crypto.randomUUID(),
        name: formData.name.trim(),
        dose: formData.dose.trim(),
        frequency: formData.frequency?.trim() || 'Once daily',
        schedule: formData.schedule?.trim() || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        prescribedBy: formData.prescribedBy?.trim() || undefined,
        active: formData.active ?? true,
        refillDate: formData.refillDate || undefined,
        notes: formData.notes?.trim() || undefined,
        updatedAt: new Date().toISOString(),
      };

      await onSaveMedication(medToSave);
      await onSyncRefillReminder(medToSave, !medToSave.active || !medToSave.refillDate);
      showToast('✓ Medication saved');
      closeSlideOver();
    } catch {
      showToast('✕ Save failed, retry');
    } finally {
      setIsSaving(false);
    }
  };

  // Refill badge helper
  const getRefillBadge = (refillDate?: string) => {
    if (!refillDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(refillDate);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <AlertCircle className="size-3" />
          <span>Refill Overdue ({Math.abs(diffDays)}d)</span>
        </span>
      );
    }
    if (diffDays === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse">
          <BellRing className="size-3" />
          <span>Refill Due Today</span>
        </span>
      );
    }
    if (diffDays <= 7) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          <Clock className="size-3" />
          <span>Refill in {diffDays}d</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-surface-3 text-ink-3">
        <Calendar className="size-3" />
        <span>Refill: {new Date(refillDate).toLocaleDateString()}</span>
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Toolbar: Filters, Search, Add */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="inline-flex p-1 bg-surface-2 border border-line rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setFilterMode('active')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              filterMode === 'active'
                ? 'bg-surface text-ink shadow-2xs font-bold'
                : 'text-ink-3 hover:text-ink'
            }`}
          >
            <span>Active ({activeCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('past')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              filterMode === 'past'
                ? 'bg-surface text-ink shadow-2xs font-bold'
                : 'text-ink-3 hover:text-ink'
            }`}
          >
            <span>Past / Inactive ({pastCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-surface text-ink shadow-2xs font-bold'
                : 'text-ink-3 hover:text-ink'
            }`}
          >
            <span>All ({medications.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
            <input
              type="text"
              placeholder="Search medications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8.5 pl-8 pr-3 rounded-xl border border-line bg-surface text-xs text-ink placeholder:text-ink-4 focus:outline-hidden"
            />
          </div>

          {/* Add Medication Button */}
          <button
            type="button"
            onClick={openCreateModal}
            className="btn btn-primary h-8.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="size-3.5" />
            <span>Add Medication</span>
          </button>
        </div>
      </div>

      {/* Medications Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredMeds.map((med) => (
          <div
            key={med.id}
            className={`p-4 rounded-2xl border transition-all space-y-3 relative group ${
              med.active
                ? 'bg-surface/80 border-line hover:border-brand-500/40 shadow-xs'
                : 'bg-surface-2/40 border-line/60 opacity-75'
            }`}
          >
            {/* Top row: Name, Dose, Status pill */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Pill className={`size-4 ${med.active ? 'text-blue-500' : 'text-ink-4'}`} />
                  <h4 className="text-sm font-bold text-ink truncate">{med.name}</h4>
                </div>
                <div className="text-xs text-ink-3 font-mono mt-0.5">
                  <span>{med.dose}</span>
                  <span className="mx-1.5">·</span>
                  <span>{med.frequency}</span>
                </div>
              </div>

              {/* Active Toggle Switch */}
              <button
                type="button"
                onClick={() => toggleMedActive(med)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                  med.active
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-surface-3 text-ink-4'
                }`}
                title={med.active ? 'Click to mark as past' : 'Click to reactivate'}
              >
                {med.active ? 'Active' : 'Past'}
              </button>
            </div>

            {/* Schedule & Notes */}
            {med.schedule && (
              <div className="text-xs text-ink-2 bg-surface-2/60 px-2.5 py-1.5 rounded-xl border border-line/60 flex items-center gap-1.5">
                <Clock className="size-3 text-ink-4 shrink-0" />
                <span className="truncate">{med.schedule}</span>
              </div>
            )}

            {/* Doctor & Refill Badge */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-line/50">
              <div className="flex items-center gap-1.5 text-ink-3 text-[11px]">
                {med.prescribedBy ? (
                  <>
                    <User className="size-3 text-ink-4" />
                    <span>Dr. {med.prescribedBy}</span>
                  </>
                ) : (
                  <span>OTC / Self</span>
                )}
              </div>

              {/* Refill Badge */}
              {med.active && getRefillBadge(med.refillDate)}
            </div>

            {/* Quick Actions (Hover overlay) */}
            <div className="flex items-center justify-end gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => openEditModal(med)}
                className="btn btn-secondary size-7 grid place-items-center rounded-lg text-ink-3 hover:text-ink cursor-pointer"
                title="Edit medication"
              >
                <Edit3 className="size-3" />
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (confirm(`Delete medication "${med.name}"?`)) {
                    await onDeleteMedication(med.id);
                    await onSyncRefillReminder(med, true);
                    showToast('✓ Medication deleted');
                  }
                }}
                className="btn btn-secondary size-7 grid place-items-center rounded-lg text-ink-3 hover:text-rose-500 cursor-pointer"
                title="Delete medication"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          </div>
        ))}

        {filteredMeds.length === 0 && (
          <div className="col-span-full py-16 text-center rounded-2xl bg-surface-2/30 border border-line">
            <Pill className="size-8 text-ink-4 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-bold text-ink">No medications found</p>
            <p className="text-[11px] text-ink-3 mt-0.5">
              {searchQuery ? 'Try adjusting your search' : 'Add your active prescriptions and vitamins'}
            </p>
          </div>
        )}
      </div>

      {/* 480px Slide-Over Editor */}
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
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-line">
                <div className="flex items-center gap-2">
                  <Pill className="size-4 text-blue-500" />
                  <h3 className="text-sm font-bold text-ink">
                    {editingMed ? 'Edit Medication' : 'Add New Medication'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={closeSlideOver}
                  className="size-8 grid place-items-center rounded-xl text-ink-4 hover:text-ink hover:bg-surface-2"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Form fields */}
              <div className="space-y-4 text-xs">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-ink">Medication / Drug Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Amoxicillin, Cetirizine, Vitamin D3"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-line bg-surface-2 text-xs text-ink placeholder:text-ink-4 focus:outline-hidden"
                  />
                </div>

                {/* Dose & Frequency */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-ink">Dose *</label>
                    <input
                      type="text"
                      placeholder="e.g. 500mg, 10ml, 1 drop"
                      value={formData.dose || ''}
                      onChange={(e) => setFormData({ ...formData, dose: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl border border-line bg-surface-2 text-xs text-ink placeholder:text-ink-4 focus:outline-hidden font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-ink">Frequency *</label>
                    <select
                      value={formData.frequency || 'Once daily'}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                      className="w-full h-9 px-2 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden"
                    >
                      <option value="Once daily">Once daily</option>
                      <option value="Twice daily">Twice daily</option>
                      <option value="3 times daily">3 times daily</option>
                      <option value="Every 4 hours">Every 4 hours</option>
                      <option value="Every 8 hours">Every 8 hours</option>
                      <option value="Weekly">Weekly</option>
                      <option value="As needed (PRN)">As needed (PRN)</option>
                    </select>
                  </div>
                </div>

                {/* Timing / Schedule Notes */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-ink">Schedule Instructions</label>
                  <input
                    type="text"
                    placeholder="e.g. Morning after breakfast, with a glass of water"
                    value={formData.schedule || ''}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-line bg-surface-2 text-xs text-ink placeholder:text-ink-4 focus:outline-hidden"
                  />
                </div>

                {/* Prescribed By */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-ink">Prescribing Physician</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Jennifer Adams"
                    value={formData.prescribedBy || ''}
                    onChange={(e) => setFormData({ ...formData, prescribedBy: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-line bg-surface-2 text-xs text-ink placeholder:text-ink-4 focus:outline-hidden"
                  />
                </div>

                {/* Refill Date (Syncs with Reminders) */}
                <div className="space-y-1.5 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-ink flex items-center gap-1.5">
                      <BellRing className="size-3.5 text-blue-500" />
                      <span>Refill Reminder Date</span>
                    </label>
                    <span className="text-[10px] text-ink-4">Auto-syncs reminder</span>
                  </div>
                  <input
                    type="date"
                    value={formData.refillDate || ''}
                    onChange={(e) => setFormData({ ...formData, refillDate: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-line bg-surface text-xs text-ink focus:outline-hidden font-mono"
                  />
                  <p className="text-[10px] text-ink-3">
                    Setting a refill date creates an automatic alert in your health overview.
                  </p>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-ink">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate || ''}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-ink">End Date (optional)</label>
                    <input
                      type="date"
                      value={formData.endDate || ''}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden font-mono"
                    />
                  </div>
                </div>

                {/* Active Checkbox */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="med-active-check"
                    checked={formData.active ?? true}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="rounded border-line text-brand-500"
                  />
                  <label htmlFor="med-active-check" className="font-semibold text-ink cursor-pointer">
                    Currently Active in Routine
                  </label>
                </div>

                {/* Additional Notes */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-ink">Notes / Side Effects</label>
                  <textarea
                    rows={2}
                    placeholder="Take with food, avoid grapefruit..."
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-line bg-surface-2 text-xs text-ink placeholder:text-ink-4 focus:outline-hidden resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-line flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeSlideOver}
                className="btn btn-secondary h-9 px-4 rounded-xl text-xs font-semibold text-ink-3 hover:text-ink cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveForm}
                disabled={isSaving}
                className="btn btn-primary h-9 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                {isSaving ? 'Saving...' : 'Save Medication'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
