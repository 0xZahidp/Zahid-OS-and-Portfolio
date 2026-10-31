'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  User,
  FileText,
  Briefcase,
  Layers,
  Sparkles,
  Globe,
  Share2,
  Users,
  Database,
  Save,
  RotateCcw,
  Download,
  Upload,
  ExternalLink,
  Plus,
  Trash2,
  Check,
  Copy,
  CheckCircle2,
} from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';
import { GitHubIcon } from '@/components/ui/Icons';
import { Experience, Project, Skill, SocialLink, FollowerRecommendation } from '@/types/profile';

type AdminTab =
  | 'profile'
  | 'bio'
  | 'github'
  | 'experience'
  | 'projects'
  | 'skills'
  | 'facts'
  | 'socials'
  | 'people'
  | 'supabase';

export default function AdminDashboard() {
  const {
    content,
    isDirty,
    isSaving,
    lastSaved,
    errorMessage,
    updateProfile,
    updateBioParagraphs,
    updateExperience,
    updateProjects,
    updateSkills,
    updateLanguages,
    updateWorksSettings,
    updateBasedInSettings,
    updateGitHubSettings,
    updateSocialLinks,
    updateSuggestedPeople,
    saveContent,
    resetToDefault,
    exportJson,
    importJson,
  } = usePortfolio();

  const [activeTab, setActiveTab] = useState<AdminTab>('profile');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSave = async () => {
    const success = await saveContent();
    if (success) {
      showToast('✓ All changes saved successfully to disk and Supabase!');
    } else {
      showToast(`❌ Failed to save: ${errorMessage || 'Check server logs or console.'}`);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all data to default template?')) {
      resetToDefault();
      showToast('Reset to default template.');
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const ok = importJson(text);
      if (ok) {
        showToast('✓ Content imported successfully!');
      } else {
        showToast('❌ Invalid JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  const supabaseSqlSchema = `-- 1. Create Portfolio Content Table for 0xZahidp
CREATE TABLE IF NOT EXISTS public.portfolio_content (
  id text PRIMARY KEY DEFAULT 'main',
  content jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- 2. Create App Settings / Secrets Table for GITHUB_TOKEN
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.portfolio_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- 4. Policies
CREATE POLICY "Allow public read on portfolio_content"
  ON public.portfolio_content FOR SELECT USING (true);

CREATE POLICY "Allow full access for service_role"
  ON public.portfolio_content USING (true) WITH CHECK (true);

CREATE POLICY "Allow service_role on app_settings"
  ON public.app_settings USING (true) WITH CHECK (true);
`;

  const copySql = () => {
    navigator.clipboard.writeText(supabaseSqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="min-h-screen bg-surface text-ink antialiased">
      {/* 1. Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur-md px-6 py-3.5">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 group transition-opacity hover:opacity-80"
              title="Back to portfolio"
            >
              <div className="size-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white font-black grid place-items-center shadow-sm">
                Z
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-body tracking-tight">FolioFrame CMS</span>
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 ring-1 ring-brand-500/20">
                    Live
                  </span>
                </div>
                <p className="text-micro text-ink-3">No-code portfolio management</p>
              </div>
            </Link>

            <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-line text-meta">
              {isDirty ? (
                <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                  <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                  Unsaved changes
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-brand-600 dark:text-brand-400 font-medium">
                  <span className="size-2 rounded-full bg-brand-500" />
                  All changes saved
                </span>
              )}
              {lastSaved && <span className="text-micro text-ink-3">({lastSaved})</span>}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleReset}
              className="btn btn-secondary h-9 px-3 text-meta text-ink-3 hover:text-ink"
              title="Reset all content to original defaults"
            >
              <RotateCcw className="size-3.5 mr-1" />
              Reset
            </button>

            <button
              type="button"
              onClick={exportJson}
              className="btn btn-secondary h-9 px-3 text-meta"
              title="Download JSON backup"
            >
              <Download className="size-3.5 mr-1" />
              Backup
            </button>

            <Link
              href="/"
              target="_blank"
              className="btn btn-secondary h-9 px-3 text-meta"
            >
              <span>View Site</span>
              <ExternalLink className="size-3.5 ml-1 text-ink-3" />
            </Link>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="btn btn-primary h-9 px-4.5 text-meta shadow-md font-semibold cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <Save className="size-3.5" />
                  Save Changes
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-ink text-surface px-4 py-3 shadow-xl text-body font-medium animate-fadeIn">
          <CheckCircle2 className="size-4.5 text-brand-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. Main Dashboard Layout */}
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Navigation Sidebar */}
          <nav className="lg:col-span-3 card-raised p-3 sticky top-24 space-y-1">
            <div className="px-3 py-2 text-micro font-semibold uppercase tracking-wider text-ink-3">
              Content Sections
            </div>

            {[
              { id: 'profile', label: 'Profile & Identity', icon: User, badge: 'Hero' },
              { id: 'bio', label: 'About & Bio', icon: FileText, count: content.bioParagraphs.length },
              { id: 'github', label: 'GitHub & Sync', icon: GitHubIcon, badge: 'API' },
              { id: 'experience', label: 'Experience', icon: Briefcase, count: content.experience.length },
              { id: 'projects', label: 'Projects & Work', icon: Layers, count: content.projects.length },
              { id: 'skills', label: 'Skills & Badges', icon: Sparkles, count: content.skills.length },
              { id: 'facts', label: 'Facts & Languages', icon: Globe, count: content.languages.length },
              { id: 'socials', label: 'Social Links', icon: Share2, count: content.socialLinks.length },
              { id: 'people', label: 'Who to Follow', icon: Users, count: content.suggestedPeople.length },
              { id: 'supabase', label: 'Supabase & Backups', icon: Database, badge: 'SQL' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as AdminTab)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-meta transition-all cursor-pointer ${
                    isActive
                      ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold shadow-xs ring-1 ring-brand-500/20'
                      : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="size-4 shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </div>

                  {tab.badge && (
                    <span className="text-micro font-bold px-1.5 py-0.5 rounded-md bg-surface text-ink-3 ring-1 ring-line">
                      {tab.badge}
                    </span>
                  )}
                  {tab.count !== undefined && (
                    <span className="text-micro font-semibold px-2 py-0.5 rounded-full bg-surface-2 text-ink-3">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Editor Panel */}
          <main className="lg:col-span-9 space-y-6">
            {/* TAB 1: Profile & Identity */}
            {activeTab === 'profile' && (
              <div className="card-raised p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-ink">Profile & Identity</h2>
                  <p className="text-meta text-ink-3 mt-0.5">
                    Controls your profile header, avatar, tagline, and current roles.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-meta font-semibold text-ink mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={content.profile.full_name}
                      onChange={(e) => updateProfile({ full_name: e.target.value })}
                      className="w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-body text-ink focus:border-brand-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-meta font-semibold text-ink mb-1.5">
                      Username / Handle
                    </label>
                    <input
                      type="text"
                      value={content.profile.username}
                      onChange={(e) => updateProfile({ username: e.target.value })}
                      className="w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-body text-ink focus:border-brand-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-meta font-semibold text-ink mb-1.5">
                      Headline / Tagline
                    </label>
                    <input
                      type="text"
                      value={content.profile.headline}
                      onChange={(e) => updateProfile({ headline: e.target.value })}
                      className="w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-body text-ink focus:border-brand-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-meta font-semibold text-ink mb-1.5">
                      Avatar URL / Path
                    </label>
                    <input
                      type="text"
                      value={content.profile.avatar_url}
                      onChange={(e) => updateProfile({ avatar_url: e.target.value })}
                      className="w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-body text-ink focus:border-brand-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-meta font-semibold text-ink mb-1.5">
                      Availability Status
                    </label>
                    <input
                      type="text"
                      value={content.profile.availability}
                      onChange={(e) => updateProfile({ availability: e.target.value })}
                      className="w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-body text-ink focus:border-brand-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-meta font-semibold text-ink mb-1.5">
                      City Location
                    </label>
                    <input
                      type="text"
                      value={content.profile.location}
                      onChange={(e) => updateProfile({ location: e.target.value })}
                      className="w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-body text-ink focus:border-brand-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-meta font-semibold text-ink mb-1.5">
                      Timezone (IANA)
                    </label>
                    <input
                      type="text"
                      value={content.profile.timezone}
                      onChange={(e) => updateProfile({ timezone: e.target.value })}
                      className="w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-body text-ink focus:border-brand-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Roles Under Headline */}
                <div className="pt-4 border-t border-line space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-body font-bold text-ink">Hero Roles List</h3>
                      <p className="text-meta text-ink-3">
                        These appear right under your headline (e.g. CTO at Bidvers).
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {content.profile.roles.map((role, idx) => (
                      <div
                        key={idx}
                        className="flex flex-wrap items-center gap-3 p-3.5 rounded-xl border border-line bg-surface-2"
                      >
                        <input
                          type="text"
                          placeholder="Title (e.g. CTO)"
                          value={role.title}
                          onChange={(e) => {
                            const newRoles = [...content.profile.roles];
                            newRoles[idx].title = e.target.value;
                            updateProfile({ roles: newRoles });
                          }}
                          className="flex-1 min-w-[140px] rounded-lg border border-line bg-surface px-3 py-1.5 text-meta text-ink"
                        />
                        <span className="text-meta text-ink-3">at</span>
                        <input
                          type="text"
                          placeholder="Company (e.g. Bidvers)"
                          value={role.company}
                          onChange={(e) => {
                            const newRoles = [...content.profile.roles];
                            newRoles[idx].company = e.target.value;
                            updateProfile({ roles: newRoles });
                          }}
                          className="flex-1 min-w-[140px] rounded-lg border border-line bg-surface px-3 py-1.5 text-meta text-ink"
                        />
                        <input
                          type="text"
                          placeholder="URL"
                          value={role.company_url}
                          onChange={(e) => {
                            const newRoles = [...content.profile.roles];
                            newRoles[idx].company_url = e.target.value;
                            updateProfile({ roles: newRoles });
                          }}
                          className="flex-1 min-w-[160px] rounded-lg border border-line bg-surface px-3 py-1.5 text-meta text-ink"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newRoles = content.profile.roles.filter((_, i) => i !== idx);
                            updateProfile({ roles: newRoles });
                          }}
                          className="btn btn-secondary grid size-8 place-items-center text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        const newRoles = [
                          ...content.profile.roles,
                          {
                            title: 'Engineer',
                            company: 'New Project',
                            company_url: 'https://example.com',
                            company_logo: '/images/bidvers.webp',
                          },
                        ];
                        updateProfile({ roles: newRoles });
                      }}
                      className="btn btn-secondary text-meta font-medium px-3 py-1.5 inline-flex items-center gap-1.5"
                    >
                      <Plus className="size-3.5" />
                      Add Role
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: About & Bio */}
            {activeTab === 'bio' && (
              <div className="card-raised p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-ink">About & Bio Paragraphs</h2>
                    <p className="text-meta text-ink-3 mt-0.5">
                      Paragraph 1 is shown by default. Subsequent paragraphs appear when the user clicks &apos;Read more&apos;.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      updateBioParagraphs([...content.bioParagraphs, 'New paragraph content...']);
                    }}
                    className="btn btn-secondary text-meta font-medium px-3 py-1.5 inline-flex items-center gap-1.5"
                  >
                    <Plus className="size-3.5" />
                    Add Paragraph
                  </button>
                </div>

                <div className="space-y-4">
                  {content.bioParagraphs.map((para, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-line bg-surface-2 space-y-2">
                      <div className="flex items-center justify-between text-meta font-semibold text-ink-3">
                        <span>
                          {idx === 0 ? 'Paragraph 1 (Always Visible Preview)' : `Paragraph ${idx + 1} (Expanded)`}
                        </span>
                        {content.bioParagraphs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newBio = content.bioParagraphs.filter((_, i) => i !== idx);
                              updateBioParagraphs(newBio);
                            }}
                            className="text-red-500 hover:text-red-700 text-meta font-normal inline-flex items-center gap-1"
                          >
                            <Trash2 className="size-3.5" />
                            Remove
                          </button>
                        )}
                      </div>
                      <textarea
                        rows={3}
                        value={para}
                        onChange={(e) => {
                          const newBio = [...content.bioParagraphs];
                          newBio[idx] = e.target.value;
                          updateBioParagraphs(newBio);
                        }}
                        className="w-full rounded-xl border border-line bg-surface p-3 text-body text-ink focus:border-brand-500 focus:outline-hidden"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: GitHub & Sync */}
            {activeTab === 'github' && (
              <div className="card-raised p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-ink">GitHub Integration & Token</h2>
                  <p className="text-meta text-ink-3 mt-0.5">
                    Connects your GitHub profile, live contribution calendar, and private/public repo statistics.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-meta font-semibold text-ink mb-1.5">
                      GitHub Username
                    </label>
                    <input
                      type="text"
                      value={content.githubSettings.username}
                      onChange={(e) => updateGitHubSettings({ username: e.target.value })}
                      className="w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-body text-ink focus:border-brand-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-meta font-semibold text-ink mb-1.5">
                      Followers Count Override (or live)
                    </label>
                    <input
                      type="number"
                      value={content.githubSettings.followersCount ?? content.profile.github_followers_count}
                      onChange={(e) => {
                        const count = parseInt(e.target.value, 10) || 0;
                        updateGitHubSettings({ followersCount: count });
                        updateProfile({ github_followers_count: count });
                      }}
                      className="w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-body text-ink focus:border-brand-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-meta font-semibold text-ink mb-1.5">
                      GitHub Personal Access Token (PAT)
                    </label>
                    <input
                      type="password"
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx (optional for private repo counts)"
                      value={content.githubSettings.token || ''}
                      onChange={(e) => updateGitHubSettings({ token: e.target.value })}
                      className="w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-body text-ink focus:border-brand-500 focus:outline-hidden font-mono"
                    />
                    <p className="text-micro text-ink-3 mt-1.5">
                      Stored in your private Supabase settings or `.env.local`. When provided, GitHub GraphQL includes your private contributions.
                    </p>
                  </div>
                </div>

                {/* Pinned Repositories List */}
                <div className="pt-4 border-t border-line space-y-3">
                  <h3 className="text-body font-bold text-ink">Pinned Repositories on Work Tab</h3>
                  <p className="text-meta text-ink-3">
                    These 4 repositories are featured directly beneath your contributions calendar.
                  </p>

                  <div className="space-y-2">
                    {(content.githubSettings.pinnedRepos || []).map((repoName, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={repoName}
                          onChange={(e) => {
                            const newPinned = [...(content.githubSettings.pinnedRepos || [])];
                            newPinned[idx] = e.target.value;
                            updateGitHubSettings({ pinnedRepos: newPinned });
                          }}
                          className="flex-1 rounded-xl border border-line bg-surface px-3 py-1.5 text-meta text-ink font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newPinned = (content.githubSettings.pinnedRepos || []).filter((_, i) => i !== idx);
                            updateGitHubSettings({ pinnedRepos: newPinned });
                          }}
                          className="btn btn-secondary grid size-8 place-items-center text-red-500"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        const newPinned = [...(content.githubSettings.pinnedRepos || []), `${content.githubSettings.username}/new-repo`];
                        updateGitHubSettings({ pinnedRepos: newPinned });
                      }}
                      className="btn btn-secondary text-meta font-medium px-3 py-1.5 inline-flex items-center gap-1.5"
                    >
                      <Plus className="size-3.5" />
                      Add Pinned Repo
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Experience Timeline */}
            {activeTab === 'experience' && (
              <div className="card-raised p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-ink">Experience Timeline</h2>
                    <p className="text-meta text-ink-3 mt-0.5">
                      Chronological positions, company logos, date badges, and achievements.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newExp: Experience = {
                        id: `exp-${Date.now()}`,
                        company: 'New Company',
                        company_url: 'https://example.com',
                        company_logo: '/images/bidvers.webp',
                        position: 'Senior Engineer',
                        period: '2026 – Present',
                        type: 'Full-time',
                        workplace_type: 'Remote',
                        description: 'Architected and built core systems.',
                        is_current: true,
                      };
                      updateExperience([newExp, ...content.experience]);
                    }}
                    className="btn btn-secondary text-meta font-medium px-3 py-1.5 inline-flex items-center gap-1.5"
                  >
                    <Plus className="size-3.5" />
                    Add Position
                  </button>
                </div>

                <div className="space-y-4">
                  {content.experience.map((exp, idx) => (
                    <div key={exp.id} className="p-4 rounded-xl border border-line bg-surface-2 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={exp.position}
                            onChange={(e) => {
                              const updated = [...content.experience];
                              updated[idx].position = e.target.value;
                              updateExperience(updated);
                            }}
                            className="font-bold text-body text-ink bg-transparent border-b border-transparent focus:border-brand-500 focus:outline-hidden"
                            placeholder="Job Title"
                          />
                          <span className="text-meta text-ink-3">at</span>
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => {
                              const updated = [...content.experience];
                              updated[idx].company = e.target.value;
                              updateExperience(updated);
                            }}
                            className="font-semibold text-meta text-brand-600 dark:text-brand-400 bg-transparent border-b border-transparent focus:border-brand-500 focus:outline-hidden"
                            placeholder="Company"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const updated = content.experience.filter((_, i) => i !== idx);
                            updateExperience(updated);
                          }}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Delete position"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                          type="text"
                          placeholder="Period (e.g. Nov 2025 – Present)"
                          value={exp.period}
                          onChange={(e) => {
                            const updated = [...content.experience];
                            updated[idx].period = e.target.value;
                            updateExperience(updated);
                          }}
                          className="rounded-lg border border-line bg-surface px-3 py-1.5 text-meta text-ink"
                        />
                        <input
                          type="text"
                          placeholder="Type (e.g. Full-time, Contract)"
                          value={exp.type}
                          onChange={(e) => {
                            const updated = [...content.experience];
                            updated[idx].type = e.target.value;
                            updateExperience(updated);
                          }}
                          className="rounded-lg border border-line bg-surface px-3 py-1.5 text-meta text-ink"
                        />
                        <input
                          type="text"
                          placeholder="Workplace (e.g. Remote)"
                          value={exp.workplace_type}
                          onChange={(e) => {
                            const updated = [...content.experience];
                            updated[idx].workplace_type = e.target.value;
                            updateExperience(updated);
                          }}
                          className="rounded-lg border border-line bg-surface px-3 py-1.5 text-meta text-ink"
                        />
                      </div>

                      <textarea
                        rows={2}
                        placeholder="Description of role and impact..."
                        value={exp.description}
                        onChange={(e) => {
                          const updated = [...content.experience];
                          updated[idx].description = e.target.value;
                          updateExperience(updated);
                        }}
                        className="w-full rounded-xl border border-line bg-surface p-3 text-meta text-ink focus:border-brand-500 focus:outline-hidden"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: Projects & Work */}
            {activeTab === 'projects' && (
              <div className="card-raised p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-ink">Projects & Work List</h2>
                    <p className="text-meta text-ink-3 mt-0.5">
                      Showcased on your dedicated Projects page and the Work tab.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newProj: Project = {
                        id: `proj-${Date.now()}`,
                        title: 'New Project',
                        description: 'A modern web application built with Next.js and Tailwind CSS.',
                        tags: ['Next.js', 'React', 'TypeScript'],
                        project_url: 'https://example.com',
                      };
                      updateProjects([...content.projects, newProj]);
                    }}
                    className="btn btn-secondary text-meta font-medium px-3 py-1.5 inline-flex items-center gap-1.5"
                  >
                    <Plus className="size-3.5" />
                    Add Project
                  </button>
                </div>

                <div className="space-y-4">
                  {content.projects.map((proj, idx) => (
                    <div key={proj.id} className="p-4 rounded-xl border border-line bg-surface-2 space-y-3">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={proj.title}
                          onChange={(e) => {
                            const updated = [...content.projects];
                            updated[idx].title = e.target.value;
                            updateProjects(updated);
                          }}
                          className="font-bold text-body text-ink bg-transparent border-b border-transparent focus:border-brand-500 focus:outline-hidden"
                          placeholder="Project Title"
                        />

                        <button
                          type="button"
                          onClick={() => {
                            const updated = content.projects.filter((_, i) => i !== idx);
                            updateProjects(updated);
                          }}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>

                      <textarea
                        rows={2}
                        placeholder="Project description..."
                        value={proj.description}
                        onChange={(e) => {
                          const updated = [...content.projects];
                          updated[idx].description = e.target.value;
                          updateProjects(updated);
                        }}
                        className="w-full rounded-xl border border-line bg-surface p-3 text-meta text-ink focus:border-brand-500 focus:outline-hidden"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Live URL (e.g. https://mytapcard.com)"
                          value={proj.project_url || ''}
                          onChange={(e) => {
                            const updated = [...content.projects];
                            updated[idx].project_url = e.target.value;
                            updateProjects(updated);
                          }}
                          className="rounded-lg border border-line bg-surface px-3 py-1.5 text-meta text-ink"
                        />
                        <input
                          type="text"
                          placeholder="Tags comma separated (e.g. Next.js, API, Stripe)"
                          value={proj.tags ? proj.tags.join(', ') : ''}
                          onChange={(e) => {
                            const updated = [...content.projects];
                            updated[idx].tags = e.target.value.split(',').map((t) => t.trim()).filter(Boolean);
                            updateProjects(updated);
                          }}
                          className="rounded-lg border border-line bg-surface px-3 py-1.5 text-meta text-ink"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 6: Skills & Badges */}
            {activeTab === 'skills' && (
              <div className="card-raised p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-ink">Skills & Tech Stack Badges</h2>
                  <p className="text-meta text-ink-3 mt-0.5">
                    Categorized badges rendered under your hero and in the Skills & Tools section.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 p-4 rounded-xl border border-line bg-surface-2">
                  {content.skills.map((skill, idx) => (
                    <span
                      key={skill.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface text-meta font-medium border border-line shadow-2xs"
                    >
                      <span>{skill.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = content.skills.filter((_, i) => i !== idx);
                          updateSkills(updated);
                        }}
                        className="text-ink-3 hover:text-red-500 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    id="new-skill-input"
                    type="text"
                    placeholder="New skill (e.g. Docker, GraphQL, Supabase)"
                    className="flex-1 rounded-xl border border-line bg-surface px-3.5 py-2 text-body text-ink focus:border-brand-500 focus:outline-hidden"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const target = e.target as HTMLInputElement;
                        if (target.value.trim()) {
                          const newSkill: Skill = {
                            id: target.value.toLowerCase().replace(/\s+/g, '-'),
                            name: target.value.trim(),
                            category: 'tech',
                          };
                          updateSkills([...content.skills, newSkill]);
                          target.value = '';
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('new-skill-input') as HTMLInputElement;
                      if (input && input.value.trim()) {
                        const newSkill: Skill = {
                          id: input.value.toLowerCase().replace(/\s+/g, '-'),
                          name: input.value.trim(),
                          category: 'tech',
                        };
                        updateSkills([...content.skills, newSkill]);
                        input.value = '';
                      }
                    }}
                    className="btn btn-secondary px-4 text-meta font-medium"
                  >
                    Add Skill
                  </button>
                </div>
              </div>
            )}

            {/* TAB 7: Facts & Languages */}
            {activeTab === 'facts' && (
              <div className="card-raised p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-ink">Facts, Works & Languages</h2>
                  <p className="text-meta text-ink-3 mt-0.5">
                    Controls the Based in card, Remote-first works card, and language proficiency bars.
                  </p>
                </div>

                {/* Based In Settings */}
                <div className="p-4 rounded-xl border border-line bg-surface-2 space-y-4">
                  <h3 className="text-body font-bold text-ink">Based In Card Settings</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-micro font-medium text-ink-3 mb-1">City</label>
                      <input
                        type="text"
                        value={content.basedInSettings.city}
                        onChange={(e) => updateBasedInSettings({ city: e.target.value })}
                        className="w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-meta text-ink"
                      />
                    </div>
                    <div>
                      <label className="block text-micro font-medium text-ink-3 mb-1">Country</label>
                      <input
                        type="text"
                        value={content.basedInSettings.country}
                        onChange={(e) => updateBasedInSettings({ country: e.target.value })}
                        className="w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-meta text-ink"
                      />
                    </div>
                    <div>
                      <label className="block text-micro font-medium text-ink-3 mb-1">GMT Offset</label>
                      <input
                        type="text"
                        value={content.basedInSettings.gmtOffset}
                        onChange={(e) => updateBasedInSettings({ gmtOffset: e.target.value })}
                        className="w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-meta text-ink"
                      />
                    </div>
                  </div>
                </div>

                {/* Works Settings */}
                <div className="p-4 rounded-xl border border-line bg-surface-2 space-y-4">
                  <h3 className="text-body font-bold text-ink">Works Remote Card</h3>
                  <input
                    type="text"
                    value={content.worksSettings.heading}
                    onChange={(e) => updateWorksSettings({ heading: e.target.value })}
                    className="w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-meta text-ink font-semibold"
                    placeholder="Heading (e.g. Remote-first)"
                  />
                  <textarea
                    rows={2}
                    value={content.worksSettings.description}
                    onChange={(e) => updateWorksSettings({ description: e.target.value })}
                    className="w-full rounded-lg border border-line bg-surface p-2.5 text-meta text-ink"
                    placeholder="Description text"
                  />
                  <div>
                    <label className="block text-micro font-medium text-ink-3 mb-1">
                      Check Chips (comma separated)
                    </label>
                    <input
                      type="text"
                      value={content.worksSettings.chips.join(', ')}
                      onChange={(e) =>
                        updateWorksSettings({
                          chips: e.target.value.split(',').map((c) => c.trim()).filter(Boolean),
                        })
                      }
                      className="w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-meta text-ink"
                    />
                  </div>
                </div>

                {/* Languages List */}
                <div className="p-4 rounded-xl border border-line bg-surface-2 space-y-3">
                  <h3 className="text-body font-bold text-ink">Languages & Proficiency (1 to 5 bars)</h3>
                  {content.languages.map((lang, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-surface border border-line">
                      <input
                        type="text"
                        value={lang.name}
                        onChange={(e) => {
                          const updated = [...content.languages];
                          updated[idx].name = e.target.value;
                          updateLanguages(updated);
                        }}
                        className="w-28 font-bold text-meta text-ink bg-transparent"
                      />
                      <input
                        type="text"
                        value={lang.proficiency}
                        onChange={(e) => {
                          const updated = [...content.languages];
                          updated[idx].proficiency = e.target.value;
                          updateLanguages(updated);
                        }}
                        className="flex-1 rounded-md border border-line bg-surface-2 px-2.5 py-1 text-meta text-ink"
                        placeholder="Proficiency (e.g. Native)"
                      />
                      <div className="flex items-center gap-1.5">
                        <span className="text-micro font-semibold text-ink-3">Rating (1-5):</span>
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={lang.rating}
                          onChange={(e) => {
                            const updated = [...content.languages];
                            updated[idx].rating = Math.min(5, Math.max(1, parseInt(e.target.value, 10) || 1));
                            updateLanguages(updated);
                          }}
                          className="w-14 rounded-md border border-line bg-surface-2 px-2 py-1 text-meta text-center font-bold text-ink"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 8: Social Links */}
            {activeTab === 'socials' && (
              <div className="card-raised p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-ink">Social Profiles (&apos;Find me on&apos;)</h2>
                    <p className="text-meta text-ink-3 mt-0.5">
                      Rendered on the right sidebar and contact page.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newSocial: SocialLink = {
                        id: `soc-${Date.now()}`,
                        platform: 'github',
                        label: 'New Link',
                        handle: '@0xZahidp',
                        url: 'https://github.com/0xZahidp',
                      };
                      updateSocialLinks([...content.socialLinks, newSocial]);
                    }}
                    className="btn btn-secondary text-meta font-medium px-3 py-1.5 inline-flex items-center gap-1.5"
                  >
                    <Plus className="size-3.5" />
                    Add Link
                  </button>
                </div>

                <div className="space-y-3">
                  {content.socialLinks.map((social, idx) => (
                    <div key={social.id} className="flex flex-wrap items-center gap-3 p-3.5 rounded-xl border border-line bg-surface-2">
                      <select
                        value={social.platform}
                        onChange={(e) => {
                          const updated = [...content.socialLinks];
                          updated[idx].platform = e.target.value as SocialLink['platform'];
                          updateSocialLinks(updated);
                        }}
                        className="rounded-lg border border-line bg-surface px-3 py-1.5 text-meta text-ink"
                      >
                        <option value="github">GitHub</option>
                        <option value="x">X / Twitter</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="facebook">Facebook</option>
                        <option value="producthunt">ProductHunt</option>
                        <option value="devto">Dev.to</option>
                      </select>

                      <input
                        type="text"
                        placeholder="Label"
                        value={social.label}
                        onChange={(e) => {
                          const updated = [...content.socialLinks];
                          updated[idx].label = e.target.value;
                          updateSocialLinks(updated);
                        }}
                        className="w-32 rounded-lg border border-line bg-surface px-3 py-1.5 text-meta text-ink font-semibold"
                      />

                      <input
                        type="text"
                        placeholder="Handle (@user)"
                        value={social.handle}
                        onChange={(e) => {
                          const updated = [...content.socialLinks];
                          updated[idx].handle = e.target.value;
                          updateSocialLinks(updated);
                        }}
                        className="w-36 rounded-lg border border-line bg-surface px-3 py-1.5 text-meta text-ink"
                      />

                      <input
                        type="text"
                        placeholder="URL"
                        value={social.url}
                        onChange={(e) => {
                          const updated = [...content.socialLinks];
                          updated[idx].url = e.target.value;
                          updateSocialLinks(updated);
                        }}
                        className="flex-1 min-w-[180px] rounded-lg border border-line bg-surface px-3 py-1.5 text-meta text-ink"
                      />

                      <button
                        type="button"
                        onClick={() => {
                          const updated = content.socialLinks.filter((_, i) => i !== idx);
                          updateSocialLinks(updated);
                        }}
                        className="btn btn-secondary grid size-8 place-items-center text-red-500"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 9: Who to Follow */}
            {activeTab === 'people' && (
              <div className="card-raised p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-ink">Who to Follow Recommendations</h2>
                    <p className="text-meta text-ink-3 mt-0.5">
                      Suggested developers featured on the right sidebar card.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newPerson: FollowerRecommendation = {
                        id: `p-${Date.now()}`,
                        name: 'Developer Name',
                        role: 'Software Engineer',
                        avatar_url: '/images/caleb.jpg',
                        url: 'https://x.com/username',
                        handle: '@username',
                      };
                      updateSuggestedPeople([...content.suggestedPeople, newPerson]);
                    }}
                    className="btn btn-secondary text-meta font-medium px-3 py-1.5 inline-flex items-center gap-1.5"
                  >
                    <Plus className="size-3.5" />
                    Add Person
                  </button>
                </div>

                <div className="space-y-3">
                  {content.suggestedPeople.map((person, idx) => (
                    <div key={person.id} className="flex flex-wrap items-center gap-3 p-3.5 rounded-xl border border-line bg-surface-2">
                      <input
                        type="text"
                        placeholder="Name"
                        value={person.name}
                        onChange={(e) => {
                          const updated = [...content.suggestedPeople];
                          updated[idx].name = e.target.value;
                          updateSuggestedPeople(updated);
                        }}
                        className="w-48 rounded-lg border border-line bg-surface px-3 py-1.5 text-meta font-bold text-ink"
                      />

                      <input
                        type="text"
                        placeholder="Role / Bio summary"
                        value={person.role}
                        onChange={(e) => {
                          const updated = [...content.suggestedPeople];
                          updated[idx].role = e.target.value;
                          updateSuggestedPeople(updated);
                        }}
                        className="flex-1 min-w-[180px] rounded-lg border border-line bg-surface px-3 py-1.5 text-meta text-ink"
                      />

                      <input
                        type="text"
                        placeholder="Profile URL"
                        value={person.url}
                        onChange={(e) => {
                          const updated = [...content.suggestedPeople];
                          updated[idx].url = e.target.value;
                          updateSuggestedPeople(updated);
                        }}
                        className="w-48 rounded-lg border border-line bg-surface px-3 py-1.5 text-meta text-ink"
                      />

                      <button
                        type="button"
                        onClick={() => {
                          const updated = content.suggestedPeople.filter((_, i) => i !== idx);
                          updateSuggestedPeople(updated);
                        }}
                        className="btn btn-secondary grid size-8 place-items-center text-red-500"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 10: Supabase & Backups */}
            {activeTab === 'supabase' && (
              <div className="card-raised p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-ink">Supabase Cloud Sync & Backups</h2>
                  <p className="text-meta text-ink-3 mt-0.5">
                    Diagnostics, database schemas, and JSON import/export to keep your content portable.
                  </p>
                </div>

                {/* 1-Click SQL Copy */}
                <div className="p-4 rounded-xl border border-line bg-surface-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-body font-bold text-ink">Supabase Database SQL Schema</h3>
                      <p className="text-meta text-ink-3">
                        Copy and execute this query in your Supabase SQL Editor to enable cloud sync.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={copySql}
                      className="btn btn-secondary text-meta font-medium px-3.5 py-1.5 inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedSql ? (
                        <>
                          <Check className="size-3.5 text-brand-500" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3.5" />
                          <span>Copy SQL</span>
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="p-3.5 rounded-lg bg-surface border border-line font-mono text-micro text-ink-2 overflow-x-auto [scrollbar-width:none]">
                    {supabaseSqlSchema}
                  </pre>
                </div>

                {/* Import / Export JSON */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl border border-line bg-surface-2 space-y-3">
                    <h3 className="text-body font-bold text-ink">Export Content Backup</h3>
                    <p className="text-meta text-ink-3">
                      Download all current portfolio content as a single JSON file.
                    </p>
                    <button
                      type="button"
                      onClick={exportJson}
                      className="btn btn-primary h-9 px-4 text-meta font-semibold inline-flex items-center gap-1.5"
                    >
                      <Download className="size-3.5" />
                      Download JSON Backup
                    </button>
                  </div>

                  <div className="p-4 rounded-xl border border-line bg-surface-2 space-y-3">
                    <h3 className="text-body font-bold text-ink">Import Content Backup</h3>
                    <p className="text-meta text-ink-3">
                      Restore content from an exported JSON file.
                    </p>
                    <label className="btn btn-secondary h-9 px-4 text-meta font-semibold inline-flex items-center gap-1.5 cursor-pointer">
                      <Upload className="size-3.5" />
                      <span>Select JSON File</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileImport}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
