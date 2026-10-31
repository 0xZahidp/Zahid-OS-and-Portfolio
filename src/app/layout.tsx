import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#0d0d0f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'Md Zahid Hasan Patwary (Zahid) — Developer Profile',
  description:
    'Developer & Growth Strategist | Building SaaS & Web3 products | Passionate about code, community & scaling ideas into impact.',
  keywords: [
    'Md Zahid Hasan Patwary',
    'Zahid',
    '0xZahidp',
    'Developer Portfolio',
    'SaaS',
    'Web3',
    'Next.js',
    'Supabase',
    'Tailwind CSS',
  ],
  authors: [{ name: 'Md Zahid Hasan Patwary', url: 'https://zahidp.com' }],
  creator: 'Md Zahid Hasan Patwary',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://zahidp.com'
  ),
  openGraph: {
    title: 'Md Zahid Hasan Patwary (Zahid) — Developer Profile',
    description:
      'Developer & Growth Strategist | Building SaaS & Web3 products | Passionate about code, community & scaling ideas into impact.',
    url: '/',
    siteName: 'Zahid',
    locale: 'en_US',
    type: 'profile',
    images: [
      {
        url: '/images/avatar.webp',
        width: 800,
        height: 800,
        alt: 'Md Zahid Hasan Patwary - Developer Profile',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Md Zahid Hasan Patwary (Zahid) — Developer Profile',
    description:
      'Developer & Growth Strategist | Building SaaS & Web3 products | Passionate about code, community & scaling ideas into impact.',
    creator: '@0xZahidP',
    images: ['/images/avatar.webp'],
  },
  icons: {
    icon: '/images/avatar.webp',
    apple: '/images/avatar.webp',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`scroll-smooth ${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh antialiased font-sans [scrollbar-gutter:stable]">
        {children}
      </body>
    </html>
  );
}
