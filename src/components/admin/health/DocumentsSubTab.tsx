'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import {
  FileText,
  Upload,
  Camera,
  Search,
  Trash2,
  ExternalLink,
  Eye,
  X,
  HardDrive,
  Calendar,
  User,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Grid,
  List,
  FileCheck,
  Stethoscope,
  Activity,
  Shield,
  File,
} from 'lucide-react';
import {
  HealthDocument,
  HealthDocumentCategory,
  HealthStorageUsage,
} from '@/types/health';
import { confirmModal } from '@/components/ui/ConfirmDialog';

interface DocumentsSubTabProps {
  documents: HealthDocument[];
  storageUsage: HealthStorageUsage;
  onRefreshData: () => Promise<void>;
  showToast: (msg: string) => void;
  disabled?: boolean;
}

const CATEGORY_CONFIG: Record<
  HealthDocumentCategory,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  prescription: {
    label: 'Prescriptions',
    icon: FileCheck,
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  },
  lab: {
    label: 'Lab Reports',
    icon: Activity,
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  },
  imaging: {
    label: 'Imaging & X-Ray',
    icon: Stethoscope,
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  },
  vaccination: {
    label: 'Vaccinations',
    icon: Shield,
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  },
  insurance: {
    label: 'Insurance & Claims',
    icon: FileText,
    color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
  },
  other: {
    label: 'Other Records',
    icon: File,
    color: 'text-neutral-400 bg-neutral-500/10 border-neutral-500/20',
  },
};

export const DocumentsSubTab: React.FC<DocumentsSubTabProps> = ({
  documents,
  storageUsage,
  onRefreshData,
  showToast,
  disabled = false,
}) => {
  const { session } = useAdminAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressedFileBlob, setCompressedFileBlob] = useState<Blob | null>(null);
  const [compressionStats, setCompressionStats] = useState<{
    original: number;
    compressed: number;
  } | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Upload metadata form
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadCategory, setUploadCategory] = useState<HealthDocumentCategory>('prescription');
  const [uploadDate, setUploadDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [uploadDoctor, setUploadDoctor] = useState<string>('');
  const [uploadNotes, setUploadNotes] = useState<string>('');

  // Preview modal state
  const [previewDoc, setPreviewDoc] = useState<HealthDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Read view mode preference
  useEffect(() => {
    try {
      const stored = localStorage.getItem('admin_health_doc_view') as 'grid' | 'list' | null;
      if (stored === 'grid' || stored === 'list') {
        setViewMode(stored);
      }
    } catch {
      // safe fallback
    }
  }, []);

  const handleSetViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    try {
      localStorage.setItem('admin_health_doc_view', mode);
    } catch {
      // safe fallback
    }
  };

  // Process & compress chosen file
  const handleFileChosen = async (file: File) => {
    if (file.size > 5 * 1024 * 1024 && !file.type.startsWith('image/')) {
      showToast('✕ PDF files cannot exceed 5MB limit');
      return;
    }

    setSelectedFile(file);
    setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));

    if (file.type.startsWith('image/')) {
      setIsCompressing(true);
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const MAX_DIM = 1600;
            let { width, height } = img;
            if (width > MAX_DIM || height > MAX_DIM) {
              if (width > height) {
                height = Math.round((height * MAX_DIM) / width);
                width = MAX_DIM;
              } else {
                width = Math.round((width * MAX_DIM) / height);
                height = MAX_DIM;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, width, height);
              ctx.drawImage(img, 0, 0, width, height);

              canvas.toBlob(
                (blob) => {
                  if (blob) {
                    setCompressedFileBlob(blob);
                    setCompressionStats({
                      original: file.size,
                      compressed: blob.size,
                    });
                  }
                  setIsCompressing(false);
                },
                'image/jpeg',
                0.7
              );
            } else {
              setIsCompressing(false);
            }
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      } catch {
        setIsCompressing(false);
        setCompressedFileBlob(file);
      }
    } else {
      setCompressedFileBlob(file);
      setCompressionStats(null);
    }

    setIsUploadModalOpen(true);
  };

  // Perform upload
  const handleUploadSubmit = async () => {
    if (disabled) return;
    if (!selectedFile || !compressedFileBlob) {
      showToast('✕ No file selected');
      return;
    }

    if (compressedFileBlob.size > 5 * 1024 * 1024) {
      showToast('✕ File exceeds 5MB limit');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      const ext = selectedFile.type === 'application/pdf' ? 'pdf' : 'jpg';
      formData.append('file', compressedFileBlob, `document.${ext}`);
      formData.append('title', uploadTitle.trim() || selectedFile.name);
      formData.append('category', uploadCategory);
      formData.append('date', uploadDate);
      formData.append('doctor', uploadDoctor.trim());
      formData.append('notes', uploadNotes.trim());

      const res = await fetch('/api/admin/health/upload', {
        method: 'POST',
        headers: {
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Upload failed');
      }

      showToast('✓ Document encrypted and saved');
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setCompressedFileBlob(null);
      setCompressionStats(null);
      await onRefreshData();
    } catch {
      showToast('✕ Save failed, retry');
    } finally {
      setIsUploading(false);
    }
  };

  // Open Preview with 60s Signed URL
  const handleOpenPreview = async (doc: HealthDocument) => {
    setPreviewDoc(doc);
    setPreviewUrl(null);
    setIsLoadingPreview(true);
    try {
      const res = await fetch(`/api/admin/health/file?id=${doc.id}`, {
        headers: {
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
      });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error();
      setPreviewUrl(json.url);
    } catch {
      showToast('✕ Failed to generate secure preview URL');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Delete Document
  const handleDeleteDocument = async (doc: HealthDocument) => {
    if (disabled) return;
    const ok = await confirmModal({
      title: 'Delete Confidential Document',
      message: `Permanently delete confidential document "${doc.title}"? This will delete the file from private storage.`,
      confirmText: 'Delete Document',
      type: 'danger',
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/health/file?id=${doc.id}`, {
        method: 'DELETE',
        headers: {
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
      });
      if (!res.ok) throw new Error();
      showToast('✓ Document deleted from private storage');
      if (previewDoc?.id === doc.id) {
        setPreviewDoc(null);
      }
      await onRefreshData();
    } catch {
      showToast('✕ Failed to delete document');
    }
  };

  // Filtered & sorted documents
  const filteredDocuments = useMemo(() => {
    return documents
      .filter((doc) => {
        if (selectedCategory !== 'all' && doc.category !== selectedCategory) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = doc.title.toLowerCase().includes(q);
          const matchesDoctor = doc.doctor?.toLowerCase().includes(q);
          const matchesNotes = doc.notes?.toLowerCase().includes(q);
          if (!matchesTitle && !matchesDoctor && !matchesNotes) return false;
        }
        return true;
      })
      .sort((a, b) => {
        return sortOrder === 'desc'
          ? b.date.localeCompare(a.date)
          : a.date.localeCompare(b.date);
      });
  }, [documents, selectedCategory, searchQuery, sortOrder]);

  // Storage calculation
  const usedMB = (storageUsage.totalBytes / (1024 * 1024)).toFixed(1);
  const percentage = Math.min(
    100,
    Math.round((storageUsage.totalBytes / storageUsage.limitBytes) * 100)
  );

  const meterColor =
    percentage >= 90
      ? 'bg-rose-500'
      : percentage >= 70
        ? 'bg-amber-500'
        : 'bg-emerald-500';

  return (
    <div className="space-y-5">
      {/* 1. Storage Usage Meter Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-surface/80 border border-line space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <HardDrive className="size-4 text-emerald-500" />
            <span className="font-bold text-ink">Private Supabase Storage Quota</span>
            <span className="text-ink-4">({storageUsage.fileCount} encrypted files)</span>
          </div>
          <div className="font-mono text-ink-3">
            <span className="font-bold text-ink">{usedMB} MB</span>
            <span> / 1,024 MB ({percentage}% used)</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-surface-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${meterColor}`}
            style={{ width: `${Math.max(percentage, 1)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-ink-4">
          <span>Client-side compressed · Stripped EXIF · 5MB file cap</span>
          {percentage >= 90 && (
            <span className="text-rose-500 font-bold flex items-center gap-1">
              <AlertCircle className="size-3" /> Storage quota nearly full
            </span>
          )}
        </div>
      </div>

      {/* 2. Controls Toolbar: Category chips, Search, View switch, Upload */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Category Chips Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 [scrollbar-width:none]">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-surface text-ink border border-line shadow-xs font-bold'
                  : 'text-ink-3 hover:text-ink hover:bg-surface-2'
              }`}
            >
              <span>All ({documents.length})</span>
            </button>

            {(Object.keys(CATEGORY_CONFIG) as HealthDocumentCategory[]).map((catKey) => {
              const cfg = CATEGORY_CONFIG[catKey];
              const count = documents.filter((d) => d.category === catKey).length;
              const isSelected = selectedCategory === catKey;
              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setSelectedCategory(catKey)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-surface text-ink border border-line shadow-xs font-bold'
                      : 'text-ink-3 hover:text-ink hover:bg-surface-2'
                  }`}
                >
                  <span>{cfg.label}</span>
                  {count > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-surface-3 text-ink-4">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Action Buttons: Camera & Upload */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Hidden native inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileChosen(file);
                e.target.value = '';
              }}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileChosen(file);
                e.target.value = '';
              }}
            />

            {/* Mobile Camera Snapshot */}
            <button
              type="button"
              onClick={() => {
                if (disabled) return;
                cameraInputRef.current?.click();
              }}
              disabled={disabled}
              className="btn btn-secondary size-8.5 grid place-items-center rounded-xl text-ink-2 hover:text-ink cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Capture prescription with camera"
            >
              <Camera className="size-4" />
            </button>

            {/* Upload File */}
            <button
              type="button"
              onClick={() => {
                if (disabled) return;
                fileInputRef.current?.click();
              }}
              disabled={disabled}
              className="btn btn-primary h-8.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="size-3.5" />
              <span>Upload Document</span>
            </button>
          </div>
        </div>

        {/* Search & Layout Toggles */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
            <input
              type="text"
              placeholder="Search documents, doctor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-xl border border-line bg-surface text-xs text-ink placeholder:text-ink-4 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Date sort toggle */}
            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
              className="btn btn-secondary h-8 px-2.5 rounded-xl text-xs text-ink-3 hover:text-ink cursor-pointer flex items-center gap-1"
            >
              <Calendar className="size-3 text-ink-4" />
              <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
            </button>

            {/* View Mode (Grid vs List) */}
            <div className="inline-flex p-0.5 bg-surface-2 border border-line rounded-xl">
              <button
                type="button"
                onClick={() => handleSetViewMode('grid')}
                className={`p-1.5 rounded-lg cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-surface text-ink shadow-2xs'
                    : 'text-ink-4 hover:text-ink'
                }`}
                title="Grid view"
              >
                <Grid className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleSetViewMode('list')}
                className={`p-1.5 rounded-lg cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-surface text-ink shadow-2xs'
                    : 'text-ink-4 hover:text-ink'
                }`}
                title="List view"
              >
                <List className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Document Cards (Grid or List) */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredDocuments.map((doc) => {
            const catCfg = CATEGORY_CONFIG[doc.category] || CATEGORY_CONFIG.other;
            const Icon = catCfg.icon;
            const sizeKB = Math.round(doc.sizeBytes / 1024);

            return (
              <div
                key={doc.id}
                className="p-4 rounded-2xl bg-surface/80 border border-line hover:border-brand-500/40 shadow-xs transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  {/* Category icon & date */}
                  <div className="flex items-center justify-between">
                    <div
                      className={`size-8 rounded-xl flex items-center justify-center border ${catCfg.color}`}
                    >
                      <Icon className="size-4" />
                    </div>
                    <span className="text-[11px] font-mono text-ink-4">{doc.date}</span>
                  </div>

                  {/* Title & metadata */}
                  <div>
                    <h4 className="text-xs font-bold text-ink line-clamp-1" title={doc.title}>
                      {doc.title}
                    </h4>
                    {doc.doctor && (
                      <p className="text-[11px] text-ink-3 flex items-center gap-1 mt-0.5 truncate">
                        <User className="size-3 text-ink-4 shrink-0" />
                        <span>Dr. {doc.doctor}</span>
                      </p>
                    )}
                  </div>

                  {doc.notes && (
                    <p className="text-[11px] text-ink-4 line-clamp-2 italic bg-surface-2/40 p-1.5 rounded-lg">
                      {doc.notes}
                    </p>
                  )}
                </div>

                {/* Footer: Size & Actions */}
                <div className="pt-2 border-t border-line/60 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-mono text-ink-4">
                    {sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`} ·{' '}
                    {doc.mimeType === 'application/pdf' ? 'PDF' : 'IMG'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenPreview(doc)}
                      className="btn btn-secondary size-7 grid place-items-center rounded-lg text-ink-3 hover:text-ink cursor-pointer"
                      title="View encrypted document"
                    >
                      <Eye className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(doc)}
                      disabled={disabled}
                      className="btn btn-secondary size-7 grid place-items-center rounded-lg text-ink-3 hover:text-rose-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete document"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredDocuments.length === 0 && (
            <div className="col-span-full py-16 text-center rounded-2xl bg-surface-2/30 border border-line">
              <FileText className="size-8 text-ink-4 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-bold text-ink">No medical documents found</p>
              <p className="text-[11px] text-ink-3 mt-0.5">
                Upload prescriptions, blood test results, or doctor notes
              </p>
            </div>
          )}
        </div>
      ) : (
        /* List View */
        <div className="border border-line rounded-2xl bg-surface/80 divide-y divide-line overflow-hidden">
          {filteredDocuments.map((doc) => {
            const catCfg = CATEGORY_CONFIG[doc.category] || CATEGORY_CONFIG.other;
            const Icon = catCfg.icon;
            const sizeKB = Math.round(doc.sizeBytes / 1024);

            return (
              <div
                key={doc.id}
                className="p-3 sm:px-4 flex items-center justify-between gap-3 text-xs hover:bg-surface-2/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`size-8 rounded-xl flex items-center justify-center border shrink-0 ${catCfg.color}`}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-ink truncate">{doc.title}</div>
                    <div className="text-[11px] text-ink-3 flex items-center gap-2 mt-0.5">
                      <span className="font-mono">{doc.date}</span>
                      {doc.doctor && <span>· Dr. {doc.doctor}</span>}
                      <span>· {catCfg.label}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] font-mono text-ink-4 hidden md:inline">
                    {sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenPreview(doc)}
                    className="btn btn-secondary size-7 grid place-items-center rounded-lg text-ink-3 hover:text-ink cursor-pointer"
                    title="View encrypted document"
                  >
                    <Eye className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteDocument(doc)}
                    disabled={disabled}
                    className="btn btn-secondary size-7 grid place-items-center rounded-lg text-ink-3 hover:text-rose-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete document"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredDocuments.length === 0 && (
            <div className="py-12 text-center text-xs text-ink-3 italic">
              No matching documents in this view
            </div>
          )}
        </div>
      )}

      {/* 4. Upload & Compression Metadata Dialog */}
      {isUploadModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => {
            if (!isUploading) setIsUploadModalOpen(false);
          }}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-surface border border-line p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <Upload className="size-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-ink">Upload Medical Record</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                disabled={isUploading}
                className="size-7 grid place-items-center rounded-lg text-ink-4 hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Compression Stats Notification */}
            {isCompressing ? (
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2">
                <Loader2 className="size-3.5 animate-spin" />
                <span>Compressing photo and stripping EXIF metadata...</span>
              </div>
            ) : compressionStats ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                  <span>Client-Side Canvas Compression Complete</span>
                </div>
                <div className="text-[11px] font-mono text-ink-3 flex items-center gap-3">
                  <span>
                    Original: {(compressionStats.original / 1024).toFixed(0)} KB
                  </span>
                  <span>→</span>
                  <span className="font-bold text-emerald-500">
                    Compressed: {(compressionStats.compressed / 1024).toFixed(0)} KB
                  </span>
                  <span>
                    (
                    {Math.round(
                      ((compressionStats.original - compressionStats.compressed) /
                        compressionStats.original) *
                        100
                    )}
                    % saved)
                  </span>
                </div>
              </div>
            ) : null}

            {/* Metadata Fields */}
            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-ink">Document Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Annual Blood Chemistry, Dental X-Ray"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full h-8.5 px-3 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-ink">Category *</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) =>
                      setUploadCategory(e.target.value as HealthDocumentCategory)
                    }
                    className="w-full h-8.5 px-2 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden"
                  >
                    <option value="prescription">Prescription</option>
                    <option value="lab">Lab Report</option>
                    <option value="imaging">Imaging / X-Ray</option>
                    <option value="vaccination">Vaccination</option>
                    <option value="insurance">Insurance Document</option>
                    <option value="other">Other Record</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-ink">Date of Document</label>
                  <input
                    type="date"
                    value={uploadDate}
                    onChange={(e) => setUploadDate(e.target.value)}
                    className="w-full h-8.5 px-3 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-ink">Doctor / Provider (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Robert Chen"
                  value={uploadDoctor}
                  onChange={(e) => setUploadDoctor(e.target.value)}
                  className="w-full h-8.5 px-3 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-ink">Confidential Notes (optional)</label>
                <textarea
                  rows={2}
                  placeholder="Diagnosis, follow-up instructions..."
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-line bg-surface-2 text-xs text-ink placeholder:text-ink-4 focus:outline-hidden resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-line flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                disabled={isUploading}
                className="btn btn-secondary h-8.5 px-3 rounded-xl text-xs font-semibold text-ink-3 hover:text-ink cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUploadSubmit}
                disabled={isUploading || isCompressing || disabled}
                className="btn btn-primary h-8.5 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Encrypting & Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="size-3.5" />
                    <span>Save to Private Storage</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Document Preview Modal (60s signed URL) */}
      {previewDoc && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="w-full max-w-3xl h-[85vh] rounded-3xl bg-surface border border-line p-5 shadow-2xl flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-ink truncate">{previewDoc.title}</h3>
                <p className="text-[11px] text-ink-3 font-mono">
                  {previewDoc.date} · 60s signed access URL
                </p>
              </div>

              <div className="flex items-center gap-2">
                {previewUrl && (
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary h-8 px-2.5 rounded-xl text-xs text-ink-2 hover:text-ink inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="size-3.5" />
                    <span className="hidden sm:inline">Open Link</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="size-8 grid place-items-center rounded-xl text-ink-4 hover:text-ink hover:bg-surface-2"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Content view */}
            <div className="flex-1 my-3 bg-surface-2/60 rounded-2xl border border-line overflow-hidden flex items-center justify-center p-2 relative">
              {isLoadingPreview ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="size-6 text-emerald-500 animate-spin" />
                  <span className="text-xs text-ink-3">Generating secure signed URL...</span>
                </div>
              ) : previewUrl ? (
                previewDoc.mimeType === 'application/pdf' ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-full rounded-xl border-0"
                    title={previewDoc.title}
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={previewUrl}
                    alt={previewDoc.title}
                    className="max-w-full max-h-full object-contain rounded-xl shadow-lg"
                  />
                )
              ) : (
                <div className="text-xs text-rose-500">Failed to render preview</div>
              )}
            </div>

            {/* Footer with Delete and Details */}
            <div className="pt-2 border-t border-line flex items-center justify-between text-xs">
              <span className="text-ink-4 text-[11px]">
                Doctor: {previewDoc.doctor || 'None'} · Size:{' '}
                {Math.round(previewDoc.sizeBytes / 1024)} KB
              </span>
              <button
                type="button"
                onClick={() => handleDeleteDocument(previewDoc)}
                disabled={disabled}
                className="btn btn-secondary h-8 px-3 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="size-3.5" />
                <span>Delete Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
