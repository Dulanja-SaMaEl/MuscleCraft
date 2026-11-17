'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PackageTransferForm from '@/components/payments/PackageTransferForm';
import { User, Users, Sparkles, Copy, Building } from 'lucide-react';
import { PaymentService } from '@/lib/services/payment-service';

function CheckoutContent() {
  const searchParams = useSearchParams();

  const [selectedCategory, setSelectedCategory] = useState<'sole' | 'couple' | 'coaching'>('sole');
  const [selectedTier, setSelectedTier] = useState<string>('sole_3m');
  const [referenceCode, setReferenceCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [dbPackages, setDbPackages] = useState<any[]>([]);

  useEffect(() => {
    const loadPackages = async () => {
      try {
        const res = await fetch('/api/admin/packages');
        if (res.ok) {
          const d = await res.json();
          if (d.packages && Array.isArray(d.packages)) {
            setDbPackages(d.packages);
          }
        }
      } catch (err) {
        // Fallback to static pricing
      }
    };
    loadPackages();
  }, []);

  useEffect(() => {
    const tierParam = searchParams.get('tier');
    if (tierParam) {
      setSelectedTier(tierParam);
      if (tierParam.startsWith('sole') || tierParam === 'monthly') {
        setSelectedCategory('sole');
      } else if (tierParam.startsWith('couple')) {
        setSelectedCategory('couple');
      } else {
        setSelectedCategory('coaching');
      }
    } else {
      setSelectedTier('sole_3m');
      setSelectedCategory('sole');
    }

    // Generate unique reference code
    const random = Math.floor(100000 + Math.random() * 900000);
    setReferenceCode(`TRF-MC-${random}`);
  }, [searchParams]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Compute live price from database if available, else fallback to standard pricing
  const matchedDbPkg = dbPackages.find((p) => p.id === selectedTier);
  const priceDetails = matchedDbPkg
    ? {
        amount: matchedDbPkg.price + (matchedDbPkg.admissionFee || 0),
        packagePrice: matchedDbPkg.price,
        admissionFee: matchedDbPkg.admissionFee || 0,
        name: matchedDbPkg.name,
      }
    : PaymentService.getTierPrice(selectedTier);

  return (
    <div className="flex flex-col min-h-screen bg-[#080809]">
      <Navbar />

      <main className="flex-grow pt-32 sm:pt-36 lg:pt-40 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="mb-10 text-center">
          <span className="text-xs font-bold text-crimson-400 uppercase tracking-widest bg-crimson-950/40 px-3 py-1 rounded-full border border-crimson-500/30">
            Secure Enrollment Portal
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
            Zero credit card processing fees. Direct domestic Sri Lankan bank transfer with verified reference reconciliation by Coach Adeesha.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Plan Selection & Transfer Details */}
            <div className="lg:col-span-5 space-y-6">
              {/* Category & Tier Selector */}
              <div className="bg-[#121215] border border-white/[0.08] p-6 rounded-2xl">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                  1. Select Membership Package
                </h3>

                {/* Subcategory Toggle */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#18181f] rounded-xl border border-white/10 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('sole');
                      setSelectedTier('sole_3m');
                    }}
                    className={`py-2 text-[11px] font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-1 ${
                      selectedCategory === 'sole'
                        ? 'bg-crimson-600 text-white shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <User className="w-3 h-3" /> Sole
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('couple');
                      setSelectedTier('couple_3m');
                    }}
                    className={`py-2 text-[11px] font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-1 ${
                      selectedCategory === 'couple'
                        ? 'bg-crimson-600 text-white shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Users className="w-3 h-3" /> Couple
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('coaching');
                      setSelectedTier('coaching_90');
                    }}
                    className={`py-2 text-[11px] font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-1 ${
                      selectedCategory === 'coaching'
                        ? 'bg-crimson-600 text-white shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" /> Online
                  </button>
                </div>

                {/* Sole Packages List */}
                {selectedCategory === 'sole' && (
                  <div className="space-y-2.5">
                    {[
                      { id: 'sole_1m', label: 'Sole 1 Month', price: 'Rs. 4,500', note: '+ Rs. 500 Admission' },
                      { id: 'sole_3m', label: 'Sole 3 Months', price: 'Rs. 12,000', note: 'Save Rs. 1,500 + Rs. 500 Admission', popular: true },
                      { id: 'sole_6m', label: 'Sole 6 Months', price: 'Rs. 22,000', note: 'Save Rs. 5,000 + Rs. 500 Admission' },
                      { id: 'sole_1y', label: 'Sole 1 Year', price: 'Rs. 40,000', note: 'Best Value: Save Rs. 14,000 + Rs. 500 Admission', popular: true },
                    ].map((pkg) => (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedTier(pkg.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          selectedTier === pkg.id
                            ? 'border-crimson-600 bg-crimson-950/40 shadow-[0_0_15px_rgba(186,26,26,0.25)]'
                            : 'border-white/[0.08] bg-[#18181d] hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs sm:text-sm">{pkg.label}</span>
                          <span className="text-crimson-400 font-bold font-mono text-sm">{pkg.price}</span>
                        </div>
                        <p className="text-[10.5px] text-gray-400 mt-0.5">{pkg.note}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Couple Packages List */}
                {selectedCategory === 'couple' && (
                  <div className="space-y-2.5">
                    {[
                      { id: 'couple_1m', label: 'Couple 1 Month', price: 'Rs. 8,000', note: '+ Rs. 1,000 Admission for 2' },
                      { id: 'couple_3m', label: 'Couple 3 Months', price: 'Rs. 22,500', note: 'Save Rs. 1,500 + Rs. 1,000 Admission', popular: true },
                      { id: 'couple_6m', label: 'Couple 6 Months', price: 'Rs. 42,000', note: 'Save Rs. 6,000 + Rs. 1,000 Admission' },
                      { id: 'couple_1y', label: 'Couple 1 Year', price: 'Rs. 78,000', note: 'Best Value: Save Rs. 18,000 + Rs. 1,000 Admission', popular: true },
                    ].map((pkg) => (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedTier(pkg.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          selectedTier === pkg.id
                            ? 'border-crimson-600 bg-crimson-950/40 shadow-[0_0_15px_rgba(186,26,26,0.25)]'
                            : 'border-white/[0.08] bg-[#18181d] hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs sm:text-sm">{pkg.label}</span>
                          <span className="text-crimson-400 font-bold font-mono text-sm">{pkg.price}</span>
                        </div>
                        <p className="text-[10.5px] text-gray-400 mt-0.5">{pkg.note}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Coaching List */}
                {selectedCategory === 'coaching' && (
                  <div className="space-y-2.5">
                    <div
                      onClick={() => setSelectedTier('coaching_90')}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        selectedTier === 'coaching_90'
                          ? 'border-crimson-600 bg-crimson-950/40 shadow-[0_0_15px_rgba(186,26,26,0.25)]'
                          : 'border-white/[0.08] bg-[#18181d] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs sm:text-sm">90 Days Better Me</span>
                        <span className="text-crimson-400 font-bold font-mono text-sm">Rs. 8,000</span>
                      </div>
                      <p className="text-[10.5px] text-gray-400 mt-0.5">Online fitness coaching, custom diet & weekly checks</p>
                    </div>

                    <div
                      onClick={() => setSelectedTier('burnzone')}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        selectedTier === 'burnzone'
                          ? 'border-crimson-600 bg-crimson-950/40 shadow-[0_0_15px_rgba(186,26,26,0.25)]'
                          : 'border-white/[0.08] bg-[#18181d] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs sm:text-sm">MuscleCraft BurnZone</span>
                        <span className="text-crimson-400 font-bold font-mono text-sm">Rs. 3,000</span>
                      </div>
                      <p className="text-[10.5px] text-gray-400 mt-0.5">CrossFit & functional conditioning circuits</p>
                    </div>
                  </div>
                )}

                {/* Price Breakdown Banner */}
                <div className="mt-5 p-3.5 rounded-xl bg-crimson-950/30 border border-crimson-800/40 text-xs space-y-1.5">
                  <div className="flex justify-between text-gray-300">
                    <span>Package Price:</span>
                    <span className="font-semibold text-white">Rs. {priceDetails.packagePrice.toLocaleString()} LKR</span>
                  </div>
                  {priceDetails.admissionFee > 0 && (
                    <div className="flex justify-between text-gray-300">
                      <span>Admission Fee:</span>
                      <span className="font-semibold text-white">Rs. {priceDetails.admissionFee.toLocaleString()} LKR</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-crimson-700/40 pt-1.5 font-bold text-sm">
                    <span className="text-white">Total Payable:</span>
                    <span className="text-crimson-400 font-mono">Rs. {priceDetails.amount.toLocaleString()} LKR</span>
                  </div>
                </div>
              </div>

              {/* MuscleCraft Official Bank Instructions */}
              <div className="bg-[#121215] border border-white/[0.08] p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Building className="w-4 h-4 text-crimson-400" />
                    Official Bank Accounts
                  </h3>
                  <span className="text-[11px] text-gray-400">Sri Lanka Domestic Transfer</span>
                </div>

                <div className="bg-[#0a0a0c] border border-white/[0.06] rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between border-b border-white/[0.04] pb-1.5">
                    <span className="text-gray-400">Primary Bank:</span>
                    <span className="text-white font-medium">Commercial Bank of Ceylon PLC</span>
                  </div>
                  <div className="flex justify-between border-b border-white/[0.04] pb-1.5">
                    <span className="text-gray-400">Account Name:</span>
                    <span className="text-white font-medium">MuscleCraft Fitness (Pvt) Ltd</span>
                  </div>
                  <div className="flex justify-between border-b border-white/[0.04] pb-1.5">
                    <span className="text-gray-400">Account Number:</span>
                    <span className="text-white font-mono font-medium">1000 8492 0192</span>
                  </div>
                  <div className="flex justify-between border-b border-white/[0.04] pb-1.5">
                    <span className="text-gray-400">Branch:</span>
                    <span className="text-white font-medium">Nugegoda / Main Branch</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-crimson-400 font-semibold">Mandatory Reference:</span>
                    <span className="text-crimson-400 font-mono font-bold">{referenceCode}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-crimson-950/40 border border-crimson-500/30 px-3 py-2 rounded-xl">
                  <div className="text-xs">
                    <span className="text-gray-400 block text-[10px]">YOUR UNIQUE REFERENCE:</span>
                    <span className="font-mono font-bold text-white text-sm">{referenceCode}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(referenceCode)}
                    className="text-xs bg-crimson-900/40 hover:bg-crimson-900/70 text-crimson-300 px-2.5 py-1 rounded flex items-center gap-1 transition-colors font-medium cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Authenticated Transfer & Receipt Upload Form */}
            <div className="lg:col-span-7 bg-[#121215] border border-white/[0.08] p-6 sm:p-8 rounded-2xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                2. Authenticate, Confirm Transfer & Upload Receipt
              </h3>
              <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                Sign in or create your account, complete the bank transfer, and upload your receipt slip directly below.
              </p>

              <PackageTransferForm
                selectedTier={selectedTier}
                packageName={priceDetails.name}
                packagePrice={priceDetails.packagePrice}
                admissionFee={priceDetails.admissionFee}
                redirectBackPath={`/checkout?tier=${encodeURIComponent(selectedTier)}`}
              />
            </div>
          </div>
      </main>

      <Footer />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080809] text-white flex items-center justify-center">Loading Checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
