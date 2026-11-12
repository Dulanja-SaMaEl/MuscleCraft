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
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileVideo,
  HardDrive,
  Link as LinkIcon,
  HelpCircle,
  Loader2,
  Check,
  Copy,
} from 'lucide-react';
import { ExerciseVideo, User as UserType, VideoTargetScope } from '@/lib/types';
import MuscleCraftVideoPlayer from '@/components/video/MuscleCraftVideoPlayer';

interface VideosVaultTabProps {
  videos: ExerciseVideo[];
  members: UserType[];
  healthData?: any;
  isLoading?: boolean;
  onAddVideo: (videoData: any) => Promise<void>;
  onDeleteVideo: (videoId: string) => Promise<void>;
}

export default function VideosVaultTab({
  videos,
  members,
  healthData,
  isLoading,
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
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
    description: '',
  });

  // Video Upload & Percentage Progress State
  const [sourceMode, setSourceMode] = useState<'upload' | 'url'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadSpeed, setUploadSpeed] = useState<string>('');
  const [uploadedBytes, setUploadedBytes] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const [showR2GuideModal, setShowR2GuideModal] = useState<boolean>(false);
  const [copiedCors, setCopiedCors] = useState<boolean>(false);

  const copyCorsSnippet = () => {
    const corsJson = `[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "HEAD", "POST"],
    "AllowedHeaders": ["*"]
  }
]`;
    navigator.clipboard.writeText(corsJson);
    setCopiedCors(true);
    setTimeout(() => setCopiedCors(false), 2000);
  };

  const handleUploadFile = async (file: File) => {
    setSelectedFile(file);
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError('');
    setUploadStatus('Requesting direct Cloudflare R2 upload pipeline...');

    // Automatically detect video duration from the selected file
    try {
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      tempVideo.onloadedmetadata = () => {
        window.URL.revokeObjectURL(tempVideo.src);
        const sec = tempVideo.duration;
        if (!isNaN(sec) && sec > 0) {
          const mins = Math.floor(sec / 60);
          const remSecs = Math.floor(sec % 60);
          const formattedDuration = `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
          setFormData((prev) => ({ ...prev, duration: formattedDuration }));
        }
      };
      tempVideo.src = URL.createObjectURL(file);
    } catch (_) {}

    const storedUid = typeof window !== 'undefined' ? localStorage.getItem('musclecraft_user_id') || 'usr_admin_1' : 'usr_admin_1';

    // Step 1: Request presigned direct upload URL from Cloudflare R2
    let directUploadData: any = null;
    try {
      const presignRes = await fetch(`/api/videos/upload-url?userId=${encodeURIComponent(storedUid)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || 'video/mp4',
          size: file.size,
        }),
      });
      if (presignRes.ok) {
        directUploadData = await presignRes.json();
      }
    } catch (e) {
      console.warn('Direct upload URL request skipped:', e);
    }

    const startTime = Date.now();
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);

        const elapsedSec = (Date.now() - startTime) / 1000;
        if (elapsedSec > 0.3) {
          const speedMBps = event.loaded / (1024 * 1024) / elapsedSec;
          setUploadSpeed(`${speedMBps.toFixed(1)} MB/s`);
        }
        const loadedMB = (event.loaded / (1024 * 1024)).toFixed(1);
        const totalMB = (event.total / (1024 * 1024)).toFixed(1);
        setUploadedBytes(`${loadedMB} MB / ${totalMB} MB`);

        if (percent < 100) {
          setUploadStatus(`Direct Upload to Cloudflare R2 Vault... ${percent}%`);
        } else {
          setUploadStatus('Verifying & indexing video stream (100%)...');
        }
      }
    };

    // Case A: Direct Presigned Upload (Bypasses Vercel 4.5MB limit completely)
    if (directUploadData?.useDirectUpload && directUploadData?.uploadUrl) {
      xhr.onload = () => {
        setIsUploading(false);
        if (xhr.status >= 200 && xhr.status < 300) {
          const finalUrl = directUploadData.publicUrl;
          setFormData((prev) => ({
            ...prev,
            videoUrl: finalUrl,
            title: prev.title || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
          }));
          setUploadProgress(100);
          setUploadStatus('Upload Complete (100%) — Video is ready to publish');
        } else {
          setUploadError(`Cloudflare R2 Direct Upload returned HTTP ${xhr.status}. Make sure CORS is enabled on your Cloudflare R2 bucket (Click "Cloudflare R2 Storage Guide" above).`);
        }
      };

      xhr.onerror = () => {
        setIsUploading(false);
        setUploadError('Network error uploading to Cloudflare R2. Please ensure CORS is enabled on your bucket: Cloudflare Dashboard → R2 → musclecraft-videos → Settings → CORS Policy.');
      };

      xhr.open('PUT', directUploadData.uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
      xhr.send(file);
      return;
    }

    // Case B: Fallback to Serverless Upload Route
    const formDataObj = new FormData();
    formDataObj.append('file', file);
    formDataObj.append('title', formData.title || file.name);

    xhr.onload = () => {
      setIsUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.url) {
            const finalUrl = res.url;
            setFormData((prev) => ({
              ...prev,
              videoUrl: finalUrl,
              title: prev.title || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
            }));
            setUploadProgress(100);
            const providerName =
              res.storageProvider === 'cloudflare_r2'
                ? 'Cloudflare R2 Bucket'
                : res.storageProvider === 'supabase_storage'
                ? 'Supabase Storage'
                : 'MuscleCraft Local Vault';
            setUploadStatus(`Upload Complete (100%) — Stored in ${providerName}`);
          }
        } catch (e) {
          setUploadError('Failed to parse upload response from server.');
        }
      } else if (xhr.status === 413) {
        setUploadError('File exceeds Vercel 4.5 MB limit. Please enable Cloudflare R2 Direct Upload to support files up to 5 GB.');
      } else {
        setUploadError(`Upload failed with status HTTP ${xhr.status}. Please check file format or size.`);
      }
    };

    xhr.onerror = () => {
      setIsUploading(false);
      setUploadError('Connection error while uploading video. Please check your network.');
    };

    xhr.open('POST', `/api/videos/upload?userId=${encodeURIComponent(storedUid)}`);
    xhr.send(formDataObj);
  };

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
    if (!formData.title.trim()) return;

    if (!formData.videoUrl) {
      setUploadError('Please select and upload a video file or provide a video URL before publishing.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedClient = members.find((m) => m.id === formData.targetClientId);
      const safeDescription = formData.description.trim() || 'Coaching guidance and technique review session.';
      await onAddVideo({
        ...formData,
        description: safeDescription,
        targetClientName: formData.targetScope === 'specific_client' ? selectedClient?.name : undefined,
        targetClientId: formData.targetScope === 'specific_client' ? formData.targetClientId : undefined,
        accessLevel: formData.targetScope === 'coaching_90_vip' ? 'coaching_90' : 'common',
      });
      setShowAddModal(false);
      setSelectedFile(null);
      setUploadProgress(0);
      setUploadStatus('');
      setUploadedBytes('');
      setUploadSpeed('');
      setUploadError('');
      setFormData({
        title: '',
        category: 'Technique Review',
        duration: '08:30',
        targetScope: 'specific_client',
        targetClientId: clientMembers[0]?.id || 'usr_client_90',
        videoUrl: '',
        thumbnailUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
        description: '',
      });
    } catch (err: any) {
      let msg = err.message || 'Failed to publish video.';
      if (typeof msg === 'string' && msg.startsWith('[')) {
        try {
          const parsed = JSON.parse(msg);
          if (Array.isArray(parsed)) {
            msg = parsed.map((e: any) => e.message || `${e.path?.join('.')}: invalid`).join('. ');
          }
        } catch (_) {}
      }
      setUploadError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && videos.length === 0) {
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

        {/* Filter Bar Skeleton */}
        <div className="bg-[#111116] border border-white/[0.08] p-4 rounded-2xl flex flex-col md:flex-row gap-4 justify-between">
          <div className="h-10 flex-1 bg-white/[0.03] rounded-xl" />
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-white/[0.05] rounded-xl" />
            <div className="h-10 w-32 bg-white/[0.05] rounded-xl" />
          </div>
        </div>

        {/* Videos Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-[#111116] border border-white/[0.08] rounded-3xl overflow-hidden space-y-4 p-4">
              <div className="h-44 w-full bg-white/[0.03] rounded-2xl flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/10" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 w-40 bg-white/15 rounded" />
                  <div className="h-4 w-16 bg-white/10 rounded-full" />
                </div>
                <div className="h-3 w-56 bg-white/5 rounded" />
              </div>
              <div className="flex gap-2 pt-2 border-t border-white/[0.06]">
                <div className="h-9 flex-1 bg-white/10 rounded-xl" />
                <div className="h-9 w-10 bg-rose-950/30 rounded-xl" />
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

        <div className="flex flex-wrap items-center gap-3">
          {healthData?.storage?.cloudflareR2?.connected ? (
            <div className="px-3.5 py-2 rounded-xl bg-emerald-950/70 border border-emerald-600/40 text-emerald-300 text-xs font-mono font-medium flex items-center gap-2 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>R2 Vault: {healthData.storage.cloudflareR2.bucket} ({healthData.storage.cloudflareR2.latencyMs}ms)</span>
            </div>
          ) : healthData?.storage?.cloudflareR2?.configured ? (
            <div className="px-3.5 py-2 rounded-xl bg-amber-950/70 border border-amber-600/40 text-amber-300 text-xs font-mono font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>R2 Vault: Configured</span>
            </div>
          ) : (
            <div className="px-3.5 py-2 rounded-xl bg-[#161620] border border-white/[0.08] text-gray-400 text-xs font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
              <span>Vault: Local Engine</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowR2GuideModal(true)}
            className="px-4 py-2.5 bg-[#161620] hover:bg-[#1e1e2d] border border-amber-500/40 text-amber-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 min-h-[44px] cursor-pointer shadow-sm hover:border-amber-400"
          >
            <HardDrive className="w-4 h-4 text-amber-400" />
            <span>Cloudflare R2 Storage Guide</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-crimson-600 to-rose-600 hover:from-crimson-500 hover:to-rose-500 text-white text-xs font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(186,26,26,0.4)] flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Submit New Session Video</span>
          </button>
        </div>
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

        <div className="bg-[#111116] border border-white/[0.08] p-5 rounded-2xl">
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block">
            Client-Specific Sessions
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-crimson-400 font-mono mt-2 block">
            {clientSpecificCount}
          </span>
          <span className="text-[11px] text-gray-400 mt-1 block">Private technique audits</span>
        </div>

        <div className="bg-[#111116] border border-white/[0.08] p-5 rounded-2xl">
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block">
            All-Member Library
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono mt-2 block">
            {allMembersCount}
          </span>
          <span className="text-[11px] text-gray-400 mt-1 block">Accessible to all athletes</span>
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
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden"
        >
          <div className="bg-[#111116] border border-crimson-800/60 rounded-3xl max-w-2xl w-full shadow-2xl relative flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden">
            {/* Pinned Modal Header */}
            <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between flex-shrink-0 bg-[#14141d]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-crimson-950 border border-crimson-600 flex items-center justify-center text-crimson-400 shadow-[0_0_15px_rgba(186,26,26,0.35)]">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">Submit Session Video</h3>
                  <p className="text-xs text-gray-400">
                    Assign to an individual client or publish to the all-members gym library.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-4">
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

                {/* Video Source Segmented Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-300">
                      Video Source & Storage:
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowR2GuideModal(true)}
                      className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                    >
                      <HardDrive className="w-3 h-3" />
                      <span>Cloudflare R2 Free Setup Guide</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-[#111116] border border-white/10 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setSourceMode('upload')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        sourceMode === 'upload'
                          ? 'bg-crimson-600 text-white shadow-[0_0_15px_rgba(186,26,26,0.4)]'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload Video File (%)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSourceMode('url')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        sourceMode === 'url'
                          ? 'bg-crimson-600 text-white shadow-[0_0_15px_rgba(186,26,26,0.4)]'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>Paste Stream / R2 URL</span>
                    </button>
                  </div>
                </div>

                {/* Source Mode 1: File Upload with Progress Percentage */}
                {sourceMode === 'upload' && (
                  <div className="space-y-3">
                    <div className="relative border-2 border-dashed border-white/15 hover:border-crimson-500/60 rounded-2xl p-5 text-center bg-[#14141c]/80 transition-all">
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/x-matroska,.mp4,.mov,.webm,.mkv"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadFile(file);
                        }}
                        disabled={isUploading}
                        id="videoFileInput"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                      />

                      <div className="flex flex-col items-center pointer-events-none">
                        <div className="w-12 h-12 rounded-2xl bg-crimson-950/80 border border-crimson-700/60 text-crimson-400 flex items-center justify-center mb-2.5 shadow-[0_0_20px_rgba(186,26,26,0.3)]">
                          {isUploading ? (
                            <Loader2 className="w-6 h-6 animate-spin text-crimson-400" />
                          ) : (
                            <UploadCloud className="w-6 h-6 text-crimson-400" />
                          )}
                        </div>

                        {selectedFile ? (
                          <div className="space-y-1">
                            <span className="text-white font-bold text-xs block line-clamp-1">
                              {selectedFile.name}
                            </span>
                            <span className="text-[11px] font-mono text-gray-400 block">
                              {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB • {selectedFile.type || 'Video file'}
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="text-white font-bold text-xs block">
                              Click or Drag & Drop Video File to Upload
                            </span>
                            <span className="text-[11px] text-gray-400 block">
                              Supports MP4, MOV, WebM, MKV (Stored in Cloudflare R2 / Storage Vault)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar & Percentage Section */}
                    {(isUploading || uploadProgress > 0) && (
                      <div id="uploadProgressSection" className="p-4 rounded-2xl bg-[#0f0f15] border border-white/10 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-200 font-bold flex items-center gap-2">
                            {isUploading && <Loader2 className="w-4 h-4 animate-spin text-crimson-400" />}
                            {uploadProgress === 100 && !uploadError && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                            <span>{uploadStatus || 'Uploading...'}</span>
                          </span>

                          <span className="font-mono font-black text-sm text-crimson-400 bg-crimson-950 px-3 py-1 rounded-lg border border-crimson-700 shadow-sm">
                            {uploadProgress}%
                          </span>
                        </div>

                        {/* Progress Bar Track */}
                        <div className="w-full h-3.5 bg-black/80 rounded-full overflow-hidden p-0.5 border border-white/10 shadow-inner">
                          <div
                            className="h-full bg-gradient-to-r from-crimson-600 via-rose-500 to-crimson-400 rounded-full transition-all duration-200 shadow-[0_0_15px_rgba(186,26,26,0.8)]"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>

                        {/* Secondary Stats */}
                        <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 pt-0.5">
                          <span>{uploadedBytes || 'Transferring chunks...'}</span>
                          {uploadSpeed && <span className="text-emerald-400 font-semibold">{uploadSpeed}</span>}
                        </div>
                      </div>
                    )}

                    {/* Upload Error Banner */}
                    {uploadError && (
                      <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{uploadError}</span>
                      </div>
                    )}

                    {/* Instant Video Playback Preview right inside the modal */}
                    {formData.videoUrl && (
                      <div className="p-3.5 rounded-2xl bg-black/60 border border-emerald-500/40 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Uploaded Video Preview (Ready to Stream)</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFile(null);
                              setUploadProgress(0);
                              setUploadStatus('');
                              setUploadedBytes('');
                              setUploadSpeed('');
                              setFormData((prev) => ({ ...prev, videoUrl: '' }));
                            }}
                            className="text-[11px] text-gray-400 hover:text-rose-400 cursor-pointer font-mono underline"
                          >
                            Replace Video
                          </button>
                        </div>
                        <div className="rounded-xl overflow-hidden border border-white/10 max-h-48 bg-black">
                          <video
                            src={formData.videoUrl}
                            controls
                            className="w-full max-h-48 object-contain"
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10.5px] font-mono text-gray-400">
                          <span className="truncate max-w-[320px]">
                            URL: <strong className="text-emerald-300">{formData.videoUrl}</strong>
                          </span>
                          <span className="text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800">
                            Synced
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Source Mode 2: Direct URL */}
                {sourceMode === 'url' && (
                  <div>
                    <label htmlFor="videoUrl" className="text-xs font-bold text-gray-300 block mb-1.5">
                      Video Stream URL:
                    </label>
                    <input
                      id="videoUrl"
                      type="url"
                      required
                      placeholder="https://pub-xxx.r2.dev/video.mp4, YouTube, or MP4 link"
                      value={formData.videoUrl}
                      onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                      className="w-full bg-[#161620] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-crimson-500 min-h-[44px] font-mono text-[11px]"
                    />
                    <span className="text-[11px] text-gray-400 mt-1 block">
                      Supports direct Cloudflare R2 links, YouTube links (e.g. youtube.com/watch?v=...), and MP4 files.
                    </span>
                  </div>
                )}

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
                    Coach Instructions & Athlete Cues (Optional):
                  </label>
                  <textarea
                    id="videoDesc"
                    rows={3}
                    placeholder="Describe key technique adjustments, bar path, breathing cues, and what the athlete should execute next session..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-[#161620] border border-white/10 rounded-xl p-3.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-crimson-500 resize-none"
                  />
                </div>
              </div>

              {/* Pinned Modal Footer */}
              <div className="px-6 py-4 border-t border-white/[0.08] flex items-center justify-end gap-3 flex-shrink-0 bg-[#0c0c11]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:text-white text-xs font-bold min-h-[44px] cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || (sourceMode === 'upload' && (!formData.videoUrl || isUploading))}
                  className="px-6 py-2.5 bg-crimson-600 hover:bg-crimson-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(186,26,26,0.5)] min-h-[44px] flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Publishing...'
                      : isUploading
                      ? `Uploading Video (${uploadProgress}%)...`
                      : sourceMode === 'upload' && !formData.videoUrl
                      ? 'Upload Video File First'
                      : 'Publish Session Video'}
                  </span>
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
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6"
        >
          <div className="bg-[#111116] border border-crimson-800/60 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl relative flex flex-col max-h-[92vh]">
            <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-crimson-950/40 to-[#111116]">
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
                className="text-gray-400 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="flex-1 overflow-y-auto flex flex-col">
              {/* Video Player Section */}
              <div className="relative w-full bg-black flex flex-col items-center justify-center flex-shrink-0">
                <div className="w-full">
                  <MuscleCraftVideoPlayer
                    src={activePlaybackVideo.videoUrl}
                    poster={activePlaybackVideo.thumbnailUrl}
                    title={activePlaybackVideo.title}
                    autoPlay
                    dockedControls={true}
                    initialPinned={true}
                  />
                </div>
              </div>

              {/* Video Details Section (Never clipped) */}
              <div className="p-5 sm:p-6 bg-[#161620] space-y-4 border-t border-white/[0.06] flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-lg bg-crimson-950 text-crimson-300 border border-crimson-700 text-xs font-bold shadow-sm">
                    {activePlaybackVideo.category}
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-white/5 text-gray-200 border border-white/10 text-xs font-mono">
                    Duration: {activePlaybackVideo.duration}
                  </span>
                  {activePlaybackVideo.targetClientName ? (
                    <span className="px-3 py-1 rounded-lg bg-amber-950 text-amber-300 border border-amber-800 text-xs font-semibold">
                      👤 Targeted Athlete: {activePlaybackVideo.targetClientName}
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-semibold">
                      🌐 Broadcast to All Gym Members
                    </span>
                  )}
                </div>

                <div className="bg-black/30 p-4 rounded-2xl border border-white/[0.04]">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5 font-mono">
                    Coach Instructions & Technique Notes:
                  </span>
                  <p className="text-xs sm:text-sm text-gray-200 leading-relaxed whitespace-pre-line">
                    {activePlaybackVideo.description || 'Follow standard tempo and posture cues provided during session review.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────
          6. CLOUDFLARE R2 FREE STORAGE SETUP GUIDE MODAL
          ─────────────────────────────────────────────────────────── */}
      {showR2GuideModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div className="bg-[#111116] border border-amber-500/50 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-gradient-to-r from-amber-950/40 to-black">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-950 border border-amber-700/60 text-amber-400">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-extrabold text-base">
                    Cloudflare R2 Free Video Storage Setup
                  </h3>
                  <span className="text-[11px] text-amber-400 font-mono">
                    10 GB Free Forever • Zero Egress / Bandwidth Fees
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowR2GuideModal(false)}
                className="text-gray-400 hover:text-white p-2 rounded-xl bg-white/5 cursor-pointer"
                aria-label="Close guide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Guide Content */}
            <div className="p-6 space-y-4 overflow-y-auto text-xs text-gray-300 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-200">
                💡 <strong>Why Cloudflare R2?</strong> Unlike AWS S3 or Supabase Storage, Cloudflare R2 includes <strong>10 GB free storage</strong> and charges <strong>$0 for video streaming bandwidth</strong>, meaning athletes can watch your coaching videos unlimited times without incurring bandwidth charges!
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-[#161620] border border-white/10 space-y-1">
                  <span className="font-bold text-white block text-xs">
                    Step 1: Open Cloudflare Dashboard & Create Bucket
                  </span>
                  <p className="text-gray-400 text-[11px]">
                    Go to <strong className="text-gray-200">cloudflare.com</strong> → Left menu: <strong className="text-gray-200">R2 Object Storage</strong> → Click <strong className="text-white">Create Bucket</strong> → Name it <code className="text-amber-400">musclecraft-videos</code>.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#161620] border border-white/10 space-y-1">
                  <span className="font-bold text-white block text-xs">
                    Step 2: Enable Public URL Access
                  </span>
                  <p className="text-gray-400 text-[11px]">
                    Inside your new bucket, click the <strong className="text-gray-200">Settings</strong> tab → Scroll to <strong className="text-gray-200">Public Access</strong> → Click <strong className="text-white">Allow Access</strong> under <em>R2.dev Subdomain</em> (or connect a custom domain like <code className="text-amber-400">videos.musclecraft.lk</code>). Copy this public URL.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#161620] border border-white/10 space-y-1">
                  <span className="font-bold text-white block text-xs">
                    Step 3: Create S3 API Token (Access Key & Secret)
                  </span>
                  <p className="text-gray-400 text-[11px]">
                    Go back to the R2 overview page → Click <strong className="text-gray-200">Manage R2 API Tokens</strong> (top right) → Click <strong className="text-white">Create API Token</strong> → Set permissions to <strong className="text-emerald-400">Object Read & Write</strong> → Click Create. Copy your <strong className="text-gray-200">Access Key ID</strong> and <strong className="text-gray-200">Secret Access Key</strong>.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#161620] border border-white/10 space-y-2">
                  <span className="font-bold text-white block text-xs">
                    Step 4: Add Environment Variables in Vercel (or .env.local)
                  </span>
                  <div className="p-3 rounded-lg bg-black/80 font-mono text-[11px] text-gray-200 space-y-1 select-all border border-white/10">
                    <div>R2_ACCOUNT_ID=your_cloudflare_account_id</div>
                    <div>R2_ACCESS_KEY_ID=your_access_key_id</div>
                    <div>R2_SECRET_ACCESS_KEY=your_secret_access_key</div>
                    <div>R2_BUCKET_NAME=musclecraft-videos</div>
                    <div>R2_PUBLIC_DOMAIN=https://pub-xxxxxxxxxxxx.r2.dev</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#161620] border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300 block text-xs">
                      Step 5: Enable Bucket CORS (Required for Videos &gt; 4.5 MB)
                    </span>
                    <button
                      type="button"
                      onClick={copyCorsSnippet}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {copiedCors ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCors ? 'Copied' : 'Copy CORS Rule'}</span>
                    </button>
                  </div>
                  <p className="text-gray-400 text-[11px]">
                    To upload videos directly without hitting Vercel&apos;s 4.5 MB serverless limit:
                    In your bucket (<strong className="text-white">musclecraft-videos</strong>) → <strong className="text-gray-200">Settings</strong> tab → scroll down to <strong className="text-white">CORS Policy</strong> → Click <strong className="text-amber-400">Add CORS Policy</strong> → Paste the rule below and click <strong>Save</strong>:
                  </p>
                  <pre className="p-2.5 rounded-lg bg-black/80 font-mono text-[10.5px] text-amber-200/90 border border-white/10 overflow-x-auto">
{`[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "HEAD", "POST"],
    "AllowedHeaders": ["*"]
  }
]`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/[0.08] flex items-center justify-end bg-[#0e0e13]">
              <button
                onClick={() => setShowR2GuideModal(false)}
                className="px-5 py-2.5 bg-crimson-600 hover:bg-crimson-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md"
              >
                Done / Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
