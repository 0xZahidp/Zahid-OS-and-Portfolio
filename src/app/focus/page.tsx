'use client';

import React, { useState } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { DesktopLayout } from '@/components/layout/DesktopLayout';
import { MobileLayout } from '@/components/layout/MobileLayout';

export default function FocusPage() {
  const { content } = usePortfolio();
  const [activeSection, setActiveSection] = useState<string>('focus');
  const [activeTab, setActiveTab] = useState<'resume' | 'work'>('resume');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const handleNavigate = (section: string) => {
    if (section === 'focus') {
      setActiveSection('focus');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (section === 'profile') {
      window.location.href = '/';
      return;
    }

    window.location.href = `/?tab=${section}`;
  };

  return (
    <>
      {/* Desktop & Tablet 3-Column Layout */}
      <DesktopLayout
        profile={content.profile}
        activeSection={activeSection}
        activeTab={activeTab}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        onNavigate={handleNavigate}
        onTabChange={setActiveTab}
      />

      {/* Mobile Dedicated Experience */}
      <MobileLayout
        profile={content.profile}
        activeSection={activeSection}
        activeTab={activeTab}
        onNavigate={handleNavigate}
        onTabChange={setActiveTab}
      />
    </>
  );
}
