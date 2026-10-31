import React from 'react';
import Image from 'next/image';
import { Briefcase, Rocket, Code, Smartphone } from 'lucide-react';
import { experiencesData } from '@/data/profile';

export const ExperienceSection: React.FC = () => {
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
                  src={exp.company_logo}
                  alt={`${exp.company} logo`}
                  width={48}
                  height={48}
                  className="size-12 rounded-xl object-cover ring-1 ring-line"
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
                {exp.highlights && (
                  <div className="halo relative rounded-3xl mt-3.5 border border-line bg-surface p-4 sm:p-5">
                    <div className="halo-glow" aria-hidden="true" />
                    <dl className="relative z-10 grid gap-x-5 gap-y-4 grid-cols-2 sm:grid-cols-3">
                      {exp.highlights.map((h, i) => (
                        <div
                          key={h.label}
                          className={`flex flex-col-reverse justify-end gap-0.5 ${
                            i > 0 ? 'sm:border-l sm:border-line sm:pl-5' : ''
                          } ${i === 0 ? 'col-span-2 sm:col-span-1' : ''}`}
                        >
                          <dt className="text-meta text-ink-3">{h.label}</dt>
                          <dd className="flex flex-col items-start gap-2">
                            <span className="btn btn-secondary grid size-9 place-items-center rounded-xl">
                              {h.icon === 'rocket' && <Rocket className="size-4.5 text-link" />}
                              {h.icon === 'code' && <Code className="size-4.5 text-link" />}
                              {h.icon === 'mobile' && <Smartphone className="size-4.5 text-link" />}
                            </span>
                            <span
                              className={`font-bold tracking-tight whitespace-nowrap tabular-nums ${
                                i === 0 ? 'text-title text-link' : 'text-lead text-ink'
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
                {exp.bullet_points && (
                  <ul className="mt-3 list-disc space-y-1.5 pl-5 text-body leading-relaxed text-ink-2 marker:text-ink-3">
                    {exp.bullet_points.map((pt, idx) => (
                      <li key={idx}>{pt}</li>
                    ))}
                  </ul>
                )}

                {/* Sub programs (Interactive Cares) */}
                {exp.sub_programs && (
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
                {exp.tags && (
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

