'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/context/auth-context';
import { UserCheck, Shield, Dumbbell, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { switchPersona, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const personas = [
    {
      id: 'usr_client_90',
      name: 'Marcus Vance',
      role: '90-Day VIP Member',
      email: 'client_90@ironforge.com',
      badgeColor: 'bg-gold/20 text-gold border-gold/30',
      icon: UserCheck,
      dest: '/client',
    },
    {
      id: 'usr_client_month',
      name: 'Sarah Jenkins',
      role: 'Monthly Gym Member',
      email: 'client_monthly@ironforge.com',
      badgeColor: 'bg-gray-800 text-gray-300 border-gray-700',
      icon: UserCheck,
      dest: '/client',
    },
    {
      id: 'usr_inst_1',
      name: 'Elena Rostova',
      role: 'Head Coach / Instructor',
      email: 'instructor@ironforge.com',
      badgeColor: 'bg-blue-900/40 text-blue-300 border-blue-700/50',
      icon: Dumbbell,
      dest: '/instructor',
    },
    {
      id: 'usr_admin_1',
      name: 'Victor Thorne',
      role: 'Platform Administrator',
      email: 'admin@ironforge.com',
      badgeColor: 'bg-red-900/40 text-red-300 border-red-700/50',
      icon: Shield,
      dest: '/admin',
    },
  ];

  const handleSelectPersona = async (p: (typeof personas)[0]) => {
    await switchPersona(p.id);
    router.push(p.dest);
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const success = await login(email);
    if (success) {
      if (email.includes('admin')) router.push('/admin');
      else if (email.includes('instructor')) router.push('/instructor');
      else router.push('/client');
    } else {
      setErrorMsg('No user account found with that email. Try clicking one of the demo accounts.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#080809]">
      <Navbar />

      <main className="flex-grow flex items-center justify-center pt-32 sm:pt-36 lg:pt-40 pb-16 sm:pb-24 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="w-12 h-12 border border-gold/60 rounded flex items-center justify-center bg-black/40 mx-auto mb-4">
              <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7 text-gold">
                <path
                  d="M8 6V26M24 6V26M8 16H24M5 8H11M21 8H27M5 24H11M21 24H27"
                  stroke="#E5A93C"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1
              style={{
                fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
                fontWeight: 600,
                letterSpacing: '-0.02em',
              }}
              className="text-[28px] sm:text-[32px] text-white tracking-tight mt-2 leading-tight"
            >
              Sign In to IronForge
            </h1>
            <p className="text-xs text-gray-400 mt-2 font-normal">
              Access your personalized coaching portal, workout videos, and membership records.
            </p>
          </div>

          {/* Quick Demo Access Bar */}
          <div className="bg-[#121215] border border-gold/30 rounded-lg p-5 space-y-3">
            <span className="text-[11px] font-bold text-gold uppercase tracking-wider block">
              ⚡ Instant Reviewer Fast-Pass:
            </span>
            <div className="grid grid-cols-1 gap-2">
              {personas.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPersona(p)}
                    className="w-full flex items-center justify-between p-2.5 rounded bg-[#18181d] hover:bg-[#202028] border border-white/[0.06] hover:border-gold/40 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded bg-black/60 flex items-center justify-center text-gray-300 group-hover:text-gold">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-gold transition-colors">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-gray-400">{p.email}</div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${p.badgeColor}`}>
                      {p.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Standard Login Form */}
          <form
            onSubmit={handleManualLogin}
            className="bg-[#121215] border border-white/[0.08] p-6 rounded-lg space-y-4"
          >
            {errorMsg && (
              <div className="p-3 bg-red-950/70 border border-red-800 text-red-200 text-xs rounded">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wide mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="athlete@example.com"
                className="w-full bg-[#18181d] border border-white/[0.1] focus:border-gold px-3.5 py-2.5 rounded text-sm text-white placeholder-gray-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wide mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#18181d] border border-white/[0.1] focus:border-gold px-3.5 py-2.5 rounded text-sm text-white placeholder-gray-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#D4A359] hover:bg-[#C2934B] text-[#111111] font-semibold text-[13px] sm:text-[14px] uppercase tracking-wide rounded transition-all duration-200 shadow-md hover:shadow-gold-glow flex items-center justify-center gap-2"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2">
              <Link href="/checkout" className="text-xs text-gold hover:underline">
                Need to enroll? Submit bank transfer here →
              </Link>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
