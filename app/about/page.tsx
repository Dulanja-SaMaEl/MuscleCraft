'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Award, ShieldCheck, Dumbbell, Target, CheckCircle2 } from 'lucide-react';

export default function AboutPage() {
  const coaches = [
    {
      name: 'Elena Rostova',
      role: 'Head Strength & Conditioning Coach',
      spec: 'Competitive Powerlifting & Hypertrophy Periodization',
      bio: 'Former national powerlifter with over 12 years of coaching experience. Specializes in biomechanical optimization, deadlift wedge mechanics, and targeted metabolic recomposition.',
      img: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=600&auto=format&fit=crop',
    },
    {
      name: 'Victor Thorne',
      role: 'Athletic Performance Director',
      spec: 'Olympic Weightlifting & Central Nervous System Recovery',
      bio: 'Certified CSCS and sports physiologist. Oversees athlete programming, injury risk mitigation, and the 90-day physical transformation curriculum.',
      img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#080809]">
      <Navbar />

      <main className="flex-grow pt-32 sm:pt-36 lg:pt-40 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-xs font-bold text-gold uppercase tracking-widest bg-gold/10 px-3 py-1 rounded-full border border-gold/30">
            Our Athletic Ethos
          </span>
          <h1
            style={{
              fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
              fontWeight: 600,
              letterSpacing: '-0.02em',
            }}
            className="text-[32px] sm:text-[40px] lg:text-[44px] text-white tracking-tight leading-tight mt-4 mb-6"
          >
            Where Champions Are Forged
          </h1>
          <p className="text-gray-300 text-base sm:text-lg leading-relaxed font-normal">
            IronForge was founded on a singular conviction: genuine physical transformation requires
            uncompromising coaching standards, elite calibrated equipment, and a culture of relentless effort.
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
              A Rejection of Commercial Gym Gimmicks
            </h2>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              Mainstream commercial gyms design their business model around members who never show up.
              At IronForge, we do the exact opposite. We cap our coaching cohorts to ensure every athlete
              receives meticulous attention, weekly data audits, and tailored physiological periodization.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0" />
                <span className="text-sm font-semibold text-white">100% Calibrated Competition Barbells & Steel Plates</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0" />
                <span className="text-sm font-semibold text-white">Biometric 24/7 Access for Unrestricted Scheduling</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0" />
                <span className="text-sm font-semibold text-white">Direct Coach Oversight & Structured Body Analytics</span>
              </div>
            </div>
          </div>

          <div className="relative rounded-lg overflow-hidden border border-white/10 shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=900&auto=format&fit=crop"
              alt="IronForge Gym Facility"
              className="w-full h-[380px] object-cover filter contrast-125 brightness-90"
            />
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
            <div className="w-12 h-1 bg-gold mx-auto mt-3 rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {coaches.map((c, idx) => (
              <div
                key={idx}
                className="bg-[#121215] border border-white/[0.08] hover:border-gold/40 rounded-lg overflow-hidden transition-all shadow-card-dark"
              >
                <img
                  src={c.img}
                  alt={c.name}
                  className="w-full h-64 object-cover filter contrast-110 brightness-95"
                />
                <div className="p-6 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-gold tracking-widest font-mono">
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
        <div className="bg-[#121215] border border-gold/40 rounded-lg p-10 text-center shadow-gold-glow max-w-3xl mx-auto">
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
            className="px-7 py-3 bg-[#D4A359] hover:bg-[#C2934B] text-[#111111] font-semibold text-[13px] sm:text-[14px] uppercase tracking-wider rounded transition-all duration-300 inline-block shadow-gold-glow"
          >
            Join 90-Day VIP Coaching
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
