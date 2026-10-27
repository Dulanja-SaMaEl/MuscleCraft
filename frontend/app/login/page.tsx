'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/context/auth-context';
import { UserCheck, Shield, Dumbbell, ArrowRight, AlertCircle, Clock } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');
  const { switchPersona, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const personas = [
    {
      id: 'usr_inst_adeesha',
      name: 'Coach Adeesha',
      role: 'Founder & Head Coach',
      email: 'adeesha@musclecraft.lk',
      badgeColor: 'bg-crimson-900/50 text-crimson-300 border-crimson-600/60',
      icon: Dumbbell,
      dest: '/instructor',
    },
    {
      id: 'usr_client_90',
      name: 'Marcus Vance',
      role: '90-Day VIP Member (Active)',
      email: 'client_90@musclecraft.lk',
      badgeColor: 'bg-crimson-950/60 text-crimson-300 border-crimson-600/40',
      icon: UserCheck,
      dest: '/client',
    },
    {
      id: 'usr_client_chamari',
      name: 'Chamari Atapattu',
      role: 'Sole 1M (Expiring in 3d - Notice)',
      email: 'chamari.a@outlook.com',
      badgeColor: 'bg-yellow-950/60 text-yellow-300 border-yellow-600/40',
      icon: Clock,
      dest: '/client',
    },
    {
      id: 'usr_client_expired_sole',
      name: 'Suresh Fernando',
      role: 'Sole 1M (Expired 4d ago - Alert)',
      email: 'suresh.f@gmail.com',
      badgeColor: 'bg-rose-950/60 text-rose-300 border-rose-600/40',
      icon: AlertCircle,
      dest: '/client',
    },
    {
      id: 'usr_client_expired_90',
      name: 'Kamal Gunaratne',
      role: '90-Day (Expired - Auto Logout)',
      email: 'kamal.expired@musclecraft.lk',
      badgeColor: 'bg-amber-950/60 text-amber-300 border-amber-600/40',
      icon: UserCheck,
      dest: '/client',
    },
    {
      id: 'usr_admin_1',
      name: 'Victor Thorne',
      role: 'Platform Administrator',
      email: 'admin@musclecraft.lk',
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
    <div className="max-w-md w-full space-y-8">
      <div className="text-center">
        <div className="w-14 h-14 border border-crimson-600/40 rounded-full flex items-center justify-center bg-black/60 mx-auto mb-4 p-2 shadow-crimson-glow">
          <Image
            src="/images/musclecraft-emblem.png"
            alt="MuscleCraft Emblem"
            width={36}
            height={36}
            className="object-contain filter drop-shadow-[0_0_6px_rgba(220,38,38,0.6)]"
          />
        </div>
        <h1
          style={{
            fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}
          className="text-[28px] sm:text-[32px] text-white tracking-tight mt-2 leading-tight uppercase"
        >
          Sign In to Muscle<span className="text-crimson-500">Craft</span>
        </h1>
        <p className="text-xs text-gray-400 mt-2 font-normal">
          Access your personalized coaching portal, workout videos, and membership records.
        </p>
      </div>

      {/* Notice Banner: 90-Day Coaching Auto-Logout */}
      {reason === 'expired_90day' && (
        <div className="p-4 rounded-2xl bg-amber-950/50 border-2 border-amber-500/60 text-xs text-amber-200 space-y-2.5 shadow-lg animate-in fade-in duration-300">
          <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>90-Day Coaching Access Concluded</span>
          </div>
          <p className="text-gray-300 text-[11.5px] leading-relaxed">
            Your 90-Day Better Me online coaching cycle has ended and your session was closed in accordance with cohort access policy. To re-enroll for a new transformation cycle or discuss continuation options, contact Coach Adeesha.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <a
              href="https://wa.me/94771234567?text=Hi%20Coach%20Adeesha%2C%20my%2090-Day%20coaching%20period%20has%20concluded.%20I%20would%20like%20to%20discuss%20my%20renewal%20options."
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              WhatsApp Coach Adeesha
            </a>
            <Link
              href="/checkout?tier=coaching_90"
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Re-enroll Online (Rs. 8,000)
            </Link>
          </div>
        </div>
      )}

      {/* Quick Demo Access Bar */}
      <div className="bg-[#121215] border border-crimson-900/40 rounded-lg p-5 space-y-3">
        <span className="text-[11px] font-bold text-crimson-400 uppercase tracking-wider block">
          ⚡ Instant Reviewer Fast-Pass:
        </span>
        <div className="grid grid-cols-1 gap-2">
          {personas.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPersona(p)}
                className="w-full flex items-center justify-between p-2.5 rounded bg-[#18181d] hover:bg-[#202028] border border-white/[0.06] hover:border-crimson/50 text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded bg-black/60 flex items-center justify-center text-gray-300 group-hover:text-crimson-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-crimson-400 transition-colors">
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
            className="w-full bg-[#18181d] border border-white/[0.1] focus:border-crimson-500 px-3.5 py-2.5 rounded text-sm text-white placeholder-gray-500 outline-none transition-colors"
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
            className="w-full bg-[#18181d] border border-white/[0.1] focus:border-crimson-500 px-3.5 py-2.5 rounded text-sm text-white placeholder-gray-500 outline-none transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-[#BA1A1A] hover:bg-[#DC2626] text-white font-semibold text-[13px] sm:text-[14px] uppercase tracking-wide rounded transition-all duration-200 shadow-md hover:shadow-crimson-glow flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? 'Authenticating...' : 'Sign In'}
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="text-center pt-2">
          <Link href="/checkout" className="text-xs text-crimson-400 hover:text-crimson-300 hover:underline">
            Need to enroll? Submit bank transfer here →
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#080809]">
      <Navbar />

      <main className="flex-grow flex items-center justify-center pt-32 sm:pt-36 lg:pt-40 pb-16 sm:pb-24 px-4">
        <Suspense fallback={<div className="text-white text-xs">Loading login portal...</div>}>
          <LoginContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
