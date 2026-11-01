import React from 'react';
import Image from 'next/image';
import { Briefcase, Rocket, Code, Smartphone } from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';

export const ExperienceSection: React.FC = () => {
  const { content } = usePortfolio();
  const experiencesData = content.experience;
  return (
    <section id="experience" aria-labelledby="experience-heading" className="mt-14 scroll-mt-20">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2
          id="experience-heading"
          className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-ink"
        >
          <Briefcase className="size-6 shrink-0 text-ink" />
          <span>Experience</span>
        </h2>
      </div>

      <ol className="relative space-y-1">
        {experiencesData.map((exp, index) => {
          const isLast = index === experiencesData.length - 1;

          return (
            <li key={exp.id} className="relative flex gap-4 pb-6">
              {/* Vertical timeline connector */}
              {!isLast && (
                <span
                  className="absolute top-12 bottom-0 left-6 w-px -translate-x-1/2 bg-line"
                  aria-hidden="true"
                />
              )}

              {/* Logo with current role badge */}
              <div className="relative size-12 shrink-0">
                <Image
                  src={exp.company_logo || '/images/bidvers.webp'}
                  alt={`${exp.company} logo`}
                  width={48}
                  height={48}
                  className="size-12 rounded-xl object-cover ring-1 ring-line"
                  unoptimized
                />
                {exp.is_current && (
                  <span
                    className="absolute -right-1 -bottom-1 size-3.5 rounded-full bg-brand-500 ring-2 ring-surface"
                    title="Current role"
                  />
                )}
              </div>

              {/* Role Details */}
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <h3 className="text-base font-semibold text-ink">{exp.position}</h3>
                  <p className="text-meta text-ink-3 tabular-nums">{exp.period}</p>
                </div>

                <p className="text-body text-ink-2">
                  {exp.company_url ? (
                    <a
                      href={exp.company_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline font-medium text-ink"
                    >
                      {exp.company}
                    </a>
                  ) : (
                    <span className="font-medium text-ink">{exp.company}</span>
                  )}
                  <span className="text-ink-3"> · {exp.type}</span>
                  <span className="text-ink-3"> · {exp.workplace_type}</span>
                </p>

                <p className="mt-2.5 text-body leading-relaxed text-ink">{exp.description}</p>

                {/* Stat Highlights (Bidvers) */}
                {exp.highlights && exp.highlights.length > 0 && (
                  <div className="relative rounded-[24px] mt-4 border border-emerald-500/20 bg-gradient-to-br from-emerald-100/50 via-teal-50/30 to-emerald-50/20 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-900/10 p-5 shadow-xs">
                    <dl className="grid gap-x-5 gap-y-4 grid-cols-2 sm:grid-cols-3">
                      {exp.highlights.map((h, i) => (
                        <div
                          key={h.label}
                          className={`flex flex-col-reverse justify-end gap-1 ${
                            i > 0 ? 'sm:border-l sm:border-line sm:pl-5' : ''
                          } ${i === 0 ? 'col-span-2 sm:col-span-1' : ''}`}
                        >
                          <dt className="text-xs text-ink-3 mt-1">{h.label}</dt>
                          <dd className="flex flex-col items-start gap-2">
                            <span className="size-8 rounded-lg bg-white dark:bg-zinc-800 shadow-xs border border-line grid place-items-center">
                              {h.icon === 'rocket' && <Rocket className="size-4 text-emerald-600 dark:text-emerald-400" />}
                              {h.icon === 'code' && <Code className="size-4 text-emerald-600 dark:text-emerald-400" />}
                              {h.icon === 'mobile' && <Smartphone className="size-4 text-emerald-600 dark:text-emerald-400" />}
                            </span>
                            <span
                              className={`font-bold tracking-tight whitespace-nowrap tabular-nums ${
                                i === 0 ? 'text-xl text-emerald-600 dark:text-emerald-400' : 'text-base text-ink'
                              }`}
                            >
                              {h.value}
                            </span>
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                {/* Bullets */}
                {exp.bullet_points && exp.bullet_points.length > 0 && (
                  <ul className="mt-3 list-disc space-y-1.5 pl-5 text-body leading-relaxed text-ink-2 marker:text-ink-3">
                    {exp.bullet_points.map((pt, idx) => (
                      <li key={idx}>{pt}</li>
                    ))}
                  </ul>
                )}

                {/* Sub programs (Interactive Cares) */}
                {exp.sub_programs && exp.sub_programs.length > 0 && (
                  <ol className="mt-4 space-y-3 pl-2">
                    {exp.sub_programs.map((sub) => (
                      <li key={sub.title} className="relative flex gap-3">
                        <span className="relative mt-1.5 size-2.5 shrink-0 rounded-full border-2 border-brand-500 bg-surface" />
                        <div>
                          <p className="text-body font-semibold text-ink">
                            {sub.title}
                            <span className="text-ink-3 font-normal"> · {sub.badge}</span>
                          </p>
                          <p className="mt-0.5 text-body leading-relaxed text-ink-2">
                            {sub.description}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}

                {/* Tags */}
                {exp.tags && exp.tags.length > 0 && (
                  <p className="mt-3 flex flex-wrap gap-1.5">
                    {exp.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-surface-2 px-2 py-0.5 text-meta text-ink-2 ring-1 ring-line"
                      >
                        {tag}
                      </span>
                    ))}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

