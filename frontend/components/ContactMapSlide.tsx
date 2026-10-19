'use client';

import React, { useRef } from 'react';
import { MapPin, Clock, Phone, Navigation } from 'lucide-react';
import Card3DTilt from './3d/Card3DTilt';
import SectionHeader from './motion/SectionHeader';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { revealOnScroll } from './motion/scrollReveal';
import { MOTION_TOKENS } from './motion/tokens';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function ContactMapSlide() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const cardsRef = useRef<HTMLDivElement | null>(null);
  const mapBgRef = useRef<HTMLDivElement | null>(null);
  const pinCardRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      revealOnScroll(section.querySelectorAll('.contact-card'), {
        trigger: cardsRef.current,
        x: -35,
        y: 0,
        stagger: 0.12,
        duration: 1.2,
        start: 'top 88%',
      });

      if (mapBgRef.current) {
        revealOnScroll(mapBgRef.current, {
          trigger: mapBgRef.current,
          y: 0,
          scale: 1.04,
          duration: 1.4,
          start: 'top 88%',
        });
      }

      if (pinCardRef.current) {
        revealOnScroll(pinCardRef.current, {
          trigger: pinCardRef.current,
          y: 20,
          duration: 1.1,
          start: 'top 88%',
        });
      }
    },
    { scope: sectionRef }
  );

  return (
    <section
      id="slide-contact"
      ref={sectionRef}
      className="presentation-slide scroll-mt-28 sm:scroll-mt-36 relative w-full overflow-hidden bg-[#080809] border-t border-white/[0.04] py-20 sm:py-28 lg:py-32"
    >
      <div className="ambient-glow-crimson top-1/2 right-1/4 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          {/* Left Column: Header & 3 Compact Contact Cards */}
          <div className="lg:col-span-5 space-y-4">
            <SectionHeader
              eyebrow="Location & Hours"
              heading="Visit Us"
              className="mb-3 sm:mb-4"
            />

            <div ref={cardsRef} className="space-y-3 perspective-1000">
              {/* Visit Us */}
              <div className="contact-card will-change-transform">
                <Card3DTilt maxTilt={6} className="p-3.5 sm:p-4 rounded-xl flex items-center gap-3.5 bg-[#101014]/90 border border-white/[0.08]">
                  <div className="w-10 h-10 rounded-lg bg-crimson-900/30 border border-crimson-500/40 flex items-center justify-center text-crimson-400 flex-shrink-0 shadow-crimson-glow">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Flagship Facility
                    </h3>
                    <p className="text-xs text-gray-300 leading-snug mt-0.5">
                      MuscleCraft Strength Facility
                    </p>
                  </div>
                </Card3DTilt>
              </div>

              {/* Operating Hours */}
              <div className="contact-card will-change-transform">
                <Card3DTilt maxTilt={6} className="p-3.5 sm:p-4 rounded-xl flex items-center gap-3.5 bg-[#101014]/90 border border-white/[0.08]">
                  <div className="w-10 h-10 rounded-lg bg-crimson-900/30 border border-crimson-500/40 flex items-center justify-center text-crimson-400 flex-shrink-0 shadow-crimson-glow">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Operating Hours
                    </h3>
                    <p className="text-xs text-gray-300 leading-snug mt-0.5">
                      <span className="text-crimson-400 font-semibold">24/7 Access</span> • Coaching: Mon–Sat 06:00–22:00
                    </p>
                  </div>
                </Card3DTilt>
              </div>

              {/* Direct Channels */}
              <div className="contact-card will-change-transform">
                <Card3DTilt maxTilt={6} className="p-3.5 sm:p-4 rounded-xl flex items-center gap-3.5 bg-[#101014]/90 border border-white/[0.08]">
                  <div className="w-10 h-10 rounded-lg bg-crimson-900/30 border border-crimson-500/40 flex items-center justify-center text-crimson-400 flex-shrink-0 shadow-crimson-glow">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Direct Inquiries
                    </h3>
                    <p className="text-xs text-gray-300 leading-snug mt-0.5">
                      coach@musclecraft.lk • info@musclecraft.lk
                    </p>
                  </div>
                </Card3DTilt>
              </div>
            </div>
          </div>

          {/* Right Column: High-Craft Map Visual with Bouncing Pin Card */}
          <div className="lg:col-span-7 relative h-[260px] sm:h-[340px] lg:h-[400px] max-h-[48vh] rounded-2xl overflow-hidden border border-white/[0.1] shadow-2xl bg-[#141418]">
            <div
              ref={mapBgRef}
              className="absolute inset-0 bg-cover bg-center filter grayscale contrast-125 brightness-90 opacity-80 will-change-transform"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1800&auto=format&fit=crop')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* Centered Location Pin Callout */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
              <div
                ref={pinCardRef}
                className="pointer-events-auto bg-[#121215]/95 border border-crimson-500/60 p-4 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-4 max-w-sm will-change-transform shadow-[0_0_25px_rgba(186,26,26,0.3)]"
              >
                <div className="w-10 h-10 rounded-full bg-crimson-500/20 border border-crimson-500 flex items-center justify-center text-crimson-400 flex-shrink-0">
                  <MapPin className="w-5 h-5 fill-crimson-500 text-black" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">
                    MuscleCraft Facility
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Build Discipline. Sculpt Strength.
                  </p>
                  <a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-crimson-400 hover:underline flex items-center gap-1 mt-1.5"
                  >
                    <Navigation className="w-3 h-3" /> Get Driving Directions
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
