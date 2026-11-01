'use client';

import React, { useState } from 'react';
import { MapPin, Briefcase, Languages, Plus, Trash2, X } from 'lucide-react';
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
  const languages = content.languages;

  const [newChip, setNewChip] = useState('');

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
    const newLang: LanguageSkill = {
      name: 'New Language',
      rating: 3,
      proficiency: 'Conversational',
      note: 'Basic speaking & reading',
      hasVoice: false,
    };
    updateLanguages([...languages, newLang]);
  };

  const handleRemoveLanguage = (idx: number) => {
    updateLanguages(languages.filter((_, i) => i !== idx));
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
        <div className="flex items-center justify-between pb-4 border-b border-line">
          <div className="flex items-center gap-2.5">
            <Languages className="size-4.5 text-brand-500" />
            <div>
              <h2 className="text-sm font-bold text-ink">Language Fluency</h2>
              <p className="text-[11px] text-ink-3">
                Languages, rating progress segments (1 to 5), and level badges.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddLanguage}
            className="btn btn-secondary h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="size-3.5" />
            <span>Add Language</span>
          </button>
        </div>

        <div className="space-y-4">
          {languages.map((lang, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-line bg-surface-2/60 space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-ink">{lang.name}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                    {lang.proficiency}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveLanguage(idx)}
                  className="p-1.5 text-ink-3 hover:text-rose-500 transition-colors"
                  title="Delete language"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-[11px] font-semibold text-ink-3">Language Name</label>
                  <input
                    type="text"
                    value={lang.name}
                    onChange={(e) => handleLanguageChange(idx, { name: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-ink-3">
                    Fluency Dots: {lang.rating} / 5
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={lang.rating}
                    onChange={(e) => handleLanguageChange(idx, { rating: Number(e.target.value) })}
                    className="mt-2 w-full accent-brand-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-ink-3">Proficiency Badge</label>
                  <input
                    type="text"
                    value={lang.proficiency}
                    onChange={(e) => handleLanguageChange(idx, { proficiency: e.target.value })}
                    placeholder="e.g. Native / Near-native"
                    className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[11px] font-semibold text-ink-3">Subtitle Note</label>
                  <input
                    type="text"
                    value={lang.note || ''}
                    onChange={(e) => handleLanguageChange(idx, { note: e.target.value })}
                    placeholder="e.g. British and American accents"
                    className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
