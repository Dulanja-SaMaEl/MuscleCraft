'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Star, ChevronLeft, ChevronRight, X, ExternalLink, CheckCircle2 } from 'lucide-react';
import SplitHeading from './motion/SplitHeading';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { revealOnScroll } from './motion/scrollReveal';

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface Review {
  id: string;
  author: string;
  program: string;
  quote: string;
  rating: number;
  date: string;
  metric: string;
  avatar: string;
  screenshot: string;
  hasGraph?: boolean;
}

export default function ReviewsSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const eyebrowRef = useRef<HTMLSpanElement | null>(null);
  const lineRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const [activeScreenshot, setActiveScreenshot] = useState<string | null>(null);
  const [activeAuthor, setActiveAuthor] = useState<string | null>(null);

  const reviews: Review[] = [
    {
      id: 'neluka',
      author: 'Neluka Rodrigo',
      program: '3-Month Distant PT with Coach Adeesha',
      quote:
        'I followed a three-month distant personal training program with Adeesha of Musclecraft. It was a weight loss program carefully tailored to my health conditions, including a structured meal plan and exercise routine. Adeesha followed up with me weekly and kept me motivated... During these three months, I managed to lose 9 kg, which I honestly never expected! It truly transformed me physically and mentally. All credit goes to Adeesha.',
      rating: 5,
      date: '8 Jan',
      metric: '-9 kg Weight Loss',
      avatar: '/reviews/avatars/neluka.png',
      screenshot: '/reviews/Screenshot_20261019_162929_Facebook.jpg.jpeg',
    },
    {
      id: 'sandy',
      author: 'Sandy Wickramasinghe',
      program: 'Personal Training & Nutrition Program',
      quote:
        'I’ve had a really good experience at this gym. From the beginning, the trainer provided me with a proper diet plan along with the workouts. What motivated me the most was seeing real results — I started to notice my weight going down and my waist size reducing. The trainer is supportive and guides you properly, making the journey enjoyable. Highly recommended!',
      rating: 5,
      date: '14 Mar',
      metric: 'Waist & Weight Reduction',
      avatar: '/reviews/avatars/sandy.png',
      screenshot: '/reviews/Screenshot_20261019_162907_Facebook.jpg.jpeg',
    },
    {
      id: 'kaveen',
      author: 'Kaveen Tharanga',
      program: 'Personal Online Coaching',
      quote:
        'Amazing MuscleCraft coach! Always motivating and providing guidance tailored to my goals. Thanks to the support, I’ve seen real progress in my fitness journey. 1-month progress graph: Weight dropped from 85kg down to 79kg (-6kg) and waist size reduced. Highly recommend!',
      rating: 5,
      date: '9 Jan',
      metric: '-6 kg in 1 Month (85→79kg)',
      avatar: '/reviews/avatars/kaveen.png',
      screenshot: '/reviews/Screenshot_20261019_162923_Facebook.jpg.jpeg',
      hasGraph: true,
    },
    {
      id: 'sevwandi',
      author: 'Sevwandi Dinusha',
      program: 'Weight Loss & Habit Rebuild',
      quote:
        'I am extremely grateful to my coach for helping me achieve my weight loss goals in a healthy and sustainable way. The personalized meal plans were balanced and easy to follow, making it possible to enjoy food while still seeing great results. Continuous guidance, motivation, and support kept me focused and confident. Highly recommend our gym MUSCLECRAFT!',
      rating: 5,
      date: '4 Jun',
      metric: 'Sustainable Diet & Habits',
      avatar: '/reviews/avatars/sevwandi.png',
      screenshot: '/reviews/Screenshot_20261019_163123_Facebook.jpg.jpeg',
    },
    {
      id: 'sach',
      author: 'Sach Thara',
      program: 'Custom Workout & Safety Coaching',
      quote:
        'Couldn\'t ask for a better gym and a trainer! It has the best personal trainer who designs customized workouts for you and creates the perfect balance between encouraging and demanding your absolute best. He truly cares about his clients\' results and safety. Best decision I made for my health!',
      rating: 5,
      date: '24 Aug',
      metric: 'Custom Safety & Technique',
      avatar: '/reviews/avatars/sach.png',
      screenshot: '/reviews/Screenshot_20261019_163117_Facebook.jpg.jpeg',
    },
    {
      id: 'thabeetha',
      author: 'Thabeetha Nayomi Karunasinghe',
      program: 'Custom Workout & Diet Protocol',
      quote:
        '100% recommended! Anyone can join with complete confidence. You get a personalized workout plan and diet plan tailored specifically for you. What makes them unique is they don\'t abandon you after joining — they follow up constantly, keep you motivated, and refine your plan until you achieve your dream results. Thank you Musclecraft team!',
      rating: 5,
      date: '31 Jan',
      metric: '100% Recommended • Constant Care',
      avatar: '/reviews/avatars/thabeetha.png',
      screenshot: '/reviews/Screenshot_20261019_162917_Facebook.jpg.jpeg',
    },
    {
      id: 'thimira',
      author: 'Thimira Lalinda Gamage',
      program: 'Online Coaching Member',
      quote:
        'I’m currently doing online coaching with this gym and the experience has been amazing. The coaches are very friendly, supportive, and always check on my progress. They give clear guidance and keep you accountable every step of the way.',
      rating: 5,
      date: '19 May',
      metric: '5/5 Star Online Coaching',
      avatar: '/reviews/avatars/thimira.png',
      screenshot: '/reviews/Screenshot_20261019_162858_Facebook.jpg.jpeg',
    },
    {
      id: 'yehansi',
      author: 'Yehansi Kushmitha',
      program: 'Busy Professional Training',
      quote:
        'What a trainer! Amazing workouts and easy for busy people. Highly recommended to anyone balancing a packed schedule while wanting to stay in peak shape!',
      rating: 5,
      date: '12 Jun',
      metric: 'Workouts for Busy Lifestyles',
      avatar: '/reviews/avatars/yehansi.png',
      screenshot: '/reviews/Screenshot_20261019_162843_Facebook.jpg.jpeg',
    },
  ];

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
        stagger: 0.12,
        duration: 1.1,
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
    const walk = (x - startX) * 1.5;
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
      className="presentation-slide scroll-mt-28 sm:scroll-mt-36 relative w-full overflow-hidden bg-[#08080A] border-t border-white/[0.04] py-20 sm:py-28 lg:py-32"
    >
      <div className="ambient-glow-crimson bottom-10 left-1/3 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10">
          <div>
            <span
              ref={eyebrowRef}
              className="text-xs font-semibold text-crimson-400 uppercase tracking-widest font-mono block mb-2 will-change-transform"
            >
              Verified Client Transformations
            </span>
            <SplitHeading
              as="h2"
              style={{
                fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
                fontWeight: 600,
                letterSpacing: '-0.02em',
              }}
              className="text-[26px] sm:text-[30px] md:text-[36px] text-white tracking-tight leading-tight uppercase font-sans"
            >
              Real Results. Real Stories.
            </SplitHeading>
            <div
              ref={lineRef}
              style={{ transformOrigin: 'left center' }}
              className="w-14 h-1 bg-crimson-600 mt-3 rounded-full shadow-[0_0_12px_rgba(186,26,26,0.7)] will-change-transform"
              aria-hidden="true"
            />
          </div>

          {/* Carousel Chevrons & Drag Instruction */}
          <div className="flex items-center gap-4 mt-6 md:mt-0">
            <span className="text-xs text-gray-400 font-mono hidden sm:inline">
              Swipe or Drag to explore →
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => scrollStep('left')}
                className="w-10 h-10 rounded-full bg-[#141418] border border-white/10 hover:border-crimson-500/50 flex items-center justify-center text-gray-300 hover:text-crimson-400 transition-colors cursor-pointer"
                aria-label="Previous review"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scrollStep('right')}
                className="w-10 h-10 rounded-full bg-[#141418] border border-white/10 hover:border-crimson-500/50 flex items-center justify-center text-gray-300 hover:text-crimson-400 transition-colors cursor-pointer"
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
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="review-card-item will-change-transform flex-shrink-0 w-[320px] sm:w-[410px] scroll-snap-align-start"
              style={{ scrollSnapAlign: 'start' }}
            >
              <div className="liquid-glass-card rounded-2xl p-6 sm:p-7 flex flex-col justify-between h-[400px] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-crimson-500/40 hover:shadow-[0_20px_50px_rgba(186,26,26,0.2)]">
                <div>
                  {/* Top Row: Stars + Milestone Badge */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-1">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="review-star w-4 h-4 fill-crimson-500 text-crimson-500 will-change-transform" />
                      ))}
                    </div>
                    <span className="text-[10px] font-mono font-bold text-crimson-300 bg-crimson-950/60 px-2.5 py-0.5 rounded-full border border-crimson-500/30 whitespace-nowrap">
                      {rev.metric}
                    </span>
                  </div>

                  <p className="text-sm text-gray-200 leading-relaxed italic line-clamp-6">
                    "{rev.quote}"
                  </p>
                </div>

                <div className="pt-4 border-t border-white/[0.08]">
                  <div className="flex items-center justify-between gap-3 mb-3 min-w-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border border-crimson-500/40 bg-black/50 flex-shrink-0">
                        <Image
                          src={rev.avatar}
                          alt={rev.author}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-white tracking-wide truncate">
                          {rev.author}
                        </h4>
                        <span className="text-[11px] text-gray-400 block truncate">
                          {rev.program}
                        </span>
                      </div>
                    </div>

                    {/* Facebook Recommendation Badge */}
                    <div className="flex items-center gap-1.5 bg-[#1877F2]/15 px-2.5 py-1 rounded-full border border-[#1877F2]/40 flex-shrink-0 shadow-sm">
                      <svg className="w-3.5 h-3.5 fill-[#1877F2]" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      <span className="text-[9.5px] text-blue-200 font-bold uppercase tracking-wider whitespace-nowrap">
                        Recommends
                      </span>
                    </div>
                  </div>

                  {/* View Original Proof Button */}
                  <button
                    onClick={() => {
                      setActiveScreenshot(rev.screenshot);
                      setActiveAuthor(rev.author);
                    }}
                    className="w-full text-center py-1.5 px-3 rounded-lg bg-white/[0.04] hover:bg-crimson-950/40 border border-white/[0.08] hover:border-crimson-500/40 text-[11px] text-gray-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer font-mono"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-crimson-400" />
                    <span>View Verified Review Proof</span>
                    <ExternalLink className="w-3 h-3 text-gray-500" />
                  </button>
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
                const cardWidth = 390;
                trackRef.current.scrollTo({ left: i * cardWidth, behavior: 'smooth' });
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentIndex === i ? 'w-8 bg-crimson-600 shadow-[0_0_8px_rgba(186,26,26,0.6)]' : 'w-2 bg-white/20'
              }`}
              aria-label={`Jump to review ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ── Modal Lightbox for Screenshot Proof ── */}
      {activeScreenshot && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveScreenshot(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-xl w-full max-h-[90vh] bg-[#121216] border border-white/20 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-black/40">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-crimson-500 animate-pulse" />
                <h3 className="text-sm font-bold text-white font-sans">
                  Verified Facebook Review — {activeAuthor}
                </h3>
              </div>
              <button
                onClick={() => setActiveScreenshot(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Image Body */}
            <div className="relative flex-1 overflow-auto p-4 flex items-center justify-center bg-black/50">
              <img
                src={activeScreenshot}
                alt={`Original review screenshot for ${activeAuthor}`}
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-lg border border-white/10"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
