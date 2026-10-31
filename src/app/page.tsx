'use client';

import React, { useState } from 'react';
import { profileData } from '@/data/profile';
import { DesktopLayout } from '@/components/layout/DesktopLayout';
import { MobileLayout } from '@/components/layout/MobileLayout';

export default function Home() {
  const [activeSection, setActiveSection] = useState<string>('profile');
  const [activeTab, setActiveTab] = useState<'resume' | 'work'>('resume');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);

  const handleNavigate = (section: string) => {
    setActiveSection(section);

    if (section === 'projects') {
      setActiveTab('work');
      setTimeout(() => {
        const el = document.getElementById('projects');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 50);
      return;
    }

    if (section === 'profile') {
      setActiveTab('resume');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (section === 'contact') {
      const el = document.getElementById('contact');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (section === 'people') {
      const el = document.getElementById('who-to-follow');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (section === 'library') {
      const el = document.getElementById('skills');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (section === 'focus') {
      const el = document.getElementById('about');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }
  };

  return (
    <>
      {/* Desktop & Tablet 3-Column Experience */}
      <DesktopLayout
        profile={profileData}
        activeSection={activeSection}
        activeTab={activeTab}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        onNavigate={handleNavigate}
        onTabChange={setActiveTab}
      />

      {/* Mobile Dedicated Experience */}
      <MobileLayout
        profile={profileData}
        activeSection={activeSection}
        activeTab={activeTab}
        onNavigate={handleNavigate}
        onTabChange={setActiveTab}
      />
    </>
  );
}
