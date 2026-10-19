'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowRight, Flame } from 'lucide-react';
import VideoBackground from './VideoBackground';
import { useMagnetic } from './motion/useMagnetic';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

const MoltenGoldShader = dynamic(() => import('./3d/MoltenGoldShader'), {
  ssr: false,
  loading: () => null,
});

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function BannerSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const magneticBtnRef = useMagnetic<HTMLAnchorElement>(0.3);

  const line1Words = ['Become', 'The', 'Best', 'Version'];
  const line2Words = ['Of', 'Yourself'];

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const words = section.querySelectorAll('.scrub-word');
      if (!words.length) return;

      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(words, { opacity: 1, color: '#ffffff' });
      });

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Word-by-word headline scrub
        gsap.fromTo(
          words,
          {
            opacity: 0.22,
            color: 'rgba(255, 255, 255, 0.25)',
          },
          {
            opacity: 1,
            color: '#ffffff',
            stagger: 0.1,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top 75%',
              end: 'center 45%',
              scrub: 0.8,
            },
          }
        );

        // Subtitle and CTA buttons smooth slow glide
        const ctaBlock = section.querySelectorAll('.banner-cta-anim');
        if (ctaBlock.length) {
          gsap.fromTo(
            ctaBlock,
            { y: 30, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 1.4,
              stagger: 0.16,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: section,
                start: 'top 75%',
                toggleActions: 'play none none none',
                once: true,
              },
            }
          );
        }
      });

      return () => mm.revert();
    },
    { scope: sectionRef }
  );

  return (
    <section
      id="slide-banner"
      ref={sectionRef}
      className="presentation-slide scroll-mt-28 sm:scroll-mt-36 relative w-full min-h-[100dvh] overflow-hidden bg-[#070709] flex items-center justify-center perspective-1400 border-y border-gold/20 py-20 sm:py-28"
    >
      {/* ── CTA Video Background (Slot: "forge") with procedural canvas fallback ── */}
      <VideoBackground name="forge" overlayStrength={0.7} className="z-0" />

      {/* ── Molten-Gold GLSL Shader Background with Sparks ── */}
      <div className="absolute inset-0 pointer-events-none z-[1]">
        <MoltenGoldShader />
      </div>

      {/* Dark gradient scrim ensuring 100% WCAG AA contrast for text */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#080809] via-black/40 to-[#080809] pointer-events-none z-[2]" />

      {/* 3D Ambient Core Glow */}
      <div className="ambient-glow-crimson top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[2]" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">

        {/* ── Scroll-Scrubbed Word-by-Word Text (dim to full brightness) ── */}
        <h2
          style={{
            fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}
          className="text-3xl sm:text-5xl md:text-6xl text-white mb-6 leading-[1.2] drop-shadow-2xl select-none"
        >
          <span className="block mb-1">
            {line1Words.map((word, i) => (
              <span
                key={i}
                className="scrub-word inline-block mr-[0.24em] last:mr-0 transition-colors duration-75"
              >
                {word}
              </span>
            ))}
          </span>
          <span className="block">
            {line2Words.map((word, i) => (
              <span
                key={i}
                className="scrub-word inline-block mr-[0.24em] last:mr-0 transition-colors duration-75"
              >
                {word}
              </span>
            ))}
          </span>
        </h2>

        <p className="banner-cta-anim text-base sm:text-lg text-gray-300 max-w-2xl mx-auto mb-10 font-normal leading-relaxed drop-shadow">
          Stop negotiating with your physiological potential. Build discipline, execute your customized protocol, and sculpt real strength with MuscleCraft.
        </p>

        <div className="banner-cta-anim flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            ref={magneticBtnRef}
            href="/checkout"
            style={{
              backgroundColor: '#BA1A1A',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '13.5px',
            }}
            className="w-full sm:w-auto px-9 py-3.5 bg-crimson-600 hover:bg-crimson-500 text-white font-semibold text-[13.5px] rounded-full transition-all duration-300 shadow-xl hover:shadow-crimson-glow hover:scale-105 cursor-pointer flex items-center justify-center gap-2 will-change-transform"
          >
            <span>Join Now</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </Link>
          <Link
            href="/memberships"
            style={{
              fontWeight: 600,
              fontSize: '13.5px',
            }}
            className="w-full sm:w-auto px-8 py-3.5 bg-black/70 hover:bg-[#15151a] text-gray-200 hover:text-white font-semibold text-[13.5px] rounded-full border border-white/10 hover:border-crimson-500/50 transition-all duration-300 backdrop-blur-md hover:scale-105"
          >
            Explore Coaching Programs
          </Link>
        </div>
      </div>
    </section>
  );
}
