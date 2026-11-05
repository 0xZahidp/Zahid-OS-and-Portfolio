export type CareerApplicationStatus =
  | 'saved'
  | 'applied'
  | 'screening'
  | 'technical'
  | 'manager'
  | 'offer'
  | 'rejected'
  | 'withdrawn';

export type CareerPriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export type CareerSourceType =
  | 'linkedin'
  | 'referral'
  | 'twitter'
  | 'web3_board'
  | 'company_site'
  | 'recruiter'
  | 'github'
  | 'other';

export type CareerEmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship';

export type CareerLocationType = 'remote' | 'hybrid' | 'onsite';

export type CareerSalaryPeriod = 'yearly' | 'monthly' | 'hourly';

export interface CareerContact {
  id: string;
  name: string;
  role: 'recruiter' | 'hiring_manager' | 'peer' | 'executive' | 'referral';
  email?: string;
  linkedin?: string;
  telegram?: string;
  notes?: string;
}

export interface CareerInterview {
  id: string;
  round: number;
  title: string;
  stage: 'screening' | 'technical' | 'take_home' | 'system_design' | 'culture' | 'final';
  scheduled_at?: string;
  completed: boolean;
  interviewer?: string;
  meeting_url?: string;
  notes?: string;
  questions?: Array<{ q: string; a?: string }>;
}

export interface CareerApplication {
  id: string;
  company_name: string;
  company_website?: string;
  company_location?: string;
  company_logo?: string;
  role_title: string;
  status: CareerApplicationStatus;
  priority: CareerPriorityLevel;
  source: CareerSourceType;
  source_detail?: string;
  source_url?: string;
  remote_type: CareerLocationType;
  location?: string;
  employment_type: CareerEmploymentType;
  applied_date: string; // ISO
  deadline?: string;
  salary_currency: string;
  salary_min?: number;
  salary_max?: number;
  salary_period: CareerSalaryPeriod;
  compensation_notes?: string;
  notes?: string;
  cv_version?: string;
  cover_letter_url?: string;
  portfolio_url?: string;
  next_followup_date?: string;
  next_followup_notes?: string;
  contacts: CareerContact[];
  interviews: CareerInterview[];
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface CareerMetrics {
  total: number;
  active: number;
  interviewsScheduled: number;
  offers: number;
  rejected: number;
  overdueFollowups: number;
}

