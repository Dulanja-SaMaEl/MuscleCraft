'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Activity,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MessageSquare,
  TrendingDown,
  TrendingUp,
  User,
  Scale,
  Send,
  X,
  ChevronRight,
  Sparkles,
  Flame,
  Award,
} from 'lucide-react';
import { BodyMeasurement, User as UserType } from '@/lib/types';

interface BodyAnalyticsTabProps {
  measurements: (BodyMeasurement & {
    userName?: string;
    userTier?: string;
    userEmail?: string;
    avatarUrl?: string;
  })[];
  members: UserType[];
  onSaveFeedback: (measurementId: string, feedback: string) => Promise<void>;
}

export default function BodyAnalyticsTab({
  measurements,
  members,
  onSaveFeedback,
}: BodyAnalyticsTabProps) {
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Feedback modal state
  const [feedbackModalMeasurement, setFeedbackModalMeasurement] = useState<BodyMeasurement | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clients with submissions
  const clientsWithSubmissions = members.filter((m) =>
    measurements.some((meas) => meas.userId === m.id)
  );

  // Filtered submissions
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
      (m.notes && m.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesClient && matchesStatus && matchesSearch;
  });

  const pendingCount = measurements.filter((m) => !m.coachFeedback).length;
  const reviewedCount = measurements.filter((m) => !!m.coachFeedback).length;

  const handleOpenFeedback = (m: BodyMeasurement) => {
    setFeedbackModalMeasurement(m);
    setFeedbackText(m.coachFeedback || '');
  };

  const handleSendFeedback = async () => {
    if (!feedbackModalMeasurement || !feedbackText.trim()) return;
    setIsSubmitting(true);
    try {
      await onSaveFeedback(feedbackModalMeasurement.id, feedbackText.trim());
      setFeedbackModalMeasurement(null);
      setFeedbackText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trainee chart data for the selected client or first client
  const activeChartClientId =
    selectedClientFilter !== 'all'
      ? selectedClientFilter
      : clientsWithSubmissions[0]?.id || 'usr_client_90';

  const clientHistory = measurements
    .filter((m) => m.userId === activeChartClientId)
    .sort((a, b) => a.weekNumber - b.weekNumber);

  const activeClientUser = members.find((m) => m.id === activeChartClientId);

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

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-full bg-crimson-950/60 border border-crimson-800/50 text-crimson-300 text-xs font-mono font-bold flex items-center gap-1.5">
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
          <div className="text-[11px] text-gray-400 mt-1.5">Across all enrolled members</div>
        </div>

        <div className="bg-[#111116] border border-amber-600/30 p-5 rounded-2xl bg-gradient-to-br from-[#111116] to-amber-950/20">
          <div className="flex items-center justify-between text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <span>Pending Coach Reviews</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono mt-2">
            {pendingCount}
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1.5">Requires Coach Adeesha cues</div>
        </div>

        <div className="bg-[#111116] border border-emerald-600/30 p-5 rounded-2xl bg-gradient-to-br from-[#111116] to-emerald-950/20">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <span>Coach Feedback Delivered</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300 font-mono mt-2">
            {reviewedCount}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1.5">Reviewed and verified</div>
        </div>

        <div className="bg-[#111116] border border-white/[0.08] p-5 rounded-2xl">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase tracking-wider">
            <span>Active Tracking Cohort</span>
            <User className="w-4 h-4 text-crimson-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-2">
            {clientsWithSubmissions.length || 4}
          </div>
          <div className="text-[11px] text-gray-400 mt-1.5">VIP & Sole members checking in</div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────
          2. SELECTED CLIENT PROGRESSION CHART
          ─────────────────────────────────────────────────────────── */}
      {clientHistory.length > 0 && (
        <div className="bg-[#111116] border border-white/[0.08] p-6 sm:p-7 rounded-3xl shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-crimson-400">
                  Progression Trajectory
                </span>
                <span className="text-gray-500">·</span>
                <span className="text-xs text-gray-400">
                  {activeClientUser?.name || 'Selected Athlete'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                Weight (kg) & Body Fat (%) Evolution
              </h3>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-crimson-950/60 border border-crimson-800/50 text-crimson-300 font-semibold">
                <span className="w-2 h-2 rounded-full bg-crimson-500"></span>
                Weight (kg)
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Body Fat (%)
              </span>
            </div>
          </div>

          {/* SVG Progress Graph */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {clientHistory.map((entry, idx) => {
              const prev = idx > 0 ? clientHistory[idx - 1] : null;
              const weightDiff = prev ? entry.weightKg - prev.weightKg : 0;
              const bfDiff = prev && entry.bodyFatPercentage && prev.bodyFatPercentage
                ? entry.bodyFatPercentage - prev.bodyFatPercentage
                : 0;

              return (
                <div
                  key={entry.id}
                  className="bg-[#16161f] border border-white/[0.06] p-4 rounded-xl flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-crimson-400 uppercase tracking-wider">
                      Week {entry.weekNumber}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">{entry.date}</span>
                  </div>

                  <div className="mt-2.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-extrabold text-white font-mono">
                        {entry.weightKg} kg
                      </span>
                      {weightDiff !== 0 && (
                        <span
                          className={`text-xs font-mono font-bold flex items-center ${
                            weightDiff < 0 ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {weightDiff < 0 ? (
                            <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                          ) : (
                            <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                          )}
                          {weightDiff > 0 ? `+${weightDiff.toFixed(1)}` : weightDiff.toFixed(1)}kg
                        </span>
                      )}
                    </div>

                    {entry.bodyFatPercentage && (
                      <div className="flex items-center justify-between text-xs text-gray-400 mt-1 font-mono">
                        <span>Body Fat: {entry.bodyFatPercentage}%</span>
                        {bfDiff !== 0 && (
                          <span className={bfDiff < 0 ? 'text-emerald-400' : 'text-amber-400'}>
                            {bfDiff < 0 ? bfDiff.toFixed(1) : `+${bfDiff.toFixed(1)}`}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
              {clientsWithSubmissions.map((c) => (
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[36px] transition-colors ${
                statusFilter === 'all'
                  ? 'bg-crimson-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All Submissions
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[36px] flex items-center gap-1.5 transition-colors ${
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[36px] flex items-center gap-1.5 transition-colors ${
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
              No check-ins match the selected filters. Change filter criteria or reset search.
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

                  {/* Feedback Status Pill */}
                  <div className="flex items-center gap-3">
                    {hasFeedback ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Feedback Delivered</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-950/70 border border-amber-600/60 text-amber-300 text-xs font-bold animate-pulse">
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
          5. COACH FEEDBACK MODAL
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
            {/* Pinned Header */}
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
                      {feedbackModalMeasurement.userId}
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

            {/* Scrollable Body */}
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

            {/* Pinned Footer */}
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
