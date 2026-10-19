'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#080809]">
      <Navbar />

      <main className="flex-grow pt-32 sm:pt-36 lg:pt-40 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full text-gray-300">
        <h1 className="text-3xl font-extrabold text-white uppercase tracking-tight mb-8">
          Privacy Policy
        </h1>

        <div className="bg-[#121215] border border-white/[0.08] p-8 rounded-lg space-y-6 text-xs sm:text-sm leading-relaxed">
          <p>
            IronForge Athletic Club LLC ("IronForge", "we", "our") respects your privacy and is
            committed to safeguarding personal information, medical screening forms, and body
            measurement telemetry collected across our web platform and physical facilities.
          </p>

          <h2 className="text-base font-bold text-white uppercase pt-4 border-t border-white/[0.08]">
            1. Information We Collect
          </h2>
          <p>
            We collect personal identity records (name, email address, telephone contact), financial
            wire verification logs (bank name, transfer date, audit reference codes), and coaching
            telemetry (body weight, body fat %, circumferences, training notes, and coach session recordings).
          </p>

          <h2 className="text-base font-bold text-white uppercase pt-4 border-t border-white/[0.08]">
            2. Medical & Physiological Telemetry Privacy
          </h2>
          <p>
            All weekly body analytics, diet plans, and 1-on-1 coaching notes are strictly restricted via
            access-control boundaries (IDOR prevention). No other athlete, member, or external party can
            view, inspect, or modify your personal biometric progress. Only your assigned head coach and
            designated athletic directors retain audit privileges.
          </p>

          <h2 className="text-base font-bold text-white uppercase pt-4 border-t border-white/[0.08]">
            3. Financial Transfer Security
          </h2>
          <p>
            We do not store full bank account credentials or credit card numbers. Manual wire references
            are reconciled against domestic banking ledgers and archived for statutory accounting and audit purposes.
          </p>

          <h2 className="text-base font-bold text-white uppercase pt-4 border-t border-white/[0.08]">
            4. Contact
          </h2>
          <p>
            For privacy inquiries or data erasure requests, please contact our administrative desk at{' '}
            <strong className="text-gold">privacy@ironforge.com</strong>.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
