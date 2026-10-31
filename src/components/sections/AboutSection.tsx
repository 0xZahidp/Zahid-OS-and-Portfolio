'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  MapPin,
  Globe,
  Sun,
  Moon,
  Volume2,
  Check,
  ChevronDown,
  ChevronUp,
  Languages,
} from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';

export const AboutSection: React.FC = () => {
  const { content } = usePortfolio();
  const bioParagraphs = content.bioParagraphs;
  const languagesData = content.languages;
  const basedIn = content.basedInSettings;
  const works = content.worksSettings;
  const [expanded, setExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState('5:49 PM');
  const [isDay, setIsDay] = useState(false);
  const [tooltipLang, setTooltipLang] = useState<string | null>(null);

  // Live time in Dhaka
  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const options: Intl.DateTimeFormatOptions = {
          timeZone: 'Asia/Dhaka',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        };
        const formatted = new Intl.DateTimeFormat('en-US', options).format(now);
        setCurrentTime(formatted);

        // Calculate hour in Dhaka
        const dhakaDate = new Date(
          now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })
        );
        const hours = dhakaDate.getHours();
        setIsDay(hours >= 6 && hours < 18);
      } catch {
        setCurrentTime('5:49 PM');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="about" aria-labelledby="about-heading" className="scroll-mt-20">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2
          id="about-heading"
          className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-ink"
        >
          <User className="size-6 shrink-0 text-ink" />
          <span>About</span>
        </h2>
      </div>

      {/* Bio Paragraphs with Read More / Read Less */}
      <div className="space-y-3 text-body leading-relaxed text-ink">
        <p>
          {bioParagraphs[0]}
          {!expanded && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="ml-1 inline-flex items-center gap-0.5 font-semibold text-link hover:underline cursor-pointer"
            >
              Read more
              <ChevronDown className="size-4" />
            </button>
          )}
        </p>

        {expanded && (
          <>
            <p className="animate-fadeIn">{bioParagraphs[1]}</p>
            <p className="animate-fadeIn">{bioParagraphs[2]}</p>
            <p className="animate-fadeIn">
              {bioParagraphs[3]}
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="ml-1 inline-flex items-center gap-0.5 font-semibold text-link hover:underline cursor-pointer"
              >
                Read less
                <ChevronUp className="size-4" />
              </button>
            </p>
          </>
        )}
      </div>

      {/* Quick Facts Grid */}
      <div className="mt-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Based In Card with Soft Mint Gradient (Halo + Glass + Cover Blobs) */}
          <div className="halo relative rounded-3xl" data-halo="">
            <div className="halo-glow" aria-hidden="true" />
            <div className="glass h-full overflow-hidden p-5">
              <div className="cover absolute inset-0 -z-10 opacity-70" aria-hidden="true">
                <span
                  className="cover-blob"
                  style={{
                    ['--blob' as string]: 'var(--cover-3)',
                    top: '-45%',
                    left: '-12%',
                    ['--dur' as string]: '24s',
                    ['--delay' as string]: '0s',
                  }}
                />
                <span
                  className="cover-blob"
                  style={{
                    ['--blob' as string]: 'var(--cover-4)',
                    top: '15%',
                    left: '8%',
                    ['--dur' as string]: '27s',
                    ['--delay' as string]: '-4s',
                  }}
                />
                <span
                  className="cover-blob"
                  style={{
                    ['--blob' as string]: 'var(--cover-5)',
                    top: '-35%',
                    left: '32%',
                    ['--dur' as string]: '29s',
                    ['--delay' as string]: '-8s',
                  }}
                />
                <span
                  className="cover-blob"
                  style={{
                    ['--blob' as string]: 'var(--cover-6)',
                    top: '5%',
                    left: '55%',
                    ['--dur' as string]: '23s',
                    ['--delay' as string]: '-12s',
                  }}
                />
                <span
                  className="cover-blob"
                  style={{
                    ['--blob' as string]: 'var(--cover-1)',
                    top: '-30%',
                    left: '76%',
                    ['--dur' as string]: '31s',
                    ['--delay' as string]: '-6s',
                  }}
                />
                <span
                  className="cover-blob"
                  style={{
                    ['--blob' as string]: 'var(--cover-2)',
                    top: '45%',
                    left: '38%',
                    ['--dur' as string]: '33s',
                    ['--delay' as string]: '-16s',
                    width: '45%',
                  }}
                />
              </div>
              <div className="absolute inset-0 -z-10 bg-surface/45 backdrop-blur-2xl" aria-hidden="true" />
              <div className="halo-spot" aria-hidden="true" />
              <div className="relative">
                <div className="group" data-clock data-tz="Asia/Dhaka" data-city="Dhaka">
                  <p className="flex items-center gap-2 text-meta font-medium text-ink-2">
                    <MapPin className="size-4 text-link" />
                    <span>Based in</span>
                  </p>
                  <p className="mt-1 text-lead font-semibold text-ink">
                    {basedIn.city}, {basedIn.country}
                  </p>

                  <div className="mt-5 flex items-end gap-2">
                    <span className="inline-grid text-[2.25rem] leading-none font-bold tracking-tight tabular-nums text-ink">
                      <span className="invisible col-start-1 row-start-1" aria-hidden="true">12:00 AM</span>
                      <span className="invisible col-start-1 row-start-1" aria-hidden="true">12:00 PM</span>
                      <span className="col-start-1 row-start-1" data-clock-time>{currentTime}</span>
                    </span>
                    <span className="pb-1 text-meta font-medium text-ink-2">
                      {basedIn.gmtOffset}
                    </span>
                  </div>

                  <p className="mt-2 inline-flex items-center gap-1.5 text-meta text-ink-2">
                    {isDay ? (
                      <>
                        <Sun className="size-4 text-amber-500" />
                        <span>Daytime in {basedIn.city}</span>
                      </>
                    ) : (
                      <>
                        <Moon className="size-4 text-indigo-400 dark:text-indigo-300" />
                        <span>Evening in {basedIn.city}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Works Remote-First Card */}
          <div className="card-raised p-5">
            <p className="flex items-center gap-2 text-meta font-medium text-ink-2">
              <Globe className="size-4 text-link" />
              <span>Works</span>
            </p>
            <p className="mt-1 text-lead font-semibold text-ink">{works.heading}</p>
            <p className="mt-1 text-meta text-ink-2 leading-normal">
              {works.description}
            </p>
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {works.chips.map((item) => (
                <li
                  key={item}
                  className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-2 py-0.5 text-meta text-ink-2 ring-1 ring-line"
                >
                  <Check className="size-3.5 text-link" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Languages Card (Spans across 2 columns) */}
          <div className="card-raised p-5 sm:col-span-2">
            <p className="flex items-center gap-2 text-meta font-medium text-ink-2">
              <Languages className="size-4 text-link" />
              <span>Languages</span>
            </p>

            <ul className="mt-4 grid gap-5 sm:grid-cols-3">
              {languagesData.map((lang) => (
                <li key={lang.name} className="group" data-voice-item>
                  <div className="flex h-7 items-center gap-2">
                    <span className="text-body font-semibold text-ink">
                      {lang.name}
                    </span>
                    <div className="relative inline-flex items-center">
                      <button
                        type="button"
                        onMouseEnter={() => setTooltipLang(lang.name)}
                        onMouseLeave={() => setTooltipLang(null)}
                        aria-label={`${lang.name} voice note coming soon`}
                        className="btn btn-secondary grid size-7 place-items-center rounded-full cursor-pointer hover:bg-surface-2"
                      >
                        <Volume2 className="size-3.5 text-ink-3" />
                      </button>

                      {tooltipLang === lang.name && (
                        <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-md bg-ink px-2 py-0.5 text-micro font-medium whitespace-nowrap text-surface shadow-md">
                          Recording soon
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 5-bar rating meter */}
                  <div
                    className="mt-2 flex gap-1"
                    role="meter"
                    aria-valuemin={0}
                    aria-valuemax={5}
                    aria-valuenow={lang.rating}
                    aria-label={`${lang.name}: ${lang.proficiency}`}
                  >
                    {[1, 2, 3, 4, 5].map((idx) => (
                      <span
                        key={idx}
                        className={`h-1.5 flex-1 rounded-full ${
                          idx <= lang.rating
                            ? 'bg-gradient-to-r from-brand-400 to-brand-600'
                            : 'bg-line'
                        }`}
                      />
                    ))}
                  </div>

                  <span className="badge mt-3">{lang.proficiency}</span>
                  {lang.note && (
                    <p className="mt-1.5 text-meta text-ink-3">{lang.note}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
