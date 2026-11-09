import { PortfolioContent } from '@/types/cms';
import { Project } from '@/types/profile';
import initialPortfolioData from './portfolio-content.json';

const rawData = initialPortfolioData as unknown as PortfolioContent;

export const defaultPortfolioContent: PortfolioContent = {
  ...rawData,
  projects: (rawData.projects || []).map((p: Project) => ({
    ...p,
    highlightBadge: p.highlightBadge || p.highlight_badge || '',
    highlight_badge: p.highlight_badge || p.highlightBadge || '',
    logoType: p.logoType || p.logo_type || 'bidvers',
    logo_type: p.logo_type || p.logoType || 'bidvers',
  })),
};



