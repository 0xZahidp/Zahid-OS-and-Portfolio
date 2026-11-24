'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Briefcase, ChevronDown, ChevronUp, Rocket, Globe2, Users2 } from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';
import { DEFAULT_COMPANY_LOGO } from '@/lib/constants';

export const ExperienceSection: React.FC = () => {
  const { content, isLoading } = usePortfolio();
  const experiencesData = content.experience || [];
  const [web3Expanded, setWeb3Expanded] = useState(false);

  // Separate normal entries (TwinForce & Career break/Personal goal pursuit) from older Web3 roles
  const normalEntries = experiencesData.filter(
    (exp) =>
      exp.company.toLowerCase().includes('twinforce') ||
      exp.position.toLowerCase().includes('personal goal') ||
      exp.company.toLowerCase().includes('career break')
  );

  const web3Roles = experiencesData.filter(
    (exp) =>
      !exp.company.toLowerCase().includes('twinforce') &&
      !exp.position.toLowerCase().includes('personal goal') &&
      !exp.company.toLowerCase().includes('career break')
  );

  return (
    <section id="experience" aria-labelledby="experience-heading" className="scroll-mt-20 space-y-6">
      <div className="flex items-center gap-2.5">
        <Briefcase className="size-5 text-accent" />
        <h2
          id="experience-heading"
          className="text-xl font-bold tracking-tight text-text"
        >
          Experience
        </h2>
      </div>

      {isLoading ? (
        <div className="space-y-6 animate-pulse" aria-hidden="true">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 rounded-2xl border border-line bg-surface p-5" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* 1. Normal Timeline Entries (TwinForce & Personal Goal Pursuit) */}
          {normalEntries.map((exp) => (
            <div
              key={exp.id}
              className="rounded-2xl border border-line bg-surface p-5 sm:p-6 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="relative size-11 rounded-xl overflow-hidden border border-line bg-surface-2 shrink-0">
                    <Image
                      src={exp.company_logo?.trim() || DEFAULT_COMPANY_LOGO}
                      alt={exp.company}
                      width={44}
                      height={44}
                      className="size-full object-cover"
                      unoptimized
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = DEFAULT_COMPANY_LOGO;
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-text leading-tight">
                      {exp.position}
                    </h3>
                    <div className="mt-1 text-xs text-muted flex items-center gap-1.5 flex-wrap">
                      {exp.company_url ? (
                        <a
                          href={exp.company_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-text hover:text-accent underline decoration-line transition-colors"
                        >
                          {exp.company}
                        </a>
                      ) : (
                        <span className="font-medium text-text">{exp.company}</span>
                      )}
                      <span>·</span>
                      <span>{exp.period}</span>
                    </div>
                  </div>
                </div>

                {exp.is_current && (
                  <span className="rounded-full bg-accent/10 border border-accent/25 px-2.5 py-0.5 text-[11px] font-medium text-accent shrink-0">
                    Current
                  </span>
                )}
              </div>

              {exp.description && (
                <p className="mt-3 text-xs sm:text-sm text-muted leading-relaxed">
                  {exp.description}
                </p>
              )}

              {exp.bullet_points && exp.bullet_points.length > 0 && (
                <ul className="mt-3 space-y-1.5 text-xs text-muted">
                  {exp.bullet_points.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-accent text-sm leading-none mt-0.5">•</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {/* 2. Collapsed Block: Web3 Growth & Community, 2021–2024 */}
          <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-text">
                  Web3 Growth &amp; Community, 2021–2024
                </h3>
                <p className="mt-1 text-xs text-muted">
                  Led marketing, community building, and growth initiatives across 7 blockchain gaming &amp; ecosystem platforms.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setWeb3Expanded(!web3Expanded)}
                className="btn btn-secondary h-8 px-3 rounded-lg text-xs font-semibold gap-1.5 self-start sm:self-center cursor-pointer shrink-0"
              >
                <span>{web3Expanded ? 'Hide roles' : 'See all roles'}</span>
                {web3Expanded ? (
                  <ChevronUp className="size-3.5 text-accent" />
                ) : (
                  <ChevronDown className="size-3.5 text-accent" />
                )}
              </button>
            </div>

            {/* Key Stats Row */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div className="rounded-xl border border-line bg-surface-2/60 p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-accent mb-1">
                  <Rocket className="size-3.5" />
                </div>
                <div className="text-base sm:text-lg font-bold text-text tabular-nums">
                  $5M+
                </div>
                <div className="text-[10px] sm:text-xs text-muted font-medium">
                  Fundraised
                </div>
              </div>

              <div className="rounded-xl border border-line bg-surface-2/60 p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-accent mb-1">
                  <Globe2 className="size-3.5" />
                </div>
                <div className="text-base sm:text-lg font-bold text-text tabular-nums">
                  100+
                </div>
                <div className="text-[10px] sm:text-xs text-muted font-medium">
                  Partnerships
                </div>
              </div>

              <div className="rounded-xl border border-line bg-surface-2/60 p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-accent mb-1">
                  <Users2 className="size-3.5" />
                </div>
                <div className="text-base sm:text-lg font-bold text-text tabular-nums">
                  500K
                </div>
                <div className="text-[10px] sm:text-xs text-muted font-medium">
                  Community
                </div>
              </div>
            </div>

            {/* Expanded Roles List */}
            {web3Expanded && (
              <div className="pt-4 border-t border-line space-y-4 animate-fadeIn">
                {web3Roles.map((role) => (
                  <div
                    key={role.id}
                    className="p-4 rounded-xl border border-line bg-surface-2/40 space-y-1.5"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h4 className="text-sm font-semibold text-text">
                        {role.position} · {role.company}
                      </h4>
                      <span className="text-xs font-mono text-muted">{role.period}</span>
                    </div>
                    {role.description && (
                      <p className="text-xs text-muted leading-relaxed">
                        {role.description}
                      </p>
                    )}
                    {role.bullet_points && role.bullet_points.length > 0 && (
                      <ul className="space-y-1 text-xs text-muted pt-1">
                        {role.bullet_points.slice(0, 2).map((pt, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-accent">•</span>
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
