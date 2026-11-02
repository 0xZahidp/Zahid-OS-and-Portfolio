export interface ShortLink {
  id: string;
  slug: string;
  original_url: string;
  title: string;
  description?: string;
  is_active: boolean;
  clicks: number;
  last_clicked_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShortLinksResponse {
  success: boolean;
  links: ShortLink[];
  totalClicks?: number;
  error?: string;
}

export type ZahidOsToolId = 'shortener' | 'qr' | 'snippets' | 'scratchpad';

export interface ZahidOsToolMeta {
  id: ZahidOsToolId;
  name: string;
  tagline: string;
  icon: string;
  status: 'ready' | 'beta' | 'planned';
}
