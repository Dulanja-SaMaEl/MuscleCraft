'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { Check, Star, Flame, Users, User, Sparkles, ShieldCheck } from 'lucide-react';
import Card3DTilt from './3d/Card3DTilt';
import SectionHeader from './motion/SectionHeader';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { revealOnScroll } from './motion/scrollReveal';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function PricingSection() {
  const [activeCategory, setActiveCategory] = useState<'sole' | 'couple' | 'signature'>('sole');
  const sectionRef = useRef<HTMLElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;
      revealOnScroll(
        section.querySelectorAll('.pricing-std-card, .pricing-flagship-card'),
        {
          trigger: gridRef.current,
          y: 40,
          stagger: 0.12,
          duration: 1.1,
          start: 'top 88%',
        }
      );
    },
    { scope: sectionRef, dependencies: [activeCategory] }
  );

  interface PricingTierItem {
    id: string;
    name: string;
    price: string;
    period: string;
    admission: string;
    totalFirstMonth: string;
    monthlyBreakdown?: string;
    badge: string;
    featured: boolean;
    popularTag?: string;
    features: string[];
    ctaText: string;
    href: string;
  }

  const solePackages: PricingTierItem[] = [
    {
      id: 'sole_1m',
      name: 'Sole 1 Month',
      price: 'Rs. 4,500',
      period: '/ month',
      admission: 'Rs. 500 Admission Fee',
      totalFirstMonth: 'Rs. 5,000 Total to Start',
      badge: 'Flexible Monthly',
      featured: false,
      features: [
        'Full facility & gym equipment access',
        'Locker rooms, showers & changing areas',
        'Initial movement screening by Coach Adeesha',
        'Free weight, dumbbell & cable functional zones',
        'Standard biometric entry registration',
      ],
      ctaText: 'Enroll Sole 1M',
      href: '/checkout?tier=sole_1m',
    },
    {
      id: 'sole_3m',
      name: 'Sole 3 Months',
      price: 'Rs. 12,000',
      period: '/ quarter',
      monthlyBreakdown: 'Rs. 4,000 / month',
      admission: 'Rs. 500 Admission Fee',
      totalFirstMonth: 'Save Rs. 1,500 vs Monthly',
      badge: 'Most Popular Quarter',
      featured: true,
      popularTag: 'Most Popular',
      features: [
        'Full facility & gym equipment access',
        'Locker rooms, showers & changing areas',
        'Bi-weekly body measurement & progress tracking',
        'Customized workout split guidance',
        'Dietary baseline review with Coach Adeesha',
        'Save Rs. 1,500 compared to 1-month renewals',
      ],
      ctaText: 'Enroll Sole 3M',
      href: '/checkout?tier=sole_3m',
    },
    {
      id: 'sole_6m',
      name: 'Sole 6 Months',
      price: 'Rs. 22,000',
      period: '/ half-year',
      monthlyBreakdown: 'Rs. 3,666 / month',
      admission: 'Rs. 500 Admission Fee',
      totalFirstMonth: 'Save Rs. 5,000 vs Monthly',
      badge: 'Semi-Annual Commitment',
      featured: false,
      features: [
        'Full facility & gym equipment access',
        'Comprehensive body recomposition tracking',
        'Nutritional progression adjustments',
        'Priority workout review from Coach Adeesha',
        'Access to member training video clinic',
        'Save Rs. 5,000 compared to 1-month renewals',
      ],
      ctaText: 'Enroll Sole 6M',
      href: '/checkout?tier=sole_6m',
    },
    {
      id: 'sole_1y',
      name: 'Sole 1 Year',
      price: 'Rs. 40,000',
      period: '/ year',
      monthlyBreakdown: 'Only Rs. 3,333 / month',
      admission: 'Rs. 500 Admission Fee',
      totalFirstMonth: 'Maximum Value: Save Rs. 14,000',
      badge: 'Best Value Transformation',
      featured: true,
      popularTag: 'Best Value',
      features: [
        'Full 365-day VIP facility & training access',
        'Complete transformation program roadmap',
        'Monthly physique measurements & body fat check',
        'Direct WhatsApp support from Coach Adeesha',
        'Locker & towel service priority',
        'Maximum savings: Save Rs. 14,000 per year',
      ],
      ctaText: 'Enroll Sole 1 Year',
      href: '/checkout?tier=sole_1y',
    },
  ];

  const couplePackages: PricingTierItem[] = [
    {
      id: 'couple_1m',
      name: 'Couple 1 Month',
      price: 'Rs. 8,000',
      period: '/ month (for 2)',
      admission: 'Rs. 1,000 Admission Fee',
      totalFirstMonth: 'Rs. 9,000 Total to Start for 2',
      badge: '2 Partners Access',
      featured: false,
      features: [
        'Full facility access for two partners/buddies',
        'Locker rooms, showers & facility amenities',
        'Shared initial orientation by Coach Adeesha',
        'Sync your workout schedules together',
        'Affordable partner entry at Rs. 4,000/person',
      ],
      ctaText: 'Enroll Couple 1M',
      href: '/checkout?tier=couple_1m',
    },
    {
      id: 'couple_3m',
      name: 'Couple 3 Months',
      price: 'Rs. 22,500',
      period: '/ quarter (for 2)',
      monthlyBreakdown: 'Rs. 3,750 / person / month',
      admission: 'Rs. 1,000 Admission Fee',
      totalFirstMonth: 'Save Rs. 1,500 vs Monthly',
      badge: 'Most Popular for Pairs',
      featured: true,
      popularTag: 'Most Popular',
      features: [
        'Full facility access for both individuals',
        'Shared body measurement & fat loss monitoring',
        'Joint workout routine design & accountability',
        'Nutritional guidance tailored for both lifestyles',
        'Quarterly progress review with Coach Adeesha',
        'Save Rs. 1,500 compared to monthly renewals',
      ],
      ctaText: 'Enroll Couple 3M',
      href: '/checkout?tier=couple_3m',
    },
    {
      id: 'couple_6m',
      name: 'Couple 6 Months',
      price: 'Rs. 42,000',
      period: '/ half-year (for 2)',
      monthlyBreakdown: 'Rs. 3,500 / person / month',
      admission: 'Rs. 1,000 Admission Fee',
      totalFirstMonth: 'Save Rs. 6,000 vs Monthly',
      badge: 'Semi-Annual Duo',
      featured: false,
      features: [
        'Full 6-month continuous gym membership for 2',
        'Bi-weekly body recomposition check-ins',
        'Partner motivation & high-accountability coaching',
        'Form check & biomechanics correction',
        'Save Rs. 6,000 compared to monthly renewals',
      ],
      ctaText: 'Enroll Couple 6M',
      href: '/checkout?tier=couple_6m',
    },
    {
      id: 'couple_1y',
      name: 'Couple 1 Year',
      price: 'Rs. 78,000',
      period: '/ year (for 2)',
      monthlyBreakdown: 'Only Rs. 3,250 / person / month',
      admission: 'Rs. 1,000 Admission Fee',
      totalFirstMonth: 'Massive Savings: Save Rs. 18,000',
      badge: 'Ultimate Lifestyle Package',
      featured: true,
      popularTag: 'Best Couple Value',
      features: [
        'Full 365-day unrestricted gym access for both',
        'Year-round accountability & progressive overload splits',
        'Complete diet & healthy cooking consultation',
        'Direct priority communication with Coach Adeesha',
        'Locker & priority amenities for two',
        'Maximum couple value: Save Rs. 18,000 per year',
      ],
      ctaText: 'Enroll Couple 1 Year',
      href: '/checkout?tier=couple_1y',
    },
  ];

  const signaturePackages: PricingTierItem[] = [
    {
      id: 'coaching_90',
      name: '90 Days Better Me',
      price: 'Rs. 8,000',
      period: '/ 12-week online cohort',
      admission: 'Zero Admission Fee',
      totalFirstMonth: 'Complete Online Coaching Cohort',
      badge: 'Flagship Online Program',
      featured: true,
      popularTag: 'Coach Adeesha Flagship',
      features: [
        'Personalized nutrition plan & macro calibration',
        'Customized progressive workout programming',
        'Weekly body measurement & photo progress review',
        'Direct 1-on-1 coach WhatsApp feedback & form checks',
        'Mindset & habit discipline coaching',
        'Private member exercise video vault access',
      ],
      ctaText: 'Join 90 Days Better Me',
      href: '/checkout?tier=coaching_90',
    },
    {
      id: 'burnzone',
      name: 'MuscleCraft BurnZone',
      price: 'Rs. 3,000',
      period: '/ month',
      admission: 'Rs. 500 Admission Fee',
      totalFirstMonth: 'Functional Group Conditioning',
      badge: 'Functional & CrossFit',
      featured: false,
      features: [
        'CrossFit-style high-intensity metabolic conditioning',
        'Functional fitness, agility & speed circuits',
        'Rapid fat loss and explosive athletic conditioning',
        'Body toning and core stabilization work',
        'Coach-led small group motivation atmosphere',
      ],
      ctaText: 'Join BurnZone',
      href: '/checkout?tier=burnzone',
    },
  ];

  const currentCards =
    activeCategory === 'sole'
      ? solePackages
      : activeCategory === 'couple'
      ? couplePackages
      : signaturePackages;

  return (
    <section
      id="slide-pricing"
      ref={sectionRef}
      className="presentation-slide scroll-mt-28 sm:scroll-mt-36 relative w-full overflow-hidden bg-[#080809] border-t border-white/[0.04] py-20 sm:py-28 lg:py-32"
    >
      <div className="ambient-glow-crimson top-1/3 right-1/4 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <SectionHeader
          eyebrow="MEMBERSHIP PLANS & PACKAGES"
          heading="Invest in Discipline"
          paragraph="Structured gym packages tailored for individuals, couples, and dedicated coaching cohorts. Transparent pricing in Sri Lankan Rupees (LKR) with zero hidden deductions."
          className="max-w-3xl mb-8 sm:mb-12"
        />

        {/* Category Switcher Tabs: Sole / Couple / Signature */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10 max-w-xl mx-auto">
          <div className="p-1.5 bg-[#121217] border border-white/10 rounded-2xl flex items-center w-full shadow-2xl">
            <button
              onClick={() => setActiveCategory('sole')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeCategory === 'sole'
                  ? 'bg-crimson-600 text-white shadow-[0_0_15px_rgba(186,26,26,0.6)] font-extrabold'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <User className="w-4 h-4" />
              Sole (Individual)
            </button>
            <button
              onClick={() => setActiveCategory('couple')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeCategory === 'couple'
                  ? 'bg-crimson-600 text-white shadow-[0_0_15px_rgba(186,26,26,0.6)] font-extrabold'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4" />
              Couple (2 Partners)
            </button>
            <button
              onClick={() => setActiveCategory('signature')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeCategory === 'signature'
                  ? 'bg-crimson-600 text-white shadow-[0_0_15px_rgba(186,26,26,0.6)] font-extrabold'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Coaching
            </button>
          </div>
        </div>

        {/* Admission Fee Transparency Callout */}
        <div className="mb-10 max-w-3xl mx-auto bg-gradient-to-r from-[#141419] via-[#181820] to-[#141419] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-crimson-950/60 border border-crimson-500/40 flex items-center justify-center text-crimson-400 flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-white font-bold text-sm tracking-wide">
                Official MuscleCraft Admission Protocol
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {activeCategory === 'sole' && 'Sole Packages: Admission Rs. 500 (one-time upon registration).'}
                {activeCategory === 'couple' && 'Couple Packages: Admission Rs. 1,000 (one-time for both partners).'}
                {activeCategory === 'signature' && 'Online coaching programs include registration fee.'}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-crimson-400 bg-crimson-950/50 px-3 py-1 rounded-full border border-crimson-800/40">
            {activeCategory === 'sole' ? 'Admission: Rs. 500' : activeCategory === 'couple' ? 'Admission: Rs. 1,000' : 'No Add-on Fees'}
          </span>
        </div>

        {/* Cards Grid */}
        <div
          ref={gridRef}
          className={`grid gap-6 items-stretch pt-6 pb-2 ${
            activeCategory === 'signature'
              ? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
          }`}
        >
          {currentCards.map((tier) => {
            const cardContent = (
              <div
                className={`relative flex flex-col justify-between h-full rounded-2xl p-6 sm:p-7 min-h-[560px] transition-all duration-300 border ${
                  tier.featured
                    ? 'bg-gradient-to-b from-[#181822] to-[#101015] border-crimson-600/70 shadow-[0_0_25px_rgba(186,26,26,0.3)] pricing-flagship-card'
                    : 'bg-[#111115] border-white/[0.08] hover:border-white/20 pricing-std-card hover:bg-[#141419]'
                }`}
              >
                {/* Popular or Savings Badge */}
                {tier.popularTag && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-crimson-600 to-rose-600 text-white font-black text-[10.5px] uppercase tracking-widest px-3.5 py-1 rounded-full shadow-[0_0_15px_rgba(186,26,26,0.85)] border border-white/20 flex items-center gap-1 z-30 whitespace-nowrap">
                    <Flame className="w-3 h-3 fill-white" />
                    {tier.popularTag}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-semibold uppercase tracking-wider text-gray-400">
                      {tier.badge}
                    </span>
                    <span className="text-[11px] font-semibold text-crimson-400 bg-crimson-950/40 px-2 py-0.5 rounded border border-crimson-800/30">
                      {tier.admission}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                    }}
                    className="text-xl sm:text-2xl text-white font-bold leading-tight"
                  >
                    {tier.name}
                  </h3>

                  {/* Pricing Display */}
                  <div className="my-5 pb-5 border-b border-white/[0.08]">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-4xl font-extrabold text-white font-sans tracking-tight">
                        {tier.price}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 font-medium mt-1">
                      {tier.period}
                    </div>
                    {tier.monthlyBreakdown && (
                      <div className="text-xs text-crimson-400 font-semibold font-mono mt-1.5">
                        {tier.monthlyBreakdown}
                      </div>
                    )}
                    <div className="text-[11px] text-gray-300 font-medium mt-2 bg-white/[0.03] px-2.5 py-1 rounded border border-white/[0.04]">
                      {tier.totalFirstMonth}
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <ul className="space-y-3 mb-8 text-xs sm:text-sm text-gray-300">
                    {tier.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                        <div className="w-4 h-4 rounded-full bg-crimson-950/80 border border-crimson-500/60 flex items-center justify-center text-crimson-400 flex-shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Call to action */}
                <Link
                  href={tier.href}
                  className={`w-full py-3.5 px-4 rounded-xl text-center text-xs sm:text-sm font-bold uppercase tracking-wider transition-all block ${
                    tier.featured
                      ? 'bg-crimson-600 hover:bg-crimson-500 text-white shadow-crimson-glow hover:shadow-[0_0_25px_rgba(186,26,26,0.7)]'
                      : 'bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/30'
                  }`}
                >
                  {tier.ctaText}
                </Link>
              </div>
            );

            if (tier.featured) {
              return (
                <Card3DTilt key={tier.id} maxTilt={6} featured={true}>
                  {cardContent}
                </Card3DTilt>
              );
            }

            return <div key={tier.id}>{cardContent}</div>;
          })}
        </div>

        {/* Bank Transfer Guidance Prompt */}
        <div className="mt-14 text-center">
          <p className="text-xs sm:text-sm text-gray-400">
            All payments are processed via verified domestic Sri Lankan bank transfer or cash deposit.
            Official reference code generated upon checkout for instant reconciliation.
          </p>
        </div>
      </div>
    </section>
  );
}
