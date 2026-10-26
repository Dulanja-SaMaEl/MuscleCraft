'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/context/auth-context';
import {
  Calendar,
  Video,
  Utensils,
  TrendingDown,
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
} from 'lucide-react';
import { BodyMeasurement, DietPlan, Appointment, ExerciseVideo, PaymentRecord } from '@/lib/types';

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

  useEffect(() => {
    if (currentUser) {
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
      }
    } catch (err) {
      console.error('Error loading client data:', err);
    }
  };

  const handleAddMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setMeasSubmitting(true);

    try {
      const nextWeek = measurements.length + 1;
      const res = await fetch(`/api/measurements?userId=${currentUser.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          weekNumber: nextWeek,
          date: new Date().toISOString().split('T')[0],
          weightKg: parseFloat(newWeight),
          bodyFatPercentage: newBodyFat ? parseFloat(newBodyFat) : undefined,
          waistCm: newWaist ? parseFloat(newWaist) : undefined,
          chestCm: newChest ? parseFloat(newChest) : undefined,
          armsCm: newArms ? parseFloat(newArms) : undefined,
          notes: measNotes,
        }),
      });

      if (res.ok) {
        setLogModalOpen(false);
        setNewWeight('');
        setNewBodyFat('');
        setNewWaist('');
        setNewChest('');
        setNewArms('');
        setMeasNotes('');
        await loadClientData();
      }
    } catch (err) {
      console.error('Failed to log measurement:', err);
    } finally {
      setMeasSubmitting(false);
    }
  };

  const isCoachingVip = currentUser?.tier === 'coaching_90';

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
                  {measurements[measurements.length - 1]?.weightKg || 86.6} kg
                </span>
                <span className="text-[11px] text-green-400 flex items-center gap-1 mt-1 font-medium">
                  <TrendingDown className="w-3 h-3" /> -1.9kg since Week 1
                </span>
              </div>

              <div className="bg-[#121215] border border-white/[0.08] p-5 rounded-lg">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                  Body Fat Recomp
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1 block">
                  {measurements[measurements.length - 1]?.bodyFatPercentage || 16.9} %
                </span>
                <span className="text-[11px] text-green-400 flex items-center gap-1 mt-1 font-medium">
                  <TrendingDown className="w-3 h-3" /> -1.6% body fat
                </span>
              </div>

              <div className="bg-[#121215] border border-white/[0.08] p-5 rounded-lg">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                  Waist Measurement
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1 block">
                  {measurements[measurements.length - 1]?.waistCm || 85.5} cm
                </span>
                <span className="text-[11px] text-green-400 flex items-center gap-1 mt-1 font-medium">
                  <TrendingDown className="w-3 h-3" /> -3.5cm waist reduction
                </span>
              </div>

              <div className="bg-[#121215] border border-white/[0.08] p-5 rounded-lg">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                  Arm Circumference
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1 block">
                  {measurements[measurements.length - 1]?.armsCm || 38.4} cm
                </span>
                <span className="text-[11px] text-gold flex items-center gap-1 mt-1 font-medium">
                  +0.9cm lean hypertrophy
                </span>
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
                  onClick={() => setLogModalOpen(true)}
                  className="px-4 py-2 bg-[#D4A359] hover:bg-[#C2934B] text-[#111111] font-semibold text-[13px] sm:text-[14px] uppercase tracking-wide rounded flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Week {measurements.length + 1} Entry
                </button>
              </div>

              {/* Progress Curve SVG Visualization */}
              <div className="bg-[#0a0a0c] border border-white/[0.06] p-6 rounded-lg mb-6">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-4">
                  Weight Trajectory (kg) Over Time
                </span>
                <div className="h-44 w-full flex items-end justify-between gap-4 pt-4 border-b border-white/[0.1] px-4">
                  {measurements.map((m) => {
                    const minW = 85;
                    const maxW = 90;
                    const heightPercent = Math.max(10, Math.min(100, ((m.weightKg - minW) / (maxW - minW)) * 100));
                    return (
                      <div key={m.id} className="flex-1 flex flex-col items-center gap-2">
                        <span className="text-xs font-mono font-bold text-gold">{m.weightKg}kg</span>
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full max-w-[48px] bg-gradient-to-t from-gold/30 to-gold rounded-t transition-all duration-500"
                        />
                        <span className="text-[10px] text-gray-400 font-bold uppercase">
                          Wk {m.weekNumber}
                        </span>
                      </div>
                    );
                  })}
                </div>
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
                    {measurements.map((m) => (
                      <tr key={m.id} className="hover:bg-white/[0.02]">
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
                    ))}
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

                <div className="aspect-video bg-black rounded-lg overflow-hidden border border-white/[0.1] relative">
                  <video
                    src={selectedVideo.videoUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-cover"
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
            <div className="bg-[#121215] border border-white/[0.08] p-6 rounded-lg">
              <h3 className="text-base font-bold text-white uppercase tracking-wider mb-2">
                Verified Manual Transfer Receipts
              </h3>
              <p className="text-xs text-gray-400 mb-6">
                All bank transfers are reconciled and verified by MuscleCraft accounting.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#18181d] text-gray-400 uppercase tracking-wider border-b border-white/[0.06]">
                    <tr>
                      <th className="py-3 px-4">Reference Code</th>
                      <th className="py-3 px-4">Tier</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Bank & Sender</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Audit Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td className="py-3.5 px-4 font-mono font-bold text-gold">{p.referenceCode}</td>
                        <td className="py-3.5 px-4 uppercase font-semibold text-white">{p.tier.replace('_', ' ')}</td>
                        <td className="py-3.5 px-4 font-mono text-gray-300">{p.transferDate}</td>
                        <td className="py-3.5 px-4 text-gray-300">
                          {p.bankName} ({p.senderAccountName})
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white font-mono">${p.amount.toFixed(2)}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              p.status === 'approved'
                                ? 'bg-green-950 text-green-400 border border-green-700/60'
                                : p.status === 'pending'
                                ? 'bg-amber-950 text-amber-400 border border-amber-700/60'
                                : 'bg-red-950 text-red-400 border border-red-700/60'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-gray-400 italic">{p.adminNotes || p.receiptNotes || '—'}</td>
                      </tr>
                    ))}
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
                  Log Weekly Body Measurement
                </h3>
                <button onClick={() => setLogModalOpen(false)} className="text-gray-400 hover:text-white">
                  ✕
                </button>
              </div>

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
      </main>

      <Footer />
    </div>
  );
}
