'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Briefcase,
  Languages,
  Plus,
  Trash2,
  X,
  Volume2,
  VolumeX,
  ArrowUp,
  ArrowDown,
  GripVertical,
} from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';
import { LanguageSkill } from '@/types/profile';

export const FactsTab: React.FC = () => {
  const {
    content,
    updateBasedInSettings,
    updateWorksSettings,
    updateLanguages,
  } = usePortfolio();

  const basedIn = content.basedInSettings;
  const works = content.worksSettings;
  const languages = content.languages || [];

  const [newChip, setNewChip] = useState('');
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  // Works chips
  const handleAddChip = () => {
    const trimmed = newChip.trim();
    if (!trimmed || works.chips.includes(trimmed)) return;
    updateWorksSettings({ chips: [...works.chips, trimmed] });
    setNewChip('');
  };

  const handleRemoveChip = (chipToRemove: string) => {
    updateWorksSettings({ chips: works.chips.filter((c) => c !== chipToRemove) });
  };

  // Language update
  const handleLanguageChange = (idx: number, patch: Partial<LanguageSkill>) => {
    const updated = [...languages];
    updated[idx] = { ...updated[idx], ...patch };
    updateLanguages(updated);
  };

  const handleAddLanguage = () => {
    if (languages.length >= 12) {
      alert(
        'Soft UI limit reached: You have reached the recommended limit of 12 languages. You can still add more, but it may impact the public page grid layout.'
      );
    }
    const newLang: LanguageSkill = {
      id: `lang_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: '',
      rating: 5,
      proficiency: 'Native',
      note: '',
      hasVoice: true,
      has_voice: true,
      sort_order: languages.length,
    };
    updateLanguages([...languages, newLang]);
  };

  const handleMoveLanguage = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= languages.length) return;
    const reordered = [...languages];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    const updated = reordered.map((lang, idx) => ({
      ...lang,
      sort_order: idx,
    }));
    updateLanguages(updated);
  };

  const handleRemoveLanguage = (idx: number) => {
    const lang = languages[idx];
    const confirmed = window.confirm(
      `Are you sure you want to delete "${lang.name || 'this language'}"? This change will be permanently applied when you save.`
    );
    if (!confirmed) return;

    const remaining = languages
      .filter((_, i) => i !== idx)
      .map((l, i) => ({ ...l, sort_order: i }));
    updateLanguages(remaining);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 1. Based In Card */}
      <div className="card-raised rounded-2xl border border-line bg-surface p-4 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-line">
          <MapPin className="size-4.5 text-brand-500" />
          <div>
            <h2 className="text-sm font-bold text-ink">Based In Location & Clock</h2>
            <p className="text-[11px] text-ink-3">
              Configures the mint gradient Based In card and live world clock widget.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-ink-3">City</label>
            <input
              type="text"
              value={basedIn.city}
              onChange={(e) => updateBasedInSettings({ city: e.target.value })}
              className="w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-ink-3">Country</label>
            <input
              type="text"
              value={basedIn.country}
              onChange={(e) => updateBasedInSettings({ country: e.target.value })}
              className="w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-ink-3">Timezone</label>
            <input
              type="text"
              value={basedIn.timezone}
              onChange={(e) => updateBasedInSettings({ timezone: e.target.value })}
              placeholder="e.g. Asia/Dhaka"
              className="w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-ink-3">GMT Offset Label</label>
            <input
              type="text"
              value={basedIn.gmtOffset}
              onChange={(e) => updateBasedInSettings({ gmtOffset: e.target.value })}
              placeholder="e.g. GMT+6"
              className="w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* 2. Works Setup Card */}
      <div className="card-raised rounded-2xl border border-line bg-surface p-4 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-line">
          <Briefcase className="size-4.5 text-brand-500" />
          <div>
            <h2 className="text-sm font-bold text-ink">Works Setup & Availability</h2>
            <p className="text-[11px] text-ink-3">
              Configures the Works card with check-chips.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-ink-3">Card Heading</label>
            <input
              type="text"
              value={works.heading}
              onChange={(e) => updateWorksSettings({ heading: e.target.value })}
              className="w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-ink-3">Description</label>
            <textarea
              value={works.description}
              onChange={(e) => updateWorksSettings({ description: e.target.value })}
              rows={2}
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs text-ink focus:outline-none resize-none leading-relaxed"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-ink-3">Availability Check Chips</label>
            <div className="flex flex-wrap items-center gap-2">
              {works.chips.map((chip) => (
                <span
                  key={chip}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs text-ink"
                >
                  <span>✓ {chip}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChip(chip)}
                    className="text-ink-3 hover:text-rose-500 transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}

              <div className="inline-flex items-center gap-1">
                <input
                  type="text"
                  value={newChip}
                  onChange={(e) => setNewChip(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddChip();
                    }
                  }}
                  placeholder="+ Add chip (Enter)..."
                  className="rounded-full border border-line bg-surface px-3 py-1 text-xs text-ink focus:outline-none w-36"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Languages Card */}
      <div className="card-raised rounded-2xl border border-line bg-surface p-4 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line">
          <div className="flex items-center gap-2.5">
            <Languages className="size-4.5 text-brand-500" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-ink">Language Fluency</h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-2 text-ink-2 border border-line">
                  {languages.length} {languages.length === 1 ? 'language' : 'languages'}
                </span>
              </div>
              <p className="text-[11px] text-ink-3">
                Languages, rating progress segments (1 to 5), level badges, and pronunciation preview.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {languages.length >= 12 && (
              <span className="text-[11px] text-amber-500 font-medium">Soft limit: 12 configured</span>
            )}
            <button
              type="button"
              onClick={handleAddLanguage}
              className="btn btn-secondary h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer hover:bg-surface-2"
            >
              <Plus className="size-3.5" />
              <span>Add Language</span>
            </button>
          </div>
        </div>

        {languages.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-line bg-surface-2/40 text-ink-3">
            <Languages className="size-8 mx-auto mb-2 opacity-40 text-ink" />
            <p className="text-xs font-bold text-ink">No languages added</p>
            <p className="text-[11px] text-ink-3 mt-1">No languages: the card is hidden on the public page.</p>
            <button
              type="button"
              onClick={handleAddLanguage}
              className="mt-3 btn btn-secondary h-7 px-3 rounded-lg text-xs font-medium inline-flex items-center gap-1"
            >
              <Plus className="size-3" />
              <span>Add first language</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {languages.map((lang, idx) => (
              <div
                key={lang.id || idx}
                draggable
                onDragStart={() => setDraggedIdx(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedIdx !== null && draggedIdx !== idx) {
                    handleMoveLanguage(draggedIdx, idx);
                    setDraggedIdx(null);
                  }
                }}
                className={`p-4 rounded-xl border transition-all ${
                  draggedIdx === idx
                    ? 'border-brand-500/60 bg-brand-500/5'
                    : 'border-line bg-surface-2/60'
                } space-y-3`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="cursor-grab active:cursor-grabbing text-ink-3 hover:text-ink transition-colors p-1"
                      title="Drag to reorder"
                    >
                      <GripVertical className="size-4" />
                    </span>

                    <span className="text-xs font-bold text-ink">
                      {lang.name || 'Untitled Language'}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                      {lang.proficiency}
                    </span>

                    {/* Reorder Buttons */}
                    <div className="flex items-center gap-0.5 ml-2 border border-line rounded-lg overflow-hidden bg-surface">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveLanguage(idx, idx - 1)}
                        className="p-1 text-ink-3 hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        <ArrowUp className="size-3" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === languages.length - 1}
                        onClick={() => handleMoveLanguage(idx, idx + 1)}
                        className="p-1 text-ink-3 hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        <ArrowDown className="size-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Voice Toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        const nextVoice = !(lang.hasVoice !== false && lang.has_voice !== false);
                        handleLanguageChange(idx, { hasVoice: nextVoice, has_voice: nextVoice });
                      }}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border transition-colors cursor-pointer ${
                        lang.hasVoice !== false && lang.has_voice !== false
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'border-line bg-surface text-ink-3 hover:text-ink'
                      }`}
                      title={
                        lang.hasVoice !== false && lang.has_voice !== false
                          ? 'Pronunciation / Voice Note active'
                          : 'Pronunciation / Voice Note disabled'
                      }
                    >
                      {lang.hasVoice !== false && lang.has_voice !== false ? (
                        <>
                          <Volume2 className="size-3 text-emerald-500" />
                          <span>Voice On</span>
                        </>
                      ) : (
                        <>
                          <VolumeX className="size-3 text-ink-3" />
                          <span>Voice Off</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveLanguage(idx)}
                      className="p-1.5 text-ink-3 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-500/10 cursor-pointer"
                      title="Delete language"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="text-[11px] font-semibold text-ink-3">Language Name</label>
                    <input
                      type="text"
                      value={lang.name}
                      onChange={(e) => handleLanguageChange(idx, { name: e.target.value })}
                      placeholder="e.g. English, Arabic..."
                      className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-ink-3">
                      Fluency Dots: {lang.rating || 5} / 5
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="range"
                        min={1}
                        max={5}
                        value={lang.rating || 5}
                        onChange={(e) => handleLanguageChange(idx, { rating: Number(e.target.value) })}
                        className="w-full accent-brand-500"
                      />
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((dot) => (
                          <button
                            key={dot}
                            type="button"
                            onClick={() => handleLanguageChange(idx, { rating: dot })}
                            className={`size-2.5 rounded-full cursor-pointer transition-colors ${
                              dot <= (lang.rating || 5)
                                ? 'bg-brand-500'
                                : 'bg-line hover:bg-ink-3'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-ink-3">Proficiency Badge</label>
                    <div className="mt-1 flex gap-1.5">
                      <select
                        value={
                          ['Native', 'Fluent', 'Conversational', 'Professional', 'Intermediate', 'Elementary'].includes(lang.proficiency)
                            ? lang.proficiency
                            : 'Custom'
                        }
                        onChange={(e) => {
                          if (e.target.value !== 'Custom') {
                            handleLanguageChange(idx, { proficiency: e.target.value });
                          }
                        }}
                        className="rounded-xl border border-line bg-surface px-2 py-1.5 text-xs text-ink focus:outline-none"
                      >
                        <option value="Native">Native</option>
                        <option value="Fluent">Fluent</option>
                        <option value="Conversational">Conversational</option>
                        <option value="Professional">Professional</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Elementary">Elementary</option>
                        <option value="Custom">Custom...</option>
                      </select>
                      <input
                        type="text"
                        value={lang.proficiency}
                        onChange={(e) => handleLanguageChange(idx, { proficiency: e.target.value })}
                        placeholder="e.g. Native / Near-native"
                        className="w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[11px] font-semibold text-ink-3">Subtitle Note</label>
                    <input
                      type="text"
                      value={lang.note || ''}
                      onChange={(e) => handleLanguageChange(idx, { note: e.target.value })}
                      placeholder="e.g. British and American accents, dialect details..."
                      className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
