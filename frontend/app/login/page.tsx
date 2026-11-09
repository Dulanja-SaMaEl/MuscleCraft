'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/context/auth-context';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your email address to sign in.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await login(email.trim(), password || 'passthrough');
      if (res.success && res.user) {
        if (rememberMe && typeof window !== 'undefined') {
          localStorage.setItem('musclecraft_remember_email', email);
        }

        // Role-based destination routing
        if (res.user.role === 'admin') {
          router.push('/admin');
        } else if (res.user.role === 'instructor') {
          router.push('/instructor');
        } else {
          router.push('/client');
        }
      } else {
        setErrorMsg(
          res.error ||
            'Could not sign in. Please contact Coach Adeesha on WhatsApp.'
        );
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred during sign in.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full space-y-7">
      {/* Brand Header */}
      <div className="text-center">
        <div className="w-16 h-16 border border-crimson-600/40 rounded-2xl flex items-center justify-center bg-black/70 mx-auto mb-4 p-2 shadow-crimson-glow backdrop-blur-md">
          <Image
            src="/images/musclecraft-emblem.png"
            alt="MuscleCraft Emblem"
            width={42}
            height={42}
            className="object-contain filter drop-shadow-[0_0_8px_rgba(220,38,38,0.7)]"
            priority
          />
        </div>
        <h1
          style={{
            fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
            fontWeight: 800,
            letterSpacing: '-0.02em',
          }}
          className="text-2xl sm:text-3xl text-white tracking-tight leading-tight uppercase"
        >
          Sign In to Muscle<span className="text-crimson-500">Craft</span>
        </h1>
        <p className="text-xs text-gray-400 mt-2 font-normal leading-relaxed">
          Access your personalized coaching desk, body analytics, workouts, and membership records.
        </p>
      </div>

      {/* Notice Banner: 90-Day Coaching Auto-Logout */}
      {reason === 'expired_90day' && (
        <div className="p-4 rounded-xl bg-amber-950/50 border border-amber-500/60 text-xs text-amber-200 space-y-2.5 shadow-lg animate-in fade-in duration-300">
          <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>90-Day Coaching Access Concluded</span>
          </div>
          <p className="text-gray-300 text-[11.5px] leading-relaxed">
            Your 90-Day Better Me transformation coaching cycle has concluded and your session has ended in accordance with cohort access policy. To re-enroll or discuss renewal options, contact Coach Adeesha directly.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <a
              href="https://wa.me/94771234567?text=Hi%20Coach%20Adeesha%2C%20my%2090-Day%20coaching%20period%20has%20concluded.%20I%20would%20like%20to%20discuss%20my%20renewal%20options."
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp Coach Adeesha
            </a>
            <Link
              href="/checkout?tier=coaching_90"
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
            >
              Re-enroll Online (Rs. 8,000)
            </Link>
          </div>
        </div>
      )}

      {/* Standard Production Login Form */}
      <form
        onSubmit={handleManualLogin}
        className="bg-[#101014] border border-white/[0.08] p-6 sm:p-7 rounded-2xl shadow-2xl space-y-5 backdrop-blur-xl"
      >
        {errorMsg && (
          <div className="p-3.5 bg-red-950/70 border border-red-800/80 text-red-200 text-xs rounded-xl flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {/* Email Field */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="athlete@musclecraft.lk"
              className="w-full bg-[#16161b] border border-white/[0.1] focus:border-crimson-500 pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Password Field (Optional / Pass-Through) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Password <span className="text-[10.5px] text-emerald-400 font-normal lowercase">(optional — any password passes)</span>
            </label>
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="text-[11px] text-gray-400 hover:text-crimson-300 font-medium transition-colors cursor-pointer"
            >
              Need Help?
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Any password or leave blank"
              className="w-full bg-[#16161b] border border-white/[0.1] focus:border-crimson-500 pl-10 pr-11 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Remember Me Checkbox */}
        <div className="flex items-center justify-between pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-gray-700 bg-[#16161b] text-crimson-600 focus:ring-crimson-500 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-xs text-gray-300 font-medium">Keep me signed in</span>
          </label>
          <span className="text-[11px] text-gray-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Encrypted Session
          </span>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-[#BA1A1A] hover:bg-[#DC2626] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all duration-200 shadow-lg hover:shadow-crimson-glow flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Verifying Credentials...</span>
            </>
          ) : (
            <>
              <span>Sign In to Portal</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Footer Navigation Links */}
        <div className="pt-2 border-t border-white/[0.06] text-center space-y-2">
          <div className="text-xs text-gray-400">
            Need to activate a membership or submit bank transfer?
          </div>
          <Link
            href="/checkout"
            className="inline-block text-xs font-semibold text-crimson-400 hover:text-crimson-300 transition-colors cursor-pointer"
          >
            Submit Bank Slip & Enroll Now →
          </Link>
        </div>
      </form>

      {/* Forgot Password / Account Assistance Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#121217] border border-white/10 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-crimson-950/60 border border-crimson-800/50 flex items-center justify-center text-crimson-400">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Password & Account Recovery</h3>
                <p className="text-[11px] text-gray-400">Direct Head Coach Verification</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              For security and athlete privacy, password resets and account re-activations are verified directly by Head Coach Adeesha. Send a quick WhatsApp message with your registered email:
            </p>

            <div className="p-3 bg-black/40 rounded-xl border border-white/[0.06] space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-gray-400">
                <span>Head Coach:</span>
                <strong className="text-white">Adeesha Kumarasingha</strong>
              </div>
              <div className="flex items-center justify-between text-gray-400">
                <span>WhatsApp:</span>
                <strong className="text-white">+94 77 123 4567</strong>
              </div>
              <div className="flex items-center justify-between text-gray-400">
                <span>Response Time:</span>
                <span className="text-emerald-400 font-medium">Within 1 hour</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <a
                href="https://wa.me/94771234567?text=Hi%20Coach%20Adeesha%2C%20I%20need%20assistance%20resetting%20my%20MuscleCraft%20account%20password."
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                Message WhatsApp
              </a>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
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
