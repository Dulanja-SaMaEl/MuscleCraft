import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Enroll & Payment Verification — Join MuscleCraft',
  description: 'Complete your membership enrollment and manual bank slip verification with instant reference code generation.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
