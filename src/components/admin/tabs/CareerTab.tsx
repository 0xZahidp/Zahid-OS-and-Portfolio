'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
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
  X,
  Loader2,
  Download,
} from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
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
    dot: 'bg-neutral-400 dark:bg-neutral-500',
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
    label: 'Final',
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
    label: 'Closed',
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

const PRIORITY_BORDER: Record<CareerPriorityLevel, string> = {
  urgent: 'border-l-[3px] border-l-rose-500',
  high: 'border-l-[3px] border-l-amber-500',
  medium: 'border-l-[3px] border-l-blue-500',
  low: 'border-l-[3px] border-l-neutral-400 dark:border-l-neutral-600',
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

const KANBAN_STAGES: {
  id: CareerApplicationStatus;
  title: string;
  dot: string;
}[] = [
  { id: 'saved', title: 'Saved', dot: 'bg-neutral-400 dark:bg-neutral-500' },
  { id: 'applied', title: 'Applied', dot: 'bg-blue-500' },
  { id: 'screening', title: 'Screening', dot: 'bg-purple-500' },
  { id: 'technical', title: 'Technical', dot: 'bg-amber-500' },
  { id: 'manager', title: 'Final', dot: 'bg-orange-500' },
  { id: 'offer', title: 'Offer', dot: 'bg-emerald-500' },
  { id: 'rejected', title: 'Closed', dot: 'bg-rose-500' },
];

const AVATAR_COLORS = [
  'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  'bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/30',
  'bg-violet-500/20 text-violet-600 dark:text-violet-400 border-violet-500/30',
  'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
  'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30',
  'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
  'bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-500/30',
];

function getCompanyAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function formatRelativeDueDate(dateStr?: string): { label: string; status: 'overdue' | 'soon' | 'normal' } | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now = new Date();
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diffDays = Math.round((targetDay - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      label: overdueDays === 1 ? '1d overdue' : `${overdueDays}d overdue`,
      status: 'overdue',
    };
  }
  if (diffDays === 0) {
    return { label: 'Today', status: 'soon' };
  }
  if (diffDays === 1) {
    return { label: 'Tomorrow', status: 'soon' };
  }
  if (diffDays <= 2) {
    return { label: `in ${diffDays}d`, status: 'soon' };
  }
  return { label: `in ${diffDays}d`, status: 'normal' };
}

function getDaysInStage(app: CareerApplication): number {
  const dateStr = app.stageChangedAt || app.updated_at || app.created_at;
  if (!dateStr) return 0;
  const diffMs = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

interface KanbanCardProps {
  app: CareerApplication;
  onClick: () => void;
  isOverlay?: boolean;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ app, onClick, isOverlay = false }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: app.id,
    disabled: isOverlay,
  });

  const dueInfo = formatRelativeDueDate(app.next_followup_date);
  const daysInStage = getDaysInStage(app);
  const avatarColor = getCompanyAvatarColor(app.company_name);
  const priorityBorder = PRIORITY_BORDER[app.priority] || PRIORITY_BORDER.medium;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`rounded-2xl border border-line bg-surface p-3 space-y-2.5 transition-all shadow-2xs hover:shadow-md cursor-grab active:cursor-grabbing group relative select-none ${priorityBorder} ${
        isDragging ? 'opacity-30 border-dashed border-indigo-500' : 'hover:border-line-hover'
      }`}
    >
      {/* Top: Avatar + Company Name */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={`size-7 rounded-lg border flex items-center justify-center font-bold text-xs shrink-0 ${avatarColor}`}
        >
          {app.company_name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-ink truncate leading-tight">
            {app.company_name}
          </p>
          {app.company_location && (
            <p className="text-[10px] text-ink-3 truncate leading-none mt-0.5">
              {app.company_location}
            </p>
          )}
        </div>
      </div>

      {/* Role Title (up to 2 lines, line-clamp-2, no single-line truncation) */}
      <h4 className="text-xs font-semibold text-ink line-clamp-2 leading-snug">
        {app.role_title}
      </h4>

      {/* Chips: Salary, Remote, Scholarship */}
      <div className="flex flex-wrap items-center gap-1.5">
        {(app.salary_min || app.salary_max) && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-surface-2 border border-line text-ink-2 font-medium">
            ${app.salary_min ? `${Math.round(app.salary_min / 1000)}k` : ''}
            {app.salary_min && app.salary_max ? '–' : ''}
            {app.salary_max ? `${Math.round(app.salary_max / 1000)}k` : ''}
          </span>
        )}
        <span className="text-[10px] capitalize px-1.5 py-0.5 rounded-md bg-surface-2 border border-line text-ink-3">
          {app.remote_type}
        </span>
        {app.type === 'scholarship' && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-semibold">
            Scholarship
          </span>
        )}
      </div>

      {/* Footer: Due date + Days in stage */}
      <div className="flex items-center justify-between pt-2 border-t border-line/60 text-[10px]">
        {dueInfo ? (
          <span
            title={`Follow-up deadline: ${app.next_followup_date}`}
            className={`font-medium flex items-center gap-1 ${
              dueInfo.status === 'overdue'
                ? 'text-rose-500 font-bold'
                : dueInfo.status === 'soon'
                ? 'text-amber-500 font-semibold'
                : 'text-ink-3'
            }`}
          >
            <Clock className="size-2.5" />
            <span>{dueInfo.label}</span>
          </span>
        ) : (
          <span className="text-ink-4">No follow-up</span>
        )}

        <span
          title={`Stage last moved: ${app.stageChangedAt || app.updated_at || app.created_at}`}
          className={`font-mono ${
            daysInStage >= 10 ? 'text-amber-500 font-semibold' : 'text-ink-4'
          }`}
        >
          {daysInStage}d in stage
        </span>
      </div>
    </div>
  );
};

interface KanbanColumnProps {
  stage: {
    id: CareerApplicationStatus;
    title: string;
    dot: string;
  };
  apps: CareerApplication[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSelectApp: (app: CareerApplication) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  stage,
  apps,
  isExpanded,
  onToggleExpand,
  onSelectApp,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  const isEmpty = apps.length === 0;
  const showExpanded = !isEmpty || isExpanded || isOver;

  if (!showExpanded) {
    // Collapsed 48px rail
    return (
      <div
        ref={setNodeRef}
        onClick={onToggleExpand}
        className="w-12 shrink-0 rounded-2xl border border-line/70 bg-surface-2/30 hover:bg-surface-2/60 transition-all flex flex-col items-center justify-between py-5 cursor-pointer min-h-[420px] group select-none hover:border-line"
        title={`Click to expand ${stage.title} (0)`}
      >
        <div className="flex flex-col items-center gap-2">
          <span className={`size-2 rounded-full ${stage.dot}`} />
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-surface border border-line text-ink-3">
            0
          </span>
        </div>

        <div
          style={{ writingMode: 'vertical-rl' }}
          className="rotate-180 text-xs font-bold tracking-wider uppercase text-ink-3 group-hover:text-ink transition-colors"
        >
          {stage.title}
        </div>

        <div className="size-2" />
      </div>
    );
  }

  // Expanded column (min 260px, max 340px, share remaining width)
  return (
    <div
      ref={setNodeRef}
      className={`min-w-[260px] max-w-[340px] flex-1 shrink-0 rounded-3xl border p-3 flex flex-col min-h-[420px] transition-all bg-surface-2/20 select-none ${
        isOver
          ? 'border-indigo-500 bg-indigo-500/5 shadow-md ring-2 ring-indigo-500/20'
          : 'border-line/70'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2 px-1 border-b border-line/60 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`size-2 rounded-full shrink-0 ${stage.dot}`} />
          <h4 className="text-xs font-bold text-ink truncate tracking-tight">{stage.title}</h4>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-surface border border-line text-ink-3 shrink-0">
          {apps.length}
        </span>
      </div>

      {/* Cards List */}
      <div className="space-y-2.5 flex-1 overflow-y-auto pr-0.5 [scrollbar-width:thin]">
        {apps.map((app) => (
          <KanbanCard key={app.id} app={app} onClick={() => onSelectApp(app)} />
        ))}
        {apps.length === 0 && (
          <div className="h-32 border-2 border-dashed border-line/60 rounded-2xl flex flex-col items-center justify-center p-3 text-center">
            <p className="text-xs text-ink-4">Drop cards here</p>
          </div>
        )}
      </div>
    </div>
  );
};

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
  const [typeFilter, setTypeFilter] = useState<'all' | 'job' | 'scholarship'>('all');
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

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

  // Drag and drop & Column expansion state
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const activeDragApp = useMemo(() => {
    return activeDragId ? applications.find((a) => a.id === activeDragId) || null : null;
  }, [activeDragId, applications]);

  const toggleStageExpand = (stageId: string) => {
    setExpandedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stageId)) {
        next.delete(stageId);
      } else {
        next.add(stageId);
      }
      return next;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over) return;

    const draggedId = String(active.id);
    const draggedApp = applications.find((a) => a.id === draggedId);
    if (!draggedApp) return;

    let targetStatus: CareerApplicationStatus | null = null;
    const isDirectStage = KANBAN_STAGES.some((s) => s.id === over.id);

    if (isDirectStage) {
      targetStatus = over.id as CareerApplicationStatus;
    } else {
      const targetApp = applications.find((a) => a.id === String(over.id));
      if (targetApp) {
        targetStatus = targetApp.status;
      }
    }

    if (!targetStatus || targetStatus === draggedApp.status) return;

    // Optimistic update
    const previousApps = [...applications];
    const nowIso = new Date().toISOString();
    const updatedApps = applications.map((a) =>
      a.id === draggedId
        ? {
            ...a,
            status: targetStatus!,
            stageChangedAt: nowIso,
            updated_at: nowIso,
          }
        : a
    );

    setApplications(updatedApps);
    if (activeDetailApp?.id === draggedId) {
      setActiveDetailApp((prev) =>
        prev
          ? {
              ...prev,
              status: targetStatus!,
              stageChangedAt: nowIso,
              updated_at: nowIso,
            }
          : null
      );
    }
    setSaveState('saving');

    try {
      const res = await fetch('/api/admin/career', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: draggedId, status: targetStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        setApplications((prev) =>
          prev.map((a) => (a.id === draggedId ? data.application : a))
        );
        if (activeDetailApp?.id === draggedId) {
          setActiveDetailApp(data.application);
        }
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 2000);
        const stageName =
          KANBAN_STAGES.find((s) => s.id === targetStatus)?.title || targetStatus;
        showToast(`Moved ${draggedApp.company_name} to ${stageName}`);
      } else {
        setApplications(previousApps);
        setSaveState('error');
        showToast('Failed to update stage. Rolled back.');
      }
    } catch {
      setApplications(previousApps);
      setSaveState('error');
      showToast('Network error updating stage. Rolled back.');
    }
  };

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
      setSaveState('saving');
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
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 2000);
        showToast(`Status updated to ${STATUS_CONFIG[newStatus].label}`);
      } else {
        setSaveState('error');
        showToast('Error updating status');
      }
    } catch {
      setSaveState('error');
      showToast('Error updating status');
    }
  };

  // Delete Application
  const handleDeleteApplication = async (appId: string) => {
    if (!confirm('Are you sure you want to delete this application record?')) return;
    try {
      setSaveState('saving');
      const res = await fetch(`/api/admin/career?id=${appId}`, { method: 'DELETE' });
      if (res.ok) {
        setApplications((prev) => prev.filter((a) => a.id !== appId));
        if (activeDetailApp?.id === appId) {
          setActiveDetailApp(null);
        }
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 2000);
        showToast('Application deleted');
      } else {
        setSaveState('error');
        showToast('Error deleting application');
      }
    } catch {
      setSaveState('error');
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
      if (typeFilter !== 'all' && (app.type || 'job') !== typeFilter) return false;

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
  }, [applications, showArchived, statusFilter, priorityFilter, typeFilter, search]);

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
    <div className="w-full px-6 py-5 space-y-4 select-none pb-20">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-neutral-900 text-white px-4 py-2.5 shadow-xl border border-white/10 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="size-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Compact Single-Row Metrics Strip (56px tall) */}
      <div className="h-14 px-4 rounded-2xl border border-line bg-surface-2/40 flex items-center justify-between text-xs overflow-x-auto shrink-0 [scrollbar-width:thin]">
        <div className="flex items-center gap-6 divide-x divide-line/60">
          <div className="flex items-center gap-2">
            <Building className="size-3.5 text-ink-3" />
            <span className="text-ink-3">Total</span>
            <span className="font-mono font-bold text-ink">{metrics.total}</span>
          </div>

          <div className="flex items-center gap-2 pl-6">
            <TrendingUp className="size-3.5 text-indigo-500 dark:text-indigo-400" />
            <span className="text-ink-3">Pipeline</span>
            <span className="font-mono font-bold text-ink">{metrics.active}</span>
          </div>

          <div className="flex items-center gap-2 pl-6">
            <Calendar className="size-3.5 text-amber-500 dark:text-amber-400" />
            <span className="text-ink-3">Interviews</span>
            <span className="font-mono font-bold text-ink">{metrics.interviewsScheduled}</span>
          </div>

          <div className="flex items-center gap-2 pl-6">
            <Award className="size-3.5 text-emerald-500 dark:text-emerald-400" />
            <span className="text-ink-3">Offers</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{metrics.offers}</span>
          </div>

          <div className="flex items-center gap-2 pl-6">
            <AlertCircle className={`size-3.5 ${metrics.overdueFollowups > 0 ? 'text-rose-500' : 'text-ink-3'}`} />
            <span className={metrics.overdueFollowups > 0 ? 'text-rose-500 font-semibold' : 'text-ink-3'}>Overdue</span>
            <span className={`font-mono font-bold ${metrics.overdueFollowups > 0 ? 'text-rose-500' : 'text-ink'}`}>
              {metrics.overdueFollowups}
            </span>
          </div>
        </div>

        {/* Private Confidential Beacon */}
        <div className="hidden md:flex items-center gap-1.5 text-[10px] text-ink-3 font-semibold px-2 py-1 rounded-lg bg-surface border border-line">
          <Lock className="size-3 text-ink-3" />
          <span>Private CRM</span>
        </div>
      </div>

      {/* 2. ONE Toolbar Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left Controls in Exact Specified Order */}
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          {/* View switch (Board / Table) */}
          <div className="inline-flex rounded-xl border border-line bg-surface-2 p-0.5 shrink-0">
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
            className="h-8.5 px-2.5 rounded-xl border border-line bg-surface-2 text-xs font-medium text-ink focus:outline-hidden cursor-pointer shrink-0"
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
            className="h-8.5 px-2.5 rounded-xl border border-line bg-surface-2 text-xs font-medium text-ink focus:outline-hidden cursor-pointer shrink-0"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Type filter (All / Job / Scholarship) */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | 'job' | 'scholarship')}
            className="h-8.5 px-2.5 rounded-xl border border-line bg-surface-2 text-xs font-medium text-ink focus:outline-hidden cursor-pointer shrink-0"
          >
            <option value="all">All Types</option>
            <option value="job">Jobs</option>
            <option value="scholarship">Scholarships</option>
          </select>

          {/* Show Archived toggle */}
          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className={`h-8.5 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer shrink-0 ${
              showArchived
                ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'border-line bg-surface-2 text-ink-3 hover:text-ink'
            }`}
          >
            {showArchived ? 'Viewing Archived' : 'Show Archived'}
          </button>

          {/* Search input (flex-1, max-w-sm) */}
          <div className="relative flex-1 max-w-sm min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-ink-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company, role, notes..."
              className="w-full h-8.5 pl-8 pr-3 rounded-xl border border-line bg-surface-2 text-xs text-ink placeholder:text-ink-4 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Right Section: Status Indicator, Export, and New Application */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Save Status Indicator */}
          {saveState === 'saving' && (
            <span className="text-xs text-ink-3 flex items-center gap-1.5">
              <Loader2 className="size-3 animate-spin text-ink-3" />
              <span>Saving…</span>
            </span>
          )}
          {saveState === 'saved' && (
            <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1 animate-in fade-in">
              <Check className="size-3" />
              <span>Saved ✓</span>
            </span>
          )}
          {saveState === 'error' && (
            <button
              type="button"
              onClick={() => fetchApplications()}
              className="text-xs text-rose-500 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <AlertCircle className="size-3" />
              <span>Save failed, retry</span>
            </button>
          )}

          {/* Export Button */}
          <button
            type="button"
            onClick={handleExportData}
            className="btn btn-secondary h-8.5 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            title="Export JSON snapshot"
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Primary New Application Button */}
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary h-8.5 px-3.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>New Application</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="size-6 text-indigo-500 animate-spin" />
          <span className="text-xs font-mono text-ink-3">Loading pipeline...</span>
        </div>
      ) : viewMode === 'kanban' ? (
        /* KANBAN BOARD VIEW (Redesigned with @dnd-kit & collapsible empty rails) */
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 items-start overflow-x-auto pb-6 pt-1 w-full [scrollbar-width:thin]">
            {KANBAN_STAGES.map((stage) => {
              const stageApps = filteredApps.filter((a) => {
                if (stage.id === 'rejected') {
                  return a.status === 'rejected' || a.status === 'withdrawn';
                }
                return a.status === stage.id;
              });

              return (
                <KanbanColumn
                  key={stage.id}
                  stage={stage}
                  apps={stageApps}
                  isExpanded={expandedStages.has(stage.id)}
                  onToggleExpand={() => toggleStageExpand(stage.id)}
                  onSelectApp={(app) => {
                    setActiveDetailApp(app);
                    setDetailTab('overview');
                  }}
                />
              );
            })}
          </div>

          <DragOverlay>
            {activeDragApp ? (
              <div className="rotate-2 opacity-95 shadow-2xl scale-105 pointer-events-none w-72">
                <KanbanCard app={activeDragApp} onClick={() => {}} isOverlay />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
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
  const [opportunityType, setOpportunityType] = useState<'job' | 'scholarship'>('job');
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
          type: opportunityType,
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

          <div className="grid grid-cols-4 gap-2.5">
            <div>
              <label className="text-[11px] font-semibold text-ink-2 mb-1 block">Type</label>
              <select
                value={opportunityType}
                onChange={(e) => setOpportunityType(e.target.value as 'job' | 'scholarship')}
                className="w-full h-9 px-2 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden"
              >
                <option value="job">Job</option>
                <option value="scholarship">Scholarship</option>
              </select>
            </div>
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
