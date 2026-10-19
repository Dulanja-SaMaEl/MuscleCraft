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
  title: 'IronForge Athletic Club — Made By Athletes For Athletes',
  description:
    'Elite strength facility, calibrated competition equipment, and premier 90-day physical transformation coaching with personalized nutrition and 1-on-1 mentorship.',
  keywords: [
    'gym',
    'fitness club',
    '90-day coaching',
    'body recomposition',
    'strength training',
    'powerlifting',
    'personal trainer',
    'Los Angeles gym',
  ],
  authors: [{ name: 'IronForge Athletic Club' }],
  metadataBase: new URL('https://ironforge-athletics.com'),
  openGraph: {
    title: 'IronForge Athletic Club — Made By Athletes For Athletes',
    description:
      'Science-backed athletic training, competition equipment, and premier 90-day transformation cohort.',
    url: 'https://ironforge-athletics.com',
    siteName: 'IronForge Athletic Club',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IronForge Athletic Club',
    description: 'Where champions are forged. Elite strength & 90-day coaching.',
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
      <body
        suppressHydrationWarning
        className="bg-[#080809] text-gray-100 min-h-screen flex flex-col font-sans antialiased selection:bg-gold selection:text-black"
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
