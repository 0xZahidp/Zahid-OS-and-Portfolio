'use client';

import React from 'react';
import {
  TablerUserCircle,
  TablerBox,
  TablerUsers,
  TablerBooks,
} from '@/components/ui/Icons';

interface MobileBottomBarProps {
  activeSection: string;
  onNavigate: (section: string) => void;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  activeSection,
  onNavigate,
}) => {
  const items = [
    { id: 'profile', label: 'Profile', icon: TablerUserCircle },
    { id: 'projects', label: 'Projects', icon: TablerBox },
    { id: 'people', label: 'People', icon: TablerUsers },
    { id: 'library', label: 'Library', icon: TablerBooks },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 flex h-16 items-center justify-around border-t border-line bg-surface/95 backdrop-blur-xl px-2 pb-[env(safe-area-inset-bottom)] md:hidden shadow-lg select-none"
      aria-label="Mobile Bottom Navigation"
    >
      {items.map((item, idx) => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;

        return (
          <button
            key={item.id}
            type="button"
            data-note={idx}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center justify-center gap-1 w-16 py-1 transition-colors ${
              isActive
                ? 'text-link font-semibold'
                : 'text-ink-3 hover:text-ink-2'
            }`}
          >
            <Icon className={`size-5.5 transition-transform ${isActive ? 'scale-110' : ''}`} />
            <span className="text-[11px] leading-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
