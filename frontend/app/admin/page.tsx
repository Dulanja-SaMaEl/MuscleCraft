'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import {
  Shield,
  CreditCard,
  Users,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  History,
  TrendingUp,
  Dumbbell,
  DollarSign,
  Utensils,
  Award,
  Sparkles,
  ExternalLink,
  MessageSquare,
  UserPlus,
  Send,
  RefreshCw,
  Flame,
  Menu,
  X,
  ChevronRight,
  LogOut,
  Globe,
  Check,
  Activity,
  Layers,
  Video,
  Radio,
  Server,
  Wifi,
  Smartphone,
  Cpu,
  Database,
} from 'lucide-react';
import { User, PaymentRecord, AuditLog, BodyMeasurement, ExerciseVideo } from '@/lib/types';
import BodyAnalyticsTab from '@/components/admin/BodyAnalyticsTab';
import VideosVaultTab from '@/components/admin/VideosVaultTab';
import BroadcastTab from '@/components/admin/BroadcastTab';
import DatabaseHealthTab from '@/components/admin/DatabaseHealthTab';
import PackagesManagerTab from '@/components/admin/PackagesManagerTab';

export default function AdminDashboard() {
  const router = useRouter();
  const { currentUser, switchPersona, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Navigation State
  const [activeTab, setActiveTab] = useState<
    | 'analytics'
    | 'payments'
    | 'members'
    | 'analytics_submissions'
    | 'videos'
    | 'broadcast'
    | 'packages'
    | 'database_health'
    | 'audit'
  >('analytics');

  // Mobile Sidebar Drawer
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Time Range Filter for Analytics
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month');

  // Telemetry & Statistics
  const [stats, setStats] = useState<any>({
    totalMembers: 8,
    activeMembers: 5,
    pendingMembers: 2,
    pendingTransfers: 2,
    totalRevenue: 218500,
    admissionFeesTotal: 18500,
    monthRevenue: 218500,
    approvedCount: 5,
    rejectedCount: 1,
    soleMembers: 65,
    coupleMembers: 23,
    coachingMembers: 19,
    expiringSoonCount: 1,
    checkinsToday: 38,
    pendingCoachReviews: 2,
    salesTrend: [
      { month: 'May', revenue: 95000, newMembers: 12, sole: 8, couple: 3, coaching: 1 },
      { month: 'Jun', revenue: 124000, newMembers: 16, sole: 11, couple: 4, coaching: 1 },
      { month: 'Jul', revenue: 148000, newMembers: 19, sole: 13, couple: 4, coaching: 2 },
      { month: 'Aug', revenue: 162500, newMembers: 21, sole: 14, couple: 5, coaching: 2 },
      { month: 'Sep', revenue: 184000, newMembers: 23, sole: 15, couple: 6, coaching: 2 },
      { month: 'Oct', revenue: 218500, newMembers: 26, sole: 17, couple: 6, coaching: 3 },
    ],
    registrationFunnel: {
      registered: 48,
      approved: 41,
      pending: 5,
      notApproved: 2,
    },
    packageBreakdown: [
      { name: 'Sole 1 Month', count: 18, price: 4500, type: 'sole' },
      { name: 'Sole 3 Months', count: 24, price: 12000, type: 'sole' },
      { name: 'Sole 6 Months', count: 14, price: 22000, type: 'sole' },
      { name: 'Sole 1 Year', count: 9, price: 40000, type: 'sole' },
      { name: 'Couple 1 Month', count: 6, price: 8000, type: 'couple' },
      { name: 'Couple 3 Months', count: 8, price: 22500, type: 'couple' },
      { name: 'Couple 6 Months', count: 5, price: 42000, type: 'couple' },
      { name: 'Couple 1 Year', count: 4, price: 78000, type: 'couple' },
      { name: '90-Day VIP Coaching', count: 12, price: 25000, type: 'coaching' },
      { name: 'BurnZone Conditioning', count: 7, price: 15000, type: 'coaching' },
    ],
  });

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);

  // Videos, Submissions, Broadcasts, and Telemetry
  const [videos, setVideos] = useState<ExerciseVideo[]>([]);
  const [allClientMeasurements, setAllClientMeasurements] = useState<any[]>([]);
  const [broadcastHistory, setBroadcastHistory] = useState<any[]>([]);
  const [healthData, setHealthData] = useState<any>(null);

  // Filters & Search
  const [memberSearch, setMemberSearch] = useState('');
  const [memberFilterType, setMemberFilterType] = useState<'all' | 'sole' | 'couple' | 'coaching'>('all');
  const [memberStatusFilter, setMemberStatusFilter] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [paymentSearch, setPaymentSearch] = useState('');

  // Coaching review feedback state
  const [selectedClientId, setSelectedClientId] = useState<string>('usr_client_90');
  const [feedbackNote, setFeedbackNote] = useState<string>('');

  // Action status message
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadAdminData();
  }, [currentUser]);

  const loadAdminData = async () => {
    try {
      const adminId = currentUser?.id || 'usr_admin_1';

      // 1. Load Stats
      const statsRes = await fetch(`/api/admin/stats?adminId=${adminId}`);
      if (statsRes.ok) {
        const d = await statsRes.json();
        setStats(d.stats);
      }

      // 2. Load Payments
      const payRes = await fetch(`/api/payments?userId=${adminId}`);
      if (payRes.ok) {
        const d = await payRes.json();
        setPayments(d.payments || []);
      }

      // 3. Load Members
      const memRes = await fetch(`/api/admin/members?adminId=${adminId}`);
      if (memRes.ok) {
        const d = await memRes.json();
        setMembers(d.members || []);
      }

      // 4. Load Audit Logs
      const logRes = await fetch(`/api/admin/audit-logs?adminId=${adminId}`);
      if (logRes.ok) {
        const d = await logRes.json();
        setAuditLogs(d.logs || []);
      }

      // 5. Load Measurements for coaching desk
      const measRes = await fetch(`/api/measurements?userId=${adminId}&clientId=usr_client_90`);
      if (measRes.ok) {
        const d = await measRes.json();
        setMeasurements(d.measurements || []);
      }

      // 6. Load All Client Measurements for analytics monitoring hub
      const allMeasRes = await fetch(`/api/measurements?userId=${adminId}&clientId=all`);
      if (allMeasRes.ok) {
        const d = await allMeasRes.json();
        setAllClientMeasurements(d.measurements || []);
      }

      // 7. Load Videos Vault
      const vidRes = await fetch(`/api/videos?userId=${adminId}`);
      if (vidRes.ok) {
        const d = await vidRes.json();
        setVideos(d.videos || []);
      }

      // 8. Load Broadcast Messages
      const bcRes = await fetch(`/api/broadcast?adminId=${adminId}`);
      if (bcRes.ok) {
        const d = await bcRes.json();
        setBroadcastHistory(d.broadcasts || []);
      }

      // 9. Load Health Telemetry
      const healthRes = await fetch('/api/health');
      if (healthRes.ok) {
        const d = await healthRes.json();
        setHealthData(d);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  const handleApprovePayment = async (paymentId: string) => {
    try {
      const adminId = currentUser?.id || 'usr_admin_1';
      const res = await fetch(`/api/payments/${paymentId}/approve?adminId=${adminId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes: 'Verified via domestic bank statement slip by Coach Adeesha.' }),
      });

      if (res.ok) {
        setActionMessage({
          type: 'success',
          text: `Payment ${paymentId} approved! Membership credentials successfully activated.`,
        });
        await loadAdminData();
      } else {
        const err = await res.json();
        setActionMessage({ type: 'error', text: err.error || 'Approval failed' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    const reason = prompt(
      'Enter rejection reason (e.g., Unverified slip reference, amount mismatch, duplicate submission):',
      'Unverified deposit slip reference'
    );
    if (!reason) return;

    try {
      const adminId = currentUser?.id || 'usr_admin_1';
      const res = await fetch(`/api/payments/${paymentId}/reject?adminId=${adminId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (res.ok) {
        setActionMessage({
          type: 'success',
          text: `Payment ${paymentId} rejected and member record flagged.`,
        });
        await loadAdminData();
      } else {
        const err = await res.json();
        setActionMessage({ type: 'error', text: err.error || 'Rejection failed' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  const handleToggleMemberStatus = async (member: User) => {
    const newStatus = member.status === 'active' ? 'suspended' : 'active';
    try {
      const adminId = currentUser?.id || 'usr_admin_1';
      const res = await fetch(`/api/admin/members?adminId=${adminId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member.id,
          status: newStatus,
          reason: `Admin toggle status to ${newStatus}`,
        }),
      });

      if (res.ok) {
        setActionMessage({
          type: 'success',
          text: `Member ${member.name} status updated to ${newStatus}.`,
        });
        await loadAdminData();
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  // Video Management Handlers
  const handleAddVideo = async (videoData: any) => {
    try {
      const adminId = currentUser?.id || 'usr_admin_1';
      const res = await fetch(`/api/videos?userId=${adminId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(videoData),
      });

      if (res.ok) {
        setActionMessage({
          type: 'success',
          text: `Session video "${videoData.title}" published and delivered successfully!`,
        });
        await loadAdminData();
      } else {
        const err = await res.json();
        setActionMessage({ type: 'error', text: err.error || 'Failed to publish video' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    try {
      const adminId = currentUser?.id || 'usr_admin_1';
      const res = await fetch(`/api/videos?userId=${adminId}&videoId=${videoId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setActionMessage({ type: 'success', text: 'Video removed from library.' });
        await loadAdminData();
      } else {
        const err = await res.json();
        setActionMessage({ type: 'error', text: err.error || 'Delete failed' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  // Coach Feedback Handler for Body Analytics
  const handleSaveFeedback = async (measurementId: string, feedback: string) => {
    try {
      const adminId = currentUser?.id || 'usr_admin_1';
      const res = await fetch(`/api/measurements?userId=${adminId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ measurementId, feedback }),
      });

      if (res.ok) {
        setActionMessage({
          type: 'success',
          text: 'Coach Adeesha guidance successfully delivered to athlete!',
        });
        await loadAdminData();
      } else {
        const err = await res.json();
        setActionMessage({ type: 'error', text: err.error || 'Feedback submission failed' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  // Broadcast Message Dispatcher
  const handleSendBroadcast = async (broadcastData: any) => {
    try {
      const adminId = currentUser?.id || 'usr_admin_1';
      const res = await fetch(`/api/broadcast?adminId=${adminId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(broadcastData),
      });

      if (res.ok) {
        setActionMessage({
          type: 'success',
          text: `Announcement "${broadcastData.title}" successfully dispatched across channels!`,
        });
        await loadAdminData();
      } else {
        const err = await res.json();
        setActionMessage({ type: 'error', text: err.error || 'Broadcast failed' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  // Real-time Database & Backend Telemetry Ping
  const handleRefreshHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const d = await res.json();
        setHealthData(d);
        setActionMessage({
          type: 'success',
          text: `Diagnostic ping executed: Neon PostgreSQL & Express API operational (${d.database?.latencyMs || 24}ms).`,
        });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
      (m.phone && m.phone.includes(memberSearch));

    const matchesStatus = memberStatusFilter === 'all' || m.status === memberStatusFilter;

    let matchesType = true;
    if (memberFilterType === 'sole') {
      matchesType = m.tier?.startsWith('sole') || m.packageType === 'sole';
    } else if (memberFilterType === 'couple') {
      matchesType = m.tier?.startsWith('couple') || m.packageType === 'couple';
    } else if (memberFilterType === 'coaching') {
      matchesType = m.tier === 'coaching_90' || m.tier === 'burnzone' || m.packageType === 'coaching';
    }

    return matchesSearch && matchesStatus && matchesType;
  });

  const filteredPayments = payments.filter((p) => {
    const matchesFilter = paymentFilter === 'all' || p.status === paymentFilter;
    const matchesSearch =
      p.referenceCode.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      p.userName.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      p.bankName.toLowerCase().includes(paymentSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const maxTrendRevenue = Math.max(...(stats.salesTrend || []).map((t: any) => t.revenue), 250000);
  const pendingReviewsCount = allClientMeasurements.filter((m) => !m.coachFeedback).length;

  const navigationItems = [
    { id: 'analytics', label: 'Dashboard Overview', icon: TrendingUp },
    {
      id: 'payments',
      label: 'Bank Approvals',
      icon: CreditCard,
      badge: stats.pendingTransfers > 0 ? `${stats.pendingTransfers}` : null,
    },
    { id: 'members', label: 'Members Directory', icon: Users },
    {
      id: 'analytics_submissions',
      label: 'Client Analytics & Care',
      icon: Activity,
      badge: pendingReviewsCount > 0 ? `${pendingReviewsCount} Due` : null,
    },
    {
      id: 'videos',
      label: 'Session Videos Vault',
      icon: Video,
      badge: videos.length > 0 ? `${videos.length}` : null,
    },
    { id: 'broadcast', label: 'Broadcast Center', icon: Radio },
    { id: 'packages', label: 'Gym Packages Master', icon: DollarSign },
    { id: 'database_health', label: 'Database & Backend', icon: Server, statusDot: 'green' },
    { id: 'audit', label: 'Audit Trail', icon: History },
  ];

  return (
    <div className="min-h-screen bg-[#070709] text-gray-100 flex flex-col md:flex-row antialiased selection:bg-crimson-600 selection:text-white">
      {/* ═══════════════════════════════════════════════════════════════
          MOBILE SIDEBAR BACKDROP & DRAWER
          ═══════════════════════════════════════════════════════════════ */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════
          LEFT NAVIGATION SIDEBAR (Fixed Desktop, Slide Drawer Mobile)
          ═══════════════════════════════════════════════════════════════ */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 lg:w-72 bg-[#09090d] border-r border-white/[0.08] flex flex-col z-50 transition-transform duration-300 md:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.06] flex items-center justify-between flex-shrink-0 bg-[#0c0c11]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-crimson-950/80 border border-crimson-500/50 flex items-center justify-center p-1 shadow-[0_0_15px_rgba(186,26,26,0.4)]">
              <Image
                src="/images/musclecraft-emblem.png"
                alt="MuscleCraft Emblem"
                width={26}
                height={26}
                className="object-contain"
              />
            </div>
            <div>
              <span className="font-extrabold tracking-wider text-white text-sm uppercase leading-tight block">
                Muscle<span className="text-crimson-500">Craft</span>
              </span>
              <span className="text-[9px] font-mono font-bold tracking-widest text-crimson-400 uppercase block">
                Owner Portal
              </span>
            </div>
          </div>

          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Items */}
        <nav className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1" aria-label="Admin Navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[44px] cursor-pointer ${
                  isActive
                    ? 'bg-crimson-600 text-white shadow-crimson-glow font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {item.statusDot === 'green' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                  {item.badge && (
                    <span className="bg-amber-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer: Owner Identity & Fast Public Link */}
        <div className="p-3 border-t border-white/[0.06] bg-[#0c0c11] flex-shrink-0 space-y-2">
          {/* Owner Profile Card */}
          <div className="p-2.5 rounded-xl bg-[#14141c] border border-white/[0.06] flex items-center gap-2.5">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              alt="Adeesha Kumarasingha"
              className="w-8 h-8 rounded-full object-cover border border-crimson-500/50 flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-white block truncate">
                Adeesha Kumarasingha
              </span>
              <span className="text-[10px] text-gray-400 block truncate">
                Founder & Head Coach
              </span>
            </div>
          </div>

          {/* Public Website Link */}
          <Link
            href="/"
            target="_blank"
            className="w-full px-3 py-2 rounded-xl text-[11px] font-semibold text-gray-400 hover:text-white hover:bg-white/5 border border-white/5 flex items-center justify-between transition-colors min-h-[38px]"
          >
            <span className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-crimson-400" /> Public Website
            </span>
            <ExternalLink className="w-3 h-3 text-gray-500" />
          </Link>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full px-3 py-2 rounded-xl text-[11px] font-semibold text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 border border-rose-500/20 hover:border-rose-500/40 flex items-center justify-between transition-colors min-h-[38px] cursor-pointer"
            title="Log out of Admin Portal"
          >
            <span className="flex items-center gap-2">
              <LogOut className="w-3.5 h-3.5" /> Logout
            </span>
            <span className="text-[10px] text-rose-500/70 font-mono">Exit Desk</span>
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════
          MAIN APP CANVAS (Dedicated Admin Topbar + Content View)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#08080a]">
        {/* Dedicated Admin Topbar (NO website public navbar) */}
        <header className="h-16 px-4 sm:px-8 border-b border-white/[0.08] bg-[#0c0c11]/80 backdrop-blur sticky top-0 z-30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden text-gray-400 hover:text-white p-2 rounded-lg bg-white/5"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>MuscleCraft Admin</span>
                <span>/</span>
                <span className="text-white font-semibold capitalize">
                  {activeTab.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Database & Backend Status Button */}
            <button
              onClick={() => setActiveTab('database_health')}
              className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-800/40 text-emerald-300 text-xs font-mono font-medium transition-colors cursor-pointer"
              title="Click to view Database & Backend Telemetry"
              aria-label="View Database and Backend Telemetry"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>DB: Neon PG ({healthData?.database?.latencyMs || 24}ms)</span>
              <span className="text-gray-500">·</span>
              <span>Backend: Operational</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs font-mono font-semibold">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Rs. {stats.totalRevenue.toLocaleString()} LKR MTD</span>
            </div>

            {stats.pendingTransfers > 0 && (
              <button
                onClick={() => setActiveTab('payments')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-950/60 border border-amber-600/50 text-amber-300 text-xs font-bold animate-pulse cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{stats.pendingTransfers} Slips Waiting</span>
              </button>
            )}

            <button
              onClick={() => loadAdminData()}
              className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl border border-white/10 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Refresh Data"
              aria-label="Refresh telemetry data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Direct Logout CTA */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-600/30 text-rose-300 hover:text-rose-100 text-xs font-semibold transition-colors cursor-pointer min-h-[44px]"
              title="Sign Out of Admin Portal"
              aria-label="Sign Out of Admin Portal"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Global Feedback Alert */}
        {actionMessage && (
          <div className="px-6 sm:px-8 pt-6">
            <div
              className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-lg ${
                actionMessage.type === 'success'
                  ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-200'
                  : 'bg-rose-950/80 border border-rose-700 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {actionMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
                <span>{actionMessage.text}</span>
              </div>
              <button
                onClick={() => setActionMessage(null)}
                className="text-gray-400 hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                aria-label="Dismiss alert"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Main Workspace Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {/* ───────────────────────────────────────────────────────────
              TAB 1: ANALYTICS & DASHBOARD CHARTS
              ─────────────────────────────────────────────────────────── */}
          {activeTab === 'analytics' && (
            <div className="space-y-8">
              {/* Primary KPI Strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#111116] border border-white/[0.08] p-5 rounded-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase tracking-wider">
                    <span>Gross Sales (MTD)</span>
                    <DollarSign className="w-4 h-4 text-crimson-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-2">
                    Rs. {stats.totalRevenue.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mt-2 font-medium">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>+18.7% vs last month</span>
                  </div>
                </div>

                <div className="bg-[#111116] border border-white/[0.08] p-5 rounded-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase tracking-wider">
                    <span>Active Member Base</span>
                    <Users className="w-4 h-4 text-crimson-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-2">
                    {stats.soleMembers + stats.coupleMembers * 2 + stats.coachingMembers}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-2">
                    {stats.soleMembers} Sole · {stats.coupleMembers} Pairs · {stats.coachingMembers} VIP
                  </div>
                </div>

                <div className="bg-[#111116] border border-amber-600/30 p-5 rounded-2xl relative overflow-hidden bg-gradient-to-br from-[#111116] to-amber-950/20">
                  <div className="flex items-center justify-between text-amber-400 text-xs font-semibold uppercase tracking-wider">
                    <span>Pending Bank Slips</span>
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono mt-2">
                    {stats.pendingTransfers} Slips
                  </div>
                  <button
                    onClick={() => setActiveTab('payments')}
                    className="text-[11px] text-amber-400 hover:text-amber-300 underline mt-2 block font-medium cursor-pointer"
                  >
                    Verify bank slips now →
                  </button>
                </div>

                <div className="bg-[#111116] border border-white/[0.08] p-5 rounded-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase tracking-wider">
                    <span>Admission Fees Pool</span>
                    <Award className="w-4 h-4 text-crimson-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-2">
                    Rs. {stats.admissionFeesTotal.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-2">
                    Rs. 500 Sole / Rs. 1,000 Couple
                  </div>
                </div>
              </div>

              {/* Main Charts: Sales Trend & Registration Pipeline */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Sales & Revenue Trend Chart (8 cols) */}
                <div className="lg:col-span-8 bg-[#111116] border border-white/[0.08] p-6 sm:p-7 rounded-3xl shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-crimson-500" />
                        Sales & Revenue Trend (LKR)
                      </h2>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Monthly receipts across Sole, Couple, and Online Coaching cohorts
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#181822] p-1 rounded-xl border border-white/5 text-xs">
                      <span className="px-2.5 py-1 bg-crimson-600 text-white rounded-lg font-semibold">6 Months</span>
                      <span className="px-2.5 py-1 text-gray-400">2026 Season</span>
                    </div>
                  </div>

                  {/* SVG Bar Chart */}
                  <div className="h-64 w-full flex items-end gap-3 sm:gap-6 pt-6 pb-2 px-2 border-b border-white/[0.08]">
                    {(stats.salesTrend || []).map((t: any, idx: number) => {
                      const heightPercent = Math.round((t.revenue / maxTrendRevenue) * 100);
                      const isCurrent = idx === (stats.salesTrend || []).length - 1;
                      return (
                        <div key={t.month} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                          <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-crimson-500/60 text-white text-[10px] font-mono py-1 px-2.5 rounded-lg whitespace-nowrap shadow-xl z-20 pointer-events-none">
                            <div className="font-bold text-crimson-400">Rs. {t.revenue.toLocaleString()} LKR</div>
                            <div className="text-gray-300">{t.newMembers} new signups ({t.sole} Sole / {t.couple} Couple)</div>
                          </div>

                          <div className="w-full max-w-[48px] h-full flex items-end justify-center">
                            <div
                              style={{ height: `${heightPercent}%` }}
                              className={`w-full rounded-t-xl transition-all duration-500 relative ${
                                isCurrent
                                  ? 'bg-gradient-to-t from-crimson-800 via-crimson-600 to-rose-500 shadow-[0_0_15px_rgba(186,26,26,0.6)]'
                                  : 'bg-gradient-to-t from-[#1f1f28] to-[#2d2d3a] hover:from-crimson-900/60 hover:to-crimson-600/70'
                              }`}
                            >
                              <span className="text-[10px] font-mono font-bold text-white absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 sm:opacity-90">
                                {(t.revenue / 1000).toFixed(0)}k
                              </span>
                            </div>
                          </div>
                          <span className={`text-[11px] font-semibold mt-3 ${isCurrent ? 'text-crimson-400 font-bold' : 'text-gray-400'}`}>
                            {t.month}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-xs text-gray-400 pt-4 gap-3">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-crimson-600 inline-block" /> Current Month (Oct)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-[#2d2d3a] inline-block" /> Historical Trend
                      </span>
                    </div>
                    <span className="font-mono text-gray-300">
                      Average Monthly Growth: <strong className="text-emerald-400">+14.2%</strong>
                    </span>
                  </div>
                </div>

                {/* Registration Pipeline (4 cols) */}
                <div className="lg:col-span-4 bg-[#111116] border border-white/[0.08] p-6 sm:p-7 rounded-3xl shadow-xl flex flex-col justify-between">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      Member Approval Pipeline
                    </h2>
                    <p className="text-xs text-gray-400 mb-6">
                      Status of all membership registrations
                    </p>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-gray-300 font-medium">1. Total Registered</span>
                          <span className="text-white font-mono font-bold">{stats.registrationFunnel.registered}</span>
                        </div>
                        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-emerald-400 font-medium flex items-center gap-1">
                            <Check className="w-3 h-3" /> 2. Approved & Active
                          </span>
                          <span className="text-emerald-300 font-mono font-bold">
                            {stats.registrationFunnel.approved} ({Math.round((stats.registrationFunnel.approved / stats.registrationFunnel.registered) * 100)}%)
                          </span>
                        </div>
                        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                            style={{ width: `${(stats.registrationFunnel.approved / stats.registrationFunnel.registered) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-amber-400 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" /> 3. Pending Verification
                          </span>
                          <span className="text-amber-300 font-mono font-bold">{stats.registrationFunnel.pending}</span>
                        </div>
                        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                            style={{ width: `${(stats.registrationFunnel.pending / stats.registrationFunnel.registered) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-rose-400 font-medium flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> 4. Rejected / Unverified
                          </span>
                          <span className="text-rose-300 font-mono font-bold">{stats.registrationFunnel.notApproved}</span>
                        </div>
                        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose-500 rounded-full"
                            style={{ width: `${(stats.registrationFunnel.notApproved / stats.registrationFunnel.registered) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/[0.08] mt-6">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Approval Rate:</span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        {Math.round((stats.registrationFunnel.approved / stats.registrationFunnel.registered) * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-gray-400">Avg Verification Turnaround:</span>
                      <span className="font-mono text-white">1.4 Hours</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Splits, Disciplines, Attendance */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Sole vs Couple Split */}
                <div className="bg-[#111116] border border-white/[0.08] p-6 rounded-3xl shadow-lg">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-crimson-400" />
                    Membership Type Split
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between text-gray-300 mb-1">
                        <span>Sole Memberships</span>
                        <span className="font-mono font-bold text-white">65% (55 Active)</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-crimson-600 rounded-full" style={{ width: '65%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-gray-300 mb-1">
                        <span>Couple Memberships</span>
                        <span className="font-mono font-bold text-white">23% (20 Pairs)</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: '23%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-gray-300 mb-1">
                        <span>Online & BurnZone</span>
                        <span className="font-mono font-bold text-white">12% (10 Members)</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: '12%' }} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-gray-400 leading-relaxed">
                    💡 <strong>Couple 3M and Sole 3M</strong> account for 52% of total subscriptions due to quarterly savings.
                  </div>
                </div>

                {/* Disciplines Enrolled */}
                <div className="bg-[#111116] border border-white/[0.08] p-6 rounded-3xl shadow-lg">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-crimson-400" />
                    Disciplines Enrolled
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between text-gray-300 mb-1">
                        <span>Weight Loss</span>
                        <span className="font-mono font-bold text-white">38%</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '38%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-gray-300 mb-1">
                        <span>Fat Loss (BurnZone)</span>
                        <span className="font-mono font-bold text-white">32%</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full" style={{ width: '32%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-gray-300 mb-1">
                        <span>Functional Training</span>
                        <span className="font-mono font-bold text-white">20%</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: '20%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-gray-300 mb-1">
                        <span>Recovery Protocols</span>
                        <span className="font-mono font-bold text-white">10%</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: '10%' }} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-gray-400">
                    Reflects client baseline goals logged during enrollment movement screening.
                  </div>
                </div>

                {/* Gym Floor Load */}
                <div className="bg-[#111116] border border-white/[0.08] p-6 rounded-3xl shadow-lg">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-crimson-400" />
                    Today's Gym Floor Load
                  </h3>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-3xl font-extrabold text-white font-mono block">38</span>
                      <span className="text-xs text-gray-400">Members Checked in Today</span>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-600/40 text-emerald-400 font-semibold">
                      Optimal Capacity
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-gray-400 border-b border-white/[0.04] pb-1.5">
                      <span>Morning Peak (06:00 - 08:30)</span>
                      <span className="text-white font-mono font-semibold">16 Visits</span>
                    </div>
                    <div className="flex justify-between text-gray-400 border-b border-white/[0.04] pb-1.5">
                      <span>Afternoon BurnZone (15:00 - 17:00)</span>
                      <span className="text-white font-mono font-semibold">8 Visits</span>
                    </div>
                    <div className="flex justify-between text-gray-400 pt-0.5">
                      <span>Evening Peak (17:30 - 20:30)</span>
                      <span className="text-crimson-400 font-mono font-bold">14 Visits</span>
                    </div>
                  </div>

                  <div className="mt-5 p-3.5 rounded-xl bg-crimson-950/20 border border-crimson-800/30 text-[11px] text-gray-300">
                    🔥 Peak floor hours: <strong>06:30 AM</strong> & <strong>06:45 PM</strong>.
                  </div>
                </div>
              </div>


            </div>
          )}

          {/* ───────────────────────────────────────────────────────────
              TAB 2: BANK APPROVALS
              ─────────────────────────────────────────────────────────── */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111116] border border-white/[0.08] p-5 rounded-2xl">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-crimson-500" />
                    Bank Transfer Slips & Payment Verification
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Review submitted bank slips, match reference codes, and approve activations in 1-click.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-[#181822] p-1 rounded-xl border border-white/5 text-xs">
                  {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setPaymentFilter(st)}
                      className={`px-3 py-1.5 rounded-lg font-semibold uppercase text-[11px] transition-all cursor-pointer ${
                        paymentFilter === st
                          ? 'bg-crimson-600 text-white font-bold shadow'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by reference code (TRF-MC-...), member name, or bank..."
                  value={paymentSearch}
                  onChange={(e) => setPaymentSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[#111116] border border-white/[0.08] rounded-xl text-xs text-white placeholder:text-gray-500 focus:border-crimson-500 focus:outline-none"
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
                          <td colSpan={7} className="text-center py-12 text-gray-500">
                            No payment records found matching the filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredPayments.map((p) => (
                          <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-4 px-4 whitespace-nowrap">
                              <span className="font-mono font-bold text-white block">{p.referenceCode}</span>
                              <span className="text-[10px] text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="font-semibold text-white block">{p.userName}</span>
                              <span className="text-[11px] text-gray-400 block">{p.userEmail}</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="font-semibold text-gray-200 block">{p.packageName || p.tier}</span>
                              {p.admissionFee && p.admissionFee > 0 ? (
                                <span className="text-[10px] text-crimson-400 font-mono">
                                  Includes Rs. {p.admissionFee.toLocaleString()} Admission
                                </span>
                              ) : null}
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              <span className="text-sm font-bold font-mono text-white block">
                                Rs. {p.amount.toLocaleString()} LKR
                              </span>
                            </td>
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
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              {p.status === 'approved' && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-700/50">
                                  <CheckCircle2 className="w-3 h-3" /> Approved
                                </span>
                              )}
                              {p.status === 'pending' && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-700/50 animate-pulse">
                                  <Clock className="w-3 h-3" /> Awaiting Review
                                </span>
                              )}
                              {p.status === 'rejected' && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-950/80 px-2.5 py-1 rounded-full border border-rose-700/50">
                                  <XCircle className="w-3 h-3" /> Rejected
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-right whitespace-nowrap">
                              {p.status === 'pending' ? (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleApprovePayment(p.id)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                                  >
                                    <Check className="w-3.5 h-3.5" /> Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectPayment(p.id)}
                                    className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-gray-500">
                                  {p.reviewedAt ? `Reviewed ${new Date(p.reviewedAt).toLocaleDateString()}` : 'Archived'}
                                </span>
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

          {/* ───────────────────────────────────────────────────────────
              TAB 3: MEMBERS DIRECTORY
              ─────────────────────────────────────────────────────────── */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111116] border border-white/[0.08] p-5 rounded-2xl">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <Users className="w-5 h-5 text-crimson-500" />
                    Members Directory & Roster
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Manage active member lifecycle, renewals, and package designations
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-[#181822] p-1 rounded-xl border border-white/5 text-xs">
                  {(['all', 'sole', 'couple', 'coaching'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setMemberFilterType(type)}
                      className={`px-3 py-1.5 rounded-lg font-semibold uppercase text-[11px] transition-all cursor-pointer ${
                        memberFilterType === type
                          ? 'bg-crimson-600 text-white font-bold shadow'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or phone number..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-[#111116] border border-white/[0.08] rounded-xl text-xs text-white placeholder:text-gray-500 focus:border-crimson-500 focus:outline-none"
                  />
                </div>

                <select
                  value={memberStatusFilter}
                  onChange={(e) => setMemberStatusFilter(e.target.value as any)}
                  className="px-4 py-3 bg-[#111116] border border-white/[0.08] rounded-xl text-xs text-white focus:border-crimson-500 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Members</option>
                  <option value="pending">Pending Approval</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              {/* Members Table */}
              <div className="bg-[#111116] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#16161f] text-gray-400 uppercase text-[10px] tracking-wider border-b border-white/[0.06]">
                      <tr>
                        <th className="py-3.5 px-4 font-bold">Member Name</th>
                        <th className="py-3.5 px-4 font-bold">Package / Plan</th>
                        <th className="py-3.5 px-4 font-bold">Status</th>
                        <th className="py-3.5 px-4 font-bold">Expires At</th>
                        <th className="py-3.5 px-4 font-bold">Assigned Coach</th>
                        <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {filteredMembers.map((m) => {
                        const isExpiringSoon =
                          m.membershipExpiresAt &&
                          new Date(m.membershipExpiresAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 &&
                          m.status === 'active';

                        return (
                          <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-4 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <img
                                  src={m.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop'}
                                  alt={m.name}
                                  className="w-8 h-8 rounded-full object-cover border border-white/10"
                                />
                                <div>
                                  <span className="font-semibold text-white block">{m.name}</span>
                                  <span className="text-[11px] text-gray-400 block">{m.email} {m.phone ? `· ${m.phone}` : ''}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="font-semibold text-gray-200 block">{m.packageName || m.tier}</span>
                              <span className="text-[10px] text-gray-500 uppercase font-mono">
                                Joined {new Date(m.joinedAt).toLocaleDateString()}
                              </span>
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              {m.status === 'active' && (
                                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-700/50">
                                  Active
                                </span>
                              )}
                              {m.status === 'pending' && (
                                <span className="text-[11px] font-bold text-amber-400 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-700/50">
                                  Pending Slip
                                </span>
                              )}
                              {m.status === 'suspended' && (
                                <span className="text-[11px] font-bold text-rose-400 bg-rose-950/80 px-2.5 py-1 rounded-full border border-rose-700/50">
                                  Suspended
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              {m.membershipExpiresAt ? (
                                <div>
                                  <span className={`font-mono text-xs block ${isExpiringSoon ? 'text-amber-400 font-bold' : 'text-gray-300'}`}>
                                    {new Date(m.membershipExpiresAt).toLocaleDateString()}
                                  </span>
                                  {isExpiringSoon && (
                                    <span className="text-[10px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded font-semibold inline-block mt-0.5">
                                      Expiring in &lt; 7 days!
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-500 font-mono text-[11px]">N/A</span>
                              )}
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              <span className="text-xs text-gray-300 block">
                                {m.assignedInstructorName || 'Coach Adeesha (Owner)'}
                              </span>
                              <span className="text-[10px] text-gray-500">Master Roster</span>
                            </td>
                            <td className="py-4 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                {isExpiringSoon && (
                                  <a
                                    href={`https://wa.me/${m.phone?.replace(/[^0-9]/g, '') || ''}?text=Hi%20${encodeURIComponent(
                                      m.name
                                    )},%20your%20MuscleCraft%20gym%20membership%20is%20due%20for%20renewal%20soon!%20Please%20let%20Coach%20Adeesha%20know%20if%20you%20need%20the%20transfer%20details.`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                                    title="Send WhatsApp Renewal Notice"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" /> Renewal Notice
                                  </a>
                                )}
                                <button
                                  onClick={() => handleToggleMemberStatus(m)}
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                    m.status === 'active'
                                      ? 'bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800'
                                      : 'bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-800'
                                  }`}
                                >
                                  {m.status === 'active' ? 'Suspend' : 'Activate'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────
              TAB: BODY ANALYTICS HUB & SUBMISSIONS MONITOR
              ─────────────────────────────────────────────────────────── */}
          {activeTab === 'analytics_submissions' && (
            <BodyAnalyticsTab
              measurements={allClientMeasurements}
              members={members}
              onSaveFeedback={handleSaveFeedback}
            />
          )}

          {/* ───────────────────────────────────────────────────────────
              TAB: SESSION VIDEOS VAULT
              ─────────────────────────────────────────────────────────── */}
          {activeTab === 'videos' && (
            <VideosVaultTab
              videos={videos}
              members={members}
              onAddVideo={handleAddVideo}
              onDeleteVideo={handleDeleteVideo}
            />
          )}

          {/* ───────────────────────────────────────────────────────────
              TAB: MESSAGE BROADCAST CENTER
              ─────────────────────────────────────────────────────────── */}
          {activeTab === 'broadcast' && (
            <BroadcastTab
              members={members}
              broadcastHistory={broadcastHistory}
              onSendBroadcast={handleSendBroadcast}
            />
          )}

          {/* ───────────────────────────────────────────────────────────
              TAB: GYM PACKAGES MASTER (EDITABLE)
              ─────────────────────────────────────────────────────────── */}
          {activeTab === 'packages' && (
            <PackagesManagerTab
              onNotify={(type, text) => setActionMessage({ type, text })}
            />
          )}



          {/* ───────────────────────────────────────────────────────────
              TAB 7: AUDIT LOGS
              ─────────────────────────────────────────────────────────── */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div className="bg-[#111116] border border-white/[0.08] p-6 rounded-3xl shadow-xl flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <History className="w-5 h-5 text-crimson-500" />
                    Administrative Audit Trail & Security Ledger
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Immutable log of all financial approvals, status mutations, and protocol assignments.
                  </p>
                </div>
                <span className="text-xs font-mono text-gray-400">Total Entries: {auditLogs.length}</span>
              </div>

              <div className="bg-[#111116] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#16161f] text-gray-400 uppercase text-[10px] tracking-wider border-b border-white/[0.06]">
                      <tr>
                        <th className="py-3.5 px-4 font-bold">Timestamp</th>
                        <th className="py-3.5 px-4 font-bold">Actor</th>
                        <th className="py-3.5 px-4 font-bold">Action Type</th>
                        <th className="py-3.5 px-4 font-bold">Details & Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-gray-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-semibold text-white block">{log.actorEmail}</span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-crimson-950 text-crimson-300 border border-crimson-800">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-gray-300 font-medium">
                            {log.details}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────
              TAB: DATABASE & BACKEND TELEMETRY
              ─────────────────────────────────────────────────────────── */}
          {activeTab === 'database_health' && (
            <DatabaseHealthTab
              healthData={healthData}
              onRefreshHealth={handleRefreshHealth}
            />
          )}
        </main>

        {/* Minimal Admin Workspace Footer (NOT public marketing footer) */}
        <footer className="py-4 px-6 sm:px-8 border-t border-white/[0.04] text-[11px] text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>MuscleCraft Operations Command Center · Owner Edition v1.2</span>
          <span>Authorized Personnel Only · All Actions Recorded & Synced</span>
        </footer>
      </div>
    </div>
  );
}
