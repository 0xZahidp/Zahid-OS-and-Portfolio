'use client';

import React from 'react';
import { Profile } from '@/types/profile';
import { DesktopLayout } from './DesktopLayout';

interface MobileLayoutProps {
  profile: Profile;
  activeSection: string;
  activeTab: 'resume' | 'work';
  onNavigate: (section: string) => void;
  onTabChange: (tab: 'resume' | 'work') => void;
}

/**
 * MobileLayout is now unified into DesktopLayout which provides full
 * responsive adaptation with the Top Navigation Bar, mobile drawer sheet,
 * and adaptive 2-column to 1-column layout.
 */
export const MobileLayout: React.FC<MobileLayoutProps> = (props) => {
  return <DesktopLayout {...props} />;
};
