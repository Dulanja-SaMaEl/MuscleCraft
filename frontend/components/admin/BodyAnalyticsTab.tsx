'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Activity,
  Search,
  CheckCircle2,
  Clock,
  MessageSquare,
  TrendingDown,
  TrendingUp,
  User,
  Scale,
  Send,
  X,
  Sparkles,
  Flame,
  Plus,
  Edit3,
  Calendar,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { BodyMeasurement, User as UserType } from '@/lib/types';

type EnrichedMeasurement = BodyMeasurement & {
  userName?: string;
  userTier?: string;
  userEmail?: string;
  avatarUrl?: string;
};

interface BodyAnalyticsTabProps {
  measurements: EnrichedMeasurement[];
  members: UserType[];
  isLoading?: boolean;
  onSaveFeedback: (measurementId: string, feedback: string) => Promise<void>;
}

export default function BodyAnalyticsTab({
  measurements: initialMeasurements,
  members,
  isLoading,
  onSaveFeedback,
}: BodyAnalyticsTabProps) {
  const [measurements, setMeasurements] = useState<EnrichedMeasurement[]>(initialMeasurements);
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Keep local measurements synced with parent prop updates
  useEffect(() => {
    setMeasurements(initialMeasurements);
  }, [initialMeasurements]);

  // All client members from the directory
  const allClientMembers = members.filter((m) => m.role === 'client');

  // Currently focused athlete for the trajectory progression chart
  const [activeAthleteId, setActiveAthleteId] = useState<string>(() => {
    return allClientMembers[0]?.id || initialMeasurements[0]?.userId || 'usr_client_90';
  });

  // Modal 1: Quick Coach Feedback Modal
  const [feedbackModalMeasurement, setFeedbackModalMeasurement] = useState<EnrichedMeasurement | null>(null);
  const [feedbackText, setFeedbackText] = useState('');

  // Modal 2: Log New Athlete Check-in (Coach or Admin logging on athlete's behalf)
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logForm, setLogForm] = useState({
    athleteId: '',
    weekNumber: 1,
    date: new Date().toISOString().split('T')[0],
    weightKg: '',
    bodyFatPercentage: '',
    waistCm: '',
    chestCm: '',
    armsCm: '',
    notes: '',
    coachFeedback: '',
  });

  // Modal 3: Edit Measurement Metrics Modal
  const [editModalMeasurement, setEditModalMeasurement] = useState<EnrichedMeasurement | null>(null);
  const [editForm, setEditForm] = useState({
    weightKg: '',
    bodyFatPercentage: '',
    waistCm: '',
    chestCm: '',
    armsCm: '',
    notes: '',
    coachFeedback: '',
    date: '',
    weekNumber: 1,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Clients with at least one submission
  const clientsWithSubmissions = allClientMembers.filter((m) =>
    measurements.some((meas) => meas.userId === m.id)
  );

  // Filtered submissions list
  const filteredSubmissions = measurements.filter((m) => {
    const matchesClient = selectedClientFilter === 'all' || m.userId === selectedClientFilter;
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'pending'
        ? !m.coachFeedback
        : !!m.coachFeedback;

    const matchesSearch =
      !searchQuery ||
      (m.userName && m.userName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.notes && m.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.coachFeedback && m.coachFeedback.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesClient && matchesStatus && matchesSearch;
  });

  const pendingCount = measurements.filter((m) => !m.coachFeedback).length;
  const reviewedCount = measurements.filter((m) => !!m.coachFeedback).length;

  // Active athlete history for progression trajectory
  const activeAthleteHistory = measurements
    .filter((m) => m.userId === activeAthleteId)
    .sort((a, b) => a.weekNumber - b.weekNumber);

  const activeAthleteUser = members.find((m) => m.id === activeAthleteId);

  // Open Log Modal handler
  const handleOpenLogModal = (presetAthleteId?: string) => {
    const athleteToUse = presetAthleteId || activeAthleteId || allClientMembers[0]?.id || '';
    const athleteLogs = measurements.filter((m) => m.userId === athleteToUse);
    const nextWeek = athleteLogs.length > 0 ? Math.max(...athleteLogs.map((m) => m.weekNumber)) + 1 : 1;

    setLogForm({
      athleteId: athleteToUse,
      weekNumber: nextWeek,
      date: new Date().toISOString().split('T')[0],
      weightKg: '',
      bodyFatPercentage: '',
      waistCm: '',
      chestCm: '',
      armsCm: '',
      notes: '',
      coachFeedback: '',
    });
    setActionError(null);
    setLogModalOpen(true);
  };

  // Submit New Log
  const handleSaveNewCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logForm.athleteId || !logForm.weightKg) {
      setActionError('Please select an athlete and enter their weight in kg.');
      return;
    }

    setIsSubmitting(true);
    setActionError(null);

    try {
      const payload = {
        userId: logForm.athleteId,
        weekNumber: Number(logForm.weekNumber),
        date: logForm.date,
        weightKg: Number(logForm.weightKg),
        bodyFatPercentage: logForm.bodyFatPercentage ? Number(logForm.bodyFatPercentage) : undefined,
        waistCm: logForm.waistCm ? Number(logForm.waistCm) : undefined,
        chestCm: logForm.chestCm ? Number(logForm.chestCm) : undefined,
        armsCm: logForm.armsCm ? Number(logForm.armsCm) : undefined,
        notes: logForm.notes || '',
        coachFeedback: logForm.coachFeedback || '',
      };

      const res = await fetch('/api/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save athlete check-in');
      }

      const athleteObj = members.find((m) => m.id === logForm.athleteId);
      const newEntry = {
        ...data.measurement,
        userName: athleteObj?.name || 'Athlete',
        userEmail: athleteObj?.email || '',
        userTier: athleteObj?.tier || 'Member',
      };

      setMeasurements((prev) => [newEntry, ...prev]);
      setActiveAthleteId(logForm.athleteId);
      setLogModalOpen(false);
    } catch (err: any) {
      setActionError(err.message || 'Error recording check-in entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal handler
  const handleOpenEditModal = (m: BodyMeasurement) => {
    setEditModalMeasurement(m);
    setEditForm({
      weightKg: String(m.weightKg || ''),
      bodyFatPercentage: m.bodyFatPercentage ? String(m.bodyFatPercentage) : '',
      waistCm: m.waistCm ? String(m.waistCm) : '',
      chestCm: m.chestCm ? String(m.chestCm) : '',
      armsCm: m.armsCm ? String(m.armsCm) : '',
      notes: m.notes || '',
      coachFeedback: m.coachFeedback || '',
      date: m.date || '',
      weekNumber: m.weekNumber || 1,
    });
    setActionError(null);
  };

  // Submit Edit
  const handleSaveEditMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalMeasurement) return;

    setIsSubmitting(true);
    setActionError(null);

    try {
      const payload = {
        measurementId: editModalMeasurement.id,
        weightKg: Number(editForm.weightKg),
        bodyFatPercentage: editForm.bodyFatPercentage ? Number(editForm.bodyFatPercentage) : null,
        waistCm: editForm.waistCm ? Number(editForm.waistCm) : null,
        chestCm: editForm.chestCm ? Number(editForm.chestCm) : null,
        armsCm: editForm.armsCm ? Number(editForm.armsCm) : null,
        notes: editForm.notes,
        coachFeedback: editForm.coachFeedback,
        date: editForm.date,
        weekNumber: Number(editForm.weekNumber),
      };

      const res = await fetch('/api/measurements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update measurement record.');
      }

      setMeasurements((prev) =>
        prev.map((item) =>
          item.id === editModalMeasurement.id
            ? {
                ...item,
                weightKg: Number(editForm.weightKg),
                bodyFatPercentage: editForm.bodyFatPercentage ? Number(editForm.bodyFatPercentage) : undefined,
                waistCm: editForm.waistCm ? Number(editForm.waistCm) : undefined,
                chestCm: editForm.chestCm ? Number(editForm.chestCm) : undefined,
                armsCm: editForm.armsCm ? Number(editForm.armsCm) : undefined,
                notes: editForm.notes,
                coachFeedback: editForm.coachFeedback,
                date: editForm.date,
                weekNumber: Number(editForm.weekNumber),
              }
            : item
        )
      );

      setEditModalMeasurement(null);
    } catch (err: any) {
      setActionError(err.message || 'Error updating measurement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick feedback send
  const handleOpenFeedback = (m: BodyMeasurement) => {
    setFeedbackModalMeasurement(m);
    setFeedbackText(m.coachFeedback || '');
  };

  const handleSendFeedback = async () => {
    if (!feedbackModalMeasurement || !feedbackText.trim()) return;
    setIsSubmitting(true);
    try {
      await onSaveFeedback(feedbackModalMeasurement.id, feedbackText.trim());
      setMeasurements((prev) =>
        prev.map((item) =>
          item.id === feedbackModalMeasurement.id
            ? { ...item, coachFeedback: feedbackText.trim() }
            : item
        )
      );
      setFeedbackModalMeasurement(null);
      setFeedbackText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && measurements.length === 0) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-7 w-72 bg-white/15 rounded-xl" />
            <div className="h-3.5 w-96 bg-white/5 rounded-lg" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-44 bg-white/10 rounded-xl" />
            <div className="h-10 w-36 bg-crimson-900/40 border border-crimson-500/20 rounded-xl" />
          </div>
        </div>

        {/* 4 KPI Recomp Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#111116] border border-white/[0.08] p-5 rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-3 w-28 bg-white/10 rounded" />
                <div className="w-5 h-5 bg-white/10 rounded-lg" />
              </div>
              <div className="h-8 w-32 bg-white/20 rounded-lg" />
              <div className="h-3 w-24 bg-white/5 rounded" />
            </div>
          ))}
        </div>

        {/* Weight Trajectory Chart Skeleton */}
        <div className="bg-[#111116] border border-white/[0.08] p-6 rounded-3xl space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <div className="h-4 w-48 bg-white/15 rounded" />
              <div className="h-3 w-64 bg-white/5 rounded" />
            </div>
            <div className="h-7 w-28 bg-white/10 rounded-full" />
          </div>
          <div className="h-56 w-full bg-white/[0.02] rounded-2xl flex items-end justify-around p-6 gap-4">
            {[40, 65, 55, 80, 70, 90, 85].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div style={{ height: `${h}%` }} className="w-full max-w-[48px] bg-white/10 rounded-t-xl" />
                <div className="h-2.5 w-8 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Submissions List Skeleton */}
        <div className="space-y-4">
          <div className="h-5 w-44 bg-white/15 rounded-xl" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#111116] border border-white/[0.08] rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10" />
                  <div className="space-y-1">
                    <div className="h-4 w-32 bg-white/15 rounded" />
                    <div className="h-3 w-40 bg-white/5 rounded" />
                  </div>
                </div>
                <div className="h-6 w-24 bg-white/10 rounded-full" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-12 bg-white/[0.03] rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ───────────────────────────────────────────────────────────
          1. HEADER & KPI OVERVIEW
          ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-xl bg-crimson-950/80 border border-crimson-600/40 text-crimson-400">
              <Activity className="w-5 h-5" />
            </span>
            Client Body Analytics & Progress Submissions
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Real-time feed of weekly weigh-ins, body fat %, tape measurements, and athlete check-in notes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleOpenLogModal()}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-crimson-600 to-crimson-700 hover:from-crimson-500 hover:to-crimson-600 text-white text-xs font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(186,26,26,0.4)] transition-all cursor-pointer min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Log Athlete Check-In</span>
          </button>

          <span className="px-3.5 py-2 rounded-xl bg-crimson-950/60 border border-crimson-800/50 text-crimson-300 text-xs font-mono font-bold flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-crimson-400" />
            <span>{measurements.length} Total Submissions</span>
          </span>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111116] border border-white/[0.08] p-5 rounded-2xl">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase tracking-wider">
            <span>Total Logged Check-ins</span>
            <Scale className="w-4 h-4 text-crimson-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-2">
            {measurements.length}
          </div>
          <div className="text-[11px] text-gray-400 mt-1.5">Across all enrolled athletes</div>
        </div>

        <div className="bg-[#111116] border border-white/[0.08] p-5 rounded-2xl">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase tracking-wider">
            <span>Pending Coach Reviews</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono mt-2">
            {pendingCount}
          </div>
          <div className="text-[11px] text-gray-400 mt-1.5">Requires Coach Adeesha cues</div>
        </div>

        <div className="bg-[#111116] border border-white/[0.08] p-5 rounded-2xl">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase tracking-wider">
            <span>Coach Feedback Delivered</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300 font-mono mt-2">
            {reviewedCount}
          </div>
          <div className="text-[11px] text-gray-400 mt-1.5">Reviewed and verified</div>
        </div>

        <div className="bg-[#111116] border border-white/[0.08] p-5 rounded-2xl">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase tracking-wider">
            <span>All Enrolled Athletes</span>
            <User className="w-4 h-4 text-crimson-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-2">
            {allClientMembers.length || 1}
          </div>
          <div className="text-[11px] text-gray-400 mt-1.5">
            {clientsWithSubmissions.length} active with check-ins
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────
          2. SELECTED ATHLETE PROGRESSION TRAJECTORY & CHART
          ─────────────────────────────────────────────────────────── */}
      <div className="bg-[#111116] border border-white/[0.08] p-6 sm:p-7 rounded-3xl shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-crimson-400">
                Progression Trajectory
              </span>
              <span className="text-gray-500">·</span>
              <span className="text-xs text-gray-300 font-medium">
                {activeAthleteUser?.name || 'Selected Athlete'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-crimson-950/80 text-crimson-300 border border-crimson-800">
                {activeAthleteUser?.tier || 'Client'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">
              Weight (kg) & Body Fat (%) Evolution
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Athlete Selector Dropdown */}
            <div className="relative flex items-center gap-2">
              <label htmlFor="athleteSelector" className="text-xs text-gray-400 font-semibold whitespace-nowrap">
                Select Athlete:
              </label>
              <div className="relative">
                <select
                  id="athleteSelector"
                  value={activeAthleteId}
                  onChange={(e) => setActiveAthleteId(e.target.value)}
                  className="bg-[#161622] border border-white/10 hover:border-crimson-500/50 text-white text-xs font-semibold rounded-xl pl-3 pr-8 py-2 min-h-[40px] focus:outline-none focus:ring-2 focus:ring-crimson-500 cursor-pointer appearance-none"
                >
                  {allClientMembers.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#14141d] text-white">
                      {c.name} {c.email ? `(${c.email})` : ''}
                    </option>
                  ))}
                  {allClientMembers.length === 0 && (
                    <option value="usr_client_90" className="bg-[#14141d] text-white">
                      Rohan Vidyaratne (rohan.v@gmail.com)
                    </option>
                  )}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <button
              onClick={() => handleOpenLogModal(activeAthleteId)}
              className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-gray-200 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer min-h-[40px]"
            >
              <Plus className="w-3.5 h-3.5 text-crimson-400" />
              <span>Record Check-In</span>
            </button>
          </div>
        </div>

        {/* Dynamic Trajectory Display or Empty State */}
        {activeAthleteHistory.length === 0 ? (
          <div className="p-10 rounded-2xl bg-[#0d0d12] border border-dashed border-white/10 text-center space-y-3">
            <Scale className="w-10 h-10 text-gray-600 mx-auto" />
            <h4 className="text-white font-bold text-sm">
              No Check-Ins Logged Yet for {activeAthleteUser?.name || 'this athlete'}
            </h4>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Coach Adeesha or the athlete can log weekly weigh-ins and tape measurements to chart progress over time.
            </p>
            <button
              onClick={() => handleOpenLogModal(activeAthleteId)}
              className="mt-2 px-4 py-2 bg-crimson-600 hover:bg-crimson-500 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log First Entry for {activeAthleteUser?.name || 'Athlete'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Visual Bar Progression Chart */}
            <div className="h-64 w-full bg-[#0a0a0e] border border-white/[0.06] rounded-2xl p-4 sm:p-6 flex items-stretch justify-between gap-3 sm:gap-6 relative">
              {/* Background Reference Lines */}
              <div className="absolute inset-x-0 top-1/4 border-b border-white/[0.04] pointer-events-none" />
              <div className="absolute inset-x-0 top-2/4 border-b border-white/[0.04] pointer-events-none" />
              <div className="absolute inset-x-0 top-3/4 border-b border-white/[0.04] pointer-events-none" />

              {(() => {
                const weights = activeAthleteHistory.map((m) => m.weightKg);
                const minW = Math.max(0, Math.floor(Math.min(...weights) - 2));
                const maxW = Math.ceil(Math.max(...weights) + 2);
                const range = maxW - minW || 1;

                return activeAthleteHistory.map((m) => {
                  const heightPercent = Math.max(25, Math.min(100, Math.round(((m.weightKg - minW) / range) * 100)));
                  return (
                    <div
                      key={m.id}
                      onClick={() => handleOpenEditModal(m)}
                      className="flex-1 h-full flex flex-col items-center justify-end group cursor-pointer z-10"
                      title={`Click to edit Week ${m.weekNumber} (${m.weightKg} kg)`}
                    >
                      {/* Weight Tag */}
                      <div className="mb-2 text-center transition-transform group-hover:-translate-y-1 duration-200">
                        <span className="text-[11px] sm:text-xs font-mono font-extrabold text-[#D4A359] block whitespace-nowrap bg-black/80 px-2 py-0.5 rounded border border-[#D4A359]/40 shadow-md">
                          {m.weightKg} kg
                        </span>
                      </div>

                      {/* Bar Pillar */}
                      <div className="w-full max-w-[54px] flex-1 flex items-end justify-center">
                        <div
                          style={{ height: `${heightPercent}%`, minHeight: '28px' }}
                          className="w-full rounded-t-xl bg-gradient-to-t from-[#D4A359]/25 via-[#D4A359]/80 to-[#D4A359] border-t-2 border-x border-[#D4A359] shadow-[0_0_15px_rgba(212,163,89,0.35)] transition-all duration-500 group-hover:brightness-125 group-hover:shadow-[0_0_25px_rgba(212,163,89,0.7)]"
                        />
                      </div>

                      {/* Week Label */}
                      <div className="mt-2.5 text-center">
                        <span className="text-[10px] sm:text-[11px] text-gray-400 font-bold uppercase tracking-wider block group-hover:text-white transition-colors">
                          Wk {m.weekNumber}
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Metric Evolution Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {activeAthleteHistory.map((entry, idx) => {
                const prev = idx > 0 ? activeAthleteHistory[idx - 1] : null;
                const weightDiff = prev ? entry.weightKg - prev.weightKg : 0;
                const bfDiff =
                  prev && entry.bodyFatPercentage && prev.bodyFatPercentage
                    ? entry.bodyFatPercentage - prev.bodyFatPercentage
                    : 0;

                return (
                  <div
                    key={entry.id}
                    onClick={() => handleOpenEditModal(entry)}
                    className="bg-[#15151f] hover:bg-[#181824] border border-white/[0.06] hover:border-crimson-500/40 p-3.5 rounded-2xl transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span className="font-bold text-white group-hover:text-crimson-400 transition-colors">
                        Week {entry.weekNumber}
                      </span>
                      <span className="text-[10px] font-mono">{entry.date}</span>
                    </div>

                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-lg font-mono font-extrabold text-white">
                        {entry.weightKg} kg
                      </span>
                      {weightDiff !== 0 && (
                        <span
                          className={`text-xs font-mono font-bold flex items-center ${
                            weightDiff < 0 ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {weightDiff < 0 ? (
                            <TrendingDown className="w-3 h-3 mr-0.5" />
                          ) : (
                            <TrendingUp className="w-3 h-3 mr-0.5" />
                          )}
                          {weightDiff > 0 ? `+${weightDiff.toFixed(1)}` : weightDiff.toFixed(1)}kg
                        </span>
                      )}
                    </div>

                    {entry.bodyFatPercentage ? (
                      <div className="flex items-center justify-between text-xs text-gray-400 mt-1 font-mono">
                        <span>Body Fat: {entry.bodyFatPercentage}%</span>
                        {bfDiff !== 0 && (
                          <span className={bfDiff < 0 ? 'text-emerald-400' : 'text-amber-400'}>
                            {bfDiff < 0 ? bfDiff.toFixed(1) : `+${bfDiff.toFixed(1)}`}%
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-[10px] text-gray-500 mt-1 font-mono">
                        Tape: W {entry.waistCm || '—'}cm / C {entry.chestCm || '—'}cm
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────
          3. FILTER & SEARCH CONTROLS
          ─────────────────────────────────────────────────────────── */}
      <div className="bg-[#111116] border border-white/[0.08] p-4 sm:p-5 rounded-2xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Client Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedClientFilter}
              onChange={(e) => setSelectedClientFilter(e.target.value)}
              className="bg-[#181822] border border-white/10 text-white text-xs font-semibold rounded-xl px-4 py-2.5 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-crimson-500 cursor-pointer"
              aria-label="Filter by athlete"
            >
              <option value="all">👥 All Athletes ({measurements.length} logs)</option>
              {allClientMembers.map((c) => (
                <option key={c.id} value={c.id}>
                  👤 {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center bg-[#181822] p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[36px] transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-crimson-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All Submissions
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[36px] flex items-center gap-1.5 transition-colors cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Needs Feedback ({pendingCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('reviewed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[36px] flex items-center gap-1.5 transition-colors cursor-pointer ${
                statusFilter === 'reviewed'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Reviewed ({reviewedCount})</span>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search athlete name or check-in notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#181822] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-crimson-500 min-h-[44px]"
            aria-label="Search check-ins"
          />
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────
          4. SUBMISSIONS FEED LIST
          ─────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {filteredSubmissions.length === 0 ? (
          <div className="bg-[#111116] border border-white/[0.08] p-12 rounded-3xl text-center">
            <Activity className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <h4 className="text-white font-bold text-base">No analytics submissions found</h4>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              No check-ins match the selected filters. Change filter criteria or log a new check-in.
            </p>
          </div>
        ) : (
          filteredSubmissions.map((entry) => {
            const hasFeedback = !!entry.coachFeedback;

            return (
              <div
                key={entry.id}
                className="bg-[#111116] border border-white/[0.08] hover:border-white/20 transition-all rounded-3xl p-6 sm:p-7 shadow-lg"
              >
                {/* Top Member Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-crimson-900/60 to-black border border-crimson-600/40 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {entry.avatarUrl ? (
                        <Image
                          src={entry.avatarUrl}
                          alt={entry.userName || 'Member'}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-crimson-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-base">
                          {entry.userName || 'Enrolled Member'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-crimson-950 text-crimson-300 border border-crimson-800">
                          {entry.userTier || 'Member'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        <span>Submitted on {entry.date}</span>
                        <span className="mx-2">·</span>
                        <span className="font-semibold text-crimson-400">Week {entry.weekNumber}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Edit Metrics + Feedback */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleOpenEditModal(entry)}
                      className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 hover:text-white text-xs font-semibold rounded-xl transition-all min-h-[44px] flex items-center gap-1.5 cursor-pointer"
                      title="Edit check-in values and measurements"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                      <span>Edit Metrics</span>
                    </button>

                    {hasFeedback ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Feedback Delivered</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-medium">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Awaiting Coach Review</span>
                      </span>
                    )}

                    <button
                      onClick={() => handleOpenFeedback(entry)}
                      className="px-4 py-2 bg-crimson-600 hover:bg-crimson-500 text-white text-xs font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(186,26,26,0.3)] min-h-[44px] flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{hasFeedback ? 'Edit Coach Feedback' : 'Give Coach Feedback'}</span>
                    </button>
                  </div>
                </div>

                {/* Body Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 py-5">
                  <div className="bg-[#15151c] p-3 rounded-xl border border-white/[0.04]">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Weight</span>
                    <span className="text-lg font-extrabold text-white font-mono mt-0.5 block">
                      {entry.weightKg} kg
                    </span>
                  </div>

                  <div className="bg-[#15151c] p-3 rounded-xl border border-white/[0.04]">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Body Fat</span>
                    <span className="text-lg font-extrabold text-emerald-400 font-mono mt-0.5 block">
                      {entry.bodyFatPercentage ? `${entry.bodyFatPercentage}%` : '—'}
                    </span>
                  </div>

                  <div className="bg-[#15151c] p-3 rounded-xl border border-white/[0.04]">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Waist</span>
                    <span className="text-lg font-extrabold text-white font-mono mt-0.5 block">
                      {entry.waistCm ? `${entry.waistCm} cm` : '—'}
                    </span>
                  </div>

                  <div className="bg-[#15151c] p-3 rounded-xl border border-white/[0.04]">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Chest</span>
                    <span className="text-lg font-extrabold text-white font-mono mt-0.5 block">
                      {entry.chestCm ? `${entry.chestCm} cm` : '—'}
                    </span>
                  </div>

                  <div className="bg-[#15151c] p-3 rounded-xl border border-white/[0.04]">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Arms</span>
                    <span className="text-lg font-extrabold text-white font-mono mt-0.5 block">
                      {entry.armsCm ? `${entry.armsCm} cm` : '—'}
                    </span>
                  </div>

                  <div className="bg-[#15151c] p-3 rounded-xl border border-white/[0.04]">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Thighs</span>
                    <span className="text-lg font-extrabold text-white font-mono mt-0.5 block">
                      {entry.thighsCm ? `${entry.thighsCm} cm` : '—'}
                    </span>
                  </div>
                </div>

                {/* Athlete Check-in Note */}
                {entry.notes && (
                  <div className="bg-[#15151c] border border-white/[0.06] p-4 rounded-2xl mb-4">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Athlete&apos;s Check-in Note:
                    </span>
                    <p className="text-xs sm:text-sm text-gray-200 leading-relaxed italic">
                      &ldquo;{entry.notes}&rdquo;
                    </p>
                  </div>
                )}

                {/* Coach Adeesha Feedback Box */}
                {entry.coachFeedback && (
                  <div className="bg-gradient-to-r from-crimson-950/40 via-[#15151f] to-crimson-950/20 border border-crimson-800/40 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-crimson-400" />
                      <span className="text-xs font-bold text-crimson-300">
                        Coach Adeesha&apos;s Guidance & Cue Feedback:
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-200 leading-relaxed font-medium">
                      {entry.coachFeedback}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────
          5. MODAL: LOG ATHLETE CHECK-IN (Coach Adeesha)
          ─────────────────────────────────────────────────────────── */}
      {logModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLogModalOpen(false);
          }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden"
        >
          <div className="bg-[#111116] border border-crimson-800/60 rounded-3xl max-w-xl w-full shadow-2xl relative flex flex-col max-h-[92vh] overflow-hidden">
            <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between flex-shrink-0 bg-[#14141d]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-crimson-950 border border-crimson-600 flex items-center justify-center text-crimson-400">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">Record Athlete Check-In</h3>
                  <p className="text-xs text-gray-400">
                    Log new weekly weigh-in & measurements on athlete&apos;s behalf
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLogModalOpen(false)}
                className="text-gray-400 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewCheckIn} className="p-6 overflow-y-auto flex-1 min-h-0 space-y-4">
              {actionError && (
                <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl">
                  {actionError}
                </div>
              )}

              {/* Athlete Selection */}
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1.5">
                  Select Athlete:
                </label>
                <select
                  value={logForm.athleteId}
                  onChange={(e) => setLogForm({ ...logForm, athleteId: e.target.value })}
                  className="w-full bg-[#161622] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-crimson-500 cursor-pointer"
                >
                  <option value="" disabled>Choose an athlete...</option>
                  {allClientMembers.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#14141d]">
                      {c.name} ({c.email || 'Client'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Week Number & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">
                    Week Number:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="52"
                    value={logForm.weekNumber}
                    onChange={(e) => setLogForm({ ...logForm, weekNumber: Number(e.target.value) })}
                    className="w-full bg-[#161622] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:ring-2 focus:ring-crimson-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">
                    Check-in Date:
                  </label>
                  <input
                    type="date"
                    value={logForm.date}
                    onChange={(e) => setLogForm({ ...logForm, date: e.target.value })}
                    className="w-full bg-[#161622] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:ring-2 focus:ring-crimson-500"
                    required
                  />
                </div>
              </div>

              {/* Weight & Body Fat */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">
                    Weight (kg) <span className="text-crimson-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 84.5"
                    value={logForm.weightKg}
                    onChange={(e) => setLogForm({ ...logForm, weightKg: e.target.value })}
                    className="w-full bg-[#161622] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:ring-2 focus:ring-crimson-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">
                    Body Fat (% Optional)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 15.5"
                    value={logForm.bodyFatPercentage}
                    onChange={(e) => setLogForm({ ...logForm, bodyFatPercentage: e.target.value })}
                    className="w-full bg-[#161622] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:ring-2 focus:ring-crimson-500 font-mono"
                  />
                </div>
              </div>

              {/* Tape Measurements: Waist, Chest, Arms */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1">
                    Waist (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 82.0"
                    value={logForm.waistCm}
                    onChange={(e) => setLogForm({ ...logForm, waistCm: e.target.value })}
                    className="w-full bg-[#161622] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1">
                    Chest (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 104.0"
                    value={logForm.chestCm}
                    onChange={(e) => setLogForm({ ...logForm, chestCm: e.target.value })}
                    className="w-full bg-[#161622] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1">
                    Arms (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 38.5"
                    value={logForm.armsCm}
                    onChange={(e) => setLogForm({ ...logForm, armsCm: e.target.value })}
                    className="w-full bg-[#161622] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Coach Feedback Cues */}
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Coach Adeesha&apos;s Review & Training Cues (Optional):
                </label>
                <textarea
                  rows={3}
                  value={logForm.coachFeedback}
                  onChange={(e) => setLogForm({ ...logForm, coachFeedback: e.target.value })}
                  placeholder="e.g. Outstanding progression on the waist. Maintain caloric deficit and increase hydration..."
                  className="w-full bg-[#161622] border border-white/10 rounded-2xl p-3 text-xs text-white focus:ring-2 focus:ring-crimson-500 resize-none"
                />
              </div>

              <div className="px-6 py-4 border-t border-white/[0.08] flex items-center justify-end gap-3 -mx-6 -mb-6 bg-[#0c0c11]">
                <button
                  type="button"
                  onClick={() => setLogModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:text-white text-xs font-bold min-h-[44px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-crimson-600 hover:bg-crimson-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-lg min-h-[44px] flex items-center gap-2 cursor-pointer"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Recording...' : 'Save Athlete Check-In'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────
          6. MODAL: EDIT MEASUREMENT METRICS
          ─────────────────────────────────────────────────────────── */}
      {editModalMeasurement && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditModalMeasurement(null);
          }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden"
        >
          <div className="bg-[#111116] border border-white/20 rounded-3xl max-w-xl w-full shadow-2xl relative flex flex-col max-h-[92vh] overflow-hidden">
            <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between flex-shrink-0 bg-[#14141d]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-crimson-950 border border-crimson-600 flex items-center justify-center text-crimson-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">Edit Check-In Metrics</h3>
                  <p className="text-xs text-gray-400">
                    Week {editModalMeasurement.weekNumber} for{' '}
                    <span className="text-white font-semibold">{editModalMeasurement.userName || editModalMeasurement.userId}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditModalMeasurement(null)}
                className="text-gray-400 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditMeasurement} className="p-6 overflow-y-auto flex-1 min-h-0 space-y-4">
              {actionError && (
                <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl">
                  {actionError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">
                    Week Number:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="52"
                    value={editForm.weekNumber}
                    onChange={(e) => setEditForm({ ...editForm, weekNumber: Number(e.target.value) })}
                    className="w-full bg-[#161622] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">
                    Check-in Date:
                  </label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    className="w-full bg-[#161622] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">
                    Weight (kg):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editForm.weightKg}
                    onChange={(e) => setEditForm({ ...editForm, weightKg: e.target.value })}
                    className="w-full bg-[#161622] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">
                    Body Fat (%):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editForm.bodyFatPercentage}
                    onChange={(e) => setEditForm({ ...editForm, bodyFatPercentage: e.target.value })}
                    className="w-full bg-[#161622] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1">
                    Waist (cm):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={editForm.waistCm}
                    onChange={(e) => setEditForm({ ...editForm, waistCm: e.target.value })}
                    className="w-full bg-[#161622] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1">
                    Chest (cm):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={editForm.chestCm}
                    onChange={(e) => setEditForm({ ...editForm, chestCm: e.target.value })}
                    className="w-full bg-[#161622] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1">
                    Arms (cm):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={editForm.armsCm}
                    onChange={(e) => setEditForm({ ...editForm, armsCm: e.target.value })}
                    className="w-full bg-[#161622] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Coach Adeesha&apos;s Review & Training Cues:
                </label>
                <textarea
                  rows={3}
                  value={editForm.coachFeedback}
                  onChange={(e) => setEditForm({ ...editForm, coachFeedback: e.target.value })}
                  className="w-full bg-[#161622] border border-white/10 rounded-2xl p-3 text-xs text-white focus:ring-2 focus:ring-crimson-500 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Athlete&apos;s Notes:
                </label>
                <textarea
                  rows={2}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full bg-[#161622] border border-white/10 rounded-2xl p-3 text-xs text-white focus:ring-2 focus:ring-crimson-500 resize-none"
                />
              </div>

              <div className="px-6 py-4 border-t border-white/[0.08] flex items-center justify-end gap-3 -mx-6 -mb-6 bg-[#0c0c11]">
                <button
                  type="button"
                  onClick={() => setEditModalMeasurement(null)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:text-white text-xs font-bold min-h-[44px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-crimson-600 hover:bg-crimson-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-lg min-h-[44px] flex items-center gap-2 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Updating...' : 'Save Updated Metrics'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────
          7. QUICK FEEDBACK MODAL
          ─────────────────────────────────────────────────────────── */}
      {feedbackModalMeasurement && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setFeedbackModalMeasurement(null);
          }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden"
        >
          <div className="bg-[#111116] border border-crimson-800/60 rounded-3xl max-w-xl w-full shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden">
            <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between flex-shrink-0 bg-[#14141d]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-crimson-950 border border-crimson-600 flex items-center justify-center text-crimson-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">Coach Feedback Desk</h3>
                  <p className="text-xs text-gray-400">
                    Week {feedbackModalMeasurement.weekNumber} Review for{' '}
                    <span className="text-white font-semibold">
                      {feedbackModalMeasurement.userName || feedbackModalMeasurement.userId}
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackModalMeasurement(null)}
                className="text-gray-400 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-4">
              <div className="bg-[#161620] p-4 rounded-xl border border-white/[0.06] text-xs text-gray-300 space-y-1">
                <div>
                  <span className="text-gray-400">Weight Logged:</span>{' '}
                  <span className="font-bold text-white font-mono">
                    {feedbackModalMeasurement.weightKg} kg
                  </span>{' '}
                  {feedbackModalMeasurement.bodyFatPercentage && (
                    <span>({feedbackModalMeasurement.bodyFatPercentage}% BF)</span>
                  )}
                </div>
                {feedbackModalMeasurement.notes && (
                  <div className="italic text-gray-400 mt-1">
                    &ldquo;{feedbackModalMeasurement.notes}&rdquo;
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="coachFeedback" className="text-xs font-bold text-gray-300 block">
                  Coach Adeesha&apos;s Review & Training Cues:
                </label>
                <textarea
                  id="coachFeedback"
                  rows={4}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="e.g. Great progress on the waistline. Keep pushing the squat depth and maintain protein at 190g..."
                  className="w-full bg-[#161620] border border-white/10 rounded-2xl p-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-crimson-500 resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/[0.08] flex items-center justify-end gap-3 flex-shrink-0 bg-[#0c0c11]">
              <button
                type="button"
                onClick={() => setFeedbackModalMeasurement(null)}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:text-white text-xs font-bold min-h-[44px] cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting || !feedbackText.trim()}
                onClick={handleSendFeedback}
                className="px-6 py-2.5 bg-crimson-600 hover:bg-crimson-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(186,26,26,0.5)] min-h-[44px] flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Delivering...' : 'Send Coach Feedback'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
