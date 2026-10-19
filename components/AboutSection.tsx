'use client';

import React, { useRef } from 'react';
import Card3DTilt from './3d/Card3DTilt';
import SectionHeader from './motion/SectionHeader';
import ImageReveal from './motion/ImageReveal';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { revealOnScroll } from './motion/scrollReveal';
import { MOTION_TOKENS } from './motion/tokens';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function AboutSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const galleryRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;
      revealOnScroll(section.querySelectorAll('.gallery-card'), {
        trigger: galleryRef.current,
        y: 45,
        stagger: 0.14,
        duration: 1.2,
        start: 'top 88%',
      });
    },
    { scope: sectionRef }
  );

  const galleryImages = [
    {
      src: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=700&auto=format&fit=crop',
      alt: 'Dedicated female athlete training with intensity',
      tag: 'Hypertrophy Lab',
    },
    {
      src: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=700&auto=format&fit=crop',
      alt: 'Male athlete focused on lifting bench',
      tag: 'Strength Conditioning',
    },
    {
      src: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=700&auto=format&fit=crop',
      alt: 'Athletic coach reviewing form and mechanics',
      tag: '1-on-1 Mentorship',
    },
  ];

  return (
    <section
      id="slide-about"
      ref={sectionRef}
      className="presentation-slide scroll-mt-28 sm:scroll-mt-36 relative w-full overflow-hidden bg-transparent border-t border-white/[0.04] py-20 sm:py-28 lg:py-32"
    >
      <div className="ambient-glow-gold top-1/3 right-1/4 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full py-4 sm:py-6">
        <SectionHeader
          eyebrow="The Philosophy"
          heading="About Us"
          paragraph="IronForge was established to eliminate the superficial gimmicks of commercial fitness clubs. We operate on raw physiological principles: progressive overload, metabolic optimization, and uncompromised athletic standards."
          centered={false}
          className="max-w-3xl mb-5 sm:mb-7"
        />

        {/* 3-Photo Gallery Grid with staggered slow reveal, Parallax, and Hover Zoom */}
        <div ref={galleryRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 perspective-1000">
          {galleryImages.map((img, idx) => (
            <div key={idx} className="gallery-card will-change-transform">
              <Card3DTilt
                maxTilt={9}
                className="h-44 sm:h-52 lg:h-60 max-h-[30vh] rounded-xl overflow-hidden group shadow-card-dark"
              >
                <div className="relative w-full h-full overflow-hidden">
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover filter contrast-110 brightness-90 group-hover:scale-108 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-gold bg-black/75 px-3 py-1 rounded border border-gold/40 shadow-sm inline-block">
                      {img.tag}
                    </span>
                    <p className="text-white text-base font-semibold mt-2.5 drop-shadow leading-snug">
                      {img.alt}
                    </p>
                  </div>
                </div>
              </Card3DTilt>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
