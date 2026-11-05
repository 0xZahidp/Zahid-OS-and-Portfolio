'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Kanban,
  Table as TableIcon,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Trash2,
  Lock,
  ChevronRight,
  TrendingUp,
  Award,
  Sparkles,
  Copy,
  Check,
  Building,
  DollarSign,
  X,
  Loader2,
  Download,
} from 'lucide-react';
import {
  CareerApplication,
  CareerApplicationStatus,
  CareerPriorityLevel,
  CareerMetrics,
} from '@/types/career';

const STATUS_CONFIG: Record<
  CareerApplicationStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  saved: {
    label: 'Saved',
    color: 'text-neutral-600 dark:text-neutral-300',
    bg: 'bg-neutral-500/10 border-neutral-500/20',
    dot: 'bg-neutral-400',
  },
  applied: {
    label: 'Applied',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    dot: 'bg-blue-500',
  },
  screening: {
    label: 'Screening',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    dot: 'bg-purple-500',
  },
  technical: {
    label: 'Technical',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    dot: 'bg-amber-500',
  },
  manager: {
    label: 'Final Round',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
    dot: 'bg-orange-500',
  },
  offer: {
    label: 'Offer',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  rejected: {
    label: 'Rejected',
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/20',
    dot: 'bg-rose-500',
  },
  withdrawn: {
    label: 'Withdrawn',
    color: 'text-neutral-500',
    bg: 'bg-neutral-500/10 border-neutral-500/20',
    dot: 'bg-neutral-400',
  },
};

const PRIORITY_CONFIG: Record<
  CareerPriorityLevel,
  { label: string; badge: string }
> = {
  urgent: {
    label: 'Urgent',
    badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
  },
  high: {
    label: 'High',
    badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  },
  medium: {
    label: 'Medium',
    badge: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  },
  low: {
    label: 'Low',
    badge: 'bg-neutral-500/15 text-neutral-600 dark:text-neutral-400 border-neutral-500/30',
  },
};

const KANBAN_STAGES: { id: CareerApplicationStatus; title: string }[] = [
  { id: 'saved', title: 'Saved' },
  { id: 'applied', title: 'Applied' },
  { id: 'screening', title: 'Screening' },
  { id: 'technical', title: 'Technical' },
  { id: 'manager', title: 'Final / Team' },
  { id: 'offer', title: 'Offer' },
  { id: 'rejected', title: 'Closed' },
];

export const CareerTab: React.FC = () => {
  const [applications, setApplications] = useState<CareerApplication[]>([]);
  const [metrics, setMetrics] = useState<CareerMetrics>({
    total: 0,
    active: 0,
    interviewsScheduled: 0,
    offers: 0,
    rejected: 0,
    overdueFollowups: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showArchived, setShowArchived] = useState<boolean>(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [activeDetailApp, setActiveDetailApp] = useState<CareerApplication | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'interviews' | 'contacts' | 'email'>('overview');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Email generator state
  const [emailTemplateType, setEmailTemplateType] = useState<
    'follow_up' | 'thank_you' | 'negotiation' | 'status_inquiry'
  >('follow_up');
  const [copiedEmail, setCopiedEmail] = useState<boolean>(false);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/career');
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Failed to load career applications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Quick Status change
  const handleUpdateStatus = async (appId: string, newStatus: CareerApplicationStatus) => {
    try {
      const res = await fetch('/api/admin/career', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: appId, status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setApplications((prev) =>
          prev.map((a) => (a.id === appId ? data.application : a))
        );
        if (activeDetailApp?.id === appId) {
          setActiveDetailApp(data.application);
        }
        showToast(`Status updated to ${STATUS_CONFIG[newStatus].label}`);
      }
    } catch {
      showToast('Error updating status');
    }
  };

  // Delete Application
  const handleDeleteApplication = async (appId: string) => {
    if (!confirm('Are you sure you want to delete this application record?')) return;
    try {
      const res = await fetch(`/api/admin/career?id=${appId}`, { method: 'DELETE' });
      if (res.ok) {
        setApplications((prev) => prev.filter((a) => a.id !== appId));
        if (activeDetailApp?.id === appId) {
          setActiveDetailApp(null);
        }
        showToast('Application deleted');
      }
    } catch {
      showToast('Error deleting application');
    }
  };

  // Export JSON snapshot
  const handleExportData = () => {
    const jsonStr = JSON.stringify(applications, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `career_applications_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported applications JSON');
  };

  // Filtered applications
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      if (!showArchived && app.archived) return false;
      if (showArchived && !app.archived) return false;

      if (statusFilter !== 'all' && app.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && app.priority !== priorityFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const comp = app.company_name.toLowerCase();
        const role = app.role_title.toLowerCase();
        const loc = (app.location || '').toLowerCase();
        const notes = (app.notes || '').toLowerCase();
        if (!comp.includes(q) && !role.includes(q) && !loc.includes(q) && !notes.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [applications, showArchived, statusFilter, priorityFilter, search]);

  // Generated follow-up email template
  const generatedEmail = useMemo(() => {
    if (!activeDetailApp) return '';
    const name = activeDetailApp.contacts[0]?.name || 'Hiring Team';
    const role = activeDetailApp.role_title;
    const company = activeDetailApp.company_name;

    switch (emailTemplateType) {
      case 'follow_up':
        return `Hi ${name},

I hope you're having a productive week.

I wanted to quickly follow up regarding my application for the ${role} position at ${company}. I remain very enthusiastic about the work you're doing, especially regarding your tech stack and product mission.

Please let me know if there are any additional materials or code samples I can provide to support my application. I look forward to hearing about next steps.

Best regards,
Md Zahid Hasan Patwary
https://zahidp.com`;

      case 'thank_you':
        return `Hi ${name},

Thank you very much for your time today discussing the ${role} opportunity at ${company}.

I truly enjoyed learning more about the team's upcoming challenges and technical direction. Our discussion reinforced my interest in bringing my full-stack engineering and agentic workflows background to ${company}.

Looking forward to the next steps!

Warm regards,
Md Zahid Hasan Patwary
https://zahidp.com`;

      case 'negotiation':
        return `Hi ${name},

Thank you again for extending the offer to join ${company} as a ${role}! I am genuinely excited about the vision and the chance to contribute to the team.

Before formally signing, I wanted to discuss the compensation package. Given my background in end-to-end full-stack systems and current competitive market rates, I was hoping we could explore aligning closer to ${activeDetailApp.salary_max ? `$${activeDetailApp.salary_max.toLocaleString()}` : 'the upper range'} (or equivalent equity adjustments).

I am confident in the impact I will make and would love to find a package that works well for both sides.

Best regards,
Md Zahid Hasan Patwary`;

      case 'status_inquiry':
        return `Hi ${name},

I wanted to check in to see if there are any updates regarding the ${role} search at ${company}. 

I have a few pending timelines with other interview processes, but ${company} remains a top priority for me, so I wanted to touch base before making any commitments.

Thank you again for your time and consideration!

Best,
Md Zahid Hasan Patwary`;
    }
  }, [activeDetailApp, emailTemplateType]);

  const copyEmailText = () => {
    if (!generatedEmail) return;
    navigator.clipboard.writeText(generatedEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-neutral-900 text-white px-4 py-2.5 shadow-xl border border-white/10 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="size-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-3xl border border-line bg-surface p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <Briefcase className="size-4" />
              </span>
              <h2 className="text-xl font-bold tracking-tight text-ink">
                Career Tracker &amp; Job Pipeline
              </h2>
              <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border border-neutral-500/20">
                <Lock className="size-2.5" />
                <span>Private &amp; Confidential</span>
              </span>
            </div>
            <p className="text-xs text-ink-3 max-w-2xl">
              Track confidential job applications, scheduled interview rounds, compensation targets, recruiter contacts, and proactive follow-ups without exposing them publicly.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportData}
              className="btn btn-secondary h-9 px-3.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              title="Download full JSON backup"
            >
              <Download className="size-3.5" />
              <span>Export</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-primary h-9 px-4 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>New Application</span>
            </button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-5 border-t border-line">
          <div className="rounded-2xl border border-line bg-surface-2 p-3.5">
            <div className="text-[11px] text-ink-3 font-medium flex items-center justify-between">
              <span>Total Applications</span>
              <Building className="size-3.5 opacity-60" />
            </div>
            <p className="text-xl font-black text-ink mt-1">{metrics.total}</p>
          </div>

          <div className="rounded-2xl border border-line bg-surface-2 p-3.5">
            <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium flex items-center justify-between">
              <span>In Pipeline</span>
              <TrendingUp className="size-3.5 opacity-80" />
            </div>
            <p className="text-xl font-black text-ink mt-1">{metrics.active}</p>
          </div>

          <div className="rounded-2xl border border-line bg-surface-2 p-3.5">
            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center justify-between">
              <span>Interviews</span>
              <Calendar className="size-3.5 opacity-80" />
            </div>
            <p className="text-xl font-black text-ink mt-1">{metrics.interviewsScheduled}</p>
          </div>

          <div className="rounded-2xl border border-line bg-surface-2 p-3.5">
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-between">
              <span>Offers</span>
              <Award className="size-3.5 opacity-80" />
            </div>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {metrics.offers}
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-surface-2 p-3.5">
            <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center justify-between">
              <span>Overdue Action</span>
              <AlertCircle className="size-3.5 opacity-80" />
            </div>
            <p
              className={`text-xl font-black mt-1 ${
                metrics.overdueFollowups > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-ink'
              }`}
            >
              {metrics.overdueFollowups}
            </p>
          </div>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: View Mode Toggle + Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View mode */}
          <div className="inline-flex rounded-xl border border-line bg-surface-2 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-surface text-ink shadow-2xs font-bold'
                  : 'text-ink-3 hover:text-ink'
              }`}
            >
              <Kanban className="size-3.5" />
              <span>Board</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-surface text-ink shadow-2xs font-bold'
                  : 'text-ink-3 hover:text-ink'
              }`}
            >
              <TableIcon className="size-3.5" />
              <span>Table</span>
            </button>
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-line bg-surface-2 text-xs font-medium text-ink focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-line bg-surface-2 text-xs font-medium text-ink focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Archived toggle */}
          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className={`h-9 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
              showArchived
                ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'border-line bg-surface-2 text-ink-3 hover:text-ink'
            }`}
          >
            {showArchived ? 'Viewing Archived' : 'Show Archived'}
          </button>
        </div>

        {/* Right: Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-ink-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company, role..."
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-line bg-surface-2 text-xs text-ink placeholder:text-ink-4 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="size-6 text-indigo-500 animate-spin" />
          <span className="text-xs font-mono text-ink-3">Loading pipeline...</span>
        </div>
      ) : viewMode === 'kanban' ? (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5 items-start overflow-x-auto pb-4">
          {KANBAN_STAGES.map((stage) => {
            const stageApps = filteredApps.filter((a) => {
              if (stage.id === 'rejected') {
                return a.status === 'rejected' || a.status === 'withdrawn';
              }
              return a.status === stage.id;
            });

            return (
              <div
                key={stage.id}
                className="flex flex-col rounded-2xl border border-line bg-surface/50 p-2.5 min-h-[480px]"
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between px-2 py-1.5 mb-2 border-b border-line/60">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`size-2 rounded-full ${
                        STATUS_CONFIG[stage.id]?.dot || 'bg-neutral-400'
                      }`}
                    />
                    <h3 className="text-xs font-bold text-ink">{stage.title}</h3>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md bg-surface-2 text-ink-3">
                    {stageApps.length}
                  </span>
                </div>

                {/* Stage Cards */}
                <div className="space-y-2 flex-1">
                  {stageApps.length === 0 ? (
                    <div className="h-28 rounded-xl border border-dashed border-line/60 flex items-center justify-center text-[11px] text-ink-4">
                      Empty
                    </div>
                  ) : (
                    stageApps.map((app) => (
                      <div
                        key={app.id}
                        onClick={() => {
                          setActiveDetailApp(app);
                          setDetailTab('overview');
                        }}
                        className="group relative rounded-xl border border-line bg-surface p-3 shadow-2xs hover:shadow-sm hover:border-line-strong transition-all cursor-pointer space-y-2.5"
                      >
                        {/* Company & Role */}
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-ink truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {app.company_name}
                            </span>
                            <span
                              className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-sm border ${
                                PRIORITY_CONFIG[app.priority]?.badge
                              }`}
                            >
                              {app.priority}
                            </span>
                          </div>
                          <p className="text-[11px] text-ink-2 font-medium truncate mt-0.5">
                            {app.role_title}
                          </p>
                        </div>

                        {/* Salary and tags */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-ink-3">
                          {app.salary_min && (
                            <span className="inline-flex items-center gap-0.5 font-mono text-ink-2">
                              <DollarSign className="size-2.5" />
                              <span>
                                {Math.round(app.salary_min / 1000)}k
                                {app.salary_max ? `-${Math.round(app.salary_max / 1000)}k` : ''}
                              </span>
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded-md bg-surface-2 border border-line">
                            {app.remote_type}
                          </span>
                        </div>

                        {/* Next Action Indicator */}
                        {app.next_followup_date && (
                          <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 border-t border-line/60 pt-2 font-medium">
                            <Clock className="size-3" />
                            <span className="truncate">
                              Follow-up: {app.next_followup_date}
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="rounded-2xl border border-line bg-surface overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-surface-2 text-ink-3 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Company &amp; Role</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Priority</th>
                  <th className="px-3 py-3">Applied Date</th>
                  <th className="px-3 py-3">Compensation</th>
                  <th className="px-3 py-3">Next Action</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredApps.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => {
                      setActiveDetailApp(app);
                      setDetailTab('overview');
                    }}
                    className="hover:bg-surface-2/60 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-ink text-xs">{app.company_name}</div>
                      <div className="text-[11px] text-ink-3">{app.role_title}</div>
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                          STATUS_CONFIG[app.status]?.bg
                        } ${STATUS_CONFIG[app.status]?.color}`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            STATUS_CONFIG[app.status]?.dot
                          }`}
                        />
                        <span>{STATUS_CONFIG[app.status]?.label}</span>
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className={`inline-flex px-1.5 py-0.5 rounded-md text-[10px] font-bold border uppercase ${
                          PRIORITY_CONFIG[app.priority]?.badge
                        }`}
                      >
                        {app.priority}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-ink-3 font-mono text-[11px]">
                      {app.applied_date ? app.applied_date.split('T')[0] : '—'}
                    </td>
                    <td className="px-3 py-3.5 text-ink-2 font-mono text-[11px]">
                      {app.salary_min
                        ? `$${app.salary_min.toLocaleString()} ${
                            app.salary_max ? `- $${app.salary_max.toLocaleString()}` : ''
                          }`
                        : '—'}
                    </td>
                    <td className="px-3 py-3.5 text-ink-3 text-[11px]">
                      {app.next_followup_date || 'No upcoming alarms'}
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveDetailApp(app);
                          setDetailTab('overview');
                        }}
                        className="p-1.5 rounded-lg hover:bg-surface-3 text-ink-3 hover:text-ink cursor-pointer"
                        title="View detail"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE NEW APPLICATION MODAL */}
      {isCreateModalOpen && (
        <CreateApplicationModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={(newApp) => {
            setApplications((prev) => [newApp, ...prev]);
            setIsCreateModalOpen(false);
            showToast(`Added application for ${newApp.company_name}!`);
          }}
        />
      )}

      {/* APPLICATION DETAIL DRAWER / MODAL */}
      {activeDetailApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-line bg-surface shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-line flex items-center justify-between shrink-0 bg-surface-2/40">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-ink">
                    {activeDetailApp.company_name}
                  </h3>
                  {activeDetailApp.company_website && (
                    <a
                      href={activeDetailApp.company_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink-3 hover:text-ink"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      PRIORITY_CONFIG[activeDetailApp.priority]?.badge
                    }`}
                  >
                    {activeDetailApp.priority}
                  </span>
                </div>
                <p className="text-xs text-ink-2 font-medium">
                  {activeDetailApp.role_title} • {activeDetailApp.remote_type}
                </p>
              </div>

              {/* Status Switcher & Close */}
              <div className="flex items-center gap-2">
                <select
                  value={activeDetailApp.status}
                  onChange={(e) =>
                    handleUpdateStatus(
                      activeDetailApp.id,
                      e.target.value as CareerApplicationStatus
                    )
                  }
                  className={`h-8 px-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                    STATUS_CONFIG[activeDetailApp.status]?.bg
                  } ${STATUS_CONFIG[activeDetailApp.status]?.color}`}
                >
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setActiveDetailApp(null)}
                  className="size-8 rounded-xl border border-line bg-surface hover:bg-surface-3 grid place-items-center text-ink-3 hover:text-ink transition-colors cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Modal Tab Navigation */}
            <div className="flex items-center gap-2 px-6 border-b border-line bg-surface-2/20 text-xs font-semibold shrink-0">
              <button
                type="button"
                onClick={() => setDetailTab('overview')}
                className={`py-3 px-2 border-b-2 transition-all cursor-pointer ${
                  detailTab === 'overview'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'border-transparent text-ink-3 hover:text-ink'
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('interviews')}
                className={`py-3 px-2 border-b-2 transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  detailTab === 'interviews'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'border-transparent text-ink-3 hover:text-ink'
                }`}
              >
                <span>Interviews &amp; Q&amp;A</span>
                <span className="size-4 rounded-full bg-surface-3 text-[10px] grid place-items-center">
                  {activeDetailApp.interviews?.length || 0}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('contacts')}
                className={`py-3 px-2 border-b-2 transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  detailTab === 'contacts'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'border-transparent text-ink-3 hover:text-ink'
                }`}
              >
                <span>Contacts</span>
                <span className="size-4 rounded-full bg-surface-3 text-[10px] grid place-items-center">
                  {activeDetailApp.contacts?.length || 0}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('email')}
                className={`py-3 px-2 border-b-2 transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  detailTab === 'email'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'border-transparent text-ink-3 hover:text-ink'
                }`}
              >
                <Sparkles className="size-3.5 text-amber-500" />
                <span>Follow-up Generator</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {detailTab === 'overview' && (
                <div className="space-y-4">
                  {/* Grid of basic attributes */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="rounded-xl border border-line bg-surface-2 p-3">
                      <span className="text-ink-4 text-[10px] font-semibold uppercase">Source</span>
                      <p className="font-semibold text-ink mt-0.5 capitalize">{activeDetailApp.source}</p>
                    </div>
                    <div className="rounded-xl border border-line bg-surface-2 p-3">
                      <span className="text-ink-4 text-[10px] font-semibold uppercase">Salary Range</span>
                      <p className="font-semibold text-ink mt-0.5">
                        {activeDetailApp.salary_min
                          ? `$${activeDetailApp.salary_min.toLocaleString()} - $${(activeDetailApp.salary_max || activeDetailApp.salary_min).toLocaleString()}`
                          : 'Not specified'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-line bg-surface-2 p-3">
                      <span className="text-ink-4 text-[10px] font-semibold uppercase">Applied Date</span>
                      <p className="font-semibold text-ink mt-0.5">
                        {activeDetailApp.applied_date ? activeDetailApp.applied_date.split('T')[0] : '—'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-line bg-surface-2 p-3">
                      <span className="text-ink-4 text-[10px] font-semibold uppercase">CV Submitted</span>
                      <p className="font-semibold text-ink mt-0.5 truncate">
                        {activeDetailApp.cv_version || 'Default Portfolio'}
                      </p>
                    </div>
                  </div>

                  {/* Notes & context */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-ink-2">Application Notes &amp; Highlights</label>
                    <div className="p-3.5 rounded-xl border border-line bg-surface-2 text-xs text-ink-2 whitespace-pre-wrap leading-relaxed">
                      {activeDetailApp.notes || 'No specific notes recorded yet.'}
                    </div>
                  </div>

                  {/* Next follow-up alarm */}
                  <div className="p-4 rounded-2xl border border-line bg-surface-2 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-ink block">Next Proactive Follow-up</span>
                      <span className="text-[11px] text-ink-3">
                        {activeDetailApp.next_followup_date
                          ? `${activeDetailApp.next_followup_date} — ${activeDetailApp.next_followup_notes || 'Follow up with recruiter'}`
                          : 'No alarm scheduled'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDetailTab('email')}
                      className="btn btn-secondary h-8 px-3 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Draft Email
                    </button>
                  </div>
                </div>
              )}

              {detailTab === 'interviews' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-ink">Interview Schedule &amp; Rounds</h4>
                    <span className="text-xs text-ink-3">
                      {activeDetailApp.interviews?.length || 0} rounds total
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {(!activeDetailApp.interviews || activeDetailApp.interviews.length === 0) ? (
                      <p className="text-xs text-ink-3 py-6 text-center">No interview rounds recorded.</p>
                    ) : (
                      activeDetailApp.interviews.map((intv) => (
                        <div
                          key={intv.id}
                          className="rounded-2xl border border-line bg-surface-2 p-4 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="size-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs grid place-items-center">
                                R{intv.round}
                              </span>
                              <span className="font-bold text-xs text-ink">{intv.title}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface border border-line capitalize">
                                {intv.stage}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                intv.completed
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                              }`}
                            >
                              {intv.completed ? 'Completed' : 'Upcoming'}
                            </span>
                          </div>

                          {intv.notes && (
                            <p className="text-xs text-ink-3 leading-relaxed">{intv.notes}</p>
                          )}

                          {intv.questions && intv.questions.length > 0 && (
                            <div className="pt-2 border-t border-line/60 space-y-1.5">
                              <span className="text-[10px] font-bold text-ink-4 uppercase">
                                Questions &amp; Prep Notes
                              </span>
                              {intv.questions.map((q, idx) => (
                                <div key={idx} className="p-2 rounded-lg bg-surface text-xs space-y-1">
                                  <div className="font-semibold text-ink">Q: {q.q}</div>
                                  {q.a && <div className="text-ink-3 text-[11px]">A: {q.a}</div>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {detailTab === 'contacts' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-ink">Recruiter &amp; Team Contacts</h4>
                  {(!activeDetailApp.contacts || activeDetailApp.contacts.length === 0) ? (
                    <p className="text-xs text-ink-3 py-6 text-center">No contacts added for this company.</p>
                  ) : (
                    activeDetailApp.contacts.map((cnt) => (
                      <div
                        key={cnt.id}
                        className="rounded-2xl border border-line bg-surface-2 p-4 flex items-center justify-between"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-ink">{cnt.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-surface border border-line text-ink-3 capitalize">
                              {cnt.role}
                            </span>
                          </div>
                          {cnt.email && (
                            <p className="text-xs text-ink-3 font-mono">{cnt.email}</p>
                          )}
                        </div>
                        {cnt.linkedin && (
                          <a
                            href={cnt.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                          >
                            <span>LinkedIn</span>
                            <ExternalLink className="size-3" />
                          </a>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {detailTab === 'email' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(
                        [
                          { id: 'follow_up', label: 'Proactive Follow-up' },
                          { id: 'thank_you', label: 'Post-Interview Thank You' },
                          { id: 'negotiation', label: 'Offer Negotiation' },
                          { id: 'status_inquiry', label: 'Status Inquiry' },
                        ] as const
                      ).map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setEmailTemplateType(t.id)}
                          className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                            emailTemplateType === t.id
                              ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-bold'
                              : 'bg-surface-2 border-line text-ink-3 hover:text-ink'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={copyEmailText}
                      className="btn btn-primary h-8 px-3 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedEmail ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                      <span>{copiedEmail ? 'Copied!' : 'Copy Template'}</span>
                    </button>
                  </div>

                  <textarea
                    rows={10}
                    readOnly
                    value={generatedEmail}
                    className="w-full p-4 rounded-2xl bg-surface-2 border border-line text-xs font-sans text-ink leading-relaxed resize-none focus:outline-hidden"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer with Delete Option */}
            <div className="p-4 border-t border-line bg-surface-2/40 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => handleDeleteApplication(activeDetailApp.id)}
                className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="size-3.5" />
                <span>Delete Application</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveDetailApp(null)}
                className="btn btn-secondary h-8 px-4 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// CREATE MODAL COMPONENT
const CreateApplicationModal: React.FC<{
  onClose: () => void;
  onCreated: (app: CareerApplication) => void;
}> = ({ onClose, onCreated }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<CareerApplicationStatus>('applied');
  const [priority, setPriority] = useState<CareerPriorityLevel>('high');
  const [salaryMin, setSalaryMin] = useState<string>('120000');
  const [salaryMax, setSalaryMax] = useState<string>('150000');
  const [remoteType, setRemoteType] = useState<'remote' | 'hybrid' | 'onsite'>('remote');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !roleTitle.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/admin/career', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName,
          role_title: roleTitle,
          company_website: website,
          status,
          priority,
          remote_type: remoteType,
          salary_min: Number(salaryMin) || undefined,
          salary_max: Number(salaryMax) || undefined,
          notes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onCreated(data.application);
      }
    } catch (err) {
      console.error('Failed to create application:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl border border-line bg-surface shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="p-5 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-indigo-500/10 text-indigo-600">
              <Plus className="size-4" />
            </span>
            <h3 className="text-sm font-bold text-ink">New Career Opportunity</h3>
          </div>
          <button type="button" onClick={onClose} className="text-ink-3 hover:text-ink">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-ink-2 mb-1 block">Company Name *</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Stripe, OpenAI"
                className="w-full h-9 px-3 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-ink-2 mb-1 block">Role Title *</label>
              <input
                type="text"
                required
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Senior Full Stack Engineer"
                className="w-full h-9 px-3 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-ink-2 mb-1 block">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CareerApplicationStatus)}
                className="w-full h-9 px-2 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden"
              >
                <option value="saved">Saved</option>
                <option value="applied">Applied</option>
                <option value="screening">Screening</option>
                <option value="technical">Technical</option>
                <option value="offer">Offer</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-ink-2 mb-1 block">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as CareerPriorityLevel)}
                className="w-full h-9 px-2 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-ink-2 mb-1 block">Workplace</label>
              <select
                value={remoteType}
                onChange={(e) => setRemoteType(e.target.value as 'remote' | 'hybrid' | 'onsite')}
                className="w-full h-9 px-2 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden"
              >
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-ink-2 mb-1 block">Min Salary ($/yr)</label>
              <input
                type="number"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                placeholder="120000"
                className="w-full h-9 px-3 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-ink-2 mb-1 block">Max Salary ($/yr)</label>
              <input
                type="number"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                placeholder="150000"
                className="w-full h-9 px-3 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-ink-2 mb-1 block">Website or Job Post URL</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://..."
              className="w-full h-9 px-3 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-ink-2 mb-1 block">Notes &amp; Talking Points</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key insights, referrer details, or interview notes..."
              className="w-full p-3 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary h-9 px-4 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !companyName.trim() || !roleTitle.trim()}
              className="btn btn-primary h-9 px-5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
              <span>Save Application</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
