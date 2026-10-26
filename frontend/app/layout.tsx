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
  title: {
    default: 'MuscleCraft — Build Discipline. Sculpt Strength.',
    template: '%s | MuscleCraft',
  },
  description:
    'MuscleCraft premier strength facility, customized transformation workout protocols, personalized nutrition plans, and transformative 1-on-1 mentorship with Coach Adeesha Kumarasingha.',
  keywords: [
    'MuscleCraft',
    'gym Sri Lanka',
    'fitness coaching',
    'online coaching',
    'workout plan',
    'diet plan',
    'body recomposition',
    'weight loss Sri Lanka',
    'strength training',
    'personal trainer',
    'Adeesha Kumarasingha',
    'BurnZone CrossFit',
    '90 Days Better Me',
  ],
  authors: [{ name: 'Adeesha Kumarasingha', url: 'https://musclecraft.lk/about' }],
  creator: 'Adeesha Kumarasingha',
  publisher: 'MuscleCraft',
  metadataBase: new URL('https://musclecraft.lk'),
  alternates: {
    canonical: '/',
  },
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
    locale: 'en_LK',
    type: 'website',
    images: [
      {
        url: '/images/musclecraft-emblem.png',
        width: 800,
        height: 800,
        alt: 'MuscleCraft Emblem — Build Discipline. Sculpt Strength.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MuscleCraft — Build Discipline. Sculpt Strength.',
    description: 'Build discipline. Sculpt strength. Premier workout & diet coaching.',
    images: ['/images/musclecraft-emblem.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const jsonLdSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'ExerciseGym',
      '@id': 'https://musclecraft.lk/#gym',
      name: 'MuscleCraft',
      alternateName: 'MuscleCraft Fitness & Coaching',
      url: 'https://musclecraft.lk',
      logo: 'https://musclecraft.lk/images/musclecraft-emblem.png',
      image: 'https://musclecraft.lk/images/musclecraft-emblem.png',
      description:
        'Premier fitness and coaching facility dedicated to strength training, body recomposition, and personal coaching founded by Adeesha Kumarasingha.',
      priceRange: 'LKR 4,500 - LKR 78,000',
      founder: {
        '@type': 'Person',
        name: 'Adeesha Kumarasingha',
        jobTitle: 'Founder & Head Coach',
        description:
          'NVQ Certified Fitness and Personal Trainer, ISO 9001 Certified Aerobic Instructor, with a Diploma in Exercise and Sport Science and over 7 years of fitness industry experience.',
      },
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'LK',
      },
      currenciesAccepted: 'LKR',
      paymentAccepted: 'Bank Transfer, Cash',
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Gym Memberships & Coaching Programs',
        itemListElement: [
          {
            '@type': 'Offer',
            name: 'Sole Membership (1 Month)',
            price: '4500',
            priceCurrency: 'LKR',
          },
          {
            '@type': 'Offer',
            name: 'Sole Membership (3 Months)',
            price: '12000',
            priceCurrency: 'LKR',
          },
          {
            '@type': 'Offer',
            name: 'Couple Membership (1 Month)',
            price: '8000',
            priceCurrency: 'LKR',
          },
          {
            '@type': 'Offer',
            name: 'Couple Membership (3 Months)',
            price: '22500',
            priceCurrency: 'LKR',
          },
        ],
      },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://musclecraft.lk/#website',
      url: 'https://musclecraft.lk',
      name: 'MuscleCraft',
      description: 'Build Discipline. Sculpt Strength.',
      publisher: {
        '@id': 'https://musclecraft.lk/#gym',
      },
    },
  ],
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
        <link rel="icon" href="/images/musclecraft-emblem.png" />
        {/* Preload First Frame for Instant LCP Paint */}
        <link
          rel="preload"
          as="image"
          href="/media/frames/desktop/frame_0001.webp"
          type="image/webp"
          fetchPriority="high"
          media="(min-width: 769px)"
        />
        <link
          rel="preload"
          as="image"
          href="/media/frames/mobile/frame_0001.webp"
          type="image/webp"
          fetchPriority="high"
          media="(max-width: 768px)"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
        />
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
