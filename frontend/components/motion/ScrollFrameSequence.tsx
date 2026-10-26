'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Sparkles, ArrowRight, ChevronDown, Dumbbell, ShieldCheck, Zap } from 'lucide-react';
import { useMagnetic } from '@/components/motion/useMagnetic';
import Hero from '@/components/Hero';
import framesManifest from '@/public/media/frames/frames.json';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, useGSAP);


export interface ScrollFrameSequenceProps {
  scrollLengthDesktop?: string;
  scrollLengthMobile?: string;
  focalX?: number;
  className?: string;
}

export default function ScrollFrameSequence({
  scrollLengthDesktop = '+=220%',
  scrollLengthMobile = '+=180%',
  focalX = 0.7,
  className = '',
}: ScrollFrameSequenceProps) {
  // Container & Layer Refs
  const sectionRef = useRef<HTMLDivElement>(null);
  const parallaxWrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const initialImgRef = useRef<HTMLImageElement>(null);
  const goldLightRef = useRef<HTMLDivElement>(null);

  // Story Beat Refs
  const beat1Ref = useRef<HTMLDivElement>(null);
  const beat2Ref = useRef<HTMLDivElement>(null);
  const beat3Ref = useRef<HTMLDivElement>(null);
  const beat4Ref = useRef<HTMLDivElement>(null);
  const statsStripRef = useRef<HTMLDivElement>(null);

  // Buttons Magnetic Hook
  const magneticBtnRef1 = useMagnetic<HTMLAnchorElement>(0.28);
  const magneticBtnRef4 = useMagnetic<HTMLAnchorElement>(0.28);

  // Runtime State
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [framesFailed, setFramesFailed] = useState(false);
  const [firstFramePainted, setFirstFramePainted] = useState(false);
  const firstFramePaintedRef = useRef(false);
  const [isSectionInView, setIsSectionInView] = useState(true);

  // Animation values & caches (stored in refs to prevent per-frame re-renders)
  const currentFrameIndexRef = useRef(1);
  const frameObjRef = useRef({ frame: 1 });
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const loadedImagesRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const loadingSetRef = useRef<Set<number>>(new Set());
  const activeConfigRef = useRef(
    typeof window !== 'undefined' && window.innerWidth <= 768
      ? framesManifest.mobile
      : framesManifest.desktop
  );

  // Animated Stats DOM Refs for Beat 1 (eliminates 100+ React re-renders on page load)
  const statPercentRef = useRef<HTMLSpanElement>(null);
  const statHoursRef = useRef<HTMLSpanElement>(null);

  // Determine device tier & mobile preferences on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsReducedMotion(false);

    const checkMobile = () => {
      const isNarrow = window.matchMedia('(max-width: 768px)').matches;
      const isLowMemory =
        'deviceMemory' in navigator && (navigator as unknown as { deviceMemory?: number }).deviceMemory! <= 4;
      const useMobile = isNarrow || isLowMemory;
      setIsMobile(useMobile);
      activeConfigRef.current = useMobile ? framesManifest.mobile : framesManifest.desktop;
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Format frame URL from index
  const getFrameUrl = useCallback((index: number) => {
    const config = activeConfigRef.current;
    const padded = String(index).padStart(config.padLength, '0');
    return `${config.basePath}/${config.filePattern.replace('{index}', padded)}`;
  }, []);

  // Nearest frame retrieval (prevents blank canvas if user scrolls faster than background load)
  const getNearestLoadedImage = useCallback((targetIndex: number): HTMLImageElement | null => {
    const loaded = loadedImagesRef.current;
    if (loaded.has(targetIndex)) return loaded.get(targetIndex)!;

    let nearestImg: HTMLImageElement | null = null;
    let minDistance = Infinity;

    loaded.forEach((img, idx) => {
      const dist = Math.abs(idx - targetIndex);
      if (dist < minDistance) {
        minDistance = dist;
        nearestImg = img;
      }
    });

    return nearestImg;
  }, []);

  // High-performance canvas draw routine with focalX "cover" math
  const drawFrame = useCallback(
    (frameIndex: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      let ctx = ctxRef.current;
      if (!ctx) {
        ctx = canvas.getContext('2d', { alpha: false });
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = isMobile ? 'medium' : 'high';
        }
        ctxRef.current = ctx;
      }
      if (!ctx) return;

      const img = getNearestLoadedImage(frameIndex);
      if (!img || !img.complete || img.naturalWidth === 0) return;

      const cw = canvas.width;
      const ch = canvas.height;
      if (cw === 0 || ch === 0) return;

      const iw = img.naturalWidth;
      const ih = img.naturalHeight;

      // Cover fit calculation
      const scale = Math.max(cw / iw, ch / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      const dy = (ch - dh) * 0.5;

      // Focal horizontal alignment (focalX = 0.7 keeps right-third subject in view)
      const desiredCenter = focalX * dw;
      let dx = cw * 0.5 - desiredCenter;
      dx = Math.min(0, Math.max(cw - dw, dx));

      ctx.drawImage(img, dx, dy, dw, dh);

      if (!firstFramePaintedRef.current) {
        firstFramePaintedRef.current = true;
        setFirstFramePainted(true);
      }
    },
    [focalX, getNearestLoadedImage, isMobile]
  );

  // Resize handler: ignore mobile URL bar height changes (<120px) to prevent GPU texture reallocations
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = sectionRef.current;
    if (!canvas || !container) return;

    let prevWidth = 0;
    let prevHeight = 0;

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.0 : 1.5);
      const newWidth = Math.round(rect.width * dpr);
      const newHeight = Math.round(rect.height * dpr);

      // Do not reallocate canvas surface on mobile address bar collapse (<120px height change)
      if (
        prevWidth > 0 &&
        Math.abs(newWidth - prevWidth) < 2 &&
        Math.abs(newHeight - prevHeight) < 120
      ) {
        return;
      }

      prevWidth = newWidth;
      prevHeight = newHeight;
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = isMobile ? 'medium' : 'high';
      }
      ctxRef.current = ctx;
      drawFrame(currentFrameIndexRef.current);
    };

    handleResize();
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    return () => ro.disconnect();
  }, [drawFrame, isMobile]);

  // IntersectionObserver to pause rendering when scrolled out of view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsSectionInView(entry.isIntersecting);
        });
      },
      { threshold: 0.05 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Frame loading pipeline (Frame 1 -> Frames 1-30 priority -> Background distance queue)
  useEffect(() => {
    if (framesFailed) return;
    const config = activeConfigRef.current;
    const totalCount = config.count;
    let isCancelled = false;

    const loadSingleFrame = (idx: number): Promise<HTMLImageElement> => {
      if (loadedImagesRef.current.has(idx)) {
        return Promise.resolve(loadedImagesRef.current.get(idx)!);
      }
      if (loadingSetRef.current.has(idx)) {
        return new Promise((resolve) => {
          const check = setInterval(() => {
            if (loadedImagesRef.current.has(idx)) {
              clearInterval(check);
              resolve(loadedImagesRef.current.get(idx)!);
            }
          }, 40);
        });
      }

      loadingSetRef.current.add(idx);
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.decoding = 'async';
        img.src = getFrameUrl(idx);
        img.onload = () => {
          if (isCancelled) return;
          const finishLoad = () => {
            if (isCancelled) return;
            loadedImagesRef.current.set(idx, img);
            loadingSetRef.current.delete(idx);
            resolve(img);
          };

          if ('decode' in img) {
            img.decode().then(finishLoad).catch(finishLoad);
          } else {
            finishLoad();
          }
        };
        img.onerror = (err) => {
          loadingSetRef.current.delete(idx);
          reject(err);
        };
      });
    };

    // Step 1: Load First Frame
    loadSingleFrame(1)
      .then((img) => {
        if (isCancelled) return;
        drawFrame(1);

        // Step 2: Load Priority Batch (12 frames on mobile, 30 on desktop)
        const priorityLimit = Math.min(isMobile ? 12 : 30, totalCount);
        const priorityPromises: Promise<HTMLImageElement>[] = [];
        for (let i = 2; i <= priorityLimit; i++) {
          priorityPromises.push(loadSingleFrame(i));
        }

        Promise.all(priorityPromises).then(async () => {
          if (isCancelled) return;
          ScrollTrigger.refresh();

          // Step 3: Stream remaining frames with tuned mobile concurrency
          const remainingIndices: number[] = [];
          for (let i = priorityLimit + 1; i <= totalCount; i++) {
            remainingIndices.push(i);
          }

          let activeIndex = 0;
          const concurrency = isMobile ? 3 : 6;

          const worker = async () => {
            while (activeIndex < remainingIndices.length && !isCancelled) {
              const nextIdx = remainingIndices[activeIndex++];
              if (nextIdx) {
                try {
                  await loadSingleFrame(nextIdx);
                } catch {
                  // Nearest-frame fallback covers any skip
                }
              }
            }
          };

          const workers = Array.from({ length: concurrency }, () => worker());
          await Promise.all(workers);
        });
      })
      .catch(() => {
        if (isCancelled) return;
        console.warn(
          '[IronForge Scrollytelling] Frame sequence assets unavailable, engaging fallback 3D Hero.'
        );
        setFramesFailed(true);
      });

    return () => {
      isCancelled = true;
    };
  }, [getFrameUrl, framesFailed, drawFrame]);

  // Desktop Pointer Parallax (Task 4a: +-8px translate, <= 1.5deg rotateX/Y)
  useEffect(() => {
    if (typeof window === 'undefined' || isMobile || isReducedMotion) return;
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (isTouch) return;

    const wrap = parallaxWrapRef.current;
    if (!wrap) return;

    let rafId: number;
    let targetX = 0;
    let targetY = 0;
    let targetRotX = 0;
    let targetRotY = 0;

    let currentX = 0;
    let currentY = 0;
    let currentRotX = 0;
    let currentRotY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2; // -1 to 1
      const ny = (e.clientY / window.innerHeight - 0.5) * 2; // -1 to 1

      targetX = nx * 8; // +-8px
      targetY = ny * 8; // +-8px
      targetRotY = nx * 1.4; // <= 1.5deg
      targetRotX = -ny * 1.4; // <= 1.5deg
    };

    const updateParallax = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      currentRotX += (targetRotX - currentRotX) * 0.08;
      currentRotY += (targetRotY - currentRotY) * 0.08;

      wrap.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(
        2
      )}px, 0px) rotateX(${currentRotX.toFixed(2)}deg) rotateY(${currentRotY.toFixed(2)}deg)`;

      rafId = requestAnimationFrame(updateParallax);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    rafId = requestAnimationFrame(updateParallax);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, [isMobile, isReducedMotion]);

  // GSAP Scrollytelling Timeline (Pinning, Frame Scrub, Beats, Camera Scale, Gold Light)
  useGSAP(
    () => {
      if (framesFailed) return;
      const section = sectionRef.current;
      const canvas = canvasRef.current;
      if (!section || !canvas) return;

      const totalCount = activeConfigRef.current.count;
      const scrollDist = isMobile ? scrollLengthMobile : scrollLengthDesktop;

      // Master Scrubbed Timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: scrollDist,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          scrub: 0.85,
        },
      });

      // 1. Frame Sequence Scrub (1 -> totalCount)
      tl.to(
        frameObjRef.current,
        {
          frame: totalCount,
          ease: 'none',
          duration: 1.0,
          onUpdate: () => {
            const rounded = Math.min(
              totalCount,
              Math.max(1, Math.round(frameObjRef.current.frame))
            );
            if (rounded !== currentFrameIndexRef.current) {
              currentFrameIndexRef.current = rounded;
              drawFrame(rounded);
            }
          },
        },
        0
      );

      // 2. Camera-depth feel: scale canvas gently on desktop only (skips on mobile for GPU fillrate)
      if (!isReducedMotion && !isMobile) {
        tl.to(
          canvas,
          {
            scale: 1.05,
            ease: 'none',
            duration: 1.0,
          },
          0
        );
      }

      // 3. Gold light sweep opacity following sequence progress
      if (goldLightRef.current) {
        tl.fromTo(
          goldLightRef.current,
          { opacity: 0 },
          { opacity: 0.5, ease: 'power2.inOut', duration: 1.0 },
          0
        );
      }

      // ── STORY BEAT 1: 0% - 15% (Hero Headline, CTA, Stats) ──
      // Beat 1 and stats are visible on load by default.
      if (beat1Ref.current) {
        gsap.fromTo(
          beat1Ref.current,
          { opacity: 0.7, y: 16 },
          {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: 'power2.out',
            clearProps: 'transform,opacity',
          }
        );
      }
      if (statsStripRef.current) {
        gsap.fromTo(
          statsStripRef.current,
          { opacity: 0.7, y: 12 },
          {
            opacity: 1,
            y: 0,
            duration: 1.2,
            delay: 0.15,
            ease: 'power2.out',
            clearProps: 'transform,opacity',
          }
        );
      }

      // Scroll exit for Beat 1 wrapper
      if (beat1Ref.current) {
        tl.to(
          beat1Ref.current,
          {
            autoAlpha: 0,
            y: -28,
            scale: 0.98,
            ease: 'power2.inOut',
            duration: 0.09,
          },
          0.04
        );
      }
      if (statsStripRef.current) {
        tl.to(
          statsStripRef.current,
          {
            autoAlpha: 0,
            y: 20,
            ease: 'power2.inOut',
            duration: 0.09,
          },
          0.04
        );
      }

      // ── STORY BEAT 2: 14% - 38% (Disciplines: Strength, Hypertrophy, Powerlifting) ──
      // Pure GPU composited opacity & transform (omits blur filter on mobile)
      if (beat2Ref.current) {
        gsap.set(beat2Ref.current, {
          opacity: 0,
          y: 28,
          scale: 0.98,
          filter: isMobile ? undefined : 'blur(4px)',
          visibility: 'hidden',
        });
        // Entrance: 13% -> 23%
        tl.to(
          beat2Ref.current,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: isMobile ? undefined : 'blur(0px)',
            ease: 'power2.inOut',
            duration: 0.1,
            onStart: () => {
              if (beat2Ref.current) beat2Ref.current.style.visibility = 'visible';
            },
            onReverseComplete: () => {
              if (beat2Ref.current) beat2Ref.current.style.visibility = 'hidden';
            },
          },
          0.13
        );
        // Exit: 34% -> 44%
        tl.to(
          beat2Ref.current,
          {
            opacity: 0,
            y: -28,
            scale: 0.98,
            filter: isMobile ? undefined : 'blur(4px)',
            ease: 'power2.inOut',
            duration: 0.1,
            onComplete: () => {
              if (beat2Ref.current) beat2Ref.current.style.visibility = 'hidden';
            },
            onReverseComplete: () => {
              if (beat2Ref.current) beat2Ref.current.style.visibility = 'visible';
            },
          },
          0.34
        );
      }

      // ── STORY BEAT 3: 42% - 68% (Facility Philosophy & IronForge Standard) ──
      if (beat3Ref.current) {
        gsap.set(beat3Ref.current, {
          opacity: 0,
          y: 28,
          scale: 0.98,
          filter: isMobile ? undefined : 'blur(4px)',
          visibility: 'hidden',
        });
        // Entrance: 42% -> 52%
        tl.to(
          beat3Ref.current,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: isMobile ? undefined : 'blur(0px)',
            ease: 'power2.inOut',
            duration: 0.1,
            onStart: () => {
              if (beat3Ref.current) beat3Ref.current.style.visibility = 'visible';
            },
            onReverseComplete: () => {
              if (beat3Ref.current) beat3Ref.current.style.visibility = 'hidden';
            },
          },
          0.42
        );
        // Exit: 64% -> 74%
        tl.to(
          beat3Ref.current,
          {
            opacity: 0,
            y: -28,
            scale: 0.98,
            filter: isMobile ? undefined : 'blur(4px)',
            ease: 'power2.inOut',
            duration: 0.1,
            onComplete: () => {
              if (beat3Ref.current) beat3Ref.current.style.visibility = 'hidden';
            },
            onReverseComplete: () => {
              if (beat3Ref.current) beat3Ref.current.style.visibility = 'visible';
            },
          },
          0.64
        );
      }

      // ── STORY BEAT 4: 72% - 100% (Final CTA & Cohort Entry) ──
      if (beat4Ref.current) {
        gsap.set(beat4Ref.current, {
          opacity: 0,
          y: 28,
          scale: 0.98,
          filter: isMobile ? undefined : 'blur(4px)',
          visibility: 'hidden',
        });
        // Entrance: 72% -> 84%
        tl.to(
          beat4Ref.current,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: isMobile ? undefined : 'blur(0px)',
            ease: 'power2.inOut',
            duration: 0.11,
            onStart: () => {
              if (beat4Ref.current) beat4Ref.current.style.visibility = 'visible';
            },
            onReverseComplete: () => {
              if (beat4Ref.current) beat4Ref.current.style.visibility = 'hidden';
            },
          },
          0.72
        );
      }

      // Animated Stats count-up on load (Direct DOM update - 0 React re-renders)
      const countTarget = { percent: 0, hours: 0 };
      gsap.to(countTarget, {
        percent: 100,
        hours: 24,
        duration: 1.8,
        delay: 0.3,
        ease: 'power2.out',
        onUpdate: () => {
          if (statPercentRef.current) {
            statPercentRef.current.textContent = String(Math.floor(countTarget.percent));
          }
          if (statHoursRef.current) {
            statHoursRef.current.textContent = String(Math.floor(countTarget.hours));
          }
        },
      });

      // Recalculate all subsequent section triggers with pinned spacer accounted for
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    },
    { scope: sectionRef, dependencies: [isMobile, isReducedMotion, framesFailed] }
  );

  // If assets failed, seamlessly fall back to existing Hero with zero visual disruption
  if (framesFailed) {
    return <Hero />;
  }

  // First frame path for immediate LCP image
  const firstFramePath = `${activeConfigRef.current.basePath}/frame_0001.webp`;

  return (
    <section
      id="scrolly-hero"
      ref={sectionRef}
      className={`relative w-full h-[100svh] min-h-[100dvh] overflow-hidden bg-[#080809] select-none ${className}`}
      aria-label="MuscleCraft Scrollytelling Experience"
    >
      {/* ── Parallax Transform Wrapper (Damped mouse parallax on desktop) ── */}
      <div
        ref={parallaxWrapRef}
        className="absolute inset-0 w-full h-full transform-gpu will-change-transform"
      >
        {/* Real <img> behind canvas for instant high-priority LCP paint */}
        {!firstFramePainted && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={initialImgRef}
            src={firstFramePath}
            alt="MuscleCraft Athletic Facility"
            fetchPriority="high"
            className="absolute inset-0 w-full h-full object-cover z-0"
            style={{ objectPosition: `${Math.round(focalX * 100)}% center` }}
          />
        )}

        {/* ── High-Performance Canvas for WebP Frame Sequence ── */}
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full block z-[1] transform-gpu will-change-transform pointer-events-none"
        />

        {/* ── 3D Effects: Soft Radial Vignette ── */}
        <div
          className="absolute inset-0 pointer-events-none z-[10]"
          style={{
            background:
              'radial-gradient(ellipse at 60% 50%, transparent 45%, rgba(8,8,9,0.7) 80%, rgba(8,8,9,0.96) 100%)',
          }}
        />

        {/* ── 3D Effects: Left-side Dark Scrim for Typography Legibility (Desktop) ── */}
        <div
          className="absolute inset-0 pointer-events-none z-[11] hidden md:block"
          style={{
            background:
              'linear-gradient(to right, rgba(8,8,9,0.92) 0%, rgba(8,8,9,0.72) 38%, rgba(8,8,9,0.2) 65%, transparent 100%)',
          }}
        />

        {/* ── 3D Effects: Bottom Scrim for Typography Legibility (Mobile) ── */}
        <div
          className="absolute inset-0 pointer-events-none z-[11] md:hidden"
          style={{
            background:
              'linear-gradient(to top, rgba(8,8,9,0.98) 0%, rgba(8,8,9,0.85) 45%, rgba(8,8,9,0.25) 75%, transparent 100%)',
          }}
        />

        {/* ── 3D Effects: Subtle Crimson Light Sweep (Follows sequence progress) ── */}
        <div
          ref={goldLightRef}
          className="absolute inset-0 pointer-events-none z-[11] opacity-0 mix-blend-screen"
          style={{
            background:
              'radial-gradient(circle at 75% 65%, rgba(186,26,26,0.35) 0%, rgba(186,26,26,0.08) 45%, transparent 70%)',
          }}
        />

      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          STORY BEATS LAYER (3D Perspective Container with Scrim & Left Layout)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div
        className="relative z-20 w-full h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-between pt-36 sm:pt-40 lg:pt-44 pb-16 sm:pb-20 pointer-events-none"
      >
        {/* Container for Centered Vertical Beats */}
        <div className="relative w-full my-auto flex items-center">
          {/* ────────────────────────────────────────────────────────────────
              BEAT 1 (0% - 15%): HERO HEADLINE, PRIMARY CTA, STATS
              ──────────────────────────────────────────────────────────────── */}
          <div
            ref={beat1Ref}
            className="w-full max-w-3xl text-left pointer-events-auto"
            style={{ opacity: 1, visibility: 'visible' }}
          >
            {/* Editorial Headline */}
            <h1
              style={{ letterSpacing: '-0.03em', lineHeight: 1.02 }}
              className="text-[clamp(2.1rem,4.8vw,4.8rem)] font-extrabold uppercase text-white mb-4 font-sans"
            >
              <span className="block whitespace-nowrap">Made By Athletes</span>
              <span className="block whitespace-nowrap text-white mt-1">
                <span className="text-crimson-500 mr-2 sm:mr-3">
                  For
                </span>{' '}
                Athletes
              </span>
            </h1>

            {/* Sub-copy */}
            <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-xl mb-7 font-normal leading-relaxed drop-shadow">
              Welcome to MuscleCraft — Where champions are forged through science-backed coaching,
              world-class calibrated facilities, and relentless dedication.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 mb-8">
              <Link
                ref={magneticBtnRef1}
                href="/checkout"
                aria-label="Join MuscleCraft Today"
                style={{
                  backgroundColor: '#BA1A1A',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '13.5px',
                }}
                className="px-8 py-3.5 hover:bg-crimson-600 text-white font-semibold text-[13.5px] rounded-full transition-all duration-300 shadow-lg hover:shadow-crimson-glow hover:scale-105 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Join Now</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </Link>

              <Link
                href="/memberships"
                aria-label="Explore 90-Day VIP Coaching"
                style={{ fontWeight: 600, fontSize: '13.5px' }}
                className="px-7 py-3.5 bg-[#141418] hover:bg-[#1c1c24] text-white font-semibold text-[13.5px] rounded-full border border-white/20 hover:border-crimson/50 transition-all duration-300 backdrop-blur-md hover:scale-105 flex items-center justify-center"
              >
                Explore 90-Day VIP Coaching
              </Link>
            </div>

            {/* Scroll Cue Indicator */}
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-crimson-400">
              <ChevronDown className="w-4 h-4 text-crimson-500 animate-[pulse_2s_ease-in-out_infinite]" />
              <span>Scroll To Enter The Facility</span>
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────────────
              BEAT 2 (20% - 40%): THE DISCIPLINES (Strength, Hypertrophy)
              ──────────────────────────────────────────────────────────────── */}
          <div
            ref={beat2Ref}
            className="absolute top-6 sm:top-10 left-0 w-full max-w-2xl text-left pointer-events-auto"
            style={{ visibility: 'hidden' }}
          >
            <h2
              style={{ letterSpacing: '-0.02em', lineHeight: 1.05 }}
              className="text-[clamp(2rem,4.4vw,4rem)] font-extrabold uppercase text-white mb-4 font-sans"
            >
              Built For <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-crimson-500 via-rose-300 to-crimson-600">
                Uncompromising
              </span>{' '}
              Disciplines
            </h2>

            {/* Discipline Tag Badges */}
            <div className="flex flex-wrap gap-2 mb-5">
              {['WEIGHT LOSS', 'FAT LOSS', 'FUNCTIONAL TRAINING', 'RECOVERY'].map((disc) => (
                <span
                  key={disc}
                  className="px-3 py-1 rounded-lg bg-[#16161c]/90 border border-white/10 text-xs font-mono font-bold tracking-wider text-gray-200"
                >
                  {disc}
                </span>
              ))}
            </div>

            <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-lg font-normal leading-relaxed">
              Structured weight loss, metabolic fat loss conditioning, functional fitness, and recovery protocols.
              Practical, science-backed solutions designed to build real discipline and lasting health.
            </p>
          </div>

          {/* ────────────────────────────────────────────────────────────────
              BEAT 3 (50% - 70%): FACILITY PHILOSOPHY & STANDARD
              ──────────────────────────────────────────────────────────────── */}
          <div
            ref={beat3Ref}
            className="absolute top-6 sm:top-10 left-0 w-full max-w-2xl text-left pointer-events-auto"
            style={{ visibility: 'hidden' }}
          >
            <h2
              style={{ letterSpacing: '-0.02em', lineHeight: 1.05 }}
              className="text-[clamp(2rem,4.4vw,3.8rem)] font-extrabold uppercase text-white mb-4 font-sans"
            >
              No Noise. No Gimmicks. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-crimson-500 via-rose-300 to-crimson-600">
                Just Relentless Progress.
              </span>
            </h2>

            <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-xl font-normal leading-relaxed mb-4">
              Every square foot is engineered with singular intention. A private sanctuary where
              continuous biometric tracking, customized nutrition protocols, and world-class lifting
              coaching converge.
            </p>

            <div className="grid grid-cols-2 gap-3 max-w-md pt-2">
              <div className="p-3 rounded-xl bg-[#141418]/80 border border-white/10 backdrop-blur-md">
                <span className="text-lg font-bold text-white block">100% Calibrated</span>
                <span className="text-xs text-gray-400">Competition standard iron & steel</span>
              </div>
              <div className="p-3 rounded-xl bg-[#141418]/80 border border-white/10 backdrop-blur-md">
                <span className="text-lg font-bold text-crimson-400 block">Capped Capacity</span>
                <span className="text-xs text-gray-400">Exclusive member roster size</span>
              </div>
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────────────
              BEAT 4 (85% - 100%): FINAL CTA & COHORT ENTRY
              ──────────────────────────────────────────────────────────────── */}
          <div
            ref={beat4Ref}
            className="absolute top-6 sm:top-10 left-0 w-full max-w-2xl text-left pointer-events-auto"
            style={{ visibility: 'hidden' }}
          >
            <h2
              style={{ letterSpacing: '-0.02em', lineHeight: 1.05 }}
              className="text-[clamp(2rem,4.4vw,4.2rem)] font-extrabold uppercase text-white mb-4 font-sans"
            >
              Claim Your Ground <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-crimson-500 via-rose-300 to-crimson-600">
                At MuscleCraft
              </span>
            </h2>

            <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-lg font-normal leading-relaxed drop-shadow mb-7">
              Step into an environment where excuses cease to exist. Secure your placement in the
              upcoming 90-Day VIP Coaching cohort or apply for general facility access.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <Link
                ref={magneticBtnRef4}
                href="/pricing"
                aria-label="View 90-Day VIP Coaching Pricing"
                style={{
                  backgroundColor: '#BA1A1A',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '13.5px',
                }}
                className="px-8 py-3.5 hover:bg-crimson-600 text-white font-semibold text-[13.5px] rounded-full transition-all duration-300 shadow-lg hover:shadow-crimson-glow hover:scale-105 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Join 90-Day VIP</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </Link>

              <Link
                href="/memberships"
                aria-label="Explore All Memberships"
                style={{ fontWeight: 600, fontSize: '13.5px' }}
                className="px-7 py-3.5 bg-[#141418] hover:bg-[#1c1c24] text-white font-semibold text-[13.5px] rounded-full border border-white/20 hover:border-crimson/50 transition-all duration-300 backdrop-blur-md hover:scale-105 flex items-center justify-center"
              >
                Explore Memberships
              </Link>
            </div>
          </div>
        </div>

        {/* ── LIQUID-GLASS STATS STRIP AT BOTTOM (Visible in Beat 1) ── */}
        <div
          ref={statsStripRef}
          className="relative w-full max-w-3xl pointer-events-auto transform-gpu will-change-transform"
          style={{ opacity: 1, visibility: 'visible' }}
        >
          <div className="liquid-glass-card rounded-2xl p-3 sm:p-4 grid grid-cols-3 divide-x divide-white/10 text-center shadow-2xl">
            <div className="px-2 sm:px-4">
              <span className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white block font-sans tracking-tight">
                <span ref={statPercentRef}>100</span>%
              </span>
              <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-semibold tracking-wider">
                Calibrated Iron
              </span>
            </div>

            <div className="px-2 sm:px-4">
              <span className="text-xl sm:text-2xl md:text-3xl font-extrabold text-crimson-400 block font-sans tracking-tight">
                1-on-1
              </span>
              <span className="text-[10px] sm:text-xs text-rose-200/90 uppercase font-semibold tracking-wider">
                Direct Coaching
              </span>
            </div>

            <div className="px-2 sm:px-4">
              <span className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white block font-sans tracking-tight">
                <span ref={statHoursRef}>24</span>/7
              </span>
              <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-semibold tracking-wider">
                Biometric Access
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
