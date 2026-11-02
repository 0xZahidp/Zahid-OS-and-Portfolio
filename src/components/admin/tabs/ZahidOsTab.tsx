'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Link2,
  Plus,
  Search,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Edit3,
  Power,
  RotateCw,
  QrCode,
  Flame,
  ArrowUpRight,
  FileCode,
  Clock,
  Radio,
  X,
  Shuffle,
} from 'lucide-react';
import { ShortLink } from '@/types/os';

export const ZahidOsTab: React.FC = () => {
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'inactive'>('all');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Active OS sub-tool
  const [activeTool, setActiveTool] = useState<'shortener' | 'qr' | 'scratchpad'>('shortener');

  // Modal / Editor state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOriginalUrl, setFormOriginalUrl] = useState<string>('');
  const [formSlug, setFormSlug] = useState<string>('');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // QR Modal
  const [qrTarget, setQrTarget] = useState<ShortLink | null>(null);

  // Delete Confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Scratchpad state
  const [scratchpadNote, setScratchpadNote] = useState<string>('');
  const [scratchpadSaved, setScratchpadSaved] = useState<boolean>(false);

  // Fetch short links
  const fetchLinks = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/os/short-links');
      if (res.ok) {
        const data = await res.json();
        setLinks(data.links || []);
      }
    } catch (err) {
      console.warn('Failed to load short links:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
    if (typeof window !== 'undefined') {
      const savedNote = localStorage.getItem('zahid_os_scratchpad') || '';
      setScratchpadNote(savedNote);
    }
  }, []);

  const handleSaveScratchpad = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('zahid_os_scratchpad', scratchpadNote);
      setScratchpadSaved(true);
      setTimeout(() => setScratchpadSaved(false), 2500);
    }
  };

  // Base URL for short link presentation
  const currentOrigin =
    typeof window !== 'undefined' ? window.location.origin : 'https://0xZahidP.com';

  // Compute stats
  const totalClicks = useMemo(
    () => links.reduce((acc, l) => acc + (l.clicks || 0), 0),
    [links]
  );
  const activeCount = useMemo(
    () => links.filter((l) => l.is_active !== false).length,
    [links]
  );
  const topLink = useMemo(() => {
    if (links.length === 0) return null;
    return [...links].sort((a, b) => (b.clicks || 0) - (a.clicks || 0))[0];
  }, [links]);

  // Filter links
  const filteredLinks = useMemo(() => {
    return links.filter((link) => {
      // Status filter
      if (filterMode === 'active' && !link.is_active) return false;
      if (filterMode === 'inactive' && link.is_active) return false;

      // Query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        link.slug.toLowerCase().includes(q) ||
        link.title.toLowerCase().includes(q) ||
        link.original_url.toLowerCase().includes(q) ||
        (link.description && link.description.toLowerCase().includes(q))
      );
    });
  }, [links, filterMode, searchQuery]);

  // Generate a random slug
  const handleRandomSlug = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let res = '';
    for (let i = 0; i < 5; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormSlug(res);
  };

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormOriginalUrl('');
    setFormSlug('');
    setFormTitle('');
    setFormDescription('');
    setFormIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (link: ShortLink) => {
    setEditingId(link.id);
    setFormOriginalUrl(link.original_url);
    setFormSlug(link.slug);
    setFormTitle(link.title);
    setFormDescription(link.description || '');
    setFormIsActive(link.is_active !== false);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Submit short link form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formOriginalUrl.trim()) {
      setFormError('Destination URL is required.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch('/api/os/short-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId || undefined,
          slug: formSlug.trim() || undefined,
          original_url: formOriginalUrl.trim(),
          title: formTitle.trim() || formSlug.trim() || 'Link',
          description: formDescription.trim(),
          is_active: formIsActive,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error || 'Failed to save short link.');
        setIsSubmitting(false);
        return;
      }

      setLinks(data.links || []);
      setIsModalOpen(false);
      setIsSubmitting(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Network error saving link');
      setIsSubmitting(false);
    }
  };

  // Toggle active state
  const handleToggleActive = async (link: ShortLink) => {
    try {
      const newStatus = !link.is_active;
      // Optimistic update
      setLinks((prev) =>
        prev.map((l) => (l.id === link.id ? { ...l, is_active: newStatus } : l))
      );

      const res = await fetch('/api/os/short-links', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: link.id, is_active: newStatus }),
      });

      if (!res.ok) {
        // Revert on error
        fetchLinks();
      }
    } catch {
      fetchLinks();
    }
  };

  // Delete link
  const handleDeleteLink = async (id: string) => {
    try {
      setLinks((prev) => prev.filter((l) => l.id !== id));
      setDeletingId(null);

      await fetch(`/api/os/short-links?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Failed to delete short link:', err);
      fetchLinks();
    }
  };

  // Copy short link to clipboard
  const handleCopyLink = (slug: string) => {
    const fullUrl = `${currentOrigin}/s/${slug}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Futuristic Zahid OS Header Ribbon */}
      <div className="relative rounded-3xl border border-line bg-gradient-to-r from-surface to-surface-2 p-6 sm:p-7 shadow-xl overflow-hidden">
        {/* Ambient glow in background */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <Radio className="size-3 animate-pulse text-emerald-500" />
                <span>Zahid OS • v1.0 Kernel</span>
              </span>
              <span className="text-xs font-mono text-ink-3">Modular Micro-Apps</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink flex items-center gap-2.5">
              <span>Zahid OS Tools Hub</span>
            </h1>
            <p className="mt-1 text-xs text-ink-3 max-w-xl leading-relaxed">
              Personal cloud utilities, URL routing engine, and productive OS tools designed for 0xZahidP.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="h-10 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-md shadow-brand-500/20 cursor-pointer"
            >
              <Plus className="size-4" />
              <span>New Short Link</span>
            </button>
            <button
              type="button"
              onClick={fetchLinks}
              title="Refresh Links"
              className="size-10 rounded-xl border border-line bg-surface hover:bg-surface-2 text-ink-2 hover:text-ink grid place-items-center transition-colors cursor-pointer"
            >
              <RotateCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* OS Sub-Tools Switcher */}
        <div className="mt-6 pt-5 border-t border-line/60 flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTool('shortener')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTool === 'shortener'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-surface-2 hover:bg-surface text-ink-2 border border-line'
            }`}
          >
            <Link2 className="size-3.5" />
            <span>Link Shortener</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                activeTool === 'shortener' ? 'bg-white/20 text-white' : 'bg-surface text-ink-3'
              }`}
            >
              {links.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool('scratchpad')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTool === 'scratchpad'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-surface-2 hover:bg-surface text-ink-2 border border-line'
            }`}
          >
            <FileCode className="size-3.5" />
            <span>OS Scratchpad</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool('qr')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTool === 'qr'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-surface-2 hover:bg-surface text-ink-2 border border-line'
            }`}
          >
            <QrCode className="size-3.5" />
            <span>QR Studio</span>
          </button>
        </div>
      </div>

      {/* 2. Tool 1: Link Shortener View */}
      {activeTool === 'shortener' && (
        <div className="space-y-5">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="card-raised rounded-2xl border border-line bg-surface p-4">
              <span className="text-[11px] font-medium text-ink-3 block">Total Short Links</span>
              <span className="mt-1 text-2xl font-black text-ink block font-mono">
                {links.length}
              </span>
            </div>

            <div className="card-raised rounded-2xl border border-line bg-surface p-4">
              <span className="text-[11px] font-medium text-ink-3 block">Total Redirect Clicks</span>
              <div className="mt-1 flex items-center gap-1.5 text-2xl font-black text-brand-600 dark:text-brand-400 font-mono">
                <Flame className="size-5 text-amber-500 fill-amber-500" />
                <span>{totalClicks}</span>
              </div>
            </div>

            <div className="card-raised rounded-2xl border border-line bg-surface p-4">
              <span className="text-[11px] font-medium text-ink-3 block">Active Links</span>
              <span className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400 block font-mono">
                {activeCount}
              </span>
            </div>

            <div className="card-raised rounded-2xl border border-line bg-surface p-4">
              <span className="text-[11px] font-medium text-ink-3 block">Most Popular Link</span>
              <div className="mt-1 truncate">
                {topLink ? (
                  <span className="text-xs font-mono font-bold text-ink truncate block">
                    /s/{topLink.slug}{' '}
                    <span className="text-amber-500 font-normal">({topLink.clicks} clicks)</span>
                  </span>
                ) : (
                  <span className="text-xs text-ink-4">No data yet</span>
                )}
              </div>
            </div>
          </div>

          {/* Search, Filter & Action Bar */}
          <div className="card-raised rounded-2xl border border-line bg-surface p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-md">
              <Search className="size-4 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search short links by slug, title, or destination..."
                className="w-full h-9 pl-9 pr-3 rounded-xl border border-line bg-surface-2 focus:bg-surface focus:border-brand-500 text-xs text-ink placeholder:text-ink-4 outline-hidden transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-4 hover:text-ink"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold border border-brand-500/20'
                    : 'text-ink-3 hover:text-ink'
                }`}
              >
                All ({links.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  filterMode === 'active'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20'
                    : 'text-ink-3 hover:text-ink'
                }`}
              >
                Active ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('inactive')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  filterMode === 'inactive'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20'
                    : 'text-ink-3 hover:text-ink'
                }`}
              >
                Paused ({links.length - activeCount})
              </button>
            </div>
          </div>

          {/* Short Links List */}
          {isLoading && links.length === 0 ? (
            <div className="card-raised rounded-2xl border border-line bg-surface p-12 text-center text-ink-3 text-xs">
              <RotateCw className="size-5 animate-spin mx-auto mb-2 text-brand-500" />
              <span>Loading short links from Zahid OS storage...</span>
            </div>
          ) : filteredLinks.length === 0 ? (
            <div className="card-raised rounded-2xl border border-line bg-surface p-12 text-center">
              <Link2 className="size-10 text-ink-4 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-ink">No short links match your criteria</h3>
              <p className="mt-1 text-xs text-ink-3">
                {searchQuery ? 'Try another search keyword.' : 'Create your first short link with the button above!'}
              </p>
              {!searchQuery && (
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="mt-4 inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-brand-500 text-white font-semibold text-xs shadow-xs hover:bg-brand-600 transition-all cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  <span>Create Short Link</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLinks.map((link) => {
                const shortUrl = `${currentOrigin}/s/${link.slug}`;
                const isCopied = copiedSlug === link.slug;

                return (
                  <div
                    key={link.id}
                    className={`card-raised rounded-2xl border p-4 sm:p-5 transition-all ${
                      link.is_active !== false
                        ? 'border-line bg-surface hover:border-brand-500/30'
                        : 'border-line/60 bg-surface/50 opacity-75'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Link info & URLs */}
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="font-bold text-sm text-ink truncate">{link.title}</h3>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1 ${
                              link.is_active !== false
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            <span
                              className={`size-1.5 rounded-full ${
                                link.is_active !== false ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                            />
                            <span>{link.is_active !== false ? 'Active' : 'Paused'}</span>
                          </span>

                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-ink-3 bg-surface-2 px-2 py-0.5 rounded-md border border-line">
                            <Flame className="size-3 text-amber-500 fill-amber-500" />
                            <span>{link.clicks || 0} clicks</span>
                          </span>

                          {link.last_clicked_at && (
                            <span className="text-[10px] text-ink-4 flex items-center gap-1">
                              <Clock className="size-2.5" />
                              <span>
                                Last click: {new Date(link.last_clicked_at).toLocaleDateString()}
                              </span>
                            </span>
                          )}
                        </div>

                        {link.description && (
                          <p className="text-xs text-ink-3 line-clamp-1">{link.description}</p>
                        )}

                        {/* Short URL pill + Original URL */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
                          {/* Short link badge */}
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 font-mono text-xs font-semibold shrink-0">
                            <Link2 className="size-3.5" />
                            <span>{shortUrl}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyLink(link.slug)}
                              title="Copy short link"
                              className="ml-1 text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors cursor-pointer"
                            >
                              {isCopied ? (
                                <Check className="size-3 text-emerald-500" />
                              ) : (
                                <Copy className="size-3" />
                              )}
                            </button>
                            <a
                              href={`/s/${link.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Test redirect in new tab"
                              className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors cursor-pointer"
                            >
                              <ExternalLink className="size-3" />
                            </a>
                          </div>

                          {/* Destination URL */}
                          <div className="flex items-center gap-1 text-[11px] text-ink-3 truncate">
                            <ArrowUpRight className="size-3 shrink-0 text-ink-4" />
                            <a
                              href={link.original_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate hover:underline hover:text-ink transition-colors font-mono"
                            >
                              {link.original_url}
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end lg:self-center border-t lg:border-t-0 pt-2 lg:pt-0 w-full lg:w-auto justify-end border-line/60">
                        {/* QR Code button */}
                        <button
                          type="button"
                          onClick={() => setQrTarget(link)}
                          title="Generate QR Code"
                          className="size-8 rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink-3 hover:text-ink grid place-items-center transition-colors cursor-pointer"
                        >
                          <QrCode className="size-3.5" />
                        </button>

                        {/* Toggle active / pause */}
                        <button
                          type="button"
                          onClick={() => handleToggleActive(link)}
                          title={link.is_active !== false ? 'Pause link' : 'Activate link'}
                          className={`size-8 rounded-lg border transition-colors grid place-items-center cursor-pointer ${
                            link.is_active !== false
                              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                              : 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                          }`}
                        >
                          <Power className="size-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(link)}
                          title="Edit short link"
                          className="size-8 rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink-3 hover:text-ink grid place-items-center transition-colors cursor-pointer"
                        >
                          <Edit3 className="size-3.5" />
                        </button>

                        {/* Delete */}
                        {deletingId === link.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteLink(link.id)}
                              className="px-2 py-1 rounded-lg bg-rose-500 text-white text-[11px] font-semibold hover:bg-rose-600 transition-colors cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingId(null)}
                              className="size-7 rounded-lg border border-line text-ink-3 hover:text-ink text-[11px] grid place-items-center cursor-pointer"
                            >
                              <X className="size-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeletingId(link.id)}
                            title="Delete link"
                            className="size-8 rounded-lg border border-line bg-surface hover:bg-rose-500/10 text-ink-3 hover:text-rose-500 grid place-items-center transition-colors cursor-pointer"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. Tool 2: Scratchpad View */}
      {activeTool === 'scratchpad' && (
        <div className="card-raised rounded-3xl border border-line bg-surface p-6 sm:p-7 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-ink flex items-center gap-2">
                <FileCode className="size-4 text-brand-500" />
                <span>Zahid OS Scratchpad</span>
              </h2>
              <p className="text-xs text-ink-3">
                Quick thoughts, code snippets, and ephemeral notes saved locally in your browser.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSaveScratchpad}
              className="h-9 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              {scratchpadSaved ? <Check className="size-3.5" /> : null}
              <span>{scratchpadSaved ? 'Saved to Browser!' : 'Save Note'}</span>
            </button>
          </div>

          <textarea
            value={scratchpadNote}
            onChange={(e) => setScratchpadNote(e.target.value)}
            placeholder="Write notes, quick links, or scratch ideas here..."
            rows={14}
            className="w-full p-4 rounded-2xl border border-line bg-surface-2 focus:bg-surface focus:border-brand-500 text-xs font-mono text-ink placeholder:text-ink-4 outline-hidden transition-all shadow-inner leading-relaxed resize-y"
          />
        </div>
      )}

      {/* 4. Tool 3: QR Studio View */}
      {activeTool === 'qr' && (
        <div className="card-raised rounded-3xl border border-line bg-surface p-6 sm:p-7 space-y-5 shadow-xl">
          <div>
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <QrCode className="size-4 text-brand-500" />
              <span>QR Code Studio</span>
            </h2>
            <p className="text-xs text-ink-3">
              Generate instant scannable QR codes for your short links or custom web addresses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-ink-2">
                Select from Short Links or enter custom URL:
              </label>
              <div className="space-y-2">
                {links.slice(0, 5).map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setQrTarget(l)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      qrTarget?.id === l.id
                        ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold'
                        : 'border-line bg-surface hover:bg-surface-2 text-ink-2'
                    }`}
                  >
                    <div className="truncate">
                      <p className="text-xs font-bold truncate">{l.title}</p>
                      <p className="text-[11px] font-mono text-ink-3 truncate">/s/{l.slug}</p>
                    </div>
                    <ArrowUpRight className="size-4 shrink-0 text-ink-4" />
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-surface-2 border border-line flex flex-col items-center justify-center text-center">
              {qrTarget ? (
                <>
                  <div className="p-3 bg-white rounded-2xl shadow-md border border-neutral-200 mb-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                        `${currentOrigin}/s/${qrTarget.slug}`
                      )}`}
                      alt={`QR code for /s/${qrTarget.slug}`}
                      className="size-44 object-contain rounded-lg"
                    />
                  </div>
                  <p className="font-mono text-xs font-bold text-ink">
                    {currentOrigin}/s/{qrTarget.slug}
                  </p>
                  <p className="text-[11px] text-ink-3 mt-0.5 truncate max-w-xs">
                    Target: {qrTarget.original_url}
                  </p>

                  <a
                    href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
                      `${currentOrigin}/s/${qrTarget.slug}`
                    )}`}
                    download={`qr-${qrTarget.slug}.png`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-brand-500 text-white font-semibold text-xs shadow-xs hover:bg-brand-600 transition-all cursor-pointer"
                  >
                    <ExternalLink className="size-3.5" />
                    <span>Download High-Res QR</span>
                  </a>
                </>
              ) : (
                <div className="py-12 text-ink-3">
                  <QrCode className="size-12 mx-auto mb-2 text-ink-4 opacity-50" />
                  <p className="text-xs">Select any link on the left to preview its scannable QR code.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Create / Edit Short Link Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-raised rounded-3xl border border-line bg-surface p-6 sm:p-7 max-w-lg w-full shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-line mb-5">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 grid place-items-center">
                  <Link2 className="size-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-ink">
                    {editingId ? 'Edit Short Link' : 'Create New Short Link'}
                  </h3>
                  <p className="text-[11px] text-ink-3">
                    Instant redirection handled by Zahid OS URL Engine.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="size-7 rounded-lg hover:bg-surface-2 text-ink-3 hover:text-ink grid place-items-center cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Destination URL */}
              <div>
                <label className="block text-xs font-semibold text-ink-2 mb-1.5">
                  Destination URL <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formOriginalUrl}
                    onChange={(e) => setFormOriginalUrl(e.target.value)}
                    placeholder="https://github.com/0xZahidp/my-cool-project"
                    required
                    className="w-full h-10 px-3 rounded-xl border border-line bg-surface hover:bg-surface-2 focus:bg-surface focus:border-brand-500 text-xs font-mono text-ink placeholder:text-ink-4 outline-hidden transition-all shadow-xs"
                  />
                </div>
                <p className="mt-1 text-[11px] text-ink-4">
                  Where the visitor will be forwarded to.
                </p>
              </div>

              {/* Custom Slug with Randomize button */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-ink-2">
                    Short Slug / Code
                  </label>
                  <button
                    type="button"
                    onClick={handleRandomSlug}
                    className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Shuffle className="size-3" />
                    <span>Generate Random</span>
                  </button>
                </div>

                <div className="flex items-center">
                  <span className="h-10 px-3 rounded-l-xl border border-r-0 border-line bg-surface-2 text-ink-3 font-mono text-xs flex items-center shrink-0">
                    /s/
                  </span>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9\-_]/g, ''))}
                    placeholder="e.g. repo, cv, twitter (optional)"
                    className="w-full h-10 px-3 rounded-r-xl border border-line bg-surface hover:bg-surface-2 focus:bg-surface focus:border-brand-500 text-xs font-mono text-ink placeholder:text-ink-4 outline-hidden transition-all shadow-xs"
                  />
                </div>
                <p className="mt-1 text-[11px] text-ink-4">
                  Preview: <span className="font-mono text-ink-3">{currentOrigin}/s/{formSlug || '[auto-code]'}</span>
                </p>
              </div>

              {/* Title / Label */}
              <div>
                <label className="block text-xs font-semibold text-ink-2 mb-1.5">
                  Title or Friendly Name
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. My Open Source Repo"
                  className="w-full h-10 px-3 rounded-xl border border-line bg-surface hover:bg-surface-2 focus:bg-surface focus:border-brand-500 text-xs text-ink placeholder:text-ink-4 outline-hidden transition-all shadow-xs"
                />
              </div>

              {/* Description / Notes */}
              <div>
                <label className="block text-xs font-semibold text-ink-2 mb-1.5">
                  Notes / Description <span className="text-ink-4 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Short memo about this link..."
                  className="w-full h-10 px-3 rounded-xl border border-line bg-surface hover:bg-surface-2 focus:bg-surface focus:border-brand-500 text-xs text-ink placeholder:text-ink-4 outline-hidden transition-all shadow-xs"
                />
              </div>

              {/* Active Switch */}
              <div className="pt-2 flex items-center justify-between p-3 rounded-xl bg-surface-2 border border-line">
                <div>
                  <span className="text-xs font-semibold text-ink block">Enable Redirection</span>
                  <span className="text-[11px] text-ink-4 block">
                    When paused, visitors will see a friendly unavailable notice.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIsActive(!formIsActive)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    formIsActive ? 'bg-emerald-500' : 'bg-line-strong'
                  }`}
                >
                  <span
                    className={`size-4.5 rounded-full bg-white transition-transform absolute top-0.75 left-0.75 shadow-xs ${
                      formIsActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-10 px-4 rounded-xl border border-line hover:bg-surface-2 text-ink-3 hover:text-ink font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 px-5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition-all shadow-md shadow-brand-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingId ? 'Update Short Link' : 'Create Short Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Dedicated QR Code Modal (Quick View from Link card) */}
      {qrTarget && activeTool !== 'qr' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-raised rounded-3xl border border-line bg-surface p-6 sm:p-7 max-w-sm w-full shadow-2xl text-center space-y-4 relative">
            <button
              type="button"
              onClick={() => setQrTarget(null)}
              className="absolute top-4 right-4 size-7 rounded-lg hover:bg-surface-2 text-ink-3 hover:text-ink grid place-items-center cursor-pointer"
            >
              <X className="size-4" />
            </button>

            <div className="size-10 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 mx-auto grid place-items-center">
              <QrCode className="size-5" />
            </div>

            <div>
              <h3 className="font-bold text-sm text-ink">{qrTarget.title}</h3>
              <p className="text-[11px] font-mono text-brand-500 font-semibold mt-0.5">
                /s/{qrTarget.slug}
              </p>
            </div>

            <div className="p-3 bg-white rounded-2xl shadow-md border border-neutral-200 inline-block mx-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                  `${currentOrigin}/s/${qrTarget.slug}`
                )}`}
                alt={`QR code for /s/${qrTarget.slug}`}
                className="size-48 object-contain rounded-lg"
              />
            </div>

            <p className="text-[11px] text-ink-3 font-mono truncate px-2">
              {currentOrigin}/s/{qrTarget.slug}
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  handleCopyLink(qrTarget.slug);
                  setQrTarget(null);
                }}
                className="flex-1 h-9 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Copy className="size-3.5" />
                <span>Copy Link</span>
              </button>
              <button
                type="button"
                onClick={() => setQrTarget(null)}
                className="h-9 px-4 rounded-xl border border-line hover:bg-surface-2 text-ink-2 font-semibold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
