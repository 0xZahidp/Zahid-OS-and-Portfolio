import {
  Profile,
  Skill,
  Experience,
  Project,
  SocialLink,
  FollowerRecommendation,
  LanguageSkill,
} from '@/types/profile';

export const profileData: Profile = {
  id: 'usr_zahid',
  username: '0xZahidp',
  full_name: 'Md Zahid Hasan Patwary',
  headline: 'Less talk, show me code!',
  bio: `Developer & Growth Strategist | Building SaaS & Web3 products | Passionate about code, community & scaling ideas into impact 🚀`,
  avatar_url: '/images/avatar.webp',
  location: 'Dhaka',
  timezone: 'Asia/Dhaka',
  availability: 'Open to new conversations',
  github_followers_count: 483,
  roles: [
    {
      title: 'CTO',
      company: 'Bidvers',
      company_url: 'https://bidvers.com',
      company_logo: '/images/bidvers.webp',
    },
    {
      title: 'Software Engineer',
      company: 'GymScanner',
      company_url: 'https://gymscanner.com',
      company_logo: '/images/gymscanner.webp',
    },
  ],
};

export const bioParagraphs = [
  'I’m a developer and growth strategist building scalable SaaS and Web3 products. I turn complex technical architectures into intuitive, high-performance web products that ship globally.',
  'As CTO at Bidvers and Software Engineer at GymScanner, I architected core platforms and APIs from a blank repository, including low-latency real-time bidding engines and secure multi-region payment routing across the US, Oman, and Romania. Bidvers has raised over $120K so far.',
  'These days I build with agentic AI engineering and modern full-stack systems—leveraging Next.js, Laravel, Supabase, Tailwind CSS, and models from OpenAI and Claude. I own the architecture, user experience, and technical roadmap end to end.',
  'I love building products from zero to one, scaling engineering teams, and exploring decentralized technologies. Always open to collaborating with ambitious founders and teams worldwide.',
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

export const topSkillsData: string[] = [
  'Product Development',
  'SaaS Development',
  'System Architecture',
  'Agentic AI Development',
  'Strategic Planning',
];

export const aiSkillsData: Skill[] = [
  { id: 'claude', name: 'Claude', category: 'ai', color: '#d97757' },
  { id: 'openai', name: 'OpenAI', category: 'ai', color: '#10a37f' },
  { id: 'antigravity', name: 'Antigravity', category: 'ai', color: '#3186ff' },
  { id: 'opencode', name: 'OpenCode', category: 'ai', color: '#9a9897' },
];

export const techSkillsData: Skill[] = [
  { id: 'laravel', name: 'Laravel', category: 'tech' },
  { id: 'php', name: 'PHP', category: 'tech' },
  { id: 'javascript', name: 'JavaScript', category: 'tech' },
  { id: 'livewire', name: 'Livewire', category: 'tech' },
  { id: 'alpine', name: 'Alpine.js', category: 'tech' },
  { id: 'vue', name: 'Vue.js', category: 'tech' },
  { id: 'inertia', name: 'Inertia', category: 'tech' },
  { id: 'tailwind', name: 'Tailwind CSS', category: 'tech' },
  { id: 'vscode', name: 'VS Code', category: 'tool' },
  { id: 'phpstorm', name: 'PhpStorm', category: 'tool' },
  { id: 'git', name: 'Git', category: 'tool' },
  { id: 'github', name: 'GitHub', category: 'tool' },
];

export const experiencesData: Experience[] = [
  {
    id: 'exp-1',
    company: 'Bidvers',
    company_url: 'https://bidvers.com',
    company_logo: '/images/bidvers.webp',
    position: 'Chief Technology Officer',
    period: 'Nov 2025 – Present',
    type: 'Full-time',
    workplace_type: 'Remote',
    description:
      'Hand-picked by GymScanner’s CEO to build his next company from day one. I own the architecture and technical roadmap as Bidvers operates in the US, Oman and Romania and expands into London, Poland, Singapore and beyond.',
    highlights: [
      { label: 'Raised', value: '$120K+', icon: 'rocket' },
      { label: 'Built by me from scratch', value: 'Core + API', icon: 'code' },
      { label: 'Apps built on my API', value: 'iOS + Android', icon: 'mobile' },
    ],
    bullet_points: [
      'Core platform and API: architected and built them from a blank repo; the team’s iOS and Android apps are built on top.',
      'Bidding engine: built a low-latency, real-time engine on the TALL stack (Tailwind, Alpine.js, Laravel, Livewire).',
      'Payments and vendors: shipped secure payment routing and complex vendor workflows for operations in the US, Oman and Romania.',
    ],
    tags: ['Laravel', 'Livewire', 'Alpine.js', 'Tailwind CSS'],
    is_current: true,
  },
  {
    id: 'exp-2',
    company: 'GymScanner',
    company_url: 'https://gymscanner.com',
    company_logo: '/images/gymscanner.webp',
    position: 'Software Engineer',
    period: 'Nov 2025 – Present',
    type: 'Full-time',
    workplace_type: 'Remote',
    description: 'Maintaining and scaling backend infrastructure.',
    is_current: true,
  },
  {
    id: 'exp-3',
    company: 'Interactive Cares',
    company_logo: '/images/interactive-cares.webp',
    position: 'Education Mentor',
    period: 'Jun 2023 – Feb 2025',
    type: 'Contract',
    workplace_type: 'Remote',
    description:
      'Taught Laravel to aspiring developers, from a full career-path course to a free crash course, live and online.',
    sub_programs: [
      {
        title: 'Laravel Career Path',
        badge: '2 successful batches',
        description:
          'I co-taught both batches and was also the support instructor for batch 1, alongside lead instructor Ahmed Shamim Hassan Shaon.',
      },
      {
        title: 'Laravel Crash Course',
        badge: 'Free',
        description: 'I taught it to 1,200+ students online.',
      },
    ],
    tags: ['Laravel', 'PHP'],
    is_current: false,
  },
  {
    id: 'exp-4',
    company: 'Megaminds Technologies',
    company_url: 'https://megamindslearning.net',
    company_logo: '/images/megaminds.webp',
    position: 'Education Mentor',
    period: '2023 – 2025',
    type: 'Contract',
    workplace_type: 'Remote',
    description:
      'Mentored learners at Megaminds Learning, led by my mentor Ahmed Shamim Hassan Shaon.',
    is_current: false,
  },
  {
    id: 'exp-5',
    company: 'ZovoZip',
    company_logo: '/images/zovozip.webp',
    position: 'Co-Founder',
    period: 'Feb 2021 – Present',
    type: 'Seasonal',
    workplace_type: 'Dhaka, Bangladesh',
    description:
      'Co-founded a web and software studio building UI templates, HTML templates and WordPress themes.',
    is_current: true,
  },
  {
    id: 'exp-6',
    company: 'ZovoTeam',
    company_url: 'https://www.facebook.com/Zovoteam',
    company_logo: '/images/zovoteam.webp',
    position: 'Executive Web Developer',
    period: 'Jan 2021 – Present',
    type: 'Seasonal',
    workplace_type: 'Dhaka, Bangladesh',
    description: 'Led web development for the team’s client and product work.',
    is_current: true,
  },
];

export const suggestedPeople: FollowerRecommendation[] = [
  {
    id: 'p1',
    name: 'Ahmed Shamim Hassan Shaon',
    role: 'CEO of Megaminds Lear...',
    avatar_url: '/images/shaon.jpg',
    url: 'https://x.com/me_shaon',
    handle: '@me_shaon',
  },
  {
    id: 'p2',
    name: 'Caleb Porzio',
    role: 'Creator of Livewire and ...',
    avatar_url: '/images/caleb.jpg',
    url: 'https://x.com/calebporzio',
    handle: '@calebporzio',
  },
  {
    id: 'p3',
    name: 'HM Nayem',
    role: 'Founder of Stack Learne...',
    avatar_url: '/images/nayem.jpg',
    url: 'https://x.com/hmnayem',
    handle: '@hmnayem',
  },
];

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

export const projectsData: Project[] = [
  {
    id: 'proj-1',
    title: 'Bidvers',
    description:
      'Core platform and API behind a real-time hotel upgrade bidding marketplace',
    tags: ['Laravel', 'API', 'Real-time'],
    project_url: 'https://bidvers.com',
    highlightBadge: '$120K+ raised',
    logoType: 'bidvers',
  },
  {
    id: 'proj-2',
    title: 'Learn Laravel',
    description:
      'Self-learning resources to level up your Laravel skills: tutorials, ebooks, blogs and courses',
    tags: ['Open source', 'Laravel', 'Learning'],
    repository_url: 'https://github.com/0xZahidp/learn-laravel',
    stars: 186,
    logoType: 'laravel',
  },
  {
    id: 'proj-3',
    title: 'Invo',
    description:
      'Effortless invoice management, no sign-up needed',
    tags: ['SaaS', 'Productivity'],
    project_url: 'https://invo.so',
    repository_url: 'https://github.com/0xZahidp/invo',
    stars: 5,
    logoType: 'invo',
  },
  {
    id: 'proj-4',
    title: 'Prompt Filler',
    description:
      'Fill prompt placeholders as easily as filling a form',
    tags: ['DevTool', 'SaaS', 'Productivity'],
    repository_url: 'https://github.com/0xZahidp/prompt-filler',
    stars: 2,
    logoType: 'prompt',
  },
  {
    id: 'proj-5',
    title: 'MyTapCard',
    description:
      'NFC-powered digital business card and profile sharing platform. Instant contact sharing via NFC or single URL.',
    tags: ['TypeScript', 'Next.js', 'Tailwind CSS'],
    project_url: 'https://mytapcard.vercel.app',
    repository_url: 'https://github.com/0xZahidp/MyTapCard',
    highlightBadge: 'Featured',
    stars: 14,
    logoType: 'mytapcard',
  },
  {
    id: 'proj-6',
    title: 'GymScanner',
    description:
      'Scalable cloud infrastructure powering automated gym schedule indexing and dynamic fitness subscription discovery.',
    tags: ['PHP', 'Laravel', 'PostgreSQL'],
    project_url: 'https://gymscanner.com',
    stars: 8,
    logoType: 'gymscanner',
  },
];
