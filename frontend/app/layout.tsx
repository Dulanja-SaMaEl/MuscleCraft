import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/context/auth-context';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MuscleCraft — Build Discipline. Sculpt Strength.',
  description:
    'MuscleCraft premier strength facility, customized transformation workout protocols, personalized nutrition plans, and transformative 1-on-1 mentorship with Coach Adeesha.',
  keywords: [
    'MuscleCraft',
    'gym',
    'fitness coaching',
    'online coaching',
    'workout plan',
    'diet plan',
    'body recomposition',
    'weight loss',
    'strength training',
    'personal trainer',
  ],
  authors: [{ name: 'MuscleCraft' }],
  metadataBase: new URL('https://musclecraft.lk'),
  icons: {
    icon: '/images/musclecraft-emblem.png',
    apple: '/images/musclecraft-emblem.png',
  },
  openGraph: {
    title: 'MuscleCraft — Build Discipline. Sculpt Strength.',
    description:
      'Build discipline and sculpt strength with customized workout and diet plans, proven 1-on-1 coaching, and verified client transformations.',
    url: 'https://musclecraft.lk',
    siteName: 'MuscleCraft',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MuscleCraft — Build Discipline. Sculpt Strength.',
    description: 'Build discipline. Sculpt strength. Premier workout & diet coaching.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${plusJakartaSans.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/images/musclecraft-emblem.png" />
      </head>
      <body
        suppressHydrationWarning
        className={`${plusJakartaSans.className} bg-[#08080A] text-gray-100 min-h-screen flex flex-col font-sans antialiased selection:bg-crimson selection:text-white`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
