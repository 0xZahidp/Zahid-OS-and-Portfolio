export interface Profile {
  id: string;
  username: string;
  full_name: string;
  headline: string;
  bio: string;
  avatar_url: string;
  banner_url?: string;
  location: string;
  timezone: string;
  availability: string;
  github_followers_count: number;
  roles: {
    title: string;
    company: string;
    company_url: string;
    company_logo: string;
  }[];
  created_at?: string;
  updated_at?: string;
}

export interface Skill {
  id: string;
  name: string;
  category: 'ai' | 'tech' | 'tool' | 'top';
  icon?: string;
  color?: string;
}

export interface Experience {
  id: string;
  profile_id?: string;
  company: string;
  company_url?: string;
  company_logo: string;
  position: string;
  period: string;
  type: string; // 'Full-time' | 'Contract' | 'Seasonal'
  workplace_type: string; // 'Remote' | 'Dhaka, Bangladesh'
  description: string;
  highlights?: {
    label: string;
    value: string;
    icon: 'rocket' | 'code' | 'mobile';
  }[];
  bullet_points?: string[];
  sub_programs?: {
    title: string;
    badge: string;
    description: string;
  }[];
  tags?: string[];
  is_current: boolean;
}

export interface Project {
  id: string;
  profile_id?: string;
  title: string;
  description: string;
  image_url?: string;
  project_url?: string;
  repository_url?: string;
  tags?: string[];
  created_at?: string;
  stars?: number;
  highlightBadge?: string;
  logoType?: 'bidvers' | 'laravel' | 'invo' | 'prompt' | 'mytapcard' | 'gymscanner';
}

export interface SocialLink {
  id: string;
  platform: 'github' | 'x' | 'linkedin' | 'facebook' | 'producthunt' | 'devto' | 'behance';
  url: string;
  handle: string;
  label: string;
}

export interface FollowerRecommendation {
  id: string;
  name: string;
  role: string;
  avatar_url: string;
  url: string;
  handle: string;
}

export interface LanguageSkill {
  name: string;
  proficiency: string;
  rating: number; // 1 to 5
  note?: string;
  hasVoice?: boolean;
}

