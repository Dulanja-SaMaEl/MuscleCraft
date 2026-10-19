'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import {
  Check,
  Calendar,
  Utensils,
  Video,
  TrendingUp,
  Dumbbell,
  ShieldCheck,
  ArrowRight,
  Star,
} from 'lucide-react';

export default function MembershipsPage() {
  const comparisonItems = [
    { feature: '24/7 Biometric Gym Access', monthly: true, vip: true },
    { feature: 'Locker Rooms, Showers & Dry Sauna', monthly: true, vip: true },
    { feature: 'Free Weight & Power Rack Access', monthly: true, vip: true },
    { feature: 'Common Exercise Video Library', monthly: true, vip: true },
    { feature: 'Initial 1-on-1 Strategy Consultation Call', monthly: false, vip: true },
    { feature: 'Weekly Live Cohort Group Masterminds', monthly: false, vip: true },
    { feature: 'Personalized Nutrition & Macro Protocols', monthly: false, vip: true },
    { feature: 'Weekly Body Recomp Analytics & Coach Audit', monthly: false, vip: true },
    { feature: 'Exclusive 90-Day VIP Video Vault', monthly: false, vip: true },
    { feature: 'Direct Private Coach Messaging', monthly: false, vip: true },
  ];

  const cohortPhases = [
    {
      phase: 'Phase 1: Foundation & Baseline',
      weeks: 'Weeks 1 – 3',
      desc: 'Private 1-on-1 strategy call with Coach Elena. Complete movement screening, technique audit on squat/bench/deadlift, and establishment of baseline nutritional macros.',
    },
    {
      phase: 'Phase 2: Hypertrophic Overload',
      weeks: 'Weeks 4 – 8',
      desc: 'Introduction of progressive overload wave periodization. Weekly group coaching mastermind sessions, deload strategies, and personalized macro adjustments to accelerate fat loss and lean muscle accretion.',
    },
    {
      phase: 'Phase 3: Peak Performance & Consolidation',
      weeks: 'Weeks 9 – 12',
      desc: 'Strength realization cycle, final body composition assessment, and long-term sustainable athletic programming so you maintain your results permanently.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#080809]">
      <Navbar />

      <main className="flex-grow pt-32 sm:pt-36 lg:pt-40 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Hero */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-xs font-bold text-gold uppercase tracking-widest bg-gold/10 px-3 py-1 rounded-full border border-gold/30">
            Flagship Coaching Program
          </span>
          <h1
            style={{
              fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
              fontWeight: 600,
              letterSpacing: '-0.02em',
            }}
            className="text-[32px] sm:text-[40px] lg:text-[44px] text-white tracking-tight leading-tight mt-4 mb-6"
          >
            The 90-Day VIP Athletic Transformation
          </h1>
          <p className="text-gray-300 text-base sm:text-lg leading-relaxed font-normal">
            A comprehensive, coach-guided physiological intervention designed to strip body fat, build
            dense functional muscle, and establish unshakeable athletic habits.
          </p>
        </div>

        {/* 3-Phase Curriculum */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2
              style={{
                fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
                fontWeight: 600,
                letterSpacing: '-0.02em',
              }}
              className="text-[28px] sm:text-[34px] text-white tracking-tight"
            >
              12-Week Progressive Periodization
            </h2>
            <div className="w-12 h-1 bg-gold mx-auto mt-3 rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cohortPhases.map((p, idx) => (
              <div
                key={idx}
                className="bg-[#121215] border border-white/[0.08] p-6 rounded-lg space-y-3 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-bl-full pointer-events-none" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gold bg-gold/15 px-2 py-0.5 rounded border border-gold/30 font-mono">
                  {p.weeks}
                </span>
                <h3 className="text-lg font-bold text-white tracking-wide">{p.phase}</h3>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tier Comparison Matrix */}
        <div className="bg-[#121215] border border-white/[0.08] rounded-lg p-6 sm:p-10 mb-20 shadow-card-dark">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2
              style={{
                fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
                fontWeight: 600,
                letterSpacing: '-0.02em',
              }}
              className="text-[28px] sm:text-[34px] text-white tracking-tight"
            >
              Membership Comparison Matrix
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-2">
              Select the tier that aligns with your timeline, accountability needs, and training goals.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#18181d] text-gray-300 uppercase tracking-wider border-b border-white/[0.08]">
                <tr>
                  <th className="py-4 px-4 sm:px-6">Perks & Features</th>
                  <th className="py-4 px-4 sm:px-6 text-center">
                    <div>Standard Gym</div>
                    <div className="text-gold font-bold text-[28px] mt-1 tabular-nums" style={{ fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', fontWeight: 700 }}>$50.00 <span className="text-xs font-normal text-gray-400">/ mo</span></div>
                  </th>
                  <th className="py-4 px-4 sm:px-6 text-center bg-gold/10 border-x border-gold/30">
                    <div className="flex items-center justify-center gap-1 text-gold font-bold">
                      <Star className="w-3.5 h-3.5 fill-gold" />
                      90-Day VIP Coaching
                    </div>
                    <div className="text-white font-bold text-[28px] mt-1 tabular-nums" style={{ fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', fontWeight: 700 }}>$150.00 <span className="text-xs font-normal text-gray-400">/ mo</span></div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {comparisonItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02]">
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-gray-200">{item.feature}</td>
                    <td className="py-3.5 px-4 sm:px-6 text-center">
                      {item.monthly ? (
                        <div className="w-5 h-5 rounded-full bg-green-950 border border-green-600 flex items-center justify-center mx-auto text-green-400">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <span className="text-gray-600 font-bold">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-center bg-gold/[0.03] border-x border-gold/20">
                      {item.vip ? (
                        <div className="w-5 h-5 rounded-full bg-gold/20 border border-gold flex items-center justify-center mx-auto text-gold">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <span className="text-gray-600 font-bold">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-gray-400">
              Institutional payment via verified manual bank transfer. Zero processing fees.
            </div>
            <div className="flex gap-4">
              <Link
                href="/checkout?tier=monthly"
                className="px-5 py-2.5 bg-surface-50 text-gray-200 hover:text-white border border-white/10 rounded font-semibold text-[13px] sm:text-[14px] transition-colors"
              >
                Join Monthly ($50.00)
              </Link>
              <Link
                href="/checkout?tier=coaching_90"
                className="px-6 py-2.5 bg-[#D4A359] hover:bg-[#C2934B] text-[#111111] font-semibold text-[13px] sm:text-[14px] rounded transition-all shadow-md hover:shadow-gold-glow"
              >
                Enroll in 90-Day VIP ($450.00)
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
