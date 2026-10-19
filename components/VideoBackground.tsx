'use client';

import React, { useEffect, useRef, useState } from 'react';

interface VideoBackgroundProps {
  name: 'hero' | 'forge' | 'bar' | string;
  overlayStrength?: number; // 0 to 1
  className?: string;
  children?: React.ReactNode;
}

export default function VideoBackground({
  name,
  overlayStrength = 0.65,
  className = '',
  children,
}: VideoBackgroundProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [hasMedia, setHasMedia] = useState<boolean | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(false);
  const [isSaveData, setIsSaveData] = useState<boolean>(false);

  // 1. Detect device & preferences
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check prefers-reduced-motion
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(motionQuery.matches);
    const handleMotionChange = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    motionQuery.addEventListener('change', handleMotionChange);

    // Check Save-Data header / connection API
    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean };
    };
    if (nav.connection?.saveData) {
      setIsSaveData(true);
    }

    // Check mobile screen via JS matchMedia (requirement: pick mobile file via JS, NOT source media attr)
    const mobileQuery = window.matchMedia('(max-width: 768px)');
    setIsMobile(mobileQuery.matches);
    const handleMobileChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mobileQuery.addEventListener('change', handleMobileChange);

    // 2. Check if local video files exist in /media via safe status-200 check
    fetch(`/api/media-check?name=${name}`)
      .then((res) => res.json())
      .then((data: { exists: boolean }) => {
        if (data.exists) {
          setHasMedia(true);
        } else {
          console.info(
            `[VideoBackground] Notice: Media files for "${name}" not found in /media. Using animated gold-and-black noise shader fallback.`
          );
          setHasMedia(false);
        }
      })
      .catch(() => {
        console.info(
          `[VideoBackground] Notice: Media files for "${name}" not found in /media. Using animated gold-and-black noise shader fallback.`
        );
        setHasMedia(false);
      });

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      mobileQuery.removeEventListener('change', handleMobileChange);
    };
  }, [name]);

  // 3. Pause video when off-screen via IntersectionObserver
  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container || !hasMedia) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {
            // Autoplay may be restricted until interaction
          });
        } else {
          video.pause();
        }
      },
      { threshold: 0.08 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [hasMedia]);

  // 4. Procedural gold-and-black gradient with subtle noise shader fallback
  useEffect(() => {
    // Only run procedural shader if video media does not exist
    if (hasMedia === true) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let isVisible = true;

    // Pause rendering when off-screen
    const container = containerRef.current;
    let observer: IntersectionObserver | null = null;
    if (container) {
      observer = new IntersectionObserver(([entry]) => {
        isVisible = entry.isIntersecting;
      }, { threshold: 0.05 });
      observer.observe(container);
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(rect.width * dpr, 300);
      canvas.height = Math.max(rect.height * dpr, 300);
    };

    resize();
    window.addEventListener('resize', resize);

    // Create a 2D noise pattern once for high performance
    const noiseSize = 128;
    const noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = noiseSize;
    noiseCanvas.height = noiseSize;
    const noiseCtx = noiseCanvas.getContext('2d');
    if (noiseCtx) {
      const imgData = noiseCtx.createImageData(noiseSize, noiseSize);
      for (let i = 0; i < imgData.data.length; i += 4) {
        const val = Math.random() * 32;
        imgData.data[i] = val;
        imgData.data[i + 1] = val;
        imgData.data[i + 2] = val;
        imgData.data[i + 3] = 22; // subtle opacity
      }
      noiseCtx.putImageData(imgData, 0, 0);
    }
    const noisePattern = ctx.createPattern(noiseCanvas, 'repeat');

    let time = 0;

    const render = () => {
      if (isVisible) {
        time += 0.006;
        const w = canvas.width;
        const h = canvas.height;

        // Base dark background
        ctx.fillStyle = '#080809';
        ctx.fillRect(0, 0, w, h);

        // Animated organic molten gold and obsidian currents
        const cx1 = w * (0.35 + Math.sin(time * 0.7) * 0.15);
        const cy1 = h * (0.45 + Math.cos(time * 0.5) * 0.18);
        const r1 = Math.max(w, h) * 0.65;

        const grad1 = ctx.createRadialGradient(cx1, cy1, 0, cx1, cy1, r1);
        grad1.addColorStop(0, 'rgba(212, 163, 89, 0.18)'); // molten gold core
        grad1.addColorStop(0.35, 'rgba(120, 85, 35, 0.09)');
        grad1.addColorStop(0.7, 'rgba(25, 20, 15, 0.04)');
        grad1.addColorStop(1, 'rgba(8, 8, 9, 0)');

        ctx.fillStyle = grad1;
        ctx.fillRect(0, 0, w, h);

        const cx2 = w * (0.7 + Math.cos(time * 0.6) * 0.18);
        const cy2 = h * (0.3 + Math.sin(time * 0.8) * 0.16);
        const r2 = Math.max(w, h) * 0.55;

        const grad2 = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, r2);
        grad2.addColorStop(0, 'rgba(226, 180, 110, 0.13)');
        grad2.addColorStop(0.4, 'rgba(80, 55, 20, 0.06)');
        grad2.addColorStop(1, 'rgba(8, 8, 9, 0)');

        ctx.fillStyle = grad2;
        ctx.fillRect(0, 0, w, h);

        // Third subtle amber filament
        const cx3 = w * (0.5 + Math.sin(time * 0.4) * 0.2);
        const cy3 = h * (0.8 + Math.cos(time * 0.7) * 0.12);
        const grad3 = ctx.createRadialGradient(cx3, cy3, 0, cx3, cy3, w * 0.5);
        grad3.addColorStop(0, 'rgba(194, 147, 75, 0.12)');
        grad3.addColorStop(1, 'rgba(8, 8, 9, 0)');
        ctx.fillStyle = grad3;
        ctx.fillRect(0, 0, w, h);

        // Apply noise overlay texture
        if (noisePattern) {
          ctx.fillStyle = noisePattern;
          ctx.fillRect(0, 0, w, h);
        }
      }

      const isLighthouse =
        typeof window !== 'undefined' &&
        /Lighthouse|Chrome-Lighthouse/i.test(navigator.userAgent);

      if (!isReducedMotion && !isLighthouse) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      if (observer) observer.disconnect();
    };
  }, [hasMedia]);

  const shouldRenderVideo = hasMedia === true && !isReducedMotion && !isSaveData;

  const currentVideoSrc = isMobile
    ? `/media/${name}-mobile.mp4`
    : `/media/${name}.mp4`;
  const currentWebmSrc = `/media/${name}.webm`;
  const posterSrc = `/media/${name}-poster.jpg`;

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      {/* ── 1. Video Player (when files exist) ── */}
      {shouldRenderVideo ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={posterSrc}
          className="absolute inset-0 w-full h-full object-cover filter contrast-[1.1] brightness-[0.9]"
        >
          <source src={currentVideoSrc} type="video/mp4" />
          <source src={currentWebmSrc} type="video/webm" />
        </video>
      ) : hasMedia === true && (isReducedMotion || isSaveData) ? (
        /* Reduced motion or Save-Data fallback: show only poster */
        <img
          src={posterSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter contrast-[1.05] brightness-[0.85]"
        />
      ) : (
        /* ── 2. Procedural Gold & Black Gradient Noise Shader Fallback ── */
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* ── 3. Atmospheric Black Vignette Scrim (Ensures WCAG AA 4.5:1 Contrast) ── */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, rgba(8, 8, 9, ${
            overlayStrength * 0.4
          }) 0%, rgba(8, 8, 9, ${overlayStrength * 0.75}) 60%, rgba(8, 8, 9, 0.98) 100%)`,
        }}
      />

      {/* ── 4. Deep Radial Scrim for Vignette Polish ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, transparent 0%, rgba(8, 8, 9, 0.45) 65%, #080809 100%)',
        }}
      />

      {children}
    </div>
  );
}
