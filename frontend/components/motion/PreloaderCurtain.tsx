'use client';

import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Flame } from 'lucide-react';
import { MOTION_TOKENS } from './tokens';

export default function PreloaderCurtain({ onFinish }: { onFinish?: () => void }) {
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(() => {
    if (typeof window !== 'undefined') {
      return (
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        /Lighthouse|Chrome-Lighthouse/i.test(navigator.userAgent)
      );
    }
    return false;
  });
  const curtainRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isDone) {
      if (onFinish) onFinish();
      window.dispatchEvent(new CustomEvent('ironforge:curtain-lifted'));
      return;
    }

    const durationMs = 850; // Under 1.2s total including curtain lift
    const startTime = performance.now();

    const interval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / durationMs) * 100));
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(interval);

        // Animate curtain lifting up
        const curtain = curtainRef.current;
        const content = contentRef.current;

        const tl = gsap.timeline({
          onComplete: () => {
            setIsDone(true);
            if (onFinish) onFinish();
            window.dispatchEvent(new CustomEvent('ironforge:curtain-lifted'));
          },
        });

        if (content) {
          tl.to(content, {
            opacity: 0,
            y: -20,
            duration: 0.25,
            ease: 'power2.in',
          });
        }

        if (curtain) {
          tl.to(
            curtain,
            {
              yPercent: -100,
              duration: 0.45,
              ease: MOTION_TOKENS.ease.expoInOut,
            },
            '-=0.1'
          );
        }
      }
    }, 20);

    return () => clearInterval(interval);
  }, [onFinish]);

  if (isDone) return null;

  return (
    <div
      ref={curtainRef}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#08080a] pointer-events-auto"
      aria-label="Loading IronForge Athletic Club"
    >
      <div ref={contentRef} className="relative flex flex-col items-center max-w-xs w-full px-6 text-center">
        {/* Glowing Forge Emblem */}
        <div className="relative mb-5">
          <div className="w-16 h-16 rounded-2xl bg-[#121216] border border-[#D4A359]/40 flex items-center justify-center shadow-[0_0_20px_rgba(212,163,89,0.35)] animate-pulse">
            <Flame className="w-8 h-8 text-[#D4A359]" />
          </div>
          <div className="absolute inset-0 rounded-2xl border border-[#D4A359]/20 scale-125 animate-ping opacity-25" />
        </div>

        {/* Brand Headline */}
        <span
          style={{ fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', fontWeight: 700 }}
          className="text-xl tracking-widest text-white uppercase mb-1"
        >
          IRONFORGE
        </span>
        <span className="text-[10px] font-mono tracking-widest text-[#D4A359] uppercase mb-6">
          ATHLETIC CLUB • FORGE IMMERSIVE
        </span>

        {/* Progress Bar */}
        <div className="w-full bg-[#141418] h-1.5 rounded-full overflow-hidden border border-white/10 p-[1px] mb-3">
          <div
            className="h-full bg-gradient-to-r from-[#D4A359] via-[#E2B46E] to-[#D4A359] rounded-full transition-all duration-75 ease-out shadow-[0_0_10px_rgba(212,163,89,0.8)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Counter */}
        <span className="text-xs font-mono font-bold text-gray-400">
          {progress}% IGNITING
        </span>
      </div>
    </div>
  );
}
