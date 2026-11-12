'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Check,
  Eye,
  X,
  ExternalLink,
  Download,
  AlertCircle,
  FileText,
  User,
  Calendar,
  Building,
  DollarSign,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from 'lucide-react';
import { PaymentRecord } from '@/lib/types';

interface BankApprovalsTabProps {
  payments: PaymentRecord[];
  isLoading?: boolean;
  onApprove: (paymentId: string) => Promise<void>;
  onReject: (paymentId: string, reason?: string) => Promise<void>;
  onRefresh?: () => Promise<void>;
}

export default function BankApprovalsTab({
  payments,
  isLoading,
  onApprove,
  onReject,
  onRefresh,
}: BankApprovalsTabProps) {
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [inspectingSlip, setInspectingSlip] = useState<PaymentRecord | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  // Filter payments
  const filteredPayments = payments.filter((p) => {
    const matchesFilter = paymentFilter === 'all' || p.status === paymentFilter;
    const searchLower = paymentSearch.toLowerCase().trim();
    if (!searchLower) return matchesFilter;

    const matchesSearch =
      p.referenceCode.toLowerCase().includes(searchLower) ||
      (p.userName && p.userName.toLowerCase().includes(searchLower)) ||
      (p.userEmail && p.userEmail.toLowerCase().includes(searchLower)) ||
      (p.bankName && p.bankName.toLowerCase().includes(searchLower)) ||
      (p.senderAccountName && p.senderAccountName.toLowerCase().includes(searchLower));

    return matchesFilter && matchesSearch;
  });

  const pendingCount = payments.filter((p) => p.status === 'pending').length;
  const approvedCount = payments.filter((p) => p.status === 'approved').length;
  const rejectedCount = payments.filter((p) => p.status === 'rejected').length;

  const handleApproveAction = async (id: string) => {
    setIsProcessing(true);
    try {
      await onApprove(id);
      if (inspectingSlip?.id === id) {
        setInspectingSlip((prev) => (prev ? { ...prev, status: 'approved' } : null));
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectAction = async () => {
    if (!rejectingId) return;
    setIsProcessing(true);
    try {
      await onReject(rejectingId, rejectReason || 'Payment slip verification failed.');
      if (inspectingSlip?.id === rejectingId) {
        setInspectingSlip((prev) => (prev ? { ...prev, status: 'rejected' } : null));
      }
      setRejectingId(null);
      setRejectReason('');
    } finally {
      setIsProcessing(false);
    }
  };

  const openSlipModal = (payment: PaymentRecord) => {
    setInspectingSlip(payment);
    setZoomLevel(1);
    setRotation(0);
  };

  if (isLoading && payments.length === 0) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111116] border border-white/[0.08] p-5 rounded-2xl">
          <div className="space-y-2">
            <div className="h-6 w-64 bg-white/15 rounded-xl" />
            <div className="h-3 w-80 bg-white/5 rounded-lg" />
          </div>
          <div className="h-9 w-64 bg-white/10 rounded-xl" />
        </div>

        {/* Search Bar Skeleton */}
        <div className="h-11 w-full bg-[#111116] border border-white/[0.08] rounded-xl" />

        {/* Payment Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-[#111116] border border-white/[0.08] rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-4 w-28 bg-white/15 rounded" />
                <div className="h-5 w-20 bg-white/10 rounded-full" />
              </div>
              <div className="h-40 w-full bg-white/[0.03] rounded-xl flex items-center justify-center">
                <div className="h-6 w-32 bg-white/5 rounded-lg" />
              </div>
              <div className="space-y-2">
                <div className="h-3.5 w-40 bg-white/15 rounded" />
                <div className="h-3 w-48 bg-white/5 rounded" />
              </div>
              <div className="flex gap-2 pt-2 border-t border-white/[0.06]">
                <div className="h-9 flex-1 bg-white/10 rounded-xl" />
                <div className="h-9 flex-1 bg-crimson-900/30 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111116] border border-white/[0.08] p-5 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-crimson-500" />
            Bank Transfer Slips & Payment Verification
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Review submitted bank slips, match reference codes, and approve member activations in 1-click.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-[#181822] p-1 rounded-xl border border-white/5 text-xs">
          {[
            { id: 'all', label: 'All', count: payments.length },
            { id: 'pending', label: 'Pending', count: pendingCount, highlight: pendingCount > 0 },
            { id: 'approved', label: 'Approved', count: approvedCount },
            { id: 'rejected', label: 'Rejected', count: rejectedCount },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setPaymentFilter(st.id as any)}
              className={`px-3 py-1.5 rounded-lg font-semibold uppercase text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                paymentFilter === st.id
                  ? 'bg-crimson-600 text-white font-bold shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>{st.label}</span>
              {st.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    st.highlight && paymentFilter !== st.id
                      ? 'bg-amber-500/20 text-amber-300 font-bold'
                      : 'bg-white/10 text-gray-300'
                  }`}
                >
                  {st.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by reference code (TRF-MC-...), member name, email, or bank..."
          value={paymentSearch}
          onChange={(e) => setPaymentSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-[#111116] border border-white/[0.08] rounded-xl text-xs text-white placeholder:text-gray-500 focus:border-crimson-500 focus:outline-none transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-[#111116] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#16161f] text-gray-400 uppercase text-[10px] tracking-wider border-b border-white/[0.06]">
              <tr>
                <th className="py-3.5 px-4 font-bold">Reference / Date</th>
                <th className="py-3.5 px-4 font-bold">Member & Contact</th>
                <th className="py-3.5 px-4 font-bold">Package & Tier</th>
                <th className="py-3.5 px-4 font-bold">Amount (LKR)</th>
                <th className="py-3.5 px-4 font-bold">Bank & Slip Details</th>
                <th className="py-3.5 px-4 font-bold">Status</th>
                <th className="py-3.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <CreditCard className="w-8 h-8 text-gray-600 mb-1" />
                      <span className="text-sm font-medium text-gray-400">No payment records found</span>
                      <span className="text-xs text-gray-600">Try adjusting your filter or search query.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Reference / Date */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-white block">{p.referenceCode}</span>
                      <span className="text-[10px] text-gray-500">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : p.transferDate}
                      </span>
                    </td>

                    {/* Member & Contact */}
                    <td className="py-4 px-4">
                      <span className="font-semibold text-white block">{p.userName}</span>
                      <span className="text-[11px] text-gray-400 block">{p.userEmail || '—'}</span>
                    </td>

                    {/* Package & Tier */}
                    <td className="py-4 px-4">
                      <span className="font-semibold text-gray-200 block">{p.packageName || p.tier}</span>
                      {p.admissionFee && p.admissionFee > 0 ? (
                        <span className="text-[10px] text-crimson-400 font-mono">
                          Includes Rs. {p.admissionFee.toLocaleString()} Admission
                        </span>
                      ) : null}
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="text-sm font-bold font-mono text-white block">
                        Rs. {p.amount.toLocaleString()} LKR
                      </span>
                    </td>

                    {/* Bank & Slip Details */}
                    <td className="py-4 px-4 max-w-xs">
                      <span className="text-gray-300 font-medium block truncate">{p.bankName}</span>
                      <span className="text-[11px] text-gray-400 block truncate">
                        Sender: {p.senderAccountName}
                      </span>
                      {p.receiptNotes && (
                        <span className="text-[10px] text-gray-500 italic block truncate mt-0.5">
                          Note: {p.receiptNotes}
                        </span>
                      )}

                      {/* Slip Action Preview Button */}
                      {p.receiptUrl ? (
                        <button
                          type="button"
                          onClick={() => openSlipModal(p)}
                          className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-crimson-950/80 hover:bg-crimson-900 border border-crimson-700/60 text-crimson-300 text-[11px] font-mono font-medium transition-colors cursor-pointer group"
                        >
                          <Eye className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                          <span>View Slip Receipt</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-500 font-mono block mt-1">
                          Manual Reference Only
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {p.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-700/50">
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </span>
                      )}
                      {p.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
                          <Clock className="w-3 h-3 text-amber-400" /> Awaiting Review
                        </span>
                      )}
                      {p.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-rose-300 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/30">
                          <XCircle className="w-3 h-3 text-rose-400" /> Rejected
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      {p.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          {p.receiptUrl && (
                            <button
                              type="button"
                              onClick={() => openSlipModal(p)}
                              title="Inspect Slip"
                              className="p-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-white border border-white/10 rounded-lg text-xs transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleApproveAction(p.id)}
                            disabled={isProcessing}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-sm disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRejectingId(p.id);
                              setRejectReason('');
                            }}
                            disabled={isProcessing}
                            className="px-3 py-1.5 bg-white/[0.03] hover:bg-rose-950/40 text-zinc-400 hover:text-rose-300 border border-white/[0.08] hover:border-rose-500/30 rounded-lg font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          {p.receiptUrl && (
                            <button
                              type="button"
                              onClick={() => openSlipModal(p)}
                              className="text-[11px] text-gray-400 hover:text-white underline font-mono flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> Slip
                            </button>
                          )}
                          <span className="text-[11px] text-gray-500">
                            {p.reviewedAt ? `Reviewed ${new Date(p.reviewedAt).toLocaleDateString()}` : 'Archived'}
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────
          MODAL: INTERACTIVE BANK SLIP PREVIEW & VERIFICATION
          ─────────────────────────────────────────────────────────── */}
      {inspectingSlip && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6"
        >
          <div className="bg-[#111116] border border-crimson-800/60 rounded-3xl max-w-5xl w-full shadow-2xl relative flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-gradient-to-r from-crimson-950/40 to-[#111116] flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-crimson-950 border border-crimson-700/60 text-crimson-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-extrabold text-sm sm:text-base">
                      Bank Transfer Slip Verification
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-gray-300">
                      {inspectingSlip.referenceCode}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400">
                    Sender: <strong className="text-white">{inspectingSlip.senderAccountName}</strong> • {inspectingSlip.bankName}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {inspectingSlip.receiptUrl && (
                  <a
                    href={inspectingSlip.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                    title="Open Full Image in New Tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setInspectingSlip(null)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Split view (Left: Slip image preview, Right: Verification Details) */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]">
              {/* Left Column: Slip Preview Display */}
              <div className="lg:col-span-7 bg-black/60 p-4 sm:p-6 flex flex-col items-center justify-center min-h-[380px] relative">
                {/* Image controls toolbar */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-[#181822]/90 backdrop-blur-sm border border-white/10 rounded-xl p-1 z-10">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
                    className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono text-gray-400 px-1">{Math.round(zoomLevel * 100)}%</span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                    className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                    title="Rotate 90°"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {inspectingSlip.receiptUrl ? (
                  <div className="w-full h-full flex items-center justify-center overflow-auto max-h-[58vh] p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={inspectingSlip.receiptUrl}
                      alt={`Receipt slip for ${inspectingSlip.referenceCode}`}
                      className="max-h-[54vh] max-w-full object-contain rounded-xl shadow-2xl transition-transform duration-200 border border-white/10"
                      style={{
                        transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-8 space-y-3">
                    <div className="p-4 rounded-full bg-white/5 border border-white/10 text-gray-500">
                      <FileText className="w-10 h-10" />
                    </div>
                    <span className="text-sm font-semibold text-gray-300">
                      No Digital Slip Image Attached
                    </span>
                    <p className="text-xs text-gray-500 max-w-xs">
                      This bank transfer was recorded via reference code directly without an uploaded receipt attachment. Verify with your domestic online banking portal.
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: Transaction & Member Verification Details */}
              <div className="lg:col-span-5 p-5 sm:p-6 bg-[#121217] flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                    <span className="text-xs text-gray-400 font-medium">Reconciliation Status:</span>
                    {inspectingSlip.status === 'approved' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-700/50">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approved & Active
                      </span>
                    )}
                    {inspectingSlip.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
                        <Clock className="w-3.5 h-3.5 text-amber-400" /> Awaiting Review
                      </span>
                    )}
                    {inspectingSlip.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-rose-300 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/30">
                        <XCircle className="w-3.5 h-3.5 text-rose-400" /> Rejected
                      </span>
                    )}
                  </div>

                  {/* Financial Total */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-crimson-950/60 to-black border border-crimson-700/40">
                    <span className="text-[10px] uppercase font-bold text-crimson-400 tracking-wider block">
                      Total Transfer Amount
                    </span>
                    <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white mt-1 block">
                      Rs. {inspectingSlip.amount.toLocaleString()} LKR
                    </span>
                    {inspectingSlip.admissionFee && inspectingSlip.admissionFee > 0 ? (
                      <span className="text-[11px] text-crimson-300 font-mono mt-1 block">
                        Includes Rs. {inspectingSlip.admissionFee.toLocaleString()} One-time Admission
                      </span>
                    ) : null}
                  </div>

                  {/* Metadata Grid */}
                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                      <div className="flex justify-between items-center text-gray-400">
                        <span>Package / Plan:</span>
                        <strong className="text-white font-semibold">{inspectingSlip.packageName || inspectingSlip.tier}</strong>
                      </div>
                      <div className="flex justify-between items-center text-gray-400">
                        <span>Bank Name:</span>
                        <strong className="text-white">{inspectingSlip.bankName}</strong>
                      </div>
                      <div className="flex justify-between items-center text-gray-400">
                        <span>Sender Account:</span>
                        <strong className="text-emerald-300 font-mono">{inspectingSlip.senderAccountName}</strong>
                      </div>
                      <div className="flex justify-between items-center text-gray-400">
                        <span>Transfer Date:</span>
                        <strong className="text-gray-200 font-mono">{inspectingSlip.transferDate}</strong>
                      </div>
                      <div className="flex justify-between items-center text-gray-400">
                        <span>Member Name:</span>
                        <strong className="text-white">{inspectingSlip.userName}</strong>
                      </div>
                      {inspectingSlip.userEmail && (
                        <div className="flex justify-between items-center text-gray-400">
                          <span>Email:</span>
                          <span className="text-gray-300 font-mono text-[11px]">{inspectingSlip.userEmail}</span>
                        </div>
                      )}
                    </div>

                    {inspectingSlip.receiptNotes && (
                      <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-200">
                        <span className="text-[10px] font-bold uppercase tracking-wider block text-amber-400 mb-0.5">
                          Member Notes:
                        </span>
                        <p className="text-[11px] italic leading-relaxed">{inspectingSlip.receiptNotes}</p>
                      </div>
                    )}

                    {inspectingSlip.adminNotes && (
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-gray-300">
                        <span className="text-[10px] font-bold uppercase tracking-wider block text-gray-500 mb-0.5">
                          Audit Trail Note:
                        </span>
                        <p className="text-[11px] font-mono leading-relaxed">{inspectingSlip.adminNotes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* In-Modal Actions */}
                <div className="pt-4 border-t border-white/[0.08] space-y-2">
                  {inspectingSlip.status === 'pending' ? (
                    <div className="flex flex-col sm:flex-row items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleApproveAction(inspectingSlip.id)}
                        disabled={isProcessing}
                        className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" /> Approve & Activate Member
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingId(inspectingSlip.id);
                          setRejectReason('');
                        }}
                        disabled={isProcessing}
                        className="w-full sm:w-auto py-3 px-4 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-700/60 text-rose-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-white/[0.02] text-center text-xs text-gray-400 font-mono">
                      ✓ This record has already been processed by management.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────
          MODAL: REJECT PAYMENT DIALOG
          ─────────────────────────────────────────────────────────── */}
      {rejectingId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div className="bg-[#121217] border border-rose-500/50 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-950 border border-rose-700/60 text-rose-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-white font-bold text-base">Reject Bank Transfer</h3>
                <span className="text-xs text-gray-400">Provide a reason for the member and audit trail.</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                Rejection Reason *
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Reference code did not appear on domestic bank statement, or amount transferred was insufficient."
                rows={3}
                className="w-full bg-[#181822] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingId(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectAction}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer shadow disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
