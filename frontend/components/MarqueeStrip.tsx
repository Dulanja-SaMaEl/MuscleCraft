'use client';

import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  Dumbbell,
  ShieldCheck,
  Activity,
  Award,
  Flame,
  Clock,
  Target,
  Sparkles,
} from 'lucide-react';

gsap.registerPlugin(useGSAP);

interface ShowcaseItem {
  name: string;
  tag: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SHOWCASE_ITEMS: ShowcaseItem[] = [
  { name: 'BUILD DISCIPLINE', tag: 'Core Ethos', icon: Flame },
  { name: 'SCULPT STRENGTH', tag: 'Hypertrophy Lab', icon: Dumbbell },
  { name: 'MUSCLECRAFT', tag: 'Flagship Facility', icon: Award },
  { name: 'ELEIKO SPEC', tag: 'Calibrated Iron', icon: Target },
  { name: '1-ON-1 COACHING', tag: 'Coach Adeesha', icon: ShieldCheck },
  { name: 'CUSTOM NUTRITION', tag: 'Macro Protocols', icon: Sparkles },
  { name: 'BODY ANALYTICS', tag: 'Weekly Recomp', icon: Activity },
  { name: '24/7 ACCESS', tag: 'Biometric Entry', icon: Clock },
];

export default function MarqueeStrip() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useGSAP(
    () => {
      const track = trackRef.current;
      if (!track) return;

      tweenRef.current = gsap.to(track, {
        xPercent: -50,
        duration: 30,
        ease: 'none',
        repeat: -1,
        force3D: true,
      });
    },
    { scope: containerRef }
  );

  const handleMouseEnter = () => {
    if (tweenRef.current) {
      gsap.to(tweenRef.current, { timeScale: 0.15, duration: 0.45, ease: 'power2.out' });
    }
  };

  const handleMouseLeave = () => {
    if (tweenRef.current) {
      gsap.to(tweenRef.current, { timeScale: 1, duration: 0.45, ease: 'power2.out' });
    }
  };

  const renderGroup = (isDuplicate: boolean) => (
    <div
      className="flex items-center shrink-0"
      aria-hidden={isDuplicate ? 'true' : undefined}
    >
      {SHOWCASE_ITEMS.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={`${isDuplicate ? 'dup' : 'orig'}-${idx}`}
            className="flex items-center group/item"
          >
            {/* Transparent Brand Showcase Lockup */}
            <div className="flex items-center gap-3.5 px-6 sm:px-9 py-2 transition-all duration-300 cursor-default">
              <span className="w-8 h-8 rounded-full border border-white/10 bg-white/[0.02] group-hover/item:border-crimson-500/60 group-hover/item:bg-crimson-500/10 flex items-center justify-center transition-all duration-300 group-hover/item:scale-110 group-hover/item:shadow-[0_0_16px_rgba(186,26,26,0.35)]">
                <Icon className="w-3.5 h-3.5 text-zinc-400 group-hover/item:text-crimson-400 transition-colors duration-300" />
              </span>

              <div className="flex flex-col leading-none">
                <span className="text-xs sm:text-[13.5px] font-extrabold uppercase tracking-[0.18em] text-zinc-200 group-hover/item:text-white transition-colors duration-300 whitespace-nowrap">
                  {item.name}
                </span>
                <span className="text-[9.5px] font-mono uppercase tracking-[0.14em] text-zinc-400 group-hover/item:text-crimson-400 transition-colors duration-300 mt-1 whitespace-nowrap">
                  {item.tag}
                </span>
              </div>
            </div>

            {/* Ultra-subtle Hairline Separator */}
            <span
              className="h-5 w-px bg-gradient-to-b from-transparent via-white/15 to-transparent shrink-0"
              aria-hidden="true"
            />
          </div>
        );
      })}
    </div>
  );

  return (
    <section
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label="MuscleCraft Training Pillars and Facility Standards"
      className="relative w-full bg-transparent py-6 sm:py-8 overflow-hidden select-none z-20"
    >
      {/* True Alpha Edge Fade Mask (Transparent — no heavy background bar) */}
      <div
        className="w-full overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to right, transparent 0%, black 11%, black 89%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent 0%, black 11%, black 89%, transparent 100%)',
        }}
      >
        {/* Seamless 2-Group Infinite Track */}
        <div
          ref={trackRef}
          data-testid="marquee-track"
          className="flex w-max items-center will-change-transform"
        >
          {renderGroup(false)}
          {renderGroup(true)}
        </div>
      </div>
    </section>
  );
}
