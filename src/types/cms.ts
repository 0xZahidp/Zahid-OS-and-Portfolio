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

export interface LoadedCollectionIds {
  languages?: string[];
  skills?: string[];
  projects?: string[];
  experience?: string[];
  socialLinks?: string[];
  suggestedPeople?: string[];
  bioParagraphs?: string[];
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
  clientLoaded?: boolean;
  confirmDelete?: boolean;
  loadedIds?: LoadedCollectionIds;
  version?: number;
  expectedVersion?: number;
}

export interface CmsSaveResponse {
  success: boolean;
  savedAt: string;
  destination: string[];
  message?: string;
  error?: string;
  content?: PortfolioContent;
  loadedIds?: LoadedCollectionIds;
  version?: number;
  conflict?: boolean;
  deletionsSkipped?: boolean;
}

