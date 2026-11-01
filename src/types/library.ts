export interface AiSkillItem {
  id: string;
  name: string;
  author: string;
  description: string;
  command: string;
  url: string;
  badge?: string;
}

export interface BookmarkItem {
  id: string;
  title: string;
  author?: string;
  description: string;
  url: string;
  badge?: string;
  badges?: string[];
  isTopPick?: boolean;
  image_url?: string;
}

export interface FocusAudioItem {
  id: string;
  title: string;
  artist: string;
  arabic_title?: string;
  duration?: string;
  url?: string;
}

export interface VoiceoverItem {
  id: string;
  title: string;
  url: string;
  duration?: string;
  thumbnail?: string;
}

export interface LibraryContent {
  aiSkills: AiSkillItem[];
  bookmarks: BookmarkItem[];
  music: FocusAudioItem[];
  voiceovers: {
    channelName: string;
    handle: string;
    description: string;
    subscribeUrl: string;
    subscriberCount?: string;
    items: VoiceoverItem[];
  };
}
