'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/context/auth-context';
import { Check, Copy, ArrowRight, ShieldCheck, AlertCircle, Building, CheckCircle2 } from 'lucide-react';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentUser } = useAuth();

  const [selectedTier, setSelectedTier] = useState<'monthly' | 'coaching_90'>('coaching_90');
  const [referenceCode, setReferenceCode] = useState('');
  const [bankName, setBankName] = useState('Chase Bank Wire / Direct ACH');
  const [senderAccountName, setSenderAccountName] = useState(currentUser?.name || '');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptNotes, setReceiptNotes] = useState('');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successSubmission, setSuccessSubmission] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const tierParam = searchParams.get('tier');
    if (tierParam === 'monthly') {
      setSelectedTier('monthly');
    } else {
      setSelectedTier('coaching_90');
    }

    // Generate unique reference code
    const random = Math.floor(100000 + Math.random() * 900000);
    setReferenceCode(`TRF-IRON-${random}`);
  }, [searchParams]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const amount = selectedTier === 'monthly' ? 50.0 : 450.0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const activeUserId = currentUser ? currentUser.id : 'usr_client_pending';
      const res = await fetch(`/api/payments?userId=${activeUserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: selectedTier,
          referenceCode,
          bankName,
          transferDate,
          senderAccountName,
          receiptNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit bank transfer');
      }

      setSuccessSubmission(data.payment);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing transfer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#080809]">
      <Navbar />

      <main className="flex-grow pt-32 sm:pt-36 lg:pt-40 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="mb-10 text-center">
          <span className="text-xs font-bold text-gold uppercase tracking-widest bg-gold/10 px-3 py-1 rounded-full border border-gold/30">
            Secure Institutional Enrollment
          </span>
          <h1
            style={{
              fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
              fontWeight: 600,
              letterSpacing: '-0.02em',
            }}
            className="text-[28px] sm:text-[34px] lg:text-[36px] text-white tracking-tight mt-3 leading-tight"
          >
            Manual Bank Transfer Checkout
          </h1>
          <p className="text-gray-400 text-sm max-w-xl mx-auto mt-2 font-normal">
            Zero credit card processing fees. Each transfer receives a verified audit code verified by
            our administrative team.
          </p>
        </div>

        {successSubmission ? (
          <div className="bg-[#121215] border border-gold/50 rounded-lg p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-gold-glow">
            <div className="w-16 h-16 rounded-full bg-gold/20 border border-gold flex items-center justify-center text-gold mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h2
              style={{
                fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
                fontWeight: 600,
                letterSpacing: '-0.02em',
              }}
              className="text-[24px] sm:text-[28px] text-white mb-2"
            >
              Transfer Submitted for Verification!
            </h2>
            <p className="text-gray-300 text-sm mb-6">
              Your transfer reference <span className="font-mono font-bold text-gold">{successSubmission.referenceCode}</span> has been logged into our administrative queue.
            </p>

            <div className="bg-[#18181d] border border-white/[0.08] rounded p-4 text-left text-xs space-y-2 mb-8">
              <div className="flex justify-between">
                <span className="text-gray-400">Membership Tier:</span>
                <span className="text-white font-semibold uppercase">{successSubmission.tier.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Amount Due:</span>
                <span className="text-gold font-bold">${successSubmission.amount.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Bank & Reference:</span>
                <span className="text-white">{successSubmission.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="text-amber-400 font-bold uppercase bg-amber-950/60 px-2 py-0.5 rounded border border-amber-600/40">
                  Pending Administrative Approval
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/admin')}
                className="px-6 py-3 bg-red-950 text-red-200 border border-red-700 font-semibold text-[13px] sm:text-[14px] rounded hover:bg-red-900 transition-colors"
              >
                Switch to Admin Desk (Approve Now)
              </button>
              <button
                onClick={() => router.push('/client')}
                className="px-6 py-3 bg-[#D4A359] hover:bg-[#C2934B] text-[#111111] font-semibold text-[13px] sm:text-[14px] uppercase tracking-wide rounded transition-colors shadow-gold-glow"
              >
                Go to Client Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Plan Selection & Transfer Details */}
            <div className="lg:col-span-5 space-y-6">
              {/* Tier Toggle */}
              <div className="bg-[#121215] border border-white/[0.08] p-6 rounded-lg">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                  1. Select Membership Tier
                </h3>

                <div className="space-y-3">
                  <div
                    onClick={() => setSelectedTier('coaching_90')}
                    className={`p-4 rounded border cursor-pointer transition-all ${
                      selectedTier === 'coaching_90'
                        ? 'border-gold bg-gold/10'
                        : 'border-white/[0.08] bg-[#18181d] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">
                        90-Day VIP Coaching
                      </span>
                      <span className="text-gold font-bold font-mono text-base">
                        $450.00
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      1-on-1 strategy call, weekly group masterminds, custom diet plan & private video access.
                    </p>
                  </div>

                  <div
                    onClick={() => setSelectedTier('monthly')}
                    className={`p-4 rounded border cursor-pointer transition-all ${
                      selectedTier === 'monthly'
                        ? 'border-gold bg-gold/10'
                        : 'border-white/[0.08] bg-[#18181d] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">
                        Standard Monthly Gym
                      </span>
                      <span className="text-gold font-bold font-mono text-base">
                        $50.00
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Full 24/7 gym & recovery access, common exercise video library.
                    </p>
                  </div>
                </div>
              </div>

              {/* IronForge Official Wire Instructions */}
              <div className="bg-[#121215] border border-white/[0.08] p-6 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Building className="w-4 h-4 text-gold" />
                    Official Bank Instructions
                  </h3>
                  <span className="text-[11px] text-gray-400">Domestic Wire & ACH</span>
                </div>

                <div className="bg-[#0a0a0c] border border-white/[0.06] rounded p-4 space-y-2 text-xs">
                  <div className="flex justify-between border-b border-white/[0.04] pb-1.5">
                    <span className="text-gray-400">Bank Name:</span>
                    <span className="text-white font-medium">JPMorgan Chase Bank, N.A.</span>
                  </div>
                  <div className="flex justify-between border-b border-white/[0.04] pb-1.5">
                    <span className="text-gray-400">Account Name:</span>
                    <span className="text-white font-medium">IronForge Athletic Club LLC</span>
                  </div>
                  <div className="flex justify-between border-b border-white/[0.04] pb-1.5">
                    <span className="text-gray-400">Routing (ABA):</span>
                    <span className="text-white font-mono font-medium">122000496</span>
                  </div>
                  <div className="flex justify-between border-b border-white/[0.04] pb-1.5">
                    <span className="text-gray-400">Account Number:</span>
                    <span className="text-white font-mono font-medium">98421098412</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-gold font-semibold">Mandatory Reference:</span>
                    <span className="text-gold font-mono font-bold">{referenceCode}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-gold/10 border border-gold/30 px-3 py-2 rounded">
                  <div className="text-xs">
                    <span className="text-gray-400 block text-[10px]">YOUR UNIQUE REFERENCE:</span>
                    <span className="font-mono font-bold text-white text-sm">{referenceCode}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(referenceCode)}
                    className="text-xs bg-gold/20 hover:bg-gold/30 text-gold px-2.5 py-1 rounded flex items-center gap-1 transition-colors font-medium"
                  >
                    <Copy className="w-3 h-3" />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Submission Form */}
            <div className="lg:col-span-7">
              <form
                onSubmit={handleSubmit}
                className="bg-[#121215] border border-white/[0.08] p-6 sm:p-8 rounded-lg space-y-6 shadow-card-dark"
              >
                <div className="border-b border-white/[0.08] pb-4">
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">
                    2. Submit Bank Transfer Details
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Please execute the transfer with your bank using the reference code above, then
                    fill out this verification form.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-950/70 border border-red-800 text-red-200 text-xs rounded flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wide mb-1.5">
                      Sender Account Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={senderAccountName}
                      onChange={(e) => setSenderAccountName(e.target.value)}
                      placeholder="e.g. Marcus Vance or Vance Holdings"
                      className="w-full bg-[#18181d] border border-white/[0.1] focus:border-gold px-3.5 py-2.5 rounded text-sm text-white placeholder-gray-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wide mb-1.5">
                      Transfer Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={transferDate}
                      onChange={(e) => setTransferDate(e.target.value)}
                      className="w-full bg-[#18181d] border border-white/[0.1] focus:border-gold px-3.5 py-2.5 rounded text-sm text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wide mb-1.5">
                    Your Sending Bank / Method *
                  </label>
                  <input
                    type="text"
                    required
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. Wells Fargo Wire, Chase QuickPay, Citi Wire"
                    className="w-full bg-[#18181d] border border-white/[0.1] focus:border-gold px-3.5 py-2.5 rounded text-sm text-white placeholder-gray-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wide mb-1.5">
                    Receipt Notes / Bank Confirmation Number
                  </label>
                  <textarea
                    rows={3}
                    value={receiptNotes}
                    onChange={(e) => setReceiptNotes(e.target.value)}
                    placeholder="Enter any wire tracking reference, confirmation number, or notes for our accounting desk."
                    className="w-full bg-[#18181d] border border-white/[0.1] focus:border-gold p-3.5 rounded text-sm text-white placeholder-gray-500 outline-none resize-none"
                  />
                </div>

                <div className="bg-[#18181d] p-4 rounded border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-400 block">Total Due:</span>
                    <span className="text-2xl font-extrabold text-white font-mono">
                      ${amount.toFixed(2)} USD
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-gray-400 block">Unique Code:</span>
                    <span className="text-xs font-mono font-bold text-gold">{referenceCode}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-[#D4A359] hover:bg-[#C2934B] text-[#111111] font-semibold text-[13px] sm:text-[14px] uppercase tracking-wider rounded transition-all duration-200 shadow-md hover:shadow-gold-glow flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Submitting Transfer...' : 'Submit Transfer for Verification'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-[11px] text-center text-gray-400 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-gold" />
                  Your enrollment will activate immediately upon administrative review.
                </p>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080809] flex items-center justify-center text-gold font-bold">
          Loading Checkout...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
