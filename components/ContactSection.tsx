'use client';

import React, { useRef } from 'react';
import { MapPin, Clock, Phone } from 'lucide-react';
import Card3DTilt from './3d/Card3DTilt';
import SectionHeader from './motion/SectionHeader';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { MOTION_TOKENS } from './motion/tokens';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function ContactSection() {
  const cardsRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const container = cardsRef.current;
      if (!container) return;

      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: reduce)', () => {
        const cards = container.querySelectorAll('.contact-card');
        gsap.set(cards, { opacity: 1, y: 0 });
      });

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const cards = container.querySelectorAll('.contact-card');
        gsap.fromTo(
          cards,
          { y: 35, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.3,
            stagger: 0.15,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: container,
              start: 'top 80%',
              toggleActions: 'play none none none',
              once: true,
            },
          }
        );
      });

      return () => mm.revert();
    },
    { scope: cardsRef }
  );

  return (
    <section id="contact" className="scroll-mt-28 sm:scroll-mt-36 py-24 bg-[#080809] border-t border-white/[0.04] relative">
      <div className="ambient-glow-gold top-1/2 right-1/4" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeader
          heading="Contact Us"
          className="mb-16"
        />

        {/* 3 Columns with Stagger Fade-Up and 3D Tilt */}
        <div
          ref={cardsRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center perspective-1000"
        >
          {/* Visit Us */}
          <div className="contact-card will-change-transform">
            <Card3DTilt className="p-8">
              <div className="w-14 h-14 mx-auto rounded-full bg-gold/10 border border-gold/40 flex items-center justify-center text-gold mb-5 shadow-gold-glow">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">
                Visit Us
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                IronForge Athletic Club
                <br />
                8400 Olympic Boulevard, Suite 100
                <br />
                Los Angeles, CA 90036
              </p>
            </Card3DTilt>
          </div>

          {/* Office Hours */}
          <div className="contact-card will-change-transform">
            <Card3DTilt className="p-8">
              <div className="w-14 h-14 mx-auto rounded-full bg-gold/10 border border-gold/40 flex items-center justify-center text-gold mb-5 shadow-gold-glow">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">
                Office Hours
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                <span className="text-white font-semibold">Facility:</span> 24/7 Access
                <br />
                <span className="text-white font-semibold">Staff & Coaches:</span>
                <br />
                Mon – Fri: 06:00 – 22:00
                <br />
                Sat – Sun: 08:00 – 18:00
              </p>
            </Card3DTilt>
          </div>

          {/* Contact Us */}
          <div className="contact-card will-change-transform">
            <Card3DTilt className="p-8">
              <div className="w-14 h-14 mx-auto rounded-full bg-gold/10 border border-gold/40 flex items-center justify-center text-gold mb-5 shadow-gold-glow">
                <Phone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">
                Contact Us
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                <span className="text-white font-semibold">Desk:</span> (555) 019-2834
                <br />
                <span className="text-white font-semibold">VIP Coaching:</span> coach@ironforge.com
                <br />
                <span className="text-white font-semibold">General:</span> info@ironforge.com
              </p>
            </Card3DTilt>
          </div>
        </div>
      </div>
    </section>
  );
}
