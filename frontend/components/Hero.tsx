'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useMagnetic } from '@/components/motion/useMagnetic';
import VideoBackground from './VideoBackground';

const ForgeScene = dynamic(() => import('@/src/components/three/ForgeScene'), {
  ssr: false,
  loading: () => null,
});

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const magneticBtnRef = useMagnetic<HTMLAnchorElement>(0.28);

  // Animated stat values
  const [statPercent, setStatPercent] = useState(0);
  const [statHours, setStatHours] = useState(0);
  const [mount3D, setMount3D] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('requestIdleCallback' in window) {
      const handle = (window as unknown as { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(
        () => setMount3D(true),
        { timeout: 1000 }
      );
      return () => {
        if ('cancelIdleCallback' in window) {
          (window as unknown as { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(handle);
        }
      };
    } else {
      const timer = setTimeout(() => setMount3D(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    let played = false;

    const playHeroEntrance = () => {
      if (played) return;
      played = true;

      // Check prefers-reduced-motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        setStatPercent(100);
        setStatHours(24);
        return;
      }

      const tl = gsap.timeline();

      // Eyebrow badge fades in
      tl.fromTo(
        '.hero-badge',
        { y: -15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out' },
        0.15
      );

      // Line-by-line headline reveal
      tl.fromTo(
        '.hero-line',
        { y: 55, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.95,
          stagger: 0.16,
          ease: 'power3.out',
        },
        0.3
      );

      // Subtext and buttons fade up with stagger
      tl.fromTo(
        '.hero-subtext',
        { y: 25, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
        0.6
      );

      tl.fromTo(
        '.hero-cta',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: 'power2.out' },
        0.75
      );

      tl.fromTo(
        '.hero-stat-strip',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.85, ease: 'power3.out' },
        0.9
      );

      // Animated Stats count-up
      const countTarget = { percent: 0, hours: 0 };
      gsap.to(countTarget, {
        percent: 100,
        hours: 24,
        duration: 1.8,
        delay: 0.95,
        ease: 'power2.out',
        onUpdate: () => {
          setStatPercent(Math.floor(countTarget.percent));
          setStatHours(Math.floor(countTarget.hours));
        },
      });
    };

    // Listen for curtain lifted or run after slight delay
    window.addEventListener('ironforge:curtain-lifted', playHeroEntrance, { once: true });
    const fallbackTimer = setTimeout(playHeroEntrance, 900);

    return () => {
      window.removeEventListener('ironforge:curtain-lifted', playHeroEntrance);
      clearTimeout(fallbackTimer);
    };
  }, []);

  return (
    <section
      id="slide-hero"
      ref={containerRef}
      className="presentation-slide relative w-full min-h-[100dvh] flex flex-col justify-between overflow-hidden bg-[#080809] pt-28 pb-8 sm:pt-32 sm:pb-12"
    >
      {/* ── Cinematic Full-Bleed Video Background (Slot: "hero") with procedural canvas fallback ── */}
      <VideoBackground name="hero" overlayStrength={0.55} className="z-0" />

      {/* ── Real 3D ForgeScene (Barbell & Embers Canvas) Floating Over Video Background ── */}
      {mount3D && (
        <div className="absolute inset-0 pointer-events-none z-[1]">
          <ForgeScene />
        </div>
      )}

      {/* ── Black Gradient Overlay from the Bottom ── */}
      <div
        className="absolute inset-0 pointer-events-none z-[2]"
        style={{
          background:
            'linear-gradient(to top, #080809 0%, rgba(8, 8, 9, 0.75) 30%, rgba(8, 8, 9, 0.2) 65%, transparent 100%)',
        }}
      />

      {/* ── Main Hero Content Overlay (Desktop: Headline left / 3D right; Mobile: Centered) ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full my-auto flex flex-col justify-center">
        <div className="max-w-3xl text-center lg:text-left mx-auto lg:mx-0">

          {/* ── HUGE EDITORIAL HEADLINE: Official Brand Tagline with Crimson Accent ── */}
          <h1
            ref={headlineRef}
            style={{
              letterSpacing: '-0.03em',
              lineHeight: 1.02,
            }}
            className="text-[clamp(2.1rem,4.8vw,4.8rem)] font-extrabold uppercase text-white mb-5 overflow-hidden font-sans"
          >
            <span className="hero-line block whitespace-nowrap">Build Discipline</span>
            <span className="hero-line block whitespace-nowrap text-white mt-1">
              <span className="text-crimson-500 mr-2 sm:mr-3">
                Sculpt
              </span>{' '}
              Strength
            </span>
          </h1>

          {/* Sub-copy */}
          <p className="hero-subtext text-sm sm:text-base md:text-lg text-gray-300 max-w-xl mx-auto lg:mx-0 mb-8 font-normal leading-relaxed drop-shadow">
            Welcome to MuscleCraft — Where discipline is built and strength is sculpted through science-backed coaching,
            tailored nutrition, and relentless dedication.
          </p>

          {/* ── Two Buttons Beneath (Luxury Crimson #BA1A1A & Glass Explore) ── */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
            <Link
              ref={magneticBtnRef}
              href="/checkout"
              style={{
                backgroundColor: '#BA1A1A',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '13.5px',
              }}
              className="hero-cta w-full sm:w-auto px-8 py-3.5 bg-crimson-600 hover:bg-crimson-500 text-white font-semibold text-[13.5px] rounded-full transition-all duration-300 shadow-lg hover:shadow-crimson-glow hover:scale-105 cursor-pointer flex items-center justify-center gap-2"
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
              className="hero-cta w-full sm:w-auto px-7 py-3.5 bg-[#141418] hover:bg-[#1c1c24] text-white font-semibold text-[13.5px] rounded-full border border-white/20 hover:border-crimson-500/50 transition-all duration-300 backdrop-blur-md hover:scale-105"
            >
              Explore Coaching Programs
            </Link>
          </div>
        </div>
      </div>

      {/* ── LIQUID-GLASS STATS STRIP AT THE BOTTOM ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-6">
        <div className="hero-stat-strip max-w-3xl mx-auto liquid-glass-card rounded-2xl p-3 sm:p-4 grid grid-cols-3 divide-x divide-white/10 text-center shadow-2xl">
          <div className="px-2 sm:px-4">
            <span className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white block font-sans tracking-tight">
              {statPercent}%
            </span>
            <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-semibold tracking-wider">
              Calibrated Iron
            </span>
          </div>

          <div className="px-2 sm:px-4">
            <span className="text-xl sm:text-2xl md:text-3xl font-extrabold text-crimson-500 block font-sans tracking-tight">
              1-on-1
            </span>
            <span className="text-[10px] sm:text-xs text-crimson-200/90 uppercase font-semibold tracking-wider">
              Direct Coaching
            </span>
          </div>

          <div className="px-2 sm:px-4">
            <span className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white block font-sans tracking-tight">
              {statHours}/7
            </span>
            <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-semibold tracking-wider">
              Biometric Access
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
