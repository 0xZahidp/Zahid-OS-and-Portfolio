'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  Printer,
  Download,
  Edit3,
  Check,
  X,
  Phone,
  User,
  AlertTriangle,
  Plus,
  Heart,
  Building,
  FileCheck,
} from 'lucide-react';
import { HealthProfile, EmergencyContact, Medication } from '@/types/health';

interface EmergencyCardProps {
  profile: HealthProfile;
  activeMedications: Medication[];
  onSaveProfile: (profile: HealthProfile) => Promise<void>;
  showToast: (msg: string) => void;
  disabled?: boolean;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

export const EmergencyCard: React.FC<EmergencyCardProps> = ({
  profile,
  activeMedications,
  onSaveProfile,
  showToast,
  disabled = false,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formData, setFormData] = useState<HealthProfile>(profile);
  const [newAllergy, setNewAllergy] = useState<string>('');
  const [newCondition, setNewCondition] = useState<string>('');

  // Keep form synced when profile changes externally
  React.useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCanvas = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 700;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Card Background
      ctx.fillStyle = '#0f172a'; // slate-900
      ctx.roundRect(0, 0, 1200, 700, 32);
      ctx.fill();

      // Top Red Accent Bar
      ctx.fillStyle = '#f43f5e'; // rose-500
      ctx.roundRect(0, 0, 1200, 16, [32, 32, 0, 0]);
      ctx.fill();

      // Header Banner
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('MEDICAL EMERGENCY CARD', 50, 75);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '18px sans-serif';
      ctx.fillText('CONFIDENTIAL PERSONAL HEALTH IDENTIFICATION', 50, 105);

      // Blood Group Tile
      ctx.fillStyle = '#1e293b';
      ctx.roundRect(950, 45, 190, 80, 16);
      ctx.fill();
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('BLOOD GROUP', 980, 75);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px monospace';
      ctx.fillText(profile.bloodGroup || 'UNKNOWN', 980, 115);

      // Column 1: Allergies & Conditions (X: 50)
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('CRITICAL ALLERGIES', 50, 180);

      ctx.font = '18px sans-serif';
      const allergiesText = profile.allergies?.length
        ? profile.allergies.join(', ')
        : 'No known allergies reported';
      ctx.fillStyle = profile.allergies?.length ? '#fca5a5' : '#94a3b8';
      ctx.fillText(allergiesText, 50, 215, 500);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('MEDICAL CONDITIONS', 50, 290);

      ctx.font = '18px sans-serif';
      const condText = profile.conditions?.length
        ? profile.conditions.join(', ')
        : 'No chronic conditions reported';
      ctx.fillStyle = profile.conditions?.length ? '#fde68a' : '#94a3b8';
      ctx.fillText(condText, 50, 325, 500);

      // Active Medications
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('ACTIVE MEDICATIONS', 50, 400);

      ctx.font = '17px sans-serif';
      ctx.fillStyle = '#cbd5e1';
      if (activeMedications.length > 0) {
        const medsSummary = activeMedications
          .slice(0, 3)
          .map((m) => `${m.name} (${m.dose} - ${m.frequency})`)
          .join('\n');
        let medY = 435;
        for (const line of medsSummary.split('\n')) {
          ctx.fillText(`• ${line}`, 50, medY);
          medY += 28;
        }
      } else {
        ctx.fillText('No active routine medications', 50, 435);
      }

      // Column 2: Emergency Contacts & Primary Doctor (X: 650)
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('EMERGENCY CONTACTS', 650, 180);

      if (profile.emergencyContacts?.length) {
        let contactY = 215;
        for (const c of profile.emergencyContacts.slice(0, 2)) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 18px sans-serif';
          ctx.fillText(`${c.name} (${c.relation})`, 650, contactY);
          ctx.fillStyle = '#38bdf8';
          ctx.font = '18px monospace';
          ctx.fillText(`Tel: ${c.phone}`, 650, contactY + 25);
          contactY += 60;
        }
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '18px sans-serif';
        ctx.fillText('No emergency contact registered', 650, 215);
      }

      // Primary Doctor & Insurance
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('PHYSICIAN & INSURANCE', 650, 370);

      ctx.fillStyle = '#ffffff';
      ctx.font = '18px sans-serif';
      const docName = profile.primaryDoctor?.name
        ? `Dr. ${profile.primaryDoctor.name} (${profile.primaryDoctor.clinic || 'Clinic'})`
        : 'Not specified';
      ctx.fillText(`Physician: ${docName}`, 650, 405);
      if (profile.primaryDoctor?.phone) {
        ctx.fillStyle = '#38bdf8';
        ctx.font = '17px monospace';
        ctx.fillText(`Phone: ${profile.primaryDoctor.phone}`, 650, 430);
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = '18px sans-serif';
      const insText = profile.insurance?.provider
        ? `${profile.insurance.provider} (Policy: ${profile.insurance.policyNo || 'N/A'})`
        : 'None recorded';
      ctx.fillText(`Insurance: ${insText}`, 650, 470);

      // Footer
      ctx.fillStyle = '#475569';
      ctx.font = '14px monospace';
      ctx.fillText(
        `Generated: ${new Date().toLocaleDateString()} • Keep accessible in case of emergency`,
        50,
        660
      );

      // Trigger download
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `emergency-card-${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast('✓ Emergency card exported as PNG image');
    } catch {
      showToast('✕ Failed to generate card image');
    }
  };

  const handleSave = async () => {
    if (disabled) return;
    setIsSaving(true);
    try {
      await onSaveProfile(formData);
      setIsEditing(false);
      showToast('✓ Emergency card updated');
    } catch {
      showToast('✕ Save failed, retry');
    } finally {
      setIsSaving(false);
    }
  };

  const addAllergy = () => {
    if (!newAllergy.trim()) return;
    if (!formData.allergies.includes(newAllergy.trim())) {
      setFormData({ ...formData, allergies: [...formData.allergies, newAllergy.trim()] });
    }
    setNewAllergy('');
  };

  const removeAllergy = (idx: number) => {
    setFormData({
      ...formData,
      allergies: formData.allergies.filter((_, i) => i !== idx),
    });
  };

  const addCondition = () => {
    if (!newCondition.trim()) return;
    if (!formData.conditions.includes(newCondition.trim())) {
      setFormData({ ...formData, conditions: [...formData.conditions, newCondition.trim()] });
    }
    setNewCondition('');
  };

  const removeCondition = (idx: number) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.filter((_, i) => i !== idx),
    });
  };

  const addContact = () => {
    setFormData({
      ...formData,
      emergencyContacts: [
        ...formData.emergencyContacts,
        { name: '', relation: '', phone: '' },
      ],
    });
  };

  const updateContact = (idx: number, field: keyof EmergencyContact, val: string) => {
    const list = [...formData.emergencyContacts];
    list[idx] = { ...list[idx], [field]: val };
    setFormData({ ...formData, emergencyContacts: list });
  };

  const removeContact = (idx: number) => {
    setFormData({
      ...formData,
      emergencyContacts: formData.emergencyContacts.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="space-y-4">
      {/* Action Strip: Edit, Download Canvas, Print */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-4 text-rose-500" />
          <h3 className="text-sm font-bold text-ink">Emergency Medical ID Card</h3>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setFormData(profile);
                  setIsEditing(false);
                }}
                className="btn btn-secondary h-8 px-3 rounded-xl text-xs text-ink-3 hover:text-ink cursor-pointer"
              >
                <X className="size-3.5 mr-1" />
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || disabled}
                className="btn btn-primary h-8 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="size-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Card'}</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  if (disabled) return;
                  setIsEditing(true);
                }}
                disabled={disabled}
                className="btn btn-secondary h-8 px-2.5 sm:px-3 rounded-xl text-xs text-ink-2 hover:text-ink inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Edit emergency contact details"
              >
                <Edit3 className="size-3.5" />
                <span className="hidden sm:inline">Edit Details</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadCanvas}
                className="btn btn-secondary h-8 px-2.5 sm:px-3 rounded-xl text-xs text-ink-2 hover:text-ink inline-flex items-center gap-1.5 cursor-pointer"
                title="Download high-resolution image card"
              >
                <Download className="size-3.5" />
                <span className="hidden sm:inline">Download Image</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="btn btn-secondary h-8 px-2.5 sm:px-3 rounded-xl text-xs text-ink-2 hover:text-ink inline-flex items-center gap-1.5 cursor-pointer"
                title="Print one-page emergency medical record"
              >
                <Printer className="size-3.5" />
                <span className="hidden sm:inline">Print Card</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* EMERGENCY CARD (Styled for Screen & Clean Printable Page) */}
      <div
        id="printable-emergency-card"
        className="rounded-3xl border-2 border-rose-500/30 bg-surface/90 shadow-xl overflow-hidden backdrop-blur-md print:border-black print:bg-white print:shadow-none print:text-black"
      >
        {/* Top Accent Strip */}
        <div className="h-2 w-full bg-gradient-to-r from-rose-500 via-red-500 to-amber-500" />

        <div className="p-5 sm:p-7 space-y-6">
          {/* Card Top Row: Identification + Blood Group Badge */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-line pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-rose-500">
                  CONFIDENTIAL EMERGENCY MEDICAL RECORD
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-ink tracking-tight mt-1">
                Emergency Health Passport
              </h2>
              <p className="text-xs text-ink-3">
                Immediate medical information for emergency responders & healthcare providers
              </p>
            </div>

            {/* Blood Group Display / Select */}
            <div className="shrink-0 flex items-center sm:flex-col items-end gap-2 sm:gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-4">
                Blood Group
              </span>
              {isEditing ? (
                <select
                  value={formData.bloodGroup || 'Unknown'}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="h-10 px-3 rounded-xl border border-rose-500/40 bg-surface-2 text-sm font-bold font-mono text-ink focus:outline-hidden"
                >
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-4 py-2 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-mono text-xl sm:text-2xl font-black shadow-xs">
                  {profile.bloodGroup || 'Unknown'}
                </div>
              )}
            </div>
          </div>

          {/* Card Body: 2 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Allergies, Conditions, Active Meds */}
            <div className="space-y-5">
              {/* Allergies */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                  <AlertTriangle className="size-3.5 text-rose-500" />
                  <span>Known Allergies</span>
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {formData.allergies.map((all, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30"
                        >
                          <span>{all}</span>
                          <button
                            type="button"
                            onClick={() => removeAllergy(idx)}
                            className="hover:text-rose-900 cursor-pointer"
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Add allergy (e.g. Penicillin)"
                        value={newAllergy}
                        onChange={(e) => setNewAllergy(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addAllergy();
                          }
                        }}
                        className="flex-1 h-8 px-3 rounded-lg border border-line bg-surface-2 text-xs text-ink placeholder:text-ink-4 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={addAllergy}
                        className="btn btn-secondary h-8 px-2.5 rounded-lg text-xs font-semibold"
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.allergies?.length ? (
                      profile.allergies.map((all, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                        >
                          {all}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-ink-3 italic">
                        No known drug or food allergies
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Chronic Conditions */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                  <Heart className="size-3.5 text-amber-500" />
                  <span>Medical Conditions</span>
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {formData.conditions.map((cond, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30"
                        >
                          <span>{cond}</span>
                          <button
                            type="button"
                            onClick={() => removeCondition(idx)}
                            className="hover:text-amber-900 cursor-pointer"
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Add condition (e.g. Asthma, Hypertension)"
                        value={newCondition}
                        onChange={(e) => setNewCondition(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCondition();
                          }
                        }}
                        className="flex-1 h-8 px-3 rounded-lg border border-line bg-surface-2 text-xs text-ink placeholder:text-ink-4 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={addCondition}
                        className="btn btn-secondary h-8 px-2.5 rounded-lg text-xs font-semibold"
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.conditions?.length ? (
                      profile.conditions.map((cond, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        >
                          {cond}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-ink-3 italic">
                        No chronic conditions recorded
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Active Routine Medications (Auto-synchronized) */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                  <FileCheck className="size-3.5 text-blue-500" />
                  <span>Active Routine Medications</span>
                </div>

                <div className="space-y-1.5">
                  {activeMedications.length > 0 ? (
                    activeMedications.map((m) => (
                      <div
                        key={m.id}
                        className="px-3 py-2 rounded-xl bg-surface-2/60 border border-line text-xs flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-ink">{m.name}</span>
                          <span className="text-ink-3 ml-2">({m.dose})</span>
                        </div>
                        <span className="text-ink-4 font-mono text-[11px]">{m.frequency}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-ink-3 italic">
                      No active prescriptions in routine
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Emergency Contacts, Primary Doctor, Insurance */}
            <div className="space-y-5">
              {/* Emergency Contacts */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                    <Phone className="size-3.5 text-rose-500" />
                    <span>Emergency Contacts</span>
                  </div>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={addContact}
                      className="text-[11px] text-rose-500 hover:underline font-semibold inline-flex items-center gap-1"
                    >
                      <Plus className="size-3" />
                      <span>Add Contact</span>
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    {formData.emergencyContacts.map((contact, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl border border-line bg-surface-2 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Full Name"
                            value={contact.name}
                            onChange={(e) => updateContact(idx, 'name', e.target.value)}
                            className="flex-1 h-7 px-2 text-xs rounded border border-line bg-surface text-ink"
                          />
                          <input
                            type="text"
                            placeholder="Relation (e.g. Spouse, Brother)"
                            value={contact.relation}
                            onChange={(e) => updateContact(idx, 'relation', e.target.value)}
                            className="w-32 h-7 px-2 text-xs rounded border border-line bg-surface text-ink"
                          />
                          <button
                            type="button"
                            onClick={() => removeContact(idx)}
                            className="text-ink-4 hover:text-rose-500"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                        <input
                          type="tel"
                          placeholder="Phone number"
                          value={contact.phone}
                          onChange={(e) => updateContact(idx, 'phone', e.target.value)}
                          className="w-full h-7 px-2 text-xs rounded border border-line bg-surface text-ink font-mono"
                        />
                      </div>
                    ))}
                    {formData.emergencyContacts.length === 0 && (
                      <p className="text-xs text-ink-4 italic">No contacts added yet</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {profile.emergencyContacts?.length ? (
                      profile.emergencyContacts.map((c, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-2xl bg-surface-2/60 border border-line flex items-center justify-between"
                        >
                          <div>
                            <div className="text-xs font-bold text-ink flex items-center gap-1.5">
                              <User className="size-3 text-ink-3" />
                              <span>{c.name}</span>
                              <span className="text-[10px] font-normal text-ink-3 px-1.5 py-0.2 rounded-md bg-surface-3">
                                {c.relation}
                              </span>
                            </div>
                          </div>
                          <a
                            href={`tel:${c.phone}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono text-xs font-bold border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
                          >
                            <Phone className="size-3" />
                            <span>{c.phone}</span>
                          </a>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-ink-3 italic">
                        No emergency contacts listed
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Primary Physician */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                  <Building className="size-3.5 text-emerald-500" />
                  <span>Primary Doctor</span>
                </div>

                {isEditing ? (
                  <div className="p-2.5 rounded-xl border border-line bg-surface-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Doctor's name"
                        value={formData.primaryDoctor?.name || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            primaryDoctor: {
                              ...(formData.primaryDoctor || { name: '', phone: '' }),
                              name: e.target.value,
                            },
                          })
                        }
                        className="h-7 px-2 text-xs rounded border border-line bg-surface text-ink"
                      />
                      <input
                        type="text"
                        placeholder="Clinic / Hospital"
                        value={formData.primaryDoctor?.clinic || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            primaryDoctor: {
                              ...(formData.primaryDoctor || { name: '', phone: '' }),
                              clinic: e.target.value,
                            },
                          })
                        }
                        className="h-7 px-2 text-xs rounded border border-line bg-surface text-ink"
                      />
                    </div>
                    <input
                      type="tel"
                      placeholder="Doctor's direct phone"
                      value={formData.primaryDoctor?.phone || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          primaryDoctor: {
                            ...(formData.primaryDoctor || { name: '', phone: '' }),
                            phone: e.target.value,
                          },
                        })
                      }
                      className="w-full h-7 px-2 text-xs rounded border border-line bg-surface text-ink font-mono"
                    />
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-surface-2/60 border border-line text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-ink">
                        {profile.primaryDoctor?.name
                          ? `Dr. ${profile.primaryDoctor.name}`
                          : 'Not assigned'}
                      </div>
                      <div className="text-[11px] text-ink-3">
                        {profile.primaryDoctor?.clinic || 'Private Clinic'}
                      </div>
                    </div>
                    {profile.primaryDoctor?.phone && (
                      <a
                        href={`tel:${profile.primaryDoctor.phone}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-surface-3 text-ink-2 font-mono text-xs hover:text-ink"
                      >
                        <Phone className="size-3" />
                        <span>{profile.primaryDoctor.phone}</span>
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Health Insurance */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                  <ShieldAlert className="size-3.5 text-indigo-500" />
                  <span>Health Insurance</span>
                </div>

                {isEditing ? (
                  <div className="p-2.5 rounded-xl border border-line bg-surface-2 grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Provider (e.g. Bupa, MetLife)"
                      value={formData.insurance?.provider || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          insurance: {
                            ...(formData.insurance || { provider: '' }),
                            provider: e.target.value,
                          },
                        })
                      }
                      className="h-7 px-2 text-xs rounded border border-line bg-surface text-ink"
                    />
                    <input
                      type="text"
                      placeholder="Policy / Member ID"
                      value={formData.insurance?.policyNo || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          insurance: {
                            ...(formData.insurance || { provider: '' }),
                            policyNo: e.target.value,
                          },
                        })
                      }
                      className="h-7 px-2 text-xs rounded border border-line bg-surface text-ink font-mono"
                    />
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-surface-2/60 border border-line text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-ink">
                        {profile.insurance?.provider || 'No insurance recorded'}
                      </div>
                      {profile.insurance?.policyNo && (
                        <div className="text-[11px] text-ink-3 font-mono">
                          Policy: {profile.insurance.policyNo}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Emergency Card Footer note */}
          <div className="pt-4 border-t border-line text-[11px] text-ink-4 flex items-center justify-between">
            <span>Last Updated: {profile.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : 'Today'}</span>
            <span className="font-mono">FolioFrame Medical Security</span>
          </div>
        </div>
      </div>
    </div>
  );
};
