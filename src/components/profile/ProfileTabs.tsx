'use client';

import React from 'react';

interface ProfileTabsProps {
  activeTab: 'resume' | 'work';
  onTabChange: (tab: 'resume' | 'work') => void;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="mt-10 scroll-mt-14 border-b border-line px-4 sm:px-6 lg:px-8 select-none" aria-label="Profile tabs">
      <ul className="flex justify-center gap-8">
        <li>
          <button
            type="button"
            onClick={() => onTabChange('resume')}
            className={`relative block py-3 text-sm font-semibold tracking-wide uppercase transition-colors cursor-pointer ${
              activeTab === 'resume'
                ? 'text-link'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            <span>Resume</span>
            {activeTab === 'resume' && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-link shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            )}
          </button>
        </li>
        <li>
          <button
            type="button"
            onClick={() => onTabChange('work')}
            className={`relative block py-3 text-sm font-semibold tracking-wide uppercase transition-colors cursor-pointer ${
              activeTab === 'work'
                ? 'text-link'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            <span>Work</span>
            {activeTab === 'work' && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-link shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            )}
          </button>
        </li>
      </ul>
    </nav>
  );
};
