import { PortfolioContent } from '@/types/cms';
import {
  profileData,
  bioParagraphs,
  languagesData,
  aiSkillsData,
  techSkillsData,
  experiencesData,
  projectsData,
  suggestedPeople,
  socialLinksData,
} from './profile';

export const defaultPortfolioContent: PortfolioContent = {
  profile: {
    ...profileData,
    github_followers_count: 6,
  },
  bioParagraphs: [...bioParagraphs],
  languages: [...languagesData],
  skills: [...aiSkillsData, ...techSkillsData],
  experience: [...experiencesData],
  projects: [...projectsData],
  suggestedPeople: [...suggestedPeople],
  socialLinks: [...socialLinksData],
  worksSettings: {
    heading: 'Remote-first',
    description:
      'Comfortable working with teams in any time zone, from the Americas to Europe to Asia-Pacific.',
    chips: [
      'Remote',
      'Async-friendly',
      'US hours',
      'EU hours',
      'Flexible schedule',
    ],
  },
  basedInSettings: {
    city: 'Dhaka',
    country: 'Bangladesh',
    timezone: 'Asia/Dhaka',
    gmtOffset: 'GMT+6',
  },
  githubSettings: {
    username: '0xZahidp',
    followersCount: 6,
    pinnedRepos: [
      '0xZahidp/MyTapCard',
      '0xZahidp/Orbit',
      '0xZahidp/GhuraFira_Mobile_APP_Flutter',
      '0xZahidp/CompilerX',
    ],
  },
  updatedAt: new Date().toISOString(),
};

