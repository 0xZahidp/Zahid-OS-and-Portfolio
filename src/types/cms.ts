import {
  Profile,
  Skill,
  Experience,
  Project,
  SocialLink,
  FollowerRecommendation,
  LanguageSkill,
} from './profile';
import { LibraryContent } from './library';

export interface WorksSettings {
  heading: string;
  description: string;
  chips: string[];
}

export interface BasedInSettings {
  city: string;
  country: string;
  timezone: string;
  gmtOffset: string;
}

export interface GitHubSettings {
  username: string;
  token?: string;
  pinnedRepos?: string[];
  followersCount?: number;
  totalContributions?: number;
  totalRepos?: number;
}

export interface PortfolioContent {
  profile: Profile;
  bioParagraphs: string[];
  languages: LanguageSkill[];
  skills: Skill[];
  experience: Experience[];
  projects: Project[];
  suggestedPeople: FollowerRecommendation[];
  socialLinks: SocialLink[];
  worksSettings: WorksSettings;
  basedInSettings: BasedInSettings;
  githubSettings: GitHubSettings;
  libraryData?: LibraryContent;
  updatedAt?: string;
}

export interface CmsSaveResponse {
  success: boolean;
  savedAt: string;
  destination: string[];
  message?: string;
  error?: string;
}

