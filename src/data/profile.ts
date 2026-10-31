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
  id: 'usr_01',
  username: 'alnahian2003',
  full_name: 'Al Nahian',
  headline: 'Less talk, show me code!',
  bio: `I’m a founding engineer and product builder who enjoys turning complex ideas into products that ship globally. I pair a strong passion for software design with a disciplined approach to life.`,
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
  'I’m a founding engineer and product builder who enjoys turning complex ideas into products that ship globally. I pair a strong passion for software design with a disciplined approach to life.',
  'As CTO at Bidvers, a startup founded by GymScanner’s CEO with offices in the US, Oman and Romania, I built the core platform and API from a blank repo, including a low-latency bidding engine on the TALL stack and secure payment routing. The team’s iOS and Android apps are built on that API. Bidvers has raised over $120K so far. I joined GymScanner first, and I still maintain and scale its backend infrastructure as a software engineer.',
  'These days I build with agentic engineering, so the stack matters less than the value I add: I own the architecture, the product decisions and the quality bar. Most of my products run on the Laravel ecosystem, both TALL and VILT, with a close eye on clean SaaS UI/UX, and I build AI into them with models from OpenAI and Claude.',
  'My journey started early: I co-founded the studio ZovoZip, led development at ZovoTeam, and taught Laravel at Interactive Cares, including a free crash course that drew 1,200+ students. I love owning products end to end, and I’m always happy to meet founders and teams building ambitious remote products.',
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
    handle: '@alnahian2003',
    url: 'https://github.com/alnahian2003',
  },
  {
    id: 's2',
    platform: 'x',
    label: 'X',
    handle: '@alnahian2003',
    url: 'https://x.com/alnahian2003',
  },
  {
    id: 's3',
    platform: 'linkedin',
    label: 'LinkedIn',
    handle: 'in/alnahian2003',
    url: 'https://linkedin.com/in/alnahian2003',
  },
  {
    id: 's4',
    platform: 'facebook',
    label: 'Facebook',
    handle: '/alnahian2003',
    url: 'https://facebook.com/alnahian2003',
  },
];

export const projectsData: Project[] = [
  {
    id: 'proj-1',
    title: 'Bidvers Live Auction Platform',
    description:
      'High-throughput live vehicle bidding engine built with TALL stack, processing real-time websocket transactions with sub-50ms latency.',
    tags: ['Laravel', 'Livewire', 'Alpine.js', 'Tailwind CSS', 'Redis'],
    project_url: 'https://bidvers.com',
  },
  {
    id: 'proj-2',
    title: 'GymScanner Backend & Search Pipeline',
    description:
      'Scalable cloud infrastructure powering automated gym schedule indexing and dynamic fitness subscription discovery.',
    tags: ['PHP', 'Laravel', 'PostgreSQL', 'Docker'],
    project_url: 'https://gymscanner.com',
  },
  {
    id: 'proj-3',
    title: 'Interactive Cares Developer Academy',
    description:
      'Comprehensive curriculum platform and mentorship system that instructed 1,200+ students on building production-ready SaaS applications.',
    tags: ['Education', 'PHP', 'Laravel', 'Mentorship'],
    project_url: 'https://interactivecares.com',
  },
  {
    id: 'proj-4',
    title: 'ZovoZip Design & Template Systems',
    description:
      'High-performance UI components, web applications, and accessible design kit templates for startups.',
    tags: ['Design Systems', 'HTML5', 'Tailwind CSS', 'UI/UX'],
    project_url: 'https://zovoteam.com',
  },
];

