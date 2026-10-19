'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useMagnetic } from './motion/useMagnetic';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { MOTION_TOKENS } from './motion/tokens';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const footerRef = useRef<HTMLElement | null>(null);
  const magneticBtnRef = useMagnetic<HTMLButtonElement>(0.25);

  useGSAP(
    () => {
      const footer = footerRef.current;
      if (!footer) return;

      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: reduce)', () => {
        const cols = footer.querySelectorAll('.footer-anim-item');
        gsap.set(cols, { opacity: 1, y: 0 });
      });

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const cols = footer.querySelectorAll('.footer-anim-item');
        gsap.fromTo(
          cols,
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: MOTION_TOKENS.duration.slow,
            stagger: 0.14,
            ease: MOTION_TOKENS.ease.luxury,
            scrollTrigger: {
              trigger: footer,
              start: 'top 90%',
              once: true,
            },
          }
        );
      });

      return () => mm.revert();
    },
    { scope: footerRef }
  );

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer
      id="slide-footer"
      ref={footerRef}
      className="presentation-slide relative w-full min-h-[60vh] flex items-center justify-center overflow-hidden bg-[#050507] border-t border-white/[0.08] text-gray-400 text-sm py-16 sm:py-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Monogram & Social Icons */}
          <div className="footer-anim-item will-change-transform lg:col-span-6 space-y-4 sm:space-y-5">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 border border-gold/60 rounded flex items-center justify-center bg-black/40">
                <svg
                  viewBox="0 0 32 32"
                  fill="none"
                  className="w-6 h-6 text-gold"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 6V26M24 6V26M8 16H24M5 8H11M21 8H27M5 24H11M21 24H27"
                    stroke="#E5A93C"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="font-extrabold tracking-wider text-white text-lg uppercase font-sans">
                Iron<span className="text-gold">Forge</span>
              </span>
            </Link>

            <p className="text-gray-400 text-sm max-w-sm font-medium">
              Made By Athletes For Athletes.
              <br />
              Science-backed strength protocols and elite 90-day physical transformations.
            </p>

            {/* Social Icons matching reference */}
            <div className="flex items-center space-x-3 pt-2">
              {/* Twitter / X */}
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow IronForge on Twitter/X"
                className="w-9 h-9 rounded-full bg-white/[0.05] hover:bg-gold/20 hover:text-gold border border-white/[0.08] flex items-center justify-center transition-colors text-gray-300"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow IronForge on Instagram"
                className="w-9 h-9 rounded-full bg-white/[0.05] hover:bg-gold/20 hover:text-gold border border-white/[0.08] flex items-center justify-center transition-colors text-gray-300"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {/* Facebook / Community */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Join IronForge community on Facebook"
                className="w-9 h-9 rounded-full bg-white/[0.05] hover:bg-gold/20 hover:text-gold border border-white/[0.08] flex items-center justify-center transition-colors text-gray-300"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.69 5H18V0h-3.808C10.598 0 9 1.582 9 4.615V8z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Right Column: Newsletter Subscription from Reference Image */}
          <div className="footer-anim-item will-change-transform lg:col-span-6 space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Join The Athletic Cohort
            </h4>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              Receive science-backed strength programming, weekly macro recipes, and advance
              notification of upcoming 90-day coaching cohort openings.
            </p>

            {subscribed ? (
              <div className="bg-gold/15 border border-gold/40 text-gold px-4 py-3 rounded text-sm font-semibold">
                ✓ You are subscribed! Welcome to the IronForge dispatch.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-md">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="bg-[#121215] border border-white/[0.12] focus:border-gold px-4 py-3 rounded text-sm text-white placeholder-gray-500 flex-grow outline-none transition-colors"
                />
                <button
                  ref={magneticBtnRef}
                  type="submit"
                  style={{
                    backgroundColor: '#D4A359',
                    color: '#111111',
                    fontWeight: 600,
                    fontSize: '13.5px',
                  }}
                  className="bg-[#D4A359] hover:bg-[#c2934b] text-[#111111] font-semibold px-6 py-3 rounded text-[13.5px] uppercase tracking-wide transition-colors flex-shrink-0 cursor-pointer will-change-transform"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} IronForge Athletic Club. All rights reserved.</p>

          <div className="flex items-center space-x-6">
            <Link href="/privacy" className="hover:text-gold transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-gold transition-colors">
              Terms of Service
            </Link>
            <Link href="/contact" className="hover:text-gold transition-colors">
              Contact Desk
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
