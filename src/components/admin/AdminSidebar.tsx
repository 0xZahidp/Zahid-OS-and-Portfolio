'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
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
  LogOut,
  Mail,
  Settings,
  X,
  Bookmark,
  Terminal,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
} from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useInbox } from '@/context/InboxContext';
import { ZahidLogo } from '@/components/ui/ZahidLogo';

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
  | 'library'
  | 'os'
  | 'career'
  | 'health'
  | 'inbox'
  | 'supabase'
  | 'settings'
  | 'security'
  | 'backups';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  supabaseReady: boolean;
  onSave: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  supabaseReady,
  onSave,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { content, isDirty, isSaving } = usePortfolio();
  const { user, signOut, isLocalBypass } = useAdminAuth();
  const { unreadThreadCount } = useInbox();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Read sidebar state from localStorage and set default based on screen size
  useEffect(() => {
    try {
      const isSmallScreen = window.innerWidth < 1024;
      const stored = localStorage.getItem('admin-sidebar-collapsed');
      if (stored !== null) {
        setIsCollapsed(stored === 'true');
      } else if (isSmallScreen) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('admin-sidebar-collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Keyboard shortcut Ctrl/Cmd + B
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        const active = document.activeElement;
        const tag = active?.tagName.toLowerCase();
        const isEditable = (active as HTMLElement)?.isContentEditable;
        if (tag === 'input' || tag === 'textarea' || isEditable) {
          return;
        }
        e.preventDefault();
        toggleCollapsed();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCollapsed]);

  // Keyboard shortcut: close drawer on Escape (mobile)
  useEffect(() => {
    if (!isMobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseMobile?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  const navGroups: {
    label: string;
    items: {
      id: AdminTab;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      badge?: string;
      badgeColor?: string;
    }[];
  }[] = [
    {
      label: 'COMMUNICATION & INBOX',
      items: [
        {
          id: 'inbox' as AdminTab,
          label: 'Inbox & Mail',
          icon: Mail,
          badge: unreadThreadCount > 0 ? `${unreadThreadCount} new` : undefined,
          badgeColor: 'bg-brand-500 text-white font-bold',
        },
      ],
    },
    {
      label: 'PRIVATE & CAREER CRM',
      items: [
        {
          id: 'career' as AdminTab,
          label: 'Career & Pipeline',
          icon: Briefcase,
          badge: 'Private',
          badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
        },
        {
          id: 'health' as AdminTab,
          label: 'Health & Medical',
          icon: HeartPulse,
          badge: 'Private',
          badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        },
      ],
    },
    {
      label: 'IDENTITY & STORY',
      items: [
        {
          id: 'profile' as AdminTab,
          label: 'Profile & Roles',
          icon: User,
          badge: `${content.profile?.roles?.length ?? 0} roles`,
        },
        {
          id: 'bio' as AdminTab,
          label: 'Story & Biography',
          icon: FileText,
          badge: `${content.bioParagraphs?.length ?? 0} para`,
        },
      ],
    },
    {
      label: 'PORTFOLIO & CODE',
      items: [
        {
          id: 'experience' as AdminTab,
          label: 'Experience',
          icon: Briefcase,
          badge: `${content.experience?.length ?? 0}`,
        },
        {
          id: 'projects' as AdminTab,
          label: 'Featured Projects',
          icon: Layers,
          badge: `${content.projects?.length ?? 0}`,
        },
        {
          id: 'skills' as AdminTab,
          label: 'Skills & Tools',
          icon: Sparkles,
          badge: `${content.skills?.length ?? 0}`,
        },
        {
          id: 'github' as AdminTab,
          label: 'GitHub Activity',
          icon: GitBranch,
          badge: 'Live',
        },
      ],
    },
    {
      label: 'DETAILS & SOCIAL',
      items: [
        {
          id: 'facts' as AdminTab,
          label: 'Facts & Languages',
          icon: Globe,
          badge: `${content.languages?.length ?? 0} lang`,
        },
        {
          id: 'socials' as AdminTab,
          label: 'Social Channels',
          icon: Share2,
          badge: `${content.socialLinks?.length ?? 0}`,
        },
        {
          id: 'people' as AdminTab,
          label: 'Who to Follow',
          icon: Users,
          badge: `${content.suggestedPeople?.length ?? 0}`,
        },
        {
          id: 'library' as AdminTab,
          label: 'Library & Curations',
          icon: Bookmark,
          badge: `${(content.libraryData?.aiSkills?.length ?? 5) + (content.libraryData?.bookmarks?.length ?? 5)}`,
        },
      ],
    },
    {
      label: 'ZAHID OS & TOOLS',
      items: [
        {
          id: 'os' as AdminTab,
          label: 'OS / Tools',
          icon: Terminal,
          badge: 'Shortener',
          badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold',
        },
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
        {
          id: 'settings' as AdminTab,
          label: 'Settings & Security',
          icon: Settings,
          badge: 'Passkey',
          badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        },
        { id: 'backups' as AdminTab, label: 'Backup & Snapshots', icon: Archive, badge: 'JSON' },
      ],
    },
  ];

  const handleTabClick = (tabId: AdminTab) => {
    onSelectTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const isCareerTab = activeTab === 'career';

  // Desktop Rail Body (72px)
  const renderRailBody = () => (
    <div className="flex flex-col h-full w-[72px] justify-between">
      {/* Top: Logo + Toggle button */}
      <div className="p-3 border-b border-line flex flex-col items-center gap-3 shrink-0">
        <Link
          href="/"
          title="FolioFrame CMS"
          className="size-9 rounded-xl bg-gradient-to-b from-brand-500 to-brand-700 shadow-sm flex items-center justify-center text-white hover:scale-105 transition-transform"
        >
          <ZahidLogo className="size-5.5 text-white" />
        </Link>
        <button
          type="button"
          onClick={toggleCollapsed}
          className="size-7 rounded-lg border border-line bg-surface-2 flex items-center justify-center text-ink-3 hover:text-ink hover:bg-surface-3 transition-colors cursor-pointer"
          title="Expand sidebar (Ctrl/⌘+B)"
          aria-label="Expand sidebar"
        >
          <ChevronRight className="size-3.5" />
        </button>
      </div>

      {/* Mini Profile Avatar */}
      <div className="p-2 flex justify-center shrink-0">
        <div className="relative group">
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
          <span
            className={`absolute bottom-0 right-0 size-2.5 rounded-full ring-2 ring-surface ${
              supabaseReady ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
          {/* Tooltip on hover */}
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-surface border border-line shadow-xl text-xs font-semibold text-ink whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
            <p className="font-bold">{content.profile.full_name}</p>
            <p className="text-[10px] text-ink-3 font-normal">@{content.profile.username}</p>
          </div>
        </div>
      </div>

      {/* Navigation Icons Only */}
      <nav className="flex-1 overflow-y-auto py-2 space-y-1.5 px-2 flex flex-col items-center [scrollbar-width:none]">
        {navGroups.map((group, groupIdx) => (
          <React.Fragment key={group.label}>
            {groupIdx > 0 && <div className="w-8 border-t border-line/40 my-1 shrink-0" />}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <div key={item.id} className="relative group w-full flex justify-center">
                  <button
                    type="button"
                    onClick={() => handleTabClick(item.id)}
                    className={`size-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      isActive
                        ? 'bg-surface-2 text-emerald-600 dark:text-emerald-400 shadow-xs ring-1 ring-line/80 font-bold'
                        : 'text-ink-3 hover:bg-surface-2/60 hover:text-ink'
                    }`}
                    aria-label={item.label}
                  >
                    <Icon className="size-4.5 shrink-0" />
                  </button>

                  {/* Right-side floating tooltip */}
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-surface border border-line shadow-xl text-xs font-semibold text-ink whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 flex items-center gap-1.5">
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] text-ink-3 font-normal">({item.badge})</span>
                    )}
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </nav>

      {/* Bottom Rail Actions */}
      <div className="p-2 border-t border-line flex flex-col items-center gap-2 shrink-0 bg-surface">
        {/* Hide Save button if career tab is active */}
        {!isCareerTab && (
          <div className="relative group">
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className={`size-10 rounded-xl btn btn-primary flex items-center justify-center shadow-xs cursor-pointer ${
                isDirty ? 'ring-2 ring-emerald-500/40' : ''
              }`}
              title="Save Changes (⌘S)"
              aria-label="Save Changes"
            >
              <Save className="size-4" />
            </button>
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-surface border border-line shadow-xl text-xs font-semibold text-ink whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              {isSaving ? 'Saving...' : 'Save Changes (⌘S)'}
            </div>
          </div>
        )}

        {/* User Logout Button */}
        <div className="relative group">
          <button
            type="button"
            onClick={signOut}
            className="size-8 rounded-lg text-ink-3 hover:text-rose-500 hover:bg-rose-500/10 flex items-center justify-center transition-colors cursor-pointer"
            title="Sign out of CMS"
            aria-label="Sign out"
          >
            <LogOut className="size-4" />
          </button>
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-surface border border-line shadow-xl text-xs font-semibold text-ink whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
            Sign out
          </div>
        </div>
      </div>
    </div>
  );

  // Full Expanded Sidebar Body (280px)
  const renderExpandedBody = (isMobile = false) => (
    <>
      {/* Brand Header */}
      <div className="p-4 border-b border-line flex items-center justify-between shrink-0">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="size-9 rounded-xl bg-gradient-to-b from-brand-500 to-brand-700 shadow-sm flex items-center justify-center text-white transition-transform group-hover:scale-105">
            <ZahidLogo className="size-5.5 text-white" />
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

        <div className="flex items-center gap-1.5">
          <Link
            href="/"
            target="_blank"
            title="Open Live Portfolio"
            className="size-8 rounded-lg border border-line bg-surface-2 flex items-center justify-center text-ink-3 hover:text-ink hover:bg-surface-3 transition-colors"
          >
            <ExternalLink className="size-4" />
          </Link>

          {!isMobile && (
            <button
              type="button"
              onClick={toggleCollapsed}
              className="size-8 rounded-lg border border-line bg-surface-2 flex items-center justify-center text-ink-3 hover:text-ink hover:bg-surface-3 transition-colors cursor-pointer"
              title="Collapse sidebar (Ctrl/⌘+B)"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="size-4" />
            </button>
          )}

          {isMobile && onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="size-8 rounded-lg border border-line bg-surface-2 flex items-center justify-center text-ink-3 hover:text-ink hover:bg-surface-3 transition-colors"
              title="Close menu"
              aria-label="Close navigation menu"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Profile Mini Card */}
      <div className="p-3 mx-3 my-2.5 rounded-xl border border-line bg-surface-2/60 flex items-center gap-3 shrink-0">
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
                    onClick={() => handleTabClick(item.id)}
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
      <div className="p-3 border-t border-line space-y-2 bg-surface shrink-0">
        {/* Hide global save section if Career tab is active */}
        {!isCareerTab && (
          <>
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
              onClick={() => {
                onSave();
                if (isMobile && onCloseMobile) {
                  onCloseMobile();
                }
              }}
              disabled={isSaving}
              className={`w-full btn btn-primary h-9 text-xs font-semibold flex items-center justify-center gap-2 rounded-xl shadow-sm transition-all cursor-pointer ${
                isDirty ? 'ring-2 ring-emerald-500/30' : ''
              }`}
            >
              <Save className="size-3.5" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Changes'}</span>
            </button>
          </>
        )}

        {/* Authenticated User Status & Logout */}
        <div className="pt-2 border-t border-line flex items-center justify-between gap-2 px-1">
          <div className="min-w-0 flex items-center gap-2">
            <div className="size-6.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 font-bold text-[10px] grid place-items-center shrink-0">
              {user?.email ? user.email.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-ink truncate leading-tight">
                {user?.email || (isLocalBypass ? 'Dev Bypass' : 'Admin')}
              </p>
              <p className="text-[9.5px] text-ink-3 truncate leading-none">
                {isLocalBypass ? 'Local Mode' : 'Online Session'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={signOut}
            className="p-1.5 text-ink-3 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Sign out of CMS"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* 1. Desktop Sidebar (expanded 280px vs icon rail 72px) with smooth width animation */}
      <aside
        className={`hidden lg:flex shrink-0 border-r border-line bg-surface flex-col h-screen sticky top-0 select-none transition-[width] duration-200 ease-out overflow-x-hidden ${
          isCollapsed ? 'w-[72px]' : 'w-[280px]'
        }`}
      >
        {isCollapsed ? renderRailBody() : renderExpandedBody(false)}
      </aside>

      {/* 2. Mobile / Tablet Animated Slide-Over Drawer (< 1024px) */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-black/65 backdrop-blur-xs"
              aria-hidden="true"
            />

            {/* Slide-over Drawer Panel */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="relative z-10 w-72 max-w-[85vw] bg-surface border-r border-line flex flex-col h-full shadow-2xl select-none"
            >
              {renderExpandedBody(true)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
