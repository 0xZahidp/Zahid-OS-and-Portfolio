'use client';

import React, { useState } from 'react';
import {
  Monitor,
  Tablet,
  Smartphone,
  RotateCw,
  ExternalLink,
  X,
} from 'lucide-react';

interface LivePreviewPaneProps {
  onClose: () => void;
}

export const LivePreviewPane: React.FC<LivePreviewPaneProps> = ({ onClose }) => {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  const getContainerWidth = () => {
    switch (device) {
      case 'mobile':
        return 'w-[375px] max-w-full';
      case 'tablet':
        return 'w-[768px] max-w-full';
      case 'desktop':
      default:
        return 'w-full';
    }
  };

  return (
    <aside className="w-1/2 shrink-0 border-l border-line bg-surface-2/40 flex flex-col h-[calc(100vh-4rem)] sticky top-16 transition-all duration-200">
      {/* Preview Header Bar */}
      <div className="h-12 border-b border-line bg-surface px-4 flex items-center justify-between gap-3">
        {/* Device Switcher */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg border border-line bg-surface-2">
          <button
            type="button"
            onClick={() => setDevice('desktop')}
            className={`p-1 rounded-md transition-colors ${
              device === 'desktop'
                ? 'bg-surface text-ink shadow-xs'
                : 'text-ink-3 hover:text-ink'
            }`}
            title="Desktop view"
          >
            <Monitor className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDevice('tablet')}
            className={`p-1 rounded-md transition-colors ${
              device === 'tablet'
                ? 'bg-surface text-ink shadow-xs'
                : 'text-ink-3 hover:text-ink'
            }`}
            title="Tablet view"
          >
            <Tablet className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDevice('mobile')}
            className={`p-1 rounded-md transition-colors ${
              device === 'mobile'
                ? 'bg-surface text-ink shadow-xs'
                : 'text-ink-3 hover:text-ink'
            }`}
            title="Mobile view"
          >
            <Smartphone className="size-3.5" />
          </button>
        </div>

        {/* Status Label */}
        <div className="flex items-center gap-1.5 text-[11px] text-ink-3 font-medium">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Interactive Preview</span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleRefresh}
            className="size-7 rounded-lg border border-line bg-surface flex items-center justify-center text-ink-3 hover:text-ink transition-colors"
            title="Refresh preview"
          >
            <RotateCw className="size-3.5" />
          </button>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="size-7 rounded-lg border border-line bg-surface flex items-center justify-center text-ink-3 hover:text-ink transition-colors"
            title="Open live site in new tab"
          >
            <ExternalLink className="size-3.5" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="size-7 rounded-lg border border-line bg-surface flex items-center justify-center text-ink-3 hover:text-ink transition-colors"
            title="Close preview pane"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 overflow-auto p-4 flex justify-center items-start bg-zinc-950/5 dark:bg-zinc-950/40">
        <div
          className={`${getContainerWidth()} h-full rounded-2xl overflow-hidden border border-line shadow-lg bg-surface transition-all duration-300 relative`}
        >
          <iframe
            key={refreshKey}
            src="/"
            title="Live Portfolio Preview"
            className="size-full border-0"
          />
        </div>
      </div>
    </aside>
  );
};
