import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ContextMenu } from '@/components/ui/ContextMenu';
import { ThemeManager } from '@/components/ui/ThemeManager';
import { SoundManager } from '@/components/ui/SoundManager';
import { AuthRecoveryListener } from '@/components/auth/AuthRecoveryListener';
import { PortfolioProvider } from '@/context/PortfolioContext';
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
    icon: '/favicon.ico',
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
              try {
                // Neutralize browser extension DOM mutations (e.g. Bitdefender bis_skin_checked) that break React hydration
                var origSet = Element.prototype.setAttribute;
                Element.prototype.setAttribute = function(name, val) {
                  if (name === 'bis_skin_checked') return;
                  return origSet.apply(this, arguments);
                };
                if (typeof document !== 'undefined') {
                  if (window.MutationObserver) {
                    var obs = new MutationObserver(function(muts) {
                      for (var i = 0; i < muts.length; i++) {
                        var m = muts[i];
                        if (m.attributeName === 'bis_skin_checked' && m.target) {
                          m.target.removeAttribute('bis_skin_checked');
                        }
                      }
                    });
                    obs.observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ['bis_skin_checked'] });
                  }
                }
                if (typeof window !== 'undefined') {
                  var origError = console.error;
                  console.error = function() {
                    for (var i = 0; i < arguments.length; i++) {
                      var a = arguments[i];
                      if (typeof a === 'string' && a.indexOf('bis_skin_checked') !== -1) {
                        return;
                      }
                    }
                    return origError.apply(console, arguments);
                  };
                }
              } catch(e){}
            })();`,
          }}
        />
      </head>
      <body className="min-h-dvh antialiased font-sans [scrollbar-gutter:stable]" suppressHydrationWarning>
        <PortfolioProvider>
          <AuthRecoveryListener />
          <ThemeManager />
          <SoundManager />
          {children}
          <ContextMenu />
        </PortfolioProvider>
      </body>
    </html>
  );
}
