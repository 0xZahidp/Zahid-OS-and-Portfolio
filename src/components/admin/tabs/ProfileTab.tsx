'use client';

import React from 'react';
import Image from 'next/image';
import { Plus, Trash2, ChevronUp, ChevronDown, User, Building, Sparkles } from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';
import { CompanyLogoUploader } from '@/components/admin/CompanyLogoUploader';

export const ProfileTab: React.FC = () => {
  const { content, updateProfile } = usePortfolio();
  const profile = content.profile;

  const handleRoleChange = (idx: number, field: string, val: string) => {
    const updatedRoles = [...profile.roles];
    updatedRoles[idx] = { ...updatedRoles[idx], [field]: val };
    updateProfile({ roles: updatedRoles });
  };

  const handleAddRole = () => {
    updateProfile({
      roles: [
        ...profile.roles,
        {
          title: 'New Position',
          company: 'Company Name',
          company_url: 'https://example.com',
          company_logo: '/images/bidvers.webp',
        },
      ],
    });
  };

  const handleRemoveRole = (idx: number) => {
    updateProfile({
      roles: profile.roles.filter((_, i) => i !== idx),
    });
  };

  const handleMoveRole = (idx: number, direction: 'up' | 'down') => {
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === profile.roles.length - 1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const updatedRoles = [...profile.roles];
    const temp = updatedRoles[idx];
    updatedRoles[idx] = updatedRoles[targetIdx];
    updatedRoles[targetIdx] = temp;
    updateProfile({ roles: updatedRoles });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 1. Identity & Avatar Card */}
      <div className="card-raised rounded-2xl border border-line bg-surface p-4 sm:p-6 shadow-xs space-y-5 sm:space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-line">
          <User className="size-4.5 text-brand-500" />
          <h2 className="text-sm font-bold text-ink">Personal Identity</h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Avatar URL with Live Preview */}
          <div className="sm:col-span-2 flex items-start gap-4">
            <div className="relative size-16 rounded-2xl overflow-hidden bg-surface-2 border border-line shrink-0 ring-2 ring-line/50">
              <Image
                src={profile.avatar_url || '/images/avatar.webp'}
                alt="Avatar preview"
                fill
                sizes="64px"
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-semibold text-ink">Avatar Image URL</label>
              <input
                type="text"
                value={profile.avatar_url}
                onChange={(e) => updateProfile({ avatar_url: e.target.value })}
                placeholder="/images/avatar.webp or https://..."
                className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2 text-xs text-ink focus:border-brand-500 focus:bg-surface focus:outline-none transition-all"
              />
              <p className="text-[11px] text-ink-3">
                Local public path (e.g. <code>/images/avatar.webp</code>) or full HTTPS image URL.
              </p>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink">Full Name</label>
            <input
              type="text"
              value={profile.full_name}
              onChange={(e) => updateProfile({ full_name: e.target.value })}
              className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2 text-xs text-ink focus:border-brand-500 focus:bg-surface focus:outline-none transition-all font-medium"
            />
          </div>

          {/* Username / Handle */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink">Username Handle</label>
            <div className="flex items-center rounded-xl border border-line bg-surface-2 px-3 focus-within:border-brand-500 focus-within:bg-surface transition-all">
              <span className="text-xs text-ink-3">@</span>
              <input
                type="text"
                value={profile.username}
                onChange={(e) => updateProfile({ username: e.target.value })}
                className="w-full bg-transparent px-1.5 py-2 text-xs text-ink focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Headline */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-ink">Headline / Catchphrase</label>
            <input
              type="text"
              value={profile.headline}
              onChange={(e) => updateProfile({ headline: e.target.value })}
              placeholder="e.g. Less talk, show me code!"
              className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2 text-xs text-ink focus:border-brand-500 focus:bg-surface focus:outline-none transition-all"
            />
          </div>

          {/* Availability Status */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-ink">Availability Badge</label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2 flex-1 focus-within:border-brand-500 focus-within:bg-surface transition-all">
                <span className="size-2 rounded-full bg-emerald-500 shrink-0 animate-ping" />
                <input
                  type="text"
                  value={profile.availability || ''}
                  onChange={(e) => updateProfile({ availability: e.target.value })}
                  placeholder="e.g. Open to new conversations"
                  className="w-full bg-transparent text-xs text-ink focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink">City / Location</label>
            <input
              type="text"
              value={profile.location}
              onChange={(e) => updateProfile({ location: e.target.value })}
              className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2 text-xs text-ink focus:border-brand-500 focus:bg-surface focus:outline-none transition-all"
            />
          </div>

          {/* Timezone */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink">Timezone Identifier</label>
            <input
              type="text"
              value={profile.timezone}
              onChange={(e) => updateProfile({ timezone: e.target.value })}
              placeholder="e.g. Asia/Dhaka"
              className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2 text-xs text-ink focus:border-brand-500 focus:bg-surface focus:outline-none transition-all font-mono"
            />
          </div>
        </div>
      </div>

      {/* 2. Hero Affiliation Roles Card */}
      <div className="card-raised rounded-2xl border border-line bg-surface p-4 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-line">
          <div className="flex items-center gap-2.5">
            <Building className="size-4.5 text-brand-500" />
            <div>
              <h2 className="text-sm font-bold text-ink">Header Roles & Companies</h2>
              <p className="text-[11px] text-ink-3">Displayed under your name in the main hero header.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddRole}
            className="btn btn-secondary h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="size-3.5" />
            <span>Add Role</span>
          </button>
        </div>

        {/* Clear Image Guideline Banner */}
        <div className="p-3.5 rounded-xl border border-brand-500/20 bg-brand-500/5 text-xs text-ink-2 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-brand-700 dark:text-brand-300">
            <Sparkles className="size-3.5" />
            <span>Company Logo & Icon Upload Instructions</span>
          </div>
          <p className="text-[11px] leading-relaxed text-ink-3">
            • <strong>Target Dimensions</strong>: Exactly <strong>64 × 64 px</strong> (1:1 square ratio) for high-DPI retina sharpness.
            <br />
            • <strong>Automatic Optimization</strong>: Upload any image of any size (e.g. 500×500, 1080p, or 4K photo). It is automatically center-cropped and optimized to <strong>exact 64×64 px</strong> without distortion or file bloat.
            <br />
            • <strong>Recommended Formats</strong>: Transparent PNG, SVG, or WebP for optimal contrast in dark and light modes.
          </p>
        </div>

        <div className="space-y-3">
          {profile.roles.map((role, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-line bg-surface-2/60 hover:bg-surface-2 transition-all space-y-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative size-9 rounded-lg overflow-hidden bg-surface border border-line shrink-0 flex items-center justify-center">
                    <Image
                      src={role.company_logo || '/images/bidvers.webp'}
                      alt={role.company}
                      fill
                      sizes="36px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-ink">
                      {role.title || 'Role Title'}
                    </span>
                    <span className="text-xs text-ink-3 ml-1.5">
                      at {role.company || 'Company'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMoveRole(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg text-ink-3 hover:text-ink disabled:opacity-30"
                    title="Move up"
                  >
                    <ChevronUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveRole(idx, 'down')}
                    disabled={idx === profile.roles.length - 1}
                    className="p-1.5 rounded-lg text-ink-3 hover:text-ink disabled:opacity-30"
                    title="Move down"
                  >
                    <ChevronDown className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveRole(idx)}
                    className="p-1.5 rounded-lg text-ink-3 hover:text-rose-500 transition-colors ml-1"
                    title="Delete role"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Company Logo Uploader with Auto-Optimization */}
              <div className="pt-2 border-t border-line/60">
                <CompanyLogoUploader
                  currentLogo={role.company_logo || ''}
                  companyName={role.company}
                  onLogoChange={(newLogoUrl) => handleRoleChange(idx, 'company_logo', newLogoUrl)}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3 pt-1">
                <div>
                  <label className="text-[11px] font-medium text-ink-3">Title</label>
                  <input
                    type="text"
                    value={role.title}
                    onChange={(e) => handleRoleChange(idx, 'title', e.target.value)}
                    placeholder="e.g. CTO"
                    className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-ink-3">Company Name</label>
                  <input
                    type="text"
                    value={role.company}
                    onChange={(e) => handleRoleChange(idx, 'company', e.target.value)}
                    placeholder="e.g. Bidvers"
                    className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-ink-3">Website Link</label>
                  <input
                    type="text"
                    value={role.company_url || ''}
                    onChange={(e) => handleRoleChange(idx, 'company_url', e.target.value)}
                    placeholder="https://..."
                    className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
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
