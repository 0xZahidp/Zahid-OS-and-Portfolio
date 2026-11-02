import { ZahidOsWallpaper } from '@/types/os';

export interface ZosWallpaperConfig {
  id: ZahidOsWallpaper;
  name: string;
  subtitle: string;
  tag: string;
  gradientClass: string;
  orb1Class: string;
  orb2Class: string;
  gridColor: string;
  previewBg: string;
  accentColor: string;
}

export const ZOS_WALLPAPERS: ZosWallpaperConfig[] = [
  {
    id: 'zos-emerald',
    name: 'ZOS Aurora Mesh',
    subtitle: 'Signature Obsidian & Emerald Glow',
    tag: 'Signature',
    gradientClass: 'from-zinc-950 via-emerald-950/70 to-neutral-950',
    orb1Class: 'bg-emerald-500/25',
    orb2Class: 'bg-teal-500/20',
    gridColor: 'rgba(16,185,129,0.08)',
    previewBg: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #020617 100%)',
    accentColor: '#10b981',
  },
  {
    id: 'zos-cyber',
    name: 'ZOS Cyber Matrix',
    subtitle: 'Carbon Black & Circuit Grid',
    tag: 'Cyber Tech',
    gradientClass: 'from-black via-zinc-950 to-neutral-900',
    orb1Class: 'bg-emerald-400/20',
    orb2Class: 'bg-cyan-500/15',
    gridColor: 'rgba(52,211,153,0.1)',
    previewBg: 'linear-gradient(135deg, #09090b 0%, #18181b 50%, #000000 100%)',
    accentColor: '#34d399',
  },
  {
    id: 'zos-midnight',
    name: 'ZOS Midnight Nebula',
    subtitle: 'Deep Space Indigo & Violet',
    tag: 'Cosmic',
    gradientClass: 'from-slate-950 via-indigo-950/80 to-zinc-950',
    orb1Class: 'bg-indigo-500/25',
    orb2Class: 'bg-violet-500/20',
    gridColor: 'rgba(99,102,241,0.08)',
    previewBg: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #09090b 100%)',
    accentColor: '#818cf8',
  },
  {
    id: 'zos-sunset',
    name: 'ZOS Solar Flare',
    subtitle: 'Molten Amber & Crimson Dusk',
    tag: 'Twilight',
    gradientClass: 'from-zinc-950 via-amber-950/60 to-rose-950/70',
    orb1Class: 'bg-amber-500/25',
    orb2Class: 'bg-rose-500/20',
    gridColor: 'rgba(245,158,11,0.08)',
    previewBg: 'linear-gradient(135deg, #451a03 0%, #7f1d1d 50%, #09090b 100%)',
    accentColor: '#f59e0b',
  },
  {
    id: 'zos-glacier',
    name: 'ZOS Nordic Glacier',
    subtitle: 'Glacial Titanium & Electric Sapphire',
    tag: 'Arctic Glass',
    gradientClass: 'from-slate-950 via-cyan-950/70 to-blue-950/60',
    orb1Class: 'bg-cyan-500/25',
    orb2Class: 'bg-blue-500/20',
    gridColor: 'rgba(6,182,212,0.08)',
    previewBg: 'linear-gradient(135deg, #083344 0%, #172554 50%, #09090b 100%)',
    accentColor: '#06b6d4',
  },
  {
    id: 'zos-obsidian',
    name: 'ZOS Obsidian Stealth',
    subtitle: 'Pure Minimalist Matte Carbon',
    tag: 'Monochrome',
    gradientClass: 'from-zinc-950 via-neutral-950 to-black',
    orb1Class: 'bg-white/5',
    orb2Class: 'bg-zinc-700/15',
    gridColor: 'rgba(255,255,255,0.04)',
    previewBg: 'linear-gradient(135deg, #18181b 0%, #09090b 50%, #000000 100%)',
    accentColor: '#a1a1aa',
  },
];

export function normalizeWallpaperId(id?: string): ZahidOsWallpaper {
  if (!id) return 'zos-emerald';
  if (id === 'emerald-mesh') return 'zos-emerald';
  if (id === 'cyber-dark') return 'zos-cyber';
  if (id === 'ios-midnight') return 'zos-midnight';
  if (id === 'cupertino-blue') return 'zos-glacier';
  return id as ZahidOsWallpaper;
}

export function getZosWallpaper(id?: string): ZosWallpaperConfig {
  const normalized = normalizeWallpaperId(id);
  const found = ZOS_WALLPAPERS.find((w) => w.id === normalized);
  return found || ZOS_WALLPAPERS[0];
}
