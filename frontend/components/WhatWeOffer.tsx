'use client';

import React, { useRef, useState } from 'react';
import { Award, Dumbbell, Users } from 'lucide-react';
import Card3DTilt from './3d/Card3DTilt';
import SectionHeader from './motion/SectionHeader';
import VideoBackground from './VideoBackground';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { revealOnScroll } from './motion/scrollReveal';
import { MOTION_TOKENS } from './motion/tokens';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function WhatWeOffer() {
  const [activeMobileOffer, setActiveMobileOffer] = useState(0);
  const sectionRef = useRef<HTMLElement | null>(null);
  const cardsContainerRef = useRef<HTMLDivElement | null>(null);

  const offerings = [
    {
      title: 'Expert Mentorship',
      icon: Award,
      description:
        'One-on-one structured consultation, biomechanical form audits, and direct weekly accountability from certified strength coaches.',
    },
    {
      title: 'High Quality Equipment',
      icon: Dumbbell,
      description:
        'Engineered for maximum athletic output. Calibrated competition steel plates, IPF-certified power racks, and specialized isolation machines.',
    },
    {
      title: 'Supportive Community',
      icon: Users,
      description:
        'Surround yourself with driven individuals. Weekly cohort masterminds, peer training partnerships, and shared dedication to personal growth.',
    },
  ];

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;
      revealOnScroll(section.querySelectorAll('.offer-card'), {
        trigger: cardsContainerRef.current,
        y: 45,
        stagger: 0.14,
        duration: 1.2,
        start: 'top 88%',
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      id="slide-offer"
      ref={sectionRef}
      className="presentation-slide scroll-mt-28 sm:scroll-mt-36 relative w-full overflow-hidden bg-[#080809] border-t border-white/[0.04] py-20 sm:py-28 lg:py-32"
    >
      {/* ── Darkened Video Background behind "What We Offer" (Slot: "bar") ── */}
      <VideoBackground name="bar" overlayStrength={0.82} className="z-0" />

      {/* Atmospheric ambient glow */}
      <div className="ambient-glow-crimson top-1/2 left-1/4 -translate-y-1/2 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <SectionHeader
          eyebrow="The Standard"
          heading="What We Offer"
          className="mb-6 sm:mb-10"
        />

        {/* Mobile Offering Selector Tabs */}
        <div className="flex md:hidden items-center justify-center gap-1.5 mb-6">
          {offerings.map((item, idx) => (
            <button
              key={idx}
              onClick={() => setActiveMobileOffer(idx)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeMobileOffer === idx
                  ? 'bg-crimson-600 text-white shadow-[0_0_12px_rgba(186,26,26,0.5)] font-bold'
                  : 'bg-[#121216] text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              {item.title}
            </button>
          ))}
        </div>

        <div
          ref={cardsContainerRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
        >
          {offerings.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`offer-card will-change-transform h-full ${
                  activeMobileOffer === idx ? 'flex' : 'hidden md:flex'
                }`}
              >
                <Card3DTilt
                  className="liquid-glass-card p-6 sm:p-8 h-full flex flex-col justify-between rounded-2xl group transition-all duration-300 hover:-translate-y-2 hover:border-crimson-500/50"
                >
                  <div>
                    <div className="offer-icon w-12 h-12 rounded-xl bg-black/70 border border-crimson-500/40 flex items-center justify-center mb-5 text-crimson-400 shadow-crimson-glow group-hover:scale-110 group-hover:border-crimson-400 transition-all duration-300 will-change-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-display text-xl sm:text-2xl tracking-wide text-white mb-3 uppercase">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-300 leading-relaxed font-normal">
                      {item.description}
                    </p>
                  </div>
                </Card3DTilt>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
