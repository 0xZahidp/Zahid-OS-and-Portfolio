export interface Sound {
  id: string;
  label: string;
  category: string;
  icon: string;
  src: string;
  sub?: string;
}

export interface SoundCategory {
  id: string;
  label: string;
  icon: string;
  count: number;
  tint: string;
  bgGradient: string;
  borderTint: string;
  iconBg: string;
}

export interface FocusPreset {
  id: string;
  label: string;
  icon: string;
  scene: string;
  image: string;
  quote?: string;
  sounds: Record<string, number>;
}

export const SOUND_CATEGORIES: SoundCategory[] = [
  {
    id: 'rain',
    label: 'Rain',
    icon: 'CloudRain',
    count: 9,
    tint: 'text-sky-600 dark:text-sky-400',
    bgGradient: 'from-sky-100/70 via-indigo-50/50 to-purple-100/60 dark:from-sky-950/25 dark:via-indigo-950/20 dark:to-purple-950/25',
    borderTint: 'border-sky-200/50 dark:border-sky-800/30',
    iconBg: 'bg-white/80 dark:bg-white/10',
  },
  {
    id: 'nature',
    label: 'Nature',
    icon: 'Trees',
    count: 9,
    tint: 'text-emerald-600 dark:text-emerald-400',
    bgGradient: 'from-emerald-100/70 via-teal-50/50 to-lime-100/60 dark:from-emerald-950/25 dark:via-teal-950/20 dark:to-lime-950/25',
    borderTint: 'border-emerald-200/50 dark:border-emerald-800/30',
    iconBg: 'bg-white/80 dark:bg-white/10',
  },
  {
    id: 'animals',
    label: 'Animals',
    icon: 'Carrot',
    count: 8,
    tint: 'text-amber-600 dark:text-amber-400',
    bgGradient: 'from-amber-100/70 via-orange-50/50 to-yellow-100/60 dark:from-amber-950/25 dark:via-orange-950/20 dark:to-yellow-950/25',
    borderTint: 'border-amber-200/50 dark:border-amber-800/30',
    iconBg: 'bg-white/80 dark:bg-white/10',
  },
  {
    id: 'places',
    label: 'Places',
    icon: 'Coffee',
    count: 9,
    tint: 'text-rose-600 dark:text-rose-400',
    bgGradient: 'from-rose-100/70 via-orange-50/50 to-pink-100/60 dark:from-rose-950/25 dark:via-orange-950/20 dark:to-pink-950/25',
    borderTint: 'border-rose-200/50 dark:border-rose-800/30',
    iconBg: 'bg-white/80 dark:bg-white/10',
  },
  {
    id: 'transport',
    label: 'Transport',
    icon: 'Train',
    count: 6,
    tint: 'text-indigo-600 dark:text-indigo-400',
    bgGradient: 'from-indigo-100/70 via-violet-50/50 to-fuchsia-100/60 dark:from-indigo-950/25 dark:via-violet-950/20 dark:to-fuchsia-950/25',
    borderTint: 'border-indigo-200/50 dark:border-indigo-800/30',
    iconBg: 'bg-white/80 dark:bg-white/10',
  },
  {
    id: 'things',
    label: 'Things',
    icon: 'Package',
    count: 8,
    tint: 'text-cyan-600 dark:text-cyan-400',
    bgGradient: 'from-cyan-100/70 via-teal-50/50 to-blue-100/60 dark:from-cyan-950/25 dark:via-teal-950/20 dark:to-blue-950/25',
    borderTint: 'border-cyan-200/50 dark:border-cyan-800/30',
    iconBg: 'bg-white/80 dark:bg-white/10',
  },
  {
    id: 'city',
    label: 'City',
    icon: 'Building2',
    count: 5,
    tint: 'text-yellow-600 dark:text-yellow-400',
    bgGradient: 'from-yellow-100/70 via-amber-50/50 to-orange-100/60 dark:from-yellow-950/25 dark:via-amber-950/20 dark:to-orange-950/25',
    borderTint: 'border-yellow-200/50 dark:border-yellow-800/30',
    iconBg: 'bg-white/80 dark:bg-white/10',
  },
  {
    id: 'tones',
    label: 'Noise and tones',
    icon: 'Activity',
    count: 7,
    tint: 'text-violet-600 dark:text-violet-400',
    bgGradient: 'from-violet-100/70 via-purple-50/50 to-fuchsia-100/60 dark:from-violet-950/25 dark:via-purple-950/20 dark:to-fuchsia-950/25',
    borderTint: 'border-violet-200/50 dark:border-violet-800/30',
    iconBg: 'bg-white/80 dark:bg-white/10',
  },
];

export const SOUNDS: Sound[] = [
  // 1. Rain (9)
  { id: 'light-rain', label: 'Light rain', category: 'rain', icon: 'CloudRain', src: '/sounds/light-rain.mp3' },
  { id: 'heavy-rain', label: 'Heavy rain', category: 'rain', icon: 'Droplets', src: '/sounds/heavy-rain.mp3' },
  { id: 'thunder', label: 'Thunder', category: 'rain', icon: 'CloudLightning', src: '/sounds/thunder.mp3' },
  { id: 'tin-roof', label: 'Tin roof', sub: 'Monsoon rain, like home', category: 'rain', icon: 'Home', src: '/sounds/tin-roof.mp3' },
  { id: 'rain-on-window', label: 'Rain on a window', category: 'rain', icon: 'AppWindow', src: '/sounds/rain-on-window.mp3' },
  { id: 'rain-on-car-roof', label: 'Rain on a car roof', category: 'rain', icon: 'Car', src: '/sounds/rain-on-car-roof.mp3' },
  { id: 'rain-on-umbrella', label: 'Rain on an umbrella', category: 'rain', icon: 'Umbrella', src: '/sounds/rain-on-umbrella.mp3' },
  { id: 'rain-on-tent', label: 'Rain on a tent', category: 'rain', icon: 'Tent', src: '/sounds/rain-on-tent.mp3' },
  { id: 'rain-on-leaves', label: 'Rain on leaves', category: 'rain', icon: 'Leaf', src: '/sounds/rain-on-leaves.mp3' },

  // 2. Nature (9)
  { id: 'forest', label: 'Forest', category: 'nature', icon: 'Trees', src: '/sounds/forest.mp3' },
  { id: 'river', label: 'River', category: 'nature', icon: 'Waves', src: '/sounds/river.mp3' },
  { id: 'waves', label: 'Waves', category: 'nature', icon: 'Sunrise', src: '/sounds/waves.mp3' },
  { id: 'waterfall', label: 'Waterfall', category: 'nature', icon: 'Mountain', src: '/sounds/waterfall.mp3' },
  { id: 'droplets', label: 'Droplets', category: 'nature', icon: 'Droplet', src: '/sounds/droplets.mp3' },
  { id: 'campfire', label: 'Campfire', category: 'nature', icon: 'Flame', src: '/sounds/campfire.mp3' },
  { id: 'wind', label: 'Wind', category: 'nature', icon: 'Wind', src: '/sounds/wind.mp3' },
  { id: 'wind-in-trees', label: 'Wind in trees', category: 'nature', icon: 'Trees', src: '/sounds/wind-in-trees.mp3' },
  { id: 'jungle', label: 'Jungle', category: 'nature', icon: 'Sprout', src: '/sounds/jungle.mp3' },

  // 3. Animals (8)
  { id: 'birds', label: 'Birds', category: 'animals', icon: 'Feather', src: '/sounds/birds.mp3' },
  { id: 'crickets', label: 'Crickets', category: 'animals', icon: 'MoonStar', src: '/sounds/crickets.mp3' },
  { id: 'frog', label: 'Frogs', category: 'animals', icon: 'Sparkles', src: '/sounds/frog.mp3' },
  { id: 'owl', label: 'Owl', category: 'animals', icon: 'Moon', src: '/sounds/owl.mp3' },
  { id: 'seagulls', label: 'Seagulls', category: 'animals', icon: 'Anchor', src: '/sounds/seagulls.mp3' },
  { id: 'whale', label: 'Whale', category: 'animals', icon: 'Fish', src: '/sounds/whale.mp3' },
  { id: 'cat-purring', label: 'Cat purring', category: 'animals', icon: 'Heart', src: '/sounds/cat-purring.mp3' },
  { id: 'beehive', label: 'Beehive', category: 'animals', icon: 'Sun', src: '/sounds/beehive.mp3' },

  // 4. Places (9)
  { id: 'cafe', label: 'Café', category: 'places', icon: 'Coffee', src: '/sounds/cafe.mp3' },
  { id: 'library', label: 'Library', category: 'places', icon: 'BookOpen', src: '/sounds/library.mp3' },
  { id: 'office', label: 'Office', category: 'places', icon: 'Briefcase', src: '/sounds/office.mp3' },
  { id: 'restaurant', label: 'Restaurant', category: 'places', icon: 'Utensils', src: '/sounds/restaurant.mp3' },
  { id: 'night-village', label: 'Village at night', category: 'places', icon: 'Home', src: '/sounds/night-village.mp3' },
  { id: 'underwater', label: 'Underwater', category: 'places', icon: 'Compass', src: '/sounds/underwater.mp3' },
  { id: 'laboratory', label: 'Laboratory', category: 'places', icon: 'FlaskConical', src: '/sounds/laboratory.mp3' },
  { id: 'airport', label: 'Airport', category: 'places', icon: 'Plane', src: '/sounds/airport.mp3' },
  { id: 'subway-station', label: 'Subway station', category: 'places', icon: 'Train', src: '/sounds/subway-station.mp3' },

  // 5. Transport (6)
  { id: 'train', label: 'Train', category: 'transport', icon: 'Train', src: '/sounds/train.mp3' },
  { id: 'inside-a-train', label: 'Inside a train', category: 'transport', icon: 'Armchair', src: '/sounds/inside-a-train.mp3' },
  { id: 'airplane', label: 'Airplane', category: 'transport', icon: 'Plane', src: '/sounds/airplane.mp3' },
  { id: 'sailboat', label: 'Sailboat', category: 'transport', icon: 'Sailboat', src: '/sounds/sailboat.mp3' },
  { id: 'rowing-boat', label: 'Rowing boat', category: 'transport', icon: 'Ship', src: '/sounds/rowing-boat.mp3' },
  { id: 'submarine', label: 'Submarine', category: 'transport', icon: 'Navigation', src: '/sounds/submarine.mp3' },

  // 6. Things (8)
  { id: 'keyboard', label: 'Keyboard', category: 'things', icon: 'Keyboard', src: '/sounds/keyboard.mp3' },
  { id: 'typewriter', label: 'Typewriter', category: 'things', icon: 'FileText', src: '/sounds/typewriter.mp3' },
  { id: 'paper', label: 'Paper', category: 'things', icon: 'Scroll', src: '/sounds/paper.mp3' },
  { id: 'clock', label: 'Clock', category: 'things', icon: 'Clock', src: '/sounds/clock.mp3' },
  { id: 'ceiling-fan', label: 'Ceiling fan', category: 'things', icon: 'Fan', src: '/sounds/ceiling-fan.mp3' },
  { id: 'wind-chimes', label: 'Wind chimes', category: 'things', icon: 'Bell', src: '/sounds/wind-chimes.mp3' },
  { id: 'boiling-water', label: 'Boiling water', category: 'things', icon: 'Coffee', src: '/sounds/boiling-water.mp3' },
  { id: 'vinyl-effect', label: 'Vinyl crackle', category: 'things', icon: 'Disc', src: '/sounds/vinyl-effect.mp3' },

  // 7. City (5)
  { id: 'busy-street', label: 'Busy street', category: 'city', icon: 'Footprints', src: '/sounds/busy-street.mp3' },
  { id: 'traffic', label: 'Traffic', category: 'city', icon: 'Car', src: '/sounds/traffic.mp3' },
  { id: 'highway', label: 'Highway', category: 'city', icon: 'Route', src: '/sounds/highway.mp3' },
  { id: 'road', label: 'Road', category: 'city', icon: 'Milestone', src: '/sounds/road.mp3' },
  { id: 'crowd', label: 'Crowd', category: 'city', icon: 'Users', src: '/sounds/crowd.mp3' },

  // 8. Noise and tones (7)
  { id: 'brown', label: 'Brown noise', category: 'tones', icon: 'Waves', src: '/sounds/brown.mp3' },
  { id: 'pink', label: 'Pink noise', category: 'tones', icon: 'Activity', src: '/sounds/pink.mp3' },
  { id: 'white', label: 'White noise', category: 'tones', icon: 'Radio', src: '/sounds/white.mp3' },
  { id: 'alpha', label: 'Binaural alpha', sub: '10 Hz • Relaxed focus', category: 'tones', icon: 'Headphones', src: '/sounds/alpha.mp3' },
  { id: 'beta', label: 'Binaural beta', sub: '18 Hz • High alertness', category: 'tones', icon: 'Zap', src: '/sounds/beta.mp3' },
  { id: 'gamma', label: 'Binaural gamma', sub: '40 Hz • Problem solving', category: 'tones', icon: 'Flame', src: '/sounds/gamma.mp3' },
  { id: 'scifi', label: 'Starship warp hum', sub: 'Ambient deep space', category: 'tones', icon: 'Rocket', src: '/sounds/scifi.mp3' },
];

export const PRESETS: FocusPreset[] = [
  {
    id: 'deep-focus',
    label: 'Deep focus',
    icon: 'Target',
    scene: 'mountains',
    image: '/focus/scenes/mountains.webp',
    sounds: { brown: 55, alpha: 50 },
  },
  {
    id: 'rainy-cafe',
    label: 'Rainy café',
    icon: 'Coffee',
    scene: 'cafe',
    image: '/focus/scenes/cafe.webp',
    sounds: { 'light-rain': 50, cafe: 55 },
  },
  {
    id: 'late-night-coding',
    label: 'Late-night coding',
    icon: 'Code',
    scene: 'desk',
    image: '/focus/scenes/desk.webp',
    sounds: { 'rain-on-window': 50, keyboard: 30, brown: 30 },
  },
  {
    id: 'monsoon-night',
    label: 'Monsoon night',
    icon: 'Home',
    scene: 'monsoon',
    image: '/focus/scenes/monsoon.webp',
    sounds: { 'tin-roof': 65, crickets: 30, thunder: 30 },
  },
  {
    id: 'thunderstorm',
    label: 'Thunderstorm',
    icon: 'CloudLightning',
    scene: 'storm',
    image: '/focus/scenes/storm.webp',
    sounds: { 'heavy-rain': 65, thunder: 55, wind: 20 },
  },
  {
    id: 'forest-walk',
    label: 'Forest walk',
    icon: 'Trees',
    scene: 'forest',
    image: '/focus/scenes/forest.webp',
    sounds: { forest: 60, river: 35, birds: 30 },
  },
  {
    id: 'beach',
    label: 'Beach',
    icon: 'Waves',
    scene: 'ocean',
    image: '/focus/scenes/ocean.webp',
    sounds: { waves: 65, seagulls: 20, wind: 20 },
  },
  {
    id: 'cozy-cabin',
    label: 'Cozy cabin',
    icon: 'Flame',
    scene: 'cabin',
    image: '/focus/scenes/cabin.webp',
    sounds: { campfire: 55, 'rain-on-window': 45, wind: 20 },
  },
  {
    id: 'study-hall',
    label: 'Study hall',
    icon: 'BookOpen',
    scene: 'library',
    image: '/focus/scenes/library.webp',
    sounds: { library: 60, paper: 25, clock: 15 },
  },
  {
    id: 'night-train',
    label: 'Night train',
    icon: 'Train',
    scene: 'train',
    image: '/focus/scenes/train.webp',
    sounds: { 'inside-a-train': 60, 'light-rain': 30 },
  },
  {
    id: 'garden',
    label: 'Garden',
    icon: 'Sprout',
    scene: 'garden',
    image: '/focus/scenes/garden.webp',
    sounds: { birds: 45, beehive: 15, 'wind-in-trees': 30 },
  },
  {
    id: 'starship',
    label: 'Starship',
    icon: 'Rocket',
    scene: 'space',
    image: '/focus/scenes/space.webp',
    sounds: { scifi: 60, brown: 25 },
  },
];

export const FOCUS_QUOTES: string[] = [
  'Momentum beats motivation.',
  'Thirty quiet minutes beat three noisy hours.',
  'Today’s focus is tomorrow’s skill.',
  'Deep work feels slow while you are in it and fast when you look back.',
  'Put the phone face down. You can check it at the break.',
  'Don’t check the phone. It can wait until this function is done.',
  'Breathe. Then pick the smallest next step.',
  'Tea first. Then the hard bug.',
  'Dhaka is loud. Headphones on, world off.',
  'Monsoon outside, focus inside.',
  'Rain on a tin roof, a cup of cha, one clear task.',
  'Bismillah. Start small, start now.',
  'Clean desk, clean diff, clear head.',
  'The keyboard is waiting. So is the version of you that finished this.',
  'Progress is quiet. Keep going.',
  'Rest is part of the work.',
];

export const YOUTUBE_PICKS = [
  { id: '25wH52RSam8', title: 'Ya Nabi Salam Alayka', sub: 'Maher Zain' },
  { id: 'IxwdZLtMf7I', title: 'Qalbi Fil Madinah', sub: 'Maher Zain feat. Harris J' },
  { id: 'AIyAPGumseA', title: 'Ramadan', sub: 'Maher Zain' },
  { id: 'nuYA88YJSC4', title: 'Bika Moulhimi', sub: 'Maher Zain feat. Mustafa Ceceli' },
  { id: '61C6FxprHuY', title: 'Barak Allah Lakuma', sub: 'Maher Zain' },
  { id: '9Jsb0Dy6wWA', title: 'I’m Alive', sub: 'Maher Zain feat. Atif Aslam' },
  { id: 'LkAm79Edtlo', title: 'Assalamu Alaika', sub: 'Maher Zain' },
  { id: 'pFMofSt2vVw', title: 'Number One For Me', sub: 'Maher Zain' },
  { id: 'UW5K0OzOmVI', title: 'Rahmatun Lil’Alameen', sub: 'Maher Zain' },
  { id: '0a43eUZf5iQ', title: 'La Tahzan', sub: 'Maher Zain' },
  { id: '4VU4_NZuL24', title: 'The Power', sub: 'Maher Zain' },
  { id: 'KTkdQ2q3jCA', title: 'The Book of Allah Is My Constitution', sub: 'Muhammad al Muqit' },
  { id: 'JqGv0EdJdJI', title: 'I Rise', sub: 'Muhammad al Muqit' },
  { id: 'NrsCej6SVxM', title: 'The Beauty of Existence', sub: 'Muhammad al Muqit' },
  { id: 'YiSQ_db-Dcw', title: 'The Way of the Tears', sub: 'Muhammad al Muqit' },
  { id: 'JaHtx79UhIM', title: 'My Dream', sub: 'Muhammad al Muqit' },
  { id: 'ZZEgiM8QMM4', title: 'My Mother', sub: 'Muhammad al Muqit' },
  { id: 'Ov0-CBnOW4w', title: 'My Arabic Language', sub: 'Muhammad al Muqit' },
  { id: 'VQSUCfRoZPM', title: 'Kun Fayakoon', sub: 'Othman Alibrahim' },
  { id: 'D7mg8zkmiy8', title: 'Be Happy', sub: 'Othman Alibrahim' },
  { id: 'mTTk1QX30t0', title: 'Watheq', sub: 'Othman Alibrahim' },
];

export const CREDITS_INFO = [
  '52 recordings come from Moodist, an open-source ambient sound app by remvze. Its sounds are under the Pixabay License or CC0. Thank you!',
  'Tin roof: Rain on Tin Roof - 1 Hour by archerjosiah · CC0',
  'Forest: Woods ambience in Missouri, some birds singing and soft breeze by felix.blume · CC0',
  'Campfire: Campfire by reespeck · CC0',
  'Thunder: Distant Thunder by inchadney · CC0',
  'River: River rapids by soundmary · CC0',
  'Rain on car roof: Rain inside car by soundmary · CC0',
  'Binaural and synthesized sound generators engineered with precision audio synthesis algorithms.',
];
