'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  User,
  FileText,
  Briefcase,
  Layers,
  Sparkles,
  GitBranch,
  Globe,
  Share2,
  Users,
  Database,
  Archive,
  ExternalLink,
  Save,
} from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';

export type AdminTab =
  | 'profile'
  | 'bio'
  | 'github'
  | 'experience'
  | 'projects'
  | 'skills'
  | 'facts'
  | 'socials'
  | 'people'
  | 'supabase'
  | 'backups';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  supabaseReady: boolean;
  onSave: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  supabaseReady,
  onSave,
}) => {
  const { content, isDirty, isSaving } = usePortfolio();

  const navGroups = [
    {
      label: 'IDENTITY & STORY',
      items: [
        { id: 'profile' as AdminTab, label: 'Profile & Roles', icon: User, badge: `${content.profile.roles.length} roles` },
        { id: 'bio' as AdminTab, label: 'Story & Biography', icon: FileText, badge: `${content.bioParagraphs.length} para` },
      ],
    },
    {
      label: 'PORTFOLIO & CODE',
      items: [
        { id: 'experience' as AdminTab, label: 'Experience', icon: Briefcase, badge: `${content.experience.length}` },
        { id: 'projects' as AdminTab, label: 'Featured Projects', icon: Layers, badge: `${content.projects.length}` },
        { id: 'skills' as AdminTab, label: 'Skills & Tools', icon: Sparkles, badge: `${content.skills.length}` },
        { id: 'github' as AdminTab, label: 'GitHub Activity', icon: GitBranch, badge: 'Live' },
      ],
    },
    {
      label: 'DETAILS & SOCIAL',
      items: [
        { id: 'facts' as AdminTab, label: 'Facts & Languages', icon: Globe, badge: `${content.languages.length} lang` },
        { id: 'socials' as AdminTab, label: 'Social Channels', icon: Share2, badge: `${content.socialLinks.length}` },
        { id: 'people' as AdminTab, label: 'Who to Follow', icon: Users, badge: `${content.suggestedPeople.length}` },
      ],
    },
    {
      label: 'SYSTEM & CLOUD',
      items: [
        {
          id: 'supabase' as AdminTab,
          label: 'Supabase Cloud',
          icon: Database,
          badge: supabaseReady ? 'Ready' : 'Setup',
          badgeColor: supabaseReady
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        },
        { id: 'backups' as AdminTab, label: 'Backup & Snapshots', icon: Archive, badge: 'JSON' },
      ],
    },
  ];

  return (
    <aside className="w-68 shrink-0 border-r border-line bg-surface flex flex-col h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="p-4.5 border-b border-line flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="size-9 rounded-xl bg-gradient-to-b from-brand-500 to-brand-700 shadow-sm flex items-center justify-center text-white font-black text-lg transition-transform group-hover:scale-105">
            Z
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-ink">FolioFrame</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                CMS
              </span>
            </div>
            <p className="text-[11px] text-ink-3">Content Studio</p>
          </div>
        </Link>

        <Link
          href="/"
          target="_blank"
          title="Open Live Portfolio"
          className="size-8 rounded-lg border border-line bg-surface-2 flex items-center justify-center text-ink-3 hover:text-ink hover:bg-surface-3 transition-colors"
        >
          <ExternalLink className="size-4" />
        </Link>
      </div>

      {/* Profile Mini Card */}
      <div className="p-3 mx-3 my-2.5 rounded-xl border border-line bg-surface-2/60 flex items-center gap-3">
        <div className="relative size-10 rounded-full overflow-hidden bg-surface-3 shrink-0 ring-1 ring-line">
          {content.profile.avatar_url ? (
            <Image
              src={content.profile.avatar_url}
              alt={content.profile.full_name}
              fill
              sizes="40px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="size-full flex items-center justify-center font-bold text-xs text-ink-3">
              {content.profile.full_name.charAt(0)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-ink truncate leading-tight">
            {content.profile.full_name}
          </p>
          <p className="text-[11px] text-ink-3 truncate">
            @{content.profile.username}
          </p>
        </div>
        <span
          className={`size-2 rounded-full shrink-0 ${
            supabaseReady
              ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
              : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
          }`}
          title={supabaseReady ? 'Supabase Connected' : 'Supabase Table Setup Required'}
        />
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4 [scrollbar-width:thin]">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            <h3 className="px-2 text-[10px] font-bold tracking-wider text-ink-3/80 uppercase">
              {group.label}
            </h3>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-surface-2 font-semibold text-ink shadow-xs ring-1 ring-line/80'
                        : 'text-ink-2 hover:bg-surface-2/60 hover:text-ink'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={`size-4 shrink-0 transition-colors ${
                          isActive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-ink-3'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md border ${
                          item.badgeColor
                            ? item.badgeColor
                            : isActive
                            ? 'bg-surface border-line text-ink font-semibold'
                            : 'bg-surface-2 border-line/50 text-ink-3'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Quick Action Footer */}
      <div className="p-3 border-t border-line space-y-2 bg-surface">
        {/* Unsaved changes status */}
        <div className="flex items-center justify-between px-1 text-[11px] text-ink-3">
          <span className="flex items-center gap-1.5">
            <span
              className={`size-2 rounded-full ${
                isDirty ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
              }`}
            />
            <span>{isDirty ? 'Unsaved changes' : 'All synced'}</span>
          </span>
          <span className="text-[10px] font-mono text-ink-3 bg-surface-2 px-1.5 py-0.5 rounded border border-line">
            ⌘S / Ctrl+S
          </span>
        </div>

        {/* Quick Save Button */}
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className={`w-full btn btn-primary h-9 text-xs font-semibold flex items-center justify-center gap-2 rounded-xl shadow-sm transition-all ${
            isDirty ? 'ring-2 ring-emerald-500/30' : ''
          }`}
        >
          <Save className="size-3.5" />
          <span>{isSaving ? 'Saving Changes...' : 'Save Changes'}</span>
        </button>
      </div>
    </aside>
  );
};
