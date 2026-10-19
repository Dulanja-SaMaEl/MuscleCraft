'use client';

import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement | null>(null);

  useGSAP(() => {
    const bar = barRef.current;
    if (!bar) return;

    gsap.fromTo(
      bar,
      { scaleX: 0 },
      {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.1,
        },
      }
    );
  }, { scope: barRef });

  return (
    <div
      ref={barRef}
      className="fixed top-0 left-0 right-0 h-[2px] bg-[#D4A359] z-[70] origin-left pointer-events-none shadow-[0_0_8px_rgba(212,163,89,0.8)]"
      aria-hidden="true"
    />
  );
}
