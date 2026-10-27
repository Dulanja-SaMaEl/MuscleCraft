import React from 'react';
import type { Metadata } from 'next';
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
  Flame,
  Users,
  User,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Training Programs & Memberships — BurnZone & 90 Days Better Me',
  description:
    'Explore MuscleCraft training programs: BurnZone Functional Fitness, 90 Days Better Me personalized online coaching, and VIP strength mentorship by Coach Adeesha.',
  alternates: {
    canonical: '/memberships',
  },
  openGraph: {
    title: 'MuscleCraft Training Programs & Coaching Tiers',
    description:
      'Compare Sole, Couple, and 90-Day VIP Coaching programs. Evidence-based progressive overload and structured nutrition.',
    url: 'https://musclecraft.lk/memberships',
  },
};

export default function MembershipsPage() {
  const comparisonItems = [
    { feature: 'Full Facility & Equipment Access', sole: true, couple: true, vip: true },
    { feature: 'Locker Rooms, Showers & Amenities', sole: true, couple: true, vip: true },
    { feature: 'Initial Physical Orientation by Coach Adeesha', sole: true, couple: true, vip: true },
    { feature: 'Free Weight, Cable & Conditioning Zones', sole: true, couple: true, vip: true },
    { feature: 'Access for 2 Partners / Companions', sole: false, couple: true, vip: false },
    { feature: 'Periodic Body Measurement & Progress Audit', sole: true, couple: true, vip: true },
    { feature: 'Personalized Nutrition & Macro Protocols', sole: false, couple: false, vip: true },
    { feature: 'Weekly Direct Coach WhatsApp Form Audits', sole: false, couple: false, vip: true },
    { feature: 'Exclusive Exercise Video Vault Access', sole: false, couple: false, vip: true },
    { feature: '1-on-1 Consultation with Coach Adeesha', sole: false, couple: false, vip: true },
  ];

  const cohortPhases = [
    {
      phase: 'Phase 1: Foundation & Baseline',
      weeks: 'Weeks 1 – 3',
      desc: 'Private 1-on-1 strategy screening with Coach Adeesha. Movement screening, technique audit on squat/bench/deadlift, and establishment of wholesome nutritional baseline.',
    },
    {
      phase: 'Phase 2: Progressive Overload & Recomp',
      weeks: 'Weeks 4 – 8',
      desc: 'Structured wave periodization. Weekly body recomposition check-ins, form adjustments, and personalized macro tuning to accelerate fat loss and dense lean muscle acquisition.',
    },
    {
      phase: 'Phase 3: Peak Conditioning & Habit Realization',
      weeks: 'Weeks 9 – 12',
      desc: 'Strength realization cycle, final physique composition audit, and sustainable long-term athletic programming so you maintain discipline permanently.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#080809]">
      <Navbar />

      <main className="flex-grow pt-32 sm:pt-36 lg:pt-40 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Hero */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-xs font-bold text-crimson-400 uppercase tracking-widest bg-crimson-950/40 px-3.5 py-1 rounded-full border border-crimson-500/30">
            MuscleCraft Programs & Membership Matrix
          </span>
          <h1
            style={{
              fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
            className="text-[32px] sm:text-[40px] lg:text-[46px] text-white tracking-tight leading-tight mt-4 mb-6"
          >
            Built For Relentless Discipline
          </h1>
          <p className="text-gray-300 text-base sm:text-lg leading-relaxed font-normal">
            Whether you are training solo, with a partner, or enrolling in the flagship 90 Days Better Me online coaching cohort, our structured programs guarantee progressive physiological results.
          </p>
        </div>

        {/* 3-Phase Curriculum */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2
              style={{
                fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
              className="text-[28px] sm:text-[34px] text-white tracking-tight"
            >
              12-Week Progressive Coaching Methodology
            </h2>
            <div className="w-12 h-1 bg-crimson-600 mx-auto mt-3 rounded-full shadow-[0_0_8px_rgba(186,26,26,0.6)]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cohortPhases.map((p, idx) => (
              <div
                key={idx}
                className="bg-[#121215] border border-white/[0.08] p-6 rounded-2xl space-y-3 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-crimson-600/5 rounded-bl-full pointer-events-none" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-crimson-400 bg-crimson-950/40 px-2.5 py-0.5 rounded border border-crimson-800/40 font-mono">
                  {p.weeks}
                </span>
                <h3 className="text-lg font-bold text-white tracking-wide">{p.phase}</h3>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tier Comparison Matrix */}
        <div className="bg-[#121215] border border-white/[0.08] rounded-3xl p-6 sm:p-10 mb-20 shadow-2xl">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2
              style={{
                fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
              className="text-[28px] sm:text-[34px] text-white tracking-tight"
            >
              Membership Matrix & Entitlements
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-2">
              Compare Sole, Couple, and 90-Day VIP Coaching offerings. All rates in Sri Lankan Rupees (LKR).
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#18181d] text-gray-300 uppercase tracking-wider border-b border-white/[0.08]">
                <tr>
                  <th className="py-4 px-4 sm:px-6">Perks & Features</th>
                  <th className="py-4 px-4 sm:px-6 text-center">
                    <div className="flex items-center justify-center gap-1.5 font-bold text-gray-200">
                      <User className="w-4 h-4 text-crimson-400" /> Sole (Individual)
                    </div>
                    <div className="text-white font-bold text-xl sm:text-2xl mt-1 font-mono">
                      Rs. 4,500 <span className="text-xs font-normal text-gray-400">/ mo</span>
                    </div>
                    <div className="text-[10px] text-gray-400">+ Rs. 500 Admission</div>
                  </th>
                  <th className="py-4 px-4 sm:px-6 text-center">
                    <div className="flex items-center justify-center gap-1.5 font-bold text-purple-300">
                      <Users className="w-4 h-4 text-purple-400" /> Couple (2 Partners)
                    </div>
                    <div className="text-white font-bold text-xl sm:text-2xl mt-1 font-mono">
                      Rs. 8,000 <span className="text-xs font-normal text-gray-400">/ mo</span>
                    </div>
                    <div className="text-[10px] text-gray-400">+ Rs. 1,000 Admission</div>
                  </th>
                  <th className="py-4 px-4 sm:px-6 text-center bg-crimson-950/20 border-x border-crimson-800/30">
                    <div className="flex items-center justify-center gap-1 text-crimson-400 font-bold">
                      <Star className="w-3.5 h-3.5 fill-crimson-500" />
                      90 Days Better Me
                    </div>
                    <div className="text-white font-bold text-xl sm:text-2xl mt-1 font-mono">
                      Rs. 8,000 <span className="text-xs font-normal text-gray-400">/ 12 wks</span>
                    </div>
                    <div className="text-[10px] text-emerald-400 font-semibold">Zero Admission Fee</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {comparisonItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02]">
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-gray-200">{item.feature}</td>
                    <td className="py-3.5 px-4 sm:px-6 text-center">
                      {item.sole ? (
                        <div className="w-5 h-5 rounded-full bg-crimson-950/80 border border-crimson-600 flex items-center justify-center mx-auto text-crimson-400">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <span className="text-gray-600 font-bold">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-center">
                      {item.couple ? (
                        <div className="w-5 h-5 rounded-full bg-purple-950/80 border border-purple-600 flex items-center justify-center mx-auto text-purple-300">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <span className="text-gray-600 font-bold">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-center bg-crimson-950/10 border-x border-crimson-800/20">
                      {item.vip ? (
                        <div className="w-5 h-5 rounded-full bg-crimson-900/40 border border-crimson-500 flex items-center justify-center mx-auto text-crimson-300 shadow-[0_0_8px_rgba(186,26,26,0.5)]">
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
              Verified domestic bank transfer or branch cash deposit. Zero hidden charges.
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/checkout?tier=sole_3m"
                className="px-5 py-2.5 bg-white/5 text-gray-200 hover:text-white border border-white/10 rounded-xl font-semibold text-xs transition-colors"
              >
                Join Sole (Rs. 12,000 / 3M)
              </Link>
              <Link
                href="/checkout?tier=couple_3m"
                className="px-5 py-2.5 bg-white/5 text-purple-300 hover:text-white border border-purple-800/40 rounded-xl font-semibold text-xs transition-colors"
              >
                Join Couple (Rs. 22,500 / 3M)
              </Link>
              <Link
                href="/checkout?tier=coaching_90"
                className="px-6 py-2.5 bg-crimson-600 hover:bg-crimson-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-crimson-glow"
              >
                Enroll in 90 Days Better Me
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
