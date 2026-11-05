export interface FocusPreset {
  slug: string;
  label: string;
  iconName: string;
  scene: string;
  layers: Record<string, number>;
}

export interface FocusSound {
  slug: string;
  name: string;
  sub?: string;
  category: string;
  iconName: string;
  kind: 'file' | 'noise' | 'binaural' | 'scifi';
  audioUrl?: string;
}

export interface FocusCategory {
  id: string;
  label: string;
  iconName: string;
  scene: string;
  tint: string;
}

export interface YouTubePick {
  id: string;
  title: string;
  sub: string;
  thumbnail?: string;
}

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

export const FOCUS_SCENES: Record<string, { image: string; alt: string }> = {
  mountains: { image: '/focus/scenes/mountains.webp', alt: 'Misty serene mountain peaks' },
  rain: { image: '/focus/scenes/rain.webp', alt: 'Raindrops falling on glass' },
  storm: { image: '/focus/scenes/storm.webp', alt: 'Dramatic dark thunderstorm clouds' },
  monsoon: { image: '/focus/scenes/monsoon.webp', alt: 'Lush monsoon rainfall' },
  forest: { image: '/focus/scenes/forest.webp', alt: 'Moody misty pine forest' },
  garden: { image: '/focus/scenes/garden.webp', alt: 'Sunlit vibrant tranquil garden' },
  ocean: { image: '/focus/scenes/ocean.webp', alt: 'Gentle ocean waves on the beach' },
  night: { image: '/focus/scenes/night.webp', alt: 'Peaceful village beneath the night stars' },
  cabin: { image: '/focus/scenes/cabin.webp', alt: 'Warm rustic cabin with glowing hearth' },
  cafe: { image: '/focus/scenes/cafe.webp', alt: 'Cozy atmospheric coffee shop' },
  library: { image: '/focus/scenes/library.webp', alt: 'Historic grand wooden library' },
  desk: { image: '/focus/scenes/desk.webp', alt: 'Minimalist developer desk at night' },
  train: { image: '/focus/scenes/train.webp', alt: 'Looking out the window of a moving train' },
  city: { image: '/focus/scenes/city.webp', alt: 'Soft blurred city lights at dusk' },
  space: { image: '/focus/scenes/space.webp', alt: 'Deep starfield and distant cosmos' },
};

export const FOCUS_PRESETS: FocusPreset[] = [
  {
    slug: 'deep-focus',
    label: 'Deep focus',
    iconName: 'Target',
    scene: 'mountains',
    layers: { brown: 0.55, alpha: 0.5 },
  },
  {
    slug: 'rainy-cafe',
    label: 'Rainy café',
    iconName: 'Coffee',
    scene: 'cafe',
    layers: { 'light-rain': 0.5, cafe: 0.55 },
  },
  {
    slug: 'late-night-coding',
    label: 'Late-night coding',
    iconName: 'Code',
    scene: 'desk',
    layers: { 'rain-on-window': 0.5, keyboard: 0.3, brown: 0.3 },
  },
  {
    slug: 'monsoon-night',
    label: 'Monsoon night',
    iconName: 'Home',
    scene: 'monsoon',
    layers: { 'tin-roof': 0.65, crickets: 0.3, thunder: 0.3 },
  },
  {
    slug: 'thunderstorm',
    label: 'Thunderstorm',
    iconName: 'CloudLightning',
    scene: 'storm',
    layers: { 'heavy-rain': 0.65, thunder: 0.55, wind: 0.2 },
  },
  {
    slug: 'forest-walk',
    label: 'Forest walk',
    iconName: 'Trees',
    scene: 'forest',
    layers: { forest: 0.6, river: 0.35, birds: 0.3 },
  },
  {
    slug: 'beach',
    label: 'Beach',
    iconName: 'Waves',
    scene: 'ocean',
    layers: { waves: 0.65, seagulls: 0.2, wind: 0.2 },
  },
  {
    slug: 'cozy-cabin',
    label: 'Cozy cabin',
    iconName: 'Flame',
    scene: 'cabin',
    layers: { campfire: 0.55, 'rain-on-window': 0.45, wind: 0.2 },
  },
  {
    slug: 'study-hall',
    label: 'Study hall',
    iconName: 'BookOpen',
    scene: 'library',
    layers: { library: 0.6, paper: 0.25, clock: 0.15 },
  },
  {
    slug: 'night-train',
    label: 'Night train',
    iconName: 'Train',
    scene: 'train',
    layers: { 'inside-a-train': 0.6, 'light-rain': 0.3 },
  },
  {
    slug: 'garden',
    label: 'Garden',
    iconName: 'Sprout',
    scene: 'garden',
    layers: { birds: 0.45, beehive: 0.15, 'wind-in-trees': 0.3 },
  },
  {
    slug: 'starship',
    label: 'Starship',
    iconName: 'Rocket',
    scene: 'space',
    layers: { scifi: 0.6, brown: 0.25 },
  },
];

export const FOCUS_CATEGORIES: FocusCategory[] = [
  { id: 'rain', label: 'Rain', iconName: 'CloudRain', scene: 'rain', tint: 'from-sky-500/15 via-blue-500/5 to-transparent' },
  { id: 'nature', label: 'Nature', iconName: 'Trees', scene: 'forest', tint: 'from-emerald-500/15 via-teal-500/5 to-transparent' },
  { id: 'animals', label: 'Animals', iconName: 'Feather', scene: 'night', tint: 'from-amber-500/15 via-orange-500/5 to-transparent' },
  { id: 'places', label: 'Places', iconName: 'Coffee', scene: 'cafe', tint: 'from-rose-500/15 via-pink-500/5 to-transparent' },
  { id: 'transport', label: 'Transport', iconName: 'Train', scene: 'train', tint: 'from-indigo-500/15 via-purple-500/5 to-transparent' },
  { id: 'things', label: 'Things', iconName: 'Package', scene: 'desk', tint: 'from-cyan-500/15 via-teal-500/5 to-transparent' },
  { id: 'city', label: 'City', iconName: 'Building2', scene: 'city', tint: 'from-yellow-500/15 via-amber-500/5 to-transparent' },
  { id: 'tones', label: 'Noise and tones', iconName: 'Activity', scene: 'mountains', tint: 'from-violet-500/15 via-purple-500/5 to-transparent' },
];

export const FOCUS_SOUNDS: FocusSound[] = [
  // Rain
  { slug: 'light-rain', name: 'Light rain', category: 'rain', iconName: 'CloudRain', kind: 'file', audioUrl: 'https://nahian.bd/_astro/light-rain.BZGGXtwS.mp3' },
  { slug: 'heavy-rain', name: 'Heavy rain', category: 'rain', iconName: 'Droplets', kind: 'file', audioUrl: 'https://nahian.bd/_astro/heavy-rain.nJpR88jx.mp3' },
  { slug: 'thunder', name: 'Thunder', category: 'rain', iconName: 'CloudLightning', kind: 'file', audioUrl: 'https://nahian.bd/_astro/thunder.B-flvVym.mp3' },
  { slug: 'tin-roof', name: 'Tin roof', sub: 'Monsoon rain, like home', category: 'rain', iconName: 'Home', kind: 'file', audioUrl: 'https://nahian.bd/_astro/tin-roof.COAPwzA3.mp3' },
  { slug: 'rain-on-window', name: 'Rain on a window', category: 'rain', iconName: 'AppWindow', kind: 'file', audioUrl: 'https://nahian.bd/_astro/rain-on-window.TETkzja0.mp3' },
  { slug: 'rain-on-car-roof', name: 'Rain on a car roof', category: 'rain', iconName: 'Car', kind: 'file', audioUrl: 'https://nahian.bd/_astro/rain-on-car-roof.UDtwIGOt.mp3' },
  { slug: 'rain-on-umbrella', name: 'Rain on an umbrella', category: 'rain', iconName: 'Umbrella', kind: 'file', audioUrl: 'https://nahian.bd/_astro/rain-on-umbrella.DOyz5l6j.mp3' },
  { slug: 'rain-on-tent', name: 'Rain on a tent', category: 'rain', iconName: 'Tent', kind: 'file', audioUrl: 'https://nahian.bd/_astro/rain-on-tent.7H6QB2QV.mp3' },
  { slug: 'rain-on-leaves', name: 'Rain on leaves', category: 'rain', iconName: 'Leaf', kind: 'file', audioUrl: 'https://nahian.bd/_astro/rain-on-leaves.GueFB6eQ.mp3' },

  // Nature
  { slug: 'forest', name: 'Forest', category: 'nature', iconName: 'Trees', kind: 'file', audioUrl: 'https://nahian.bd/_astro/forest.BZGXKtTT.mp3' },
  { slug: 'river', name: 'River', category: 'nature', iconName: 'Waves', kind: 'file', audioUrl: 'https://nahian.bd/_astro/river.MtyG0AwH.mp3' },
  { slug: 'waves', name: 'Waves', category: 'nature', iconName: 'Sunrise', kind: 'file', audioUrl: 'https://nahian.bd/_astro/waves.BeyErWdW.mp3' },
  { slug: 'waterfall', name: 'Waterfall', category: 'nature', iconName: 'Mountain', kind: 'file', audioUrl: 'https://nahian.bd/_astro/waterfall.UBoM_51q.mp3' },
  { slug: 'droplets', name: 'Droplets', category: 'nature', iconName: 'Droplet', kind: 'file', audioUrl: 'https://nahian.bd/_astro/droplets._riMndmy.mp3' },
  { slug: 'campfire', name: 'Campfire', category: 'nature', iconName: 'Flame', kind: 'file', audioUrl: 'https://nahian.bd/_astro/campfire.bSKxRiZG.mp3' },
  { slug: 'wind', name: 'Wind', category: 'nature', iconName: 'Wind', kind: 'file', audioUrl: 'https://nahian.bd/_astro/wind.CJM9qTVi.mp3' },
  { slug: 'wind-in-trees', name: 'Wind in trees', category: 'nature', iconName: 'Trees', kind: 'file', audioUrl: 'https://nahian.bd/_astro/wind-in-trees.C2gNS7xo.mp3' },
  { slug: 'jungle', name: 'Jungle', category: 'nature', iconName: 'Sprout', kind: 'file', audioUrl: 'https://nahian.bd/_astro/jungle.2acUpzI3.mp3' },

  // Animals
  { slug: 'birds', name: 'Birds', category: 'animals', iconName: 'Feather', kind: 'file', audioUrl: 'https://nahian.bd/_astro/birds.CtHflfXU.mp3' },
  { slug: 'crickets', name: 'Crickets', category: 'animals', iconName: 'MoonStar', kind: 'file', audioUrl: 'https://nahian.bd/_astro/crickets.B33C_N2E.mp3' },
  { slug: 'frog', name: 'Frogs', category: 'animals', iconName: 'Sparkles', kind: 'file', audioUrl: 'https://nahian.bd/_astro/frog.B-DfAk8F.mp3' },
  { slug: 'owl', name: 'Owl', category: 'animals', iconName: 'Moon', kind: 'file', audioUrl: 'https://nahian.bd/_astro/owl.DdKYT0Zn.mp3' },
  { slug: 'seagulls', name: 'Seagulls', category: 'animals', iconName: 'Anchor', kind: 'file', audioUrl: 'https://nahian.bd/_astro/seagulls.CDE_yPMt.mp3' },
  { slug: 'whale', name: 'Whale', category: 'animals', iconName: 'Fish', kind: 'file', audioUrl: 'https://nahian.bd/_astro/whale.QH5uifGP.mp3' },
  { slug: 'cat-purring', name: 'Cat purring', category: 'animals', iconName: 'Heart', kind: 'file', audioUrl: 'https://nahian.bd/_astro/cat-purring.JONenhBK.mp3' },
  { slug: 'beehive', name: 'Beehive', category: 'animals', iconName: 'Sun', kind: 'file', audioUrl: 'https://nahian.bd/_astro/beehive.Blso1aRJ.mp3' },

  // Places
  { slug: 'cafe', name: 'Café', category: 'places', iconName: 'Coffee', kind: 'file', audioUrl: 'https://nahian.bd/_astro/cafe.tGIKTWv7.mp3' },
  { slug: 'library', name: 'Library', category: 'places', iconName: 'BookOpen', kind: 'file', audioUrl: 'https://nahian.bd/_astro/library.BgVxe8nv.mp3' },
  { slug: 'office', name: 'Office', category: 'places', iconName: 'Briefcase', kind: 'file', audioUrl: 'https://nahian.bd/_astro/office.DOe0dbtU.mp3' },
  { slug: 'restaurant', name: 'Restaurant', category: 'places', iconName: 'Utensils', kind: 'file', audioUrl: 'https://nahian.bd/_astro/restaurant.Cv7oeWle.mp3' },
  { slug: 'night-village', name: 'Village at night', category: 'places', iconName: 'Home', kind: 'file', audioUrl: 'https://nahian.bd/_astro/night-village.M4ePrJTB.mp3' },
  { slug: 'underwater', name: 'Underwater', category: 'places', iconName: 'Compass', kind: 'file', audioUrl: 'https://nahian.bd/_astro/underwater.D3vlb4sh.mp3' },
  { slug: 'laboratory', name: 'Laboratory', category: 'places', iconName: 'FlaskConical', kind: 'file', audioUrl: 'https://nahian.bd/_astro/laboratory.Dt5PM0Cj.mp3' },
  { slug: 'airport', name: 'Airport', category: 'places', iconName: 'Plane', kind: 'file', audioUrl: 'https://nahian.bd/_astro/airport.CO47AMmq.mp3' },
  { slug: 'subway-station', name: 'Subway station', category: 'places', iconName: 'Train', kind: 'file', audioUrl: 'https://nahian.bd/_astro/subway-station.BJlb4yap.mp3' },

  // Transport
  { slug: 'train', name: 'Train', category: 'transport', iconName: 'Train', kind: 'file', audioUrl: 'https://nahian.bd/_astro/train.DviEu3zq.mp3' },
  { slug: 'inside-a-train', name: 'Inside a train', category: 'transport', iconName: 'Armchair', kind: 'file', audioUrl: 'https://nahian.bd/_astro/inside-a-train.Dooiov-G.mp3' },
  { slug: 'airplane', name: 'Airplane', category: 'transport', iconName: 'Plane', kind: 'file', audioUrl: 'https://nahian.bd/_astro/airplane.SKKSw1n5.mp3' },
  { slug: 'sailboat', name: 'Sailboat', category: 'transport', iconName: 'Sailboat', kind: 'file', audioUrl: 'https://nahian.bd/_astro/sailboat.DFSKR9Fk.mp3' },
  { slug: 'rowing-boat', name: 'Rowing boat', category: 'transport', iconName: 'Ship', kind: 'file', audioUrl: 'https://nahian.bd/_astro/rowing-boat.BpBWvw7x.mp3' },
  { slug: 'submarine', name: 'Submarine', category: 'transport', iconName: 'Navigation', kind: 'file', audioUrl: 'https://nahian.bd/_astro/submarine.DQQ7GZv7.mp3' },

  // Things
  { slug: 'keyboard', name: 'Keyboard', category: 'things', iconName: 'Keyboard', kind: 'file', audioUrl: 'https://nahian.bd/_astro/keyboard.CGAR0l4Q.mp3' },
  { slug: 'typewriter', name: 'Typewriter', category: 'things', iconName: 'FileText', kind: 'file', audioUrl: 'https://nahian.bd/_astro/typewriter.DfFQNG84.mp3' },
  { slug: 'paper', name: 'Paper', category: 'things', iconName: 'Scroll', kind: 'file', audioUrl: 'https://nahian.bd/_astro/paper.0Prqz2Le.mp3' },
  { slug: 'clock', name: 'Clock', category: 'things', iconName: 'Clock', kind: 'file', audioUrl: 'https://nahian.bd/_astro/clock.Cp6_T4Ej.mp3' },
  { slug: 'ceiling-fan', name: 'Ceiling fan', category: 'things', iconName: 'Fan', kind: 'file', audioUrl: 'https://nahian.bd/_astro/ceiling-fan.YzCgTXQO.mp3' },
  { slug: 'wind-chimes', name: 'Wind chimes', category: 'things', iconName: 'Bell', kind: 'file', audioUrl: 'https://nahian.bd/_astro/wind-chimes.DVl7gw6j.mp3' },
  { slug: 'boiling-water', name: 'Boiling water', category: 'things', iconName: 'Coffee', kind: 'file', audioUrl: 'https://nahian.bd/_astro/boiling-water.B_XPZ-lQ.mp3' },
  { slug: 'vinyl-effect', name: 'Vinyl crackle', category: 'things', iconName: 'Disc', kind: 'file', audioUrl: 'https://nahian.bd/_astro/vinyl-effect.zpEb16O5.mp3' },

  // City
  { slug: 'busy-street', name: 'Busy street', category: 'city', iconName: 'Footprints', kind: 'file', audioUrl: 'https://nahian.bd/_astro/busy-street.CRRgRiRk.mp3' },
  { slug: 'traffic', name: 'Traffic', category: 'city', iconName: 'Car', kind: 'file', audioUrl: 'https://nahian.bd/_astro/traffic.Dnz0bnTe.mp3' },
  { slug: 'highway', name: 'Highway', category: 'city', iconName: 'Route', kind: 'file', audioUrl: 'https://nahian.bd/_astro/highway.UDhkN4uj.mp3' },
  { slug: 'road', name: 'Road', category: 'city', iconName: 'Milestone', kind: 'file', audioUrl: 'https://nahian.bd/_astro/road.j6Ti9-Nm.mp3' },
  { slug: 'crowd', name: 'Crowd', category: 'city', iconName: 'Users', kind: 'file', audioUrl: 'https://nahian.bd/_astro/crowd.C8pP-exH.mp3' },

  // Noise & Tones (synthesized with Web Audio API)
  { slug: 'brown', name: 'Brown noise', category: 'tones', iconName: 'Waves', kind: 'noise' },
  { slug: 'pink', name: 'Pink noise', category: 'tones', iconName: 'Activity', kind: 'noise' },
  { slug: 'white', name: 'White noise', category: 'tones', iconName: 'Radio', kind: 'noise' },
  { slug: 'alpha', name: 'Binaural alpha', sub: '10 Hz • Relaxed focus', category: 'tones', iconName: 'Headphones', kind: 'binaural' },
  { slug: 'beta', name: 'Binaural beta', sub: '18 Hz • High alertness', category: 'tones', iconName: 'Zap', kind: 'binaural' },
  { slug: 'gamma', name: 'Binaural gamma', sub: '40 Hz • Problem solving', category: 'tones', iconName: 'Flame', kind: 'binaural' },
  { slug: 'scifi', name: 'Starship warp hum', sub: 'Ambient deep space', category: 'tones', iconName: 'Rocket', kind: 'scifi' },
];

export const YOUTUBE_PICKS: YouTubePick[] = [
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
