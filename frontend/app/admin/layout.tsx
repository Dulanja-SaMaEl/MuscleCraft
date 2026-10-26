import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Owner Portal & Operations Desk | MuscleCraft',
  description: 'Executive management desk for Coach Adeesha Kumarasingha: bank reconciliations, client progress analytics, and broadcast center.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
