'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Shield,
  Dumbbell,
  UserCheck,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Sparkles,
  MessageCircle,
  HelpCircle,
  Phone,
  ArrowRight,
  Flame,
  Building,
} from 'lucide-react';
import { useAuth } from '@/lib/context/auth-context';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function Navbar() {
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const pillRef = useRef<HTMLDivElement | null>(null);
  const headerContainerRef = useRef<HTMLDivElement | null>(null);

  // Lock background scroll when mobile slide-over sheet is open
  useEffect(() => {
    if (mobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setMobileMenuOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [mobileMenuOpen]);

  useGSAP(
    () => {
      const pill = pillRef.current;
      if (!pill) return;

      // Entrance animation: pill drops in smoothly with luxury ease
      gsap.fromTo(
        pill,
        { y: -30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'expo.out',
          delay: 0.2,
        }
      );

      // Micro-physics: Subtle scale & sticky state latching for 60fps performance
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
              scale: scrolled ? 0.97 : 1,
              paddingTop: scrolled ? '6px' : '10px',
              paddingBottom: scrolled ? '6px' : '10px',
              backgroundColor: scrolled ? 'rgba(10, 10, 14, 0.92)' : 'rgba(14, 14, 18, 0.78)',
              boxShadow: scrolled
                ? '0 20px 40px -15px rgba(0, 0, 0, 0.85), 0 0 25px rgba(186, 26, 26, 0.12)'
                : '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
              duration: 0.3,
              overwrite: 'auto',
            });
          }

          // Subtle auto-hide on fast downward scroll, reveal instantly on upward scroll
          const shouldHide = self.direction === 1 && scrollPos > 240;
          if (shouldHide !== wasHidden) {
            wasHidden = shouldHide;
            gsap.to(pill, {
              y: shouldHide ? -90 : 0,
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

  // Core High-Conversion Primary Nav Links
  const primaryLinks = [
    { label: 'Programs', href: '/memberships', sectionId: 'slide-elevate' },
    { label: 'Pricing', href: '/pricing', sectionId: 'slide-pricing' },
    { label: 'Reviews', href: '/#slide-reviews', sectionId: 'slide-reviews' },
    { label: 'About', href: '/about', sectionId: 'slide-about' },
  ];

  // Secondary Links housed inside luxury "More ▾" dropdown
  const secondaryLinks = [
    {
      label: 'Offerings & Facility',
      href: '/#slide-offer',
      sectionId: 'slide-offer',
      desc: 'Free weights, cables, cardio & biomechanics',
      icon: Dumbbell,
    },
    {
      label: 'Frequently Asked Questions',
      href: '/faq',
      sectionId: 'slide-faq',
      desc: 'Membership rules, trial workouts & policies',
      icon: HelpCircle,
    },
    {
      label: 'Contact & Location',
      href: '/contact',
      sectionId: 'slide-contact',
      desc: 'Floor address, direct phone & operating hours',
      icon: Phone,
    },
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, sectionId?: string) => {
    if (pathname === '/' && sectionId) {
      const el = document.getElementById(sectionId);
      if (el) {
        e.preventDefault();
        window.dispatchEvent(
          new CustomEvent('ironforge:scroll-to', { detail: { targetId: sectionId } })
        );
        setMobileMenuOpen(false);
        setDesktopDropdownOpen(false);
      }
    } else {
      setMobileMenuOpen(false);
      setDesktopDropdownOpen(false);
    }
  };

  const handleDropdownEnter = () => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setDesktopDropdownOpen(true);
  };

  const handleDropdownLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setDesktopDropdownOpen(false);
    }, 150);
  };

  return (
    <div ref={headerContainerRef} className="relative z-[100]">
      {/* ── FLOATING PILL NAVBAR: Refined, compact luxury capsule ── */}
      <div className="fixed top-3.5 sm:top-5 left-0 right-0 z-[100] flex justify-center px-3 sm:px-6 pointer-events-none">
        <header
          ref={pillRef}
          style={{
            backdropFilter: 'blur(20px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
            backgroundColor: 'rgba(14, 14, 18, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 12px 35px -10px rgba(0, 0, 0, 0.75)',
          }}
          className="pointer-events-auto z-[101] w-full max-w-4xl rounded-full px-3.5 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between transition-all duration-300 will-change-transform"
        >
          {/* Brand Monogram & Wordmark */}
          <Link
            href="/"
            onClick={() => {
              if (pathname === '/') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="flex items-center gap-2.5 group focus-visible:ring-2 focus-visible:ring-crimson-500 rounded-full flex-shrink-0"
            aria-label="MuscleCraft Home"
          >
            <div className="w-8 h-8 rounded-full border border-crimson-500/50 flex items-center justify-center bg-black/80 group-hover:border-crimson-400 group-hover:scale-105 transition-all shadow-[0_0_12px_rgba(186,26,26,0.35)] overflow-hidden p-0.5">
              <Image
                src="/images/musclecraft-emblem.png"
                alt="MuscleCraft Emblem"
                width={28}
                height={28}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-wider text-white text-sm sm:text-base leading-tight uppercase font-sans">
                Muscle<span className="text-crimson-500">Craft</span>
              </span>
              <span className="text-[7.5px] tracking-[0.18em] text-gray-400 uppercase hidden xl:block font-mono leading-none">
                Build Discipline. Sculpt Strength.
              </span>
            </div>
          </Link>

          {/* Desktop Primary Navigation Links (Focused, Non-Crowded, lg:flex) */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2" aria-label="Main Navigation">
            {primaryLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.href, link.sectionId)}
                  className={`text-xs xl:text-[13px] font-medium tracking-wide px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                    isActive
                      ? 'text-white bg-white/[0.08] font-semibold'
                      : 'text-gray-300 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* "More ▾" Interactive Dropdown */}
            <div
              className="relative"
              onMouseEnter={handleDropdownEnter}
              onMouseLeave={handleDropdownLeave}
            >
              <button
                type="button"
                onClick={() => setDesktopDropdownOpen(!desktopDropdownOpen)}
                className={`text-xs xl:text-[13px] font-medium tracking-wide px-3 py-1.5 rounded-full transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                  desktopDropdownOpen
                    ? 'text-white bg-white/[0.08]'
                    : 'text-gray-300 hover:text-white hover:bg-white/[0.04]'
                }`}
                aria-expanded={desktopDropdownOpen}
                aria-haspopup="true"
              >
                <span>More</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    desktopDropdownOpen ? 'rotate-180 text-crimson-400' : 'text-gray-400'
                  }`}
                />
              </button>

              {/* Dropdown Floating Popover */}
              {desktopDropdownOpen && (
                <div
                  style={{
                    backdropFilter: 'blur(24px) saturate(1.4)',
                    WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
                    backgroundColor: 'rgba(12, 12, 16, 0.96)',
                    boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 20px rgba(186, 26, 26, 0.15)',
                  }}
                  className="absolute top-full right-0 mt-2 w-72 rounded-2xl border border-white/10 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-gray-500 border-b border-white/[0.06] mb-1">
                    Facility & Guidance
                  </div>
                  {secondaryLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={(e) => handleLinkClick(e, item.href, item.sectionId)}
                        className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/[0.06] group transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-crimson-950/60 border border-crimson-500/30 flex items-center justify-center flex-shrink-0 group-hover:border-crimson-400 group-hover:bg-crimson-900/50 transition-colors">
                          <Icon className="w-4 h-4 text-crimson-400 group-hover:text-crimson-300" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-gray-200 group-hover:text-white transition-colors">
                            {item.label}
                          </span>
                          <span className="text-[11px] text-gray-400 leading-snug line-clamp-1">
                            {item.desc}
                          </span>
                        </div>
                      </Link>
                    );
                  })}

                  <div className="mt-1 pt-1.5 border-t border-white/[0.06]">
                    <a
                      href="https://wa.me/94770000000"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/30 hover:bg-emerald-950/60 border border-emerald-500/20 group transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-semibold text-emerald-300 group-hover:text-emerald-200">
                          WhatsApp Coach Line
                        </span>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Right Action / CTA Area */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {currentUser ? (
              <div className="flex items-center space-x-2">
                {currentUser.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="flex text-xs bg-crimson-950/80 text-crimson-300 border border-crimson-600/60 px-3.5 py-1.5 rounded-full hover:bg-crimson-900 transition-colors font-semibold items-center gap-1.5 whitespace-nowrap shadow-[0_0_10px_rgba(186,26,26,0.3)]"
                  >
                    <Shield className="w-3.5 h-3.5 text-crimson-400" />
                    <span className="hidden sm:inline">Admin Panel</span>
                    <span className="sm:hidden">Admin</span>
                  </Link>
                )}
                {currentUser.role === 'instructor' && (
                  <Link
                    href="/instructor"
                    className="flex text-xs bg-blue-950/80 text-blue-300 border border-blue-700/60 px-3.5 py-1.5 rounded-full hover:bg-blue-900 transition-colors font-semibold items-center gap-1.5 whitespace-nowrap shadow-[0_0_10px_rgba(24,119,242,0.3)]"
                  >
                    <Dumbbell className="w-3.5 h-3.5 text-blue-400" />
                    <span className="hidden sm:inline">Coach Portal</span>
                    <span className="sm:hidden">Coach</span>
                  </Link>
                )}
                {currentUser.role === 'client' && (
                  <Link
                    href="/client"
                    className="font-semibold text-xs sm:text-[13px] bg-crimson-600 hover:bg-crimson-500 text-white px-3.5 sm:px-4 py-1.5 rounded-full transition-all duration-200 shadow-md hover:shadow-crimson-glow flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Client Portal</span>
                    <span className="sm:hidden">Portal</span>
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => logout()}
                  className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  href="/login"
                  className="text-xs font-medium text-gray-300 hover:text-white px-2.5 sm:px-3 py-1.5 rounded-full hover:bg-white/[0.05] transition-colors whitespace-nowrap"
                >
                  Login
                </Link>
                <Link
                  href="/checkout"
                  className="font-semibold text-xs sm:text-[13px] bg-crimson-600 hover:bg-crimson-500 text-white px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all duration-200 shadow-md hover:shadow-crimson-glow cursor-pointer whitespace-nowrap flex items-center gap-1"
                >
                  <span>Join Now</span>
                  <ArrowRight className="w-3 h-3 hidden sm:inline" />
                </Link>
              </div>
            )}

            {/* Mobile / Tablet Menu Trigger (Visible on screens < 1024px) */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden text-gray-300 hover:text-white p-2 rounded-full hover:bg-white/10 focus:outline-none transition-colors"
              aria-label="Open mobile navigation"
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>
      </div>

      {/* ── LUXURY MOBILE & TABLET SLIDE-OVER SHEET (lg:hidden) ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden animate-in fade-in duration-200">
          {/* Backdrop Blur Overlay */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
            aria-hidden="true"
          />

          {/* Slide-Over Drawer Sheet */}
          <aside
            style={{
              backgroundColor: '#0a0a0e',
              borderLeft: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.85)',
            }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-sm sm:max-w-md p-6 flex flex-col justify-between overflow-y-auto z-50 animate-in slide-in-from-right duration-250 ease-out"
            aria-label="Mobile Navigation Menu"
          >
            {/* Sheet Top Bar: Brand & Close Button */}
            <div className="flex items-center justify-between pb-5 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full border border-crimson-500/50 flex items-center justify-center bg-black/80 p-0.5 shadow-[0_0_12px_rgba(186,26,26,0.4)]">
                  <Image
                    src="/images/musclecraft-emblem.png"
                    alt="MuscleCraft Emblem"
                    width={26}
                    height={26}
                    className="object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold tracking-wider text-white text-base uppercase font-sans">
                    Muscle<span className="text-crimson-500">Craft</span>
                  </span>
                  <span className="text-[7.5px] tracking-[0.16em] text-gray-400 uppercase font-mono">
                    Build Discipline. Sculpt Strength.
                  </span>
                </div>
              </div>

              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-10 h-10 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-gray-300 hover:text-white flex items-center justify-center transition-colors focus:outline-none"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Categorized Navigation Body */}
            <div className="flex-1 py-6 space-y-6">
              {/* Category 1: High-Priority Pathways */}
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-crimson-400 font-semibold mb-2">
                  Membership & Training
                </div>
                <div className="space-y-1">
                  <Link
                    href="/memberships"
                    onClick={(e) => handleLinkClick(e, '/memberships', 'slide-elevate')}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.05] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-crimson-950/60 border border-crimson-500/30 flex items-center justify-center text-crimson-400">
                        <Dumbbell className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white group-hover:text-crimson-400 transition-colors">
                          Programs & Training
                        </div>
                        <div className="text-xs text-gray-400">Personalized workout protocols</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                  </Link>

                  <Link
                    href="/pricing"
                    onClick={(e) => handleLinkClick(e, '/pricing', 'slide-pricing')}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.05] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-crimson-950/60 border border-crimson-500/30 flex items-center justify-center text-crimson-400">
                        <Flame className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white group-hover:text-crimson-400 transition-colors">
                          Membership Packages & Rates
                        </div>
                        <div className="text-xs text-gray-400">Sole, couple & coaching tiers in LKR</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                  </Link>

                  <Link
                    href="/#slide-reviews"
                    onClick={(e) => handleLinkClick(e, '/#slide-reviews', 'slide-reviews')}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.05] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-crimson-950/60 border border-crimson-500/30 flex items-center justify-center text-crimson-400">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white group-hover:text-crimson-400 transition-colors">
                          Athlete Transformations
                        </div>
                        <div className="text-xs text-gray-400">Verified recomposition reviews</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                  </Link>
                </div>
              </div>

              {/* Category 2: Gym & Coach Information */}
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400 font-semibold mb-2">
                  Facility & Story
                </div>
                <div className="space-y-1">
                  <Link
                    href="/about"
                    onClick={(e) => handleLinkClick(e, '/about', 'slide-about')}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.05] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-gray-300">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div className="text-sm font-semibold text-gray-200 group-hover:text-white">
                        About Coach Adeesha
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                  </Link>

                  <Link
                    href="/#slide-offer"
                    onClick={(e) => handleLinkClick(e, '/#slide-offer', 'slide-offer')}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.05] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-gray-300">
                        <Building className="w-4 h-4" />
                      </div>
                      <div className="text-sm font-semibold text-gray-200 group-hover:text-white">
                        Equipment & Facility Features
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                  </Link>

                  <Link
                    href="/faq"
                    onClick={(e) => handleLinkClick(e, '/faq', 'slide-faq')}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.05] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-gray-300">
                        <HelpCircle className="w-4 h-4" />
                      </div>
                      <div className="text-sm font-semibold text-gray-200 group-hover:text-white">
                        Frequently Asked Questions
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                  </Link>

                  <Link
                    href="/contact"
                    onClick={(e) => handleLinkClick(e, '/contact', 'slide-contact')}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.05] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-gray-300">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div className="text-sm font-semibold text-gray-200 group-hover:text-white">
                        Contact Desk & Location
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                  </Link>
                </div>
              </div>

              {/* Category 3: WhatsApp Concierge */}
              <div className="pt-2">
                <a
                  href="https://wa.me/94770000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-emerald-400" />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white">Direct WhatsApp Concierge</span>
                      <span className="text-[11px] text-emerald-400/80">Message Head Coach Adeesha directly</span>
                    </div>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                </a>
              </div>
            </div>

            {/* Bottom Actions & User Auth */}
            <div className="pt-4 border-t border-white/[0.08] flex flex-col gap-2.5">
              {currentUser ? (
                <div className="space-y-2">
                  {currentUser.role === 'client' && (
                    <Link
                      href="/client"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-3 bg-crimson-600 hover:bg-crimson-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(186,26,26,0.4)]"
                    >
                      <UserCheck className="w-4 h-4" /> Go to Client Dashboard
                    </Link>
                  )}
                  {currentUser.role === 'admin' && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-3 bg-crimson-950 border border-crimson-600/60 text-crimson-300 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                      <Shield className="w-4 h-4" /> Admin Command Center
                    </Link>
                  )}
                  {currentUser.role === 'instructor' && (
                    <Link
                      href="/instructor"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-3 bg-blue-950 border border-blue-600/60 text-blue-300 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                      <Dumbbell className="w-4 h-4" /> Coach Workspace
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-2.5 bg-white/[0.05] hover:bg-rose-950/40 border border-white/10 hover:border-rose-500/30 text-gray-300 hover:text-rose-300 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Log Out ({currentUser.name})
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/checkout"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-3.5 bg-crimson-600 hover:bg-crimson-500 text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all shadow-[0_0_25px_rgba(186,26,26,0.5)] flex items-center justify-center gap-2 text-center"
                  >
                    <span>Join MuscleCraft Today</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-3 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white font-semibold text-xs rounded-xl transition-colors text-center block"
                  >
                    Athlete Member Sign In
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
