'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Trash2, AlertTriangle, Info, X } from 'lucide-react';
import { playKeyPressSound } from '@/lib/sound';

export type ConfirmType = 'danger' | 'warning' | 'info';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
  icon?: 'trash' | 'warning' | 'info';
}

interface ConfirmRequest {
  id: string;
  options: Required<Omit<ConfirmOptions, 'icon'>> & { icon?: 'trash' | 'warning' | 'info' };
  resolve: (value: boolean) => void;
}

// Global active request and subscription dispatcher
let activeRequest: ConfirmRequest | null = null;
let notifyChange: (() => void) | null = null;

/**
 * Universal in-app confirmation dialog.
 * Replaces native browser window.confirm() with a polished, glassmorphic modal.
 *
 * @example
 * if (!await confirmModal({ title: 'Delete Note', message: 'Permanently remove this note?', type: 'danger' })) return;
 * // or shorthand:
 * if (!await confirmModal('Are you sure you want to delete this note?')) return;
 */
export function confirmModal(options: ConfirmOptions | string): Promise<boolean> {
  const isString = typeof options === 'string';
  const rawMessage = isString ? options : options.message;

  const isDeleteOrDanger = /delete|remove|permanently|destroy/i.test(
    isString ? rawMessage : `${options.title || ''} ${rawMessage}`
  );
  const isReset = /reset|revert|discard/i.test(
    isString ? rawMessage : `${options.title || ''} ${rawMessage}`
  );

  const defaultType: ConfirmType = isDeleteOrDanger ? 'danger' : isReset ? 'warning' : 'info';
  const defaultTitle = isDeleteOrDanger
    ? 'Delete Confirmation'
    : isReset
    ? 'Reset Confirmation'
    : 'Confirmation';
  const defaultConfirmText = isDeleteOrDanger ? 'Delete' : isReset ? 'Reset' : 'Confirm';

  const normalizedOptions: Required<Omit<ConfirmOptions, 'icon'>> & { icon?: 'trash' | 'warning' | 'info' } = {
    title: isString ? defaultTitle : options.title || defaultTitle,
    message: rawMessage,
    confirmText: isString
      ? defaultConfirmText
      : options.confirmText || (options.type === 'danger' ? 'Delete' : defaultConfirmText),
    cancelText: isString ? 'Cancel' : options.cancelText || 'Cancel',
    type: isString ? defaultType : options.type || defaultType,
    icon: !isString && options.icon ? options.icon : undefined,
  };

  return new Promise<boolean>((resolve) => {
    // If there is an existing pending dialog, resolve it as false first
    if (activeRequest) {
      try {
        activeRequest.resolve(false);
      } catch {}
    }

    activeRequest = {
      id: `confirm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      options: normalizedOptions,
      resolve: (val: boolean) => {
        try {
          resolve(val);
        } finally {
          activeRequest = null;
          if (notifyChange) notifyChange();
        }
      },
    };

    if (notifyChange) {
      notifyChange();
    } else if (typeof window !== 'undefined') {
      // Fallback if dialog UI has not mounted yet
      const fallback = window.confirm(normalizedOptions.message);
      resolve(fallback);
      activeRequest = null;
    }
  });
}

/**
 * Hook interface for components that prefer standard hook conventions
 */
export function useConfirm() {
  return confirmModal;
}

/**
 * Global ConfirmDialog component mounted in AmbientProviders.
 * Displays the modal with smooth backdrop-blur and keyboard/touch support.
 */
export const ConfirmDialog: React.FC = () => {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    notifyChange = () => {
      setRequest(activeRequest ? { ...activeRequest } : null);
    };

    if (activeRequest) {
      setRequest({ ...activeRequest });
    }

    return () => {
      notifyChange = null;
    };
  }, []);

  // Auto-focus confirm button and play entry sound when modal opens
  useEffect(() => {
    if (request) {
      try {
        playKeyPressSound();
      } catch {}

      // Prevent background scrolling while dialog is open
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const timer = setTimeout(() => {
        confirmBtnRef.current?.focus();
      }, 50);

      return () => {
        document.body.style.overflow = originalOverflow;
        clearTimeout(timer);
      };
    }
  }, [request]);

  const handleClose = useCallback(
    (confirmed: boolean) => {
      if (!request) return;
      try {
        playKeyPressSound();
      } catch {}
      request.resolve(confirmed);
    },
    [request]
  );

  // Keyboard navigation: Escape to cancel, Enter to confirm
  useEffect(() => {
    if (!request) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleClose(false);
      } else if (e.key === 'Enter') {
        // Do not auto-confirm if focus is specifically on the cancel button
        if (document.activeElement?.getAttribute('data-dialog-cancel') === 'true') {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        handleClose(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [request, handleClose]);

  if (!request) return null;

  const { options } = request;
  const isDanger = options.type === 'danger';
  const isWarning = options.type === 'warning';

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
      onClick={() => handleClose(false)}
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[400px] overflow-hidden rounded-[26px] bg-surface border border-line shadow-2xl p-6 sm:p-7 flex flex-col items-center text-center animate-in zoom-in-95 duration-200"
      >
        {/* Subtle Close (X) button */}
        <button
          type="button"
          onClick={() => handleClose(false)}
          data-dialog-cancel="true"
          aria-label="Close dialog"
          className="absolute top-4 right-4 size-8 rounded-full border border-line/60 bg-surface-2/80 hover:bg-surface-3 grid place-items-center text-ink-3 hover:text-ink transition-colors cursor-pointer"
        >
          <X className="size-4" />
        </button>

        {/* Status Icon Badge with glow ring */}
        <div
          className={`size-14 rounded-2xl flex items-center justify-center mb-4 transition-transform shadow-inner ${
            isDanger
              ? 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-500 border border-rose-500/25 ring-8 ring-rose-500/5'
              : isWarning
              ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 border border-amber-500/25 ring-8 ring-amber-500/5'
              : 'bg-brand-500/10 dark:bg-brand-500/20 text-brand-500 border border-brand-500/25 ring-8 ring-brand-500/5'
          }`}
        >
          {options.icon === 'trash' || (isDanger && options.icon !== 'warning' && options.icon !== 'info') ? (
            <Trash2 className="size-6 text-rose-500 stroke-[2.2]" />
          ) : isWarning || options.icon === 'warning' ? (
            <AlertTriangle className="size-6 text-amber-500 stroke-[2.2]" />
          ) : (
            <Info className="size-6 text-brand-500 stroke-[2.2]" />
          )}
        </div>

        {/* Title */}
        <h3 id="confirm-dialog-title" className="text-base sm:text-lg font-bold text-ink tracking-tight">
          {options.title}
        </h3>

        {/* Message */}
        <p
          id="confirm-dialog-message"
          className="text-xs sm:text-sm text-ink-2 leading-relaxed mt-2 max-w-[320px] whitespace-pre-line"
        >
          {options.message}
        </p>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center gap-3 w-full">
          <button
            type="button"
            data-dialog-cancel="true"
            onClick={() => handleClose(false)}
            className="flex-1 h-11 px-4 rounded-xl border border-line bg-surface-2 hover:bg-surface-3 text-ink font-semibold text-xs sm:text-sm transition-all duration-150 cursor-pointer active:scale-[0.98]"
          >
            {options.cancelText}
          </button>

          <button
            ref={confirmBtnRef}
            type="button"
            onClick={() => handleClose(true)}
            className={`flex-1 h-11 px-4 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-150 cursor-pointer inline-flex items-center justify-center gap-1.5 active:scale-[0.98] ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/25'
                : isWarning
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-950/25'
                : 'bg-brand-500 hover:bg-brand-600 text-white shadow-md'
            }`}
          >
            {options.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

