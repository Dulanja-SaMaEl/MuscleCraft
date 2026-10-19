'use client';

import { RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { MOTION_TOKENS } from './tokens';

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface StaggerOptions {
  delay?: number;
  stagger?: number;
  distance?: number;
  threshold?: string;
  duration?: number;
  once?: boolean;
}

export function useStaggerChildren(
  containerRef: RefObject<HTMLElement>,
  itemSelector: string,
  options: StaggerOptions = {}
) {
  const {
    delay = 0,
    stagger = MOTION_TOKENS.stagger.base,
    distance,
    threshold = 'top 85%',
    duration = MOTION_TOKENS.duration.base,
    once = true,
  } = options;

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      const items = container.querySelectorAll(itemSelector);
      if (!items.length) return;

      const mm = gsap.matchMedia();

      mm.add('(min-width: 768px)', () => {
        const d = distance ?? MOTION_TOKENS.distance.desktop;
        gsap.fromTo(
          items,
          { opacity: 0, y: d },
          {
            opacity: 1,
            y: 0,
            duration,
            delay,
            stagger,
            ease: MOTION_TOKENS.ease.power3Out,
            scrollTrigger: {
              trigger: container,
              start: threshold,
              once,
            },
          }
        );
      });

      mm.add('(max-width: 767px)', () => {
        const d = distance ?? MOTION_TOKENS.distance.mobile;
        gsap.fromTo(
          items,
          { opacity: 0, y: d },
          {
            opacity: 1,
            y: 0,
            duration: Math.min(duration, 0.75),
            delay: Math.min(delay, 0.2),
            stagger: Math.min(stagger, 0.08),
            ease: MOTION_TOKENS.ease.power3Out,
            scrollTrigger: {
              trigger: container,
              start: threshold,
              once,
            },
          }
        );
      });

      return () => mm.revert();
    },
    { scope: containerRef, dependencies: [itemSelector, delay, stagger, distance] }
  );
}
