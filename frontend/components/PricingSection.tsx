'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { Check, Star, Flame } from 'lucide-react';
import Card3DTilt from './3d/Card3DTilt';
import SectionHeader from './motion/SectionHeader';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { revealOnScroll } from './motion/scrollReveal';
import { MOTION_TOKENS } from './motion/tokens';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function PricingSection() {
  const [activeMobileTier, setActiveMobileTier] = useState<string>('coaching_90');
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
          y: 45,
          stagger: 0.14,
          duration: 1.2,
          start: 'top 88%',
        }
      );
    },
    { scope: sectionRef }
  );

  const tiers = [
    {
      id: 'monthly',
      name: '1 Month Membership',
      price: '$50.00',
      period: '/ month',
      badge: 'Standard Access',
      featured: false,
      features: [
        'Full 24/7 gym & facility access',
        'Locker rooms, showers & dry sauna',
        'Free weight & power rack zones',
        'Access to common exercise video library',
        'Monthly gym membership card',
      ],
      ctaText: 'Join Now',
      href: '/checkout?tier=monthly',
    },
    {
      id: 'day_pass',
      name: '1 Day Pass',
      price: '$15.00',
      period: '/ pass',
      badge: 'Single Visit',
      featured: false,
      features: [
        'Full 24-hour facility access pass',
        'Access to all free weight & platform zones',
        'Locker room & recovery sauna access',
        'Calibrated Eleiko competition bars',
        'No contracts or recurring commitments',
      ],
      ctaText: 'Join Now',
      href: '/checkout?tier=monthly',
    },
    {
      id: 'coaching_90',
      name: '90-Day VIP Coaching',
      price: '$150.00',
      period: '/ month ($450 total)',
      badge: 'Most Popular / Flagship Cohort',
      featured: true,
      features: [
        'Initial 1-on-1 private video strategy consultation',
        'Weekly live group coaching & technique calls',
        'Personalized nutrition plan & macro breakdown',
        'Weekly body measurement & recomp tracking',
        'Exclusive VIP session video vault access',
        'Direct coach feedback & form audits',
        'Full 24/7 facility access included',
      ],
      ctaText: 'Join Now',
      href: '/checkout?tier=coaching_90',
    },
  ];

  return (
    <section
      id="slide-pricing"
      ref={sectionRef}
      className="presentation-slide scroll-mt-28 sm:scroll-mt-36 relative w-full overflow-hidden bg-[#080809] border-t border-white/[0.04] py-20 sm:py-28 lg:py-32"
    >
      <div className="ambient-glow-gold top-1/3 right-1/4 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <SectionHeader
          eyebrow="The Commitment"
          heading="Pricing"
          paragraph="Flexible, transparent, and competitive rates engineered to reward relentless dedication."
          className="max-w-3xl mb-6 sm:mb-10"
        />

        {/* Mobile Tier Selector Tabs */}
        <div className="flex lg:hidden items-center justify-center gap-1.5 mb-6">
          {tiers.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveMobileTier(t.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeMobileTier === t.id
                  ? 'bg-[#D4A359] text-[#111111] shadow-[0_0_12px_rgba(212,163,89,0.5)] font-bold'
                  : 'bg-[#121216] text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              {t.id === 'coaching_90' ? '90-Day VIP' : t.name}
            </button>
          ))}
        </div>

        <div
          ref={gridRef}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch perspective-1400"
        >
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`relative flex-col will-change-transform ${
                activeMobileTier === tier.id ? 'flex' : 'hidden lg:flex'
              } ${
                tier.featured ? 'pricing-flagship-card' : 'pricing-std-card'
              }`}
            >
              {/* Flagship 90-Day VIP Card Gold Border Glow */}
              {tier.featured && (
                <div
                  className="absolute -inset-[1px] rounded-2xl pointer-events-none -z-10 border border-[#D4A359]/70 shadow-[0_0_24px_rgba(212,163,89,0.25)]"
                  aria-hidden="true"
                />
              )}

              <Card3DTilt
                featured={tier.featured}
                maxTilt={tier.featured ? 10 : 7}
                className={`liquid-glass-card p-6 sm:p-7 lg:p-8 flex flex-col justify-between h-full rounded-2xl relative overflow-hidden ${
                  tier.featured
                    ? '!bg-[#141418]/95 !border-[#D4A359]/80 shadow-card-featured-3d lg:-translate-y-2'
                    : ''
                }`}
              >
                {/* Rotating Ring Decoration - Strictly clipped inside card bounds */}
                {tier.featured && (
                  <div
                    className="absolute -top-12 -right-12 w-64 h-64 rounded-full pointer-events-none z-0 opacity-25 select-none"
                    aria-hidden="true"
                  >
                    <div className="w-full h-full rounded-full border-2 border-[#D4A359]/70 flex items-center justify-center animate-[spin_30s_linear_infinite]">
                      <div className="w-48 h-48 rounded-full border border-[#D4A359]/40 border-dashed flex items-center justify-center">
                        <div className="w-32 h-32 rounded-full border border-[#D4A359]/30 flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-[#D4A359]/15 border border-[#D4A359]/50 flex items-center justify-center">
                            <Flame className="w-6 h-6 text-[#D4A359]/80" />
                          </div>
                        </div>
                      </div>
                      <span className="absolute top-3 text-[8.5px] font-mono font-bold text-[#D4A359]/70 tracking-widest uppercase">
                        IRONFORGE 20KG
                      </span>
                      <span className="absolute bottom-3 text-[8.5px] font-mono font-bold text-[#D4A359]/50 tracking-widest uppercase">
                        CALIBRATED
                      </span>
                    </div>
                  </div>
                )}

                <div className="relative z-10 flex flex-col">
                  {/* Badge: Moved above title so it NEVER overlaps any text */}
                  {tier.featured ? (
                    <div className="mb-2.5 sm:mb-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#D4A359] text-[#111111] font-bold text-[10.5px] uppercase tracking-wider shadow-sm">
                        <span>{tier.badge}</span>
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] sm:text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-1.5 sm:mb-2 font-mono">
                      {tier.badge}
                    </span>
                  )}

                  {/* Title: Unobstructed, allows full multi-line wrapping */}
                  <h3
                    style={{
                      fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
                      fontWeight: 600,
                    }}
                    className="text-lg sm:text-xl lg:text-2xl text-white mb-2 sm:mb-2.5 leading-snug break-words"
                  >
                    {tier.name}
                  </h3>

                  {/* ── PRICING FIGURES: font-weight 700 (Bold), font-size 28px-32px ── */}
                  <div className="flex items-baseline gap-2 mb-3.5 sm:mb-4">
                    <span
                      style={{
                        fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
                        fontWeight: 700,
                      }}
                      className="text-[26px] sm:text-[30px] text-white tracking-tight leading-none"
                    >
                      {tier.price}
                    </span>
                    <span className="text-xs text-gray-400 font-normal">
                      {tier.period}
                    </span>
                  </div>

                  <div className="h-px w-full bg-white/[0.08] mb-3.5 sm:mb-4" />

                  {/* Features List */}
                  <ul className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-5">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-[13px] text-gray-300">
                        <div
                          className={`mt-0.5 rounded-full p-0.5 flex-shrink-0 ${
                            tier.featured ? 'bg-[#D4A359]/20 text-[#D4A359]' : 'bg-white/10 text-gray-300'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                        </div>
                        <span className="leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* ── BUTTON: font-weight 600, font-size 13px-14px, dark text (#111111) on warm gold (#D4A359) ── */}
                <Link
                  href={tier.href}
                  style={{
                    backgroundColor: '#D4A359',
                    color: '#111111',
                    fontWeight: 600,
                    fontSize: '13.5px',
                  }}
                  className="w-full py-3 px-6 rounded font-semibold text-[13.5px] uppercase tracking-wide text-center transition-all duration-300 block shadow-md hover:bg-[#c2934b] text-[#111111] hover:scale-102 cursor-pointer"
                >
                  Join Now
                </Link>
              </Card3DTilt>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
