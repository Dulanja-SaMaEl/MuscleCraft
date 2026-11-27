'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Copy,
  Building,
  ShieldCheck,
  AlertCircle,
  Upload,
  FileText,
  Lock,
  UserPlus,
  LogIn,
  Loader2,
  ArrowRight,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/context/auth-context';
import { PaymentService } from '@/lib/services/payment-service';

export interface PackageTransferFormProps {
  selectedTier: string;
  packageName?: string;
  packagePrice?: number;
  admissionFee?: number;
  redirectBackPath: string;
  onSuccess?: (payment: any) => void;
  onClose?: () => void;
  compact?: boolean;
}

export default function PackageTransferForm({
  selectedTier,
  packageName,
  packagePrice,
  admissionFee,
  redirectBackPath,
  onSuccess,
  onClose,
  compact = false,
}: PackageTransferFormProps) {
  const { currentUser } = useAuth();

  const fallbackPrice = PaymentService.getTierPrice(selectedTier);
  const pkgPrice = typeof packagePrice === 'number' ? packagePrice : fallbackPrice.packagePrice;
  const admFee = typeof admissionFee === 'number' ? admissionFee : fallbackPrice.admissionFee;
  const totalAmount = pkgPrice + admFee;
  const resolvedPkgName = packageName || fallbackPrice.name;

  const [referenceCode, setReferenceCode] = useState('');
  const [bankName, setBankName] = useState('Commercial Bank of Ceylon (Online Transfer / Deposit)');
  const [senderAccountName, setSenderAccountName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const isCoupleTier = selectedTier.startsWith('couple');
  const [receiptNotes, setReceiptNotes] = useState('');
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreviewUrl, setSlipPreviewUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [uploadingPostReceipt, setUploadingPostReceipt] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [receiptFeedback, setReceiptFeedback] = useState('');
  const [successSubmission, setSuccessSubmission] = useState<any | null>(null);

  useEffect(() => {
    const random = Math.floor(100000 + Math.random() * 900000);
    setReferenceCode(`TRF-MC-${random}`);
    setSuccessSubmission(null);
    setErrorMsg('');
    setReceiptFeedback('');
    setSlipFile(null);
    setSlipPreviewUrl('');
  }, [selectedTier]);

  useEffect(() => {
    if (currentUser?.name && !senderAccountName) {
      setSenderAccountName(currentUser.name);
    }
  }, [currentUser, senderAccountName]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileSelect = (file: File | null) => {
    setSlipFile(file);
    setReceiptFeedback('');
    if (!file) {
      setSlipPreviewUrl('');
      return;
    }
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setSlipPreviewUrl((e.target?.result as string) || '');
      reader.readAsDataURL(file);
    } else {
      setSlipPreviewUrl('');
    }
  };

  const uploadSlipFileToServer = async (file: File, userId: string): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    const upRes = await fetch(`/api/payments/upload-slip?userId=${encodeURIComponent(userId)}`, {
      method: 'POST',
      body: fd,
    });
    const upData = await upRes.json();
    if (!upRes.ok || !upData?.url) {
      throw new Error(upData?.error || 'Failed to upload bank receipt slip.');
    }
    return upData.url;
  };

  const handleSubmitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setErrorMsg('Please sign in or register before submitting a transfer.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      let uploadedSlipUrl: string | undefined = undefined;
      if (slipFile) {
        uploadedSlipUrl = await uploadSlipFileToServer(slipFile, currentUser.id);
      }

      if (isCoupleTier) {
        if (partnerName.trim().length < 2) {
          throw new Error('Please enter Partner 2 full name for this Couple package.');
        }
        if (!partnerEmail.trim().includes('@')) {
          throw new Error('Please enter a valid separate email address for Partner 2.');
        }
        if (partnerEmail.trim().toLowerCase() === (currentUser.email || '').toLowerCase()) {
          throw new Error('Partner 2 must have a different email address from your account.');
        }
      }

      const coupleNote = isCoupleTier
        ? `Couple Partner 2: ${partnerName.trim()} (${partnerEmail.trim().toLowerCase()})`
        : '';
      const combinedNotes = [coupleNote, receiptNotes.trim()].filter(Boolean).join(' | ');

      const res = await fetch(`/api/payments?userId=${encodeURIComponent(currentUser.id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: selectedTier,
          referenceCode,
          bankName,
          transferDate,
          senderAccountName: senderAccountName.trim() || currentUser.name,
          receiptNotes: combinedNotes || undefined,
          receiptUrl: uploadedSlipUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit bank transfer.');
      }

      setSuccessSubmission({
        ...data.payment,
        packageName: resolvedPkgName,
        packageAmount: pkgPrice,
        admissionFee: admFee,
        amount: totalAmount,
      });
      onSuccess?.(data.payment);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error submitting bank transfer.');
    } finally {
      setSubmitting(false);
    }
  };

  // Allows uploading/updating the receipt slip immediately AFTER submitting the transfer
  const handlePostTransactionReceiptUpload = async (file: File | null) => {
    if (!file || !currentUser || !successSubmission) return;
    setUploadingPostReceipt(true);
    setErrorMsg('');
    setReceiptFeedback('');

    try {
      const receiptUrl = await uploadSlipFileToServer(file, currentUser.id);
      const patchRes = await fetch(
        `/api/payments/${encodeURIComponent(successSubmission.id || successSubmission.referenceCode)}?userId=${encodeURIComponent(currentUser.id)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ receiptUrl }),
        }
      );

      const patchData = await patchRes.json();
      if (!patchRes.ok) {
        throw new Error(patchData?.error || 'Could not attach receipt to this transaction.');
      }

      setSuccessSubmission((prev: any) => ({ ...prev, receiptUrl }));
      setReceiptFeedback('Receipt slip uploaded & attached cleanly for Coach Adeesha.');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to attach receipt.');
    } finally {
      setUploadingPostReceipt(false);
    }
  };

  // Gate 1: Require login / registration before submitting a transfer
  if (!currentUser) {
    const encodedRedirect = encodeURIComponent(redirectBackPath);
    return (
      <div className="bg-[#121217] border border-crimson-600/40 rounded-2xl p-6 sm:p-8 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-crimson-950/70 border border-crimson-500/40 text-crimson-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(186,26,26,0.3)]">
          <Lock className="w-7 h-7" />
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <span className="text-[11px] font-mono uppercase tracking-widest text-amber-300 bg-amber-950/60 border border-amber-500/30 px-3 py-1 rounded-full">
            Account Required Before Payment
          </span>
          <h3 className="text-xl font-bold text-white pt-1">
            Register or Sign In to Continue Enrollment
          </h3>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            You selected <strong className="text-white">{resolvedPkgName}</strong> (Rs. {totalAmount.toLocaleString()} LKR). Create your athlete account or sign in first so your bank transfer slip attaches directly to your profile.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href={`/login?tab=register&redirect=${encodedRedirect}`}
            className="px-6 py-3.5 bg-crimson-600 hover:bg-crimson-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-crimson-glow flex items-center justify-center gap-2 min-h-[44px]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register New Account</span>
          </Link>
          <Link
            href={`/login?redirect=${encodedRedirect}`}
            className="px-6 py-3.5 bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/15 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 min-h-[44px]"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In Existing Member</span>
          </Link>
        </div>
      </div>
    );
  }

  // Gate 2: Banned users cannot submit transfers
  if (currentUser.status === 'suspended') {
    return (
      <div className="bg-[#121217] border border-rose-700/50 rounded-2xl p-6 sm:p-8 text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Account Suspended</h3>
        <p className="text-xs text-gray-300 max-w-md mx-auto">
          Your account is currently suspended by an administrator. Please contact Coach Adeesha directly on WhatsApp before purchasing a plan.
        </p>
      </div>
    );
  }

  // Post-Transaction View (Allows uploading receipt slip immediately AFTER transaction took place!)
  if (successSubmission) {
    return (
      <div className="bg-[#121215] border border-crimson-600/50 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-emerald-950/70 border border-emerald-500/60 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white">
            Transfer Recorded — Upload / Verify Receipt
          </h3>
          <p className="text-xs text-gray-300 max-w-md mx-auto">
            Reference <strong className="font-mono text-crimson-400">{successSubmission.referenceCode}</strong> has been logged under{' '}
            <strong className="text-white">{currentUser.email}</strong>.
          </p>
        </div>

        <div className="bg-[#18181f] border border-white/[0.08] rounded-xl p-4 text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Package:</span>
            <span className="text-white font-semibold">{successSubmission.packageName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total Amount:</span>
            <span className="text-crimson-400 font-mono font-bold">
              Rs. {Number(successSubmission.amount || totalAmount).toLocaleString()} LKR
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Approval Status:</span>
            <span className="text-amber-300 font-bold uppercase text-[11px]">
              Pending Admin Verification
            </span>
          </div>
        </div>

        {/* Upload Receipt Right After Transaction */}
        <div className="p-4 rounded-2xl bg-[#14141c] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-crimson-400" />
              <span>
                {successSubmission.receiptUrl
                  ? 'Receipt Slip Attached (Upload New to Replace)'
                  : 'Upload Your Bank Transfer Receipt Now'}
              </span>
            </span>
            {successSubmission.receiptUrl && (
              <a
                href={successSubmission.receiptUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold text-emerald-400 hover:underline flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" /> View Uploaded Slip
              </a>
            )}
          </div>

          <label className="relative border-2 border-dashed border-white/15 hover:border-crimson-500/60 rounded-xl p-4 flex items-center justify-center gap-3 cursor-pointer bg-black/40 transition-colors">
            <input
              type="file"
              accept="image/*,.pdf"
              disabled={uploadingPostReceipt}
              onChange={(e) => handlePostTransactionReceiptUpload(e.target.files?.[0] || null)}
              className="hidden"
            />
            {uploadingPostReceipt ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-crimson-400" />
                <span className="text-xs text-gray-200 font-semibold">Uploading receipt slip...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 text-crimson-400" />
                <span className="text-xs text-gray-200 font-semibold">
                  {successSubmission.receiptUrl
                    ? 'Click to replace uploaded receipt (JPG / PNG / PDF)'
                    : 'Click to attach transfer slip image or PDF'}
                </span>
              </>
            )}
          </label>

          {receiptFeedback && (
            <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-600/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{receiptFeedback}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-600/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-white/15 text-xs font-semibold text-gray-200 hover:bg-white/5 cursor-pointer"
            >
              Stay on Pricing
            </button>
          )}
          <Link
            href="/client"
            className="px-6 py-2.5 bg-crimson-600 hover:bg-crimson-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-crimson-glow"
          >
            <span>Track Approval in Portal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmitTransfer} className="space-y-4">
      {/* Signed-in Athlete Badge + Bank Details */}
      <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
        <div className="p-4 rounded-2xl bg-[#16161e] border border-white/[0.08] space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Enrolling Athlete:</span>
            <span className="text-emerald-400 font-mono text-[10.5px] bg-emerald-950/60 border border-emerald-600/40 px-2 py-0.5 rounded-full">
              Signed In
            </span>
          </div>
          <div className="text-sm font-bold text-white">{currentUser.name}</div>
          <div className="text-[11px] text-gray-400">{currentUser.email}</div>

          <div className="border-t border-white/[0.06] pt-2 mt-2 space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-400">Package:</span>
              <span className="text-white font-semibold">{resolvedPkgName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Package Fee:</span>
              <span className="text-gray-200">Rs. {pkgPrice.toLocaleString()} LKR</span>
            </div>
            {admFee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">One-Time Admission:</span>
                <span className="text-gray-200">Rs. {admFee.toLocaleString()} LKR</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm pt-1 border-t border-white/[0.06]">
              <span className="text-white">Total Due:</span>
              <span className="text-crimson-400 font-mono">Rs. {totalAmount.toLocaleString()} LKR</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#16161e] border border-white/[0.08] space-y-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-white uppercase tracking-wider text-[11px]">
            <Building className="w-3.5 h-3.5 text-crimson-400" />
            <span>MuscleCraft Official Bank Account</span>
          </div>
          <div className="space-y-1 text-[11.5px] text-gray-300">
            <div>
              Bank: <strong className="text-white">Commercial Bank of Ceylon PLC</strong>
            </div>
            <div>
              Account Name: <strong className="text-white">MuscleCraft Fitness (Pvt) Ltd</strong>
            </div>
            <div>
              Account No: <strong className="text-white font-mono">1000 8492 0192</strong> (Nugegoda)
            </div>
          </div>

          <div className="flex items-center justify-between bg-crimson-950/40 border border-crimson-500/30 px-3 py-2 rounded-xl mt-2">
            <div>
              <span className="text-[9.5px] text-gray-400 uppercase block">Transfer Reference</span>
              <span className="font-mono font-bold text-white text-xs">{referenceCode}</span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(referenceCode)}
              className="text-[11px] bg-crimson-900/40 hover:bg-crimson-900/70 text-crimson-300 px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-600/40 text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isCoupleTier && (
        <div className="p-4 rounded-xl bg-crimson-950/20 border border-crimson-500/40 space-y-3">
          <div>
            <span className="text-xs font-bold text-crimson-300 block">
              Couple Package — Partner 2 Details (2nd Person) *
            </span>
            <span className="text-[11px] text-gray-400 block mt-0.5">
              Enter your partner&apos;s full name and separate email address so both partners receive portal access upon approval.
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Partner 2 Full Name *</label>
              <input
                type="text"
                required
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="Partner's full name"
                className="w-full px-3.5 py-2.5 bg-[#18181f] border border-white/10 rounded-xl text-white text-xs focus:border-crimson-500 focus:outline-none min-h-[42px]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Partner 2 Email Address *</label>
              <input
                type="email"
                required
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
                placeholder="partner@example.com"
                className="w-full px-3.5 py-2.5 bg-[#18181f] border border-white/10 rounded-xl text-white text-xs focus:border-crimson-500 focus:outline-none min-h-[42px]"
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">Bank Used *</label>
          <select
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#18181f] border border-white/10 rounded-xl text-white text-xs focus:border-crimson-500 focus:outline-none min-h-[42px]"
          >
            <option value="Commercial Bank of Ceylon (Online Transfer / Deposit)">Commercial Bank of Ceylon</option>
            <option value="Sampath Bank Vishwa / Slip Deposit">Sampath Bank (Vishwa)</option>
            <option value="Hatton National Bank (HNB)">Hatton National Bank (HNB)</option>
            <option value="Bank of Ceylon (BOC SmartPay / Slip)">Bank of Ceylon (BOC)</option>
            <option value="Nations Trust Bank (NTB) / FriMi">Nations Trust Bank / FriMi</option>
            <option value="Other Bank Direct Deposit">Other Bank Deposit</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">Sender / Depositor Name *</label>
          <input
            type="text"
            required
            value={senderAccountName}
            onChange={(e) => setSenderAccountName(e.target.value)}
            placeholder="Your full name on bank account"
            className="w-full px-3.5 py-2.5 bg-[#18181f] border border-white/10 rounded-xl text-white text-xs focus:border-crimson-500 focus:outline-none min-h-[42px]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">Transfer Date *</label>
          <input
            type="date"
            required
            value={transferDate}
            onChange={(e) => setTransferDate(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#18181f] border border-white/10 rounded-xl text-white text-xs focus:border-crimson-500 focus:outline-none min-h-[42px]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">
            Transaction Receipt / Slip (Image or PDF)
          </label>
          <label className="w-full px-3.5 py-2 bg-[#18181f] hover:border-crimson-500/60 border border-dashed border-white/20 rounded-xl text-xs text-gray-300 flex items-center justify-between gap-2 cursor-pointer min-h-[42px] transition-colors">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
              className="hidden"
            />
            <span className="flex items-center gap-2 truncate">
              <Upload className="w-3.5 h-3.5 text-crimson-400 shrink-0" />
              <span className="truncate">
                {slipFile ? slipFile.name : 'Attach slip now or upload right after submit'}
              </span>
            </span>
            {slipFile && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleFileSelect(null);
                }}
                aria-label="Clear selected slip"
                className="text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </label>
        </div>
      </div>

      {slipPreviewUrl && (
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-black/50 border border-emerald-600/40">
          <img src={slipPreviewUrl} alt="Transfer slip preview" className="w-16 h-12 object-cover rounded-lg" />
          <div className="text-[11px] text-emerald-300">
            <strong className="block">Slip Ready to Upload</strong>
            <span className="text-gray-400">{slipFile?.name}</span>
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-300 mb-1">Transaction Notes (Optional)</label>
        <input
          type="text"
          value={receiptNotes}
          onChange={(e) => setReceiptNotes(e.target.value)}
          placeholder="Branch, mobile reference ID, or additional verification note"
          className="w-full px-3.5 py-2.5 bg-[#18181f] border border-white/10 rounded-xl text-white text-xs focus:border-crimson-500 focus:outline-none min-h-[42px]"
        />
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Verified by Coach Adeesha to activate portal access.</span>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-3 bg-crimson-600 hover:bg-crimson-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-crimson-glow cursor-pointer min-h-[44px] shrink-0"
        >
          {submitting
            ? 'Submitting...'
            : slipFile
            ? `Submit & Upload Receipt (Rs. ${totalAmount.toLocaleString()})`
            : `Submit Transfer (Rs. ${totalAmount.toLocaleString()})`}
        </button>
      </div>
    </form>
  );
}
