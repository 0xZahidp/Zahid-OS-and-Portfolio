import { supabaseServer } from '@/lib/supabase/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { PortfolioContent } from '@/types/cms';

export const ALL_TABLE_NAMES = [
  // 1. Portfolio & Identity
  'profiles',
  'bio_paragraphs',
  'experiences',
  'projects',
  'skills',
  'languages',
  'social_links',
  'suggested_people',
  'portfolio_content',

  // 2. Settings & System Configuration
  'site_settings',
  'app_settings',

  // 3. Mail & Inboxes
  'inbox_messages',
  'inbox_deleted_resend_ids',
  'os_mail_domains',

  // 4. Zahid OS Cloud Tools & Storage
  'os_settings',
  'os_short_links',
  'os_snippets',
  'os_notes',
  'os_temp_inboxes',
  'os_temp_messages',
  'os_api_saved_requests',
  'os_travel_districts',
  'os_travel_memories',
] as const;

export type TableName = (typeof ALL_TABLE_NAMES)[number];

const CONTENT_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'portfolio-content.json');
const INBOX_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'inbox-store.json');
const TRAVEL_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'travel-data.json');
const NOTES_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'os-notes.json');

export interface TableColumnDef {
  name: string;
  type: string;
  nullable: boolean;
  sample: unknown;
}

export interface TableSchemaMeta {
  tableName: TableName;
  category: 'Portfolio' | 'Settings' | 'Mail' | 'Zahid OS';
  description: string;
  columns: TableColumnDef[];
  sampleRow: Record<string, unknown>;
}

/**
 * Complete metadata and typed sample rows for all 23 current relational tables.
 * Used whenever a table is empty so backups provide column headers and explicit row types.
 */
export const TABLE_SCHEMAS: Record<TableName, TableSchemaMeta> = {
  profiles: {
    tableName: 'profiles',
    category: 'Portfolio',
    description: 'Personal identity, bio headline, avatar URL, availability & company roles',
    columns: [
      { name: 'id', type: 'text', nullable: false, sample: 'profile_0xzahidp' },
      { name: 'username', type: 'text', nullable: false, sample: '0xzahidp' },
      { name: 'full_name', type: 'text', nullable: false, sample: 'Md Zahid Hasan Patwary' },
      { name: 'headline', type: 'text', nullable: false, sample: 'Full-Stack & Systems Engineer' },
      { name: 'bio', type: 'text', nullable: false, sample: 'Crafting resilient web architectures.' },
      { name: 'avatar_url', type: 'text', nullable: false, sample: 'https://github.com/0xZahidp.png' },
      { name: 'location', type: 'text', nullable: false, sample: 'Dhaka, Bangladesh' },
      { name: 'timezone', type: 'text', nullable: false, sample: 'Asia/Dhaka (UTC+6)' },
      { name: 'availability', type: 'text', nullable: false, sample: 'Available for high-impact contracts' },
      { name: 'github_followers_count', type: 'integer', nullable: false, sample: 150 },
      { name: 'roles', type: 'jsonb', nullable: false, sample: ['Founder', 'Systems Engineer'] },
      { name: 'updated_at', type: 'timestamp with time zone', nullable: false, sample: '2026-11-10T12:00:00Z' },
    ],
    sampleRow: {
      _row_type: 'sample',
      id: 'profile_sample_1',
      username: 'sample_user',
      full_name: 'Sample Full Name',
      headline: 'Software Engineer (TEXT)',
      bio: 'Sample engineering biography (TEXT)',
      avatar_url: 'https://example.com/avatar.png',
      location: 'Dhaka, Bangladesh (TEXT)',
      timezone: 'Asia/Dhaka (TEXT)',
      availability: 'Available (TEXT)',
      github_followers_count: 100,
      roles: ['Engineer', 'Architect'],
      updated_at: '2026-11-10T12:00:00Z',
    },
  },

  bio_paragraphs: {
    tableName: 'bio_paragraphs',
    category: 'Portfolio',
    description: 'Multi-paragraph storytelling blocks rendered in the About section',
    columns: [
      { name: 'id', type: 'text', nullable: false, sample: 'bio_sample_1' },
      { name: 'sort_order', type: 'integer', nullable: false, sample: 0 },
      { name: 'content', type: 'text', nullable: false, sample: 'Paragraph narrative describing technical focus.' },
      { name: 'updated_at', type: 'timestamp with time zone', nullable: false, sample: '2026-11-10T12:00:00Z' },
    ],
    sampleRow: {
      _row_type: 'sample',
      id: 'bio_sample_1',
      sort_order: 0,
      content: 'Sample biography storytelling paragraph block (TEXT).',
      updated_at: '2026-11-10T12:00:00Z',
    },
  },

  experiences: {
    tableName: 'experiences',
    category: 'Portfolio',
    description: 'Career positions, company affiliations, date ranges, and achievement highlights',
    columns: [
      { name: 'id', type: 'text', nullable: false, sample: 'exp_sample_1' },
      { name: 'company', type: 'text', nullable: false, sample: 'Acme Systems' },
      { name: 'company_url', type: 'text', nullable: true, sample: 'https://acme.example.com' },
      { name: 'company_logo', type: 'text', nullable: true, sample: 'https://acme.example.com/logo.png' },
      { name: 'position', type: 'text', nullable: false, sample: 'Senior Staff Engineer' },
      { name: 'period', type: 'text', nullable: false, sample: '2024 - Present' },
      { name: 'type', type: 'text', nullable: true, sample: 'Full-time' },
      { name: 'workplace_type', type: 'text', nullable: true, sample: 'Remote' },
      { name: 'description', type: 'text', nullable: true, sample: 'Leading core web infrastructure.' },
      { name: 'highlights', type: 'jsonb', nullable: false, sample: ['Cut p99 latency by 45%'] },
      { name: 'bullet_points', type: 'jsonb', nullable: false, sample: ['Architected distributed caching'] },
      { name: 'tags', type: 'jsonb', nullable: false, sample: ['TypeScript', 'Next.js', 'PostgreSQL'] },
      { name: 'is_current', type: 'boolean', nullable: true, sample: true },
      { name: 'sort_order', type: 'integer', nullable: false, sample: 0 },
      { name: 'updated_at', type: 'timestamp with time zone', nullable: false, sample: '2026-11-10T12:00:00Z' },
    ],
    sampleRow: {
      _row_type: 'sample',
      id: 'exp_sample_1',
      company: 'Sample Tech Corp (TEXT)',
      company_url: 'https://example.com',
      company_logo: '',
      position: 'Staff Engineer (TEXT)',
      period: '2024 - Present (TEXT)',
      type: 'Full-time',
      workplace_type: 'Remote',
      description: 'Overview of engineering accomplishments (TEXT)',
      highlights: ['Key architectural milestone (JSONB)'],
      bullet_points: ['Production optimization accomplishment (JSONB)'],
      tags: ['TypeScript', 'PostgreSQL', 'Next.js'],
      is_current: true,
      sort_order: 0,
      updated_at: '2026-11-10T12:00:00Z',
    },
  },

  projects: {
    tableName: 'projects',
    category: 'Portfolio',
    description: 'Featured products, SaaS tools, repositories, live URLs, badges & stars',
    columns: [
      { name: 'id', type: 'text', nullable: false, sample: 'proj_sample_1' },
      { name: 'title', type: 'text', nullable: false, sample: 'FolioFrame CMS' },
      { name: 'description', type: 'text', nullable: false, sample: 'High-performance portfolio engine.' },
      { name: 'url', type: 'text', nullable: false, sample: 'https://folioframe.dev' },
      { name: 'github_url', type: 'text', nullable: true, sample: 'https://github.com/0xZahidp/FolioFrame' },
      { name: 'tech_stack', type: 'jsonb', nullable: false, sample: ['Next.js', 'Tailwind', 'Supabase'] },
      { name: 'image', type: 'text', nullable: true, sample: '/projects/preview.png' },
      { name: 'featured', type: 'boolean', nullable: true, sample: true },
      { name: 'stars', type: 'integer', nullable: true, sample: 128 },
      { name: 'badge', type: 'text', nullable: true, sample: 'Active Project' },
      { name: 'sort_order', type: 'integer', nullable: false, sample: 0 },
      { name: 'updated_at', type: 'timestamp with time zone', nullable: false, sample: '2026-11-10T12:00:00Z' },
    ],
    sampleRow: {
      _row_type: 'sample',
      id: 'proj_sample_1',
      title: 'Sample Open-Source Tool (TEXT)',
      description: 'High-performance developer utility application (TEXT)',
      url: 'https://example.com/project',
      github_url: 'https://github.com/example/repo',
      tech_stack: ['Next.js', 'PostgreSQL', 'TypeScript'],
      image: '',
      featured: true,
      stars: 42,
      badge: 'Featured (TEXT)',
      sort_order: 0,
      updated_at: '2026-11-10T12:00:00Z',
    },
  },

  skills: {
    tableName: 'skills',
    category: 'Portfolio',
    description: 'Categorized 3D tactile pills across AI, Frameworks, and Tools',
    columns: [
      { name: 'id', type: 'text', nullable: false, sample: 'skill_sample_1' },
      { name: 'name', type: 'text', nullable: false, sample: 'TypeScript' },
      { name: 'category', type: 'text', nullable: false, sample: 'languages' },
      { name: 'color', type: 'text', nullable: true, sample: '#3178C6' },
      { name: 'sort_order', type: 'integer', nullable: false, sample: 0 },
      { name: 'updated_at', type: 'timestamp with time zone', nullable: false, sample: '2026-11-10T12:00:00Z' },
    ],
    sampleRow: {
      _row_type: 'sample',
      id: 'skill_sample_1',
      name: 'Sample Skill (TEXT)',
      category: 'frameworks',
      color: '#3B82F6',
      sort_order: 0,
      updated_at: '2026-11-10T12:00:00Z',
    },
  },

  languages: {
    tableName: 'languages',
    category: 'Portfolio',
    description: 'Language proficiencies, accent ratings, notes, and pronunciation indicators',
    columns: [
      { name: 'id', type: 'text', nullable: false, sample: 'lang-english' },
      { name: 'name', type: 'text', nullable: false, sample: 'English' },
      { name: 'proficiency', type: 'text', nullable: false, sample: 'Full Professional Working' },
      { name: 'rating', type: 'integer', nullable: false, sample: 5 },
      { name: 'notes', type: 'text', nullable: true, sample: 'Native-level technical articulation.' },
      { name: 'flag', type: 'text', nullable: true, sample: 'US' },
      { name: 'is_learning', type: 'boolean', nullable: true, sample: false },
      { name: 'sort_order', type: 'integer', nullable: false, sample: 0 },
      { name: 'updated_at', type: 'timestamp with time zone', nullable: false, sample: '2026-11-10T12:00:00Z' },
    ],
    sampleRow: {
      _row_type: 'sample',
      id: 'lang_sample_1',
      name: 'Sample Language (TEXT)',
      proficiency: 'Fluent (TEXT)',
      rating: 5,
      notes: 'Sample pronunciation and speaking notes (TEXT)',
      flag: 'US',
      is_learning: false,
      sort_order: 0,
      updated_at: '2026-11-10T12:00:00Z',
    },
  },

  social_links: {
    tableName: 'social_links',
    category: 'Portfolio',
    description: 'External handles and profile URLs for GitHub, LinkedIn, X, and platforms',
    columns: [
      { name: 'id', type: 'text', nullable: false, sample: 'soc_sample_1' },
      { name: 'platform', type: 'text', nullable: false, sample: 'github' },
      { name: 'url', type: 'text', nullable: false, sample: 'https://github.com/0xZahidp' },
      { name: 'handle', type: 'text', nullable: true, sample: '@0xZahidp' },
      { name: 'label', type: 'text', nullable: true, sample: 'GitHub' },
      { name: 'sort_order', type: 'integer', nullable: false, sample: 0 },
      { name: 'updated_at', type: 'timestamp with time zone', nullable: false, sample: '2026-11-10T12:00:00Z' },
    ],
    sampleRow: {
      _row_type: 'sample',
      id: 'soc_sample_1',
      platform: 'github',
      url: 'https://github.com/sample',
      handle: '@sample_handle',
      label: 'GitHub Profile',
      sort_order: 0,
      updated_at: '2026-11-10T12:00:00Z',
    },
  },

  suggested_people: {
    tableName: 'suggested_people',
    category: 'Portfolio',
    description: 'Right sidebar mentor and peer follow recommendations',
    columns: [
      { name: 'id', type: 'text', nullable: false, sample: 'person_sample_1' },
      { name: 'name', type: 'text', nullable: false, sample: 'Guillermo Rauch' },
      { name: 'role', type: 'text', nullable: true, sample: 'CEO at Vercel' },
      { name: 'avatar_url', type: 'text', nullable: true, sample: 'https://github.com/rauchg.png' },
      { name: 'url', type: 'text', nullable: true, sample: 'https://x.com/rauchg' },
      { name: 'handle', type: 'text', nullable: true, sample: '@rauchg' },
      { name: 'primary_handle', type: 'text', nullable: true, sample: '@rauchg' },
      { name: 'primary_platform', type: 'text', nullable: true, sample: 'x' },
      { name: 'primary_url', type: 'text', nullable: true, sample: 'https://x.com/rauchg' },
      { name: 'quote', type: 'text', nullable: true, sample: 'Make the Web. Faster.' },
      { name: 'verified', type: 'boolean', nullable: true, sample: true },
      { name: 'tags', type: 'jsonb', nullable: true, sample: ['Vercel', 'Next.js'] },
      { name: 'platforms', type: 'jsonb', nullable: true, sample: [] },
      { name: 'sort_order', type: 'integer', nullable: false, sample: 0 },
      { name: 'updated_at', type: 'timestamp with time zone', nullable: false, sample: '2026-11-10T12:00:00Z' },
    ],
    sampleRow: {
      _row_type: 'sample',
      id: 'person_sample_1',
      name: 'Sample Person Name (TEXT)',
      role: 'Staff Architect (TEXT)',
      avatar_url: 'https://example.com/avatar.jpg',
      url: 'https://x.com/sample',
      handle: '@sample',
      primary_handle: '@sample',
      primary_platform: 'x',
      primary_url: 'https://x.com/sample',
      quote: 'Inspiring software quote (TEXT)',
      verified: true,
      tags: ['Engineering', 'Design'],
      platforms: [],
      sort_order: 0,
      updated_at: '2026-11-10T12:00:00Z',
    },
  },

  portfolio_content: {
    tableName: 'portfolio_content',
    category: 'Portfolio',
    description: 'Unified monolithic JSON snapshot document of entire site portfolio',
    columns: [
      { name: 'id', type: 'text', nullable: false, sample: 'main' },
      { name: 'content', type: 'jsonb', nullable: false, sample: { site: 'FolioFrame' } },
      { name: 'version', type: 'integer', nullable: false, sample: 1 },
      { name: 'updated_at', type: 'timestamp with time zone', nullable: false, sample: '2026-11-10T12:00:00Z' },
    ],
    sampleRow: {
      _row_type: 'sample',
      id: 'main',
      content: { note: 'Sample portfolio content JSON object (JSONB)' },
      version: 1,
      updated_at: '2026-11-10T12:00:00Z',
    },
  },

  site_settings: {
    tableName: 'site_settings',
    category: 'Settings',
    description: 'Works configuration, based in clock settings, career data & short links',
    columns: [
      { name: 'key', type: 'text', nullable: false, sample: 'career_applications' },
      { name: 'value', type: 'jsonb', nullable: false, sample: { version: 1, data: [] } },
      { name: 'updated_at', type: 'timestamp with time zone', nullable: false, sample: '2026-11-10T12:00:00Z' },
    ],
    sampleRow: {
      _row_type: 'sample',
      key: 'sample_setting_key (TEXT)',
      value: { description: 'Sample JSONB setting value' },
      updated_at: '2026-11-10T12:00:00Z',
    },
  },

  app_settings: {
    tableName: 'app_settings',
    category: 'Settings',
    description: 'Global application secrets, rate limit tokens, and infrastructure configurations',
    columns: [
      { name: 'key', type: 'text', nullable: false, sample: 'RESEND_WEBHOOK_SECRET' },
      { name: 'value', type: 'text', nullable: false, sample: 'whsec_sample' },
      { name: 'is_secret', type: 'boolean', nullable: true, sample: true },
      { name: 'description', type: 'text', nullable: true, sample: 'Resend inbound webhook HMAC secret' },
      { name: 'updated_at', type: 'timestamp with time zone', nullable: false, sample: '2026-11-10T12:00:00Z' },
    ],
    sampleRow: {
      _row_type: 'sample',
      key: 'SAMPLE_CONFIG_KEY (TEXT)',
      value: 'sample_value (TEXT)',
      is_secret: false,
      description: 'Configuration description (TEXT)',
      updated_at: '2026-11-10T12:00:00Z',
    },
  },

  inbox_messages: {
    tableName: 'inbox_messages',
    category: 'Mail',
    description: 'Incoming inquiry emails, client contact messages, and dispatch records',
    columns: [
      { name: 'id', type: 'text', nullable: false, sample: 'msg_sample_1' },
      { name: 'name', type: 'text', nullable: false, sample: 'Alex Mercer' },
      { name: 'email', type: 'text', nullable: false, sample: 'alex@example.com' },
      { name: 'subject', type: 'text', nullable: false, sample: 'Engineering Collaboration' },
      { name: 'body', type: 'text', nullable: false, sample: 'Looking forward to working together.' },
      { name: 'status', type: 'text', nullable: false, sample: 'unread' },
      { name: 'is_starred', type: 'boolean', nullable: true, sample: false },
      { name: 'is_sent', type: 'boolean', nullable: true, sample: false },
      { name: 'recipient', type: 'text', nullable: true, sample: 'contact@0xzahidp.com' },
      { name: 'created_at', type: 'timestamp with time zone', nullable: false, sample: '2026-11-10T12:00:00Z' },
      { name: 'resend_id', type: 'text', nullable: true, sample: 'msg_resend_1' },
      { name: 'from_name', type: 'text', nullable: true, sample: 'Alex Mercer' },
      { name: 'from_email', type: 'text', nullable: true, sample: 'alex@example.com' },
      { name: 'to_email', type: 'text', nullable: true, sample: 'contact@0xzahidp.com' },
      { name: 'text_body', type: 'text', nullable: true, sample: 'Looking forward to working together.' },
      { name: 'html_body', type: 'text', nullable: true, sample: '<p>Looking forward to working together.</p>' },
      { name: 'received_at', type: 'timestamp with time zone', nullable: true, sample: '2026-11-10T12:00:00Z' },
      { name: 'is_read', type: 'boolean', nullable: true, sample: false },
      { name: 'is_trashed', type: 'boolean', nullable: true, sample: false },
      { name: 'label', type: 'text', nullable: true, sample: 'work' },
      { name: 'direction', type: 'text', nullable: true, sample: 'inbound' },
      { name: 'in_reply_to', type: 'text', nullable: true, sample: '' },
      { name: 'references_header', type: 'text', nullable: true, sample: '' },
      { name: 'raw_headers', type: 'jsonb', nullable: true, sample: {} },
      { name: 'attachments', type: 'jsonb', nullable: true, sample: [] },
      { name: 'thread_id', type: 'text', nullable: true, sample: 'thread_sample_1' },
      { name: 'read_at', type: 'timestamp with time zone', nullable: true, sample: null },
      { name: 'mailbox', type: 'text', nullable: true, sample: 'official' },
    ],
    sampleRow: {
      _row_type: 'sample',
      id: 'msg_sample_1',
      name: 'Sample Sender (TEXT)',
      email: 'sender@example.com (TEXT)',
      subject: 'Sample Subject Inquiry (TEXT)',
      body: 'Sample incoming email message text body (TEXT)',
      status: 'read',
      is_starred: false,
      is_sent: false,
      recipient: 'hello@0xzahidp.com',
      created_at: '2026-11-10T12:00:00Z',
      resend_id: 'resend_sample_id',
      from_name: 'Sample Sender',
      from_email: 'sender@example.com',
      to_email: 'hello@0xzahidp.com',
      text_body: 'Sample message body (TEXT)',
      html_body: '<p>Sample HTML message body (TEXT)</p>',
      received_at: '2026-11-10T12:00:00Z',
      is_read: true,
      is_trashed: false,
      label: 'work',
      direction: 'inbound',
      in_reply_to: '',
      references_header: '',
      raw_headers: {},
      attachments: [],
      thread_id: 'thread_sample_1',
      read_at: '2026-11-10T12:00:00Z',
      mailbox: 'official',
    },
  },

  inbox_deleted_resend_ids: {
    tableName: 'inbox_deleted_resend_ids',
    category: 'Mail',
    description: 'Tombstones preventing previously deleted Resend emails from re-importing',
    columns: [
      { name: 'resend_id', type: 'text', nullable: false, sample: 'resend_msg_sample_123' },
      { name: 'deleted_at', type: 'timestamp with time zone', nullable: false, sample: '2026-11-10T12:00:00Z' },
    ],
    sampleRow: {
      _row_type: 'sample',
      resend_id: 'resend_msg_sample_tombstone_id (TEXT)',
      deleted_at: '2026-11-10T12:00:00Z',
    },
  },

  os_mail_domains: {
    tableName: 'os_mail_domains',
    category: 'Mail',
    description: 'Verified inbound email domains connected via Resend Webhooks API',
    columns: [
      { name: 'id', type: 'uuid', nullable: false, sample: '00000000-0000-0000-0000-000000000001' },
      { name: 'domain', type: 'text', nullable: false, sample: 'inbox.example.com' },
      { name: 'resend_domain_id', type: 'text', nullable: false, sample: 'domain_resend_sample_123' },
      { name: 'status', type: 'text', nullable: false, sample: 'verified' },
      { name: 'created_at', type: 'timestamp with time zone', nullable: false, sample: '2026-11-10T12:00:00Z' },
    ],
    sampleRow: {
      _row_type: 'sample',
      id: '00000000-0000-0000-0000-000000000001',
      domain: 'sample.domain.com (TEXT)',
      resend_domain_id: 'resend_dom_sample_123 (TEXT)',
      status: 'verified (TEXT)',
      created_at: '2026-11-10T12:00:00Z',
    },
  },

  os_settings: {
    tableName: 'os_settings',
    category: 'Zahid OS',
    description: 'Desktop wallpaper, sound toggles, public launchpad permissions & appearance',
    columns: [
      { name: 'id', type: 'text', nullable: false, sample: 'singleton' },
      { name: 'is_public_enabled', type: 'boolean', nullable: false, sample: true },
      { name: 'allow_public_link_creation', type: 'boolean', nullable: false, sample: true },
      { name: 'public_hero_title', type: 'text', nullable: false, sample: 'Zahid OS' },
      { name: 'public_hero_subtitle', type: 'text', nullable: false, sample: 'Web Utilities & Micro-Apps' },
      { name: 'wallpaper', type: 'text', nullable: false, sample: 'zos-emerald' },
      { name: 'sound_effects', type: 'boolean', nullable: false, sample: true },
      { name: 'app_permissions', type: 'jsonb', nullable: false, sample: { shortener: { is_public: true } } },
      { name: 'version', type: 'integer', nullable: false, sample: 1 },
      { name: 'updated_at', type: 'timestamp with time zone', nullable: false, sample: '2026-11-10T12:00:00Z' },
    ],
    sampleRow: {
      _row_type: 'sample',
      id: 'singleton',
      is_public_enabled: true,
      allow_public_link_creation: false,
      public_hero_title: 'Zahid OS (TEXT)',
      public_hero_subtitle: 'Developer Workspace & Tools (TEXT)',
      wallpaper: 'zos-emerald',
      sound_effects: true,
      app_permissions: { shortener: { is_public: true, name: 'Shortener' } },
      version: 1,
      updated_at: '2026-11-10T12:00:00Z',
    },
  },

  os_short_links: {
    tableName: 'os_short_links',
    category: 'Zahid OS',
    description: 'Custom URL shortener links, vanity slugs, target redirections & click analytics',
    columns: [
      { name: 'id', type: 'text', nullable: false, sample: 'sl_sample_1' },
      { name: 'slug', type: 'text', nullable: false, sample: 'github' },
      { name: 'original_url', type: 'text', nullable: false, sample: 'https://github.com/0xZahidp' },
      { name: 'title', type: 'text', nullable: false, sample: 'GitHub Profile' },
      { name: 'description', type: 'text', nullable: true, sample: 'Main GitHub profile page' },
      { name: 'clicks', type: 'integer', nullable: false, sample: 420 },
      { name: 'is_active', type: 'boolean', nullable: false, sample: true },
      { name: 'created_at', type: 'timestamp with time zone', nullable: false, sample: '2026-11-10T12:00:00Z' },
      { name: 'updated_at', type: 'timestamp with time zone', nullable: false, sample: '2026-11-10T12:00:00Z' },
    ],
    sampleRow: {
      _row_type: 'sample',
      id: 'sl_sample_1',
      slug: 'sample-slug',
      original_url: 'https://example.com/target-destination',
      title: 'Sample Shortcut (TEXT)',
      description: 'Destination description (TEXT)',
      clicks: 0,
      is_active: true,
      created_at: '2026-11-10T12:00:00Z',
      updated_at: '2026-11-10T12:00:00Z',
    },
  },

  os_snippets: {
    tableName: 'os_snippets',
    category: 'Zahid OS',
    description: 'Developer code snippets, shell one-liners, cheat sheets & quick templates',
    columns: [
      { name: 'id', type: 'text', nullable: false, sample: 'snip-sample-1' },
      { name: 'title', type: 'text', nullable: false, sample: 'Supabase Service Client' },
      { name: 'language', type: 'text', nullable: true, sample: 'TypeScript' },
      { name: 'description', type: 'text', nullable: true, sample: 'Server-side admin client initialization' },
      { name: 'code', type: 'text', nullable: false, sample: 'export const supabase = createClient(...);' },
      { name: 'sort_order', type: 'integer', nullable: false, sample: 0 },
      { name: 'created_at', type: 'timestamp with time zone', nullable: false, sample: '2026-11-10T12:00:00Z' },
      { name: 'updated_at', type: 'timestamp with time zone', nullable: false, sample: '2026-11-10T12:00:00Z' },
    ],
    sampleRow: {
      _row_type: 'sample',
      id: 'snip-sample-1',
      title: 'Sample Code Snippet (TEXT)',
      language: 'TypeScript',
      description: 'Useful helper snippet description (TEXT)',
      code: 'console.log("Hello from Zahid OS!");',
      sort_order: 0,
      created_at: '2026-11-10T12:00:00Z',
      updated_at: '2026-11-10T12:00:00Z',
    },
  },

  os_notes: {
    tableName: 'os_notes',
    category: 'Zahid OS',
    description: 'Instant scratchpad, private memos, ideas, and quick developer notes',
    columns: [
      { name: 'id', type: 'text', nullable: false, sample: 'main_scratchpad' },
      { name: 'title', type: 'text', nullable: true, sample: 'Admin Notes' },
      { name: 'content', type: 'text', nullable: true, sample: 'Jot down thoughts, ideas, and code memos.' },
      { name: 'created_at', type: 'timestamp with time zone', nullable: false, sample: '2026-11-10T12:00:00Z' },
      { name: 'updated_at', type: 'timestamp with time zone', nullable: false, sample: '2026-11-10T12:00:00Z' },
    ],
    sampleRow: {
      _row_type: 'sample',
      id: 'main_scratchpad',
      title: 'Admin Notes (TEXT)',
      content: 'Sample note content - thoughts, project ideas, and memos (TEXT)',
      created_at: '2026-11-10T12:00:00Z',
      updated_at: '2026-11-10T12:00:00Z',
    },
  },

  os_temp_inboxes: {
    tableName: 'os_temp_inboxes',
    category: 'Zahid OS',
    description: 'Disposable temporary email inboxes, auto-expiring addresses & tokens',
    columns: [
      { name: 'id', type: 'text', nullable: false, sample: 'inbox_sample_1' },
      { name: 'address', type: 'text', nullable: false, sample: 'devtest@temp.0xzahidp.com' },
      { name: 'domain', type: 'text', nullable: false, sample: 'temp.0xzahidp.com' },
      { name: 'created_at', type: 'timestamp with time zone', nullable: false, sample: '2026-11-10T12:00:00Z' },
      { name: 'expires_at', type: 'timestamp with time zone', nullable: false, sample: '2026-11-10T13:00:00Z' },
      { name: 'is_active', type: 'boolean', nullable: false, sample: true },
    ],
    sampleRow: {
      _row_type: 'sample',
      id: 'inbox_sample_1',
      address: 'sample-disposable@domain.com (TEXT)',
      domain: 'domain.com (TEXT)',
      created_at: '2026-11-10T12:00:00Z',
      expires_at: '2026-11-10T13:00:00Z',
      is_active: true,
    },
  },

  os_temp_messages: {
    tableName: 'os_temp_messages',
    category: 'Zahid OS',
    description: 'Inbound disposable messages, parsed OTP authentication codes & links',
    columns: [
      { name: 'id', type: 'text', nullable: false, sample: 'tmsg_sample_1' },
      { name: 'inbox_id', type: 'text', nullable: false, sample: 'inbox_sample_1' },
      { name: 'from_address', type: 'text', nullable: false, sample: 'verify@auth.service.com' },
      { name: 'to_address', type: 'text', nullable: false, sample: 'devtest@temp.0xzahidp.com' },
      { name: 'subject', type: 'text', nullable: false, sample: 'Your verification OTP code' },
      { name: 'text_body', type: 'text', nullable: true, sample: 'Your verification code is 482910' },
      { name: 'html_body', type: 'text', nullable: true, sample: '<p>Your verification code is <b>482910</b></p>' },
      { name: 'otp_code', type: 'text', nullable: true, sample: '482910' },
      { name: 'verification_link', type: 'text', nullable: true, sample: 'https://auth.service.com/verify?token=xyz' },
      { name: 'is_read', type: 'boolean', nullable: false, sample: false },
      { name: 'received_at', type: 'timestamp with time zone', nullable: false, sample: '2026-11-10T12:00:00Z' },
      { name: 'expires_at', type: 'timestamp with time zone', nullable: false, sample: '2026-11-10T13:00:00Z' },
    ],
    sampleRow: {
      _row_type: 'sample',
      id: 'tmsg_sample_1',
      inbox_id: 'inbox_sample_1',
      from_address: 'no-reply@example.com (TEXT)',
      to_address: 'sample-disposable@domain.com (TEXT)',
      subject: 'Your Login Verification Code (TEXT)',
      text_body: 'Verification code is 123456 (TEXT)',
      html_body: '<p>Verification code is <b>123456</b> (TEXT)</p>',
      otp_code: '123456',
      verification_link: 'https://example.com/verify?token=abc',
      is_read: false,
      received_at: '2026-11-10T12:00:00Z',
      expires_at: '2026-11-10T13:00:00Z',
    },
  },

  os_api_saved_requests: {
    tableName: 'os_api_saved_requests',
    category: 'Zahid OS',
    description: 'Saved HTTP endpoint templates, test payloads, and API Playground collections',
    columns: [
      { name: 'id', type: 'text', nullable: false, sample: 'req_sample_1' },
      { name: 'name', type: 'text', nullable: false, sample: 'GitHub User Profile' },
      { name: 'method', type: 'text', nullable: false, sample: 'GET' },
      { name: 'url', type: 'text', nullable: false, sample: 'https://api.github.com/users/0xzahidp' },
      { name: 'headers', type: 'jsonb', nullable: true, sample: { Accept: 'application/json' } },
      { name: 'body', type: 'text', nullable: true, sample: '' },
      { name: 'tags', type: 'ARRAY', nullable: true, sample: ['github', 'profile'] },
      { name: 'created_at', type: 'timestamp with time zone', nullable: false, sample: '2026-11-10T12:00:00Z' },
      { name: 'updated_at', type: 'timestamp with time zone', nullable: false, sample: '2026-11-10T12:00:00Z' },
    ],
    sampleRow: {
      _row_type: 'sample',
      id: 'req_sample_1',
      name: 'Sample API GET Request (TEXT)',
      method: 'GET',
      url: 'https://api.github.com/users/0xzahidp',
      headers: { 'Content-Type': 'application/json' },
      body: '',
      tags: ['public', 'github'],
      created_at: '2026-11-10T12:00:00Z',
      updated_at: '2026-11-10T12:00:00Z',
    },
  },

  os_travel_districts: {
    tableName: 'os_travel_districts',
    category: 'Zahid OS',
    description: '64 Bangladesh districts exploration tracker, visited status, and memories',
    columns: [
      { name: 'code', type: 'character varying', nullable: false, sample: 'DHA' },
      { name: 'name', type: 'character varying', nullable: false, sample: 'Dhaka' },
      { name: 'bn_name', type: 'character varying', nullable: false, sample: 'ঢাকা' },
      { name: 'division', type: 'character varying', nullable: false, sample: 'Dhaka' },
      { name: 'slug', type: 'character varying', nullable: false, sample: 'dhaka' },
      { name: 'status', type: 'character varying', nullable: false, sample: 'visited' },
      { name: 'visits_count', type: 'integer', nullable: false, sample: 12 },
      { name: 'rating', type: 'integer', nullable: false, sample: 5 },
      { name: 'notes', type: 'text', nullable: true, sample: 'Capital district base & engineering hub.' },
      { name: 'places', type: 'ARRAY', nullable: true, sample: ['Lalbagh Fort', 'Ahsan Manzil'] },
      { name: 'last_visited_at', type: 'date', nullable: true, sample: '2026-01-01' },
      { name: 'created_at', type: 'timestamp with time zone', nullable: false, sample: '2026-11-10T12:00:00Z' },
      { name: 'updated_at', type: 'timestamp with time zone', nullable: false, sample: '2026-11-10T12:00:00Z' },
    ],
    sampleRow: {
      _row_type: 'sample',
      code: 'DHA',
      name: 'Dhaka (VARCHAR)',
      bn_name: 'ঢাকা (VARCHAR)',
      division: 'Dhaka (VARCHAR)',
      slug: 'dhaka',
      status: 'visited',
      visits_count: 5,
      rating: 5,
      notes: 'Sample district notes (TEXT)',
      places: ['Place 1', 'Place 2'],
      last_visited_at: '2026-01-01',
      created_at: '2026-11-10T12:00:00Z',
      updated_at: '2026-11-10T12:00:00Z',
    },
  },

  os_travel_memories: {
    tableName: 'os_travel_memories',
    category: 'Zahid OS',
    description: 'Travel logbook memories, photography timestamps, coordinates & ratings',
    columns: [
      { name: 'id', type: 'text', nullable: false, sample: 'mem_sample_1' },
      { name: 'district_code', type: 'character varying', nullable: false, sample: 'COX' },
      { name: 'title', type: 'character varying', nullable: false, sample: 'Marine Drive Sunset Expedition' },
      { name: 'place_name', type: 'character varying', nullable: false, sample: 'Inani Coral Beach' },
      { name: 'date', type: 'date', nullable: false, sample: '2026-02-14' },
      { name: 'transport', type: 'character varying', nullable: true, sample: 'Open Jeep' },
      { name: 'rating', type: 'integer', nullable: false, sample: 5 },
      { name: 'notes', type: 'text', nullable: true, sample: 'Golden hour cruise with ocean breeze.' },
      { name: 'tags', type: 'ARRAY', nullable: true, sample: ['beach', 'sunset', 'ocean'] },
      { name: 'photos', type: 'ARRAY', nullable: true, sample: [] },
      { name: 'created_at', type: 'timestamp with time zone', nullable: false, sample: '2026-11-10T12:00:00Z' },
    ],
    sampleRow: {
      _row_type: 'sample',
      id: 'mem_sample_1',
      district_code: 'COX',
      title: 'Sample Travel Memory (VARCHAR)',
      place_name: 'Sample Place Name (VARCHAR)',
      date: '2026-01-01',
      transport: 'Jeep',
      rating: 5,
      notes: 'Sample memory narrative notes (TEXT)',
      tags: ['nature', 'travel'],
      photos: [],
      created_at: '2026-11-10T12:00:00Z',
    },
  },
};

/**
 * Sanitize backup export data:
 * Exclude per-domain Resend keys and secrets from app_settings,
 * and strip raw keys from site_settings temp_mail_domains.
 */
function sanitizeBackupRows(tableName: string, rows: Record<string, unknown>[]): Record<string, unknown>[] {
  if (tableName === 'app_settings') {
    return rows.filter((row) => {
      const key = String(row.key || '').toUpperCase();
      return !key.startsWith('RESEND_KEY_') && !row.is_secret;
    });
  }

  if (tableName === 'site_settings') {
    return rows.map((row) => {
      if (row.key === 'temp_mail_domains' && Array.isArray(row.value)) {
        return {
          ...row,
          value: row.value.map((d: Record<string, unknown>) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { resendApiKey, ...clean } = d;
            return {
              ...clean,
              resendApiKeyMasked: clean.resendApiKeyMasked
                ? `••••••••••••${String(clean.resendApiKeyMasked).slice(-4)}`
                : undefined,
            };
          }),
        };
      }
      return row;
    });
  }

  return rows;
}

/**
 * Read all data for a specific table (from Supabase if available, else from local JSON).
 * If the table is empty, returns sample data with explicit row types according to the table schema!
 */
export async function getTableRows(
  tableName: string,
  options?: { includeSampleIfEmpty?: boolean }
): Promise<Record<string, unknown>[]> {
  const includeSample = options?.includeSampleIfEmpty !== false;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // 1. Try Supabase
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      const { data, error } = await supabase.from(tableName).select('*');
      if (!error && Array.isArray(data) && data.length > 0) {
        return sanitizeBackupRows(tableName, data as Record<string, unknown>[]);
      }
    } catch {
      // Fallback
    }
  }

  // 2. Fallback to local files
  const localRows = await getLocalTableRows(tableName);
  if (localRows.length > 0) {
    return sanitizeBackupRows(tableName, localRows);
  }

  // 3. Table is completely empty: return sample row with typed schema if enabled
  if (includeSample) {
    const meta = TABLE_SCHEMAS[tableName as TableName];
    if (meta && meta.sampleRow) {
      return [meta.sampleRow];
    }
  }

  return [];
}

/**
 * Get rows from local JSON files
 */
export async function getLocalTableRows(tableName: string): Promise<Record<string, unknown>[]> {
  try {
    if (tableName === 'inbox_messages') {
      const inboxData = await fs.readFile(INBOX_FILE_PATH, 'utf-8').catch(() => '{"messages":[]}');
      const parsed = JSON.parse(inboxData);
      const messages = (Array.isArray(parsed) ? parsed : (parsed.messages || [])) as Record<string, unknown>[];
      return messages.map((m) => {
        const fromObj = m.from as { name?: string; email?: string } | undefined;
        const toArr = m.to as Array<{ name?: string; email?: string }> | undefined;
        return {
          id: m.id,
          name: fromObj?.name || (m.name as string) || '',
          email: fromObj?.email || (m.email as string) || '',
          subject: (m.subject as string) || '',
          body: (m.body as string) || (m.text_body as string) || '',
          status: (m.status as string) || 'read',
          is_starred: Boolean(m.isStarred || m.is_starred),
          is_sent: Boolean(m.is_sent),
          recipient: toArr?.[0]?.email || (m.recipient as string) || '',
          created_at: (m.createdAt || m.created_at || new Date().toISOString()) as string,
          text_body: (m.textBody || m.text_body || '') as string,
          html_body: (m.htmlBody || m.html_body || '') as string,
          is_read: m.isRead !== undefined ? Boolean(m.isRead) : true,
          is_trashed: Boolean(m.isTrashed || m.is_trashed),
          label: (m.label as string) || 'inbox',
          mailbox: (m.mailbox as string) || 'official',
        };
      });
    }

    if (tableName === 'os_notes') {
      try {
        const notesRaw = await fs.readFile(NOTES_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(notesRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        // Fallback
      }
    }

    if (tableName === 'os_travel_districts' || tableName === 'os_travel_memories') {
      try {
        const travelRaw = await fs.readFile(TRAVEL_FILE_PATH, 'utf-8');
        const travel = JSON.parse(travelRaw);
        if (tableName === 'os_travel_districts' && Array.isArray(travel.districts)) {
          return travel.districts;
        }
        if (tableName === 'os_travel_memories' && Array.isArray(travel.memories)) {
          return travel.memories;
        }
      } catch {
        // Fallback
      }
    }

    const contentRaw = await fs.readFile(CONTENT_FILE_PATH, 'utf-8').catch(() => '{}');
    const content = JSON.parse(contentRaw) as PortfolioContent;

    switch (tableName) {
      case 'profiles':
        return content.profile ? [{ ...content.profile, id: content.profile.id || 'profile-main' }] : [];
      case 'bio_paragraphs':
        return (content.bioParagraphs || []).map((p, i) => ({
          id: `bio-${i + 1}`,
          sort_order: i,
          content: p,
          updated_at: content.updatedAt || new Date().toISOString(),
        }));
      case 'experiences':
        return (content.experience || []).map((e, i) => ({
          ...e,
          sort_order: i,
          updated_at: content.updatedAt || new Date().toISOString(),
        }));
      case 'projects':
        return (content.projects || []).map((p, i) => ({
          ...p,
          sort_order: i,
          updated_at: content.updatedAt || new Date().toISOString(),
        }));
      case 'skills':
        return (content.skills || []).map((s, i) => ({
          ...s,
          sort_order: i,
          updated_at: content.updatedAt || new Date().toISOString(),
        }));
      case 'languages':
        return (content.languages || []).map((l, i) => ({
          id: `lang-${l.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          ...l,
          sort_order: i,
          updated_at: content.updatedAt || new Date().toISOString(),
        }));
      case 'social_links':
        return (content.socialLinks || []).map((s, i) => ({
          ...s,
          sort_order: i,
          updated_at: content.updatedAt || new Date().toISOString(),
        }));
      case 'suggested_people':
        return (content.suggestedPeople || []).map((p, i) => ({
          ...p,
          sort_order: i,
          updated_at: content.updatedAt || new Date().toISOString(),
        }));
      case 'portfolio_content':
        return [
          {
            id: 'main',
            content,
            version: 1,
            updated_at: content.updatedAt || new Date().toISOString(),
          },
        ];
      case 'site_settings':
        return [
          { key: 'works_settings', value: content.worksSettings },
          { key: 'based_in_settings', value: content.basedInSettings },
          { key: 'github_settings', value: content.githubSettings },
        ];
      default:
        return [];
    }
  } catch (err) {
    console.error(`Failed to read local rows for table ${tableName}:`, err);
    return [];
  }
}

/**
 * Save rows to a specific table (Supabase upsert + local file synchronization)
 */
export async function saveTableRows(
  tableName: string,
  rows: Record<string, unknown>[]
): Promise<{ success: boolean; count: number; error?: string }> {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { success: true, count: 0 };
  }

  // Filter out any sample/placeholder rows from being committed to the database
  const nonSampleRows = rows.filter((r) => r._row_type !== 'sample' && !r._is_sample_row);

  if (nonSampleRows.length === 0) {
    return { success: true, count: 0, error: 'Skipped placeholder sample row' };
  }

  // Filter out any secret keys from being restored/overwritten via backup import
  let safeRows = nonSampleRows;
  if (tableName === 'app_settings') {
    safeRows = nonSampleRows.filter((r) => {
      const key = String(r.key || '').toUpperCase();
      return !key.startsWith('RESEND_KEY_');
    });
  }

  let supabaseSuccess = false;
  let localSuccess = false;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // 1. Try Supabase Upsert
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      const { error } = await supabase.from(tableName).upsert(safeRows);
      if (!error) {
        supabaseSuccess = true;
      } else {
        console.warn(`Supabase upsert error on ${tableName}:`, error.message);
      }
    } catch (err) {
      console.warn(`Supabase connection error on ${tableName}:`, err);
    }
  }

  // 2. Synchronize to local files (if not on Vercel read-only runtime)
  if (!process.env.VERCEL) {
    try {
      await syncRowsToLocal(tableName, safeRows);
      localSuccess = true;
    } catch (err) {
      console.warn(`Local sync error on ${tableName}:`, err);
    }
  }

  if (!supabaseSuccess && !localSuccess) {
    throw new Error(`Failed to save table rows for ${tableName}`);
  }

  return {
    success: true,
    count: safeRows.length,
    error: supabaseSuccess ? undefined : 'Saved locally (Supabase table pending or unavailable)',
  };
}

/**
 * Synchronize table rows into local JSON files so local offline dev and SSR remain 100% in sync
 */
export async function syncRowsToLocal(tableName: string, rows: Record<string, unknown>[]): Promise<boolean> {
  if (process.env.VERCEL) {
    throw new Error('Local file writes are disabled on Vercel');
  }
  try {
    if (tableName === 'inbox_messages') {
      await fs.writeFile(INBOX_FILE_PATH, JSON.stringify(rows, null, 2), 'utf-8');
      return true;
    }

    if (tableName === 'os_notes') {
      await fs.writeFile(NOTES_FILE_PATH, JSON.stringify(rows, null, 2), 'utf-8');
      return true;
    }

    const contentRaw = await fs.readFile(CONTENT_FILE_PATH, 'utf-8').catch(() => '{}');
    const content = (JSON.parse(contentRaw) || {}) as PortfolioContent;

    switch (tableName) {
      case 'profiles':
        if (rows[0]) {
          content.profile = rows[0] as unknown as PortfolioContent['profile'];
        }
        break;
      case 'bio_paragraphs':
        content.bioParagraphs = rows
          .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
          .map((r) => String(r.content || ''));
        break;
      case 'experiences':
        content.experience = rows as unknown as PortfolioContent['experience'];
        break;
      case 'projects':
        content.projects = rows as unknown as PortfolioContent['projects'];
        break;
      case 'skills':
        content.skills = rows as unknown as PortfolioContent['skills'];
        break;
      case 'languages':
        content.languages = rows as unknown as PortfolioContent['languages'];
        break;
      case 'social_links':
        content.socialLinks = rows as unknown as PortfolioContent['socialLinks'];
        break;
      case 'suggested_people':
        content.suggestedPeople = rows as unknown as PortfolioContent['suggestedPeople'];
        break;
      case 'site_settings':
        rows.forEach((r) => {
          if (r.key === 'works_settings') content.worksSettings = r.value as PortfolioContent['worksSettings'];
          if (r.key === 'based_in_settings') content.basedInSettings = r.value as PortfolioContent['basedInSettings'];
          if (r.key === 'github_settings') content.githubSettings = r.value as PortfolioContent['githubSettings'];
        });
        break;
    }

    content.updatedAt = new Date().toISOString();
    await fs.writeFile(CONTENT_FILE_PATH, JSON.stringify(content, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to sync rows to local storage:', err);
    throw err;
  }
}
