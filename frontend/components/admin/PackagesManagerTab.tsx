'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Edit3,
  Plus,
  Trash2,
  Check,
  RotateCcw,
  Sparkles,
  Users,
  User,
  ShieldCheck,
  X,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { GymPackage, GYM_PACKAGES } from '@/lib/types';

interface PackagesManagerTabProps {
  onNotify: (type: 'success' | 'error', text: string) => void;
  onAuditLog?: (action: string) => void;
}

export default function PackagesManagerTab({
  onNotify,
  onAuditLog,
}: PackagesManagerTabProps) {
  const [packages, setPackages] = useState<GymPackage[]>(() =>
    JSON.parse(JSON.stringify(GYM_PACKAGES))
  );
  const [admissionFees, setAdmissionFees] = useState({
    sole: 500,
    couple: 1000,
  });
  const [loading, setLoading] = useState(false);

  // Edit Package Modal State
  const [editingPackage, setEditingPackage] = useState<GymPackage | null>(null);
  const [editFormData, setEditFormData] = useState<{
    id: string;
    type: 'sole' | 'couple' | 'coaching';
    name: string;
    price: number;
    admissionFee: number;
    durationLabel: string;
    savings: string;
    popular: boolean;
    bestValue: boolean;
    features: string[];
  } | null>(null);

  // Edit Admission Modal State
  const [editAdmissionOpen, setEditAdmissionOpen] = useState(false);
  const [tempAdmission, setTempAdmission] = useState({ sole: 500, couple: 1000 });

  // Add Feature Input in Edit Modal
  const [newFeatureText, setNewFeatureText] = useState('');

  // Load packages from server / localStorage on mount
  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const res = await fetch('/api/admin/packages');
      if (res.ok) {
        const data = await res.json();
        if (data.packages && Array.isArray(data.packages) && data.packages.length > 0) {
          setPackages(data.packages);
        }
        if (data.admissionFees) {
          setAdmissionFees(data.admissionFees);
          setTempAdmission(data.admissionFees);
        }
      }
    } catch (err) {
      console.warn('Could not fetch server packages, falling back to local defaults:', err);
    }
  };

  const handleOpenEdit = (pkg: GymPackage) => {
    setEditingPackage(pkg);
    setEditFormData({
      id: pkg.id,
      type: pkg.type,
      name: pkg.name,
      price: pkg.price,
      admissionFee:
        pkg.admissionFee !== undefined
          ? pkg.admissionFee
          : pkg.type === 'couple'
          ? admissionFees.couple
          : pkg.type === 'coaching'
          ? 0
          : admissionFees.sole,
      durationLabel: pkg.durationLabel,
      savings: pkg.savings || '',
      popular: !!pkg.popular,
      bestValue: pkg.savings?.includes('14,000') || pkg.savings?.includes('18,000') || false,
      features: [...(pkg.features || [])],
    });
    setNewFeatureText('');
  };

  const handleCloseEdit = () => {
    setEditingPackage(null);
    setEditFormData(null);
  };

  const handleAddFeature = () => {
    if (!newFeatureText.trim() || !editFormData) return;
    setEditFormData({
      ...editFormData,
      features: [...editFormData.features, newFeatureText.trim()],
    });
    setNewFeatureText('');
  };

  const handleRemoveFeature = (index: number) => {
    if (!editFormData) return;
    setEditFormData({
      ...editFormData,
      features: editFormData.features.filter((_, i) => i !== index),
    });
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;
    setLoading(true);

    try {
      const payload = {
        action: 'update_package',
        package: {
          ...editFormData,
          price: Number(editFormData.price),
          admissionFee: Number(editFormData.admissionFee),
        },
      };

      const res = await fetch('/api/admin/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.packages) {
          setPackages(data.packages);
        } else {
          setPackages((prev) =>
            prev.map((p) => (p.id === editFormData.id ? { ...p, ...editFormData } : p))
          );
        }
        onNotify('success', `Package "${editFormData.name}" updated to Rs. ${Number(editFormData.price).toLocaleString()} LKR!`);
        if (onAuditLog) {
          onAuditLog(`Edited package pricing: ${editFormData.name} -> Rs. ${Number(editFormData.price).toLocaleString()} LKR`);
        }
        handleCloseEdit();
      } else {
        const err = await res.json();
        onNotify('error', err.error || 'Failed to update package');
      }
    } catch (err: any) {
      onNotify('error', err.message || 'Error updating package');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAdmission = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/admin/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_admission',
          admissionFees: {
            sole: Number(tempAdmission.sole),
            couple: Number(tempAdmission.couple),
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAdmissionFees(data.admissionFees || tempAdmission);
        onNotify(
          'success',
          `Admission fees updated: Sole Rs. ${Number(tempAdmission.sole).toLocaleString()} · Couple Rs. ${Number(tempAdmission.couple).toLocaleString()}`
        );
        if (onAuditLog) {
          onAuditLog(`Updated global admission fees: Sole Rs. ${tempAdmission.sole}, Couple Rs. ${tempAdmission.couple}`);
        }
        setEditAdmissionOpen(false);
      } else {
        onNotify('error', 'Failed to update admission fees');
      }
    } catch (err: any) {
      onNotify('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!confirm('Are you sure you want to reset all packages and admission fees to the official default rates?')) {
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/admin/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });

      if (res.ok) {
        const data = await res.json();
        setPackages(data.packages);
        setAdmissionFees(data.admissionFees);
        setTempAdmission(data.admissionFees);
        onNotify('success', 'All packages successfully restored to official default rates.');
        if (onAuditLog) {
          onAuditLog('Reset all gym packages to default rate card');
        }
      }
    } catch (err: any) {
      onNotify('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const soleList = packages.filter((p) => p.type === 'sole');
  const coupleList = packages.filter((p) => p.type === 'couple');
  const coachingList = packages.filter(
    (p) => p.type === 'coaching' || p.id === 'burnzone' || p.id === 'coaching_90'
  );

  return (
    <div className="space-y-6">
      {/* ── Top Header & Rate Card Architecture ── */}
      <div className="bg-[#111116] border border-white/[0.08] p-6 rounded-3xl shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-crimson-950 border border-crimson-600 flex items-center justify-center text-crimson-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Membership Packages & Pricing Master Desk
              </h2>
              <p className="text-xs text-gray-400">
                Configure rates in Sri Lankan Rupees (LKR), modify duration discounts, and calibrate one-time admission fees.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-crimson-950/40 border border-crimson-800/40 px-3.5 py-1.5 rounded-xl text-xs text-crimson-300 font-mono">
            <span>Admission: <strong>Rs. {admissionFees.sole.toLocaleString()}</strong> Sole · <strong>Rs. {admissionFees.couple.toLocaleString()}</strong> Couple</span>
          </div>

          <button
            type="button"
            onClick={() => setEditAdmissionOpen(true)}
            className="px-3 py-1.5 bg-[#181822] hover:bg-[#20202d] text-gray-200 hover:text-white border border-white/10 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-crimson-400" />
            <span>Edit Admission Fees</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={loading}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Restore official rate card"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Defaults</span>
          </button>
        </div>
      </div>

      {/* ── SECTION 1: SOLE MEMBERSHIPS (INDIVIDUAL ACCESS) ── */}
      <div className="bg-[#111116] border border-white/[0.08] rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-crimson-500 shadow-[0_0_8px_rgba(186,26,26,0.8)]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Sole Membership Packages (Individual Access)
            </h3>
            <span className="text-[11px] text-gray-400 font-mono">
              ({soleList.length} Active Tiers)
            </span>
          </div>
          <span className="text-xs text-gray-400 hidden sm:inline">
            One-time admission: <strong className="text-crimson-400">Rs. {admissionFees.sole.toLocaleString()} LKR</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {soleList.map((pkg) => {
            const admission = pkg.admissionFee ?? admissionFees.sole;
            const totalStart = pkg.price + admission;
            const isBest = pkg.savings?.includes('14,000') || pkg.duration === '1_year';

            return (
              <div
                key={pkg.id}
                className="p-5 rounded-2xl bg-[#16161f] border border-white/[0.06] hover:border-crimson-500/40 transition-all relative flex flex-col justify-between group"
              >
                {pkg.popular && (
                  <span className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-wider bg-crimson-600 text-white px-2 py-0.5 rounded-full shadow">
                    Popular
                  </span>
                )}
                {isBest && !pkg.popular && (
                  <span className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white px-2 py-0.5 rounded-full shadow">
                    Best Value
                  </span>
                )}

                <div>
                  <span className="text-xs text-gray-400 font-semibold block">{pkg.name}</span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold text-white font-mono">
                      Rs. {pkg.price.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-gray-400">/ {pkg.durationLabel}</span>
                  </div>

                  {pkg.savings && (
                    <span className="text-[11px] text-crimson-400 font-semibold block mt-0.5">
                      {pkg.savings}
                    </span>
                  )}

                  <div className="mt-3 pt-3 border-t border-white/[0.06] text-[11px] text-gray-400 space-y-1 font-sans">
                    <div className="flex justify-between">
                      <span>Admission Fee:</span>
                      <strong className="text-gray-200">Rs. {admission.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Starting Total:</span>
                      <strong className="text-white">Rs. {totalStart.toLocaleString()}</strong>
                    </div>
                  </div>

                  {pkg.features && pkg.features.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-white/[0.04] space-y-1">
                      {pkg.features.slice(0, 3).map((feat, idx) => (
                        <div key={idx} className="text-[10.5px] text-gray-400 flex items-start gap-1.5 line-clamp-1">
                          <Check className="w-3 h-3 text-crimson-400 flex-shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                      {pkg.features.length > 3 && (
                        <span className="text-[10px] text-gray-500 font-mono block pl-4.5">
                          +{pkg.features.length - 3} more perks
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(pkg)}
                    className="w-full py-2 px-3 bg-white/[0.04] hover:bg-crimson-600 hover:text-white text-gray-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Package</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SECTION 2: COUPLE MEMBERSHIPS (2 PARTNER ACCESS) ── */}
      <div className="bg-[#111116] border border-white/[0.08] rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Couple Membership Packages (2 Partner Access)
            </h3>
            <span className="text-[11px] text-gray-400 font-mono">
              ({coupleList.length} Active Tiers)
            </span>
          </div>
          <span className="text-xs text-gray-400 hidden sm:inline">
            One-time admission: <strong className="text-purple-400">Rs. {admissionFees.couple.toLocaleString()} LKR</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {coupleList.map((pkg) => {
            const admission = pkg.admissionFee ?? admissionFees.couple;
            const totalStart = pkg.price + admission;
            const perPerson = Math.round(pkg.price / 2);
            const isBest = pkg.savings?.includes('18,000') || pkg.duration === '1_year';

            return (
              <div
                key={pkg.id}
                className="p-5 rounded-2xl bg-[#16161f] border border-white/[0.06] hover:border-purple-500/40 transition-all relative flex flex-col justify-between group"
              >
                {pkg.popular && (
                  <span className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-wider bg-purple-600 text-white px-2 py-0.5 rounded-full shadow">
                    Popular Duo
                  </span>
                )}
                {isBest && !pkg.popular && (
                  <span className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-wider bg-indigo-600 text-white px-2 py-0.5 rounded-full shadow">
                    Best Value
                  </span>
                )}

                <div>
                  <span className="text-xs text-gray-400 font-semibold block">{pkg.name}</span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold text-white font-mono">
                      Rs. {pkg.price.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-gray-400">/ 2 people</span>
                  </div>

                  <span className="text-[11px] text-purple-400 font-semibold block mt-0.5">
                    ~Rs. {perPerson.toLocaleString()} per person {pkg.savings ? `(${pkg.savings})` : ''}
                  </span>

                  <div className="mt-3 pt-3 border-t border-white/[0.06] text-[11px] text-gray-400 space-y-1 font-sans">
                    <div className="flex justify-between">
                      <span>Admission (2 Pax):</span>
                      <strong className="text-gray-200">Rs. {admission.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Starting Total:</span>
                      <strong className="text-white">Rs. {totalStart.toLocaleString()}</strong>
                    </div>
                  </div>

                  {pkg.features && pkg.features.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-white/[0.04] space-y-1">
                      {pkg.features.slice(0, 3).map((feat, idx) => (
                        <div key={idx} className="text-[10.5px] text-gray-400 flex items-start gap-1.5 line-clamp-1">
                          <Check className="w-3 h-3 text-purple-400 flex-shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                      {pkg.features.length > 3 && (
                        <span className="text-[10px] text-gray-500 font-mono block pl-4.5">
                          +{pkg.features.length - 3} more perks
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(pkg)}
                    className="w-full py-2 px-3 bg-white/[0.04] hover:bg-purple-600 hover:text-white text-gray-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Package</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SECTION 3: SIGNATURE COACHING & SPECIALTY PROGRAMS ── */}
      <div className="bg-[#111116] border border-white/[0.08] rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Signature Coaching & Specialty Programs (Coach Adeesha)
            </h3>
            <span className="text-[11px] text-gray-400 font-mono">
              ({coachingList.length} Active Programs)
            </span>
          </div>
          <span className="text-xs text-amber-400/90 font-medium hidden sm:inline">
            Directly supervised by NVQ & ISO Certified Coach Adeesha
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {coachingList.map((pkg) => {
            const admission = pkg.admissionFee ?? (pkg.id === 'burnzone' ? 500 : 0);
            const totalStart = pkg.price + admission;
            const is90Day = pkg.id === 'coaching_90' || pkg.duration === '90_days';

            return (
              <div
                key={pkg.id}
                className="p-5 rounded-2xl bg-[#16161f] border border-amber-500/20 hover:border-amber-500/50 transition-all relative flex flex-col justify-between group shadow-lg"
              >
                {pkg.popular && (
                  <span className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-wider bg-amber-500 text-black px-2 py-0.5 rounded-full shadow">
                    {is90Day ? 'VIP Flagship' : 'High Intensity'}
                  </span>
                )}

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-400 font-bold block">{pkg.name}</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold text-white font-mono">
                      Rs. {pkg.price.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-gray-400">/ {pkg.durationLabel}</span>
                  </div>

                  {pkg.savings && (
                    <span className="text-[11px] text-emerald-400 font-semibold block mt-0.5">
                      {pkg.savings}
                    </span>
                  )}

                  <div className="mt-3 pt-3 border-t border-white/[0.06] text-[11px] text-gray-400 space-y-1 font-sans">
                    <div className="flex justify-between">
                      <span>Admission Fee:</span>
                      <strong className="text-gray-200">
                        {admission === 0 ? 'Rs. 0 (Waived)' : `Rs. ${admission.toLocaleString()}`}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Starting Total:</span>
                      <strong className="text-white">Rs. {totalStart.toLocaleString()}</strong>
                    </div>
                  </div>

                  {pkg.features && pkg.features.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-white/[0.04] space-y-1">
                      {pkg.features.slice(0, 4).map((feat, idx) => (
                        <div key={idx} className="text-[10.5px] text-gray-400 flex items-start gap-1.5 line-clamp-1">
                          <Check className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                      {pkg.features.length > 4 && (
                        <span className="text-[10px] text-gray-500 font-mono block pl-4.5">
                          +{pkg.features.length - 4} more coaching perks
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(pkg)}
                    className="w-full py-2 px-3 bg-white/[0.04] hover:bg-amber-500 hover:text-black text-gray-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Package</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          EDIT PACKAGE MODAL (Responsive, pinned header, scroll body)
          ═══════════════════════════════════════════════════════════════ */}
      {editingPackage && editFormData && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseEdit();
          }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden"
        >
          <div className="bg-[#111116] border border-crimson-800/60 rounded-3xl max-w-xl w-full shadow-2xl relative flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden">
            {/* Pinned Header */}
            <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between flex-shrink-0 bg-[#14141d]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-crimson-950 border border-crimson-600 flex items-center justify-center text-crimson-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Edit Package: {editingPackage.name}
                  </h3>
                  <p className="text-xs text-gray-400">
                    Modify price in LKR, duration discounts, and featured benefits.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseEdit}
                className="text-gray-400 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSavePackage} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-4">
                {/* Package Name */}
                <div>
                  <label htmlFor="editPkgName" className="text-xs font-bold text-gray-300 block mb-1.5">
                    Package Title / Display Name:
                  </label>
                  <input
                    id="editPkgName"
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full bg-[#161620] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-crimson-500 min-h-[44px]"
                  />
                </div>

                {/* Price & Admission Fee */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="editPkgPrice" className="text-xs font-bold text-gray-300 block mb-1.5">
                      Package Price (LKR):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono">
                        Rs.
                      </span>
                      <input
                        id="editPkgPrice"
                        type="number"
                        min="0"
                        step="500"
                        required
                        value={editFormData.price}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, price: Number(e.target.value) })
                        }
                        className="w-full bg-[#161620] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-crimson-500 min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="editPkgAdmission" className="text-xs font-bold text-gray-300 block mb-1.5">
                      Admission Fee (LKR):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono">
                        Rs.
                      </span>
                      <input
                        id="editPkgAdmission"
                        type="number"
                        min="0"
                        step="100"
                        required
                        value={editFormData.admissionFee}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            admissionFee: Number(e.target.value),
                          })
                        }
                        className="w-full bg-[#161620] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-crimson-500 min-h-[44px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Duration Label & Savings Note */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="editPkgDuration" className="text-xs font-bold text-gray-300 block mb-1.5">
                      Duration Label:
                    </label>
                    <input
                      id="editPkgDuration"
                      type="text"
                      required
                      placeholder="e.g. 3 Months"
                      value={editFormData.durationLabel}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, durationLabel: e.target.value })
                      }
                      className="w-full bg-[#161620] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-crimson-500 min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label htmlFor="editPkgSavings" className="text-xs font-bold text-gray-300 block mb-1.5">
                      Savings Note (Optional):
                    </label>
                    <input
                      id="editPkgSavings"
                      type="text"
                      placeholder="e.g. Save Rs. 1,500"
                      value={editFormData.savings}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, savings: e.target.value })
                      }
                      className="w-full bg-[#161620] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-crimson-500 min-h-[44px]"
                    />
                  </div>
                </div>

                {/* Popular / Best Value Flags */}
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editFormData.popular}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, popular: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-crimson-600 focus:ring-crimson-500 bg-[#161620] border-white/10"
                    />
                    <span className="text-xs text-gray-300 font-semibold">Mark as &quot;Popular&quot;</span>
                  </label>
                </div>

                {/* Features List */}
                <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                  <label className="text-xs font-bold text-gray-300 block">
                    Included Features & Perks:
                  </label>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a new feature bullet point..."
                      value={newFeatureText}
                      onChange={(e) => setNewFeatureText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddFeature();
                        }
                      }}
                      className="flex-1 bg-[#161620] border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-crimson-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="px-4 py-2 bg-crimson-600 hover:bg-crimson-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {editFormData.features.map((feat, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-[#161620] border border-white/5 flex items-center justify-between text-xs text-gray-300 gap-2"
                      >
                        <span className="truncate flex-1">{feat}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          className="text-gray-500 hover:text-rose-400 p-1 cursor-pointer"
                          aria-label="Remove feature"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Preview Calculation */}
                <div className="p-3.5 rounded-xl bg-[#0d0d12] border border-white/[0.06] text-xs text-gray-300 flex items-center justify-between">
                  <span>Calculated Initial Total:</span>
                  <span className="font-bold text-white font-mono text-sm">
                    Rs. {(Number(editFormData.price) + Number(editFormData.admissionFee)).toLocaleString()} LKR
                  </span>
                </div>
              </div>

              {/* Pinned Footer */}
              <div className="px-6 py-4 border-t border-white/[0.08] flex items-center justify-end gap-3 flex-shrink-0 bg-[#0c0c11]">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:text-white text-xs font-bold min-h-[44px] cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-crimson-600 hover:bg-crimson-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(186,26,26,0.5)] min-h-[44px] flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{loading ? 'Saving...' : 'Save Package'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          EDIT ADMISSION FEES MODAL
          ═══════════════════════════════════════════════════════════════ */}
      {editAdmissionOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditAdmissionOpen(false);
          }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden"
        >
          <div className="bg-[#111116] border border-crimson-800/60 rounded-3xl max-w-md w-full shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden">
            <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between flex-shrink-0 bg-[#14141d]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-crimson-950 border border-crimson-600 flex items-center justify-center text-crimson-400">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Edit Admission Fees
                  </h3>
                  <p className="text-xs text-gray-400">
                    One-time registration and keycard setup charges.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditAdmissionOpen(false)}
                className="text-gray-400 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdmission} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1.5">
                  Sole Membership Admission Fee (LKR):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono">
                    Rs.
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={tempAdmission.sole}
                    onChange={(e) =>
                      setTempAdmission({ ...tempAdmission, sole: Number(e.target.value) })
                    }
                    className="w-full bg-[#161620] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-crimson-500 min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1.5">
                  Couple Membership Admission Fee (LKR):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono">
                    Rs.
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={tempAdmission.couple}
                    onChange={(e) =>
                      setTempAdmission({ ...tempAdmission, couple: Number(e.target.value) })
                    }
                    className="w-full bg-[#161620] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-crimson-500 min-h-[44px]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.08] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditAdmissionOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:text-white text-xs font-bold min-h-[44px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-crimson-600 hover:bg-crimson-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(186,26,26,0.5)] min-h-[44px] flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{loading ? 'Saving...' : 'Update Admission Fees'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
