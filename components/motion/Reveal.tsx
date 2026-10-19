'use client';

import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { MOTION_TOKENS } from './tokens';

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface RevealProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  delay?: number;
  duration?: number;
  distance?: number;
  threshold?: string;
  className?: string;
  as?: React.ElementType;
}

export default function Reveal({
  children,
  direction = 'up',
  delay = 0,
  duration = MOTION_TOKENS.duration.base,
  distance,
  threshold = 'top 85%',
  className = '',
  as: Component = 'div',
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();

      // Desktop
      mm.add('(min-width: 768px)', () => {
        const d = distance ?? MOTION_TOKENS.distance.desktop;
        let x = 0;
        let y = 0;
        if (direction === 'up') y = d;
        if (direction === 'down') y = -d;
        if (direction === 'left') x = d;
        if (direction === 'right') x = -d;

        gsap.fromTo(
          el,
          { opacity: 0, x, y },
          {
            opacity: 1,
            x: 0,
            y: 0,
            duration,
            delay,
            ease: MOTION_TOKENS.ease.luxury,
            scrollTrigger: {
              trigger: el,
              start: threshold,
              once: true,
            },
          }
        );
      });

      // Mobile
      mm.add('(max-width: 767px)', () => {
        const d = distance ?? MOTION_TOKENS.distance.mobile;
        let x = 0;
        let y = 0;
        if (direction === 'up') y = d;
        if (direction === 'down') y = -d;
        if (direction === 'left') x = d;
        if (direction === 'right') x = -d;

        gsap.fromTo(
          el,
          { opacity: 0, x, y },
          {
            opacity: 1,
            x: 0,
            y: 0,
            duration: Math.min(duration, 0.75),
            delay: Math.min(delay, 0.2),
            ease: MOTION_TOKENS.ease.luxury,
            scrollTrigger: {
              trigger: el,
              start: threshold,
              once: true,
            },
          }
        );
      });

      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <Component ref={ref} className={className}>
      {children}
    </Component>
  );
}

export { revealOnScroll, REVEAL } from './scrollReveal';

