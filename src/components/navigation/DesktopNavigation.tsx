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
    { id: 'profile', label: 'Profile', icon: TablerUserCircle },
    { id: 'projects', label: 'Projects', icon: TablerBox },
    { id: 'people', label: 'People', icon: TablerUsers },
    { id: 'contact', label: 'Contact', icon: TablerMail },
  ];

  const secondaryNavItems = [
    { id: 'library', label: 'Library', icon: TablerBooks },
    { id: 'focus', label: 'Focus', icon: TablerHeadphones },
  ];

  const renderItem = (item: (typeof mainNavItems)[0]) => {
    const Icon = item.icon;
    const isActive = activeSection === item.id;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onNavigate(item.id)}
        title={item.label}
        className={`group flex items-center gap-3.5 rounded-xl p-3 text-lead transition-colors cursor-pointer w-full text-left ${
          isCollapsed ? 'justify-center xl:p-3' : 'xl:px-3 xl:py-2.5'
        } ${
          isActive
            ? 'bg-surface-2/70 font-semibold text-ink shadow-sm'
            : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
        }`}
      >
        <Icon className="size-6 shrink-0 transition-transform group-active:scale-90" />
        <span
          className={`truncate transition-opacity duration-200 ${
            isCollapsed ? 'sr-only' : 'sr-only xl:not-sr-only'
          }`}
        >
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
