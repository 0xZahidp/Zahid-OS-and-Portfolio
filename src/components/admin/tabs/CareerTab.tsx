'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Zap,
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
  CareerInterview,
  CareerContact,
} from '@/types/career';
import { useAdminAuth } from '@/context/AdminAuthContext';

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

function formatRelativeDate(dateStr?: string): { label: string; full: string } {
  if (!dateStr) return { label: '—', full: 'No date recorded' };
  try {
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return { label: '—', full: 'Invalid date' };
    const full = target.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const now = new Date();
    const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const diffDays = Math.round((targetDay - today) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { label: 'Today', full };
    if (diffDays === 1) return { label: 'Tomorrow', full };
    if (diffDays === -1) return { label: 'Yesterday', full };
    if (diffDays > 1 && diffDays <= 7) return { label: `in ${diffDays}d`, full };
    if (diffDays < -1 && diffDays >= -7) return { label: `${Math.abs(diffDays)}d ago`, full };
    if (diffDays > 7 && diffDays <= 30) return { label: `in ${Math.round(diffDays / 7)}w`, full };
    if (diffDays < -7 && diffDays >= -30) return { label: `${Math.round(Math.abs(diffDays) / 7)}w ago`, full };
    return { label: full, full };
  } catch {
    return { label: '—', full: 'Invalid date' };
  }
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
  const { session } = useAdminAuth();

  const getAuthHeaders = useCallback((): HeadersInit => ({
    'Content-Type': 'application/json',
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  }), [session?.access_token]);

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
  const [loadError, setLoadError] = useState<boolean>(false);
  const [careerVersion, setCareerVersion] = useState<number>(0);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [activeDetailApp, setActiveDetailApp] = useState<CareerApplication | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // CRM Features & Strip State
  const [isNextActionsCollapsed, setIsNextActionsCollapsed] = useState<boolean>(false);
  const [isFunnelCollapsed, setIsFunnelCollapsed] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);

  // Table sorting
  type SortField = 'company' | 'role' | 'status' | 'priority' | 'salary' | 'followup' | 'updated';
  type SortDirection = 'asc' | 'desc';
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection | null>(null);

  // Search input ref for keyboard shortcut '/'
  const searchInputRef = useRef<HTMLInputElement>(null);

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
    if (loadError) return;
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
        headers: getAuthHeaders(),
        body: JSON.stringify({ id: draggedId, status: targetStatus, expectedVersion: careerVersion }),
      });

      if (res.ok) {
        const data = await res.json();
        if (typeof data.version === 'number') {
          setCareerVersion(data.version);
        }
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
      } else if (res.status === 409) {
        setApplications(previousApps);
        setSaveState('error');
        showToast('This data changed elsewhere, reload before saving');
        fetchApplications();
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

  const fetchApplications = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/career', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
        if (data.metrics) setMetrics(data.metrics);
        setCareerVersion(typeof data.version === 'number' ? data.version : 0);
        setLoadError(false);
      } else {
        setLoadError(true);
      }
    } catch (err) {
      console.error('Failed to load career applications:', err);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  useEffect(() => {
    if (loadError) {
      setActiveDetailApp(null);
      setIsCreateModalOpen(false);
    }
  }, [loadError]);

  // Open detail panel and sync URL hash
  const handleOpenDetail = (app: CareerApplication) => {
    if (loadError) return;
    setActiveDetailApp(app);
    try {
      window.history.replaceState(null, '', `#career=${app.id}`);
    } catch {
      // ignore
    }
  };

  // Close detail panel and restore URL
  const handleCloseDetail = () => {
    setActiveDetailApp(null);
    try {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    } catch {
      // ignore
    }
  };

  // Restore active detail from URL hash on load
  useEffect(() => {
    try {
      const hash = window.location.hash;
      if (hash.startsWith('#career=')) {
        const id = hash.replace('#career=', '');
        const matched = applications.find((a) => a.id === id);
        if (matched) {
          setActiveDetailApp(matched);
        }
      }
    } catch {
      // ignore
    }
  }, [applications]);

  // Sync back/forward hash changes
  useEffect(() => {
    const handleHash = () => {
      try {
        const hash = window.location.hash;
        if (hash.startsWith('#career=')) {
          const id = hash.replace('#career=', '');
          const matched = applications.find((a) => a.id === id);
          if (matched) setActiveDetailApp(matched);
        } else {
          setActiveDetailApp(null);
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [applications]);

  // Load persisted collapse states safely from localStorage
  useEffect(() => {
    try {
      const savedActions = localStorage.getItem('career-next-actions-collapsed');
      if (savedActions !== null) {
        setIsNextActionsCollapsed(savedActions === 'true');
      }
      const savedFunnel = localStorage.getItem('career-funnel-collapsed');
      if (savedFunnel !== null) {
        setIsFunnelCollapsed(savedFunnel === 'true');
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleNextActions = () => {
    setIsNextActionsCollapsed((prev) => {
      const nextVal = !prev;
      try {
        localStorage.setItem('career-next-actions-collapsed', String(nextVal));
      } catch {
        // ignore
      }
      return nextVal;
    });
  };

  const toggleFunnelCollapsed = () => {
    setIsFunnelCollapsed((prev) => {
      const nextVal = !prev;
      try {
        localStorage.setItem('career-funnel-collapsed', String(nextVal));
      } catch {
        // ignore
      }
      return nextVal;
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField !== field) {
      setSortField(field);
      setSortDirection('asc');
    } else if (sortDirection === 'asc') {
      setSortDirection('desc');
    } else {
      setSortField(null);
      setSortDirection(null);
    }
  };

  // Keyboard shortcuts (N, /, B, T, Esc, ?)
  useEffect(() => {
    const isInputFocused = () => {
      const active = document.activeElement;
      if (!active) return false;
      const tag = active.tagName.toLowerCase();
      return tag === 'input' || tag === 'textarea' || (active as HTMLElement).isContentEditable;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // If modal or popover open, Esc closes it
      if (isHelpModalOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setIsHelpModalOpen(false);
        }
        return;
      }

      if (isCreateModalOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setIsCreateModalOpen(false);
        }
        return;
      }

      // If activeDetailApp is open, Esc closes it
      if (e.key === 'Escape' && activeDetailApp) {
        e.preventDefault();
        handleCloseDetail();
        return;
      }

      // If user is focused in input, textarea, or contenteditable, do not trigger shortcuts
      if (isInputFocused()) return;

      const key = e.key.toLowerCase();
      if (key === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        if (!loadError && !isLoading) {
          setIsCreateModalOpen(true);
        }
      } else if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (key === 'b' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setViewMode('kanban');
      } else if (key === 't' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setViewMode('table');
      } else if (e.key === '?' || (e.shiftKey && e.key === '?')) {
        e.preventDefault();
        setIsHelpModalOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDetailApp, isCreateModalOpen, isHelpModalOpen, loadError, isLoading]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Delete Application
  const handleDeleteApplication = async (appId: string) => {
    if (loadError) return;
    if (!confirm('Are you sure you want to delete this application record?')) return;
    try {
      setSaveState('saving');
      const res = await fetch(`/api/admin/career?id=${appId}&expectedVersion=${careerVersion}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.version === 'number') {
          setCareerVersion(data.version);
        }
        setApplications((prev) => prev.filter((a) => a.id !== appId));
        if (activeDetailApp?.id === appId) {
          setActiveDetailApp(null);
        }
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 2000);
        showToast('Application deleted');
      } else if (res.status === 409) {
        setSaveState('error');
        showToast('This data changed elsewhere, reload before saving');
        fetchApplications();
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

  // Next actions strip groups (Due today, Overdue, Stale > 10d)
  const nextActionsData = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    const dueToday: CareerApplication[] = [];
    const overdue: CareerApplication[] = [];
    const stale: CareerApplication[] = [];

    for (const app of applications) {
      if (app.archived) continue;
      const isTerminal = app.status === 'rejected' || app.status === 'withdrawn' || app.status === 'offer';

      if (app.next_followup_date) {
        const target = new Date(app.next_followup_date);
        const targetStart = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
        const diffDays = Math.round((targetStart - todayStart) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
          dueToday.push(app);
        } else if (diffDays < 0 && !isTerminal) {
          overdue.push(app);
        }
      }

      if (!isTerminal) {
        const days = getDaysInStage(app);
        if (days > 10) {
          stale.push(app);
        }
      }
    }

    return {
      dueToday,
      overdue,
      stale,
      totalCount: dueToday.length + overdue.length + stale.length,
    };
  }, [applications]);

  // Stage Conversion Funnel (Applied -> Screening -> Technical -> Final -> Offer)
  const funnelData = useMemo(() => {
    const nonArchived = applications.filter((a) => !a.archived);

    const getStageRank = (status: CareerApplicationStatus) => {
      switch (status) {
        case 'offer':
          return 5;
        case 'manager':
          return 4;
        case 'technical':
          return 3;
        case 'screening':
          return 2;
        case 'applied':
          return 1;
        case 'rejected':
        case 'withdrawn':
          return 1;
        default:
          return 0;
      }
    };

    const appliedCount = nonArchived.filter((a) => getStageRank(a.status) >= 1).length;
    const screeningCount = nonArchived.filter(
      (a) => getStageRank(a.status) >= 2 || (a.interviews && a.interviews.length > 0)
    ).length;
    const technicalCount = nonArchived.filter((a) => getStageRank(a.status) >= 3).length;
    const finalCount = nonArchived.filter((a) => getStageRank(a.status) >= 4).length;
    const offerCount = nonArchived.filter((a) => getStageRank(a.status) >= 5).length;

    const pct = (part: number, total: number) => {
      if (total <= 0) return 0;
      return Math.round((part / total) * 100);
    };

    return [
      {
        stage: 'Applied',
        count: appliedCount,
        color: 'bg-blue-500',
        conversionLabel: 'Top of funnel',
      },
      {
        stage: 'Screening',
        count: screeningCount,
        color: 'bg-purple-500',
        conversionLabel: `${pct(screeningCount, appliedCount)}% conversion`,
      },
      {
        stage: 'Technical',
        count: technicalCount,
        color: 'bg-amber-500',
        conversionLabel: `${pct(technicalCount, screeningCount)}% conversion`,
      },
      {
        stage: 'Final',
        count: finalCount,
        color: 'bg-orange-500',
        conversionLabel: `${pct(finalCount, technicalCount)}% conversion`,
      },
      {
        stage: 'Offer',
        count: offerCount,
        color: 'bg-emerald-500',
        conversionLabel: `${pct(offerCount, finalCount)}% from Final (${pct(
          offerCount,
          appliedCount
        )}% overall)`,
      },
    ];
  }, [applications]);

  // Sorted applications for table view
  const sortedApps = useMemo(() => {
    if (!sortField || !sortDirection) return filteredApps;

    const PRIORITY_ORDER: Record<string, number> = {
      urgent: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    const STATUS_ORDER: Record<string, number> = {
      saved: 1,
      applied: 2,
      screening: 3,
      technical: 4,
      manager: 5,
      offer: 6,
      rejected: 7,
      withdrawn: 8,
    };

    return [...filteredApps].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'company':
          comparison = a.company_name.localeCompare(b.company_name);
          break;
        case 'role':
          comparison = a.role_title.localeCompare(b.role_title);
          break;
        case 'status':
          comparison = (STATUS_ORDER[a.status] || 0) - (STATUS_ORDER[b.status] || 0);
          break;
        case 'priority':
          comparison = (PRIORITY_ORDER[a.priority] || 0) - (PRIORITY_ORDER[b.priority] || 0);
          break;
        case 'salary': {
          const aSal = a.salary_max || a.salary_min || 0;
          const bSal = b.salary_max || b.salary_min || 0;
          comparison = aSal - bSal;
          break;
        }
        case 'followup': {
          const aDate = a.next_followup_date || '';
          const bDate = b.next_followup_date || '';
          if (!aDate && !bDate) comparison = 0;
          else if (!aDate) comparison = 1;
          else if (!bDate) comparison = -1;
          else comparison = aDate.localeCompare(bDate);
          break;
        }
        case 'updated': {
          const aDate = a.updated_at || a.created_at || '';
          const bDate = b.updated_at || b.created_at || '';
          comparison = aDate.localeCompare(bDate);
          break;
        }
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredApps, sortField, sortDirection]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <ArrowUpDown className="size-3 text-ink-4 opacity-40 group-hover:opacity-100 transition-opacity" />
      );
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="size-3 text-indigo-500 font-bold" />;
    }
    return <ArrowDown className="size-3 text-indigo-500 font-bold" />;
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

      {/* Initial load failure banner */}
      {loadError && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between gap-3 text-rose-600 dark:text-rose-400">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0 text-rose-500" />
            <span className="text-xs sm:text-sm font-semibold">Couldn&apos;t load data, retry</span>
          </div>
          <button
            type="button"
            onClick={() => fetchApplications()}
            className="btn btn-secondary h-8 px-3 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/15 cursor-pointer"
          >
            Retry
          </button>
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
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company, role, notes... (Press /)"
              className="w-full h-8.5 pl-8 pr-3 rounded-xl border border-line bg-surface-2 text-xs text-ink placeholder:text-ink-4 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Right Section: Status Indicator, Shortcuts Help, Export, and New Application */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Save Status Indicator */}
          {saveState === 'saving' && (
            <span className="text-xs text-ink-3 flex items-center gap-1.5 mr-1">
              <Loader2 className="size-3 animate-spin text-ink-3" />
              <span>Saving…</span>
            </span>
          )}
          {saveState === 'saved' && (
            <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1 animate-in fade-in mr-1">
              <Check className="size-3" />
              <span>Saved ✓</span>
            </span>
          )}
          {saveState === 'error' && (
            <button
              type="button"
              onClick={() => fetchApplications()}
              className="text-xs text-rose-500 font-semibold flex items-center gap-1 hover:underline cursor-pointer mr-1"
            >
              <AlertCircle className="size-3" />
              <span>Save failed, retry</span>
            </button>
          )}

          {/* Keyboard Shortcuts (?) Button */}
          <button
            type="button"
            onClick={() => setIsHelpModalOpen(true)}
            className="size-8.5 rounded-xl border border-line bg-surface-2 hover:bg-surface-3 flex items-center justify-center text-ink-3 hover:text-ink transition-colors cursor-pointer"
            title="Keyboard shortcuts (?)"
            aria-label="Keyboard shortcuts"
          >
            <HelpCircle className="size-3.5" />
          </button>

          {/* Export Button */}
          <button
            type="button"
            onClick={handleExportData}
            disabled={loadError || isLoading}
            className="btn btn-secondary h-8.5 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export JSON snapshot"
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Primary New Application Button */}
          <button
            type="button"
            onClick={() => {
              if (loadError) return;
              setIsCreateModalOpen(true);
            }}
            disabled={loadError || isLoading}
            className="btn btn-primary h-8.5 px-3.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="size-3.5" />
            <span>New Application</span>
          </button>
        </div>
      </div>

      {/* 3. Collapsible Next Actions Strip */}
      {!isLoading && (
        <div className="rounded-2xl border border-line bg-surface-2/30 p-3.5 space-y-3 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 font-bold text-xs text-ink">
                <Zap className="size-3.5 text-amber-500" />
                <span>Next Actions</span>
              </div>
              {nextActionsData.totalCount > 0 ? (
                <div className="flex items-center gap-1.5 text-[10px] font-mono">
                  {nextActionsData.overdue.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold">
                      {nextActionsData.overdue.length} overdue
                    </span>
                  )}
                  {nextActionsData.dueToday.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold">
                      {nextActionsData.dueToday.length} today
                    </span>
                  )}
                  {nextActionsData.stale.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-neutral-500/15 text-neutral-600 dark:text-neutral-400 border border-neutral-500/30 font-semibold">
                      {nextActionsData.stale.length} stale (&gt;10d)
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-[11px] text-ink-3 font-medium">All clear 🎉</span>
              )}
            </div>

            <button
              type="button"
              onClick={toggleNextActions}
              className="h-7 px-2 rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink-3 hover:text-ink text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>{isNextActionsCollapsed ? 'Show' : 'Hide'}</span>
              {isNextActionsCollapsed ? (
                <ChevronDown className="size-3" />
              ) : (
                <ChevronUp className="size-3" />
              )}
            </button>
          </div>

          {!isNextActionsCollapsed && (
            <>
              {nextActionsData.totalCount === 0 ? (
                <div className="py-3 text-center text-xs text-ink-3 flex items-center justify-center gap-2 border-t border-line/50">
                  <span className="text-base">🎉</span>
                  <span className="font-medium">
                    All clear — no overdue follow-ups, items due today, or stale applications.
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-line/50">
                  {/* Due Today */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-ink-2 px-1">
                      <span>Due Today</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-md bg-surface border border-line text-ink-3">
                        {nextActionsData.dueToday.length}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {nextActionsData.dueToday.map((app) => (
                        <div
                          key={app.id}
                          onClick={() => handleOpenDetail(app)}
                          className="p-2.5 rounded-xl border border-line bg-surface hover:bg-surface-3 transition-colors cursor-pointer flex items-center justify-between gap-2 group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={`size-6 rounded-md border flex items-center justify-center font-bold text-[10px] shrink-0 ${getCompanyAvatarColor(
                                app.company_name
                              )}`}
                            >
                              {app.company_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-ink truncate group-hover:text-indigo-500 transition-colors">
                                {app.company_name}
                              </p>
                              <p className="text-[10px] text-ink-3 truncate">
                                {app.notes ? app.notes.slice(0, 36) : app.role_title}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                            Today
                          </span>
                        </div>
                      ))}
                      {nextActionsData.dueToday.length === 0 && (
                        <p className="text-[11px] text-ink-4 italic px-1 py-1">No items due today</p>
                      )}
                    </div>
                  </div>

                  {/* Overdue */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-ink-2 px-1">
                      <span className="text-rose-600 dark:text-rose-400">Overdue</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-md bg-surface border border-line text-rose-500 font-bold">
                        {nextActionsData.overdue.length}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {nextActionsData.overdue.map((app) => {
                        const due = formatRelativeDueDate(app.next_followup_date);
                        return (
                          <div
                            key={app.id}
                            onClick={() => handleOpenDetail(app)}
                            className="p-2.5 rounded-xl border border-rose-500/30 bg-surface hover:bg-rose-500/5 transition-colors cursor-pointer flex items-center justify-between gap-2 group"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className={`size-6 rounded-md border flex items-center justify-center font-bold text-[10px] shrink-0 ${getCompanyAvatarColor(
                                  app.company_name
                                )}`}
                              >
                                {app.company_name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-ink truncate group-hover:text-rose-500 transition-colors">
                                  {app.company_name}
                                </p>
                                <p className="text-[10px] text-ink-3 truncate">
                                  {app.notes ? app.notes.slice(0, 36) : app.role_title}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 shrink-0">
                              {due?.label || 'Overdue'}
                            </span>
                          </div>
                        );
                      })}
                      {nextActionsData.overdue.length === 0 && (
                        <p className="text-[11px] text-ink-4 italic px-1 py-1">No overdue items</p>
                      )}
                    </div>
                  </div>

                  {/* Stale (>10d) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-ink-2 px-1">
                      <span>Stale (&gt;10d in stage)</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-md bg-surface border border-line text-ink-3">
                        {nextActionsData.stale.length}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {nextActionsData.stale.map((app) => {
                        const days = getDaysInStage(app);
                        return (
                          <div
                            key={app.id}
                            onClick={() => handleOpenDetail(app)}
                            className="p-2.5 rounded-xl border border-line bg-surface hover:bg-surface-3 transition-colors cursor-pointer flex items-center justify-between gap-2 group"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className={`size-6 rounded-md border flex items-center justify-center font-bold text-[10px] shrink-0 ${getCompanyAvatarColor(
                                  app.company_name
                                )}`}
                              >
                                {app.company_name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-ink truncate group-hover:text-indigo-500 transition-colors">
                                  {app.company_name}
                                </p>
                                <p className="text-[10px] text-ink-3 truncate">
                                  {STATUS_CONFIG[app.status]?.label} · {app.role_title}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                              {days}d in stage
                            </span>
                          </div>
                        );
                      })}
                      {nextActionsData.stale.length === 0 && (
                        <p className="text-[11px] text-ink-4 italic px-1 py-1">No stale applications</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

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
                  onSelectApp={(app) => handleOpenDetail(app)}
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
        /* TABLE VIEW WITH SORTABLE COLUMNS & STICKY HEADER */
        <div className="space-y-4">
          <div className="rounded-2xl border border-line bg-surface overflow-hidden shadow-xs">
            <div className="overflow-x-auto max-h-[620px] [scrollbar-width:thin]">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-surface-2 z-10 border-b border-line text-ink-3 font-semibold uppercase text-[10px] tracking-wider select-none shadow-2xs">
                  <tr>
                    <th
                      onClick={() => handleSort('company')}
                      className="px-4 py-3 cursor-pointer hover:text-ink transition-colors group select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Company</span>
                        {renderSortIcon('company')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('role')}
                      className="px-3 py-3 cursor-pointer hover:text-ink transition-colors group select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Role</span>
                        {renderSortIcon('role')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('status')}
                      className="px-3 py-3 cursor-pointer hover:text-ink transition-colors group select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Status</span>
                        {renderSortIcon('status')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('priority')}
                      className="px-3 py-3 cursor-pointer hover:text-ink transition-colors group select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Priority</span>
                        {renderSortIcon('priority')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('salary')}
                      className="px-3 py-3 cursor-pointer hover:text-ink transition-colors group select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Salary</span>
                        {renderSortIcon('salary')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('followup')}
                      className="px-3 py-3 cursor-pointer hover:text-ink transition-colors group select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Follow-up</span>
                        {renderSortIcon('followup')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('updated')}
                      className="px-3 py-3 cursor-pointer hover:text-ink transition-colors group select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Updated</span>
                        {renderSortIcon('updated')}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {sortedApps.map((app) => {
                    const dueInfo = formatRelativeDueDate(app.next_followup_date);
                    const updatedInfo = formatRelativeDate(app.updated_at || app.created_at);
                    const avatarColor = getCompanyAvatarColor(app.company_name);

                    return (
                      <tr
                        key={app.id}
                        onClick={() => handleOpenDetail(app)}
                        className="hover:bg-surface-2/60 transition-colors cursor-pointer group"
                      >
                        {/* Company */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`size-6 rounded-md border flex items-center justify-center font-bold text-[10px] shrink-0 ${avatarColor}`}
                            >
                              {app.company_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-ink text-xs truncate group-hover:text-indigo-500 transition-colors">
                                  {app.company_name}
                                </span>
                                {app.type === 'scholarship' && (
                                  <span className="text-[9px] px-1 py-0.2 rounded-sm bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold border border-purple-500/20 shrink-0">
                                    Scholarship
                                  </span>
                                )}
                              </div>
                              {app.company_location && (
                                <p className="text-[10px] text-ink-3 truncate mt-0.5">
                                  {app.company_location}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-3 py-3.5 text-ink-2 font-medium text-xs">
                          {app.role_title}
                        </td>

                        {/* Status */}
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

                        {/* Priority */}
                        <td className="px-3 py-3.5">
                          <span
                            className={`inline-flex px-1.5 py-0.5 rounded-md text-[10px] font-bold border uppercase ${
                              PRIORITY_CONFIG[app.priority]?.badge
                            }`}
                          >
                            {app.priority}
                          </span>
                        </td>

                        {/* Salary */}
                        <td className="px-3 py-3.5 text-ink-2 font-mono text-[11px]">
                          {app.salary_min || app.salary_max
                            ? `$${app.salary_min ? `${Math.round(app.salary_min / 1000)}k` : ''}${
                                app.salary_min && app.salary_max ? ' – ' : ''
                              }${app.salary_max ? `${Math.round(app.salary_max / 1000)}k` : ''}`
                            : '—'}
                        </td>

                        {/* Follow-up with relative date & absolute tooltip */}
                        <td className="px-3 py-3.5 text-[11px]">
                          {dueInfo ? (
                            <span
                              title={`Target date: ${app.next_followup_date}`}
                              className={`font-medium ${
                                dueInfo.status === 'overdue'
                                  ? 'text-rose-500 font-bold'
                                  : dueInfo.status === 'soon'
                                  ? 'text-amber-500 font-semibold'
                                  : 'text-ink-3'
                              }`}
                            >
                              {dueInfo.label}
                            </span>
                          ) : (
                            <span className="text-ink-4">—</span>
                          )}
                        </td>

                        {/* Updated with relative date & absolute tooltip */}
                        <td className="px-3 py-3.5 text-ink-3 text-[11px]">
                          <span title={`Last updated: ${updatedInfo.full}`}>
                            {updatedInfo.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td
                          className="px-4 py-3.5 text-right space-x-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(app)}
                            className="p-1.5 rounded-lg hover:bg-surface-3 text-ink-3 hover:text-ink cursor-pointer"
                            title="View application detail"
                          >
                            <ChevronRight className="size-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {sortedApps.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-ink-3">
                        No applications found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pipeline Stage Funnel Summary (Collapsible under Table view) */}
          <div className="rounded-2xl border border-line bg-surface overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={toggleFunnelCollapsed}
              className="w-full px-5 py-3.5 bg-surface-2/40 hover:bg-surface-2/70 transition-colors flex items-center justify-between cursor-pointer border-b border-line/60 select-none"
            >
              <div className="flex items-center gap-2.5">
                <TrendingUp className="size-4 text-indigo-500" />
                <span className="text-xs font-bold text-ink">Stage Conversion Funnel</span>
                <span className="text-[10px] text-ink-3 font-mono hidden sm:inline">
                  (Applied → Screening → Technical → Final → Offer)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-ink-3 font-medium">
                  {isFunnelCollapsed ? 'Show funnel' : 'Hide funnel'}
                </span>
                {isFunnelCollapsed ? (
                  <ChevronDown className="size-3.5 text-ink-3" />
                ) : (
                  <ChevronUp className="size-3.5 text-ink-3" />
                )}
              </div>
            </button>

            {!isFunnelCollapsed && (
              <div className="p-5 space-y-4">
                {/* Funnel bars */}
                <div className="space-y-3">
                  {funnelData.map((item) => (
                    <div key={item.stage} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`size-2 rounded-full ${item.color}`} />
                          <span className="font-bold text-ink">{item.stage}</span>
                          <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-md bg-surface-2 border border-line text-ink-3 font-semibold">
                            {item.count}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-ink-3 font-medium">
                          {item.conversionLabel}
                        </span>
                      </div>

                      {/* CSS Progress Bar */}
                      <div className="h-3 w-full bg-surface-2 rounded-full border border-line/70 overflow-hidden relative">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                          style={{
                            width: `${Math.max(
                              item.count > 0 ? 8 : 0,
                              Math.min(
                                100,
                                Math.round((item.count / Math.max(funnelData[0].count, 1)) * 100)
                              )
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Funnel summary footer */}
                <div className="pt-3 border-t border-line/60 flex items-center justify-between text-xs text-ink-3">
                  <span>Pipeline conversion health</span>
                  <span className="font-mono font-bold text-ink">
                    Overall Offer Rate:{' '}
                    {funnelData[0].count > 0
                      ? Math.round((funnelData[4].count / funnelData[0].count) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE NEW APPLICATION MODAL */}
      {isCreateModalOpen && (
        <CreateApplicationModal
          onClose={() => setIsCreateModalOpen(false)}
          expectedVersion={careerVersion}
          onVersionUpdate={(v) => setCareerVersion(v)}
          onConflict={() => {
            showToast('This data changed elsewhere, reload before saving');
            fetchApplications();
            setIsCreateModalOpen(false);
          }}
          onCreated={(newApp) => {
            setApplications((prev) => [newApp, ...prev]);
            setIsCreateModalOpen(false);
            showToast(`Added application for ${newApp.company_name}!`);
          }}
        />
      )}

      {/* KEYBOARD SHORTCUTS HELP MODAL */}
      {isHelpModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in select-none"
          onClick={() => setIsHelpModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-line bg-surface shadow-2xl overflow-hidden animate-in zoom-in-95"
          >
            <div className="p-4 border-b border-line bg-surface-2/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="size-4 text-indigo-500" />
                <h3 className="text-xs font-bold text-ink">Keyboard Shortcuts</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="text-ink-3 hover:text-ink cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-line/40">
                <span className="text-ink-2">New application</span>
                <kbd className="px-2 py-0.5 rounded-md bg-surface-2 border border-line font-mono font-bold text-ink text-[11px]">
                  N
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-line/40">
                <span className="text-ink-2">Focus search</span>
                <kbd className="px-2 py-0.5 rounded-md bg-surface-2 border border-line font-mono font-bold text-ink text-[11px]">
                  /
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-line/40">
                <span className="text-ink-2">Board view</span>
                <kbd className="px-2 py-0.5 rounded-md bg-surface-2 border border-line font-mono font-bold text-ink text-[11px]">
                  B
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-line/40">
                <span className="text-ink-2">Table view</span>
                <kbd className="px-2 py-0.5 rounded-md bg-surface-2 border border-line font-mono font-bold text-ink text-[11px]">
                  T
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-line/40">
                <span className="text-ink-2">Close panel / modal</span>
                <kbd className="px-2 py-0.5 rounded-md bg-surface-2 border border-line font-mono font-bold text-ink text-[11px]">
                  Esc
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-ink-2">Toggle sidebar rail</span>
                <kbd className="px-2 py-0.5 rounded-md bg-surface-2 border border-line font-mono font-bold text-ink text-[11px]">
                  Ctrl / ⌘ + B
                </kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* APPLICATION SLIDE-OVER DETAIL PANEL (480px) */}
      {activeDetailApp && (
        <CareerSlideOver
          app={activeDetailApp}
          onClose={handleCloseDetail}
          expectedVersion={careerVersion}
          onVersionUpdate={(v) => setCareerVersion(v)}
          onConflict={() => {
            showToast('This data changed elsewhere, reload before saving');
            fetchApplications();
          }}
          onUpdate={(updated) => {
            setApplications((prev) =>
              prev.map((a) => (a.id === updated.id ? updated : a))
            );
            setActiveDetailApp(updated);
          }}
          onDelete={(id) => {
            handleDeleteApplication(id);
            handleCloseDetail();
          }}
          saveState={saveState}
          setSaveState={setSaveState}
          disabled={loadError}
        />
      )}
    </div>
  );
};

// SLIDE-OVER DETAIL PANEL (480px, interactive, debounced autosave 600ms)
interface CareerSlideOverProps {
  app: CareerApplication;
  onClose: () => void;
  onUpdate: (app: CareerApplication) => void;
  onDelete: (id: string) => void;
  saveState: 'idle' | 'saving' | 'saved' | 'error';
  setSaveState: (s: 'idle' | 'saving' | 'saved' | 'error') => void;
  disabled?: boolean;
  expectedVersion?: number;
  onVersionUpdate?: (version: number) => void;
  onConflict?: () => void;
}

const CareerSlideOver: React.FC<CareerSlideOverProps> = ({
  app,
  onClose,
  onUpdate,
  onDelete,
  saveState,
  setSaveState,
  disabled = false,
  expectedVersion,
  onVersionUpdate,
  onConflict,
}) => {
  const { session } = useAdminAuth();
  const [localApp, setLocalApp] = useState<CareerApplication>(app);
  const [activeTab, setActiveTab] = useState<'overview' | 'interviews' | 'contacts' | 'emails'>('overview');
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Email generator state
  const [emailTemplate, setEmailTemplate] = useState<
    'follow_up' | 'thank_you' | 'negotiation' | 'status_inquiry'
  >('follow_up');
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Sync when app prop changes
  useEffect(() => {
    setLocalApp(app);
  }, [app]);

  // Persist changes to backend
  const persistChanges = useCallback(
    async (data: CareerApplication) => {
      if (disabled) return;
      setSaveState('saving');
      try {
        const res = await fetch('/api/admin/career', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({ ...data, expectedVersion }),
        });
        if (res.ok) {
          const json = await res.json();
          if (typeof json.version === 'number') {
            onVersionUpdate?.(json.version);
          }
          onUpdate(json.application);
          setSaveState('saved');
          setHasUnsaved(false);
          setTimeout(() => setSaveState('idle'), 2000);
        } else if (res.status === 409) {
          setSaveState('error');
          onConflict?.();
        } else {
          setSaveState('error');
        }
      } catch {
        setSaveState('error');
      }
    },
    [disabled, onUpdate, setSaveState, session?.access_token, expectedVersion, onVersionUpdate, onConflict]
  );

  // Debounced field change (600ms)
  const handleFieldChange = (updates: Partial<CareerApplication>) => {
    if (disabled) return;
    const statusChanged = updates.status && updates.status !== localApp.status;
    const updated: CareerApplication = {
      ...localApp,
      ...updates,
      stageChangedAt: statusChanged ? new Date().toISOString() : localApp.stageChangedAt,
      updated_at: new Date().toISOString(),
    };
    setLocalApp(updated);
    setHasUnsaved(true);

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      persistChanges(updated);
    }, 600);
  };

  // Safe close that flushes pending edits
  const handleSafeClose = () => {
    if (hasUnsaved && !disabled) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      persistChanges(localApp);
    }
    onClose();
  };

  // Generated email preview
  const generatedEmailText = useMemo(() => {
    const contactName = localApp.contacts[0]?.name || 'Hiring Team';
    const role = localApp.role_title;
    const company = localApp.company_name;

    switch (emailTemplate) {
      case 'follow_up':
        return `Hi ${contactName},

I hope you're having a wonderful week!

I wanted to quickly follow up on my application for the ${role} position at ${company}. I'm very excited about what ${company} is building and remain confident that my background in production web platforms aligns well with what your engineering team needs.

Please let me know if there are any additional materials or code samples I can provide to help with your review.

Best regards,
Md Zahid Hasan Patwary
https://zahidp.com`;

      case 'thank_you':
        return `Hi ${contactName},

Thank you so much for taking the time to speak with me today about the ${role} role at ${company}.

I really enjoyed our conversation regarding your current technical challenges and engineering culture. The discussion reinforced my strong interest in joining the team and contributing to ${company}'s milestones.

Looking forward to the next steps!

Warm regards,
Md Zahid Hasan Patwary`;

      case 'negotiation':
        return `Dear ${contactName},

Thank you again for extending the offer to join ${company} as ${role}! I am genuinely excited about the team, the vision, and the opportunity to make a high impact.

After reviewing the details of the compensation package, I would like to discuss whether there is any flexibility regarding the base compensation. Based on my technical background and current market benchmarks for senior roles, I am targeting a base of $${localApp.salary_max ? localApp.salary_max.toLocaleString() : '140,000'}.

I am eager to find a package that works for both of us so I can accept and get started.

Best regards,
Md Zahid Hasan Patwary`;

      case 'status_inquiry':
        return `Hi ${contactName},

I hope all is well!

I wanted to check in to see if there are any updates regarding the ${role} search at ${company}. 

I have a few pending timelines with other interview processes, but ${company} remains a top priority for me, so I wanted to touch base before making any commitments.

Thank you again for your time and consideration!

Best,
Md Zahid Hasan Patwary`;
    }
  }, [localApp, emailTemplate]);

  const copyEmail = () => {
    if (!generatedEmailText) return;
    navigator.clipboard.writeText(generatedEmailText);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <>
      {/* Light Backdrop Dim */}
      <div
        onClick={handleSafeClose}
        className="fixed inset-0 bg-black/25 backdrop-blur-2xs z-30 transition-opacity"
        aria-hidden="true"
      />

      {/* 480px Slide-Over Panel */}
      <aside className="fixed inset-y-0 right-0 z-40 w-full sm:w-[480px] bg-surface border-l border-line shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 select-none">
        {/* Top Header */}
        <div className="p-4 border-b border-line bg-surface-2/40 flex items-center justify-between shrink-0 gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div
                className={`size-6 rounded-md border flex items-center justify-center font-bold text-xs shrink-0 ${getCompanyAvatarColor(
                  localApp.company_name
                )}`}
              >
                {localApp.company_name.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-sm font-bold text-ink truncate leading-tight">
                {localApp.company_name}
              </h3>
              {localApp.company_website && (
                <a
                  href={localApp.company_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink-3 hover:text-ink shrink-0"
                  title="Visit Website"
                >
                  <ExternalLink className="size-3" />
                </a>
              )}
            </div>
            <p className="text-[11px] text-ink-3 truncate mt-0.5">{localApp.role_title}</p>
          </div>

          {/* Status Select & Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Status Selector */}
            <select
              value={localApp.status}
              onChange={(e) =>
                handleFieldChange({ status: e.target.value as CareerApplicationStatus })
              }
              className={`h-7 px-2 rounded-lg border text-xs font-semibold cursor-pointer ${
                STATUS_CONFIG[localApp.status]?.bg
              } ${STATUS_CONFIG[localApp.status]?.color}`}
            >
              {KANBAN_STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>

            {/* Autosave feedback */}
            {saveState === 'saving' && (
              <span className="text-[10px] text-ink-3 flex items-center gap-1 font-mono">
                <Loader2 className="size-2.5 animate-spin" />
                <span>Saving…</span>
              </span>
            )}
            {saveState === 'saved' && (
              <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-0.5 animate-in fade-in">
                <Check className="size-2.5" />
                <span>Saved ✓</span>
              </span>
            )}
            {saveState === 'error' && (
              <span className="text-[10px] text-rose-500 font-semibold">Save failed, retry</span>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={handleSafeClose}
              className="size-7 rounded-lg border border-line bg-surface hover:bg-surface-3 flex items-center justify-center text-ink-3 hover:text-ink transition-colors cursor-pointer"
              title="Close panel (Esc)"
              aria-label="Close detail panel"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-4 border-b border-line bg-surface text-xs font-semibold shrink-0 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-2.5 px-2.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-ink-3 hover:text-ink'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('interviews')}
            className={`py-2.5 px-2.5 border-b-2 transition-all cursor-pointer inline-flex items-center gap-1 ${
              activeTab === 'interviews'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-ink-3 hover:text-ink'
            }`}
          >
            <span>Interviews</span>
            <span className="size-4 rounded-full bg-surface-2 text-[10px] grid place-items-center font-mono">
              {localApp.interviews?.length || 0}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contacts')}
            className={`py-2.5 px-2.5 border-b-2 transition-all cursor-pointer inline-flex items-center gap-1 ${
              activeTab === 'contacts'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-ink-3 hover:text-ink'
            }`}
          >
            <span>Contacts</span>
            <span className="size-4 rounded-full bg-surface-2 text-[10px] grid place-items-center font-mono">
              {localApp.contacts?.length || 0}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('emails')}
            className={`py-2.5 px-2.5 border-b-2 transition-all cursor-pointer inline-flex items-center gap-1 ${
              activeTab === 'emails'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-ink-3 hover:text-ink'
            }`}
          >
            <Sparkles className="size-3 text-amber-500" />
            <span>Emails</span>
          </button>
        </div>

        {/* Tab Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 [scrollbar-width:thin]">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-3.5 text-xs">
              {/* Role Title & Company inputs */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-ink-2 mb-1 block">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={localApp.company_name}
                    onChange={(e) => handleFieldChange({ company_name: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-xl border border-line bg-surface-2 text-ink focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-ink-2 mb-1 block">Role Title</label>
                  <input
                    type="text"
                    value={localApp.role_title}
                    onChange={(e) => handleFieldChange({ role_title: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-xl border border-line bg-surface-2 text-ink focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Priority, Opportunity Type, Workplace Mode */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-ink-2 mb-1 block">Priority</label>
                  <select
                    value={localApp.priority}
                    onChange={(e) =>
                      handleFieldChange({ priority: e.target.value as CareerPriorityLevel })
                    }
                    className="w-full h-8 px-2 rounded-xl border border-line bg-surface-2 text-ink focus:outline-hidden"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-ink-2 mb-1 block">Type</label>
                  <select
                    value={localApp.type || 'job'}
                    onChange={(e) =>
                      handleFieldChange({
                        type: e.target.value as 'job' | 'scholarship',
                      })
                    }
                    className="w-full h-8 px-2 rounded-xl border border-line bg-surface-2 text-ink focus:outline-hidden"
                  >
                    <option value="job">Job</option>
                    <option value="scholarship">Scholarship</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-ink-2 mb-1 block">Workplace</label>
                  <select
                    value={localApp.remote_type}
                    onChange={(e) =>
                      handleFieldChange({
                        remote_type: e.target.value as 'remote' | 'hybrid' | 'onsite',
                      })
                    }
                    className="w-full h-8 px-2 rounded-xl border border-line bg-surface-2 text-ink focus:outline-hidden"
                  >
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="onsite">On-site</option>
                  </select>
                </div>
              </div>

              {/* Salary Bracket */}
              <div className="p-3 rounded-2xl border border-line bg-surface-2/40 space-y-2">
                <span className="text-[11px] font-semibold text-ink block">Compensation Target</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-ink-3">Min Salary ($)</span>
                    <input
                      type="number"
                      value={localApp.salary_min || ''}
                      onChange={(e) =>
                        handleFieldChange({ salary_min: Number(e.target.value) || undefined })
                      }
                      placeholder="120000"
                      className="w-full h-8 px-2.5 rounded-xl border border-line bg-surface text-ink font-mono focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-ink-3">Max Salary ($)</span>
                    <input
                      type="number"
                      value={localApp.salary_max || ''}
                      onChange={(e) =>
                        handleFieldChange({ salary_max: Number(e.target.value) || undefined })
                      }
                      placeholder="150000"
                      className="w-full h-8 px-2.5 rounded-xl border border-line bg-surface text-ink font-mono focus:outline-hidden"
                    />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-ink-3">Compensation Notes</span>
                  <input
                    type="text"
                    value={localApp.compensation_notes || ''}
                    onChange={(e) => handleFieldChange({ compensation_notes: e.target.value })}
                    placeholder="e.g. + 0.1% equity, $10k sign-on bonus"
                    className="w-full h-8 px-2.5 rounded-xl border border-line bg-surface text-ink focus:outline-hidden mt-0.5"
                  />
                </div>
              </div>

              {/* Links & Website */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-ink-2 block">Company Website / Job URL</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="url"
                    value={localApp.company_website || ''}
                    onChange={(e) => handleFieldChange({ company_website: e.target.value })}
                    placeholder="https://..."
                    className="w-full h-8 px-2.5 rounded-xl border border-line bg-surface-2 text-ink focus:outline-hidden"
                  />
                  {localApp.company_website && (
                    <a
                      href={localApp.company_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="size-8 rounded-xl border border-line bg-surface-2 flex items-center justify-center text-ink-3 hover:text-ink shrink-0"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Next Follow-up Alarms */}
              <div className="p-3 rounded-2xl border border-line bg-surface-2/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-ink">Next Follow-up Action</span>
                  {localApp.next_followup_date && (
                    <span className="text-[10px] font-mono text-ink-3">
                      {formatRelativeDueDate(localApp.next_followup_date)?.label}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={localApp.next_followup_date || ''}
                    onChange={(e) => handleFieldChange({ next_followup_date: e.target.value })}
                    className="w-full h-8 px-2 rounded-xl border border-line bg-surface text-ink focus:outline-hidden font-mono text-xs"
                  />
                  <input
                    type="text"
                    value={localApp.next_followup_notes || ''}
                    onChange={(e) => handleFieldChange({ next_followup_notes: e.target.value })}
                    placeholder="e.g. Check in with recruiter"
                    className="w-full h-8 px-2.5 rounded-xl border border-line bg-surface text-ink focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-ink-2 block">Application Notes</label>
                <textarea
                  rows={4}
                  value={localApp.notes || ''}
                  onChange={(e) => handleFieldChange({ notes: e.target.value })}
                  placeholder="Notes on the hiring process, recruiter calls, tech stack..."
                  className="w-full p-2.5 rounded-xl border border-line bg-surface-2 text-ink leading-relaxed resize-none focus:outline-hidden text-xs"
                />
              </div>

              {/* Danger Zone */}
              <div className="pt-3 border-t border-line flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (disabled) return;
                    if (confirm('Delete this application permanently?')) {
                      onDelete(localApp.id);
                    }
                  }}
                  disabled={disabled}
                  className="text-xs text-rose-500 hover:text-rose-600 font-semibold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="size-3" />
                  <span>Delete Application</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (disabled) return;
                    handleFieldChange({ archived: !localApp.archived });
                  }}
                  disabled={disabled}
                  className="text-xs text-ink-3 hover:text-ink cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {localApp.archived ? 'Unarchive' : 'Archive'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: INTERVIEWS & Q&A */}
          {activeTab === 'interviews' && (
            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-ink">Interview Schedule &amp; Q&amp;A</span>
                <button
                  type="button"
                  onClick={() => {
                    const newRound = {
                      id: `int_${Date.now()}`,
                      round: (localApp.interviews?.length || 0) + 1,
                      title: `Round ${(localApp.interviews?.length || 0) + 1}`,
                      stage: 'screening' as const,
                      completed: false,
                      questions: [],
                    };
                    handleFieldChange({ interviews: [...(localApp.interviews || []), newRound] });
                  }}
                  className="btn btn-secondary h-7 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="size-3" />
                  <span>Add Round</span>
                </button>
              </div>

              {(!localApp.interviews || localApp.interviews.length === 0) ? (
                <div className="py-12 border-2 border-dashed border-line/60 rounded-2xl flex flex-col items-center justify-center text-center p-4">
                  <p className="text-xs text-ink-3">No interview rounds added yet.</p>
                  <p className="text-[11px] text-ink-4 mt-1">Track screening, technical, system design, and final rounds.</p>
                </div>
              ) : (
                localApp.interviews.map((intv, idx) => (
                  <div key={intv.id} className="rounded-2xl border border-line bg-surface-2/40 p-3 space-y-2.5">
                    {/* Round Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="size-5 rounded-md bg-indigo-500/10 text-indigo-600 font-bold text-[10px] grid place-items-center shrink-0">
                          R{intv.round}
                        </span>
                        <input
                          type="text"
                          value={intv.title}
                          onChange={(e) => {
                            const updatedList = [...(localApp.interviews || [])];
                            updatedList[idx] = { ...intv, title: e.target.value };
                            handleFieldChange({ interviews: updatedList });
                          }}
                          className="h-7 px-2 rounded-lg border border-line bg-surface text-ink text-xs font-bold flex-1 min-w-0"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <select
                          value={intv.stage}
                          onChange={(e) => {
                            const updatedList = [...(localApp.interviews || [])];
                            updatedList[idx] = {
                              ...intv,
                              stage: e.target.value as CareerInterview['stage'],
                            };
                            handleFieldChange({ interviews: updatedList });
                          }}
                          className="h-7 px-1.5 rounded-lg border border-line bg-surface text-ink text-[11px] capitalize cursor-pointer"
                        >
                          <option value="screening">Screening</option>
                          <option value="technical">Technical</option>
                          <option value="take_home">Take Home</option>
                          <option value="system_design">System Design</option>
                          <option value="culture">Culture</option>
                          <option value="final">Final</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => {
                            const updatedList = (localApp.interviews || []).filter((_, i) => i !== idx);
                            handleFieldChange({ interviews: updatedList });
                          }}
                          className="size-7 rounded-lg text-ink-3 hover:text-rose-500 hover:bg-rose-500/10 flex items-center justify-center transition-colors cursor-pointer"
                          title="Delete round"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </div>

                    {/* Interviewer & Meeting URL */}
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={intv.interviewer || ''}
                        onChange={(e) => {
                          const updatedList = [...(localApp.interviews || [])];
                          updatedList[idx] = { ...intv, interviewer: e.target.value };
                          handleFieldChange({ interviews: updatedList });
                        }}
                        placeholder="Interviewer name(s)"
                        className="h-7 px-2 rounded-lg border border-line bg-surface text-ink text-xs"
                      />
                      <input
                        type="url"
                        value={intv.meeting_url || ''}
                        onChange={(e) => {
                          const updatedList = [...(localApp.interviews || [])];
                          updatedList[idx] = { ...intv, meeting_url: e.target.value };
                          handleFieldChange({ interviews: updatedList });
                        }}
                        placeholder="Google Meet / Zoom URL"
                        className="h-7 px-2 rounded-lg border border-line bg-surface text-ink text-xs"
                      />
                    </div>

                    {/* Prep Notes */}
                    <textarea
                      rows={2}
                      value={intv.notes || ''}
                      onChange={(e) => {
                        const updatedList = [...(localApp.interviews || [])];
                        updatedList[idx] = { ...intv, notes: e.target.value };
                        handleFieldChange({ interviews: updatedList });
                      }}
                      placeholder="Round notes & prep guidance..."
                      className="w-full p-2 rounded-lg border border-line bg-surface text-ink text-xs resize-none focus:outline-hidden"
                    />

                    {/* Q&A Prep Items */}
                    <div className="pt-2 border-t border-line/60 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-ink-3">
                        <span>Prepared Questions &amp; Answers</span>
                        <button
                          type="button"
                          onClick={() => {
                            const curQ = intv.questions || [];
                            const updatedList = [...(localApp.interviews || [])];
                            updatedList[idx] = {
                              ...intv,
                              questions: [...curQ, { q: 'New question?', a: '' }],
                            };
                            handleFieldChange({ interviews: updatedList });
                          }}
                          className="text-[10px] text-indigo-500 hover:underline font-semibold cursor-pointer"
                        >
                          + Add Q&amp;A
                        </button>
                      </div>

                      {intv.questions?.map((qa, qIdx) => (
                        <div key={qIdx} className="p-2 rounded-xl bg-surface border border-line space-y-1.5">
                          <div className="flex items-center justify-between gap-1">
                            <input
                              type="text"
                              value={qa.q}
                              onChange={(e) => {
                                const curQ = [...(intv.questions || [])];
                                curQ[qIdx] = { ...qa, q: e.target.value };
                                const updatedList = [...(localApp.interviews || [])];
                                updatedList[idx] = { ...intv, questions: curQ };
                                handleFieldChange({ interviews: updatedList });
                              }}
                              placeholder="Question"
                              className="h-6 px-1.5 rounded border border-line text-xs font-semibold text-ink w-full"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const curQ = (intv.questions || []).filter((_, i) => i !== qIdx);
                                const updatedList = [...(localApp.interviews || [])];
                                updatedList[idx] = { ...intv, questions: curQ };
                                handleFieldChange({ interviews: updatedList });
                              }}
                              className="size-6 text-ink-3 hover:text-rose-500 flex items-center justify-center shrink-0 cursor-pointer"
                            >
                              <Trash2 className="size-2.5" />
                            </button>
                          </div>
                          <textarea
                            rows={2}
                            value={qa.a || ''}
                            onChange={(e) => {
                              const curQ = [...(intv.questions || [])];
                              curQ[qIdx] = { ...qa, a: e.target.value };
                              const updatedList = [...(localApp.interviews || [])];
                              updatedList[idx] = { ...intv, questions: curQ };
                              handleFieldChange({ interviews: updatedList });
                            }}
                            placeholder="Prepared response & talking points..."
                            className="w-full p-1.5 rounded border border-line bg-surface-2 text-ink text-[11px] resize-none focus:outline-hidden"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: CONTACTS */}
          {activeTab === 'contacts' && (
            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-ink">Recruiter &amp; Team Contacts</span>
                <button
                  type="button"
                  onClick={() => {
                    const newContact = {
                      id: `cnt_${Date.now()}`,
                      name: 'Recruiter Name',
                      role: 'recruiter' as const,
                      email: '',
                      linkedin: '',
                    };
                    handleFieldChange({ contacts: [...(localApp.contacts || []), newContact] });
                  }}
                  className="btn btn-secondary h-7 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="size-3" />
                  <span>Add Contact</span>
                </button>
              </div>

              {(!localApp.contacts || localApp.contacts.length === 0) ? (
                <div className="py-12 border-2 border-dashed border-line/60 rounded-2xl flex flex-col items-center justify-center text-center p-4">
                  <p className="text-xs text-ink-3">No contacts recorded yet.</p>
                  <p className="text-[11px] text-ink-4 mt-1">Keep track of recruiters, hiring managers, and interviewers.</p>
                </div>
              ) : (
                localApp.contacts.map((cnt, idx) => (
                  <div key={cnt.id} className="rounded-2xl border border-line bg-surface-2/40 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={cnt.name}
                        onChange={(e) => {
                          const updatedList = [...(localApp.contacts || [])];
                          updatedList[idx] = { ...cnt, name: e.target.value };
                          handleFieldChange({ contacts: updatedList });
                        }}
                        className="h-7 px-2 rounded-lg border border-line bg-surface text-ink text-xs font-bold flex-1 min-w-0"
                      />
                      <select
                        value={cnt.role}
                        onChange={(e) => {
                          const updatedList = [...(localApp.contacts || [])];
                          updatedList[idx] = {
                            ...cnt,
                            role: e.target.value as CareerContact['role'],
                          };
                          handleFieldChange({ contacts: updatedList });
                        }}
                        className="h-7 px-2 rounded-lg border border-line bg-surface text-ink text-[11px] capitalize cursor-pointer shrink-0"
                      >
                        <option value="recruiter">Recruiter</option>
                        <option value="hiring_manager">Hiring Manager</option>
                        <option value="peer">Peer</option>
                        <option value="executive">Executive</option>
                        <option value="referral">Referral</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const updatedList = (localApp.contacts || []).filter((_, i) => i !== idx);
                          handleFieldChange({ contacts: updatedList });
                        }}
                        className="size-7 rounded-lg text-ink-3 hover:text-rose-500 hover:bg-rose-500/10 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        title="Delete contact"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="email"
                          value={cnt.email || ''}
                          onChange={(e) => {
                            const updatedList = [...(localApp.contacts || [])];
                            updatedList[idx] = { ...cnt, email: e.target.value };
                            handleFieldChange({ contacts: updatedList });
                          }}
                          placeholder="Email address"
                          className="h-7 px-2 rounded-lg border border-line bg-surface text-ink text-xs font-mono w-full"
                        />
                        {cnt.email && (
                          <a
                            href={`mailto:${cnt.email}`}
                            className="size-7 rounded-lg border border-line bg-surface flex items-center justify-center text-ink-3 hover:text-ink shrink-0"
                            title="Send email"
                          >
                            <ExternalLink className="size-3" />
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <input
                          type="url"
                          value={cnt.linkedin || ''}
                          onChange={(e) => {
                            const updatedList = [...(localApp.contacts || [])];
                            updatedList[idx] = { ...cnt, linkedin: e.target.value };
                            handleFieldChange({ contacts: updatedList });
                          }}
                          placeholder="LinkedIn URL"
                          className="h-7 px-2 rounded-lg border border-line bg-surface text-ink text-xs w-full"
                        />
                        {cnt.linkedin && (
                          <a
                            href={cnt.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="size-7 rounded-lg border border-line bg-surface flex items-center justify-center text-ink-3 hover:text-ink shrink-0"
                            title="Open LinkedIn"
                          >
                            <ExternalLink className="size-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: EMAILS */}
          {activeTab === 'emails' && (
            <div className="space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1">
                  {(
                    [
                      { id: 'follow_up', label: 'Follow-up' },
                      { id: 'thank_you', label: 'Thank You' },
                      { id: 'negotiation', label: 'Negotiation' },
                      { id: 'status_inquiry', label: 'Status' },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setEmailTemplate(t.id)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        emailTemplate === t.id
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
                  onClick={copyEmail}
                  className="btn btn-primary h-7 px-2.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  {copiedEmail ? <Check className="size-3" /> : <Copy className="size-3" />}
                  <span>{copiedEmail ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              <textarea
                rows={12}
                readOnly
                value={generatedEmailText}
                className="w-full p-3.5 rounded-2xl bg-surface-2/60 border border-line text-xs font-sans text-ink leading-relaxed resize-none focus:outline-hidden"
              />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

// CREATE MODAL COMPONENT
const CreateApplicationModal: React.FC<{
  onClose: () => void;
  onCreated: (app: CareerApplication) => void;
  expectedVersion?: number;
  onVersionUpdate?: (version: number) => void;
  onConflict?: () => void;
}> = ({ onClose, onCreated, expectedVersion, onVersionUpdate, onConflict }) => {
  const { session } = useAdminAuth();
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
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
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
          expectedVersion,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (typeof data.version === 'number') {
          onVersionUpdate?.(data.version);
        }
        onCreated(data.application);
      } else if (res.status === 409) {
        onConflict?.();
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
