import React from 'react';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Award, ShieldCheck, Dumbbell, Target, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us — Coach Adeesha Kumarasingha & MuscleCraft Philosophy',
  description:
    'Learn about MuscleCraft and founder Adeesha Kumarasingha (NVQ Certified, ISO 9001 Instructor, Dip. Sports Science). Discover our mission to build sustainable fitness habits and sculpt strength.',
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'About MuscleCraft — Founder Adeesha Kumarasingha',
    description:
      'Structured training, functional fitness, and personalized accountability with over 7 years of fitness industry leadership.',
    url: 'https://musclecraft.lk/about',
  },
};

export default function AboutPage() {
  const coaches = [
    {
      name: 'Adeesha Kumarasingha',
      role: 'Founder & Head Coach',
      spec: 'NVQ Certified • ISO 9001 Instructor • Dip. Sports Science',
      bio: 'With over 7 years of fitness industry leadership, Adeesha founded MuscleCraft to help clients build sustainable habits and true physical strength. Specializes in custom progressive overload, personalized nutrition protocols, and empathetic accountability.',
      img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop',
    },
    {
      name: 'Elena Rostova',
      role: 'Senior Strength & Conditioning Specialist',
      spec: 'Competitive Powerlifting & Hypertrophy Periodization',
      bio: 'Former national powerlifter with over 12 years of coaching experience. Specializes in deadlift wedge mechanics, kinetic chain alignment, and targeted metabolic recomposition.',
      img: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=600&auto=format&fit=crop',
    },
    {
      name: 'Victor Thorne',
      role: 'Athletic Performance Director',
      spec: 'Functional Conditioning & BurnZone Coach',
      bio: 'Certified CSCS and sports physiologist. Oversees athlete programming, injury risk mitigation, and functional mobility circuits.',
      img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#080809]">
      <Navbar />

      <main className="flex-grow pt-32 sm:pt-36 lg:pt-40 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-xs font-bold text-crimson-400 uppercase tracking-widest bg-crimson-950/40 px-3 py-1 rounded-full border border-crimson-600/30">
            Build Discipline. Sculpt Strength.
          </span>
          <h1
            style={{
              fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
              fontWeight: 600,
              letterSpacing: '-0.02em',
            }}
            className="text-[32px] sm:text-[40px] lg:text-[44px] text-white tracking-tight leading-tight mt-4 mb-6"
          >
            About MuscleCraft
          </h1>
          <p className="text-gray-300 text-base sm:text-lg leading-relaxed font-normal">
            MuscleCraft is a fitness and coaching brand dedicated to helping people improve their strength, fitness, health, and confidence through structured training and personalized guidance.
          </p>
        </div>

        {/* Narrative & Core Pillars */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div className="space-y-6">
            <h2
              style={{
                fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
                fontWeight: 600,
                letterSpacing: '-0.02em',
              }}
              className="text-[26px] sm:text-[30px] text-white tracking-tight leading-tight"
            >
              Our Mission & Core Services
            </h2>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              To help people build sustainable fitness habits, develop physical strength, improve their health,
              and become more disciplined through consistent training and supportive coaching.
            </p>
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-xl bg-[#121216] border border-white/[0.08]">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-crimson-400 flex-shrink-0" />
                  <span className="text-sm font-bold text-white uppercase tracking-wide">MuscleCraft BurnZone</span>
                </div>
                <p className="text-xs text-gray-300 pl-6">Functional fitness, CrossFit-style training, strength and conditioning, fat loss, weight gain, and body toning.</p>
              </div>

              <div className="p-4 rounded-xl bg-[#121216] border border-white/[0.08]">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-crimson-400 flex-shrink-0" />
                  <span className="text-sm font-bold text-white uppercase tracking-wide">90 Days Better Me</span>
                </div>
                <p className="text-xs text-gray-300 pl-6">Online fitness coaching with personalized diet plans, workout guidance, progress monitoring, and coach support.</p>
              </div>

              <div className="p-4 rounded-xl bg-[#121216] border border-white/[0.08]">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-crimson-400 flex-shrink-0" />
                  <span className="text-sm font-bold text-white uppercase tracking-wide">Personalized Coaching</span>
                </div>
                <p className="text-xs text-gray-300 pl-6">Individual guidance, fitness assessments, regular check-ins, and progress-based plan adjustments.</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=900&auto=format&fit=crop"
                alt="MuscleCraft Athletic Facility"
                className="w-full h-[280px] object-cover filter contrast-125 brightness-90"
              />
            </div>

            <div className="p-6 rounded-2xl bg-[#121216]/90 border border-crimson-500/30 shadow-[0_10px_30px_rgba(186,26,26,0.15)]">
              <span className="text-[10px] font-mono font-bold text-crimson-400 uppercase tracking-widest block mb-2">
                Client Management Portal
              </span>
              <h3 className="text-base font-bold text-white mb-2">
                Seamless Coaching, Better Care, Long-Term Results
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                The MuscleCraft portal empowers athletes to log weekly body measurements, upload private progress photos, review customized nutrition & workout plans, and receive direct coach feedback. Our goal is simple: better coaching, better client care, and better long-term results.
              </p>
            </div>
          </div>
        </div>

        {/* Coaching Leadership */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2
              style={{
                fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
                fontWeight: 600,
                letterSpacing: '-0.02em',
              }}
              className="text-[28px] sm:text-[34px] text-white tracking-tight"
            >
              Elite Coaching Leadership
            </h2>
            <div className="w-12 h-1 bg-crimson mx-auto mt-3 rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {coaches.map((c, idx) => (
              <div
                key={idx}
                className="bg-[#121215] border border-white/[0.08] hover:border-crimson/40 rounded-lg overflow-hidden transition-all shadow-card-dark"
              >
                <img
                  src={c.img}
                  alt={c.name}
                  className="w-full h-64 object-cover filter contrast-110 brightness-95"
                />
                <div className="p-6 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-crimson-400 tracking-widest font-mono">
                    {c.spec}
                  </span>
                  <h3 className="text-xl font-bold text-white">{c.name}</h3>
                  <p className="text-xs text-gray-400 font-semibold">{c.role}</p>
                  <p className="text-xs text-gray-300 leading-relaxed pt-2">{c.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Banner */}
        <div className="bg-[#121215] border border-crimson-600/40 rounded-lg p-10 text-center shadow-crimson-glow max-w-3xl mx-auto">
          <h3
            style={{
              fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
              fontWeight: 600,
              letterSpacing: '-0.02em',
            }}
            className="text-[24px] sm:text-[28px] text-white mb-3"
          >
            Ready to train with elite athletes?
          </h3>
          <p className="text-xs sm:text-sm text-gray-300 mb-6 max-w-lg mx-auto">
            Enroll today via manual bank transfer and secure your spot in our upcoming 90-day coaching cohort.
          </p>
          <Link
            href="/checkout?tier=coaching_90"
            className="px-7 py-3 bg-[#BA1A1A] hover:bg-[#DC2626] text-white font-semibold text-[13px] sm:text-[14px] uppercase tracking-wider rounded transition-all duration-300 inline-block shadow-crimson-glow"
          >
            Join 90-Day VIP Coaching
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
