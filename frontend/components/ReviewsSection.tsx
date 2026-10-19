'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import SplitHeading from './motion/SplitHeading';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { revealOnScroll } from './motion/scrollReveal';
import { MOTION_TOKENS } from './motion/tokens';

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface Review {
  author: string;
  program: string;
  quote: string;
  rating: number;
  date: string;
  metric: string;
}

export default function ReviewsSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const eyebrowRef = useRef<HTMLSpanElement | null>(null);
  const lineRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      revealOnScroll(eyebrowRef.current, {
        trigger: eyebrowRef.current,
        y: 20,
        duration: 1.1,
        start: 'top 88%',
      });

      revealOnScroll(section.querySelectorAll('.review-card-item'), {
        trigger: trackRef.current,
        x: 45,
        y: 0,
        stagger: 0.14,
        duration: 1.2,
        start: 'top 88%',
      });

      if (lineRef.current) {
        gsap.fromTo(
          lineRef.current,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 1.2,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: trackRef.current,
              start: 'top 88%',
              toggleActions: 'play none none none',
              once: true,
            },
          }
        );
      }
    },
    { scope: sectionRef }
  );
  const reviews: Review[] = [
    {
      author: 'Marcus Vance',
      program: '90-Day VIP Coaching Member',
      quote:
        'The 90-day program altered my entire understanding of lifting mechanics and nutritional discipline. Dropped 4.5kg of fat while adding 20kg to my competition deadlift.',
      rating: 5,
      date: '2 weeks ago',
      metric: '+20kg Deadlift PR',
    },
    {
      author: 'Sarah Jenkins',
      program: 'Monthly Gym Member',
      quote:
        'Easily the most serious, high-standard training environment in the city. The calibrated equipment is pristine, atmosphere is strictly focused, and zero influencer distractions.',
      rating: 5,
      date: '1 month ago',
      metric: 'Consistent 5x/wk',
    },
    {
      author: 'David Reynolds',
      program: '90-Day VIP Coaching Member',
      quote:
        'Coach Elena’s weekly video check-ins and form audits are worth 10x the price alone. Having an elite coach analyze your bar path and biomechanics changes everything.',
      rating: 5,
      date: '3 weeks ago',
      metric: '-6% Body Fat',
    },
    {
      author: 'Jordan Hayes',
      program: 'Competitive Powerlifter',
      quote:
        'Eleiko IPF-certified calibrated plates and Texas deadlift bars on competition-grade platforms. If you care about legitimate kilo-for-kilo strength, this is home.',
      rating: 5,
      date: '1 month ago',
      metric: 'IPF Regional Qualifier',
    },
    {
      author: 'Elena Mikhailov',
      program: '90-Day VIP Coaching Member',
      quote:
        'The bespoke macro protocol and weekly check-in accountability kept me completely locked in. I achieved the best body composition of my athletic career.',
      rating: 5,
      date: 'Just now',
      metric: 'Cohort Graduate',
    },
  ];

  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const velocityRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  // Update active dot based on scroll
  const handleScroll = useCallback(() => {
    if (!trackRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 0) return;
    const ratio = scrollLeft / maxScroll;
    const newIdx = Math.min(reviews.length - 1, Math.round(ratio * (reviews.length - 1)));
    setCurrentIndex(newIdx);
  }, [reviews.length]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Inertia animation
  const applyInertia = () => {
    if (!trackRef.current) return;
    const friction = 0.94;
    velocityRef.current *= friction;

    trackRef.current.scrollLeft -= velocityRef.current;

    if (Math.abs(velocityRef.current) > 0.5) {
      animationFrameRef.current = requestAnimationFrame(applyInertia);
    }
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!trackRef.current) return;
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setIsDragging(true);
    setStartX(e.pageX - trackRef.current.offsetLeft);
    setScrollLeft(trackRef.current.scrollLeft);
    lastXRef.current = e.pageX;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !trackRef.current) return;
    e.preventDefault();
    const x = e.pageX - trackRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Drag sensitivity
    trackRef.current.scrollLeft = scrollLeft - walk;

    const now = performance.now();
    const dt = now - lastTimeRef.current;
    if (dt > 10) {
      velocityRef.current = (e.pageX - lastXRef.current) / (dt / 16);
      lastXRef.current = e.pageX;
      lastTimeRef.current = now;
    }
  };

  const handleMouseUpOrLeave = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (Math.abs(velocityRef.current) > 1) {
      animationFrameRef.current = requestAnimationFrame(applyInertia);
    }
  };

  // Chevron step navigation
  const scrollStep = (direction: 'left' | 'right') => {
    if (!trackRef.current) return;
    const cardWidth = 380;
    const target =
      direction === 'left'
        ? trackRef.current.scrollLeft - cardWidth
        : trackRef.current.scrollLeft + cardWidth;
    trackRef.current.scrollTo({ left: target, behavior: 'smooth' });
  };

  return (
    <section
      id="slide-reviews"
      ref={sectionRef}
      className="presentation-slide scroll-mt-28 sm:scroll-mt-36 relative w-full overflow-hidden bg-[#080809] border-t border-white/[0.04] py-20 sm:py-28 lg:py-32"
    >
      <div className="ambient-glow-gold bottom-10 left-1/3 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10">
          <div>
            <span
              ref={eyebrowRef}
              className="text-xs font-semibold text-[#D4A359] uppercase tracking-widest font-mono block mb-2 will-change-transform"
            >
              Social Proof & Results
            </span>
            <SplitHeading
              as="h2"
              style={{
                fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
                fontWeight: 600,
                letterSpacing: '-0.02em',
              }}
              className="text-[26px] sm:text-[30px] md:text-[34px] text-white tracking-tight leading-tight"
            >
              Reviews
            </SplitHeading>
            <div
              ref={lineRef}
              style={{ transformOrigin: 'left center' }}
              className="w-12 h-1 bg-[#D4A359] mt-3 rounded-full shadow-[0_0_8px_rgba(212,163,89,0.6)] will-change-transform"
              aria-hidden="true"
            />
          </div>

          {/* Carousel Chevrons & Drag Instruction */}
          <div className="flex items-center gap-4 mt-6 md:mt-0">
            <span className="text-xs text-gray-400 font-mono hidden sm:inline">
              Swipe or Drag with inertia →
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => scrollStep('left')}
                className="w-10 h-10 rounded-full bg-[#141418] border border-white/10 hover:border-gold/50 flex items-center justify-center text-gray-300 hover:text-gold transition-colors cursor-pointer"
                aria-label="Previous review"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scrollStep('right')}
                className="w-10 h-10 rounded-full bg-[#141418] border border-white/10 hover:border-gold/50 flex items-center justify-center text-gray-300 hover:text-gold transition-colors cursor-pointer"
                aria-label="Next review"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── DRAG/SWIPE HORIZONTAL CAROUSEL TRACK ── */}
        <div
          ref={trackRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className={`flex gap-6 overflow-x-auto pb-8 pt-2 scrollbar-none select-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{
            scrollSnapType: isDragging ? 'none' : 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {reviews.map((rev, idx) => (
            <div
              key={idx}
              className="review-card-item will-change-transform flex-shrink-0 w-[300px] sm:w-[380px] scroll-snap-align-start"
              style={{ scrollSnapAlign: 'start' }}
            >
              <div className="liquid-glass-card rounded-2xl p-7 flex flex-col justify-between h-[340px] transition-all duration-300 hover:-translate-y-1">
                <div>
                  {/* Top Row: Stars + Metric Badge */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-1">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="review-star w-4 h-4 fill-gold text-gold will-change-transform" />
                      ))}
                    </div>
                    <span className="text-[10px] font-mono font-bold text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/30">
                      {rev.metric}
                    </span>
                  </div>

                  <p className="text-sm text-gray-200 leading-relaxed italic line-clamp-5">
                    "{rev.quote}"
                  </p>
                </div>

                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-wide">
                      {rev.author}
                    </h4>
                    <span className="text-[11px] text-gray-400 block mt-0.5">
                      {rev.program}
                    </span>
                  </div>

                  {/* Google Verified Review Badge */}
                  <div className="flex items-center gap-1.5 bg-white/[0.04] px-2 py-1 rounded border border-white/[0.08]">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span className="text-[10px] text-gray-400 font-medium">Verified</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mt-4">
          {reviews.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (!trackRef.current) return;
                const cardWidth = 380;
                trackRef.current.scrollTo({ left: i * cardWidth, behavior: 'smooth' });
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentIndex === i ? 'w-8 bg-gold' : 'w-2 bg-white/20'
              }`}
              aria-label={`Jump to review ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
