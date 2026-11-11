'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PortfolioContent, WorksSettings, BasedInSettings, GitHubSettings, LoadedCollectionIds } from '@/types/cms';
import {
  Profile,
  Skill,
  Experience,
  Project,
  SocialLink,
  FollowerRecommendation,
  LanguageSkill,
} from '@/types/profile';
import { LibraryContent } from '@/types/library';
import { defaultPortfolioContent } from '@/data/default-content';
import { confirmModal } from '@/components/ui/ConfirmDialog';

export interface SaveResult {
  success: boolean;
  conflict?: boolean;
  deletionsSkipped?: boolean;
  error?: string;
  version?: number;
}

interface PortfolioContextType {
  content: PortfolioContent;
  isLoading: boolean;
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
  updateLibraryData: (library: LibraryContent) => void;
  saveContent: (confirmDelete?: boolean) => Promise<SaveResult>;
  reloadContent: () => Promise<void>;
  resetToDefault: () => void;
  exportJson: () => void;
  importJson: (jsonString: string) => boolean;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

const normalizePortfolioContent = (raw: PortfolioContent): PortfolioContent => {
  if (!raw) return raw;
  return {
    ...raw,
    projects: (raw.projects || []).map((p: Project) => ({
      ...p,
      highlightBadge: p.highlightBadge || p.highlight_badge || '',
      highlight_badge: p.highlight_badge || p.highlightBadge || '',
      logoType: p.logoType || p.logo_type || 'bidvers',
      logo_type: p.logo_type || p.logoType || 'bidvers',
    })),
  };
};

export const PortfolioProvider: React.FC<{
  children: React.ReactNode;
  initialContent?: PortfolioContent;
}> = ({ children, initialContent }) => {
  const [content, setContent] = useState<PortfolioContent>(() =>
    normalizePortfolioContent(initialContent || defaultPortfolioContent)
  );
  const [loadedIds, setLoadedIds] = useState<LoadedCollectionIds | undefined>(initialContent?.loadedIds);
  const [hasLoaded, setHasLoaded] = useState<boolean>(Boolean(initialContent));
  const [isLoading, setIsLoading] = useState<boolean>(!initialContent);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state if initialContent changes on navigation / ISR update
  useEffect(() => {
    if (initialContent) {
      setContent(normalizePortfolioContent(initialContent));
      setLoadedIds(initialContent.loadedIds);
      setHasLoaded(true);
      setIsLoading(false);
    }
  }, [initialContent]);

  // Fetch or reload content from API
  const fetchContent = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/content');
      if (!res.ok) return;
      const data = await res.json();
      if (data.content) {
        setContent(normalizePortfolioContent(data.content));
        setLoadedIds(data.loadedIds || data.content.loadedIds);
        setHasLoaded(true);
        setIsDirty(false);
      }
    } catch (err) {
      console.error('Failed to load portfolio content:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch initial content from API on mount ONLY if not provided by server
  useEffect(() => {
    if (!initialContent) {
      fetchContent();
    }
  }, [initialContent, fetchContent]);

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

  const updateLibraryData = useCallback((library: LibraryContent) => {
    setContent((prev) => ({ ...prev, libraryData: library }));
    setIsDirty(true);
    setSaveStatus('idle');
  }, []);

  const saveContent = useCallback(async (confirmDelete?: boolean): Promise<SaveResult> => {
    setIsSaving(true);
    setSaveStatus('saving');
    setErrorMessage(null);

    try {
      const payload: PortfolioContent = {
        ...content,
        clientLoaded: hasLoaded,
        loadedIds,
        confirmDelete: Boolean(confirmDelete),
        version: content.version ?? 0,
        expectedVersion: content.version ?? 0,
      };

      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 || data.conflict) {
          const conflictMsg = data.error || 'This data changed elsewhere, reload before saving';
          await fetchContent();
          setSaveStatus('error');
          setErrorMessage(conflictMsg);
          return {
            success: false,
            conflict: true,
            error: conflictMsg,
          };
        }
        if (data.requiresConfirmation && !confirmDelete && typeof window !== 'undefined') {
          const userConfirmed = await confirmModal({
            title: 'Mass Deletion Confirmation',
            message: `${data.error || 'Mass deletion guard: deleting more than 50% of a collection requires confirmation.'}\n\nDo you want to proceed with deleting these items?`,
            confirmText: 'Proceed With Deletion',
            type: 'danger',
          });
          if (userConfirmed) {
            return await saveContent(true);
          }
        }
        throw new Error(data.error || `Failed with HTTP status ${res.status}`);
      }

      if (data.success) {
        if (data.content) {
          setContent(data.content);
        }
        if (data.loadedIds) {
          setLoadedIds(data.loadedIds);
        } else if (data.content?.loadedIds) {
          setLoadedIds(data.content.loadedIds);
        }
        setIsDirty(false);
        setSaveStatus('saved');
        setLastSaved(new Date().toLocaleTimeString());
        setTimeout(() => setSaveStatus('idle'), 4000);
        return {
          success: true,
          version: data.version ?? data.content?.version,
          deletionsSkipped: Boolean(data.deletionsSkipped),
        };
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving content';
      setSaveStatus('error');
      setErrorMessage(msg);
      return {
        success: false,
        error: msg,
      };
    } finally {
      setIsSaving(false);
    }
  }, [content, hasLoaded, loadedIds, fetchContent]);

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
        isLoading,
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
        updateLibraryData,
        saveContent,
        reloadContent: fetchContent,
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

