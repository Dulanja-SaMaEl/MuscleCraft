import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Client Dashboard & Body Analytics | MuscleCraft',
  description: 'Private member portal for tracking weekly body measurements, diet protocols, and session video reviews.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
