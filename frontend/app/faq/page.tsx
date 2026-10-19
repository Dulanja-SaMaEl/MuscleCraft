'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FaqSection from '@/components/FaqSection';
import Link from 'next/link';
import { Search } from 'lucide-react';

export default function FaqPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Structured Data Schema for SEO compliance
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What are the facility operating hours?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'MuscleCraft operates 24 hours a day, 7 days a week, 365 days a year for active members via biometric RFID access. Staffed hours are Mon-Fri 06:00-22:00, Sat-Sun 08:00-18:00.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does the 90-Day VIP Coaching Program work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Upon administrative activation of your manual bank transfer, you are assigned an elite strength coach led by Coach Adeesha. Week 1 starts with your private 1-on-1 consultation and personalized nutrition protocol. In Week 2, you join the cohort weekly masterminds, record weekly body measurements, and unlock the private coaching video vault.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do manual bank transfer payments work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'When enrolling, our system generates a unique transfer reference code (e.g., TRF-MC-749210). Once your transfer is submitted, our administrative desk verifies the bank receipt and activates your membership.',
        },
      },
    ],
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#080809]">
      {/* Inject SEO JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar />

      <main className="flex-grow pt-24 sm:pt-28 lg:pt-32">
        <FaqSection />

        <div className="max-w-4xl mx-auto px-4 pb-20 text-center">
          <div className="bg-[#121215] border border-white/[0.08] p-8 rounded-lg">
            <h3 className="text-lg font-bold text-white uppercase mb-2">
              Have an unanswered question?
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              Our coaching desk is available to assist with custom program design, recovery protocols, or billing assistance.
            </p>
            <Link
              href="/contact"
              className="px-6 py-3 bg-gold hover:bg-gold-400 text-black font-extrabold text-xs uppercase tracking-wide rounded transition-colors inline-block"
            >
              Contact Our Desk
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
