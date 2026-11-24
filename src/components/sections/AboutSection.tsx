'use client';

import React, { useState } from 'react';
import {
  User,
  Globe,
  ChevronDown,
  ChevronUp,
  Languages,
  Check,
} from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';

export const AboutSection: React.FC = () => {
  const { content } = usePortfolio();
  const bioParagraphs = content.bioParagraphs || [];
  const languagesData = content.languages || [];
  const works = content.worksSettings || {
    heading: 'Works remote-first worldwide',
    description: 'Async-oriented communication, autonomous execution, and transparent documentation.',
    chips: ['Remote-first', 'GMT+6 (Dhaka)', 'Global overlap', 'Clear technical writing'],
  };
  const [expanded, setExpanded] = useState(false);

  return (
    <section id="about" aria-labelledby="about-heading" className="scroll-mt-20 space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-2.5">
        <User className="size-5 text-accent" />
        <h2
          id="about-heading"
          className="text-xl font-bold tracking-tight text-text"
        >
          About
        </h2>
      </div>

      {/* Bio Paragraphs with Read More / Read Less */}
      <div className="space-y-3.5 text-sm sm:text-base leading-relaxed text-muted font-normal">
        <p className="text-text font-normal">
          {bioParagraphs[0]}
          {!expanded && bioParagraphs.length > 1 && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="ml-2 inline-flex items-center gap-0.5 font-semibold text-accent hover:underline cursor-pointer"
            >
              Read more
              <ChevronDown className="size-4" />
            </button>
          )}
        </p>

        {expanded && (
          <div className="space-y-3 pt-1 animate-fadeIn">
            {bioParagraphs.slice(1).map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="inline-flex items-center gap-0.5 font-semibold text-accent hover:underline cursor-pointer pt-1"
            >
              Read less
              <ChevronUp className="size-4" />
            </button>
          </div>
        )}
      </div>

      {/* Working Style: Merged into ONE slim row instead of a card */}
      <div className="rounded-xl border border-line bg-surface p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-text font-medium">
          <Globe className="size-4 text-accent shrink-0" />
          <span>Remote-first · Async-oriented · GMT+6 (flexible with US/EU/APAC)</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {works.chips?.slice(0, 3).map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-mono text-muted border border-line"
            >
              <Check className="size-3 text-accent" />
              <span>{chip}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Languages: Clean Full-Width Row */}
      {languagesData && languagesData.length > 0 && (
        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
            <Languages className="size-4 text-accent" />
            <span>Languages</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {languagesData.map((lang, idx) => (
              <div key={lang.id || lang.name || idx} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-text">{lang.name}</span>
                </div>
                {/* 5-dot rating meter */}
                <div
                  className="flex gap-1"
                  role="meter"
                  aria-valuemin={0}
                  aria-valuemax={5}
                  aria-valuenow={lang.rating || 5}
                  aria-label={`${lang.name}: ${lang.proficiency}`}
                >
                  {[1, 2, 3, 4, 5].map((dotIdx) => (
                    <span
                      key={dotIdx}
                      className={`h-1 flex-1 rounded-full ${
                        dotIdx <= (lang.rating || 5)
                          ? 'bg-accent'
                          : 'bg-line'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-xs text-muted font-medium pt-0.5">
                  {lang.proficiency}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
