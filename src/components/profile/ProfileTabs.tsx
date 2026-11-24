'use client';

import React from 'react';

interface ProfileTabsProps {
  activeTab: 'resume' | 'work';
  onTabChange: (tab: 'resume' | 'work') => void;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="mt-8 border-b border-line select-none" aria-label="Profile tabs">
      <div className="flex gap-6">
        <button
          type="button"
          onClick={() => onTabChange('resume')}
          className={`relative pb-3 text-xs sm:text-sm font-medium tracking-wide uppercase transition-colors cursor-pointer ${
            activeTab === 'resume'
              ? 'text-accent font-semibold'
              : 'text-muted hover:text-text'
          }`}
        >
          <span>Resume</span>
          {activeTab === 'resume' && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent" />
          )}
        </button>
        <button
          type="button"
          onClick={() => onTabChange('work')}
          className={`relative pb-3 text-xs sm:text-sm font-medium tracking-wide uppercase transition-colors cursor-pointer ${
            activeTab === 'work'
              ? 'text-accent font-semibold'
              : 'text-muted hover:text-text'
          }`}
        >
          <span>Work</span>
          {activeTab === 'work' && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent" />
          )}
        </button>
      </div>
    </nav>
  );
};
