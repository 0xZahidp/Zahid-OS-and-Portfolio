'use client';

import React, { useState } from 'react';
import { Info, ChevronDown } from 'lucide-react';

export const FocusCredits: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <section
      aria-label="Focus sounds credits and licenses"
      className="rounded-2xl border border-line bg-surface-2 overflow-hidden transition-all duration-200"
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-surface-3/50 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <Info className="size-4 text-ink-3" />
          <span className="text-xs sm:text-sm font-semibold text-ink">Credits</span>
        </div>
        <ChevronDown
          className={`size-4 text-ink-3 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="px-4 pb-5 sm:px-5 space-y-3 text-xs text-ink-2 border-t border-line/60 pt-3">
          <p className="leading-relaxed">
            52 recordings come from{' '}
            <a
              href="https://github.com/remvze/moodist"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
            >
              Moodist
            </a>
            , an{' '}
            <a
              href="https://github.com/remvze/moodist"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
            >
              open-source
            </a>{' '}
            ambient sound app by remvze. Its sounds are under the Pixabay License or CC0. Thank you!
          </p>

          <ul className="space-y-1.5 text-[11px] text-ink-3 list-disc list-inside">
            <li>
              <strong className="text-ink-2 font-medium">Tin roof:</strong>{' '}
              <a
                href="https://freesound.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Rain on Tin Roof - 1 Hour
              </a>{' '}
              by archerjosiah · CC0
            </li>
            <li>
              <strong className="text-ink-2 font-medium">Forest:</strong>{' '}
              <a
                href="https://freesound.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Woods ambience in Missouri, some birds singing and soft breeze
              </a>{' '}
              by felix.blume · CC0
            </li>
            <li>
              <strong className="text-ink-2 font-medium">Campfire:</strong> Campfire crackling by reespeck · CC0
            </li>
            <li>
              <strong className="text-ink-2 font-medium">Thunder:</strong> Distant rolling thunder by inchadney · CC0
            </li>
            <li>
              <strong className="text-ink-2 font-medium">River:</strong> Mountain river rapids by soundmary · CC0
            </li>
            <li>
              <strong className="text-ink-2 font-medium">Noise &amp; Binaural Beats:</strong> Procedural Web Audio synthesis generators
            </li>
          </ul>
        </div>
      )}
    </section>
  );
};
