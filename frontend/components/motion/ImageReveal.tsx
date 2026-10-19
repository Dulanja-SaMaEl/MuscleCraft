'use client';

import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { MOTION_TOKENS } from './tokens';

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface ImageRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'bottom' | 'top' | 'left' | 'right';
  parallax?: boolean;
}

export default function ImageReveal({
  children,
  className = '',
  delay = 0,
  direction = 'bottom',
  parallax = true,
}: ImageRevealProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const container = containerRef.current;
      const inner = innerRef.current;
      if (!container || !inner) return;

      const mm = gsap.matchMedia();

      // Desktop: clip wipe + scale down + slight scroll parallax
      mm.add('(min-width: 768px)', () => {
        let initialClip = 'inset(100% 0% 0% 0%)';
        if (direction === 'top') initialClip = 'inset(0% 0% 100% 0%)';
        if (direction === 'left') initialClip = 'inset(0% 100% 0% 0%)';
        if (direction === 'right') initialClip = 'inset(0% 0% 0% 100%)';

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: container,
            start: 'top 85%',
            once: true,
          },
        });

        tl.fromTo(
          container,
          { clipPath: initialClip, opacity: 0 },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            opacity: 1,
            duration: MOTION_TOKENS.duration.slow,
            delay,
            ease: MOTION_TOKENS.ease.expoOut,
          }
        ).fromTo(
          inner,
          { scale: 1.15 },
          {
            scale: 1.0,
            duration: MOTION_TOKENS.duration.slow + 0.2,
            ease: MOTION_TOKENS.ease.power3Out,
          },
          0
        );

        if (parallax) {
          gsap.fromTo(
            inner,
            { yPercent: -6 },
            {
              yPercent: 6,
              ease: 'none',
              scrollTrigger: {
                trigger: container,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1.2,
              },
            }
          );
        }
      });

      // Mobile: shorter clip wipe + scale down, no parallax
      mm.add('(max-width: 767px)', () => {
        let initialClip = 'inset(100% 0% 0% 0%)';
        if (direction === 'top') initialClip = 'inset(0% 0% 100% 0%)';
        if (direction === 'left') initialClip = 'inset(0% 100% 0% 0%)';
        if (direction === 'right') initialClip = 'inset(0% 0% 0% 100%)';

        gsap.fromTo(
          container,
          { clipPath: initialClip, opacity: 0 },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            opacity: 1,
            duration: MOTION_TOKENS.duration.fast,
            delay: Math.min(delay, 0.15),
            ease: MOTION_TOKENS.ease.expoOut,
            scrollTrigger: {
              trigger: container,
              start: 'top 85%',
              once: true,
            },
          }
        );

        gsap.fromTo(
          inner,
          { scale: 1.1 },
          {
            scale: 1.0,
            duration: MOTION_TOKENS.duration.base,
            ease: MOTION_TOKENS.ease.power3Out,
            scrollTrigger: {
              trigger: container,
              start: 'top 85%',
              once: true,
            },
          }
        );
      });

      return () => mm.revert();
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className={`overflow-hidden relative ${className}`}>
      <div ref={innerRef} className="w-full h-full transform-gpu will-change-transform">
        {children}
      </div>
    </div>
  );
}
