# FolioFrame: Modern Developer Profile & Portfolio Platform

FolioFrame is a high-performance, developer-focused profile and portfolio platform built with **Next.js 15 (App Router)**, **TypeScript**, and **Tailwind CSS v4**.

Designed from the ground up to match the visual hierarchy, restrained aesthetic, and responsiveness of the reference developer profiles (both desktop 3-column dashboard and dedicated mobile experience), FolioFrame balances minimal aesthetics with rich interactivity and prepare the foundation for multi-user profile management with Supabase.

---

## 🚀 Key Highlights & Implemented Features

1. **Pixel-Accurate Three-Column Desktop Dashboard**
   - **Left Sidebar**: Fixed/sticky navigation with brand logo, profile links, collapsible width toggle (`xl:w-65` to `w-19`), sound FX toggle, theme toggle, and copyright indicator.
   - **Center Content**: Sticky top summary header, dynamic matrix green slat canvas banner, profile hero with overlapping avatar, verification checkmark, availability indicator, live local time, tool badges, and section tabs.
   - **Right Sidebar**: Sticky follow button, "Who to follow" suggested developer cards with follower avatars, "Find me on" social accounts, and DMCA security verification badge.

2. **Dedicated Mobile Layout**
   - Designed independently rather than just scaled down.
   - Fixed top bar with hamburger menu, theme toggle, and quick contact action.
   - Responsive canvas-generated emerald matrix equalizer banner with avatar overlap.
   - Mobile action buttons (`Get in touch`, `Share` with Web Share API and clipboard fallback).
   - Fixed bottom navigation bar with safe-area spacing and active indicator states.
   - Slide-out mobile navigation drawer.

3. **Design System & Visual Language**
   - **Dark-First Tokens**: `#0D0D0F` (Background), `#171719` (Surface), `#202024` (Elevated Surface), `#2B2B30` (Borders), `#10B981` (Emerald Accent).
   - **Full Light Mode Support**: Crisp white and light gray surface palette with minty green matrix slats and dark typography.
   - **Custom Matrix Slat Canvas**: Lightweight, retina-ready HTML5 Canvas reproducing the emerald equalizer grid pattern without loading heavy images.
   - **Interactive Halo Cards**: Glowing radial hover effects that track cursor movements across cards.

4. **Rich Sections & Interactivity**
   - **About Section**: Multi-paragraph bio with expandable "Read more" / "Read less" toggles, live clock configured for `Asia/Dhaka` (GMT+6) with dynamic Day/Night indicator, remote-first preference badges, and multi-lingual rating meters with voice note tooltip states.
   - **Experience Section**: Role timeline with live status pulses, company logos, and an interactive `$120K+ Raised` stats highlight card.
   - **Tabs System**: Seamless switching between **Resume** (About, Experience, Skills, Contact) and **Work** (Featured Projects & Systems).
   - **Skills & Tools**: Comprehensive badge cloud covering Agentic AI tools (Claude, OpenAI, Antigravity, OpenCode), Full-stack tech (Laravel, PHP, JavaScript, Livewire, Alpine.js, Vue.js, Inertia, Tailwind CSS), and IDE/VCS tools.
   - **Contact Section**: One-click email copy, direct mailto launcher, and quick collaboration form.

5. **Future-Ready Supabase Architecture**
   - Clean client separation (`client.ts` for browser components, `server.ts` with service role for server environments).
   - TypeScript schema definitions for `Profile`, `Experience`, `Project`, `Skill`, and `SocialLink`.
   - `.env.example` ready for database and auth connection without blocking standalone frontend operation.

6. **SEO & Social Sharing**
   - Dynamic OpenGraph image generation (`/opengraph-image`) built with `@vercel/og` (`next/og`).
   - Semantic HTML5 tags (`<main>`, `<aside>`, `<nav>`, `<header>`, `<article>`, `<section>`, `<ol>`, `<ul>`).
   - Complete OpenGraph and Twitter card metadata.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router, Turbopack support)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4 (using CSS variables and `@custom-variant dark`)
- **Icons**: Lucide React + custom inline SVG components for brand logos
- **Backend Placeholder**: Supabase JS v2
- **Image Optimization**: `next/image` with remote domain rules

---

## 📁 Project Structure

```
folioframe/
├── public/
│   └── images/              # Local webp images for avatars, companies, and peers
├── src/
│   ├── app/
│   │   ├── globals.css      # Design tokens, variables, halo glow & utilities
│   │   ├── layout.tsx       # Root layout, metadata, viewport, SEO
│   │   ├── opengraph-image.tsx # Next.js OpenGraph image generator
│   │   └── page.tsx         # Responsive dashboard controller
│   ├── components/
│   │   ├── layout/
│   │   │   ├── DesktopLayout.tsx
│   │   │   ├── MobileLayout.tsx
│   │   │   ├── LeftSidebar.tsx
│   │   │   └── RightSidebar.tsx
│   │   ├── navigation/
│   │   │   ├── DesktopNavigation.tsx
│   │   │   ├── MobileTopBar.tsx
│   │   │   ├── MobileBottomBar.tsx
│   │   │   └── MobileMenu.tsx
│   │   ├── profile/
│   │   │   ├── ProfileHeader.tsx
│   │   │   ├── ProfileAvatar.tsx
│   │   │   ├── ProfileBanner.tsx
│   │   │   ├── ProfileBadges.tsx
│   │   │   └── ProfileTabs.tsx
│   │   ├── sections/
│   │   │   ├── AboutSection.tsx
│   │   │   ├── ExperienceSection.tsx
│   │   │   ├── SkillsSection.tsx
│   │   │   ├── ProjectsSection.tsx
│   │   │   └── ContactSection.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Badge.tsx
│   │       ├── ThemeToggle.tsx
│   │       ├── SoundToggle.tsx
│   │       └── Icons.tsx
│   ├── data/
│   │   └── profile.ts       # Structured profile data
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts    # Browser client
│   │       └── server.ts    # Server client
│   └── types/
│       └── profile.ts       # TypeScript models
├── .env.example
├── package.json
└── README.md
```

---

## 💻 Commands

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### Run Linting
```bash
npm run lint
```

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm run start
```
