'use client';

import React from 'react';
import { Flame, Shield, Award, Dumbbell } from 'lucide-react';

export default function MarqueeStrip() {
  const words = [
    'BUILD DISCIPLINE',
    'SCULPT STRENGTH',
    'MUSCLECRAFT',
    'CUSTOM WORKOUT PLANS',
    'PERSONALIZED NUTRITION',
    '1-ON-1 COACHING',
    'HYPERTROPHY & RECOMP',
    'BODY TRANSFORMATION',
    'CONSISTENT PROGRESS',
    'VERIFIED RESULTS',
  ];

  // Repeat twice for seamless infinite scrolling
  const marqueeItems = [...words, ...words];

  return (
    <div
      className="relative w-full overflow-hidden bg-[#0a0a0e]/90 backdrop-blur-lg border-y border-white/[0.08] py-4 select-none group z-20"
      aria-label="Athletic Disciplines and Facility Highlights"
    >
      {/* Ambient side fades */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#08080A] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#08080A] to-transparent z-10 pointer-events-none" />

      {/* Infinite Scrolling Track */}
      <div className="flex w-fit items-center whitespace-nowrap animate-marquee group-hover:[animation-play-state:paused] will-change-transform">
        {marqueeItems.map((item, index) => (
          <div key={index} className="flex items-center gap-6 sm:gap-8 px-4 sm:px-6">
            <span
              style={{
                fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
                fontWeight: 700,
                letterSpacing: '0.08em',
              }}
              className="text-xs sm:text-sm uppercase tracking-widest text-gray-300 hover:text-white transition-colors flex items-center gap-3"
            >
              <span className="text-white drop-shadow">{item}</span>
            </span>

            {/* Precision Crimson Accent Separator */}
            <span className="text-crimson-500 text-xs font-mono opacity-80" aria-hidden="true">
              •
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
