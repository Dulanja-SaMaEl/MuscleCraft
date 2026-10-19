'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Desktop only check (fine pointer, no touch)
    if (typeof window === 'undefined') return;
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
    if (!hasFinePointer) return;
    setIsDesktop(true);

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // Use gsap quickSetters for high performance 60fps tracking
    const setDotX = gsap.quickSetter(dot, 'x', 'px');
    const setDotY = gsap.quickSetter(dot, 'y', 'px');
    const setRingX = gsap.quickSetter(ring, 'x', 'px');
    const setRingY = gsap.quickSetter(ring, 'y', 'px');

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      setDotX(mouseX);
      setDotY(mouseY);
      setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    // Smooth trailing ring animation via ticker
    const tick = () => {
      // Damped spring trailing
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      setRingX(ringX);
      setRingY(ringY);
    };

    // Event delegation to detect hover over buttons, links, inputs
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const interactive = target.closest('button, a, input, select, textarea, [role="button"], .cursor-interactive');
      setIsHovered(!!interactive);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseover', handleMouseOver, { passive: true });
    gsap.ticker.add(tick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseover', handleMouseOver);
      gsap.ticker.remove(tick);
    };
  }, []);

  if (!isDesktop) return null;

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-[9999] overflow-hidden transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden="true"
    >
      {/* ── Lead Gold Dot ── */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-2 h-2 rounded-full bg-[#D4A359] -translate-x-1/2 -translate-y-1/2 shadow-[0_0_8px_rgba(212,163,89,0.9)] will-change-transform"
      />

      {/* ── Trailing Kinetic Ring (Expands over buttons/interactive targets) ── */}
      <div
        ref={ringRef}
        className={`fixed top-0 left-0 rounded-full border -translate-x-1/2 -translate-y-1/2 will-change-transform transition-all duration-200 ease-out ${
          isHovered
            ? 'w-12 h-12 border-[#D4A359] bg-[#D4A359]/15 shadow-[0_0_18px_rgba(212,163,89,0.4)] scale-125'
            : 'w-8 h-8 border-[#D4A359]/40 bg-transparent scale-100'
        }`}
      />
    </div>
  );
}
