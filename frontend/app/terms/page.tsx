'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#080809]">
      <Navbar />

      <main className="flex-grow pt-32 sm:pt-36 lg:pt-40 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full text-gray-300">
        <h1 className="text-3xl font-extrabold text-white uppercase tracking-tight mb-8">
          Terms of Service & Facility Rules
        </h1>

        <div className="bg-[#121215] border border-white/[0.08] p-8 rounded-lg space-y-6 text-xs sm:text-sm leading-relaxed">
          <p>
            Welcome to MuscleCraft Athletic Facility. By accessing our training facilities, enrolling in the
            90-Day VIP Coaching cohort, or executing manual bank transfer payments, you agree to comply
            with these binding terms.
          </p>

          <h2 className="text-base font-bold text-white uppercase pt-4 border-t border-white/[0.08]">
            1. Physical Readiness & Medical Assumption of Risk
          </h2>
          <p>
            Heavy resistance training, powerlifting, and aggressive metabolic periodization involve
            inherent physiological demands. You warrant that you have obtained medical clearance before
            initiating barbell training. MuscleCraft coaches provide performance guidance and nutrition
            recommendations, not clinical medical diagnoses.
          </p>

          <h2 className="text-base font-bold text-white uppercase pt-4 border-t border-white/[0.08]">
            2. Facility Etiquette & Calibrated Plate Hygiene
          </h2>
          <p>
            - Always strip barbells and return calibrated plates to their designated weight trees.
            <br />
            - Liquid chalk is provided and encouraged; clean excess chalk from knurling after use.
            <br />
            - Direct drop of deadlifts is permitted on competition rubber drop-pads only.
          </p>

          <h2 className="text-base font-bold text-white uppercase pt-4 border-t border-white/[0.08]">
            3. Membership Dues & Bank Transfer Policy
          </h2>
          <p>
            Memberships are confirmed upon receipt and administrative verification of the required
            manual bank transfer. Once a 90-day coaching cohort initiates and customized nutrition
            protocols are distributed, cohort fees are non-refundable, though medical freezes may be
            requested up to 30 days.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
