'use client';

import React from 'react';
import {
  TablerUserCircle,
  TablerBox,
  TablerUsers,
  TablerMail,
  TablerBooks,
  TablerHeadphones,
} from '@/components/ui/Icons';

interface DesktopNavigationProps {
  activeSection: string;
  isCollapsed: boolean;
  onNavigate: (section: string) => void;
}

export const DesktopNavigation: React.FC<DesktopNavigationProps> = ({
  activeSection,
  isCollapsed,
  onNavigate,
}) => {
  const mainNavItems = [
    { id: 'profile', label: 'Profile', icon: TablerUserCircle, note: 0 },
    { id: 'projects', label: 'Projects', icon: TablerBox, note: 1 },
    { id: 'people', label: 'People', icon: TablerUsers, note: 2 },
    { id: 'contact', label: 'Contact', icon: TablerMail, note: 3 },
  ];

  const secondaryNavItems = [
    { id: 'library', label: 'Library', icon: TablerBooks, note: 4 },
    { id: 'focus', label: 'Focus', icon: TablerHeadphones, note: 5 },
  ];

  const renderItem = (item: (typeof mainNavItems)[0]) => {
    const Icon = item.icon;
    const isActive = activeSection === item.id;

    if (isCollapsed) {
      return (
        <button
          key={item.id}
          type="button"
          data-note={item.note}
          onClick={() => onNavigate(item.id)}
          title={item.label}
          aria-label={item.label}
          className={`group grid size-10.5 place-items-center rounded-xl transition-all cursor-pointer ${
            isActive
              ? 'bg-[#18191c] font-semibold text-white border border-white/[0.1] shadow-xs'
              : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white'
          }`}
        >
          <Icon className="size-5.5 shrink-0 transition-transform group-active:scale-90" />
        </button>
      );
    }

    return (
      <button
        key={item.id}
        type="button"
        data-note={item.note}
        onClick={() => onNavigate(item.id)}
        title={item.label}
        aria-label={item.label}
        className={`group grid size-10.5 place-items-center rounded-xl transition-all cursor-pointer xl:flex xl:size-auto xl:w-full xl:items-center xl:gap-3.5 xl:rounded-xl xl:px-3 xl:py-2.5 xl:text-left ${
          isActive
            ? 'bg-[#18191c] font-semibold text-white border border-white/[0.1] shadow-xs'
            : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white'
        }`}
      >
        <Icon className="size-5.5 shrink-0 transition-transform group-active:scale-90 xl:size-5 xl:group-active:scale-95" />
        <span className="sr-only truncate xl:not-sr-only xl:text-lead">
          {item.label}
        </span>
      </button>
    );
  };

  return (
    <nav className="mt-3 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto [scrollbar-width:none]">
      <div className="flex flex-col gap-0.5">
        {mainNavItems.map(renderItem)}
      </div>

      <div className="flex flex-col gap-0.5">
        <hr
          className={`border-line mb-3 ${
            isCollapsed ? 'mx-auto w-6' : 'mx-auto w-6 xl:mx-3 xl:w-auto'
          }`}
          aria-hidden="true"
        />
        {secondaryNavItems.map(renderItem)}
      </div>
    </nav>
  );
};
