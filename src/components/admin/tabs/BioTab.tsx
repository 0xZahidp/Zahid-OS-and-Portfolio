'use client';

import React from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, FileText } from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';

export const BioTab: React.FC = () => {
  const { content, updateBioParagraphs } = usePortfolio();
  const paragraphs = content.bioParagraphs;

  const handleParagraphChange = (idx: number, text: string) => {
    const updated = [...paragraphs];
    updated[idx] = text;
    updateBioParagraphs(updated);
  };

  const handleAddParagraph = () => {
    updateBioParagraphs([
      ...paragraphs,
      'New paragraph detailing your journey, technical milestones, or personal philosophy.',
    ]);
  };

  const handleRemoveParagraph = (idx: number) => {
    if (paragraphs.length <= 1) {
      alert('You must have at least one bio paragraph.');
      return;
    }
    updateBioParagraphs(paragraphs.filter((_, i) => i !== idx));
  };

  const handleMove = (idx: number, direction: 'up' | 'down') => {
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === paragraphs.length - 1) return;
    const target = direction === 'up' ? idx - 1 : idx + 1;
    const updated = [...paragraphs];
    const temp = updated[idx];
    updated[idx] = updated[target];
    updated[target] = temp;
    updateBioParagraphs(updated);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="card-raised rounded-2xl border border-line bg-surface p-4 sm:p-6 shadow-xs space-y-5 sm:space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-line">
          <div className="flex items-center gap-2.5">
            <FileText className="size-4.5 text-brand-500" />
            <div>
              <h2 className="text-sm font-bold text-ink">About Me & Biography</h2>
              <p className="text-[11px] text-ink-3">
                Each paragraph renders as a distinct narrative block in your About section.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddParagraph}
            className="btn btn-secondary h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="size-3.5" />
            <span>Add Paragraph</span>
          </button>
        </div>

        <div className="space-y-4">
          {paragraphs.map((p, idx) => {
            const wordCount = p.trim().split(/\s+/).filter(Boolean).length;
            const charCount = p.length;

            return (
              <div
                key={idx}
                className="p-4 rounded-xl border border-line bg-surface-2/60 hover:bg-surface-2 transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink flex items-center gap-2">
                    <span className="size-5 rounded-md bg-surface border border-line flex items-center justify-center text-[10px] text-ink-3 font-mono">
                      {idx + 1}
                    </span>
                    Paragraph {idx + 1}
                  </span>

                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-ink-3 mr-2 font-mono">
                      {wordCount} words · {charCount} chars
                    </span>
                    <button
                      type="button"
                      onClick={() => handleMove(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg text-ink-3 hover:text-ink disabled:opacity-30"
                      title="Move up"
                    >
                      <ChevronUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(idx, 'down')}
                      disabled={idx === paragraphs.length - 1}
                      className="p-1.5 rounded-lg text-ink-3 hover:text-ink disabled:opacity-30"
                      title="Move down"
                    >
                      <ChevronDown className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveParagraph(idx)}
                      disabled={paragraphs.length <= 1}
                      className="p-1.5 rounded-lg text-ink-3 hover:text-rose-500 disabled:opacity-30 transition-colors ml-1"
                      title="Delete paragraph"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                <textarea
                  value={p}
                  onChange={(e) => handleParagraphChange(idx, e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-line bg-surface p-3.5 text-xs text-ink leading-relaxed focus:border-brand-500 focus:outline-none transition-all resize-y"
                  placeholder="Write paragraph text..."
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

