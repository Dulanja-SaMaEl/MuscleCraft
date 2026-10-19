'use client';

import React, { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';

export default function ForgeLoader() {
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    // Quick, punchy loading sequence (1.2 seconds max)
    const startTime = performance.now();
    const duration = 1100;

    const interval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => setIsDone(true), 150);
        setTimeout(() => setIsHidden(true), 650); // After fade-out transition
      }
    }, 25);

    return () => clearInterval(interval);
  }, []);

  if (isHidden) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#080809] transition-opacity duration-500 ease-out pointer-events-none ${
        isDone ? 'opacity-0' : 'opacity-100'
      }`}
      aria-label="Loading IronForge Athletic Club"
    >
      <div className="relative flex flex-col items-center max-w-xs w-full px-6 text-center">
        {/* Glowing Forge Emblem */}
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#141418] border border-gold/40 flex items-center justify-center shadow-gold-glow animate-pulse">
            <Flame className="w-8 h-8 text-gold animate-bounce" />
          </div>
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-2xl border border-gold/20 scale-125 animate-ping opacity-25" />
        </div>

        {/* Brand Headline */}
        <span className="font-display text-2xl tracking-widest text-white uppercase mb-1">
          IRONFORGE
        </span>
        <span className="text-[11px] font-mono tracking-widest text-gold uppercase mb-6">
          ATHLETIC CLUB • EST. 2024
        </span>

        {/* Progress Bar */}
        <div className="w-full bg-[#18181f] h-1.5 rounded-full overflow-hidden border border-white/10 p-[1px] mb-3">
          <div
            className="h-full bg-gradient-to-r from-gold-600 via-gold to-white rounded-full transition-all duration-75 ease-out shadow-gold-glow"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Percentage Counter */}
        <div className="flex justify-between w-full text-[10px] font-mono text-gray-400">
          <span className="uppercase tracking-wider">Calibrating Iron</span>
          <span className="text-gold font-bold">{progress}%</span>
        </div>
      </div>
    </div>
  );
}
