'use client';

import React, { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

if (typeof window !== 'undefined') {
  (window as any).gsap = gsap;
  (window as any).ScrollTrigger = ScrollTrigger;
}

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Check prefers-reduced-motion
    if (typeof window === 'undefined') return;
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const lenis = new Lenis({
      duration: isTouch ? 0 : 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      syncTouch: true,
      wheelMultiplier: 0.88,
      touchMultiplier: 1.0,
      infinite: false,
    });
    lenisRef.current = lenis;

    // Wire lenis scroll to ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // Driven by gsap.ticker with lag smoothing to prevent stutter on frame drops
    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(500, 33);

    // Support window jump events
    const handleJump = (e: Event) => {
      const customEvent = e as CustomEvent<{ targetId?: string; index?: number }>;
      if (customEvent.detail?.targetId) {
        const el = document.getElementById(customEvent.detail.targetId);
        if (el) lenis.scrollTo(el, { offset: -130, duration: 1.4 });
      }
    };
    window.addEventListener('ironforge:scroll-to', handleJump);

    // Refresh ScrollTrigger after initial mount and pin setup
    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 500);

    return () => {
      clearTimeout(refreshTimer);
      window.removeEventListener('ironforge:scroll-to', handleJump);
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
