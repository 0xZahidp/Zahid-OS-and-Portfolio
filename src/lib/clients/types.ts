export type ClientProjectStatus = 'active' | 'live' | 'maintenance' | 'completed' | 'paused';

export type ResourceCategory =
  | 'domain'
  | 'hosting'
  | 'database'
  | 'git'
  | 'email'
  | 'payments'
  | 'other';

export interface ResourceSecretItem {
  id: string;
  label: string;
  value: string;
  isSecret: boolean;
}

export interface ClientResource {
  id: string;
  client_id: string;
  created_at: string;
  updated_at: string;
  category: ResourceCategory;
  provider: string;
  resource_name: string;
  account_email: string;
  account_username: string;
  connected_git_repo: string;
  dashboard_url: string;
  renewal_date: string | null;
  billing_notes: string;
  metadata: Record<string, string>;
  secrets: ResourceSecretItem[];
  has_secrets: boolean;
  notes: string;
}

export interface ClientProject {
  id: string;
  created_at: string;
  updated_at: string;
  client_name: string;
  project_name: string;
  summary: string;
  primary_domain: string;
  status: ClientProjectStatus;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  contact_handle: string;
  tech_stack: string[];
  notes: string;
  resources: ClientResource[];
}

export interface ProviderPreset {
  id: string;
  label: string;
  category: ResourceCategory;
  provider: string;
  resourcePlaceholder: string;
  metadataKeys: { key: string; label: string; placeholder: string }[];
  defaultSecretLabels: string[];
}

export const RESOURCE_CATEGORIES: { id: ResourceCategory; label: string; description: string }[] = [
  { id: 'domain', label: 'Domain & DNS', description: 'Registrars, DNS zones, nameservers & renewals' },
  { id: 'hosting', label: 'Hosting & Compute', description: 'Vercel, Cloudflare, Railway, VPS, AWS, Netlify' },
  { id: 'database', label: 'Database & BaaS', description: 'Supabase, Neon, Postgres, Firebase, MongoDB' },
  { id: 'git', label: 'Source Control (Git)', description: 'GitHub, GitLab, Bitbucket repositories' },
  { id: 'email', label: 'Email & SMTP', description: 'Resend, SendGrid, Google Workspace, Zoho' },
  { id: 'payments', label: 'Payments & Billing', description: 'Stripe, SSLCommerz, LemonSqueezy, bKash' },
  { id: 'other', label: 'Other / Custom', description: 'Analytics, CDN, AI APIs, Storage, CMS' },
];

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: 'domain_registrar',
    label: 'Domain Registrar',
    category: 'domain',
    provider: 'Namecheap',
    resourcePlaceholder: 'e.g. clientdomain.com',
    metadataKeys: [
      { key: 'nameservers', label: 'Nameservers / DNS', placeholder: 'e.g. Cloudflare DNS' },
      { key: 'purchased_at', label: 'Purchased Date', placeholder: 'e.g. 2026-01-15' },
    ],
    defaultSecretLabels: ['Registrar Password', '2FA Backup / PIN'],
  },
  {
    id: 'supabase',
    label: 'Supabase',
    category: 'database',
    provider: 'Supabase',
    resourcePlaceholder: 'e.g. client-prod-db',
    metadataKeys: [
      { key: 'project_ref', label: 'Project Ref / ID', placeholder: 'e.g. txrnbazpdyoaazszkwwq' },
      { key: 'region', label: 'Region', placeholder: 'e.g. ap-southeast-1' },
    ],
    defaultSecretLabels: ['Account Password', 'Database Password', 'Service Role Key'],
  },
  {
    id: 'vercel',
    label: 'Vercel',
    category: 'hosting',
    provider: 'Vercel',
    resourcePlaceholder: 'e.g. client-web-prod',
    metadataKeys: [
      { key: 'branch', label: 'Production Branch', placeholder: 'e.g. main' },
      { key: 'team', label: 'Team / Scope', placeholder: 'e.g. 0xZahidP' },
    ],
    defaultSecretLabels: ['Vercel Account Password', 'Deploy Hook / Token'],
  },
  {
    id: 'github',
    label: 'GitHub',
    category: 'git',
    provider: 'GitHub',
    resourcePlaceholder: 'e.g. 0xZahidP/client-app',
    metadataKeys: [
      { key: 'branch', label: 'Default Branch', placeholder: 'main' },
      { key: 'visibility', label: 'Visibility', placeholder: 'Private' },
    ],
    defaultSecretLabels: ['GitHub Password', 'Personal Access Token (PAT)'],
  },
  {
    id: 'cloudflare',
    label: 'Cloudflare',
    category: 'hosting',
    provider: 'Cloudflare',
    resourcePlaceholder: 'e.g. clientdomain.com (Pages / DNS)',
    metadataKeys: [
      { key: 'zone_id', label: 'Zone ID', placeholder: 'Optional Zone ID' },
      { key: 'ssl_mode', label: 'SSL Mode', placeholder: 'Full (Strict)' },
    ],
    defaultSecretLabels: ['Cloudflare Password', 'API Token'],
  },
  {
    id: 'vps_coolify',
    label: 'VPS / Coolify / Railway',
    category: 'hosting',
    provider: 'Hetzner / Railway',
    resourcePlaceholder: 'e.g. prod-vps-01',
    metadataKeys: [
      { key: 'server_ip', label: 'Server IP / Host', placeholder: 'e.g. 192.168.1.1' },
      { key: 'os_stack', label: 'Stack / OS', placeholder: 'Ubuntu 24.04 + Docker + Coolify' },
    ],
    defaultSecretLabels: ['Root / Panel Password', 'SSH Private Key'],
  },
  {
    id: 'neon_postgres',
    label: 'Neon / Postgres / MongoDB',
    category: 'database',
    provider: 'Neon',
    resourcePlaceholder: 'e.g. client-postgres',
    metadataKeys: [
      { key: 'region', label: 'Region', placeholder: 'aws-ap-southeast-1' },
    ],
    defaultSecretLabels: ['Connection String (URI)', 'Database Password'],
  },
  {
    id: 'email_provider',
    label: 'Resend / Email / SMTP',
    category: 'email',
    provider: 'Resend',
    resourcePlaceholder: 'e.g. mail.clientdomain.com',
    metadataKeys: [
      { key: 'sending_from', label: 'Sending Email', placeholder: 'noreply@clientdomain.com' },
    ],
    defaultSecretLabels: ['Account Password', 'SMTP / API Key'],
  },
  {
    id: 'custom',
    label: 'Custom Platform',
    category: 'other',
    provider: '',
    resourcePlaceholder: 'Service or Project Name',
    metadataKeys: [],
    defaultSecretLabels: ['Password / API Key'],
  },
];
