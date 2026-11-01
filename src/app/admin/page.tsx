'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePortfolio } from '@/context/PortfolioContext';
import { AdminSidebar, AdminTab } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { LivePreviewPane } from '@/components/admin/LivePreviewPane';
import { AdminAuthProvider, useAdminAuth } from '@/context/AdminAuthContext';
import { AdminLogin } from '@/components/admin/AdminLogin';
import { Loader2 } from 'lucide-react';

// Tabs
import { ProfileTab } from '@/components/admin/tabs/ProfileTab';
import { BioTab } from '@/components/admin/tabs/BioTab';
import { GitHubTab } from '@/components/admin/tabs/GitHubTab';
import { ExperienceTab } from '@/components/admin/tabs/ExperienceTab';
import { ProjectsTab } from '@/components/admin/tabs/ProjectsTab';
import { SkillsTab } from '@/components/admin/tabs/SkillsTab';
import { FactsTab } from '@/components/admin/tabs/FactsTab';
import { SocialsTab } from '@/components/admin/tabs/SocialsTab';
import { PeopleTab } from '@/components/admin/tabs/PeopleTab';
import { SupabaseTab } from '@/components/admin/tabs/SupabaseTab';
import { SettingsTab } from '@/components/admin/tabs/SettingsTab';
import { InboxTab } from '@/components/admin/tabs/InboxTab';
import { BackupsTab } from '@/components/admin/tabs/BackupsTab';

const TAB_META: Record<AdminTab, { title: string; description: string }> = {
  inbox: {
    title: 'Inbox & Client Communication',
    description: 'Read incoming inquiries, star messages, and compose/dispatch emails via Resend.',
  },
  profile: {
    title: 'Personal Identity & Hero Roles',
    description: 'Full name, avatar, headline, availability beacon, and company affiliations.',
  },
  bio: {
    title: 'Biography & Narrative Blocks',
    description: 'Multi-paragraph story rendered in the About section of your portfolio.',
  },
  github: {
    title: 'GitHub Sync & Access Token',
    description: 'Configure your GitHub handle, personal token, live stats, and pinned repos.',
  },
  experience: {
    title: 'Career History & Timeline',
    description: 'Professional engineering positions, companies, dates, and achievements.',
  },
  projects: {
    title: 'Featured Portfolio Projects',
    description: 'Showcase web, mobile, SaaS, and open source products you built.',
  },
  skills: {
    title: 'Skills & Tech Stack',
    description: 'Categorized 3D tactile pills across AI, Frameworks, and Tools.',
  },
  facts: {
    title: 'Facts, Location & Languages',
    description: 'Based In clock widget, Remote work setups, and language fluency sliders.',
  },
  socials: {
    title: 'Social Channels & Presence',
    description: 'Connect your GitHub, X/Twitter, LinkedIn, and social platform links.',
  },
  people: {
    title: 'Recommended Creators & Peers',
    description: 'Right sidebar recommendations for creators, mentors, and founders to follow.',
  },
  supabase: {
    title: 'Supabase Cloud Integration',
    description: 'Real-time database connection diagnostics, schema migration, and tables.',
  },
  settings: {
    title: 'Settings, Security & Passkeys',
    description: 'Change your password, register Apple Touch ID / YubiKey passkeys, and manage account preferences.',
  },
  security: {
    title: 'Security, Passkeys & Session',
    description: 'Register biometric Passkeys (Apple Touch ID, YubiKey) and manage auth methods.',
  },
  backups: {
    title: 'Backups, Snapshots & Data',
    description: 'Download JSON snapshots, restore previous versions, or reset defaults.',
  },
};

function AdminDashboardInner() {
  const { user, isLocalBypass, isLoading } = useAdminAuth();
  const {
    isDirty,
    isSaving,
    errorMessage,
    saveContent,
    resetToDefault,
    exportJson,
  } = usePortfolio();

  const [activeTab, setActiveTab] = useState<AdminTab>('profile');
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [supabaseReady, setSupabaseReady] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Check Supabase status
  const checkSupabase = async () => {
    try {
      const res = await fetch('/api/supabase-status');
      const data = await res.json();
      setSupabaseReady(data.isReady || false);
    } catch {
      setSupabaseReady(false);
    }
  };

  useEffect(() => {
    checkSupabase();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSave = useCallback(async () => {
    const success = await saveContent();
    if (success) {
      showToast('✓ All changes saved successfully to disk and Supabase!');
      checkSupabase();
    } else {
      showToast(`✕ Failed to save: ${errorMessage || 'Check server logs or console.'}`);
    }
  }, [saveContent, errorMessage]);

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all data to default template?')) {
      resetToDefault();
      showToast('✓ Reset to default template.');
    }
  };

  // Keyboard shortcut Ctrl+S or Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const currentMeta = TAB_META[activeTab] || {
    title: 'Settings',
    description: 'Manage your portfolio content.',
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'inbox':
        return <InboxTab />;
      case 'profile':
        return <ProfileTab />;
      case 'bio':
        return <BioTab />;
      case 'github':
        return <GitHubTab />;
      case 'experience':
        return <ExperienceTab />;
      case 'projects':
        return <ProjectsTab />;
      case 'skills':
        return <SkillsTab />;
      case 'facts':
        return <FactsTab />;
      case 'socials':
        return <SocialsTab />;
      case 'people':
        return <PeopleTab />;
      case 'supabase':
        return <SupabaseTab />;
      case 'settings':
      case 'security':
        return <SettingsTab />;
      case 'backups':
        return <BackupsTab />;
      default:
        return <ProfileTab />;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-3 select-none">
        <div className="size-11 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 grid place-items-center">
          <Loader2 className="size-5.5 animate-spin" />
        </div>
        <p className="text-xs font-semibold text-ink-3">Verifying authentication session...</p>
      </div>
    );
  }

  // Gated login if not authenticated and not in local bypass
  if (!user && !isLocalBypass) {
    return <AdminLogin />;
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      {/* 2-Column Layout: Sidebar + Main Workspace */}
      <div className="flex flex-1 min-h-screen">
        {/* Left Vertical Navigation Sidebar & Mobile Drawer */}
        <AdminSidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          supabaseReady={supabaseReady}
          onSave={handleSave}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Right Main Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Sticky Header */}
          <AdminHeader
            activeTab={activeTab}
            tabTitle={currentMeta.title}
            tabDescription={currentMeta.description}
            isDirty={isDirty}
            isSaving={isSaving}
            showPreview={showPreview}
            onTogglePreview={() => setShowPreview(!showPreview)}
            onSave={handleSave}
            onReset={handleReset}
            onExport={exportJson}
            onToggleMobileMenu={() => setIsMobileMenuOpen((open) => !open)}
          />

          {/* Body: Editor Workspace + Optional Live Preview Pane */}
          <div className="flex-1 flex">
            {/* Form Editor Column */}
            <main className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto max-w-5xl w-full min-w-0 mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                >
                  {renderActiveTabContent()}
                </motion.div>
              </AnimatePresence>
            </main>

            {/* Optional Side-by-Side Live Preview Pane */}
            {showPreview && (
              <LivePreviewPane onClose={() => setShowPreview(false)} />
            )}
          </div>
        </div>
      </div>

      {/* Floating Save Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold flex items-center gap-2.5 backdrop-blur-md ${
              toastMessage.startsWith('✕')
                ? 'bg-rose-500/90 text-white border-rose-600 shadow-rose-500/20'
                : 'bg-emerald-600/90 text-white border-emerald-700 shadow-emerald-500/20'
            }`}
          >
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <AdminAuthProvider>
      <AdminDashboardInner />
    </AdminAuthProvider>
  );
}
