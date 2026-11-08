import {
  Profile,
  Skill,
  Experience,
  Project,
  SocialLink,
  FollowerRecommendation,
  LanguageSkill,
  Person,
  OpenSourceRepo,
  ServiceItem,
  DirectContactItem,
} from '@/types/profile';

export const profileData: Profile = {
  id: 'usr_zahid',
  username: '0xZahidp',
  full_name: 'Md Zahid Hasan Patwary',
  headline: 'I build practical web products, internal tools, and automation systems for real-world work.',
  bio: `Product Developer & Full-Stack Builder | Building practical web applications, offline-first systems, and automation workflows that solve real problems.`,
  avatar_url: '/images/avatar.webp',
  location: 'Dhaka, Bangladesh',
  timezone: 'Asia/Dhaka',
  availability: 'Open to new conversations',
  github_followers_count: 6,
  roles: [
    {
      title: 'Product Developer',
      company: 'Dhakaiya Bites',
      company_url: 'https://db.zahidp.com',
      company_logo: '',
    },
    {
      title: 'Lead Developer',
      company: 'Scholar Quest',
      company_url: 'https://sq.zahidp.com',
      company_logo: '/images/avatar.webp',
    },
    {
      title: 'Full-Stack Developer',
      company: 'Independent Product Builder',
      company_url: 'https://www.zahidp.com',
      company_logo: '/images/gymscanner.webp',
    },
  ],
};

export const bioParagraphs = [
  'I build practical web products, internal tools, and automation systems for real-world work. I’m Zahid Hasan Patwary, a product developer and full-stack builder focused on turning everyday operational bottlenecks into clear, reliable software.',
  'From offline-first restaurant POS platforms (Dhakaiya Bites) and personal finance ledgers (Zahid Finance) to scholarship application command centers (Scholar Quest) and shared-living management systems (The Shared Plate), I build systems people can actually use in production.',
  'My engineering stack centers around React 19, Next.js, TypeScript, Supabase, PostgreSQL, Tailwind CSS, TanStack Query, and offline-first IndexedDB storage. I also design lightweight automation systems and bots leveraging Python, Telegram Bot API, and Google Sheets.',
  'Whether you need a reliable product engineered from scratch, an offline-first architecture, or operational automation to streamline daily workflows, I own the technical roadmap, architecture, and user experience end to end.',
];

export const languagesData: LanguageSkill[] = [
  {
    name: 'English',
    proficiency: 'Near-native',
    rating: 5,
    note: 'British and American accents',
    hasVoice: true,
  },
  {
    name: 'Bangla',
    proficiency: 'Native',
    rating: 5,
    hasVoice: true,
  },
  {
    name: 'Arabic',
    proficiency: 'Reading and small talk',
    rating: 3,
    hasVoice: true,
  },
];

export const topSkillsData: string[] = [];

export const aiSkillsData: Skill[] = [];

export const techSkillsData: Skill[] = [];

export const experiencesData: Experience[] = [];

export const suggestedPeople: FollowerRecommendation[] = [];

export const socialLinksData: SocialLink[] = [
  {
    id: 's1',
    platform: 'github',
    label: 'GitHub',
    handle: '@0xZahidp',
    url: 'https://github.com/0xZahidp',
  },
  {
    id: 's2',
    platform: 'x',
    label: 'X',
    handle: '@0xZahidP',
    url: 'https://x.com/0xZahidP',
  },
  {
    id: 's3',
    platform: 'linkedin',
    label: 'LinkedIn',
    handle: 'in/0xZahidp',
    url: 'https://linkedin.com/in/0xZahidp',
  },
  {
    id: 's4',
    platform: 'facebook',
    label: 'Facebook',
    handle: '/0xZahidp',
    url: 'https://facebook.com/0xZahidp',
  },
];

export const projectsData: Project[] = [];

export const openSourceReposData: OpenSourceRepo[] = [];

export const peopleData: Person[] = [];

export const servicesData: ServiceItem[] = [
  {
    id: 'srv-1',
    title: 'Paid consultation',
    description:
      'Code reviews, architecture advice and performance fixes for your web app or SaaS.',
    icon: 'consultation',
    actionText: 'Book a consultation',
    actionUrl: 'mailto:hello@zahidp.com?subject=Paid%20Consultation',
  },
  {
    id: 'srv-2',
    title: '1:1 call',
    description:
      'Career chats, mentoring, or a second opinion on what you’re building.',
    icon: 'call',
    actionText: 'Book a call',
    actionUrl: 'mailto:hello@zahidp.com?subject=1:1%20Call',
  },
  {
    id: 'srv-3',
    title: 'Spoken English sessions',
    description:
      'Relaxed conversation practice with a near-native speaker, in a British or American accent. No judging, no drills.',
    icon: 'english',
    actionText: 'Book a session',
    actionUrl: 'mailto:hello@zahidp.com?subject=Spoken%20English%20Session',
  },
];

export const directContactData: DirectContactItem[] = [
  {
    id: 'dc-1',
    title: 'Email me',
    handle: 'hello@zahidp.com',
    url: 'mailto:hello@zahidp.com',
    icon: 'email',
  },
  {
    id: 'dc-2',
    title: 'Message on X',
    handle: '@0xZahidP',
    url: 'https://x.com/0xZahidP',
    icon: 'x',
  },
  {
    id: 'dc-3',
    title: 'Messenger',
    handle: 'm.me/0xZahidp',
    url: 'https://m.me/0xZahidp',
    icon: 'messenger',
  },
  {
    id: 'dc-4',
    title: 'WhatsApp',
    handle: 'wa.me/0xZahidp',
    url: 'https://wa.me/',
    icon: 'whatsapp',
  },
];

export const contactSocialsData: SocialLink[] = [];
