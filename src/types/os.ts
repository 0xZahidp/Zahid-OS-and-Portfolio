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

export type ZahidOsAppId =
  | 'shortener'
  | 'qr'
  | 'notes'
  | 'snippets'
  | 'focus'
  | 'travel'
  | 'api_playground'
  | 'temp_mail'
  | 'settings';

export interface ZahidOsAppMeta {
  id: ZahidOsAppId;
  name: string;
  subtitle: string;
  iconType: string;
  gradient: string;
  badge?: string;
  isPublic: boolean;
  inDock?: boolean;
  category: 'utilities' | 'productivity' | 'developer' | 'system';
}

export type ZahidOsWallpaper =
  | 'zos-emerald'
  | 'zos-cyber'
  | 'zos-midnight'
  | 'zos-sunset'
  | 'zos-glacier'
  | 'zos-obsidian'
  | 'emerald-mesh'
  | 'cyber-dark'
  | 'ios-midnight'
  | 'cupertino-blue';

export interface ZahidOsSettings {
  is_public_enabled: boolean;
  allow_public_link_creation?: boolean;
  public_hero_title: string;
  public_hero_subtitle: string;
  wallpaper: ZahidOsWallpaper;
  sound_effects: boolean;
  app_permissions: Record<string, { is_public: boolean; name?: string }>;
  updated_at?: string;
}
