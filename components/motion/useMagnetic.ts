'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function useMagnetic<T extends HTMLElement = HTMLButtonElement>(strength = 0.3) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Disabled on touch or reduced motion
    if (
      typeof window === 'undefined' ||
      window.matchMedia('(max-width: 768px)').matches ||
      'ontouchstart' in window
    ) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) * strength;
      const deltaY = (e.clientY - centerY) * strength;

      gsap.to(el, {
        x: deltaX,
        y: deltaY,
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: 'elastic.out(1, 0.4)',
      });
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
      gsap.set(el, { x: 0, y: 0 });
    };
  }, [strength]);

  return ref;
}
