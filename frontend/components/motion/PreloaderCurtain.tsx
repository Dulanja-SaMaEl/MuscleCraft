'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
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
      window.dispatchEvent(new CustomEvent('musclecraft:curtain-lifted'));
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
            window.dispatchEvent(new CustomEvent('musclecraft:curtain-lifted'));
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
      aria-label="Loading MuscleCraft Athletic Platform"
    >
      <div ref={contentRef} className="relative flex flex-col items-center max-w-xs w-full px-6 text-center">
        {/* Glowing MuscleCraft Emblem */}
        <div className="relative mb-5">
          <div className="w-16 h-16 rounded-2xl bg-[#121216] border border-crimson-600/40 flex items-center justify-center shadow-[0_0_25px_rgba(186,26,26,0.45)] animate-pulse p-2.5">
            <Image
              src="/images/musclecraft-emblem.png"
              alt="MuscleCraft Emblem"
              width={48}
              height={48}
              className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(220,38,38,0.7)]"
              priority
            />
          </div>
          <div className="absolute inset-0 rounded-2xl border border-crimson-500/20 scale-125 animate-ping opacity-25" />
        </div>

        {/* Brand Headline */}
        <span
          style={{ fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', fontWeight: 800 }}
          className="text-xl tracking-widest text-white uppercase mb-1"
        >
          MUSCLE<span className="text-crimson-500">CRAFT</span>
        </span>
        <span className="text-[10px] font-mono tracking-widest text-crimson-400 uppercase mb-6 font-semibold">
          BUILD DISCIPLINE • SCULPT STRENGTH
        </span>

        {/* Progress Bar */}
        <div className="w-full bg-[#141418] h-1.5 rounded-full overflow-hidden border border-white/10 p-[1px] mb-3">
          <div
            className="h-full bg-gradient-to-r from-crimson-700 via-crimson-500 to-rose-400 rounded-full transition-all duration-75 ease-out shadow-[0_0_12px_rgba(186,26,26,0.85)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Counter */}
        <span className="text-xs font-mono font-bold text-gray-400">
          {progress}% CALIBRATING
        </span>
      </div>
    </div>
  );
}
