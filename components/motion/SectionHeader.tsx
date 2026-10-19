'use client';

import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import SplitHeading from './SplitHeading';
import { MOTION_TOKENS } from './tokens';

interface SectionHeaderProps {
  eyebrow?: string;
  heading: string;
  paragraph?: string;
  centered?: boolean;
  className?: string;
  headingStyle?: React.CSSProperties;
}

export default function SectionHeader({
  eyebrow,
  heading,
  paragraph,
  centered = true,
  className = '',
  headingStyle,
}: SectionHeaderProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lineRef = useRef<HTMLDivElement | null>(null);
  const eyebrowRef = useRef<HTMLSpanElement | null>(null);
  const paragraphRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (eyebrowRef.current) gsap.set(eyebrowRef.current, { y: 15, opacity: 0 });
    if (lineRef.current) gsap.set(lineRef.current, { scaleX: 0 });
    if (paragraphRef.current) gsap.set(paragraphRef.current, { y: 18, opacity: 0 });

    const playAnim = () => {
      const tl = gsap.timeline();
      if (eyebrowRef.current) {
        tl.to(eyebrowRef.current, { y: 0, opacity: 1, duration: 0.9, ease: MOTION_TOKENS.ease.luxury }, 0);
      }
      if (lineRef.current) {
        tl.to(lineRef.current, { scaleX: 1, duration: 1.2, ease: MOTION_TOKENS.ease.expoOut }, 0.2);
      }
      if (paragraphRef.current) {
        tl.to(paragraphRef.current, { y: 0, opacity: 1, duration: 1.1, ease: MOTION_TOKENS.ease.luxury }, 0.3);
      }
    };

    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              playAnim();
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '0px 0px -10% 0px', threshold: 0 }
      );
      observer.observe(container);
      return () => observer.disconnect();
    } else {
      playAnim();
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={`${centered ? 'text-center mx-auto' : 'text-left'} ${className}`}
    >
      {eyebrow && (
        <span
          ref={eyebrowRef}
          className="text-xs font-semibold text-[#D4A359] uppercase tracking-widest font-mono block mb-2 will-change-transform"
        >
          {eyebrow}
        </span>
      )}

      <SplitHeading
        as="h2"
        className="font-extrabold uppercase tracking-tight text-white font-sans text-3xl sm:text-4xl md:text-5xl"
        style={{ letterSpacing: '-0.02em', lineHeight: 1.1, ...headingStyle }}
      >
        {heading}
      </SplitHeading>

      {/* Decorative Gold Divider Line */}
      <div
        ref={lineRef}
        className={`h-[2px] w-12 bg-gradient-to-r from-[#D4A359] to-[#C2934B] my-3 rounded-full origin-left will-change-transform ${
          centered ? 'mx-auto' : ''
        }`}
      />

      {paragraph && (
        <p
          ref={paragraphRef}
          className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-2xl mt-3 will-change-transform"
        >
          {paragraph}
        </p>
      )}
    </div>
  );
}
