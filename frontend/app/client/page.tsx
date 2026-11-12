'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/context/auth-context';
import {
  Calendar,
  Video,
  Utensils,
  TrendingDown,
  TrendingUp,
  Clock,
  ExternalLink,
  Plus,
  Play,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  ShieldAlert,
  LogOut,
  Upload,
  Eye,
  CreditCard,
  Building,
  Scale,
  ClipboardList,
  X,
  Check,
} from 'lucide-react';
import { BodyMeasurement, DietPlan, Appointment, ExerciseVideo, PaymentRecord, GYM_PACKAGES } from '@/lib/types';
import MuscleCraftVideoPlayer from '@/components/video/MuscleCraftVideoPlayer';

export default function ClientDashboard() {
  const router = useRouter();
  const { currentUser, logout, loading: authLoading } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };
  const [activeTab, setActiveTab] = useState<'overview' | 'measurements' | 'diet' | 'videos' | 'billing'>('overview');

  // Data states
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [videos, setVideos] = useState<ExerciseVideo[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<ExerciseVideo | null>(null);

  // Form states for logging measurement
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [newBodyFat, setNewBodyFat] = useState('');
  const [newWaist, setNewWaist] = useState('');
  const [newChest, setNewChest] = useState('');
  const [newArms, setNewArms] = useState('');
  const [measNotes, setMeasNotes] = useState('');
  const [measSubmitting, setMeasSubmitting] = useState(false);
  const [measError, setMeasError] = useState<string | null>(null);

  // Bank Transfer Slip Submission & Viewer States
  const [slipModalOpen, setSlipModalOpen] = useState(false);
  const [viewSlipModalRecord, setViewSlipModalRecord] = useState<PaymentRecord | null>(null);
  const [proposedRefCode, setProposedRefCode] = useState('');
  const [slipPackageTier, setSlipPackageTier] = useState<string>('sole_1m');
  const [slipBankName, setSlipBankName] = useState<string>('Commercial Bank of Ceylon');
  const [slipTransferDate, setSlipTransferDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [slipSenderName, setSlipSenderName] = useState<string>('');
  const [slipRefCode, setSlipRefCode] = useState<string>('');
  const [slipNotes, setSlipNotes] = useState<string>('');
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreviewUrl, setSlipPreviewUrl] = useState<string>('');
  const [isUploadingSlip, setIsUploadingSlip] = useState(false);
  const [slipStatusMessage, setSlipStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (currentUser) {
      setSlipSenderName(currentUser.name || '');
      setSlipPackageTier(currentUser.tier || 'sole_1m');
      loadClientData();
    }
  }, [currentUser]);

  const loadClientData = async () => {
    if (!currentUser) return;
    try {
      // 1. Fetch Measurements
      const measRes = await fetch(`/api/measurements?userId=${currentUser.id}&clientId=${currentUser.id}`);
      if (measRes.ok) {
        const d = await measRes.json();
        setMeasurements(d.measurements || []);
      }

      // 2. Fetch Diet Plan
      const dietRes = await fetch(`/api/diet-plans?userId=${currentUser.id}&clientId=${currentUser.id}`);
      if (dietRes.ok) {
        const d = await dietRes.json();
        setDietPlan(d.dietPlan || null);
      }

      // 3. Fetch Appointments
      const aptRes = await fetch(`/api/appointments?userId=${currentUser.id}`);
      if (aptRes.ok) {
        const d = await aptRes.json();
        setAppointments(d.appointments || []);
      }

      // 4. Fetch Videos
      const vidRes = await fetch(`/api/videos?userId=${currentUser.id}`);
      if (vidRes.ok) {
        const d = await vidRes.json();
        setVideos(d.videos || []);
      }

      // 5. Fetch Payments
      const payRes = await fetch(`/api/payments?userId=${currentUser.id}`);
      if (payRes.ok) {
        const d = await payRes.json();
        setPayments(d.payments || []);
        if (d.referenceCodeProposal) {
          setProposedRefCode(d.referenceCodeProposal);
          if (!slipRefCode) setSlipRefCode(d.referenceCodeProposal);
        }
      }
    } catch (err) {
      console.error('Error loading client data:', err);
    }
  };

  const handleSlipFileSelect = (file: File | null) => {
    setSlipFile(file);
    if (!file) {
      setSlipPreviewUrl('');
      return;
    }
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSlipPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSlipPreviewUrl('');
    }
  };

  const handleSubmitSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsUploadingSlip(true);
    setSlipStatusMessage(null);

    try {
      let uploadedSlipUrl: string | undefined = undefined;

      // 1. Upload receipt image/PDF if attached
      if (slipFile) {
        const formData = new FormData();
        formData.append('file', slipFile);
        const upRes = await fetch(`/api/payments/upload-slip?userId=${currentUser.id}`, {
          method: 'POST',
          body: formData,
        });

        if (upRes.ok) {
          const upData = await upRes.json();
          uploadedSlipUrl = upData.url;
        } else {
          const err = await upRes.json();
          throw new Error(err.error || 'Failed to upload bank transfer slip.');
        }
      }

      // 2. Submit payment record to ledger
      const finalRef = slipRefCode.trim() || proposedRefCode || `TRF-MC-${Math.floor(100000 + Math.random() * 900000)}`;
      const payRes = await fetch(`/api/payments?userId=${currentUser.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: slipPackageTier,
          referenceCode: finalRef,
          bankName: slipBankName,
          transferDate: slipTransferDate,
          senderAccountName: slipSenderName.trim() || currentUser.name,
          receiptNotes: slipNotes.trim() || undefined,
          receiptUrl: uploadedSlipUrl,
        }),
      });

      if (!payRes.ok) {
        const err = await payRes.json();
        throw new Error(err.error || 'Failed to submit bank transfer record.');
      }

      setSlipStatusMessage({
        type: 'success',
        text: `Bank slip (${finalRef}) submitted successfully! Coach Adeesha will verify and activate your membership shortly.`,
      });

      // Reset form
      setSlipModalOpen(false);
      setSlipFile(null);
      setSlipPreviewUrl('');
      setSlipNotes('');
      await loadClientData();
      setActiveTab('billing');
    } catch (err: any) {
      setSlipStatusMessage({
        type: 'error',
        text: err.message || 'Failed to submit transfer slip. Please try again.',
      });
    } finally {
      setIsUploadingSlip(false);
    }
  };

  const handleAddMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setMeasError(null);

    const weightVal = parseFloat(newWeight);
    if (!weightVal || isNaN(weightVal) || weightVal <= 0 || weightVal > 300) {
      setMeasError('Please enter a valid body weight between 1 kg and 300 kg.');
      return;
    }

    setMeasSubmitting(true);

    try {
      const nextWeek = measurements.length + 1;
      const payload: any = {
        userId: currentUser.id,
        weekNumber: nextWeek,
        date: new Date().toISOString().split('T')[0],
        weightKg: weightVal,
      };

      if (newBodyFat && !isNaN(parseFloat(newBodyFat))) payload.bodyFatPercentage = parseFloat(newBodyFat);
      if (newWaist && !isNaN(parseFloat(newWaist))) payload.waistCm = parseFloat(newWaist);
      if (newChest && !isNaN(parseFloat(newChest))) payload.chestCm = parseFloat(newChest);
      if (newArms && !isNaN(parseFloat(newArms))) payload.armsCm = parseFloat(newArms);
      if (measNotes.trim()) payload.notes = measNotes.trim();

      const res = await fetch(`/api/measurements?userId=${currentUser.id}&clientId=${currentUser.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();

      if (!res.ok || resData.error) {
        setMeasError(resData.error || 'Failed to record measurement. Please check inputs and try again.');
        return;
      }

      setLogModalOpen(false);
      setNewWeight('');
      setNewBodyFat('');
      setNewWaist('');
      setNewChest('');
      setNewArms('');
      setMeasNotes('');
      setMeasError(null);
      await loadClientData();
    } catch (err: any) {
      console.error('Failed to log measurement:', err);
      setMeasError(err.message || 'Connection error while saving weekly check-in.');
    } finally {
      setMeasSubmitting(false);
    }
  };

  const isCoachingVip = currentUser?.tier === 'coaching_90';
  const is90DayClient =
    currentUser?.tier === 'coaching_90' ||
    currentUser?.packageType === 'coaching' ||
    currentUser?.packageName?.toLowerCase().includes('90') ||
    currentUser?.packageName?.toLowerCase().includes('better me');

  const expiryDate = currentUser?.membershipExpiresAt ? new Date(currentUser.membershipExpiresAt) : null;
  const now = Date.now();
  const daysLeft = expiryDate ? Math.ceil((expiryDate.getTime() - now) / (1000 * 60 * 60 * 24)) : null;
  const isExpired = (expiryDate ? expiryDate.getTime() < now : false) || currentUser?.status === 'expired';
  const isExpiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 7;

  // Auto-logout state for expired 90-day coaching clients
  const [show90DayExitModal, setShow90DayExitModal] = useState(false);
  const [autoLogoutSeconds, setAutoLogoutSeconds] = useState(5);

  useEffect(() => {
    if (!currentUser || authLoading) return;

    if (is90DayClient && isExpired) {
      setShow90DayExitModal(true);
      const interval = setInterval(() => {
        setAutoLogoutSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            logout();
            router.push('/login?reason=expired_90day');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentUser, authLoading, is90DayClient, isExpired, logout, router]);

  const handleManual90DayExit = () => {
    logout();
    router.push('/login?reason=expired_90day');
  };

  const latestMeas = measurements.length > 0 ? measurements[measurements.length - 1] : null;
  const initialMeas = measurements.length > 0 ? measurements[0] : null;

  const deltaWeight =
    latestMeas && initialMeas && measurements.length > 1
      ? Number((latestMeas.weightKg - initialMeas.weightKg).toFixed(1))
      : null;

  const deltaFat =
    latestMeas?.bodyFatPercentage && initialMeas?.bodyFatPercentage && measurements.length > 1
      ? Number((latestMeas.bodyFatPercentage - initialMeas.bodyFatPercentage).toFixed(1))
      : null;

  const deltaWaist =
    latestMeas?.waistCm && initialMeas?.waistCm && measurements.length > 1
      ? Number((latestMeas.waistCm - initialMeas.waistCm).toFixed(1))
      : null;

  const deltaArms =
    latestMeas?.armsCm && initialMeas?.armsCm && measurements.length > 1
      ? Number((latestMeas.armsCm - initialMeas.armsCm).toFixed(1))
      : null;

  return (
    <div className="flex flex-col min-h-screen bg-[#080809]">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 sm:pt-36 lg:pt-40 pb-12 sm:pb-16 w-full">
        {/* Member Profile Header */}
        <div className="bg-[#121215] border border-white/[0.08] p-6 sm:p-8 rounded-lg mb-8 shadow-card-dark flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <img
              src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
              alt={currentUser?.name || 'Client Avatar'}
              className="w-16 h-16 rounded-full border-2 border-gold/60 object-cover"
            />
            <div>
              <div className="flex items-center gap-3">
                <h1
                  style={{
                    fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                  }}
                  className="text-[24px] sm:text-[28px] text-white tracking-tight"
                >
                  {currentUser?.name || 'Marcus Vance'}
                </h1>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                    isCoachingVip
                      ? 'bg-gold/20 text-gold border-gold/40'
                      : 'bg-gray-800 text-gray-300 border-gray-700'
                  }`}
                >
                  {isCoachingVip ? '90-Day VIP Coaching' : 'Monthly Member'}
                </span>
                <span className="text-[10px] bg-green-950/80 text-green-400 border border-green-700/60 px-2 py-0.5 rounded font-bold uppercase">
                  {currentUser?.status || 'Active'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 mt-2">
                <span>Email: {currentUser?.email}</span>
                <span>•</span>
                <span>
                  Assigned Coach: <strong className="text-gray-200">{currentUser?.assignedInstructorName || 'Elena Rostova'}</strong>
                </span>
                <span>•</span>
                <span>
                  Valid Through:{' '}
                  <strong className="text-white">
                    {currentUser?.membershipExpiresAt
                      ? new Date(currentUser.membershipExpiresAt).toLocaleDateString()
                      : 'Active'}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setLogModalOpen(true)}
              className="flex-1 md:flex-initial px-4 py-2.5 bg-[#D4A359] hover:bg-[#C2934B] text-[#111111] font-semibold text-[13px] sm:text-[14px] uppercase tracking-wide rounded flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Log Weekly Measurements
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2.5 rounded border border-rose-500/30 hover:border-rose-500/60 bg-rose-950/30 hover:bg-rose-950/50 text-rose-300 hover:text-rose-200 font-semibold text-[13px] sm:text-[14px] uppercase tracking-wide flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Log out of Client Portal"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>

        {/* ── REGULAR MEMBERSHIP NOTIFICATION BANNERS (SOLE & COUPLE) ── */}
        {!is90DayClient && isExpired && (
          <div className="mb-8 p-5 sm:p-6 rounded-2xl bg-crimson-950/70 border-2 border-crimson-600 shadow-[0_0_25px_rgba(186,26,26,0.35)] flex flex-col md:flex-row items-start md:items-center justify-between gap-5 animate-in fade-in duration-300">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-crimson-600 flex items-center justify-center text-white flex-shrink-0 mt-0.5 shadow-lg">
                <AlertCircle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-crimson-600 text-white shadow">
                    Renewal Overdue
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Membership Expired ({Math.abs(daysLeft || 0)} Days Ago)
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-gray-300 mt-1 leading-relaxed">
                  Your <strong className="text-white">{currentUser?.packageName || 'Gym'}</strong> membership concluded on{' '}
                  <strong className="text-crimson-300">
                    {currentUser?.membershipExpiresAt ? new Date(currentUser.membershipExpiresAt).toLocaleDateString() : 'N/A'}
                  </strong>
                  . Access to the gym floor, cardio zone, and locker facilities is paused until your renewal slip is submitted.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setSlipModalOpen(true)}
                className="flex-1 md:flex-initial px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl transition-all shadow-md text-center cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Upload className="w-4 h-4" /> Submit Bank Slip
              </button>
              <Link
                href={`/checkout?tier=${currentUser?.tier || 'sole_1m'}`}
                className="flex-1 md:flex-initial px-5 py-2.5 bg-crimson-600 hover:bg-crimson-500 text-white text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl transition-all shadow-md text-center cursor-pointer"
              >
                Renew Membership
              </Link>
              <a
                href={`https://wa.me/94771234567?text=${encodeURIComponent(
                  `Hi Coach Adeesha, I would like to renew my ${currentUser?.packageName || 'Gym'} membership at MuscleCraft.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all text-center cursor-pointer"
              >
                WhatsApp Desk
              </a>
            </div>
          </div>
        )}

        {!is90DayClient && !isExpired && isExpiringSoon && (
          <div className="mb-8 p-5 sm:p-6 rounded-2xl bg-amber-950/40 border-2 border-amber-500/50 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-5 animate-in fade-in duration-300">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Expiring Soon
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Membership Renewal Due in {daysLeft} Day{daysLeft === 1 ? '' : 's'}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-gray-300 mt-1 leading-relaxed">
                  Your <strong className="text-white">{currentUser?.packageName || 'Gym'}</strong> membership will expire on{' '}
                  <strong className="text-amber-300">
                    {currentUser?.membershipExpiresAt ? new Date(currentUser.membershipExpiresAt).toLocaleDateString() : 'N/A'}
                  </strong>
                  . Renew early to maintain seamless workout routine access without front desk pause.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setSlipModalOpen(true)}
                className="flex-1 md:flex-initial px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl transition-all shadow-md text-center cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Upload className="w-4 h-4" /> Submit Bank Slip
              </button>
              <Link
                href={`/checkout?tier=${currentUser?.tier || 'sole_1m'}`}
                className="flex-1 md:flex-initial px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl transition-all shadow-md text-center cursor-pointer"
              >
                Renew Early
              </Link>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/[0.08] mb-8 overflow-x-auto">
          {[
            { id: 'overview', label: 'Coaching Overview' },
            { id: 'measurements', label: 'Body Analytics & Progress' },
            { id: 'diet', label: 'Nutrition & Macro Protocol' },
            { id: 'videos', label: `Video Vault (${videos.length})` },
            { id: 'billing', label: 'Manual Transfer Records' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-5 text-xs sm:text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-gold text-gold bg-gold/[0.03]'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Quick KPI stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#121215] border border-white/[0.08] p-5 rounded-lg">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                  Current Weight
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1 block">
                  {latestMeas ? `${latestMeas.weightKg} kg` : 'Pending Entry'}
                </span>
                {measurements.length > 1 && deltaWeight !== null ? (
                  <span
                    className={`text-[11px] flex items-center gap-1 mt-1 font-medium ${
                      deltaWeight <= 0 ? 'text-green-400' : 'text-gold'
                    }`}
                  >
                    {deltaWeight <= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                    {deltaWeight > 0 ? `+${deltaWeight}` : deltaWeight}kg since Week 1
                  </span>
                ) : measurements.length === 1 ? (
                  <span className="text-[11px] text-gray-400 flex items-center gap-1 mt-1 font-medium">
                    Week 1 baseline established
                  </span>
                ) : (
                  <span className="text-[11px] text-gray-500 flex items-center gap-1 mt-1 font-medium">
                    No weekly logs recorded
                  </span>
                )}
              </div>

              <div className="bg-[#121215] border border-white/[0.08] p-5 rounded-lg">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                  Body Fat Recomp
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1 block">
                  {latestMeas?.bodyFatPercentage ? `${latestMeas.bodyFatPercentage} %` : 'Pending Entry'}
                </span>
                {measurements.length > 1 && deltaFat !== null ? (
                  <span
                    className={`text-[11px] flex items-center gap-1 mt-1 font-medium ${
                      deltaFat <= 0 ? 'text-green-400' : 'text-gold'
                    }`}
                  >
                    {deltaFat <= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                    {deltaFat > 0 ? `+${deltaFat}` : deltaFat}% body fat
                  </span>
                ) : measurements.length === 1 && latestMeas?.bodyFatPercentage ? (
                  <span className="text-[11px] text-gray-400 flex items-center gap-1 mt-1 font-medium">
                    Baseline fat % tracked
                  </span>
                ) : (
                  <span className="text-[11px] text-gray-500 flex items-center gap-1 mt-1 font-medium">
                    Optional body fat metric
                  </span>
                )}
              </div>

              <div className="bg-[#121215] border border-white/[0.08] p-5 rounded-lg">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                  Waist Measurement
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1 block">
                  {latestMeas?.waistCm ? `${latestMeas.waistCm} cm` : 'Pending Entry'}
                </span>
                {measurements.length > 1 && deltaWaist !== null ? (
                  <span
                    className={`text-[11px] flex items-center gap-1 mt-1 font-medium ${
                      deltaWaist <= 0 ? 'text-green-400' : 'text-gold'
                    }`}
                  >
                    {deltaWaist <= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                    {deltaWaist > 0 ? `+${deltaWaist}` : deltaWaist}cm waist reduction
                  </span>
                ) : measurements.length === 1 && latestMeas?.waistCm ? (
                  <span className="text-[11px] text-gray-400 flex items-center gap-1 mt-1 font-medium">
                    Baseline waist circumference
                  </span>
                ) : (
                  <span className="text-[11px] text-gray-500 flex items-center gap-1 mt-1 font-medium">
                    Optional waist metric
                  </span>
                )}
              </div>

              <div className="bg-[#121215] border border-white/[0.08] p-5 rounded-lg">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                  Arm Circumference
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1 block">
                  {latestMeas?.armsCm ? `${latestMeas.armsCm} cm` : 'Pending Entry'}
                </span>
                {measurements.length > 1 && deltaArms !== null ? (
                  <span
                    className={`text-[11px] flex items-center gap-1 mt-1 font-medium ${
                      deltaArms >= 0 ? 'text-gold' : 'text-gray-400'
                    }`}
                  >
                    {deltaArms >= 0 ? `+${deltaArms}` : deltaArms}cm lean hypertrophy
                  </span>
                ) : measurements.length === 1 && latestMeas?.armsCm ? (
                  <span className="text-[11px] text-gray-400 flex items-center gap-1 mt-1 font-medium">
                    Baseline arm circumference
                  </span>
                ) : (
                  <span className="text-[11px] text-gray-500 flex items-center gap-1 mt-1 font-medium">
                    Optional arms metric
                  </span>
                )}
              </div>
            </div>

            {/* Scheduled Consultations & Group Cohort Sessions */}
            <div className="bg-[#121215] border border-white/[0.08] p-6 rounded-lg space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gold" />
                  Upcoming Coaching Appointments & Masterminds
                </h3>
                <span className="text-xs text-gold font-medium">
                  {isCoachingVip ? 'VIP Cohort Scheduled' : 'General Timetable'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-5 rounded-lg bg-[#18181d] border border-white/[0.06] space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                            apt.type === 'individual_consultation'
                              ? 'bg-gold/15 text-gold border-gold/40'
                              : 'bg-blue-900/40 text-blue-300 border-blue-700/50'
                          }`}
                        >
                          {apt.type === 'individual_consultation'
                            ? '1-on-1 VIP Strategy Consultation'
                            : 'Cohort Weekly Mastermind'}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1.5">{apt.title}</h4>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          apt.status === 'completed'
                            ? 'bg-gray-800 text-gray-400'
                            : 'bg-green-950 text-green-400 border border-green-700/50'
                        }`}
                      >
                        {apt.status}
                      </span>
                    </div>

                    <div className="text-xs text-gray-400 space-y-1">
                      <div>
                        Coach: <strong className="text-gray-200">{apt.instructorName}</strong>
                      </div>
                      <div>
                        Date & Time:{' '}
                        <strong className="text-white font-mono">
                          {new Date(apt.scheduledAt).toLocaleString()} ({apt.durationMinutes} mins)
                        </strong>
                      </div>
                      {apt.notes && <div className="text-gray-400 italic">"{apt.notes}"</div>}
                    </div>

                    {apt.status === 'scheduled' && (
                      <a
                        href={apt.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold bg-gold/15 text-gold border border-gold/40 hover:bg-gold hover:text-black px-3.5 py-1.5 rounded transition-colors"
                      >
                        <Video className="w-3.5 h-3.5" /> Join Live Room
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MEASUREMENTS TRACKER */}
        {activeTab === 'measurements' && (
          <div className="space-y-8">
            <div className="bg-[#121215] border border-white/[0.08] p-6 rounded-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">
                    Weekly Recomposition & Body Analytics
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Continuous monitoring prevents plateaus. Data is synchronized directly with Coach Elena.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMeasError(null);
                    setLogModalOpen(true);
                  }}
                  className="px-4 py-2 bg-[#D4A359] hover:bg-[#C2934B] text-[#111111] font-semibold text-[13px] sm:text-[14px] uppercase tracking-wide rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Week {measurements.length + 1} Entry
                </button>
              </div>

              {/* Progress Curve SVG Visualization */}
              <div className="bg-[#0a0a0c] border border-white/[0.06] p-6 rounded-lg mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Weight Trajectory (kg) Over Time
                  </span>
                  {measurements.length > 0 && (
                    <span className="text-[11px] font-mono text-gray-400">
                      {measurements.length} Check-in{measurements.length === 1 ? '' : 's'} Logged
                    </span>
                  )}
                </div>

                {measurements.length === 0 ? (
                  <div className="h-44 w-full flex flex-col items-center justify-center border border-dashed border-white/[0.1] rounded-lg px-4 text-center">
                    <Scale className="w-8 h-8 text-gray-500 mb-2" />
                    <span className="text-sm font-semibold text-gray-200">No Weight Entries Logged Yet</span>
                    <p className="text-xs text-gray-400 max-w-sm mt-1">
                      Start tracking your body recomposition journey by recording your Week 1 baseline check-in.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setMeasError(null);
                        setLogModalOpen(true);
                      }}
                      className="mt-3 px-3.5 py-1.5 bg-gold/20 hover:bg-gold/30 text-gold border border-gold/40 text-xs font-semibold uppercase tracking-wider rounded transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Log Week 1 Baseline Check-in
                    </button>
                  </div>
                ) : (
                  <div className="h-44 w-full flex items-end justify-between gap-4 pt-4 border-b border-white/[0.1] px-4">
                    {(() => {
                      const weights = measurements.map((m) => m.weightKg);
                      const minW = Math.max(0, Math.floor(Math.min(...weights) - 2));
                      const maxW = Math.ceil(Math.max(...weights) + 2);
                      const range = maxW - minW || 1;

                      return measurements.map((m) => {
                        const heightPercent = Math.max(20, Math.min(100, Math.round(((m.weightKg - minW) / range) * 100)));
                        return (
                          <div key={m.id} className="flex-1 flex flex-col items-center gap-2">
                            <span className="text-xs font-mono font-bold text-gold">{m.weightKg}kg</span>
                            <div
                              style={{ height: `${heightPercent}%` }}
                              className="w-full max-w-[48px] bg-gradient-to-t from-gold/30 to-gold rounded-t transition-all duration-500 hover:brightness-125"
                              title={`Week ${m.weekNumber}: ${m.weightKg} kg on ${m.date}`}
                            />
                            <span className="text-[10px] text-gray-400 font-bold uppercase">
                              Wk {m.weekNumber}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>

              {/* Historical Log Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#18181d] text-gray-400 uppercase tracking-wider border-b border-white/[0.06]">
                    <tr>
                      <th className="py-3 px-4">Week</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Weight</th>
                      <th className="py-3 px-4">Body Fat</th>
                      <th className="py-3 px-4">Waist</th>
                      <th className="py-3 px-4">Chest</th>
                      <th className="py-3 px-4">Arms</th>
                      <th className="py-3 px-4">Coach Feedback</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {measurements.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-gray-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <ClipboardList className="w-6 h-6 text-gray-500" />
                            <span className="font-semibold text-gray-300 text-xs uppercase tracking-wider">
                              No Historical Check-ins Recorded
                            </span>
                            <span className="text-[11px] text-gray-500">
                              Submit your weekly check-in using the "+ Add Week 1 Entry" button above.
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      measurements.map((m) => (
                        <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-4 font-bold text-gold">Week {m.weekNumber}</td>
                          <td className="py-3.5 px-4 text-gray-300 font-mono">{m.date}</td>
                          <td className="py-3.5 px-4 font-bold text-white font-mono">{m.weightKg} kg</td>
                          <td className="py-3.5 px-4 text-gray-300 font-mono">{m.bodyFatPercentage || '—'}%</td>
                          <td className="py-3.5 px-4 text-gray-300 font-mono">{m.waistCm || '—'} cm</td>
                          <td className="py-3.5 px-4 text-gray-300 font-mono">{m.chestCm || '—'} cm</td>
                          <td className="py-3.5 px-4 text-gray-300 font-mono">{m.armsCm || '—'} cm</td>
                          <td className="py-3.5 px-4 text-gray-300 italic max-w-xs">
                            {m.coachFeedback ? (
                              <span className="text-gold font-medium">"{m.coachFeedback}"</span>
                            ) : (
                              <span className="text-gray-500">Awaiting coach review</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PERSONALIZED DIET PLAN */}
        {activeTab === 'diet' && (
          <div className="space-y-6">
            {dietPlan ? (
              <div className="bg-[#121215] border border-white/[0.08] p-6 sm:p-8 rounded-lg space-y-8">
                <div className="border-b border-white/[0.08] pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-gold uppercase tracking-widest bg-gold/15 px-2 py-0.5 rounded border border-gold/30">
                      Assigned by Coach {dietPlan.coachName}
                    </span>
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight mt-2">
                      {dietPlan.title}
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">{dietPlan.phase}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    Updated: {new Date(dietPlan.updatedAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Macro Target Pillars */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="bg-[#18181d] p-4 rounded border border-white/[0.06] text-center">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Daily Target</span>
                    <span className="text-xl sm:text-2xl font-extrabold text-white font-mono mt-1 block">
                      {dietPlan.dailyCalories}
                    </span>
                    <span className="text-[10px] text-gray-400">Calories</span>
                  </div>

                  <div className="bg-[#18181d] p-4 rounded border border-white/[0.06] text-center">
                    <span className="text-[10px] uppercase font-bold text-gold block">Protein</span>
                    <span className="text-xl sm:text-2xl font-extrabold text-gold font-mono mt-1 block">
                      {dietPlan.proteinG}g
                    </span>
                    <span className="text-[10px] text-gray-400">780 kcal (29%)</span>
                  </div>

                  <div className="bg-[#18181d] p-4 rounded border border-white/[0.06] text-center">
                    <span className="text-[10px] uppercase font-bold text-blue-400 block">Carbohydrates</span>
                    <span className="text-xl sm:text-2xl font-extrabold text-blue-400 font-mono mt-1 block">
                      {dietPlan.carbsG}g
                    </span>
                    <span className="text-[10px] text-gray-400">1120 kcal (42%)</span>
                  </div>

                  <div className="bg-[#18181d] p-4 rounded border border-white/[0.06] text-center">
                    <span className="text-[10px] uppercase font-bold text-amber-400 block">Fats</span>
                    <span className="text-xl sm:text-2xl font-extrabold text-amber-400 font-mono mt-1 block">
                      {dietPlan.fatsG}g
                    </span>
                    <span className="text-[10px] text-gray-400">585 kcal (22%)</span>
                  </div>

                  <div className="bg-[#18181d] p-4 rounded border border-white/[0.06] text-center col-span-2 sm:col-span-1">
                    <span className="text-[10px] uppercase font-bold text-cyan-400 block">Hydration</span>
                    <span className="text-xl sm:text-2xl font-extrabold text-cyan-400 font-mono mt-1 block">
                      {dietPlan.waterLiters}L
                    </span>
                    <span className="text-[10px] text-gray-400">Filtered Water</span>
                  </div>
                </div>

                {/* Nutrition Rules */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
                    Core Nutritional Guidelines
                  </h3>
                  <ul className="space-y-2">
                    {dietPlan.guidelines.map((g, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-gold flex-shrink-0 mt-0.5" />
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Meal Schedules */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
                    Prescribed Meal Schedule
                  </h3>
                  <div className="space-y-3">
                    {dietPlan.meals.map((m, idx) => (
                      <div
                        key={idx}
                        className="bg-[#18181d] border border-white/[0.06] p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-2"
                      >
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-gold uppercase">{m.meal}</span>
                          <p className="text-sm text-white font-medium">{m.items}</p>
                        </div>
                        <span className="text-xs font-mono font-semibold text-gray-400 bg-black/40 px-3 py-1.5 rounded border border-white/[0.06] whitespace-nowrap">
                          {m.macros}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#121215] border border-white/[0.08] p-12 text-center rounded-lg">
                <Utensils className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white mb-1">No Custom Diet Plan Assigned Yet</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Your assigned coach will upload your personalized protocol following your Week 1 initial consultation call.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: VIDEO VAULT */}
        {activeTab === 'videos' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  Exercise & Masterclass Vault
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Powered by Cloudflare Stream video infrastructure with adaptive bitrate streaming.
                </p>
              </div>
            </div>

            {/* Video Player Modal / Active Video */}
            {selectedVideo && (
              <div className="bg-[#121215] border border-gold/40 p-6 rounded-lg shadow-gold-glow mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gold bg-gold/15 px-2 py-0.5 rounded border border-gold/30">
                      {selectedVideo.category} • {selectedVideo.duration}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1">{selectedVideo.title}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedVideo(null)}
                    className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded bg-surface-50"
                  >
                    Close Player ✕
                  </button>
                </div>

                <div className="w-full rounded-2xl overflow-hidden border border-gold/40 shadow-2xl relative">
                  <MuscleCraftVideoPlayer
                    src={selectedVideo.videoUrl || ''}
                    poster={selectedVideo.thumbnailUrl}
                    title={selectedVideo.title}
                    autoPlay
                    dockedControls={true}
                    initialPinned={true}
                  />
                </div>

                <p className="text-xs text-gray-300 mt-3 leading-relaxed">
                  {selectedVideo.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((vid) => (
                <div
                  key={vid.id}
                  onClick={() => setSelectedVideo(vid)}
                  className="bg-[#121215] border border-white/[0.08] hover:border-gold/40 rounded-lg overflow-hidden cursor-pointer group transition-all"
                >
                  <div className="relative aspect-video bg-black overflow-hidden">
                    <img
                      src={vid.thumbnailUrl}
                      alt={vid.title}
                      className="w-full h-full object-cover filter brightness-90 group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-gold/90 text-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-black ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute bottom-2 right-2 bg-black/80 font-mono text-[10px] text-white font-bold px-2 py-0.5 rounded">
                      {vid.duration}
                    </span>
                    {vid.accessLevel === 'coaching_90' && (
                      <span className="absolute top-2 left-2 bg-gold text-black font-extrabold text-[9px] uppercase px-2 py-0.5 rounded shadow">
                        90-Day VIP
                      </span>
                    )}
                  </div>

                  <div className="p-4 space-y-2">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      {vid.category}
                    </span>
                    <h4 className="text-sm font-bold text-white group-hover:text-gold transition-colors line-clamp-1">
                      {vid.title}
                    </h4>
                    <p className="text-xs text-gray-400 line-clamp-2">{vid.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: BILLING & MANUAL TRANSFER RECORDS */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            {slipStatusMessage && (
              <div
                className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm ${
                  slipStatusMessage.type === 'success'
                    ? 'bg-emerald-950/80 border border-emerald-700/60 text-emerald-200'
                    : 'bg-rose-950/80 border border-rose-700/60 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {slipStatusMessage.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                  )}
                  <span>{slipStatusMessage.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSlipStatusMessage(null)}
                  className="text-gray-400 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="bg-[#121215] border border-white/[0.08] p-5 sm:p-6 rounded-2xl shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-amber-400" />
                    Verified Manual Bank Transfer Receipts
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Upload deposit slips, track verification status, and manage your membership renewals.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSlipModalOpen(true);
                    setSlipStatusMessage(null);
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-crimson-600 to-rose-600 hover:from-crimson-500 hover:to-rose-500 text-white text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg hover:shadow-crimson-glow flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
                >
                  <Upload className="w-4 h-4" /> Submit Bank Slip
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#18181d] text-gray-400 uppercase tracking-wider border-b border-white/[0.06] text-[10px]">
                    <tr>
                      <th className="py-3 px-4 font-bold">Reference Code</th>
                      <th className="py-3 px-4 font-bold">Package & Tier</th>
                      <th className="py-3 px-4 font-bold">Transfer Date</th>
                      <th className="py-3 px-4 font-bold">Bank & Sender</th>
                      <th className="py-3 px-4 font-bold">Amount (LKR)</th>
                      <th className="py-3 px-4 font-bold">Slip Document</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                      <th className="py-3 px-4 font-bold">Audit Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-gray-500">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <CreditCard className="w-8 h-8 text-gray-600" />
                            <span className="text-sm font-medium text-gray-400">No payment receipts found</span>
                            <span className="text-xs text-gray-600">
                              Submit your bank transfer slip to activate or renew your gym membership.
                            </span>
                            <button
                              type="button"
                              onClick={() => setSlipModalOpen(true)}
                              className="mt-3 px-4 py-2 bg-crimson-600 hover:bg-crimson-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                            >
                              Submit Bank Slip Now
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      payments.map((p) => (
                        <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-amber-400">{p.referenceCode}</td>
                          <td className="py-3.5 px-4 uppercase font-semibold text-white">
                            {p.packageName || p.tier.replace('_', ' ')}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-gray-300">{p.transferDate}</td>
                          <td className="py-3.5 px-4 text-gray-300">
                            <span className="block font-medium text-white">{p.bankName}</span>
                            <span className="text-[11px] text-gray-400">Sender: {p.senderAccountName}</span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-white font-mono whitespace-nowrap">
                            Rs. {p.amount.toLocaleString()} LKR
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {p.receiptUrl ? (
                              <button
                                type="button"
                                onClick={() => setViewSlipModalRecord(p)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 text-amber-300 hover:text-amber-200 text-[11px] font-mono font-medium transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" /> View Slip
                              </button>
                            ) : (
                              <span className="text-[11px] text-gray-500 font-mono">No File</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                                p.status === 'approved'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/60'
                                  : p.status === 'pending'
                                  ? 'bg-amber-950 text-amber-400 border border-amber-700/60'
                                  : 'bg-rose-950 text-rose-400 border border-rose-700/60'
                              }`}
                            >
                              {p.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                              {p.status === 'pending' && <Clock className="w-3 h-3" />}
                              {p.status === 'rejected' && <X className="w-3 h-3" />}
                              {p.status === 'pending' ? 'Under Review' : p.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-gray-400 italic text-[11px] max-w-xs truncate">
                            {p.adminNotes || p.receiptNotes || '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* LOG MEASUREMENT MODAL */}
        {logModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#121215] border border-gold/40 rounded-lg max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Log Weekly Body Measurement (Week {measurements.length + 1})
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setMeasError(null);
                    setLogModalOpen(false);
                  }}
                  className="text-gray-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {measError && (
                <div className="p-3 rounded-lg bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                  <span>{measError}</span>
                </div>
              )}

              <form onSubmit={handleAddMeasurement} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 uppercase mb-1">
                      Body Weight (kg) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={newWeight}
                      onChange={(e) => setNewWeight(e.target.value)}
                      placeholder="e.g. 86.2"
                      className="w-full bg-[#18181d] border border-white/[0.1] focus:border-gold px-3 py-2 rounded text-sm text-white outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 uppercase mb-1">
                      Body Fat (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={newBodyFat}
                      onChange={(e) => setNewBodyFat(e.target.value)}
                      placeholder="e.g. 16.5"
                      className="w-full bg-[#18181d] border border-white/[0.1] focus:border-gold px-3 py-2 rounded text-sm text-white outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-300 uppercase mb-1">
                      Waist (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={newWaist}
                      onChange={(e) => setNewWaist(e.target.value)}
                      placeholder="85.0"
                      className="w-full bg-[#18181d] border border-white/[0.1] focus:border-gold px-2.5 py-1.5 rounded text-xs text-white outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-300 uppercase mb-1">
                      Chest (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={newChest}
                      onChange={(e) => setNewChest(e.target.value)}
                      placeholder="105.0"
                      className="w-full bg-[#18181d] border border-white/[0.1] focus:border-gold px-2.5 py-1.5 rounded text-xs text-white outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-300 uppercase mb-1">
                      Arms (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={newArms}
                      onChange={(e) => setNewArms(e.target.value)}
                      placeholder="38.5"
                      className="w-full bg-[#18181d] border border-white/[0.1] focus:border-gold px-2.5 py-1.5 rounded text-xs text-white outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 uppercase mb-1">
                    Training Notes / Strength PRs
                  </label>
                  <textarea
                    rows={2}
                    value={measNotes}
                    onChange={(e) => setMeasNotes(e.target.value)}
                    placeholder="e.g. Hit 190kg deadlift for 3 reps. Energy high."
                    className="w-full bg-[#18181d] border border-white/[0.1] focus:border-gold p-2.5 rounded text-xs text-white outline-none resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setLogModalOpen(false)}
                    className="w-1/2 py-2.5 bg-surface-50 text-gray-300 hover:text-white rounded text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={measSubmitting}
                    className="w-1/2 py-2.5 bg-[#D4A359] hover:bg-[#C2934B] text-[#111111] font-semibold text-[13px] sm:text-[14px] uppercase rounded transition-colors"
                  >
                    {measSubmitting ? 'Saving...' : 'Submit Entry'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── 90-DAY COACHING EXPIRED AUTO-LOGOUT MODAL ── */}
        {show90DayExitModal && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300"
          >
            <div className="bg-[#111116] border-2 border-amber-500/70 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative text-center space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 mx-auto shadow-[0_0_25px_rgba(245,158,11,0.3)]">
                <ShieldAlert className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-block mb-2">
                  Cohort Concluded
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  90-Day VIP Coaching Access Ended
                </h2>
                <p className="text-xs sm:text-sm text-gray-300 mt-2 leading-relaxed">
                  Your structured 12-week <strong className="text-white">90 Days Better Me</strong> transformation cycle concluded on{' '}
                  <strong className="text-amber-300">
                    {currentUser?.membershipExpiresAt ? new Date(currentUser.membershipExpiresAt).toLocaleDateString() : 'N/A'}
                  </strong>
                  . As per cohort guidelines, coaching dashboard access has concluded.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200">
                <span>Automatically ending session and redirecting in </span>
                <strong className="text-amber-400 font-mono text-sm">{autoLogoutSeconds}s</strong>
                <span>...</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleManual90DayExit}
                  className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Exit to Login Now
                </button>
                <a
                  href={`https://wa.me/94771234567?text=${encodeURIComponent(
                    `Hi Coach Adeesha, my 90-Day coaching cycle has ended. I would like to review my transformation report and discuss renewal options.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  WhatsApp Coach
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ── SUBMIT BANK TRANSFER SLIP MODAL ── */}
        {slipModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
          >
            <div className="bg-[#121217] border border-amber-500/40 rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl space-y-5 max-h-[92vh] flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-950/60 border border-amber-700/60 text-amber-400">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Submit Bank Transfer Slip
                    </h3>
                    <span className="text-xs text-gray-400">
                      Upload receipt to activate or extend your membership.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSlipModalOpen(false)}
                  className="text-gray-400 hover:text-white p-2 rounded-xl bg-white/5 cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body (Scrollable) */}
              <form onSubmit={handleSubmitSlip} className="space-y-4 overflow-y-auto flex-1 pr-1">
                {/* 1. Package Selection */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                    Select Gym Package / Plan *
                  </label>
                  <select
                    value={slipPackageTier}
                    onChange={(e) => setSlipPackageTier(e.target.value)}
                    required
                    className="w-full bg-[#181822] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium cursor-pointer"
                  >
                    <optgroup label="Sole Membership (Gym Access)">
                      <option value="sole_1m">Sole - 1 Month (Rs. 4,500 + Rs. 500 Admission = Rs. 5,000 LKR)</option>
                      <option value="sole_3m">Sole - 3 Months (Rs. 12,000 LKR - No Admission)</option>
                      <option value="sole_6m">Sole - 6 Months (Rs. 22,000 LKR - No Admission)</option>
                      <option value="sole_1y">Sole - 1 Year (Rs. 40,000 LKR - Best Value)</option>
                    </optgroup>
                    <optgroup label="Couple Membership (2 Athletes)">
                      <option value="couple_1m">Couple - 1 Month (Rs. 8,000 + Rs. 1,000 Admission = Rs. 9,000 LKR)</option>
                      <option value="couple_3m">Couple - 3 Months (Rs. 22,500 LKR)</option>
                      <option value="couple_6m">Couple - 6 Months (Rs. 42,000 LKR)</option>
                      <option value="couple_1y">Couple - 1 Year (Rs. 78,000 LKR)</option>
                    </optgroup>
                    <optgroup label="VIP Coaching Programs">
                      <option value="coaching_90">90 Days Better Me (VIP Online Coaching - Rs. 8,000 LKR)</option>
                      <option value="burnzone">BurnZone Functional Conditioning (Rs. 3,500 LKR)</option>
                    </optgroup>
                  </select>
                </div>

                {/* 2. Bank Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                      Bank Deposited / Transferred To *
                    </label>
                    <select
                      value={slipBankName}
                      onChange={(e) => setSlipBankName(e.target.value)}
                      required
                      className="w-full bg-[#181822] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium cursor-pointer"
                    >
                      <option value="Commercial Bank of Ceylon">Commercial Bank of Ceylon</option>
                      <option value="Sampath Bank PLC">Sampath Bank PLC</option>
                      <option value="Bank of Ceylon (BOC)">Bank of Ceylon (BOC)</option>
                      <option value="Hatton National Bank (HNB)">Hatton National Bank (HNB)</option>
                      <option value="Nations Trust Bank (NTB)">Nations Trust Bank (NTB)</option>
                      <option value="People's Bank">People's Bank</option>
                      <option value="DFCC Bank">DFCC Bank</option>
                      <option value="Seylan Bank">Seylan Bank</option>
                      <option value="National Development Bank (NDB)">National Development Bank (NDB)</option>
                      <option value="Other Bank / Online App">Other Bank / Online Transfer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                      Reference Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={slipRefCode}
                      onChange={(e) => setSlipRefCode(e.target.value)}
                      placeholder={proposedRefCode || 'TRF-MC-849201'}
                      className="w-full bg-[#181822] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                {/* 3. Sender Name & Transfer Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                      Sender Account / Depositor Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={slipSenderName}
                      onChange={(e) => setSlipSenderName(e.target.value)}
                      placeholder="e.g. Adeesha K. / Personal Account"
                      className="w-full bg-[#181822] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                      Transfer Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={slipTransferDate}
                      onChange={(e) => setSlipTransferDate(e.target.value)}
                      className="w-full bg-[#181822] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                {/* 4. Bank Slip File Upload Area */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Attach Deposit Slip / Transfer Screenshot (Image or PDF) *</span>
                    <span className="text-[10px] text-amber-400 font-normal">Max 15MB</span>
                  </label>

                  {!slipFile ? (
                    <label className="border-2 border-dashed border-white/15 hover:border-amber-500/60 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#181822]/60 hover:bg-[#181822]">
                      <div className="p-3 rounded-full bg-white/5 text-amber-400 mb-2">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-semibold text-white">
                        Click to select or drag & drop slip file
                      </span>
                      <span className="text-[11px] text-gray-400 mt-0.5">
                        JPG, PNG, WEBP or PDF receipt from bank app / deposit counter
                      </span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleSlipFileSelect(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-[#181822] border border-emerald-500/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-700/60 text-emerald-400 shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-white block truncate">
                              {slipFile.name}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {(slipFile.size / (1024 * 1024)).toFixed(2)} MB
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSlipFileSelect(null)}
                          className="text-xs text-rose-400 hover:text-rose-300 font-medium underline cursor-pointer shrink-0 ml-2"
                        >
                          Remove / Change
                        </button>
                      </div>

                      {/* Image Thumbnail Preview */}
                      {slipPreviewUrl && (
                        <div className="rounded-xl overflow-hidden border border-white/10 max-h-40 bg-black flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={slipPreviewUrl}
                            alt="Slip thumbnail"
                            className="max-h-40 w-auto object-contain"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 5. Optional Notes */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                    Notes / Remarks (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={slipNotes}
                    onChange={(e) => setSlipNotes(e.target.value)}
                    placeholder="e.g. Transferred via Commercial Bank Online app. Ref #492819."
                    className="w-full bg-[#181822] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-white/[0.08] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSlipModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploadingSlip}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-crimson-600 to-rose-600 hover:from-crimson-500 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-crimson-glow transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isUploadingSlip ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Uploading & Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Submit Slip for Verification</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── VIEW ATHLETE BANK SLIP MODAL ── */}
        {viewSlipModalRecord && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
          >
            <div className="bg-[#121217] border border-amber-500/40 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-700/60 text-amber-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm sm:text-base">
                      Bank Transfer Receipt
                    </h3>
                    <span className="text-[11px] font-mono text-gray-400">
                      {viewSlipModalRecord.referenceCode} • {viewSlipModalRecord.transferDate}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {viewSlipModalRecord.receiptUrl && (
                    <a
                      href={viewSlipModalRecord.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                      title="Open Full Image"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setViewSlipModalRecord(null)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Slip Image & Details */}
              <div className="flex-1 overflow-y-auto space-y-4">
                {viewSlipModalRecord.receiptUrl ? (
                  <div className="rounded-2xl overflow-hidden border border-white/10 bg-black flex items-center justify-center p-2 max-h-[50vh]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={viewSlipModalRecord.receiptUrl}
                      alt="Bank slip"
                      className="max-h-[48vh] w-auto object-contain rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 bg-white/[0.02] rounded-2xl border border-white/[0.06]">
                    No receipt image was uploaded with this transaction.
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Total Amount</span>
                    <span className="font-mono font-bold text-white mt-0.5 block">
                      Rs. {viewSlipModalRecord.amount.toLocaleString()} LKR
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Bank</span>
                    <span className="font-semibold text-white mt-0.5 block truncate">
                      {viewSlipModalRecord.bankName}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Sender</span>
                    <span className="font-semibold text-emerald-300 mt-0.5 block truncate">
                      {viewSlipModalRecord.senderAccountName}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Status</span>
                    <span className="font-bold uppercase text-[10px] mt-0.5 block text-amber-400">
                      {viewSlipModalRecord.status === 'pending' ? 'Under Review' : viewSlipModalRecord.status}
                    </span>
                  </div>
                </div>

                {viewSlipModalRecord.receiptNotes && (
                  <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/30 text-xs text-amber-200">
                    <span className="text-[10px] font-bold uppercase text-amber-400 block mb-0.5">Notes:</span>
                    <p className="italic">{viewSlipModalRecord.receiptNotes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
