import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Athlete Account — Register',
  description: 'Create your MuscleCraft athlete account to choose your gym membership or 90 Days Better Me coaching tier.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
