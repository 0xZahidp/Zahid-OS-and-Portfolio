export type StartupLeadTrack = 'Web3 Growth' | 'Full-Stack' | 'Salesforce';

export type StartupLeadSignalType = 'early_hiring_post' | 'seed_funding';

export type StartupLeadEmailConfidence = 'verified' | 'extracted' | 'guessed' | 'missing';

export type StartupLeadStatus = 'new' | 'emailed' | 'replied' | 'promoted' | 'archived';

export interface StartupLead {
  id: string;
  created_at: string;
  source_url: string;
  normalized_company: string;
  company_name: string;
  website_domain?: string | null;
  signal_type: StartupLeadSignalType;
  track: StartupLeadTrack;
  role_or_headline: string;
  startup_summary?: string | null;
  contact_name?: string | null;
  contact_title?: string | null;
  contact_email?: string | null;
  email_confidence: StartupLeadEmailConfidence;
  pitch_hook?: string | null;
  status: StartupLeadStatus;
  post_published_at?: string | null;
}

export interface StartupLeadMetrics {
  newToday: number;
  readyToEmail: number;
  emailed: number;
  replied: number;
  promoted: number;
  total: number;
}

