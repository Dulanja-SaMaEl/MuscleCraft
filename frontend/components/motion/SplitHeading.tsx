'use client';

import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

interface SplitHeadingProps {
  children: React.ReactNode;
  as?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  threshold?: string;
  splitBy?: 'words' | 'lines';
}

export default function SplitHeading({
  children,
  as: Component = 'h2',
  className = '',
  style,
  delay = 0,
}: SplitHeadingProps) {
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    gsap.set(el, { opacity: 0, y: 30 });

    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              gsap.to(el, {
                opacity: 1,
                y: 0,
                duration: 1.2,
                delay,
                ease: 'power2.out',
                overwrite: 'auto',
              });
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '0px 0px -10% 0px', threshold: 0 }
      );

      observer.observe(el);
      return () => observer.disconnect();
    } else {
      gsap.to(el, { opacity: 1, y: 0, duration: 1.2, delay, ease: 'power2.out' });
    }
  }, [delay]);

  return (
    <Component
      ref={containerRef}
      className={`${className} will-change-transform`}
      style={style}
    >
      {children}
    </Component>
  );
}
