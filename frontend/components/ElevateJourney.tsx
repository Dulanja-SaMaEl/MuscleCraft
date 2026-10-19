'use client';

import React, { useRef } from 'react';
import { Check } from 'lucide-react';
import Card3DTilt from './3d/Card3DTilt';
import ImageReveal from './motion/ImageReveal';
import SplitHeading from './motion/SplitHeading';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { revealOnScroll } from './motion/scrollReveal';
import { MOTION_TOKENS } from './motion/tokens';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function ElevateJourney() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const leftColRef = useRef<HTMLDivElement | null>(null);
  const rightColRef = useRef<HTMLDivElement | null>(null);
  const eyebrowRef = useRef<HTMLSpanElement | null>(null);
  const lineRef = useRef<HTMLDivElement | null>(null);
  const paragraphRef = useRef<HTMLParagraphElement | null>(null);
  const checklistRef = useRef<HTMLDivElement | null>(null);

  const leftFeatures = [
    'Expert Coaching Staff',
    'Personalized Nutrition Plans',
    'Comprehensive Body Analytics',
  ];

  const rightFeatures = [
    'State of the Art Equipment',
    'Inclusive, Motivated Community',
    '24/7 Facility Access',
  ];

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      // Left Column (3D image tilt card) glides in from left as it enters viewport
      revealOnScroll(leftColRef.current, {
        trigger: leftColRef.current,
        x: -40,
        y: 0,
        duration: 1.2,
        start: 'top 85%',
      });

      // Right Column (narrative block) glides up smoothly as it enters viewport
      revealOnScroll(rightColRef.current, {
        trigger: rightColRef.current,
        y: 35,
        duration: 1.2,
        start: 'top 85%',
      });

      // Checklist items stagger in as the checklist enters viewport
      if (checklistRef.current) {
        revealOnScroll(section.querySelectorAll('.checklist-item'), {
          trigger: checklistRef.current,
          y: 20,
          stagger: 0.08,
          duration: 1.0,
          start: 'top 88%',
        });
      }

      // Gold divider line expands smoothly
      if (lineRef.current) {
        gsap.fromTo(
          lineRef.current,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 1.2,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: rightColRef.current,
              start: 'top 85%',
              toggleActions: 'play none none none',
              once: true,
            },
          }
        );
      }
    },
    { scope: sectionRef }
  );

  return (
    <section
      id="slide-elevate"
      ref={sectionRef}
      className="presentation-slide scroll-mt-28 sm:scroll-mt-36 relative w-full overflow-hidden bg-transparent border-t border-white/[0.04] py-20 sm:py-28 lg:py-32"
    >
      <div className="ambient-glow-crimson top-1/4 left-1/4 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Image with 3D tilt and scroll parallax */}
          <div ref={leftColRef} className="lg:col-span-5 relative perspective-1000 will-change-transform">
            <ImageReveal direction="bottom" parallax={true} className="rounded-2xl">
              <Card3DTilt maxTilt={8} className="shadow-2xl rounded-2xl overflow-hidden group">
                <div className="relative h-[260px] sm:h-[320px] lg:h-[360px] max-h-[40vh] w-full overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=900&auto=format&fit=crop"
                    alt="Heavy Barbell Loading at MuscleCraft Gym"
                    className="w-full h-full object-cover filter contrast-125 brightness-90 group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6">
                    <span className="text-[10px] sm:text-[11px] font-mono font-bold text-crimson-300 uppercase tracking-widest bg-black/70 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded border border-crimson-500/40 shadow-crimson-glow inline-block">
                      Precision Equipment
                    </span>
                    <p className="text-white text-xs sm:text-sm font-semibold mt-2 drop-shadow leading-snug">
                      Calibrated Eleiko & Rogue competition-grade plates & barbells.
                    </p>
                  </div>
                </div>
              </Card3DTilt>
            </ImageReveal>
          </div>

          {/* Right Column: Narrative & 2-column checklist */}
          <div
            ref={rightColRef}
            className="lg:col-span-7 space-y-4 sm:space-y-6 bg-[#101014]/60 p-6 sm:p-8 rounded-2xl border border-white/[0.06] backdrop-blur-md"
          >
            <div>
              <span
                ref={eyebrowRef}
                className="text-xs font-semibold text-crimson-400 uppercase tracking-widest font-mono block mb-2 will-change-transform"
              >
                Progressive Overload
              </span>

              <SplitHeading
                as="h2"
                style={{
                  fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                }}
                className="text-[28px] sm:text-[32px] md:text-[36px] text-white tracking-tight mb-2 leading-tight"
              >
                Elevate Your Journey
              </SplitHeading>

              <div
                ref={lineRef}
                style={{ transformOrigin: 'left center' }}
                className="w-12 h-1 bg-crimson-600 mb-4 rounded-full shadow-[0_0_8px_rgba(186,26,26,0.6)] will-change-transform"
                aria-hidden="true"
              />

              <p
                ref={paragraphRef}
                className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-2xl font-normal will-change-transform"
              >
                Every repetition, every nutritional choice, and every recovery protocol is engineered
                to transform your physiological potential. Our holistic approach bridges elite powerlifting,
                functional hypertrophy, and personalized metabolic coaching.
              </p>
            </div>

            {/* 2-Column Checklist: items stagger in + tick icon pop */}
            <div ref={checklistRef} className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-3.5">
                {leftFeatures.map((item, idx) => (
                  <div key={idx} className="checklist-item flex items-center gap-3 will-change-transform">
                    <div className="checklist-tick w-5 h-5 rounded-full bg-crimson-900/30 border border-crimson-500/60 flex items-center justify-center text-crimson-400 flex-shrink-0 will-change-transform">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-medium text-gray-200">{item}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3.5">
                {rightFeatures.map((item, idx) => (
                  <div key={idx} className="checklist-item flex items-center gap-3 will-change-transform">
                    <div className="checklist-tick w-5 h-5 rounded-full bg-crimson-900/30 border border-crimson-500/60 flex items-center justify-center text-crimson-400 flex-shrink-0 will-change-transform">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-medium text-gray-200">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
