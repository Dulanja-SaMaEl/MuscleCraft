'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ChevronUp, ChevronDown, Compass } from 'lucide-react';
import gsap from 'gsap';

export interface SlideInfo {
  id: string;
  number: string;
  title: string;
  category: string;
}

export const SLIDES: SlideInfo[] = [
  { id: 'slide-hero', number: '01', title: 'The Forge', category: 'Hero' },
  { id: 'slide-elevate', number: '02', title: 'Elevate', category: 'Progressive Overload' },
  { id: 'slide-offer', number: '03', title: 'The Standard', category: 'What We Offer' },
  { id: 'slide-about', number: '04', title: 'Philosophy', category: 'About Us' },
  { id: 'slide-pricing', number: '05', title: 'Commitment', category: 'Pricing & Cohorts' },
  { id: 'slide-reviews', number: '06', title: 'Proof', category: 'Athlete Reviews' },
  { id: 'slide-banner', number: '07', title: 'The Call', category: 'Transformation' },
  { id: 'slide-faq', number: '08', title: 'Knowledge', category: 'Frequently Asked Questions' },
  { id: 'slide-contact', number: '09', title: 'Visit', category: 'Contact & Map' },
  { id: 'slide-footer', number: '10', title: 'Legacy', category: 'Community & Footer' },
];

interface SlidePresentationControllerProps {
  children: React.ReactNode;
}

export default function SlidePresentationController({ children }: SlidePresentationControllerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showHint, setShowHint] = useState(true);
  const isTransitioningRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastWheelTimeRef = useRef(0);
  const touchStartYRef = useRef(0);

  // Navigate to specific slide index
  const goToSlide = useCallback((index: number) => {
    if (index < 0 || index >= SLIDES.length) return;

    const targetId = SLIDES[index].id;
    const targetElement = document.getElementById(targetId);
    if (!targetElement) return;

    isTransitioningRef.current = true;
    setCurrentSlide(index);
    setShowHint(false);

    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Release lock after animation finishes
    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 750);
  }, []);

  const nextSlide = useCallback(() => {
    goToSlide(currentSlide + 1);
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentSlide - 1);
  }, [currentSlide, goToSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'Home') {
        e.preventDefault();
        goToSlide(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        goToSlide(SLIDES.length - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, goToSlide]);

  // Throttled wheel navigation for 1-slide-per-gesture
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const now = Date.now();
      // Enforce 650ms cooldown to prevent trackpad inertia skipping multiple slides
      if (now - lastWheelTimeRef.current < 650 || isTransitioningRef.current) {
        return;
      }

      const threshold = 28;
      if (Math.abs(e.deltaY) > threshold) {
        lastWheelTimeRef.current = now;
        if (e.deltaY > 0) {
          nextSlide();
        } else {
          prevSlide();
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [nextSlide, prevSlide]);

  // Touch swipe navigation
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartYRef.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndY = e.changedTouches[0].clientY;
      const deltaY = touchStartYRef.current - touchEndY;
      const swipeThreshold = 45;

      if (Math.abs(deltaY) > swipeThreshold) {
        if (deltaY > 0) {
          nextSlide();
        } else {
          prevSlide();
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [nextSlide, prevSlide]);

  // IntersectionObserver to sync slide index during natural scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const index = SLIDES.findIndex((s) => s.id === entry.target.id);
            if (index !== -1) {
              setCurrentSlide(index);
            }
          }
        });
      },
      { threshold: [0.5] }
    );

    SLIDES.forEach((slide) => {
      const el = document.getElementById(slide.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Auto-hide navigation hint after 4.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 4500);
    return () => clearTimeout(timer);
  }, []);

  // Listen to custom jump events (e.g. from navbar links)
  useEffect(() => {
    const handleJump = (e: Event) => {
      const customEvent = e as CustomEvent<{ index: number }>;
      if (typeof customEvent.detail?.index === 'number') {
        goToSlide(customEvent.detail.index);
      }
    };

    window.addEventListener('ironforge:go-to-slide', handleJump);
    return () => window.removeEventListener('ironforge:go-to-slide', handleJump);
  }, [goToSlide]);

  return (
    <div ref={containerRef} className="relative w-full overflow-x-hidden">
      {/* ── Slide Progress Bar at the Top ── */}
      <div className="fixed top-0 left-0 right-0 h-[2.5px] bg-white/[0.06] z-[65] pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-[#D4A359] via-[#E5B670] to-[#D4A359] transition-all duration-500 ease-out shadow-[0_0_10px_rgba(212,163,89,0.8)] origin-left"
          style={{ width: `${((currentSlide + 1) / SLIDES.length) * 100}%` }}
        />
      </div>

      {/* ── Floating Right-Rail Slide Indicators (Desktop) ── */}
      <div className="fixed right-5 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col items-center gap-2.5 bg-black/60 backdrop-blur-md px-2 py-3 rounded-full border border-white/[0.1] shadow-2xl">
        {SLIDES.map((slide, idx) => {
          const isActive = currentSlide === idx;
          return (
            <button
              key={slide.id}
              onClick={() => goToSlide(idx)}
              aria-label={`Navigate to slide ${slide.number}: ${slide.title}`}
              className="group relative flex items-center justify-center p-1 cursor-pointer transition-transform duration-200 hover:scale-125 focus:outline-none"
            >
              {/* Dot */}
              <div
                className={`transition-all duration-300 rounded-full ${
                  isActive
                    ? 'w-2.5 h-6 bg-[#D4A359] shadow-[0_0_12px_rgba(212,163,89,0.9)]'
                    : 'w-2 h-2 bg-white/30 group-hover:bg-white/70'
                }`}
              />

              {/* Tooltip on Hover */}
              <div className="absolute right-9 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 whitespace-nowrap bg-[#121216]/95 border border-gold/40 shadow-xl px-3 py-1.5 rounded text-left backdrop-blur-md">
                <span className="text-[10px] font-mono text-[#D4A359] block font-bold">
                  SLIDE {slide.number}
                </span>
                <span className="text-xs font-semibold text-white block">
                  {slide.title}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Floating Bottom-Right Slide Controls HUD ── */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#121216]/90 backdrop-blur-md border border-white/[0.1] rounded-full p-1.5 shadow-2xl">
        {/* Slide Counter Badge */}
        <div className="px-3 py-1 text-xs font-mono font-semibold text-gray-200 flex items-center gap-1.5">
          <span className="text-[#D4A359] font-bold">{SLIDES[currentSlide]?.number}</span>
          <span className="text-gray-500">/</span>
          <span>{SLIDES.length.toString().padStart(2, '0')}</span>
        </div>

        {/* Up / Down Arrows */}
        <div className="flex items-center gap-1 border-l border-white/10 pl-1">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            aria-label="Previous slide"
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={nextSlide}
            disabled={currentSlide === SLIDES.length - 1}
            aria-label="Next slide"
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Keyboard / Wheel Navigation Toast Hint ── */}
      {showHint && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-opacity duration-500 bg-black/80 backdrop-blur-md border border-gold/30 px-4 py-2 rounded-full shadow-2xl flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-[#D4A359] animate-spin" style={{ animationDuration: '6s' }} />
          <span className="text-xs text-gray-200 font-medium tracking-wide">
            Use <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-white">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-white">↓</kbd> or scroll wheel to navigate slides
          </span>
        </div>
      )}

      {/* Render slides */}
      {children}
    </div>
  );
}
