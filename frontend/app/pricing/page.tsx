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
        {/* Main Pricing Cards from Reference Image */}
        <PricingSection />

        {/* Bank Transfer Guide */}
        <section className="py-16 bg-[#0c0c0f] border-t border-b border-white/[0.06]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <span className="text-xs font-bold text-gold uppercase tracking-widest bg-gold/10 px-3 py-1 rounded-full border border-gold/30">
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
              <div className="bg-[#121215] border border-white/[0.08] p-6 rounded-lg space-y-2">
                <span className="w-7 h-7 rounded-full bg-gold text-black font-extrabold text-xs flex items-center justify-center font-mono">
                  1
                </span>
                <h3 className="text-sm font-bold text-white uppercase">Generate Unique Code</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Select your tier on the checkout screen. A unique audit reference code (e.g., TRF-IRON-74921) is automatically generated.
                </p>
              </div>

              <div className="bg-[#121215] border border-white/[0.08] p-6 rounded-lg space-y-2">
                <span className="w-7 h-7 rounded-full bg-gold text-black font-extrabold text-xs flex items-center justify-center font-mono">
                  2
                </span>
                <h3 className="text-sm font-bold text-white uppercase">Execute Wire or ACH</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Transfer funds through your online banking or mobile app, ensuring your reference code is entered in the wire memo.
                </p>
              </div>

              <div className="bg-[#121215] border border-white/[0.08] p-6 rounded-lg space-y-2">
                <span className="w-7 h-7 rounded-full bg-gold text-black font-extrabold text-xs flex items-center justify-center font-mono">
                  3
                </span>
                <h3 className="text-sm font-bold text-white uppercase">Instant Activation</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Our accounting team reconciles the transfer and activates your member access, assigning your coach immediately.
                </p>
              </div>
            </div>

            <div className="text-center mt-10">
              <Link
                href="/checkout"
                className="inline-flex items-center gap-2 px-7 py-3 bg-[#D4A359] hover:bg-[#C2934B] text-[#111111] font-semibold text-[13px] sm:text-[14px] uppercase tracking-wider rounded transition-all shadow-md hover:shadow-gold-glow"
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
