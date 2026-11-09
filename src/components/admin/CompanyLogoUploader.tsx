'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import {
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Link as LinkIcon,
  Sparkles,
} from 'lucide-react';
import { optimizeCompanyIcon, OptimizedImageResult } from '@/lib/image-optimizer';
import { DEFAULT_COMPANY_LOGO } from '@/lib/constants';

interface CompanyLogoUploaderProps {
  currentLogo: string;
  companyName: string;
  onLogoChange: (newLogoUrl: string) => void;
  label?: string;
  fallbackImage?: string;
}

export const CompanyLogoUploader: React.FC<CompanyLogoUploaderProps> = ({
  currentLogo,
  companyName,
  onLogoChange,
  label = 'Company Logo / Icon',
  fallbackImage = DEFAULT_COMPANY_LOGO,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationReport, setOptimizationReport] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleProcessFile = async (file: File) => {
    setIsOptimizing(true);
    setErrorMessage(null);
    setOptimizationReport(null);

    try {
      // 1. Client-side optimize to exact 64x64 square
      const result: OptimizedImageResult = await optimizeCompanyIcon(file, {
        targetWidth: 64,
        targetHeight: 64,
        format: file.type === 'image/svg+xml' ? 'image/png' : 'image/png',
      });

      // 2. Upload to server API /api/upload
      const safePrefix = label.toLowerCase().includes('project') ? 'project' : 'logo';
      const safeName = (companyName || 'item').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataUrl: result.dataUrl,
          filename: `${safePrefix}-${safeName}.png`,
        }),
      });

      let finalUrl = result.dataUrl;
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        if (uploadData.url) {
          finalUrl = uploadData.url;
        }
      }

      onLogoChange(finalUrl);

      const origKb = Math.round(result.originalSize / 1024);
      const optKb = Math.max(1, Math.round(result.optimizedSize / 1024));
      setOptimizationReport(
        `Auto-optimized from ${result.originalWidth}×${result.originalHeight}px (${origKb} KB) → exact 64×64px (${optKb} KB)`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to process image';
      setErrorMessage(msg);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
    // Reset input so same file can be re-selected if desired
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleProcessFile(file);
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Label and Sizing Instructions Header */}
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-medium text-ink-3 flex items-center gap-1.5">
          <ImageIcon className="size-3 text-brand-500" />
          <span>{label}</span>
        </label>

        {/* Clear Size Guideline Pill */}
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-md border border-brand-500/20">
          <Sparkles className="size-2.5" />
          <span>Target: 64 × 64 px (1:1 square)</span>
        </span>
      </div>

      {/* Main Upload Box & Preview */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row items-center gap-3.5 ${
          isDragOver
            ? 'border-brand-500 bg-brand-500/5'
            : 'border-line bg-surface hover:border-line-strong'
        }`}
      >
        {/* Preview Thumbnail */}
        <div className="relative size-12 rounded-xl bg-surface-2 border border-line overflow-hidden shrink-0 grid place-items-center shadow-xs">
          <Image
            src={currentLogo?.trim() || fallbackImage}
            alt={companyName || 'Item logo'}
            width={48}
            height={48}
            className="size-10 object-contain"
            unoptimized
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = fallbackImage;
            }}
          />

          {isOptimizing && (
            <div className="absolute inset-0 bg-surface/80 backdrop-blur-xs flex items-center justify-center">
              <Loader2 className="size-4 animate-spin text-brand-500" />
            </div>
          )}
        </div>

        {/* Controls & Details */}
        <div className="flex-1 min-w-0 space-y-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            {/* Hidden Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Upload Button */}
            <button
              type="button"
              disabled={isOptimizing}
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary h-7 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isOptimizing ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Upload className="size-3" />
              )}
              <span>{isOptimizing ? 'Optimizing...' : 'Upload Logo'}</span>
            </button>

            {/* Direct URL toggle */}
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-[11px] text-ink-3 hover:text-ink px-2 py-1 rounded-lg hover:bg-surface-2 transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <LinkIcon className="size-3" />
              <span>{showUrlInput ? 'Hide URL' : 'Paste URL'}</span>
            </button>

            {/* Reset / Clear Button */}
            {currentLogo && (
              <button
                type="button"
                onClick={() => {
                  onLogoChange('');
                  setOptimizationReport(null);
                }}
                className="text-[11px] text-ink-3 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Remove logo"
              >
                <Trash2 className="size-3" />
              </button>
            )}
          </div>

          {/* Sizing instruction text */}
          <p className="text-[10px] text-ink-3 leading-tight">
            Drop any image here. Large images are automatically cropped to 1:1 and resized to 64×64 px.
          </p>
        </div>
      </div>

      {/* Direct URL Input */}
      {showUrlInput && (
        <div className="pt-1">
          <input
            type="text"
            value={currentLogo}
            onChange={(e) => onLogoChange(e.target.value)}
            placeholder="e.g. /images/default-company.svg or https://example.com/logo.png"
            className="w-full h-8 px-3 rounded-lg border border-line bg-surface text-xs text-ink placeholder:text-ink-4 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
          />
        </div>
      )}

      {/* Optimization Success Report */}
      {optimizationReport && (
        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[11px] flex items-center gap-1.5 font-medium">
          <CheckCircle2 className="size-3.5 shrink-0" />
          <span>{optimizationReport}</span>
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-[11px] flex items-center gap-1.5">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
