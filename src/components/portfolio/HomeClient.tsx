'use client';

import React, { useState, useEffect } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { DesktopLayout } from '@/components/layout/DesktopLayout';
import { MobileLayout } from '@/components/layout/MobileLayout';

interface HomeClientProps {
  defaultSection?: string;
}

export const HomeClient: React.FC<HomeClientProps> = ({ defaultSection = 'profile' }) => {
  const { content } = usePortfolio();
  const [activeSection, setActiveSection] = useState<string>(defaultSection);
  const [activeTab, setActiveTab] = useState<'resume' | 'work'>('resume');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Catch password recovery links directed to root and forward to /admin/reset-password
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      if (hash.includes('type=recovery') || search.includes('type=recovery')) {
        window.location.replace(`/admin/reset-password${hash || search}`);
        return;
      }

      // Check for deep links like #focus or ?tab=focus
      const params = new URLSearchParams(search);
      const tab = params.get('tab') || hash.replace('#', '');
      if (tab === 'focus') {
        setActiveSection('focus');
      } else if (tab === 'library') {
        setActiveSection('library');
      } else if (tab === 'people') {
        setActiveSection('people');
      } else if (tab === 'contact') {
        setActiveSection('contact');
      } else if (tab === 'projects') {
        setActiveSection('projects');
      }
    }
  }, []);

  const handleNavigate = (section: string) => {
    setActiveSection(section);

    if (typeof window !== 'undefined') {
      if (section === 'focus') {
        window.history.replaceState(null, '', '/focus');
      } else if (section === 'profile') {
        window.history.replaceState(null, '', '/');
      } else {
        window.history.replaceState(null, '', `/?tab=${section}`);
      }
    }

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
      setActiveSection('focus');
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
};

