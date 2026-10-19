import gsap from 'gsap';

/** Slow, luxury reveal timing shared by every section. */
export const REVEAL = {
  duration: 1.2,
  stagger: 0.12,
  ease: 'power2.out',
  y: 40,
} as const;

export interface RevealOptions {
  y?: number;
  x?: number;
  duration?: number;
  stagger?: number;
  start?: string;
  delay?: number;
  scale?: number;
  trigger?: HTMLElement | null;
  ease?: string;
  once?: boolean;
}

/**
 * Fades + glides each target into view smoothly and slowly as the user scrolls into the section.
 * Uses IntersectionObserver to guarantee the animation fires directly in the user's viewport,
 * completely immune to pin spacers, scroll recalculations, or timing race conditions.
 */
export function revealOnScroll(
  targets: gsap.TweenTarget,
  opts: RevealOptions = {}
): void {
  if (typeof window === 'undefined') return;

  const els = gsap.utils.toArray<HTMLElement>(targets).filter(Boolean);
  if (!els.length) return;

  const duration = opts.duration ?? REVEAL.duration;
  const ease = opts.ease ?? REVEAL.ease;
  const y = opts.y ?? REVEAL.y;
  const x = opts.x ?? 0;
  const scale = opts.scale ?? 1;
  const stagger = opts.stagger ?? REVEAL.stagger;
  const baseDelay = opts.delay ?? 0;
  const triggerEl = opts.trigger ?? els[0];

  // Set initial hidden transform
  gsap.set(els, {
    autoAlpha: 0,
    y,
    x,
    scale,
  });

  const playAnimation = () => {
    gsap.to(els, {
      autoAlpha: 1,
      y: 0,
      x: 0,
      scale: 1,
      duration,
      delay: baseDelay,
      stagger,
      ease,
      overwrite: 'auto',
      clearProps: 'transform,willChange',
    });
  };

  if (typeof IntersectionObserver !== 'undefined' && triggerEl) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            playAnimation();
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -10% 0px', // Trigger when 10% inside the viewport
        threshold: 0,
      }
    );

    observer.observe(triggerEl);
  } else {
    // Immediate fallback
    playAnimation();
  }
}
