'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Dumbbell, UserCheck, Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/context/auth-context';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function Navbar() {
  const pathname = usePathname();
  const { currentUser, switchPersona } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pillRef = useRef<HTMLDivElement | null>(null);
  const headerContainerRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const pill = pillRef.current;
      if (!pill) return;

      // Initial entrance: nav drops in
      gsap.fromTo(
        pill,
        { y: -30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'expo.out',
          delay: 0.25,
        }
      );

        // Shrink slightly on scroll & subtle sticky physics with state latching for 60fps performance
        let wasScrolled = false;
        let wasHidden = false;

        ScrollTrigger.create({
          start: 'top top',
          onUpdate: (self) => {
            if (!pill) return;
            const scrollPos = self.scroll();
            const scrolled = scrollPos > 50;

            if (scrolled !== wasScrolled) {
              wasScrolled = scrolled;
              gsap.to(pill, {
                scale: scrolled ? 0.96 : 1,
                paddingTop: scrolled ? '8px' : '12px',
                paddingBottom: scrolled ? '8px' : '12px',
                backgroundColor: scrolled ? 'rgba(12, 12, 16, 0.88)' : 'rgba(14, 14, 18, 0.72)',
                boxShadow: scrolled
                  ? '0 20px 40px -15px rgba(0, 0, 0, 0.8), 0 0 20px rgba(212, 163, 89, 0.1)'
                  : '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
                duration: 0.3,
                overwrite: 'auto',
              });
            }

            // Hide on fast scroll down past 220px, return on scroll up
            const shouldHide = self.direction === 1 && scrollPos > 220;
            if (shouldHide !== wasHidden) {
              wasHidden = shouldHide;
              gsap.to(pill, {
                y: shouldHide ? -80 : 0,
                opacity: shouldHide ? 0 : 1,
                duration: 0.3,
                ease: 'power2.out',
                overwrite: 'auto',
              });
            }
          },
        });
    },
    { scope: headerContainerRef }
  );

  const navLinks = [
    { label: 'Home', href: '/', sectionId: 'slide-hero' },
    { label: 'Coaching Program', href: '/memberships', sectionId: 'slide-elevate' },
    { label: 'Offerings', href: '/#slide-offer', sectionId: 'slide-offer' },
    { label: 'Pricing', href: '/pricing', sectionId: 'slide-pricing' },
    { label: 'About', href: '/about', sectionId: 'slide-about' },
    { label: 'Reviews', href: '/#slide-reviews', sectionId: 'slide-reviews' },
    { label: 'Contact', href: '/contact', sectionId: 'slide-contact' },
    { label: 'FAQs', href: '/faq', sectionId: 'slide-faq' },
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, link: (typeof navLinks)[0]) => {
    if (pathname === '/') {
      const el = document.getElementById(link.sectionId);
      if (el) {
        e.preventDefault();
        window.dispatchEvent(
          new CustomEvent('ironforge:scroll-to', { detail: { targetId: link.sectionId } })
        );
        setMobileMenuOpen(false);
      }
    }
  };

  return (
    <div ref={headerContainerRef} className="relative z-50">
      {/* ── Preserved Live Persona Quick Switcher Top Bar ── */}
      <div className="relative z-50 bg-[#0d0d11]/95 border-b border-white/[0.08] px-3 sm:px-4 py-1 text-xs text-gray-400">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="inline-block w-2 h-2 rounded-full bg-[#D4A359] animate-pulse" />
            <span className="font-medium text-gray-300 hidden sm:inline">Live Persona:</span>
            <span className="text-white font-semibold">
              {currentUser ? currentUser.name : 'Guest Visitor'}
            </span>
            {currentUser?.tier === 'coaching_90' && (
              <span className="bg-[#D4A359]/20 text-[#D4A359] text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#D4A359]/30">
                90-DAY VIP
              </span>
            )}
            {currentUser?.tier === 'monthly' && (
              <span className="bg-gray-800 text-gray-300 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded">
                MONTHLY
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-gray-400 hidden md:inline text-[11px]">Role:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => switchPersona('usr_client_90')}
                className={`px-2 py-0.5 rounded text-[10.5px] sm:text-[11px] transition-colors ${
                  currentUser?.id === 'usr_client_90'
                    ? 'bg-[#D4A359] text-black font-semibold'
                    : 'bg-[#18181f] hover:bg-[#202029] text-gray-300'
                }`}
                title="Marcus Vance (90-Day VIP Coaching)"
              >
                90-Day
              </button>
              <button
                onClick={() => switchPersona('usr_client_month')}
                className={`px-2 py-0.5 rounded text-[10.5px] sm:text-[11px] transition-colors ${
                  currentUser?.id === 'usr_client_month'
                    ? 'bg-[#D4A359] text-black font-semibold'
                    : 'bg-[#18181f] hover:bg-[#202029] text-gray-300'
                }`}
                title="Sarah Jenkins (Monthly Gym Member)"
              >
                Monthly
              </button>
              <button
                onClick={() => switchPersona('usr_inst_1')}
                className={`px-2 py-0.5 rounded text-[10.5px] sm:text-[11px] transition-colors ${
                  currentUser?.id === 'usr_inst_1'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-[#18181f] hover:bg-[#202029] text-gray-300'
                }`}
                title="Coach Elena Rostova"
              >
                Coach
              </button>
              <button
                onClick={() => switchPersona('usr_admin_1')}
                className={`px-2 py-0.5 rounded text-[10.5px] sm:text-[11px] transition-colors ${
                  currentUser?.id === 'usr_admin_1'
                    ? 'bg-red-600 text-white font-semibold'
                    : 'bg-[#18181f] hover:bg-[#202029] text-gray-300'
                }`}
                title="Victor Thorne (Platform Admin)"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── FLOATING PILL NAVBAR: Centered, blur(18px) saturate(1.4), 1px border rgba(255,255,255,.12), Gold CTA ── */}
      <div className="fixed top-10 sm:top-12 left-0 right-0 z-40 flex justify-center px-3 sm:px-6 pointer-events-none">
        <header
          ref={pillRef}
          style={{
            backdropFilter: 'blur(18px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
            backgroundColor: 'rgba(14, 14, 18, 0.72)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 10px 30px -10px rgba(0, 0, 0, 0.6)',
          }}
          className="pointer-events-auto w-full max-w-5xl rounded-full px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between transition-all duration-300 will-change-transform"
        >
          {/* Brand Monogram */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus-visible:ring-2 focus-visible:ring-gold rounded-full"
          >
            <div className="w-8 h-8 rounded-full border border-gold/60 flex items-center justify-center bg-black/60 group-hover:border-gold transition-colors">
              <svg
                viewBox="0 0 32 32"
                fill="none"
                className="w-4 h-4 text-gold"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 6V26M24 6V26M8 16H24M5 8H11M21 8H27M5 24H11M21 24H27"
                  stroke="#D4A359"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-wider text-white text-sm sm:text-base leading-tight uppercase font-sans">
                Iron<span className="text-gold">Forge</span>
              </span>
              <span className="text-[8px] tracking-[0.2em] text-gray-400 uppercase hidden sm:block">
                Athletic Club
              </span>
            </div>
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center space-x-5 lg:space-x-6" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link)}
                  className={`text-xs lg:text-[13px] font-medium tracking-wide transition-colors ${
                    isActive ? 'text-gold font-semibold' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action / Gold CTA */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser ? (
              <div className="flex items-center space-x-2">
                {currentUser.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="hidden sm:flex text-xs bg-red-950/80 text-red-300 border border-red-700/60 px-2.5 py-1 rounded-full hover:bg-red-900 transition-colors font-medium items-center gap-1"
                  >
                    <Shield className="w-3 h-3 text-red-400" />
                    Admin
                  </Link>
                )}
                {currentUser.role === 'instructor' && (
                  <Link
                    href="/instructor"
                    className="hidden sm:flex text-xs bg-blue-950/80 text-blue-300 border border-blue-700/60 px-2.5 py-1 rounded-full hover:bg-blue-900 transition-colors font-medium items-center gap-1"
                  >
                    <Dumbbell className="w-3 h-3 text-blue-400" />
                    Coach
                  </Link>
                )}
                {currentUser.role === 'client' && (
                  <Link
                    href="/client"
                    className="hidden sm:flex text-xs bg-surface border border-gold/40 text-gold px-2.5 py-1 rounded-full hover:bg-surface-50 transition-colors font-medium items-center gap-1"
                  >
                    <UserCheck className="w-3 h-3" />
                    Portal
                  </Link>
                )}

                <Link
                  href="/login"
                  style={{
                    backgroundColor: '#D4A359',
                    color: '#111111',
                    fontWeight: 600,
                    fontSize: '13px',
                  }}
                  className="font-semibold text-xs sm:text-[13px] bg-[#D4A359] hover:bg-[#C2934B] text-[#111111] px-4 py-1.5 sm:py-2 rounded-full transition-all duration-200 shadow-md hover:shadow-gold-glow cursor-pointer"
                >
                  Account
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="hidden sm:inline-block text-xs font-medium text-gray-300 hover:text-white px-2 py-1 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/checkout"
                  style={{
                    backgroundColor: '#D4A359',
                    color: '#111111',
                    fontWeight: 600,
                    fontSize: '13px',
                  }}
                  className="font-semibold text-xs sm:text-[13px] bg-[#D4A359] hover:bg-[#C2934B] text-[#111111] px-4 sm:px-5 py-1.5 sm:py-2 rounded-full transition-all duration-200 shadow-md hover:shadow-gold-glow cursor-pointer"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-300 hover:text-white p-1 rounded-full focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>
      </div>

      {/* ── Mobile Liquid-Glass Navigation Overlay ── */}
      {mobileMenuOpen && (
        <div
          style={{
            backdropFilter: 'blur(20px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
            backgroundColor: 'rgba(10, 10, 14, 0.94)',
          }}
          className="fixed inset-x-4 top-24 z-50 rounded-3xl border border-white/10 p-6 shadow-2xl flex flex-col space-y-3 md:hidden animate-in fade-in slide-in-from-top-4 duration-200"
        >
          <div className="flex flex-col space-y-2 border-b border-white/[0.08] pb-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link)}
                className="text-gray-200 hover:text-gold text-base py-1 font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            {currentUser?.role === 'client' && (
              <Link
                href="/client"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 bg-surface border border-gold/40 text-gold rounded-full font-medium text-xs"
              >
                Client Dashboard
              </Link>
            )}
            {currentUser?.role === 'instructor' && (
              <Link
                href="/instructor"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 bg-blue-900/60 border border-blue-500 text-blue-200 rounded-full font-medium text-xs"
              >
                Instructor Workspace
              </Link>
            )}
            {currentUser?.role === 'admin' && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 bg-red-900/60 border border-red-500 text-red-200 rounded-full font-medium text-xs"
              >
                Admin Command Center
              </Link>
            )}

            <Link
              href="/checkout"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 bg-[#D4A359] hover:bg-[#C2934B] text-[#111111] font-semibold text-xs rounded-full transition-colors"
            >
              Join IronForge
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
