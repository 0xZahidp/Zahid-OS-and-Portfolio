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
import { defaultRecommendedPeople } from './default-people';

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
      company_logo: '/images/bidvers.webp',
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

export const suggestedPeople: FollowerRecommendation[] = defaultRecommendedPeople;

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
    title: 'Year',
    description:
      'Real-time year progress tracker with 8 themes, from Windows 7 to Cyberpunk',
    tags: ['Real-time', 'Fun'],
    repository_url: 'https://github.com/0xZahidp/year-progress',
    stars: 12,
  },
  {
    id: 'proj-6',
    title: 'Murad Takla',
    description:
      'A fun dictionary of hilariously misspelled Banglish, made for laughs',
    tags: ['Fun', 'Bangla'],
    repository_url: 'https://github.com/0xZahidp/murad-takla',
    stars: 25,
  },
  {
    id: 'proj-7',
    title: 'KajKam',
    description:
      'Client-side kanban task manager, no backend, built with Tailwind and Alpine.js',
    tags: ['Productivity', 'Kanban'],
    repository_url: 'https://github.com/0xZahidp/kajkam',
    stars: 3,
    logoType: 'invo',
  },
  {
    id: 'proj-8',
    title: 'Hatlar',
    description:
      'Hand-picked VS Code extension packs that make Laravel development smoother',
    tags: ['VS Code', 'Laravel', 'DevTool'],
    repository_url: 'https://github.com/0xZahidp/hatlar',
    stars: 8,
    logoType: 'prompt',
  },
];

export const openSourceReposData: OpenSourceRepo[] = [
  {
    id: 'repo-1',
    name: '0xZahidp/kordova',
    repo: 'kordova',
    description:
      'Simplify your uptime monitoring experience with this all-in-one solution, designed to be lightweight and easy to self-host.',
    language: 'PHP',
    languageColor: '#4F5D95',
    stars: 6,
    url: 'https://github.com/0xZahidp/kordova',
  },
  {
    id: 'repo-2',
    name: '0xZahidp/kleon',
    repo: 'kleon',
    description:
      'Freelancer CRM - Using Laravel, Vue 3 & Inertia. Submission for Laravel Daily’s Laravel Learning challenge.',
    language: 'PHP',
    languageColor: '#4F5D95',
    stars: 10,
    forks: 2,
    url: 'https://github.com/0xZahidp/kleon',
  },
  {
    id: 'repo-3',
    name: '0xZahidp/MyTapCard',
    repo: 'MyTapCard',
    description:
      'NFC-powered digital business card and profile sharing platform with instant contact sharing over NFC or single URL.',
    language: 'TypeScript',
    languageColor: '#3178c6',
    stars: 14,
    forks: 3,
    url: 'https://github.com/0xZahidp/MyTapCard',
  },
  {
    id: 'repo-4',
    name: '0xZahidp/prompt-filler',
    repo: 'prompt-filler',
    description:
      'Fill prompt placeholders as easily as filling a form for agentic AI workflows and LLM templating.',
    language: 'JavaScript',
    languageColor: '#f1e05a',
    stars: 2,
    url: 'https://github.com/0xZahidp/prompt-filler',
  },
];

export const peopleData: Person[] = [
  {
    id: 'person-1',
    name: 'Ahmed Shamim Hassan Shaon',
    verified: true,
    avatar_url: '/images/shaon.jpg',
    role: 'CEO of Megaminds Learning, software architect and Laravel contributor',
    primaryHandle: '@me_shaon',
    primaryPlatform: 'x',
    primaryUrl: 'https://x.com/me_shaon',
    quote: 'My mentor and the senior brother everyone wants by their side. I admire him the most.',
    tags: ['Laravel', 'Open source'],
    platforms: [
      { platform: 'x', url: 'https://x.com/me_shaon' },
      { platform: 'github', url: 'https://github.com/me-shaon' },
      { platform: 'linkedin', url: 'https://linkedin.com' },
      { platform: 'facebook', url: 'https://facebook.com' },
    ],
  },
  {
    id: 'person-2',
    name: 'Mohammad Emran Hasan',
    verified: false,
    avatar_url: 'https://github.com/phpfour.png',
    role: 'Building SaaS at klasio.com and helping teams ship Laravel products at figlab.io',
    primaryHandle: '@phpfour',
    primaryPlatform: 'x',
    primaryUrl: 'https://x.com/phpfour',
    quote: 'The guru of gurus, with extensive experience behind every tip.',
    tags: ['PHP', 'Laravel'],
    platforms: [
      { platform: 'x', url: 'https://x.com/phpfour' },
      { platform: 'linkedin', url: 'https://linkedin.com' },
      { platform: 'github', url: 'https://github.com/phpfour' },
      { platform: 'facebook', url: 'https://facebook.com' },
    ],
  },
  {
    id: 'person-3',
    name: 'Caleb Porzio',
    verified: false,
    avatar_url: '/images/caleb.jpg',
    role: 'Creator of Livewire and Alpine.js',
    primaryHandle: '@calebporzio',
    primaryPlatform: 'x',
    primaryUrl: 'https://x.com/calebporzio',
    quote: 'The reason I enjoy full-stack development so much.',
    tags: ['Livewire', 'Alpine.js'],
    platforms: [
      { platform: 'x', url: 'https://x.com/calebporzio' },
      { platform: 'github', url: 'https://github.com/calebporzio' },
      { platform: 'website', url: 'https://calebporzio.com' },
    ],
  },
  {
    id: 'person-4',
    name: 'HM Nayem',
    verified: false,
    avatar_url: '/images/nayem.jpg',
    role: 'Founder of Stack Learner',
    primaryHandle: '@hmnayem',
    primaryPlatform: 'x',
    primaryUrl: 'https://x.com/hmnayem',
    quote: 'Great educator and developer advocate in Bangladesh.',
    tags: ['JavaScript', 'Teaching'],
    platforms: [
      { platform: 'x', url: 'https://x.com/hmnayem' },
      { platform: 'github', url: 'https://github.com/hmnayem' },
      { platform: 'youtube', url: 'https://youtube.com/@StackLearner' },
      { platform: 'website', url: 'https://stacklearner.com' },
    ],
  },
  {
    id: 'person-5',
    name: 'Povilas Korop',
    verified: false,
    avatar_url: 'https://github.com/PovilasKorop.png',
    role: 'Laravel Daily: practical Laravel tips every day',
    primaryHandle: '@LaravelDaily',
    primaryPlatform: 'youtube',
    primaryUrl: 'https://youtube.com/@LaravelDaily',
    quote: 'I call him Uncle Povilas (পভিলাস কাকু), if anyone cares.',
    tags: ['Laravel', 'Teaching'],
    platforms: [
      { platform: 'youtube', url: 'https://youtube.com/@LaravelDaily' },
      { platform: 'x', url: 'https://x.com/PovilasKorop' },
      { platform: 'github', url: 'https://github.com/PovilasKorop' },
      { platform: 'linkedin', url: 'https://linkedin.com' },
    ],
  },
  {
    id: 'person-6',
    name: 'Aaron Francis',
    verified: false,
    avatar_url: 'https://github.com/aarondfrancis.png',
    role: 'VP of Marketing & Community at Laravel, creator of Solo, Database School and faster.dev',
    primaryHandle: '@aarondfrancis',
    primaryPlatform: 'youtube',
    primaryUrl: 'https://youtube.com/@aarondfrancis',
    tags: ['Databases', 'Laravel'],
    platforms: [
      { platform: 'x', url: 'https://x.com/aarondfrancis' },
      { platform: 'website', url: 'https://aaronfrancis.com' },
      { platform: 'youtube', url: 'https://youtube.com/@aarondfrancis' },
      { platform: 'github', url: 'https://github.com/aarondfrancis' },
    ],
  },
  {
    id: 'person-7',
    name: 'Taylor Otwell',
    verified: false,
    avatar_url: 'https://github.com/taylorotwell.png',
    role: 'Creator of Laravel',
    primaryHandle: '@taylorotwell',
    primaryPlatform: 'x',
    primaryUrl: 'https://x.com/taylorotwell',
    quote: 'Built the ecosystem that transformed modern PHP web development.',
    tags: ['Laravel', 'PHP'],
    platforms: [
      { platform: 'x', url: 'https://x.com/taylorotwell' },
      { platform: 'github', url: 'https://github.com/taylorotwell' },
      { platform: 'website', url: 'https://laravel.com' },
    ],
  },
  {
    id: 'person-8',
    name: 'Freek Van der Herten',
    verified: false,
    avatar_url: 'https://github.com/freekmurze.png',
    role: 'Developer and partner at Spatie, open-source maintainer',
    primaryHandle: '@freekmurze',
    primaryPlatform: 'github',
    primaryUrl: 'https://github.com/freekmurze',
    tags: ['Open source', 'Laravel'],
    platforms: [
      { platform: 'github', url: 'https://github.com/freekmurze' },
      { platform: 'x', url: 'https://x.com/freekmurze' },
      { platform: 'website', url: 'https://freek.dev' },
    ],
  },
  {
    id: 'person-9',
    name: 'Adam Wathan',
    verified: false,
    avatar_url: 'https://github.com/adamwathan.png',
    role: 'Creator of Tailwind CSS',
    primaryHandle: '@adamwathan',
    primaryPlatform: 'x',
    primaryUrl: 'https://x.com/adamwathan',
    quote: 'Revolutionized how the entire industry designs on the web.',
    tags: ['Tailwind CSS', 'CSS'],
    platforms: [
      { platform: 'x', url: 'https://x.com/adamwathan' },
      { platform: 'github', url: 'https://github.com/adamwathan' },
      { platform: 'website', url: 'https://adamwathan.me' },
    ],
  },
  {
    id: 'person-10',
    name: 'Nuno Maduro',
    verified: false,
    avatar_url: 'https://github.com/nunomaduro.png',
    role: 'Laravel core engineer, creator of Pest PHP and Termwind',
    primaryHandle: '@enunomaduro',
    primaryPlatform: 'github',
    primaryUrl: 'https://github.com/nunomaduro',
    tags: ['Testing', 'PHP'],
    platforms: [
      { platform: 'github', url: 'https://github.com/nunomaduro' },
      { platform: 'x', url: 'https://x.com/enunomaduro' },
      { platform: 'website', url: 'https://nunomaduro.com' },
    ],
  },
  {
    id: 'person-11',
    name: 'Jeffrey Way',
    verified: false,
    avatar_url: 'https://github.com/JeffreyWay.png',
    role: 'Creator of Laracasts, inspiring developer educator',
    primaryHandle: '@jeffrey_way',
    primaryPlatform: 'website',
    primaryUrl: 'https://laracasts.com',
    tags: ['Education', 'Laravel'],
    platforms: [
      { platform: 'website', url: 'https://laracasts.com' },
      { platform: 'x', url: 'https://x.com/jeffrey_way' },
      { platform: 'facebook', url: 'https://facebook.com' },
    ],
  },
];

export const servicesData: ServiceItem[] = [
  {
    id: 'srv-1',
    title: 'Paid consultation',
    description:
      'Code reviews, architecture advice and performance fixes for your web app or SaaS.',
    icon: 'consultation',
    actionText: 'Book a consultation',
    actionUrl: 'mailto:mdzahidhasanpatwary@gmail.com?subject=Paid%20Consultation',
  },
  {
    id: 'srv-2',
    title: '1:1 call',
    description:
      'Career chats, mentoring, or a second opinion on what you’re building.',
    icon: 'call',
    actionText: 'Book a call',
    actionUrl: 'mailto:mdzahidhasanpatwary@gmail.com?subject=1:1%20Call',
  },
  {
    id: 'srv-3',
    title: 'Spoken English sessions',
    description:
      'Relaxed conversation practice with a near-native speaker, in a British or American accent. No judging, no drills.',
    icon: 'english',
    actionText: 'Book a session',
    actionUrl: 'mailto:mdzahidhasanpatwary@gmail.com?subject=Spoken%20English%20Session',
  },
];

export const directContactData: DirectContactItem[] = [
  {
    id: 'dc-1',
    title: 'Email me',
    handle: 'hello@0xzahidp.com',
    url: 'mailto:mdzahidhasanpatwary@gmail.com',
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

export const contactSocialsData: SocialLink[] = [
  {
    id: 'cs-1',
    platform: 'github',
    label: 'GitHub',
    handle: '@0xZahidp',
    url: 'https://github.com/0xZahidp',
  },
  {
    id: 'cs-2',
    platform: 'x',
    label: 'X',
    handle: '@0xZahidP',
    url: 'https://x.com/0xZahidP',
  },
  {
    id: 'cs-3',
    platform: 'linkedin',
    label: 'LinkedIn',
    handle: 'in/0xZahidp',
    url: 'https://linkedin.com/in/0xZahidp',
  },
  {
    id: 'cs-4',
    platform: 'peerlist',
    label: 'Peerlist',
    handle: '@0xzahidp',
    url: 'https://peerlist.io/0xzahidp',
  },
  {
    id: 'cs-5',
    platform: 'facebook',
    label: 'Facebook',
    handle: '/0xZahidp',
    url: 'https://facebook.com/0xZahidp',
  },
  {
    id: 'cs-6',
    platform: 'devto',
    label: 'DEV',
    handle: 'dev.to/0xzahidp',
    url: 'https://dev.to/0xzahidp',
  },
  {
    id: 'cs-7',
    platform: 'behance',
    label: 'Behance',
    handle: '/0xzahidp',
    url: 'https://behance.net/0xzahidp',
  },
];
