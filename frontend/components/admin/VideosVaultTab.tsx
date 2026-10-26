'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Video,
  Plus,
  Play,
  Trash2,
  Search,
  Filter,
  User,
  Globe,
  Sparkles,
  Flame,
  Clock,
  X,
  ExternalLink,
  Shield,
  Layers,
} from 'lucide-react';
import { ExerciseVideo, User as UserType, VideoTargetScope } from '@/lib/types';

interface VideosVaultTabProps {
  videos: ExerciseVideo[];
  members: UserType[];
  onAddVideo: (videoData: any) => Promise<void>;
  onDeleteVideo: (videoId: string) => Promise<void>;
}

export default function VideosVaultTab({
  videos,
  members,
  onAddVideo,
  onDeleteVideo,
}: VideosVaultTabProps) {
  const [scopeFilter, setScopeFilter] = useState<'all' | 'specific_client' | 'all_members'>('all');
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [activePlaybackVideo, setActivePlaybackVideo] = useState<ExerciseVideo | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    title: string;
    category:
      | 'Warmup'
      | 'Hypertrophy'
      | 'Powerlifting'
      | 'Mobility'
      | 'Coaching Clinic'
      | 'Technique Review'
      | 'Personalized Session';
    duration: string;
    targetScope: VideoTargetScope;
    targetClientId: string;
    videoUrl: string;
    thumbnailUrl: string;
    description: string;
  }>({
    title: '',
    category: 'Technique Review',
    duration: '08:30',
    targetScope: 'specific_client',
    targetClientId: members.find((m) => m.role === 'client')?.id || 'usr_client_90',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
    description: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const clientMembers = members.filter((m) => m.role === 'client');

  // Filtered videos
  const filteredVideos = videos.filter((v) => {
    // Scope filter
    let matchesScope = true;
    if (scopeFilter === 'specific_client') {
      matchesScope = v.targetScope === 'specific_client' || !!v.targetClientId;
    } else if (scopeFilter === 'all_members') {
      matchesScope = v.targetScope === 'all_members' || (!v.targetClientId && v.accessLevel === 'common');
    }

    // Client filter
    const matchesClient =
      selectedClientFilter === 'all' || v.targetClientId === selectedClientFilter;

    // Category filter
    const matchesCategory =
      categoryFilter === 'all' || v.category.toLowerCase() === categoryFilter.toLowerCase();

    // Search query
    const matchesSearch =
      !searchQuery ||
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.targetClientName && v.targetClientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      v.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesScope && matchesClient && matchesCategory && matchesSearch;
  });

  const clientSpecificCount = videos.filter(
    (v) => v.targetScope === 'specific_client' || !!v.targetClientId
  ).length;
  const allMembersCount = videos.filter(
    (v) => v.targetScope === 'all_members' || (!v.targetClientId && v.accessLevel === 'common')
  ).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) return;

    setIsSubmitting(true);
    try {
      const selectedClient = members.find((m) => m.id === formData.targetClientId);
      await onAddVideo({
        ...formData,
        targetClientName: formData.targetScope === 'specific_client' ? selectedClient?.name : undefined,
        targetClientId: formData.targetScope === 'specific_client' ? formData.targetClientId : undefined,
        accessLevel: formData.targetScope === 'coaching_90_vip' ? 'coaching_90' : 'common',
      });
      setShowAddModal(false);
      setFormData({
        title: '',
        category: 'Technique Review',
        duration: '08:30',
        targetScope: 'specific_client',
        targetClientId: clientMembers[0]?.id || 'usr_client_90',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
        description: '',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* ───────────────────────────────────────────────────────────
          1. HEADER & PRIMARY ACTION
          ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-xl bg-crimson-950/80 border border-crimson-600/40 text-crimson-400">
              <Video className="w-5 h-5" />
            </span>
            Session Videos & Video Vault Management
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Submit personalized session videos for individual clients or broadcast workout sessions for all gym members.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-crimson-600 to-rose-600 hover:from-crimson-500 hover:to-rose-500 text-white text-xs font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(186,26,26,0.4)] flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Submit New Session Video</span>
        </button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111116] border border-white/[0.08] p-5 rounded-2xl">
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block">
            Total Vault Videos
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-2 block">
            {videos.length}
          </span>
          <span className="text-[11px] text-gray-400 mt-1 block">Indexed in MuscleCraft CDN</span>
        </div>

        <div className="bg-[#111116] border border-crimson-800/40 p-5 rounded-2xl bg-gradient-to-br from-[#111116] to-crimson-950/20">
          <span className="text-crimson-300 text-xs font-semibold uppercase tracking-wider block">
            Client-Specific Sessions
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-crimson-300 font-mono mt-2 block">
            {clientSpecificCount}
          </span>
          <span className="text-[11px] text-crimson-400/80 mt-1 block">Private technique audits</span>
        </div>

        <div className="bg-[#111116] border border-emerald-800/40 p-5 rounded-2xl bg-gradient-to-br from-[#111116] to-emerald-950/20">
          <span className="text-emerald-300 text-xs font-semibold uppercase tracking-wider block">
            All-Member Library
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-300 font-mono mt-2 block">
            {allMembersCount}
          </span>
          <span className="text-[11px] text-emerald-400/80 mt-1 block">Accessible to all athletes</span>
        </div>

        <div className="bg-[#111116] border border-white/[0.08] p-5 rounded-2xl">
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block">
            Stream Bandwidth
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-2 block">
            99.9%
          </span>
          <span className="text-[11px] text-gray-400 mt-1 block">Cloudflare adaptive bitrate</span>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────
          2. FILTERS & SEARCH BAR
          ─────────────────────────────────────────────────────────── */}
      <div className="bg-[#111116] border border-white/[0.08] p-4 sm:p-5 rounded-2xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Scope Selector Pills */}
          <div className="flex items-center bg-[#181822] p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setScopeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[36px] transition-colors ${
                scopeFilter === 'all'
                  ? 'bg-crimson-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All Videos ({videos.length})
            </button>
            <button
              onClick={() => setScopeFilter('specific_client')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[36px] flex items-center gap-1.5 transition-colors ${
                scopeFilter === 'specific_client'
                  ? 'bg-crimson-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <User className="w-3 h-3" />
              <span>Client-Specific ({clientSpecificCount})</span>
            </button>
            <button
              onClick={() => setScopeFilter('all_members')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[36px] flex items-center gap-1.5 transition-colors ${
                scopeFilter === 'all_members'
                  ? 'bg-crimson-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>All Members ({allMembersCount})</span>
            </button>
          </div>

          {/* Client Specific Dropdown when in client mode */}
          {scopeFilter !== 'all_members' && (
            <select
              value={selectedClientFilter}
              onChange={(e) => setSelectedClientFilter(e.target.value)}
              className="bg-[#181822] border border-white/10 text-white text-xs font-semibold rounded-xl px-3 py-2 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-crimson-500 cursor-pointer"
              aria-label="Filter by assigned client"
            >
              <option value="all">👥 Any Client</option>
              {clientMembers.map((c) => (
                <option key={c.id} value={c.id}>
                  👤 {c.name}
                </option>
              ))}
            </select>
          )}

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#181822] border border-white/10 text-white text-xs font-semibold rounded-xl px-3 py-2 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-crimson-500 cursor-pointer"
            aria-label="Filter by category"
          >
            <option value="all">⚡ All Categories</option>
            <option value="Personalized Session">Personalized Session</option>
            <option value="Technique Review">Technique Review</option>
            <option value="Powerlifting">Powerlifting</option>
            <option value="Hypertrophy">Hypertrophy</option>
            <option value="Mobility">Mobility</option>
            <option value="Coaching Clinic">Coaching Clinic</option>
            <option value="Warmup">Warmup</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search title, athlete or instructions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#181822] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-crimson-500 min-h-[44px]"
            aria-label="Search videos"
          />
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────
          3. VIDEOS GRID
          ─────────────────────────────────────────────────────────── */}
      {filteredVideos.length === 0 ? (
        <div className="bg-[#111116] border border-white/[0.08] p-12 rounded-3xl text-center">
          <Video className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <h4 className="text-white font-bold text-base">No session videos found</h4>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, scope, or upload a new session video using the button above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => {
            const isClientSpecific = video.targetScope === 'specific_client' || !!video.targetClientId;

            return (
              <div
                key={video.id}
                className="bg-[#111116] border border-white/[0.08] hover:border-crimson-600/50 transition-all rounded-3xl overflow-hidden flex flex-col justify-between group shadow-lg"
              >
                <div>
                  {/* Thumbnail Container */}
                  <div className="relative aspect-video w-full bg-black overflow-hidden">
                    <Image
                      src={video.thumbnailUrl}
                      alt={video.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

                    {/* Play Button Trigger */}
                    <button
                      onClick={() => setActivePlaybackVideo(video)}
                      className="absolute inset-0 flex items-center justify-center cursor-pointer group/btn"
                      aria-label={`Play preview for ${video.title}`}
                    >
                      <div className="w-12 h-12 rounded-full bg-crimson-600/90 text-white flex items-center justify-center shadow-[0_0_20px_rgba(186,26,26,0.8)] group-hover/btn:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                    </button>

                    {/* Duration Badge */}
                    <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/80 backdrop-blur text-[10px] font-mono font-bold text-white border border-white/10">
                      {video.duration}
                    </span>

                    {/* Target Scope Badge */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      {isClientSpecific ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-crimson-950/90 border border-crimson-600 text-crimson-300 text-[10.5px] font-extrabold shadow-md">
                          <User className="w-3 h-3" />
                          <span>{video.targetClientName || 'Client Specific'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/90 border border-emerald-600 text-emerald-300 text-[10.5px] font-extrabold shadow-md">
                          <Globe className="w-3 h-3" />
                          <span>All Members</span>
                        </span>
                      )}

                      <span className="px-2 py-1 rounded-full bg-black/70 backdrop-blur text-gray-300 border border-white/10 text-[10px] font-bold">
                        {video.category}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5">
                    <h3 className="text-white font-bold text-sm sm:text-base leading-snug line-clamp-2">
                      {video.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                      {video.description}
                    </p>
                  </div>
                </div>

                {/* Footer Strip */}
                <div className="p-5 pt-0 border-t border-white/[0.04] mt-2 flex items-center justify-between">
                  <div className="text-[11px] text-gray-400">
                    <span className="font-semibold text-gray-300">{video.instructorName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActivePlaybackVideo(video)}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors min-h-[36px] cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Watch</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${video.title}"?`)) {
                          onDeleteVideo(video.id);
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                      aria-label={`Delete video ${video.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────
          4. SUBMIT SESSION VIDEO MODAL
          ─────────────────────────────────────────────────────────── */}
      {showAddModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-[#111116] border border-crimson-800/60 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-xl bg-white/5 cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-crimson-950 border border-crimson-600 flex items-center justify-center text-crimson-400 shadow-[0_0_20px_rgba(186,26,26,0.4)]">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Submit Session Video</h3>
                <p className="text-xs text-gray-400">
                  Assign to an individual client or publish to the all-members gym library.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Target Scope Selector */}
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-2">
                  Target Recipient / Scope:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, targetScope: 'specific_client' })}
                    className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all min-h-[56px] cursor-pointer ${
                      formData.targetScope === 'specific_client'
                        ? 'bg-crimson-950/60 border-crimson-600 text-white shadow-[0_0_15px_rgba(186,26,26,0.3)]'
                        : 'bg-[#161620] border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    <User className="w-5 h-5 text-crimson-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold block">👤 Client-Specific Session</span>
                      <span className="text-[11px] text-gray-400 block mt-0.5">
                        Private technique breakdown for one athlete
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, targetScope: 'all_members' })}
                    className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all min-h-[56px] cursor-pointer ${
                      formData.targetScope === 'all_members'
                        ? 'bg-emerald-950/60 border-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                        : 'bg-[#161620] border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    <Globe className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold block">🌐 All Clients & Members</span>
                      <span className="text-[11px] text-gray-400 block mt-0.5">
                        Broadcast to everyone in the common library
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Conditional Client Selector */}
              {formData.targetScope === 'specific_client' && (
                <div>
                  <label htmlFor="targetClientSelect" className="text-xs font-bold text-gray-300 block mb-1.5">
                    Select Assigned Client:
                  </label>
                  <select
                    id="targetClientSelect"
                    value={formData.targetClientId}
                    onChange={(e) => setFormData({ ...formData, targetClientId: e.target.value })}
                    className="w-full bg-[#161620] border border-white/10 text-white text-xs font-semibold rounded-xl px-4 py-2.5 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-crimson-500 cursor-pointer"
                  >
                    {clientMembers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.packageName || c.tier}) - {c.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Video Title */}
              <div>
                <label htmlFor="videoTitle" className="text-xs font-bold text-gray-300 block mb-1.5">
                  Video Title:
                </label>
                <input
                  id="videoTitle"
                  type="text"
                  required
                  placeholder="e.g. Marcus Vance — Week 4 Squat Depth & Knee Tracking Correction"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[#161620] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-crimson-500 min-h-[44px]"
                />
              </div>

              {/* Category & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="videoCategory" className="text-xs font-bold text-gray-300 block mb-1.5">
                    Category:
                  </label>
                  <select
                    id="videoCategory"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full bg-[#161620] border border-white/10 text-white text-xs font-semibold rounded-xl px-4 py-2.5 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-crimson-500 cursor-pointer"
                  >
                    <option value="Personalized Session">Personalized Session</option>
                    <option value="Technique Review">Technique Review</option>
                    <option value="Powerlifting">Powerlifting</option>
                    <option value="Hypertrophy">Hypertrophy</option>
                    <option value="Mobility">Mobility</option>
                    <option value="Coaching Clinic">Coaching Clinic</option>
                    <option value="Warmup">Warmup</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="videoDuration" className="text-xs font-bold text-gray-300 block mb-1.5">
                    Duration (MM:SS):
                  </label>
                  <input
                    id="videoDuration"
                    type="text"
                    required
                    placeholder="08:30"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full bg-[#161620] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-crimson-500 min-h-[44px]"
                  />
                </div>
              </div>

              {/* Video URL */}
              <div>
                <label htmlFor="videoUrl" className="text-xs font-bold text-gray-300 block mb-1.5">
                  Video Stream URL:
                </label>
                <input
                  id="videoUrl"
                  type="url"
                  required
                  placeholder="https://commondatastorage.googleapis.com/... or MP4 link"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  className="w-full bg-[#161620] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-crimson-500 min-h-[44px] font-mono text-[11px]"
                />
              </div>

              {/* Thumbnail URL */}
              <div>
                <label htmlFor="thumbnailUrl" className="text-xs font-bold text-gray-300 block mb-1.5">
                  Thumbnail Image URL:
                </label>
                <input
                  id="thumbnailUrl"
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                  className="w-full bg-[#161620] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-crimson-500 min-h-[44px] font-mono text-[11px]"
                />
              </div>

              {/* Description / Coach Instructions */}
              <div>
                <label htmlFor="videoDesc" className="text-xs font-bold text-gray-300 block mb-1.5">
                  Coach Instructions & Athlete Cues:
                </label>
                <textarea
                  id="videoDesc"
                  required
                  rows={3}
                  placeholder="Describe key technique adjustments, bar path, breathing cues, and what the athlete should execute next session..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#161620] border border-white/10 rounded-xl p-3.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-crimson-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:text-white text-xs font-bold min-h-[44px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-crimson-600 hover:bg-crimson-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(186,26,26,0.5)] min-h-[44px] flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Publishing...' : 'Publish Session Video'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────
          5. VIDEO PLAYBACK PREVIEW MODAL
          ─────────────────────────────────────────────────────────── */}
      {activePlaybackVideo && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div className="bg-[#111116] border border-crimson-800/60 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-crimson-400 uppercase tracking-widest block">
                  MuscleCraft Video Vault Preview
                </span>
                <h3 className="text-white font-bold text-sm sm:text-base mt-0.5 line-clamp-1">
                  {activePlaybackVideo.title}
                </h3>
              </div>

              <button
                onClick={() => setActivePlaybackVideo(null)}
                className="text-gray-400 hover:text-white p-2 rounded-xl bg-white/5 cursor-pointer"
                aria-label="Close preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Player */}
            <div className="relative aspect-video w-full bg-black">
              <video
                src={activePlaybackVideo.videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              >
                Your browser does not support HTML5 video playback.
              </video>
            </div>

            {/* Video Details */}
            <div className="p-5 sm:p-6 bg-[#161620] space-y-3 overflow-y-auto">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-crimson-950 text-crimson-300 border border-crimson-800 text-[11px] font-bold">
                  {activePlaybackVideo.category}
                </span>
                <span className="px-2.5 py-1 rounded bg-white/5 text-gray-300 border border-white/10 text-[11px] font-mono">
                  Duration: {activePlaybackVideo.duration}
                </span>
                {activePlaybackVideo.targetClientName && (
                  <span className="px-2.5 py-1 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[11px] font-semibold">
                    👤 Targeted Athlete: {activePlaybackVideo.targetClientName}
                  </span>
                )}
              </div>

              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Coach Instructions & Breakdown:
                </span>
                <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
                  {activePlaybackVideo.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
