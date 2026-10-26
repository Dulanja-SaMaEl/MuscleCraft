import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Coach Workspace & Program Builder | MuscleCraft',
  description: 'Head Coach Adeesha Kumarasingha instruction desk: athlete roster oversight, customized macro prescription, and technique video delivery.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
