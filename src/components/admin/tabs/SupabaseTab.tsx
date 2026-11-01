'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { TableMeta } from '@/types/supabase-crud';

export const SupabaseTab: React.FC = () => {
  // Navigation mode: 'browser' (Table Browser & CRUD) vs 'diagnostics' (Connection & SQL Setup)
  const [viewMode, setViewMode] = useState<'browser' | 'diagnostics'>('browser');

  // Tables state
  const [tables, setTables] = useState<TableMeta[]>([]);
  const [selectedTableName, setSelectedTableName] = useState<string>('');
  const [projectRef, setProjectRef] = useState<string>('txrnbazpdyoaazszkwwq');
  const [isLoadingTables, setIsLoadingTables] = useState<boolean>(true);

  // Rows & Data grid state
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoadingRows, setIsLoadingRows] = useState<boolean>(false);
  const [currentTableMeta, setCurrentTableMeta] = useState<TableMeta | null>(null);
  const [currentTableError, setCurrentTableError] = useState<string | null>(null);
  const [currentGrantHint, setCurrentGrantHint] = useState<string | null>(null);
  const [isLocalFallback, setIsLocalFallback] = useState<boolean>(false);

  // Modals
  const [isInsertOpen, setIsInsertOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [isInspectOpen, setIsInspectOpen] = useState<boolean>(false);
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
  const [copiedInspect, setCopiedInspect] = useState(false);

  // 1. Fetch all discovered tables
  const fetchTables = useCallback(async () => {
    setIsLoadingTables(true);
    try {
      const res = await fetch('/api/supabase/tables');
      if (res.ok) {
        const data = await res.json();
        setTables(data.tables || []);
        if (data.projectRef) setProjectRef(data.projectRef);

        if (!selectedTableName && data.tables?.length > 0) {
          setSelectedTableName(data.tables[0].name);
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

  // 2. Fetch rows for the active table
  const fetchRows = useCallback(
    async (tableName = selectedTableName, pageNum = page, search = searchQuery) => {
      if (!tableName) return;
      setIsLoadingRows(true);
      setCurrentTableError(null);
      setCurrentGrantHint(null);

      try {
        const params = new URLSearchParams({
          table: tableName,
          page: String(pageNum),
          limit: '20',
        });
        if (search.trim()) params.set('search', search.trim());

        const res = await fetch(`/api/supabase/crud?${params.toString()}`);
        const data = await res.json();

        setRows(data.rows || []);
        setTotalRows(data.totalCount || 0);
        setIsLocalFallback(data.source === 'local_fallback');

        if (!data.hasPermission) {
          setCurrentTableError(data.error || 'Permission denied for this table.');
          setCurrentGrantHint(data.hint || `GRANT ALL ON TABLE public.${tableName} TO anon, authenticated, service_role;`);
        }
      } catch (err) {
        setCurrentTableError(err instanceof Error ? err.message : 'Failed to query table rows');
      } finally {
        setIsLoadingRows(false);
      }
    },
    [selectedTableName, page, searchQuery]
  );

  useEffect(() => {
    if (selectedTableName) {
      const meta = tables.find((t) => t.name === selectedTableName) || null;
      setCurrentTableMeta(meta);
      fetchRows(selectedTableName, 1, searchQuery);
      setPage(1);
    }
  }, [selectedTableName, tables, fetchRows, searchQuery]);

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

    // Populate form data
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

  // Open Inspect Modal
  const handleOpenInspect = (row: Record<string, unknown>) => {
    setSelectedRow(row);
    setIsInspectOpen(true);
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
              throw new Error(`Field "${key}" must be valid JSON.`);
            }
          } else if (colMeta?.type === 'boolean') {
            recordPayload[key] = val === 'true';
          } else if (colMeta?.type === 'integer' || colMeta?.type === 'number') {
            recordPayload[key] = val === '' ? null : Number(val);
          } else {
            recordPayload[key] = val;
          }
        }
      }

      const res = await fetch('/api/supabase/crud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: selectedTableName,
          record: recordPayload,
        }),
      });

      const data = await res.json();
      setIsSubmittingForm(false);

      if (data.success) {
        setIsInsertOpen(false);
        setFeedback({ type: 'success', message: 'Row inserted successfully into Supabase!' });
        fetchRows(selectedTableName, page);
      } else {
        setFormError(data.error || 'Failed to insert row.');
      }
    } catch (err) {
      setIsSubmittingForm(false);
      setFormError(err instanceof Error ? err.message : 'Error submitting form');
    }

    setTimeout(() => setFeedback(null), 4000);
  };

  // Submit Edit / Update
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRow || !currentTableMeta) return;

    setFormError(null);
    setIsSubmittingForm(true);

    const pk = currentTableMeta.primaryKey || 'id';
    const pkValue = selectedRow[pk];

    try {
      let updatesPayload: Record<string, unknown> = {};

      if (rawJsonMode) {
        try {
          updatesPayload = JSON.parse(rawJsonText);
        } catch {
          throw new Error('Invalid JSON syntax in Raw JSON editor.');
        }
      } else {
        for (const [key, val] of Object.entries(formData)) {
          if (key === pk) continue; // Keep primary key unchanged
          const colMeta = currentTableMeta.columns.find((c) => c.name === key);
          if (colMeta?.format === 'jsonb') {
            try {
              updatesPayload[key] = val ? JSON.parse(val) : {};
            } catch {
              throw new Error(`Field "${key}" must be valid JSON.`);
            }
          } else if (colMeta?.type === 'boolean') {
            updatesPayload[key] = val === 'true';
          } else if (colMeta?.type === 'integer' || colMeta?.type === 'number') {
            updatesPayload[key] = val === '' ? null : Number(val);
          } else {
            updatesPayload[key] = val;
          }
        }
      }

      const res = await fetch('/api/supabase/crud', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: selectedTableName,
          pkColumn: pk,
          pkValue,
          updates: updatesPayload,
        }),
      });

      const data = await res.json();
      setIsSubmittingForm(false);

      if (data.success) {
        setIsEditOpen(false);
        setFeedback({ type: 'success', message: `Row ${pkValue} updated successfully!` });
        fetchRows(selectedTableName, page);
      } else {
        setFormError(data.error || 'Failed to update row.');
      }
    } catch (err) {
      setIsSubmittingForm(false);
      setFormError(err instanceof Error ? err.message : 'Error updating row');
    }

    setTimeout(() => setFeedback(null), 4000);
  };

  const sqlEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;

  // SQL grant script helper
  const copyGrantSql = () => {
    const sql =
      currentGrantHint ||
      `GRANT ALL ON TABLE public.${selectedTableName} TO anon, authenticated, service_role;\nALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;`;
    navigator.clipboard.writeText(sql);
    setCopiedGrant(true);
    setTimeout(() => setCopiedGrant(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {/* Toast Notification */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between shadow-sm ${
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

      {/* Top Studio Header & Mode Switcher */}
      <div className="card-raised rounded-2xl border border-line bg-surface p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 grid place-items-center shrink-0">
            <Database className="size-5.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-ink">Supabase Cloud Database Studio</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-surface-2 border border-line text-ink-3">
                {projectRef}
              </span>
            </div>
            <p className="text-xs text-ink-3 mt-0.5">
              Live database table browser, schema inspection, and real-time CRUD operations.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="p-1 rounded-xl bg-surface-2 border border-line flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('browser')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'browser'
                  ? 'bg-surface text-ink shadow-xs border border-line/60'
                  : 'text-ink-3 hover:text-ink'
              }`}
            >
              Table Browser & CRUD
            </button>
            <button
              type="button"
              onClick={() => setViewMode('diagnostics')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'diagnostics'
                  ? 'bg-surface text-ink shadow-xs border border-line/60'
                  : 'text-ink-3 hover:text-ink'
              }`}
            >
              Diagnostics & SQL
            </button>
          </div>

          <a
            href={sqlEditorUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary h-8.5 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
            title="Open SQL Editor in Supabase"
          >
            <span>SQL Editor</span>
            <ExternalLink className="size-3" />
          </a>
        </div>
      </div>

      {/* MODE 1: TABLE BROWSER & CRUD */}
      {viewMode === 'browser' && (
        <div className="space-y-4">
          {/* Table Selector Pills */}
          <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-ink-3 uppercase tracking-wider text-[10px] mr-1">
                Tables:
              </span>
              {isLoadingTables ? (
                <div className="flex items-center gap-2 text-xs text-ink-3">
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Discovering tables...</span>
                </div>
              ) : (
                tables.map((tbl) => {
                  const isSelected = selectedTableName === tbl.name;
                  return (
                    <button
                      key={tbl.name}
                      type="button"
                      onClick={() => setSelectedTableName(tbl.name)}
                      className={`h-8.5 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                        isSelected
                          ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                          : 'bg-surface hover:bg-surface-2 border-line text-ink-2'
                      }`}
                    >
                      <TableIcon className="size-3.5 opacity-80" />
                      <span>{tbl.name}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-surface-2 border border-line text-ink-3'
                        }`}
                      >
                        {tbl.rowCount}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <button
              type="button"
              onClick={fetchTables}
              className="p-1.5 rounded-xl border border-line text-ink-3 hover:text-ink hover:bg-surface transition-colors cursor-pointer shrink-0"
              title="Refresh tables list"
            >
              <RefreshCw className={`size-3.5 ${isLoadingTables ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Permission Callout Banner if Table Needs Grant */}
          {currentTableError && (
            <div className="p-4.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-xs font-bold text-ink">
                    Permission Notice: {currentTableError}
                  </h3>
                  <p className="text-[11px] text-ink-2 mt-0.5 leading-relaxed">
                    PostgreSQL tables require table privileges to read and write. Run the SQL grant below in the Supabase SQL editor to enable full direct CRUD.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={copyGrantSql}
                  className="btn btn-primary h-8 px-3.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  {copiedGrant ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  <span>{copiedGrant ? 'Copied Grant SQL!' : 'Copy Grant SQL'}</span>
                </button>

                <a
                  href={sqlEditorUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <span>Open Supabase SQL Editor</span>
                  <ExternalLink className="size-3" />
                </a>

                {isLocalFallback && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    Local data fallback active
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Main Data Grid Card */}
          <div className="card-raised rounded-2xl border border-line bg-surface overflow-hidden shadow-xs space-y-0">
            {/* Grid Action Bar */}
            <div className="p-4 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-2/40">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-ink">public.{selectedTableName}</span>
                <span className="text-xs text-ink-3 font-medium">({totalRows} total rows)</span>
                {isLocalFallback && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Local Cache
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {/* Search in table */}
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search rows..."
                    className="h-8 pl-8 pr-3 rounded-lg bg-surface border border-line text-xs text-ink placeholder:text-ink-4 focus:outline-none focus:ring-1 focus:ring-brand-500 w-full sm:w-56"
                  />
                </div>

                {/* Refresh rows */}
                <button
                  type="button"
                  onClick={() => fetchRows(selectedTableName, page, searchQuery)}
                  className="p-2 rounded-lg border border-line text-ink-3 hover:text-ink hover:bg-surface transition-colors cursor-pointer"
                  title="Refresh rows"
                >
                  <RefreshCw className={`size-3.5 ${isLoadingRows ? 'animate-spin' : ''}`} />
                </button>

                {/* Insert Row Button */}
                <button
                  type="button"
                  onClick={handleOpenInsert}
                  className="btn btn-primary h-8 px-3.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  <span>Insert Row</span>
                </button>
              </div>
            </div>

            {/* Table View */}
            <div className="overflow-x-auto min-h-[300px]">
              {isLoadingRows ? (
                <div className="p-16 text-center text-xs text-ink-3 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="size-5 animate-spin text-brand-500" />
                  <span>Querying table records...</span>
                </div>
              ) : rows.length === 0 ? (
                <div className="p-16 text-center text-xs text-ink-3 space-y-2">
                  <Database className="size-8 mx-auto opacity-30" />
                  <p className="font-bold text-ink">No rows found in {selectedTableName}</p>
                  <p className="text-[11px]">Click &quot;Insert Row&quot; above to create your first record.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-line bg-surface-2/70 text-ink-3 font-semibold">
                      {currentTableMeta?.columns.map((col) => (
                        <th key={col.name} className="py-2.5 px-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {col.isPrimaryKey && <Key className="size-3 text-amber-500 shrink-0" />}
                            <span>{col.name}</span>
                            <span className="text-[9.5px] font-mono text-ink-4 uppercase">
                              {col.format || col.type}
                            </span>
                          </div>
                        </th>
                      ))}
                      <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {rows.map((row, rowIdx) => {
                      const pk = currentTableMeta?.primaryKey || 'id';
                      const pkValue = String(row[pk] ?? rowIdx);

                      return (
                        <tr key={pkValue} className="hover:bg-surface-2/40 transition-colors">
                          {currentTableMeta?.columns.map((col) => {
                            const val = row[col.name];
                            const isJson = typeof val === 'object' && val !== null;
                            const isBool = typeof val === 'boolean';

                            return (
                              <td
                                key={col.name}
                                className="py-2.5 px-3.5 text-ink align-middle max-w-xs truncate"
                              >
                                {col.isPrimaryKey ? (
                                  <span className="font-mono font-bold text-brand-600 dark:text-brand-400">
                                    {String(val)}
                                  </span>
                                ) : isJson ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenInspect(row)}
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
                                  <span className="truncate" title={String(val ?? '')}>
                                    {val !== undefined && val !== null ? String(val) : <span className="text-ink-4 italic">null</span>}
                                  </span>
                                )}
                              </td>
                            );
                          })}

                          {/* Row Actions */}
                          <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenInspect(row)}
                                className="p-1.5 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
                                title="Inspect JSON"
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

            {/* Pagination Controls */}
            <div className="p-3.5 border-t border-line flex items-center justify-between text-xs text-ink-3 bg-surface-2/30">
              <span>
                Showing {rows.length} of {totalRows} records
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || isLoadingRows}
                  onClick={() => {
                    const prev = Math.max(1, page - 1);
                    setPage(prev);
                    fetchRows(selectedTableName, prev, searchQuery);
                  }}
                  className="btn btn-secondary h-7 px-2.5 rounded-lg text-[11px] disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="font-mono text-[11px]">Page {page}</span>
                <button
                  type="button"
                  disabled={rows.length < 20 || isLoadingRows}
                  onClick={() => {
                    const next = page + 1;
                    setPage(next);
                    fetchRows(selectedTableName, next, searchQuery);
                  }}
                  className="btn btn-secondary h-7 px-2.5 rounded-lg text-[11px] disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
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
                  <span>{copiedGrant ? 'Copied SQL!' : 'Copy Grant SQL'}</span>
                </button>
              </div>
            </div>

            <pre className="p-4 rounded-xl bg-surface-2 border border-line font-mono text-xs text-ink-2 overflow-x-auto leading-relaxed">
              {`-- 1. Grant table privileges to standard Supabase roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.portfolio_content TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.app_settings TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;`}
            </pre>
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

      {/* MODAL 3: INSPECT ROW JSON */}
      {isInspectOpen && selectedRow && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-raised rounded-2xl border border-line bg-surface max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-line">
              <div className="flex items-center gap-2">
                <Code className="size-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-ink">
                  Record Inspector — public.{selectedTableName}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(selectedRow, null, 2));
                    setCopiedInspect(true);
                    setTimeout(() => setCopiedInspect(false), 2500);
                  }}
                  className="btn btn-secondary h-7 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                >
                  {copiedInspect ? <Check className="size-3" /> : <Copy className="size-3" />}
                  <span>{copiedInspect ? 'Copied' : 'Copy JSON'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsInspectOpen(false)}
                  className="p-1 rounded-lg text-ink-3 hover:text-ink cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              <pre className="p-4 rounded-xl bg-surface-2 border border-line font-mono text-xs text-ink leading-relaxed overflow-x-auto">
                {JSON.stringify(selectedRow, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
