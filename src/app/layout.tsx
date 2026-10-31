import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#0d0d0f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'Al Nahian — Developer Profile | FolioFrame',
  description:
    'Founding engineer and product builder turning complex ideas into products that ship globally. CTO at Bidvers and Software Engineer at GymScanner.',
  keywords: [
    'Al Nahian',
    'FolioFrame',
    'Developer Portfolio',
    'CTO',
    'Software Engineer',
    'Full Stack Engineer',
    'Laravel',
    'Next.js',
    'Agentic AI',
  ],
  authors: [{ name: 'Al Nahian', url: 'https://nahian.bd' }],
  creator: 'Al Nahian',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://folioframe.dev'
  ),
  openGraph: {
    title: 'Al Nahian — Developer Profile',
    description:
      'Founding engineer and product builder turning complex ideas into products that ship globally.',
    url: '/',
    siteName: 'FolioFrame',
    locale: 'en_US',
    type: 'profile',
    images: [
      {
        url: '/images/avatar.webp',
        width: 800,
        height: 800,
        alt: 'Al Nahian - Developer Profile',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Al Nahian — Developer Profile',
    description:
      'Founding engineer and product builder turning complex ideas into products that ship globally.',
    creator: '@alnahian2003',
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
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className="min-h-dvh antialiased [scrollbar-gutter:stable]">
        {children}
      </body>
    </html>
  );
}
