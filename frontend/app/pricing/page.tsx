'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PricingSection from '@/components/PricingSection';
import FaqSection from '@/components/FaqSection';
import Link from 'next/link';
import { ShieldCheck, Building, CheckCircle2, ArrowRight } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#080809]">
      <Navbar />

      <main className="flex-grow pt-24 sm:pt-28 lg:pt-32">
        {/* Main Pricing Cards with Sole / Couple / Signature options */}
        <PricingSection />

        {/* Bank Transfer Guide */}
        <section className="py-16 bg-[#0c0c0f] border-t border-b border-white/[0.06]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <span className="text-xs font-bold text-crimson-400 uppercase tracking-widest bg-crimson-950/40 px-3 py-1 rounded-full border border-crimson-500/30">
                Payment Transparency
              </span>
              <h2
                style={{
                  fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                }}
                className="text-[28px] sm:text-[34px] text-white tracking-tight mt-3 leading-tight"
              >
                How Manual Bank Transfer Enrollment Works
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#121215] border border-white/[0.08] p-6 rounded-2xl space-y-2">
                <span className="w-7 h-7 rounded-full bg-crimson-600 text-white font-extrabold text-xs flex items-center justify-center font-mono shadow-[0_0_10px_rgba(186,26,26,0.5)]">
                  1
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Generate Unique Code</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Select Sole or Couple package on the checkout screen. A unique audit reference code (e.g., TRF-MC-749210) is automatically generated.
                </p>
              </div>

              <div className="bg-[#121215] border border-white/[0.08] p-6 rounded-2xl space-y-2">
                <span className="w-7 h-7 rounded-full bg-crimson-600 text-white font-extrabold text-xs flex items-center justify-center font-mono shadow-[0_0_10px_rgba(186,26,26,0.5)]">
                  2
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Execute Bank Transfer</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Transfer funds through your online banking (ComBank, Sampath Vishwa, HNB, BOC) or cash deposit, including your reference code in the narration.
                </p>
              </div>

              <div className="bg-[#121215] border border-white/[0.08] p-6 rounded-2xl space-y-2">
                <span className="w-7 h-7 rounded-full bg-crimson-600 text-white font-extrabold text-xs flex items-center justify-center font-mono shadow-[0_0_10px_rgba(186,26,26,0.5)]">
                  3
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Instant Activation</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Coach Adeesha reconciles the transfer in the admin desk and activates your member access and biometric profile immediately.
                </p>
              </div>
            </div>

            <div className="text-center mt-10">
              <Link
                href="/checkout"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-crimson-600 hover:bg-crimson-500 text-white font-semibold text-[13px] sm:text-[14px] uppercase tracking-wider rounded-xl transition-all shadow-crimson-glow hover:shadow-[0_0_20px_rgba(186,26,26,0.7)]"
              >
                Proceed to Checkout Form <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <FaqSection />
      </main>

      <Footer />
    </div>
  );
}
