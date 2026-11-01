'use client';

import React, { useState } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { DesktopLayout } from '@/components/layout/DesktopLayout';
import { MobileLayout } from '@/components/layout/MobileLayout';

export default function Home() {
  const { content } = usePortfolio();
  const [activeSection, setActiveSection] = useState<string>('profile');
  const [activeTab, setActiveTab] = useState<'resume' | 'work'>('resume');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const handleNavigate = (section: string) => {
    setActiveSection(section);

    if (section === 'projects') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (section === 'people') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (section === 'contact') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (section === 'profile') {
      setActiveTab('resume');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (section === 'library') {
      setActiveSection('library');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (section === 'focus') {
      setActiveSection('profile');
      setTimeout(() => {
        const el = document.getElementById('about');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 50);
      return;
    }
  };

  return (
    <>
      {/* Desktop & Tablet 3-Column Experience */}
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
