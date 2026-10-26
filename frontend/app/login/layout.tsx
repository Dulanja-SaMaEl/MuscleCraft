import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portal Access & Athlete Login | MuscleCraft',
  description: 'Log in to MuscleCraft Client Management Portal, Instructor Workspace, or Owner Operations Desk.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
