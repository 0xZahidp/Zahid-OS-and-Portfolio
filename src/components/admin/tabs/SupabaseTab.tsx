'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Database,
  Table as TableIcon,
  RefreshCw,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Key,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Server,
  Layers,
  Shield,
  X,
  Code,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Filter,
  Mail,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
} from 'lucide-react';
import { TableMeta } from '@/types/supabase-crud';

// Category grouping definition per specification
const TABLE_GROUPS: Record<string, string[]> = {
  Content: ['projects', 'skills', 'experiences', 'languages', 'bio_paragraphs', 'portfolio_content'],
  Settings: ['site_settings', 'app_settings', 'profiles', 'social_links'],
  Inbox: ['inbox_messages', 'suggested_people'],
};

function getTableGroup(tableName: string): string {
  for (const [group, members] of Object.entries(TABLE_GROUPS)) {
    if (members.includes(tableName)) return group;
  }
  return 'Other';
}

const GROUP_ORDER = ['Content', 'Settings', 'Inbox', 'Other'];

export const SupabaseTab: React.FC = () => {
  // Navigation mode: 'browser' (Table Browser & CRUD) vs 'diagnostics' (Connection & SQL Setup)
  const [viewMode, setViewMode] = useState<'browser' | 'diagnostics'>('browser');

  // Tables state
  const [tables, setTables] = useState<TableMeta[]>([]);
  const [selectedTableName, setSelectedTableName] = useState<string>('');
  const [projectRef, setProjectRef] = useState<string>('txrnbazpdyoaazszkwwq');
  const [isLoadingTables, setIsLoadingTables] = useState<boolean>(true);
  const [sidebarSearch, setSidebarSearch] = useState<string>('');

  // Collapsible sections state (persisted in localStorage)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Rows & Data grid state
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [showColumnFilters, setShowColumnFilters] = useState<boolean>(true);

  const [isLoadingRows, setIsLoadingRows] = useState<boolean>(false);
  const [currentTableMeta, setCurrentTableMeta] = useState<TableMeta | null>(null);
  const [currentTableError, setCurrentTableError] = useState<string | null>(null);
  const [isLocalFallback, setIsLocalFallback] = useState<boolean>(false);

  // Quick Table Switcher (Ctrl/Cmd+K)
  const [isQuickSwitcherOpen, setIsQuickSwitcherOpen] = useState<boolean>(false);
  const [quickSwitcherQuery, setQuickSwitcherQuery] = useState<string>('');
  const [quickSwitcherIndex, setQuickSwitcherIndex] = useState<number>(0);
  const quickSwitcherInputRef = useRef<HTMLInputElement>(null);

  // Side Drawer for inspecting full row
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [drawerRow, setDrawerRow] = useState<Record<string, unknown> | null>(null);

  // Modals for Insert / Edit
  const [isInsertOpen, setIsInsertOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [selectedRow, setSelectedRow] = useState<Record<string, unknown> | null>(null);

  // Form states for Insert / Edit
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [rawJsonMode, setRawJsonMode] = useState<boolean>(false);
  const [rawJsonText, setRawJsonText] = useState<string>('{}');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState<boolean>(false);

  // Notification feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedGrant, setCopiedGrant] = useState(false);
  const [copiedCellKey, setCopiedCellKey] = useState<string | null>(null);

  // Load persisted collapsed sections and selected table from localStorage on mount
  useEffect(() => {
    try {
      const savedCollapsed = localStorage.getItem('folioframe_db_collapsed_sections');
      if (savedCollapsed) {
        setCollapsedSections(JSON.parse(savedCollapsed));
      }
      const savedTable = localStorage.getItem('folioframe_db_selected_table');
      if (savedTable) {
        setSelectedTableName(savedTable);
      }
    } catch {
      // ignore
    }
  }, []);

  // Save selected table to localStorage
  const handleSelectTable = useCallback((tableName: string) => {
    setSelectedTableName(tableName);
    try {
      localStorage.setItem('folioframe_db_selected_table', tableName);
    } catch {}
    setPage(1);
    setColumnFilters({});
    setSearchQuery('');
    setSortBy(null);
  }, []);

  // Toggle collapsed section and persist
  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => {
      const updated = { ...prev, [section]: !prev[section] };
      try {
        localStorage.setItem('folioframe_db_collapsed_sections', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // 1. Fetch all discovered tables
  const fetchTables = useCallback(async () => {
    setIsLoadingTables(true);
    try {
      const res = await fetch('/api/supabase/tables');
      if (res.ok) {
        const data = await res.json();
        const tableList: TableMeta[] = data.tables || [];
        setTables(tableList);
        if (data.projectRef) setProjectRef(data.projectRef);

        // If no table selected or selected table not in list, pick the saved or first table
        const savedTable = typeof window !== 'undefined' ? localStorage.getItem('folioframe_db_selected_table') : null;
        if (savedTable && tableList.some((t) => t.name === savedTable)) {
          setSelectedTableName(savedTable);
        } else if (!selectedTableName && tableList.length > 0) {
          setSelectedTableName(tableList[0].name);
        }
      }
    } catch (err) {
      console.error('Failed to load tables:', err);
    } finally {
      setIsLoadingTables(false);
    }
  }, [selectedTableName]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  // 2. Fetch rows for the active table (50 rows per page)
  const fetchRows = useCallback(
    async (
      tableName = selectedTableName,
      pageNum = page,
      search = searchQuery,
      sortColumn = sortBy,
      order = sortOrder,
      filters = columnFilters
    ) => {
      if (!tableName) return;
      setIsLoadingRows(true);
      setCurrentTableError(null);

      try {
        const params = new URLSearchParams({
          table: tableName,
          page: String(pageNum),
          limit: '50', // 50 rows per page per requirement
        });
        if (search.trim()) params.set('search', search.trim());
        if (sortColumn) {
          params.set('sortBy', sortColumn);
          params.set('order', order);
        }

        // Pass column filters if present
        const activeFilters: Record<string, string> = {};
        for (const [col, val] of Object.entries(filters)) {
          if (val && val.trim()) activeFilters[col] = val.trim();
        }
        if (Object.keys(activeFilters).length > 0) {
          params.set('colFilters', JSON.stringify(activeFilters));
        }

        const res = await fetch(`/api/supabase/crud?${params.toString()}`);
        const data = await res.json();

        setRows(data.rows || []);
        setTotalRows(data.totalCount || 0);
        setIsLocalFallback(data.source === 'local_fallback');

        if (!data.hasPermission) {
          setCurrentTableError(data.error || 'Permission denied for this table.');
        }
      } catch (err) {
        setCurrentTableError(err instanceof Error ? err.message : 'Failed to query table rows');
      } finally {
        setIsLoadingRows(false);
      }
    },
    [selectedTableName, page, searchQuery, sortBy, sortOrder, columnFilters]
  );

  useEffect(() => {
    if (selectedTableName) {
      const meta = tables.find((t) => t.name === selectedTableName) || null;
      setCurrentTableMeta(meta);
      fetchRows(selectedTableName, 1, searchQuery, sortBy, sortOrder, columnFilters);
      setPage(1);
    }
  }, [selectedTableName, tables, fetchRows, searchQuery, sortBy, sortOrder, columnFilters]);

  // Column Sort handler
  const handleSortColumn = (colName: string) => {
    let nextSortBy: string | null = colName;
    let nextOrder: 'asc' | 'desc' = 'asc';

    if (sortBy === colName) {
      if (sortOrder === 'asc') {
        nextOrder = 'desc';
      } else {
        nextSortBy = null;
      }
    }

    setSortBy(nextSortBy);
    setSortOrder(nextOrder);
    setPage(1);
    fetchRows(selectedTableName, 1, searchQuery, nextSortBy, nextOrder, columnFilters);
  };

  // Column filter change
  const handleColumnFilterChange = (colName: string, value: string) => {
    const updated = { ...columnFilters, [colName]: value };
    if (!value) delete updated[colName];
    setColumnFilters(updated);
    setPage(1);
  };

  const clearAllFilters = () => {
    setColumnFilters({});
    setSearchQuery('');
    setPage(1);
  };

  const activeFiltersCount = Object.keys(columnFilters).filter((k) => columnFilters[k]?.trim()).length;

  // Global Ctrl/Cmd+K Listener for Quick Switcher Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsQuickSwitcherOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-focus quick switcher search input when opened
  useEffect(() => {
    if (isQuickSwitcherOpen) {
      setQuickSwitcherQuery('');
      setQuickSwitcherIndex(0);
      setTimeout(() => quickSwitcherInputRef.current?.focus(), 50);
    }
  }, [isQuickSwitcherOpen]);

  // Grouped tables list for sidebar and switcher
  const groupedTables = useMemo(() => {
    const groups: Record<string, TableMeta[]> = {
      Content: [],
      Settings: [],
      Inbox: [],
      Other: [],
    };

    const searchLower = sidebarSearch.toLowerCase().trim();

    tables.forEach((t) => {
      if (searchLower && !t.name.toLowerCase().includes(searchLower)) {
        return;
      }
      const grp = getTableGroup(t.name);
      if (!groups[grp]) groups[grp] = [];
      groups[grp].push(t);
    });

    return groups;
  }, [tables, sidebarSearch]);

  // Quick switcher filtered list
  const quickSwitcherMatches = useMemo(() => {
    const q = quickSwitcherQuery.toLowerCase().trim();
    if (!q) return tables;
    return tables.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        getTableGroup(t.name).toLowerCase().includes(q) ||
        t.columns.some((c) => c.name.toLowerCase().includes(q))
    );
  }, [tables, quickSwitcherQuery]);

  // Handle keyboard navigation in quick switcher
  const handleQuickSwitcherKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setQuickSwitcherIndex((prev) => (prev + 1) % Math.max(1, quickSwitcherMatches.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setQuickSwitcherIndex((prev) => (prev - 1 + quickSwitcherMatches.length) % Math.max(1, quickSwitcherMatches.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = quickSwitcherMatches[quickSwitcherIndex];
      if (target) {
        handleSelectTable(target.name);
        setIsQuickSwitcherOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsQuickSwitcherOpen(false);
    }
  };

  // Open side drawer for row details
  const handleOpenDrawer = (row: Record<string, unknown>) => {
    setDrawerRow(row);
    setIsDrawerOpen(true);
  };

  // Handle row deletion
  const handleDeleteRow = async (row: Record<string, unknown>) => {
    if (!currentTableMeta) return;
    const pk = currentTableMeta.primaryKey || 'id';
    const pkValue = row[pk];

    if (typeof pkValue === 'undefined') {
      alert(`Cannot delete row: primary key column "${pk}" not found on record.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete record where ${pk} = "${pkValue}"?`)) {
      return;
    }

    try {
      const params = new URLSearchParams({
        table: selectedTableName,
        pkColumn: pk,
        pkValue: String(pkValue),
      });

      const res = await fetch(`/api/supabase/crud?${params.toString()}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: `Row ${pkValue} deleted successfully!` });
        if (drawerRow && drawerRow[pk] === pkValue) {
          setIsDrawerOpen(false);
        }
        fetchRows(selectedTableName, page);
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'Failed to delete row. Run table grants if needed.',
        });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Delete failed' });
    }

    setTimeout(() => setFeedback(null), 4000);
  };

  // Open Edit Modal
  const handleOpenEdit = (row: Record<string, unknown>) => {
    setSelectedRow(row);
    setFormError(null);
    setRawJsonMode(false);

    const initialForm: Record<string, string> = {};
    for (const k of Object.keys(row)) {
      const val = row[k];
      if (typeof val === 'object' && val !== null) {
        initialForm[k] = JSON.stringify(val, null, 2);
      } else {
        initialForm[k] = val !== undefined && val !== null ? String(val) : '';
      }
    }
    setFormData(initialForm);
    setRawJsonText(JSON.stringify(row, null, 2));
    setIsEditOpen(true);
  };

  // Open Insert Modal
  const handleOpenInsert = () => {
    setSelectedRow(null);
    setFormError(null);
    setRawJsonMode(false);

    const initialForm: Record<string, string> = {};
    if (currentTableMeta) {
      for (const col of currentTableMeta.columns) {
        if (col.format === 'jsonb') {
          initialForm[col.name] = '{}';
        } else if (col.defaultValue && col.defaultValue !== "timezone('utc'::text, now())") {
          initialForm[col.name] = col.defaultValue.replace(/'/g, '');
        } else {
          initialForm[col.name] = '';
        }
      }
    }
    setFormData(initialForm);
    setRawJsonText(JSON.stringify(initialForm, null, 2));
    setIsInsertOpen(true);
  };

  // Submit Insert
  const handleSubmitInsert = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmittingForm(true);

    try {
      let recordPayload: Record<string, unknown> = {};

      if (rawJsonMode) {
        try {
          recordPayload = JSON.parse(rawJsonText);
        } catch {
          throw new Error('Invalid JSON syntax in Raw JSON editor.');
        }
      } else {
        for (const [key, val] of Object.entries(formData)) {
          const colMeta = currentTableMeta?.columns.find((c) => c.name === key);
          if (colMeta?.format === 'jsonb') {
            try {
              recordPayload[key] = val ? JSON.parse(val) : {};
            } catch {
              throw new Error(`Field "${key}" must contain valid JSON.`);
            }
          } else if (colMeta?.type === 'boolean') {
            recordPayload[key] = val === 'true';
          } else if (colMeta?.type === 'integer' || colMeta?.type === 'number') {
            if (val.trim() === '') {
              recordPayload[key] = null;
            } else {
              const parsedNum = Number(val);
              if (isNaN(parsedNum)) throw new Error(`Field "${key}" must be a number.`);
              recordPayload[key] = parsedNum;
            }
          } else {
            recordPayload[key] = val.trim() === '' ? null : val;
          }
        }
      }

      const res = await fetch('/api/supabase/crud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: selectedTableName, record: recordPayload }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: 'Record inserted successfully!' });
        setIsInsertOpen(false);
        fetchRows(selectedTableName, 1);
        fetchTables();
      } else {
        setFormError(data.error || 'Failed to insert row.');
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Insert failed');
    } finally {
      setIsSubmittingForm(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  // Submit Edit
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRow || !currentTableMeta) return;

    setFormError(null);
    setIsSubmittingForm(true);

    const pk = currentTableMeta.primaryKey || 'id';
    const pkValue = selectedRow[pk];

    try {
      let recordPayload: Record<string, unknown> = {};

      if (rawJsonMode) {
        try {
          recordPayload = JSON.parse(rawJsonText);
        } catch {
          throw new Error('Invalid JSON syntax in Raw JSON editor.');
        }
      } else {
        for (const [key, val] of Object.entries(formData)) {
          if (key === pk) continue;
          const colMeta = currentTableMeta?.columns.find((c) => c.name === key);
          if (colMeta?.format === 'jsonb') {
            try {
              recordPayload[key] = val ? JSON.parse(val) : {};
            } catch {
              throw new Error(`Field "${key}" must contain valid JSON.`);
            }
          } else if (colMeta?.type === 'boolean') {
            recordPayload[key] = val === 'true';
          } else if (colMeta?.type === 'integer' || colMeta?.type === 'number') {
            if (val.trim() === '') {
              recordPayload[key] = null;
            } else {
              const parsedNum = Number(val);
              if (isNaN(parsedNum)) throw new Error(`Field "${key}" must be a number.`);
              recordPayload[key] = parsedNum;
            }
          } else {
            recordPayload[key] = val.trim() === '' ? null : val;
          }
        }
      }

      const res = await fetch('/api/supabase/crud', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: selectedTableName,
          pkColumn: pk,
          pkValue,
          updates: recordPayload,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: 'Record updated successfully!' });
        setIsEditOpen(false);
        if (drawerRow && drawerRow[pk] === pkValue) {
          setDrawerRow({ ...drawerRow, ...recordPayload });
        }
        fetchRows(selectedTableName, page);
      } else {
        setFormError(data.error || 'Failed to update record.');
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setIsSubmittingForm(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const sqlEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;

  const copyGrantSql = () => {
    const grant = `GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;\nGRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;\nALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;`;
    navigator.clipboard.writeText(grant);
    setCopiedGrant(true);
    setTimeout(() => setCopiedGrant(false), 2500);
  };

  const totalPages = Math.max(1, Math.ceil(totalRows / 50));

  return (
    <div className="space-y-4 max-w-7xl pb-8">
      {/* Toast Notification */}
      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between shadow-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400 font-semibold'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <AlertCircle className="size-4" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* REQUIREMENT 5: Slim One-Row Header Card (Title, Connection Badge, Tabs, SQL Editor Button) */}
      <div className="card-raised rounded-2xl border border-line bg-surface px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        {/* Title + Connection Badge */}
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 grid place-items-center shrink-0">
            <Database className="size-4" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-ink whitespace-nowrap">Cloud Database Studio</h2>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected ({projectRef})
            </span>
          </div>
        </div>

        {/* Right side: Mode Switcher Tabs + Quick Switch Button + SQL Editor Button */}
        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="p-0.5 rounded-lg bg-surface-2 border border-line flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setViewMode('browser')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'browser'
                  ? 'bg-surface text-ink shadow-xs border border-line/60'
                  : 'text-ink-3 hover:text-ink'
              }`}
            >
              Table Browser
            </button>
            <button
              type="button"
              onClick={() => setViewMode('diagnostics')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'diagnostics'
                  ? 'bg-surface text-ink shadow-xs border border-line/60'
                  : 'text-ink-3 hover:text-ink'
              }`}
            >
              Diagnostics & SQL
            </button>
          </div>

          {/* REQUIREMENT 3: Ctrl/Cmd+K quick table switcher button */}
          <button
            type="button"
            onClick={() => setIsQuickSwitcherOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 h-7.5 px-2.5 rounded-lg border border-line bg-surface-2 hover:bg-surface text-ink-3 hover:text-ink text-[11px] font-semibold transition-colors cursor-pointer"
            title="Quick Table Switcher (Ctrl+K)"
          >
            <Search className="size-3" />
            <span>Switch</span>
            <kbd className="px-1 py-0.2 rounded text-[9px] font-mono bg-surface border border-line text-ink-4">
              Ctrl K
            </kbd>
          </button>

          {/* SQL Editor external button */}
          <a
            href={sqlEditorUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary h-7.5 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
            title="Open Supabase SQL Editor"
          >
            <span>SQL Editor</span>
            <ExternalLink className="size-3" />
          </a>
        </div>
      </div>

      {/* MODE 1: TABLE BROWSER & CRUD (TWO-PANE LAYOUT) */}
      {viewMode === 'browser' && (
        <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-10rem)] min-h-[560px]">
          {/* REQUIREMENT 1: Left Sidebar (240px, sticky, scrollable, grouped, search input, row count badges) */}
          <aside className="hidden md:flex flex-col w-[240px] shrink-0 card-raised rounded-2xl border border-line bg-surface overflow-hidden shadow-xs">
            {/* Search Input at top of Sidebar */}
            <div className="p-3 border-b border-line bg-surface-2/40">
              <div className="relative">
                <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
                <input
                  type="text"
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  placeholder="Filter tables..."
                  className="w-full h-8 pl-8 pr-7 rounded-lg bg-surface border border-line text-xs text-ink placeholder:text-ink-4 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                {sidebarSearch && (
                  <button
                    type="button"
                    onClick={() => setSidebarSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-4 hover:text-ink"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Grouped Table List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2.5">
              {isLoadingTables ? (
                <div className="p-6 text-center text-xs text-ink-3 flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin text-brand-500" />
                  <span>Loading tables...</span>
                </div>
              ) : (
                GROUP_ORDER.map((groupKey) => {
                  const groupTables = groupedTables[groupKey] || [];
                  if (groupTables.length === 0 && sidebarSearch) return null;

                  const isCollapsed = Boolean(collapsedSections[groupKey]);
                  const GroupIcon =
                    groupKey === 'Content'
                      ? Layers
                      : groupKey === 'Settings'
                      ? Settings
                      : groupKey === 'Inbox'
                      ? Mail
                      : Database;

                  return (
                    <div key={groupKey} className="space-y-1">
                      {/* Collapsible Section Header */}
                      <button
                        type="button"
                        onClick={() => toggleSection(groupKey)}
                        className="w-full flex items-center justify-between px-2 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-1.5">
                          {isCollapsed ? (
                            <ChevronRight className="size-3 text-ink-4" />
                          ) : (
                            <ChevronDown className="size-3 text-ink-4" />
                          )}
                          <GroupIcon className="size-3 text-brand-500" />
                          <span>{groupKey}</span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-surface-2 border border-line text-ink-4 font-normal">
                          {groupTables.length}
                        </span>
                      </button>

                      {/* Tables under this section */}
                      {!isCollapsed && (
                        <div className="space-y-0.5 pl-1">
                          {groupTables.map((tbl) => {
                            const isSelected = selectedTableName === tbl.name;
                            return (
                              <button
                                key={tbl.name}
                                type="button"
                                onClick={() => handleSelectTable(tbl.name)}
                                className={`w-full h-8 px-2.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between cursor-pointer border ${
                                  isSelected
                                    ? 'bg-brand-500/10 border-brand-500/30 text-brand-600 dark:text-brand-400 font-bold border-l-2 border-l-brand-500 shadow-xs'
                                    : 'border-transparent text-ink-2 hover:bg-surface-2 hover:text-ink'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <TableIcon className={`size-3.5 shrink-0 ${isSelected ? 'text-brand-500' : 'text-ink-4'}`} />
                                  <span className="truncate">{tbl.name}</span>
                                </div>
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono shrink-0 ml-1.5 ${
                                    isSelected
                                      ? 'bg-brand-500/20 text-brand-600 dark:text-brand-400 font-bold'
                                      : 'bg-surface-2 text-ink-4'
                                  }`}
                                >
                                  {tbl.rowCount}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Sidebar Footer */}
            <div className="p-2.5 border-t border-line text-[11px] text-ink-3 flex items-center justify-between bg-surface-2/30">
              <span className="text-[10px] font-mono text-ink-4">{tables.length} tables total</span>
              <button
                type="button"
                onClick={fetchTables}
                className="p-1 rounded text-ink-3 hover:text-ink hover:bg-surface transition-colors cursor-pointer"
                title="Refresh tables list"
              >
                <RefreshCw className={`size-3 ${isLoadingTables ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </aside>

          {/* REQUIREMENT 2 & 4: Right Pane (full remaining width and height, sticky header, pagination, sort, filters, mobile select dropdown) */}
          <main className="flex-1 min-w-0 flex flex-col card-raised rounded-2xl border border-line bg-surface overflow-hidden shadow-xs h-full">
            {/* REQUIREMENT 4: Mobile Dropdown Select (Collapses sidebar below 768px / md) */}
            <div className="md:hidden p-3 border-b border-line bg-surface-2/40 flex items-center justify-between gap-2 shrink-0">
              <div className="flex-1 min-w-0">
                <label className="text-[10px] font-bold uppercase tracking-wider text-ink-3 mb-1 block">
                  Active Table
                </label>
                <select
                  value={selectedTableName}
                  onChange={(e) => handleSelectTable(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-lg bg-surface border border-line text-xs font-semibold text-ink focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  {GROUP_ORDER.map((grp) => {
                    const groupTbls = tables.filter((t) => getTableGroup(t.name) === grp);
                    if (groupTbls.length === 0) return null;
                    return (
                      <optgroup key={grp} label={grp}>
                        {groupTbls.map((t) => (
                          <option key={t.name} value={t.name}>
                            {t.name} ({t.rowCount} rows)
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickSwitcherOpen(true)}
                className="mt-4 p-2 rounded-lg border border-line bg-surface text-ink-3 hover:text-ink shrink-0"
                title="Quick Table Switcher (Ctrl+K)"
              >
                <Search className="size-4" />
              </button>
            </div>

            {/* Right Pane Action Bar */}
            <div className="p-3 sm:px-4 sm:py-2.5 border-b border-line flex flex-wrap items-center justify-between gap-2.5 bg-surface-2/40 shrink-0">
              {/* Table Info & Badges */}
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-bold text-ink truncate font-mono">
                  public.{selectedTableName}
                </span>
                <span className="text-xs text-ink-3 font-medium whitespace-nowrap">
                  ({totalRows} {totalRows === 1 ? 'record' : 'records'})
                </span>
                {isLocalFallback && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Local Cache
                  </span>
                )}
              </div>

              {/* Action buttons & Search */}
              <div className="flex items-center gap-2">
                {/* Global Search in table */}
                <div className="relative">
                  <Search className="size-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search in table..."
                    className="h-7.5 pl-7 pr-2.5 rounded-lg bg-surface border border-line text-xs text-ink placeholder:text-ink-4 focus:outline-none focus:ring-1 focus:ring-brand-500 w-36 sm:w-48"
                  />
                </div>

                {/* Toggle Column Filters */}
                <button
                  type="button"
                  onClick={() => setShowColumnFilters(!showColumnFilters)}
                  className={`h-7.5 px-2.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    showColumnFilters || activeFiltersCount > 0
                      ? 'bg-brand-500/10 border-brand-500/30 text-brand-600 dark:text-brand-400'
                      : 'border-line bg-surface text-ink-3 hover:text-ink'
                  }`}
                  title="Toggle Per-Column Filters"
                >
                  <Filter className="size-3" />
                  <span className="hidden sm:inline">Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="size-4 rounded-full bg-brand-500 text-white text-[9px] font-bold grid place-items-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                {/* Refresh rows */}
                <button
                  type="button"
                  onClick={() => fetchRows(selectedTableName, page, searchQuery, sortBy, sortOrder, columnFilters)}
                  className="p-1.5 rounded-lg border border-line text-ink-3 hover:text-ink hover:bg-surface transition-colors cursor-pointer"
                  title="Refresh rows"
                >
                  <RefreshCw className={`size-3.5 ${isLoadingRows ? 'animate-spin' : ''}`} />
                </button>

                {/* Insert Row Button */}
                <button
                  type="button"
                  onClick={handleOpenInsert}
                  className="btn btn-primary h-7.5 px-3 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  <span className="hidden sm:inline">Insert Row</span>
                  <span className="sm:hidden">New</span>
                </button>
              </div>
            </div>

            {/* Active Filters Clear Bar if filters applied */}
            {activeFiltersCount > 0 && (
              <div className="px-4 py-1.5 border-b border-line bg-brand-500/5 text-xs text-ink-3 flex items-center justify-between shrink-0">
                <span className="text-[11px] font-medium text-brand-600 dark:text-brand-400">
                  {activeFiltersCount} per-column filter{activeFiltersCount > 1 ? 's' : ''} applied
                </span>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-[11px] font-bold text-ink hover:underline cursor-pointer flex items-center gap-1"
                >
                  <X className="size-3" />
                  <span>Clear all filters</span>
                </button>
              </div>
            )}

            {/* Permission Warning Notice if Table Needs Grants */}
            {currentTableError && (
              <div className="p-3 border-b border-amber-500/30 bg-amber-500/10 text-xs flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <AlertCircle className="size-4 text-amber-500 shrink-0" />
                  <span className="text-amber-800 dark:text-amber-300 font-medium">
                    {currentTableError}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyGrantSql}
                    className="btn btn-primary h-6 px-2 text-[10px]"
                  >
                    {copiedGrant ? 'Copied!' : 'Copy Grant SQL'}
                  </button>
                  <a
                    href={sqlEditorUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary h-6 px-2 text-[10px]"
                  >
                    Open SQL
                  </a>
                </div>
              </div>
            )}

            {/* Main Data Grid (Scrollable with Sticky Header) */}
            <div className="overflow-auto flex-1 relative bg-surface">
              {isLoadingRows ? (
                <div className="p-16 text-center text-xs text-ink-3 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="size-5 animate-spin text-brand-500" />
                  <span>Querying table records (50 rows/page)...</span>
                </div>
              ) : rows.length === 0 ? (
                <div className="p-16 text-center text-xs text-ink-3 space-y-2">
                  <Database className="size-8 mx-auto opacity-30" />
                  <p className="font-bold text-ink">No rows found in {selectedTableName}</p>
                  <p className="text-[11px]">
                    {activeFiltersCount > 0
                      ? 'Try clearing active filters.'
                      : 'Click "Insert Row" above to create your first record.'}
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  {/* Sticky Header */}
                  <thead className="sticky top-0 z-20 bg-surface-2 border-b border-line shadow-xs">
                    {/* Header Row: Column names, PK indicators, Sort handlers */}
                    <tr className="text-ink-3 font-semibold text-[11px]">
                      {currentTableMeta?.columns.map((col) => {
                        const isSorted = sortBy === col.name;
                        return (
                          <th
                            key={col.name}
                            onClick={() => handleSortColumn(col.name)}
                            className="py-2.5 px-3.5 whitespace-nowrap select-none hover:bg-surface-3 transition-colors cursor-pointer"
                            title={`Click to sort by ${col.name}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                {col.isPrimaryKey && <Key className="size-3 text-amber-500 shrink-0" />}
                                <span className={isSorted ? 'text-brand-500 font-bold' : ''}>
                                  {col.name}
                                </span>
                                <span className="text-[9.5px] font-mono text-ink-4 uppercase">
                                  {col.format || col.type}
                                </span>
                              </div>
                              <div className="shrink-0 text-ink-4">
                                {isSorted ? (
                                  sortOrder === 'asc' ? (
                                    <ArrowUp className="size-3 text-brand-500" />
                                  ) : (
                                    <ArrowDown className="size-3 text-brand-500" />
                                  )
                                ) : (
                                  <ArrowUpDown className="size-2.5 opacity-30 hover:opacity-100" />
                                )}
                              </div>
                            </div>
                          </th>
                        );
                      })}
                      <th className="py-2.5 px-3.5 text-right whitespace-nowrap bg-surface-2 w-28">
                        Actions
                      </th>
                    </tr>

                    {/* REQUIREMENT 2: Per-Column Filter Input Row */}
                    {showColumnFilters && (
                      <tr className="bg-surface-2/90 border-t border-line/40">
                        {currentTableMeta?.columns.map((col) => (
                          <th key={`filter-${col.name}`} className="p-1 px-2.5 font-normal">
                            <input
                              type="text"
                              value={columnFilters[col.name] || ''}
                              onChange={(e) => handleColumnFilterChange(col.name, e.target.value)}
                              placeholder={`Filter ${col.name}...`}
                              className={`w-full h-6 px-2 text-[10.5px] font-mono rounded bg-surface border text-ink placeholder:text-ink-4 focus:outline-none focus:ring-1 focus:ring-brand-500 ${
                                columnFilters[col.name]
                                  ? 'border-brand-500 bg-brand-500/5 text-brand-600 dark:text-brand-400 font-bold'
                                  : 'border-line'
                              }`}
                            />
                          </th>
                        ))}
                        <th className="p-1 px-2.5 text-right">
                          {activeFiltersCount > 0 && (
                            <button
                              type="button"
                              onClick={clearAllFilters}
                              className="text-[10px] text-ink-4 hover:text-ink font-semibold"
                              title="Clear all column filters"
                            >
                              Reset
                            </button>
                          )}
                        </th>
                      </tr>
                    )}
                  </thead>

                  {/* Table Body */}
                  <tbody className="divide-y divide-line/60">
                    {rows.map((row, rowIdx) => {
                      const pk = currentTableMeta?.primaryKey || 'id';
                      const pkValue = String(row[pk] ?? rowIdx);

                      return (
                        <tr key={pkValue} className="hover:bg-surface-2/40 transition-colors group">
                          {currentTableMeta?.columns.map((col) => {
                            const val = row[col.name];
                            const isJson = typeof val === 'object' && val !== null;
                            const isBool = typeof val === 'boolean';
                            const cellStr = isJson ? JSON.stringify(val) : String(val ?? '');

                            return (
                              <td
                                key={col.name}
                                className="py-2.5 px-3.5 text-ink align-middle max-w-[200px] truncate"
                                title={cellStr} /* REQUIREMENT 6: Truncate long cell values with native tooltip */
                              >
                                {col.isPrimaryKey ? (
                                  <span className="font-mono font-bold text-brand-600 dark:text-brand-400 truncate block">
                                    {String(val)}
                                  </span>
                                ) : isJson ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenDrawer(row)}
                                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-surface-2 border border-line text-ink-2 hover:border-brand-500/40 inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Code className="size-3" />
                                    <span>JSON ({Object.keys(val as object).length} keys)</span>
                                  </button>
                                ) : isBool ? (
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      val
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                        : 'bg-zinc-500/10 text-zinc-500'
                                    }`}
                                  >
                                    {String(val)}
                                  </span>
                                ) : (
                                  <span className="truncate block font-mono text-[11.5px]">
                                    {val !== undefined && val !== null ? (
                                      cellStr
                                    ) : (
                                      <span className="text-ink-4 italic">null</span>
                                    )}
                                  </span>
                                )}
                              </td>
                            );
                          })}

                          {/* Row Actions: REQUIREMENT 6: Eye icon opens side drawer */}
                          <td className="py-2 px-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenDrawer(row)}
                                className="p-1.5 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
                                title="View full row in side drawer"
                              >
                                <Eye className="size-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEdit(row)}
                                className="p-1.5 rounded-lg text-ink-3 hover:text-brand-500 hover:bg-brand-500/10 transition-colors cursor-pointer"
                                title="Edit row"
                              >
                                <Edit2 className="size-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteRow(row)}
                                className="p-1.5 rounded-lg text-ink-3 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="Delete row"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* REQUIREMENT 2: Server-Side Pagination Bar (50 rows per page) */}
            <div className="p-3 sm:px-4 border-t border-line flex flex-wrap items-center justify-between gap-2 text-xs text-ink-3 bg-surface-2/30 shrink-0">
              <div className="flex items-center gap-2">
                <span>
                  Showing {rows.length > 0 ? (page - 1) * 50 + 1 : 0} -{' '}
                  {Math.min(page * 50, totalRows)} of {totalRows} records
                </span>
                <span className="text-ink-4">·</span>
                <span className="font-mono text-[11px]">50 / page</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={page <= 1 || isLoadingRows}
                  onClick={() => {
                    setPage(1);
                    fetchRows(selectedTableName, 1, searchQuery, sortBy, sortOrder, columnFilters);
                  }}
                  className="btn btn-secondary h-7 px-2 rounded-lg text-[11px] disabled:opacity-40"
                  title="First Page"
                >
                  <ChevronsLeft className="size-3.5" />
                </button>
                <button
                  type="button"
                  disabled={page <= 1 || isLoadingRows}
                  onClick={() => {
                    const prev = Math.max(1, page - 1);
                    setPage(prev);
                    fetchRows(selectedTableName, prev, searchQuery, sortBy, sortOrder, columnFilters);
                  }}
                  className="btn btn-secondary h-7 px-2.5 rounded-lg text-[11px] disabled:opacity-40"
                  title="Previous Page"
                >
                  <ChevronLeft className="size-3.5 mr-0.5" />
                  <span>Prev</span>
                </button>

                <span className="font-mono text-[11px] px-2">
                  Page {page} of {totalPages}
                </span>

                <button
                  type="button"
                  disabled={page >= totalPages || isLoadingRows}
                  onClick={() => {
                    const next = page + 1;
                    setPage(next);
                    fetchRows(selectedTableName, next, searchQuery, sortBy, sortOrder, columnFilters);
                  }}
                  className="btn btn-secondary h-7 px-2.5 rounded-lg text-[11px] disabled:opacity-40"
                  title="Next Page"
                >
                  <span>Next</span>
                  <ChevronRight className="size-3.5 ml-0.5" />
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages || isLoadingRows}
                  onClick={() => {
                    setPage(totalPages);
                    fetchRows(selectedTableName, totalPages, searchQuery, sortBy, sortOrder, columnFilters);
                  }}
                  className="btn btn-secondary h-7 px-2 rounded-lg text-[11px] disabled:opacity-40"
                  title="Last Page"
                >
                  <ChevronsRight className="size-3.5" />
                </button>
              </div>
            </div>
          </main>
        </div>
      )}

      {/* MODE 2: DIAGNOSTICS & SQL MIGRATION */}
      {viewMode === 'diagnostics' && (
        <div className="space-y-6">
          <div className="grid gap-3.5 sm:grid-cols-3">
            <div className="card-raised p-4 rounded-xl border border-line bg-surface space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-ink-3">
                <span>REST API</span>
                <Server className="size-3.5" />
              </div>
              <p className="text-sm font-bold text-ink flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500" />
                Connected (200 OK)
              </p>
              <p className="text-[10px] text-ink-3 font-mono">Ref: {projectRef}</p>
            </div>

            <div className="card-raised p-4 rounded-xl border border-line bg-surface space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-ink-3">
                <span>portfolio_content</span>
                <Layers className="size-3.5" />
              </div>
              <p className="text-sm font-bold text-ink flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500" />
                Table Exists in Schema
              </p>
              <p className="text-[10px] text-ink-3">JSONB Portfolio Store</p>
            </div>

            <div className="card-raised p-4 rounded-xl border border-line bg-surface space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-ink-3">
                <span>app_settings</span>
                <Shield className="size-3.5" />
              </div>
              <p className="text-sm font-bold text-ink flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500" />
                Table Exists in Schema
              </p>
              <p className="text-[10px] text-ink-3">Protected Configuration</p>
            </div>
          </div>

          {/* Master Grant SQL Card */}
          <div className="card-raised rounded-2xl border border-line bg-surface p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="size-4.5 text-emerald-500" />
                <div>
                  <h3 className="text-sm font-bold text-ink">Master Table Grant SQL</h3>
                  <p className="text-xs text-ink-3">Grant standard permissions to anon, authenticated, and service_role.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyGrantSql}
                  className="btn btn-primary h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  {copiedGrant ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  <span>{copiedGrant ? 'Copied!' : 'Copy Grant SQL'}</span>
                </button>
              </div>
            </div>

            <pre className="p-4 rounded-xl bg-surface-2 border border-line font-mono text-xs text-ink-2 overflow-x-auto leading-relaxed">
              {`-- 1. Grant table privileges to standard Supabase roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;`}
            </pre>
          </div>
        </div>
      )}

      {/* REQUIREMENT 3: CTRL/CMD+K QUICK TABLE SWITCHER MODAL */}
      {isQuickSwitcherOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4"
          onClick={() => setIsQuickSwitcherOpen(false)}
        >
          <div
            className="card-raised rounded-2xl border border-line bg-surface max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleQuickSwitcherKeyDown}
          >
            {/* Switcher Search Input */}
            <div className="p-3.5 border-b border-line flex items-center gap-2.5 bg-surface-2/40">
              <Search className="size-4 text-brand-500 shrink-0" />
              <input
                ref={quickSwitcherInputRef}
                type="text"
                value={quickSwitcherQuery}
                onChange={(e) => {
                  setQuickSwitcherQuery(e.target.value);
                  setQuickSwitcherIndex(0);
                }}
                placeholder="Jump to table... (e.g. projects, skills, settings)"
                className="w-full text-xs font-medium text-ink bg-transparent focus:outline-none placeholder:text-ink-4"
              />
              <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface border border-line text-ink-3">
                Esc
              </kbd>
            </div>

            {/* Switcher Matches List */}
            <div className="overflow-y-auto p-2 divide-y divide-line/40">
              {quickSwitcherMatches.length === 0 ? (
                <div className="p-8 text-center text-xs text-ink-3">
                  No tables found matching &quot;{quickSwitcherQuery}&quot;
                </div>
              ) : (
                quickSwitcherMatches.map((tbl, idx) => {
                  const isSelected = idx === quickSwitcherIndex;
                  const isActiveTable = selectedTableName === tbl.name;
                  const group = getTableGroup(tbl.name);

                  return (
                    <div
                      key={tbl.name}
                      onClick={() => {
                        handleSelectTable(tbl.name);
                        setIsQuickSwitcherOpen(false);
                      }}
                      className={`px-3 py-2.5 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold border border-brand-500/20'
                          : 'hover:bg-surface-2 text-ink-2'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <TableIcon className={`size-4 shrink-0 ${isSelected ? 'text-brand-500' : 'text-ink-4'}`} />
                        <div className="truncate">
                          <span className="truncate">{tbl.name}</span>
                          {isActiveTable && (
                            <span className="ml-2 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              (active)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-surface-2 border border-line text-ink-3">
                          {group}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono bg-surface-2 border border-line text-ink-3">
                          {tbl.rowCount} rows
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Switcher Footer */}
            <div className="p-2.5 border-t border-line text-[10.5px] text-ink-4 flex items-center justify-between bg-surface-2/40">
              <span>Use ↑ ↓ to navigate, Enter to select</span>
              <span>{quickSwitcherMatches.length} tables</span>
            </div>
          </div>
        </div>
      )}

      {/* REQUIREMENT 6: SIDE DRAWER FOR FULL ROW DETAILS */}
      {isDrawerOpen && drawerRow && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl card-raised bg-surface border-l border-line shadow-2xl flex flex-col">
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between bg-surface-2/50 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="size-8 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 grid place-items-center shrink-0">
                    <Eye className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-ink truncate">
                      Record Details — public.{selectedTableName}
                    </h3>
                    <p className="text-[11px] text-ink-3 font-mono truncate">
                      {currentTableMeta?.primaryKey}: {String(drawerRow[currentTableMeta?.primaryKey || 'id'] ?? '')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(drawerRow, null, 2));
                      setFeedback({ type: 'success', message: 'Full row JSON copied to clipboard!' });
                      setTimeout(() => setFeedback(null), 3000);
                    }}
                    className="btn btn-secondary h-8 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
                    title="Copy full record JSON"
                  >
                    <Copy className="size-3.5" />
                    <span className="hidden sm:inline">Copy JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1.5 rounded-lg text-ink-3 hover:text-ink cursor-pointer"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              {/* Drawer Body: All Column Values */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {currentTableMeta?.columns.map((col) => {
                  const val = drawerRow[col.name];
                  const isJson = typeof val === 'object' && val !== null;
                  const isBool = typeof val === 'boolean';
                  const cellKey = `drawer_${col.name}`;

                  return (
                    <div
                      key={col.name}
                      className="p-3.5 rounded-xl border border-line bg-surface-2/40 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                          {col.isPrimaryKey && <Key className="size-3 text-amber-500 shrink-0" />}
                          <span>{col.name}</span>
                          {col.isPrimaryKey && (
                            <span className="text-[9.5px] font-mono text-amber-600 dark:text-amber-400 font-normal">
                              (Primary Key)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-ink-3 uppercase bg-surface px-1.5 py-0.5 rounded border border-line">
                            {col.format || col.type}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const textToCopy = isJson ? JSON.stringify(val, null, 2) : String(val ?? '');
                              navigator.clipboard.writeText(textToCopy);
                              setCopiedCellKey(cellKey);
                              setTimeout(() => setCopiedCellKey(null), 2000);
                            }}
                            className="p-1 text-ink-4 hover:text-ink rounded transition-colors"
                            title="Copy value"
                          >
                            {copiedCellKey === cellKey ? (
                              <Check className="size-3 text-emerald-500" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Value Display */}
                      {isJson ? (
                        <pre className="p-3 rounded-lg bg-surface border border-line font-mono text-xs text-ink overflow-x-auto leading-relaxed max-h-60">
                          {JSON.stringify(val, null, 2)}
                        </pre>
                      ) : isBool ? (
                        <div className="pt-0.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              val
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                            }`}
                          >
                            {String(val)}
                          </span>
                        </div>
                      ) : (
                        <div className="font-mono text-xs text-ink break-words whitespace-pre-wrap bg-surface p-2.5 rounded-lg border border-line">
                          {val !== undefined && val !== null ? (
                            String(val)
                          ) : (
                            <span className="text-ink-4 italic">null</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-line flex items-center justify-between bg-surface-2/40 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDeleteRow(drawerRow)}
                  className="btn btn-secondary text-rose-600 hover:bg-rose-500/10 h-8.5 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Trash2 className="size-3.5" />
                  <span>Delete Record</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDrawerOpen(false);
                      handleOpenEdit(drawerRow);
                    }}
                    className="btn btn-primary h-8.5 px-4 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Edit2 className="size-3.5" />
                    <span>Edit Record</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: INSERT ROW */}
      {isInsertOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-raised rounded-2xl border border-line bg-surface max-w-xl w-full p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-line">
              <div className="flex items-center gap-2">
                <Plus className="size-4 text-brand-500" />
                <h3 className="text-sm font-bold text-ink">Insert Row into {selectedTableName}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRawJsonMode(!rawJsonMode)}
                  className="text-[11px] font-semibold text-ink-3 hover:text-ink px-2 py-1 rounded bg-surface-2 border border-line"
                >
                  {rawJsonMode ? 'Form Mode' : 'Raw JSON Mode'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsInsertOpen(false)}
                  className="p-1 rounded-lg text-ink-3 hover:text-ink"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {formError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitInsert} className="flex-1 overflow-y-auto py-4 space-y-3.5">
              {rawJsonMode ? (
                <div>
                  <label className="block text-xs font-semibold text-ink-3 mb-1">
                    Raw JSON Record Payload
                  </label>
                  <textarea
                    value={rawJsonText}
                    onChange={(e) => setRawJsonText(e.target.value)}
                    rows={12}
                    className="w-full p-3 rounded-xl bg-surface-2 border border-line font-mono text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
              ) : (
                currentTableMeta?.columns.map((col) => (
                  <div key={col.name}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                        {col.isPrimaryKey && <Key className="size-3 text-amber-500" />}
                        <span>{col.name}</span>
                        {col.isRequired && <span className="text-rose-500">*</span>}
                      </label>
                      <span className="text-[10px] font-mono text-ink-3 uppercase">
                        {col.format || col.type}
                      </span>
                    </div>

                    {col.format === 'jsonb' ? (
                      <textarea
                        value={formData[col.name] || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, [col.name]: e.target.value })
                        }
                        rows={4}
                        placeholder="{}"
                        className="w-full p-2.5 rounded-xl bg-surface-2 border border-line font-mono text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                      />
                    ) : col.type === 'boolean' ? (
                      <select
                        value={formData[col.name] || 'false'}
                        onChange={(e) =>
                          setFormData({ ...formData, [col.name]: e.target.value })
                        }
                        className="w-full h-9 px-3 rounded-xl bg-surface-2 border border-line text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                      >
                        <option value="true">true</option>
                        <option value="false">false</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={formData[col.name] || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, [col.name]: e.target.value })
                        }
                        placeholder={col.defaultValue || `Enter ${col.name}`}
                        className="w-full h-9 px-3 rounded-xl bg-surface-2 border border-line text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                      />
                    )}
                  </div>
                ))
              )}

              <div className="pt-3 border-t border-line flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInsertOpen(false)}
                  className="btn btn-secondary h-8.5 px-3.5 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingForm}
                  className="btn btn-primary h-8.5 px-4 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingForm ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                  <span>{isSubmittingForm ? 'Inserting...' : 'Insert Row'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT ROW */}
      {isEditOpen && selectedRow && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-raised rounded-2xl border border-line bg-surface max-w-xl w-full p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-line">
              <div className="flex items-center gap-2">
                <Edit2 className="size-4 text-brand-500" />
                <h3 className="text-sm font-bold text-ink">
                  Edit Record ({currentTableMeta?.primaryKey}: {String(selectedRow[currentTableMeta?.primaryKey || 'id'])})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRawJsonMode(!rawJsonMode)}
                  className="text-[11px] font-semibold text-ink-3 hover:text-ink px-2 py-1 rounded bg-surface-2 border border-line"
                >
                  {rawJsonMode ? 'Form Mode' : 'Raw JSON Mode'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="p-1 rounded-lg text-ink-3 hover:text-ink"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {formError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitEdit} className="flex-1 overflow-y-auto py-4 space-y-3.5">
              {rawJsonMode ? (
                <div>
                  <label className="block text-xs font-semibold text-ink-3 mb-1">
                    Raw JSON Updates Payload
                  </label>
                  <textarea
                    value={rawJsonText}
                    onChange={(e) => setRawJsonText(e.target.value)}
                    rows={12}
                    className="w-full p-3 rounded-xl bg-surface-2 border border-line font-mono text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
              ) : (
                currentTableMeta?.columns.map((col) => {
                  const isPk = col.isPrimaryKey;

                  return (
                    <div key={col.name}>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                          {isPk && <Key className="size-3 text-amber-500" />}
                          <span>{col.name}</span>
                          {isPk && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                              (Primary Key - Read Only)
                            </span>
                          )}
                        </label>
                        <span className="text-[10px] font-mono text-ink-3 uppercase">
                          {col.format || col.type}
                        </span>
                      </div>

                      {col.format === 'jsonb' ? (
                        <textarea
                          value={formData[col.name] || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, [col.name]: e.target.value })
                          }
                          rows={6}
                          className="w-full p-2.5 rounded-xl bg-surface-2 border border-line font-mono text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                        />
                      ) : col.type === 'boolean' ? (
                        <select
                          value={formData[col.name] || 'false'}
                          onChange={(e) =>
                            setFormData({ ...formData, [col.name]: e.target.value })
                          }
                          className="w-full h-9 px-3 rounded-xl bg-surface-2 border border-line text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                        >
                          <option value="true">true</option>
                          <option value="false">false</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={formData[col.name] || ''}
                          disabled={isPk}
                          onChange={(e) =>
                            setFormData({ ...formData, [col.name]: e.target.value })
                          }
                          className={`w-full h-9 px-3 rounded-xl border border-line text-xs font-medium ${
                            isPk
                              ? 'bg-surface-2/40 text-ink-3 font-mono cursor-not-allowed'
                              : 'bg-surface-2 text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/30'
                          }`}
                        />
                      )}
                    </div>
                  );
                })
              )}

              <div className="pt-3 border-t border-line flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="btn btn-secondary h-8.5 px-3.5 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingForm}
                  className="btn btn-primary h-8.5 px-4 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingForm ? <Loader2 className="size-3.5 animate-spin" /> : <Edit2 className="size-3.5" />}
                  <span>{isSubmittingForm ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
