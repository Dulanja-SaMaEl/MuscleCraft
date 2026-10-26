import React from 'react';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ContactSection from '@/components/ContactSection';
import MapSection from '@/components/MapSection';
import ContactForm from '@/components/contact/ContactForm';

export const metadata: Metadata = {
  title: 'Contact Us — Speak with Coach Adeesha & MuscleCraft Support',
  description:
    'Get in touch with MuscleCraft. Inquire about gym memberships, private 1-on-1 coaching consultations, facility tours, and bank transfer setup.',
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'Contact MuscleCraft — Location, Phone & Inquiry Desk',
    description:
      'Reach Coach Adeesha and the MuscleCraft team directly for program design and membership queries.',
    url: 'https://musclecraft.lk/contact',
  },
};

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#080809]">
      <Navbar />

      <main className="flex-grow pt-24 sm:pt-28 lg:pt-32">
        {/* Contact Info Grid from Reference Image */}
        <ContactSection />

        {/* Interactive Inquiry Form */}
        <section className="py-16 bg-[#0c0c0f] border-t border-white/[0.06]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-[#121215] border border-white/[0.08] p-8 sm:p-10 rounded-2xl shadow-card-dark">
              <div className="text-center mb-8">
                <span className="text-xs font-bold text-crimson-400 uppercase tracking-widest bg-crimson-950/40 px-3 py-1 rounded-full border border-crimson-600/30">
                  Athlete Support Desk
                </span>
                <h2
                  style={{
                    fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                  }}
                  className="text-[28px] sm:text-[34px] text-white tracking-tight mt-3 leading-tight"
                >
                  Send Direct Inquiry
                </h2>
                <p className="text-xs text-gray-400 mt-1 font-normal">
                  Have specific questions regarding our facility, equipment specifications, or coaching roster?
                </p>
              </div>

              <ContactForm />
            </div>
          </div>
        </section>

        {/* Location Map Banner from Reference Image */}
        <MapSection />
      </main>

      <Footer />
    </div>
  );
}
