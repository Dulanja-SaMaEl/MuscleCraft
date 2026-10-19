'use client';

import React, { useRef } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function MapSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const mapBgRef = useRef<HTMLDivElement | null>(null);
  const pinCardRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const bg = mapBgRef.current;
      const pin = pinCardRef.current;
      if (!section || !bg || !pin) return;

      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(bg, { scale: 1 });
        gsap.set(pin, { opacity: 1, scale: 1, y: 0 });
      });

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            once: true,
          },
        });

        // 1. Slow map zoom from scale 1.18 to 1.0
        tl.fromTo(
          bg,
          { scale: 1.18 },
          {
            scale: 1.0,
            duration: 1.6,
            ease: 'power2.out',
          },
          0
        );

        // 2. Center Interactive Location Pin & Callout pop in
        tl.fromTo(
          pin,
          { scale: 0.85, opacity: 0, y: 20 },
          {
            scale: 1,
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'back.out(1.7)',
          },
          0.3
        );
      });

      return () => mm.revert();
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-80 sm:h-96 overflow-hidden border-t border-b border-white/[0.08] bg-[#1a1a20]"
    >
      {/* Grayscale styled map imagery with slow map zoom */}
      <div
        ref={mapBgRef}
        className="absolute inset-0 bg-cover bg-center filter grayscale contrast-125 brightness-95 opacity-80 will-change-transform"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1800&auto=format&fit=crop')",
        }}
      />

      {/* Subtle tint overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Center Interactive Location Pin & Callout matching reference */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          ref={pinCardRef}
          className="pointer-events-auto bg-[#121215]/95 border border-gold/60 p-4 rounded-lg shadow-2xl backdrop-blur-md flex items-center gap-4 max-w-sm will-change-transform"
        >
          <div className="w-10 h-10 rounded-full bg-gold/20 border border-gold flex items-center justify-center text-gold flex-shrink-0 animate-bounce">
            <MapPin className="w-5 h-5 fill-gold text-black" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-wide">
              IronForge Athletic Club HQ
            </h4>
            <p className="text-xs text-gray-400 mt-0.5">
              8400 Olympic Blvd, Los Angeles, CA
            </p>
            <a
              href="https://maps.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-semibold text-gold hover:underline flex items-center gap-1 mt-1.5"
            >
              <Navigation className="w-3 h-3" /> Get Driving Directions
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
