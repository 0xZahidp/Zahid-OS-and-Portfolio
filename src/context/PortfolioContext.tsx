'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PortfolioContent, WorksSettings, BasedInSettings, GitHubSettings } from '@/types/cms';
import {
  Profile,
  Skill,
  Experience,
  Project,
  SocialLink,
  FollowerRecommendation,
  LanguageSkill,
} from '@/types/profile';
import { defaultPortfolioContent } from '@/data/default-content';

interface PortfolioContextType {
  content: PortfolioContent;
  isDirty: boolean;
  isSaving: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved: string | null;
  errorMessage: string | null;
  updateProfile: (profile: Partial<Profile>) => void;
  updateBioParagraphs: (paragraphs: string[]) => void;
  updateExperience: (experience: Experience[]) => void;
  updateProjects: (projects: Project[]) => void;
  updateSkills: (skills: Skill[]) => void;
  updateLanguages: (languages: LanguageSkill[]) => void;
  updateWorksSettings: (settings: Partial<WorksSettings>) => void;
  updateBasedInSettings: (settings: Partial<BasedInSettings>) => void;
  updateGitHubSettings: (settings: Partial<GitHubSettings>) => void;
  updateSocialLinks: (socials: SocialLink[]) => void;
  updateSuggestedPeople: (people: FollowerRecommendation[]) => void;
  saveContent: () => Promise<boolean>;
  resetToDefault: () => void;
  exportJson: () => void;
  importJson: (jsonString: string) => boolean;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [content, setContent] = useState<PortfolioContent>(defaultPortfolioContent);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch initial content from API on mount
  useEffect(() => {
    let isMounted = true;
    const fetchContent = async () => {
      try {
        const res = await fetch('/api/content');
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.content) {
          setContent(data.content);
        }
      } catch (err) {
        console.error('Failed to load portfolio content:', err);
      }
    };

    fetchContent();
    return () => {
      isMounted = false;
    };
  }, []);

  const updateProfile = useCallback((profileUpdates: Partial<Profile>) => {
    setContent((prev) => ({
      ...prev,
      profile: { ...prev.profile, ...profileUpdates },
    }));
    setIsDirty(true);
    setSaveStatus('idle');
  }, []);

  const updateBioParagraphs = useCallback((paragraphs: string[]) => {
    setContent((prev) => ({ ...prev, bioParagraphs: paragraphs }));
    setIsDirty(true);
    setSaveStatus('idle');
  }, []);

  const updateExperience = useCallback((experience: Experience[]) => {
    setContent((prev) => ({ ...prev, experience }));
    setIsDirty(true);
    setSaveStatus('idle');
  }, []);

  const updateProjects = useCallback((projects: Project[]) => {
    setContent((prev) => ({ ...prev, projects }));
    setIsDirty(true);
    setSaveStatus('idle');
  }, []);

  const updateSkills = useCallback((skills: Skill[]) => {
    setContent((prev) => ({ ...prev, skills }));
    setIsDirty(true);
    setSaveStatus('idle');
  }, []);

  const updateLanguages = useCallback((languages: LanguageSkill[]) => {
    setContent((prev) => ({ ...prev, languages }));
    setIsDirty(true);
    setSaveStatus('idle');
  }, []);

  const updateWorksSettings = useCallback((settings: Partial<WorksSettings>) => {
    setContent((prev) => ({
      ...prev,
      worksSettings: { ...prev.worksSettings, ...settings },
    }));
    setIsDirty(true);
    setSaveStatus('idle');
  }, []);

  const updateBasedInSettings = useCallback((settings: Partial<BasedInSettings>) => {
    setContent((prev) => ({
      ...prev,
      basedInSettings: { ...prev.basedInSettings, ...settings },
    }));
    setIsDirty(true);
    setSaveStatus('idle');
  }, []);

  const updateGitHubSettings = useCallback((settings: Partial<GitHubSettings>) => {
    setContent((prev) => ({
      ...prev,
      githubSettings: { ...prev.githubSettings, ...settings },
    }));
    setIsDirty(true);
    setSaveStatus('idle');
  }, []);

  const updateSocialLinks = useCallback((socials: SocialLink[]) => {
    setContent((prev) => ({ ...prev, socialLinks: socials }));
    setIsDirty(true);
    setSaveStatus('idle');
  }, []);

  const updateSuggestedPeople = useCallback((people: FollowerRecommendation[]) => {
    setContent((prev) => ({ ...prev, suggestedPeople: people }));
    setIsDirty(true);
    setSaveStatus('idle');
  }, []);

  const saveContent = useCallback(async (): Promise<boolean> => {
    setIsSaving(true);
    setSaveStatus('saving');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });

      if (!res.ok) {
        throw new Error(`Failed with HTTP status ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        setIsDirty(false);
        setSaveStatus('saved');
        setLastSaved(new Date().toLocaleTimeString());
        setTimeout(() => setSaveStatus('idle'), 4000);
        return true;
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving content';
      setSaveStatus('error');
      setErrorMessage(msg);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [content]);

  const resetToDefault = useCallback(() => {
    setContent(defaultPortfolioContent);
    setIsDirty(true);
    setSaveStatus('idle');
  }, []);

  const exportJson = useCallback(() => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(content, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `folioframe-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [content]);

  const importJson = useCallback((jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString) as PortfolioContent;
      if (!parsed.profile || !parsed.experience || !parsed.projects) {
        throw new Error('Invalid portfolio JSON structure');
      }
      setContent(parsed);
      setIsDirty(true);
      setSaveStatus('idle');
      return true;
    } catch (err) {
      console.error('Import failed:', err);
      return false;
    }
  }, []);

  return (
    <PortfolioContext.Provider
      value={{
        content,
        isDirty,
        isSaving,
        saveStatus,
        lastSaved,
        errorMessage,
        updateProfile,
        updateBioParagraphs,
        updateExperience,
        updateProjects,
        updateSkills,
        updateLanguages,
        updateWorksSettings,
        updateBasedInSettings,
        updateGitHubSettings,
        updateSocialLinks,
        updateSuggestedPeople,
        saveContent,
        resetToDefault,
        exportJson,
        importJson,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};
