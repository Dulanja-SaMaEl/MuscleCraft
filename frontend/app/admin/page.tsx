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
  Target,
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
  ChevronDown,
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
  FileBarChart2,
  Ban,
  ShieldCheck,
  Pencil,
} from 'lucide-react';
import { User, UserRole, UserStatus, PaymentRecord, AuditLog, BodyMeasurement, ExerciseVideo } from '@/lib/types';
import dynamic from 'next/dynamic';
import EditMemberModal from '@/components/admin/EditMemberModal';
import TablePagination from '@/components/admin/TablePagination';

function formatShortDate(dateStr?: string | null): string {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatAuditLogDetails(raw: any): { summary: string; meta: string[] } {
  if (!raw) return { summary: '—', meta: [] };
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        return formatAuditLogDetails(parsed);
      } catch (_) {
        return { summary: trimmed, meta: [] };
      }
    }
    return { summary: trimmed, meta: [] };
  }
  if (typeof raw === 'object') {
    const meta: string[] = [];
    if (raw.title && raw.audience) {
      const delivered = raw.smsResult?.deliveredCount ?? raw.recipientsCount ?? 0;
      const status = raw.smsResult?.status || (raw.smsResult?.success ? 'delivered' : raw.smsResult ? 'failed' : 'in-app');
      meta.push(`Audience: ${String(raw.audience).replace(/_/g, ' ')}`);
      meta.push(`Recipients: ${raw.recipientsCount ?? 0}`);
      if (raw.smsResult) meta.push(`SMS: ${status} (${delivered})`);
      return { summary: `Broadcast "${raw.title}" dispatched`, meta };
    }
    if (raw.recipient && raw.senderId) {
      meta.push(`Sender: ${raw.senderId}`);
      if (raw.status) meta.push(`Status: ${raw.status}`);
      return { summary: `Test SMS sent to ${raw.recipient}`, meta };
    }
    const entries = Object.entries(raw)
      .filter(([, v]) => v !== null && v !== undefined && typeof v !== 'object')
      .map(([k, v]) => `${k}: ${String(v)}`);
    return {
      summary: entries.length > 0 ? entries.slice(0, 3).join(' · ') : JSON.stringify(raw).slice(0, 140),
      meta: entries.slice(3, 6),
    };
  }
  return { summary: String(raw), meta: [] };
}

const TabLoadingState = ({ name }: { name: string }) => (
  <div className="space-y-6 animate-pulse">
    {/* Header Skeleton */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-2">
        <div className="h-6 w-64 bg-white/10 rounded-xl" />
        <div className="h-3.5 w-80 bg-white/5 rounded-lg" />
      </div>
      <div className="h-10 w-36 bg-white/10 rounded-xl" />
    </div>

    {/* 4 KPI Cards Skeleton */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-[#111116] border border-white/[0.06] p-5 rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <div className="h-3 w-20 bg-white/10 rounded" />
            <div className="w-5 h-5 bg-white/10 rounded-lg" />
          </div>
          <div className="h-7 w-28 bg-white/20 rounded-lg" />
          <div className="h-3 w-32 bg-white/5 rounded" />
        </div>
      ))}
    </div>

    {/* Main Content Block Skeleton */}
    <div className="bg-[#111116] border border-white/[0.06] p-6 rounded-3xl space-y-4">
      <div className="flex justify-between items-center pb-4 border-b border-white/[0.04]">
        <div className="h-4 w-44 bg-white/15 rounded" />
        <div className="h-4 w-28 bg-white/10 rounded" />
      </div>
      <div className="space-y-3 pt-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 w-full bg-white/[0.03] rounded-xl flex items-center px-4 gap-4">
            <div className="w-8 h-8 rounded-lg bg-white/10" />
            <div className="h-3 w-40 bg-white/10 rounded" />
            <div className="h-3 w-24 bg-white/5 rounded ml-auto" />
            <div className="h-6 w-20 bg-white/10 rounded-lg" />
          </div>
        ))}
      </div>
      <div className="pt-2 text-center">
        <span className="text-[11px] text-gray-500 font-mono tracking-wider">
          SYNCHRONIZING {name.toUpperCase()} WITH SUPABASE...
        </span>
      </div>
    </div>
  </div>
);

const AnalyticsDashboardSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    {/* Primary 4 KPI Cards Skeleton */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-[#111116] border border-white/[0.08] p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-3 w-28 bg-white/10 rounded" />
            <div className="w-4 h-4 bg-white/10 rounded" />
          </div>
          <div className="h-8 w-36 bg-white/20 rounded-lg" />
          <div className="h-3 w-28 bg-white/5 rounded" />
        </div>
      ))}
    </div>

    {/* Expirations / Renewals Desk Skeleton */}
    <div className="bg-[#111116] border border-white/[0.08] p-6 rounded-3xl space-y-4">
      <div className="flex justify-between items-center pb-4 border-b border-white/[0.04]">
        <div className="space-y-2">
          <div className="h-5 w-56 bg-white/15 rounded-xl" />
          <div className="h-3 w-72 bg-white/5 rounded-lg" />
        </div>
        <div className="h-8 w-28 bg-white/10 rounded-full" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 w-full bg-white/[0.02] rounded-xl flex items-center px-4 gap-4">
            <div className="w-10 h-10 rounded-full bg-white/10" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 w-40 bg-white/15 rounded" />
              <div className="h-2.5 w-56 bg-white/5 rounded" />
            </div>
            <div className="h-7 w-28 bg-white/10 rounded-xl" />
          </div>
        ))}
      </div>
    </div>

    {/* Split Grids Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8 bg-[#111116] border border-white/[0.08] p-6 rounded-3xl space-y-4">
        <div className="h-5 w-44 bg-white/15 rounded-xl" />
        <div className="h-64 w-full bg-white/[0.03] rounded-2xl" />
      </div>
      <div className="lg:col-span-4 bg-[#111116] border border-white/[0.08] p-6 rounded-3xl space-y-4">
        <div className="h-5 w-36 bg-white/15 rounded-xl" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-white/[0.02] rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

const MembersDirectorySkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111116] border border-white/[0.08] p-5 rounded-2xl">
      <div className="space-y-2">
        <div className="h-6 w-52 bg-white/15 rounded-xl" />
        <div className="h-3 w-72 bg-white/5 rounded-lg" />
      </div>
      <div className="h-9 w-48 bg-white/10 rounded-xl" />
    </div>

    <div className="flex gap-3">
      <div className="h-11 flex-1 bg-[#111116] border border-white/[0.08] rounded-xl" />
      <div className="h-11 w-40 bg-[#111116] border border-white/[0.08] rounded-xl" />
    </div>

    <div className="bg-[#111116] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl p-4 space-y-3">
      <div className="h-10 w-full bg-white/[0.04] rounded-xl" />
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-16 w-full bg-white/[0.02] rounded-xl flex items-center px-4 gap-4">
          <div className="w-10 h-10 rounded-full bg-white/10" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3.5 w-36 bg-white/15 rounded" />
            <div className="h-2.5 w-48 bg-white/5 rounded" />
          </div>
          <div className="h-6 w-24 bg-white/10 rounded-full hidden sm:block" />
          <div className="h-6 w-20 bg-white/10 rounded-full" />
        </div>
      ))}
    </div>
  </div>
);

const AuditLogsSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="bg-[#111116] border border-white/[0.08] p-6 rounded-3xl shadow-xl flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-6 w-64 bg-white/15 rounded-xl" />
        <div className="h-3 w-80 bg-white/5 rounded-lg" />
      </div>
      <div className="h-4 w-28 bg-white/10 rounded" />
    </div>

    <div className="bg-[#111116] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl p-4 space-y-3">
      <div className="h-10 w-full bg-white/[0.04] rounded-xl" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-12 w-full bg-white/[0.02] rounded-xl flex items-center px-4 gap-4">
          <div className="h-3 w-32 bg-white/10 rounded" />
          <div className="h-3 w-40 bg-white/15 rounded" />
          <div className="h-6 w-24 bg-white/10 rounded" />
          <div className="h-3 w-64 bg-white/5 rounded ml-auto" />
        </div>
      ))}
    </div>
  </div>
);

const BodyAnalyticsTab = dynamic(() => import('@/components/admin/BodyAnalyticsTab'), {
  loading: () => <TabLoadingState name="Client Analytics & Care" />,
  ssr: false,
});
const VideosVaultTab = dynamic(() => import('@/components/admin/VideosVaultTab'), {
  loading: () => <TabLoadingState name="Session Videos Vault" />,
  ssr: false,
});
const BroadcastTab = dynamic(() => import('@/components/admin/BroadcastTab'), {
  loading: () => <TabLoadingState name="Message Broadcast Center" />,
  ssr: false,
});
const DatabaseHealthTab = dynamic(() => import('@/components/admin/DatabaseHealthTab'), {
  loading: () => <TabLoadingState name="Database & Backend Telemetry" />,
  ssr: false,
});
const PackagesManagerTab = dynamic(() => import('@/components/admin/PackagesManagerTab'), {
  loading: () => <TabLoadingState name="Gym Packages Master" />,
  ssr: false,
});
const DailySalesDashboardTab = dynamic(() => import('@/components/admin/DailySalesDashboardTab'), {
  loading: () => <TabLoadingState name="Daily Sales & Ad CRM" />,
  ssr: false,
});
const BankApprovalsTab = dynamic(() => import('@/components/admin/BankApprovalsTab'), {
  loading: () => <TabLoadingState name="Bank Transfer Slips & Approvals" />,
  ssr: false,
});
const ReportsTab = dynamic(() => import('@/components/admin/ReportsTab'), {
  loading: () => <TabLoadingState name="Executive Reports & Analytics" />,
  ssr: false,
});

export default function AdminDashboard() {
  const router = useRouter();
  const { currentUser, loading: authLoading, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Navigation State with URL deep-linking support
  const [activeTab, _setActiveTab] = useState<
    | 'analytics'
    | 'daily_dashboard'
    | 'payments'
    | 'members'
    | 'analytics_submissions'
    | 'videos'
    | 'broadcast'
    | 'packages'
    | 'reports'
    | 'database_health'
    | 'audit'
  >('analytics');
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Admin Create Member Modal State
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [isCreatingMember, setIsCreatingMember] = useState(false);
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [membersPage, setMembersPage] = useState<number>(1);
  const [membersPageSize, setMembersPageSize] = useState<number>(8);
  const [auditSearch, setAuditSearch] = useState<string>('');
  const [auditActionFilter, setAuditActionFilter] = useState<string>('all');
  const [auditPage, setAuditPage] = useState<number>(1);
  const [auditPageSize, setAuditPageSize] = useState<number>(10);
  const [newMemberForm, setNewMemberForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'client' as 'client' | 'instructor' | 'admin',
    tier: 'sole_1m',
    status: 'active' as 'active' | 'pending',
    durationDays: 30,
    recordPayment: true,
    paymentMethod: 'Cash / In-Person (Admin Enrolled)',
    customAmount: '',
  });

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (
        tab &&
        [
          'analytics',
          'daily_dashboard',
          'payments',
          'members',
          'analytics_submissions',
          'videos',
          'broadcast',
          'packages',
          'reports',
          'database_health',
          'audit',
        ].includes(tab)
      ) {
        _setActiveTab(tab as any);
      }
    }
  }, []);

  const setActiveTab = (tab: any) => {
    _setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.pushState(null, '', url.toString());
    }
  };

  // Mobile Sidebar Drawer
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Time Range Filter for Analytics
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month');

  // Telemetry & Statistics (zero-initialized — populated live from Supabase)
  const [stats, setStats] = useState<any>({
    totalMembers: 0,
    activeMembers: 0,
    pendingMembers: 0,
    pendingTransfers: 0,
    totalRevenue: 0,
    admissionFeesTotal: 0,
    monthRevenue: 0,
    approvedCount: 0,
    rejectedCount: 0,
    soleMembers: 0,
    coupleMembers: 0,
    coachingMembers: 0,
    activeAthleteBase: 0,
    expiringSoonCount: 0,
    checkinsToday: 0,
    pendingCoachReviews: 0,
    growthPercent: 0,
    salesTrend: [],
    registrationFunnel: {
      registered: 0,
      approved: 0,
      pending: 0,
      notApproved: 0,
    },
    membershipTypeSplit: {
      soleCount: 0,
      solePercent: 0,
      coupleCount: 0,
      coupleAthletes: 0,
      couplePercent: 0,
      coachingCount: 0,
      coachingPercent: 0,
    },
    disciplines: {
      hypertrophy: 0,
      transformation: 0,
      conditioning: 0,
      mobility: 0,
    },
    gymFloorLoad: {
      totalCheckedIn: 0,
      morning: 0,
      afternoon: 0,
      evening: 0,
      status: 'Ready for Open',
      peakMorning: '07:00 AM',
      peakEvening: '06:30 PM',
    },
    avgTurnaround: 'No Slips Yet',
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
  const [memberStatusFilter, setMemberStatusFilter] = useState<'all' | 'active' | 'pending' | 'suspended' | 'expired' | 'expiring_soon'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [paymentSearch, setPaymentSearch] = useState('');

  // Coaching review feedback state
  const [selectedClientId, setSelectedClientId] = useState<string>('usr_client_90');
  const [feedbackNote, setFeedbackNote] = useState<string>('');

  // Action status message
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'instructor')) {
      router.replace('/login');
      return;
    }
    loadAdminData();
  }, [currentUser, authLoading]);

  const loadAdminData = async () => {
    if (!currentUser) return;
    setIsLoadingData(true);
    try {
      const adminId = currentUser.id;

      // Fetch all telemetry and operational resources in parallel
      const results = await Promise.allSettled([
        fetch(`/api/admin/stats?adminId=${adminId}`).then((r) => (r.ok ? r.json() : null)),
        fetch(`/api/payments?userId=${adminId}`).then((r) => (r.ok ? r.json() : null)),
        fetch(`/api/admin/members?adminId=${adminId}`).then((r) => (r.ok ? r.json() : null)),
        fetch(`/api/admin/audit-logs?adminId=${adminId}`).then((r) => (r.ok ? r.json() : null)),
        Promise.resolve(null),
        fetch(`/api/measurements?userId=${adminId}&clientId=all`).then((r) => (r.ok ? r.json() : null)),
        fetch(`/api/videos?userId=${adminId}`).then((r) => (r.ok ? r.json() : null)),
        fetch(`/api/broadcast?adminId=${adminId}`).then((r) => (r.ok ? r.json() : null)),
        fetch(`/api/health?adminId=${encodeURIComponent(adminId)}`).then((r) => (r.ok ? r.json() : null)),
      ]);

      const [statsRes, payRes, memRes, logRes, measRes, allMeasRes, vidRes, bcRes, healthRes] = results.map(
        (r) => (r.status === 'fulfilled' ? r.value : null)
      );

      if (statsRes?.stats) setStats(statsRes.stats);
      if (payRes?.payments) setPayments(payRes.payments);
      if (memRes?.members) setMembers(memRes.members);
      if (logRes?.logs) setAuditLogs(logRes.logs);
      if (measRes?.measurements) setMeasurements(measRes.measurements);
      if (allMeasRes?.measurements) setAllClientMeasurements(allMeasRes.measurements);
      if (vidRes?.videos) setVideos(vidRes.videos);
      if (bcRes?.broadcasts) setBroadcastHistory(bcRes.broadcasts);
      if (healthRes) setHealthData(healthRes);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoadingData(false);
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

  const handleRejectPayment = async (paymentId: string, customReason?: string) => {
    let reason = customReason;
    if (!reason && typeof window !== 'undefined') {
      reason = prompt(
        'Enter rejection reason (e.g., Unverified slip reference, amount mismatch, duplicate submission):',
        'Unverified deposit slip reference'
      ) || undefined;
    }
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
    const isCurrentlyBannedOrInactive = member.status === 'suspended' || member.status === 'expired' || member.status === 'pending';
    const action = isCurrentlyBannedOrInactive ? 'unban' : 'ban';
    const newStatus = isCurrentlyBannedOrInactive ? 'active' : 'suspended';

    if (action === 'ban' && !confirm(`Ban / Suspend "${member.name}" (${member.email})? They will immediately lose access to the portal.`)) {
      return;
    }

    try {
      const adminId = currentUser?.id || 'usr_admin_1';
      const res = await fetch(`/api/admin/members?adminId=${adminId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member.id,
          action,
          status: newStatus,
          reason: action === 'ban' ? 'Banned/Suspended by Administrator' : 'Unbanned & Activated by Administrator',
        }),
      });

      if (res.ok) {
        setActionMessage({
          type: 'success',
          text:
            action === 'ban'
              ? `Member ${member.name} has been banned & locked out of the portal.`
              : `Member ${member.name} has been unbanned & activated.`,
        });
        await loadAdminData();
      } else {
        const err = await res.json();
        setActionMessage({ type: 'error', text: err.error || 'Failed to update member status' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingMember(true);
    setActionMessage(null);
    try {
      const adminId = currentUser?.id || 'usr_admin_1';
      const res = await fetch(`/api/admin/members?adminId=${adminId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMemberForm),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add member.');
      }

      setActionMessage({
        type: 'success',
        text: data.message || `Member ${newMemberForm.name} added successfully with portal login access!`,
      });
      setShowAddMemberModal(false);
      setNewMemberForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'client',
        tier: 'sole_1m',
        status: 'active',
        durationDays: 30,
        recordPayment: true,
        paymentMethod: 'Cash / In-Person (Admin Enrolled)',
        customAmount: '',
      });
      await loadAdminData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Error adding member.' });
    } finally {
      setIsCreatingMember(false);
    }
  };

  const handleEditMember = async (payload: {
    memberId: string;
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    tier: string;
    status: UserStatus;
    membershipExpiresAt: string | null;
    instructorId: string | null;
    assignedInstructorName: string | null;
    newPassword?: string;
    recordPayment?: boolean;
    paymentMethod?: string;
    customAmount?: number | null;
  }) => {
    const adminId = currentUser?.id || 'usr_admin_1';
    const res = await fetch(`/api/admin/members?adminId=${adminId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'edit',
        ...payload,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update member details.');
    }
    setActionMessage({
      type: 'success',
      text: data.message || `Updated profile details for ${payload.name} (${payload.status.toUpperCase()}).`,
    });
    await loadAdminData();
  };

  const handleExtendMembership = async (memberId: string, days: number = 30) => {
    try {
      const adminId = currentUser?.id || 'usr_admin_1';
      const res = await fetch(`/api/admin/members?adminId=${adminId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          extendDays: days,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setActionMessage({
          type: 'success',
          text: `Membership for ${data.member?.name || 'member'} successfully extended by +${days} days!`,
        });
        await loadAdminData();
      } else {
        const err = await res.json();
        setActionMessage({ type: 'error', text: err.error || 'Failed to extend membership' });
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
        let errorText = err.error || 'Failed to publish video';
        if (typeof errorText === 'string' && errorText.startsWith('[')) {
          try {
            const parsed = JSON.parse(errorText);
            if (Array.isArray(parsed)) {
              errorText = parsed.map((e: any) => e.message || `${e.path?.join('.')}: invalid`).join('. ');
            }
          } catch (_) {}
        }
        setActionMessage({ type: 'error', text: errorText });
      }
    } catch (err: any) {
      let errorText = err.message || 'Error occurred';
      if (typeof errorText === 'string' && errorText.startsWith('[')) {
        try {
          const parsed = JSON.parse(errorText);
          if (Array.isArray(parsed)) {
            errorText = parsed.map((e: any) => e.message || `${e.path?.join('.')}: invalid`).join('. ');
          }
        } catch (_) {}
      }
      setActionMessage({ type: 'error', text: errorText });
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    try {
      // Optimistic UI update: remove immediately
      setVideos((prev) => prev.filter((v) => v.id !== videoId));

      const adminId = currentUser?.id || 'usr_admin_1';
      const res = await fetch(`/api/videos?userId=${adminId}&videoId=${encodeURIComponent(videoId)}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setActionMessage({ type: 'success', text: 'Video removed from vault and database.' });
        await loadAdminData();
      } else {
        const err = await res.json();
        setActionMessage({ type: 'error', text: err.error || 'Delete failed' });
        await loadAdminData();
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
      await loadAdminData();
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

      const data = await res.json();

      if (res.ok && data.success) {
        let msg = `Announcement "${broadcastData.title}" dispatched!`;
        if (broadcastData.channels?.includes('sms')) {
          if (data.sms?.success) {
            msg += ` SMS Delivered via Text.lk (${data.sms.deliveredCount ?? data.recipientCount} sent).`;
          } else if (data.sms?.error) {
            msg += ` (SMS Notice: ${data.sms.error})`;
          }
        }
        if (broadcastData.channels?.includes('email')) {
          if (data.email?.success) {
            msg += ` Email Delivered via Resend (${data.email.deliveredCount ?? data.recipientCount} sent).`;
          } else if (data.email?.error) {
            msg += ` (Email Notice: ${data.email.error})`;
          }
        }
        if (data.recipientCount === 0) {
          msg += ` (Notice: 0 matching client recipients found).`;
        }
        setActionMessage({
          type: data.sms?.error && data.email?.error ? 'error' : 'success',
          text: msg,
        });
        await loadAdminData();
      } else {
        setActionMessage({ type: 'error', text: data?.error || 'Broadcast failed' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  // Real-time Database & Backend Telemetry Ping
  const handleRefreshHealth = async () => {
    try {
      const adminId = currentUser?.id || '';
      const res = await fetch(`/api/health${adminId ? `?adminId=${encodeURIComponent(adminId)}` : ''}`);
      if (res.ok) {
        const d = await res.json();
        setHealthData(d);
        setActionMessage({
          type: 'success',
          text: `Diagnostic ping executed: ${d?.supabaseConfigured ? 'Supabase Postgres' : (d?.database?.type || 'Production Database')} operational (${d.database?.latencyMs || 18}ms).`,
        });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  // Membership Expiration & Renewal Intelligence
  const now = new Date();
  const expiringOrExpiredMembers = members
    .filter((m) => m.role === 'client' && m.membershipExpiresAt)
    .map((m) => {
      const expiry = new Date(m.membershipExpiresAt!);
      const diffMs = expiry.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const isExpired = daysLeft <= 0 || m.status === 'expired';
      const isExpiringSoon = daysLeft > 0 && daysLeft <= 7;
      const is90Day =
        m.tier === 'coaching_90' ||
        m.packageType === 'coaching' ||
        m.packageName?.toLowerCase().includes('90');
      return {
        ...m,
        daysLeft,
        isExpired,
        isExpiringSoon,
        is90Day,
        expiryDate: expiry,
      };
    })
    .filter((m) => m.isExpired || m.isExpiringSoon)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const expiredMembersCount = expiringOrExpiredMembers.filter((m) => m.isExpired).length;
  const expiringMembersCount = expiringOrExpiredMembers.filter((m) => m.isExpiringSoon).length;

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
      (m.phone && m.phone.includes(memberSearch));

    let matchesStatus = true;
    if (memberStatusFilter === 'active') {
      matchesStatus = m.status === 'active';
    } else if (memberStatusFilter === 'pending') {
      matchesStatus = m.status === 'pending';
    } else if (memberStatusFilter === 'suspended') {
      matchesStatus = m.status === 'suspended';
    } else if (memberStatusFilter === 'expired') {
      const expiry = m.membershipExpiresAt ? new Date(m.membershipExpiresAt).getTime() : 0;
      matchesStatus = (expiry > 0 && expiry <= Date.now()) || m.status === 'expired';
    } else if (memberStatusFilter === 'expiring_soon') {
      const expiry = m.membershipExpiresAt ? new Date(m.membershipExpiresAt).getTime() : 0;
      const days = Math.ceil((expiry - Date.now()) / (1000 * 60 * 60 * 24));
      matchesStatus = days > 0 && days <= 7;
    }

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

  // Reset pagination to page 1 when filters change
  useEffect(() => {
    setMembersPage(1);
  }, [memberSearch, memberStatusFilter, memberFilterType, membersPageSize]);

  useEffect(() => {
    setAuditPage(1);
  }, [auditSearch, auditActionFilter, auditPageSize]);

  useEffect(() => {
    if (!showAddMemberModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowAddMemberModal(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showAddMemberModal]);

  const totalMembersPages = Math.max(1, Math.ceil(filteredMembers.length / membersPageSize));
  const safeMembersPage = Math.min(membersPage, totalMembersPages);
  const paginatedMembers = filteredMembers.slice(
    (safeMembersPage - 1) * membersPageSize,
    safeMembersPage * membersPageSize
  );

  const staffCoaches = members.filter((m) => m.role === 'admin' || m.role === 'instructor');
  const hasActiveMemberFilters =
    memberSearch.trim().length > 0 || memberStatusFilter !== 'all' || memberFilterType !== 'all';

  const uniqueAuditActions = Array.from(new Set(auditLogs.map((l) => l.action))).sort();
  const filteredAuditLogs = auditLogs.filter((log) => {
    const matchesAction = auditActionFilter === 'all' || log.action === auditActionFilter;
    const q = auditSearch.toLowerCase().trim();
    if (!q) return matchesAction;
    const detailText = typeof log.details === 'string' ? log.details : JSON.stringify(log.details || '');
    return (
      matchesAction &&
      (log.actorEmail?.toLowerCase().includes(q) ||
        log.action?.toLowerCase().includes(q) ||
        detailText.toLowerCase().includes(q))
    );
  });
  const totalAuditPages = Math.max(1, Math.ceil(filteredAuditLogs.length / auditPageSize));
  const safeAuditPage = Math.min(auditPage, totalAuditPages);
  const paginatedAuditLogs = filteredAuditLogs.slice(
    (safeAuditPage - 1) * auditPageSize,
    safeAuditPage * auditPageSize
  );

  const filteredPayments = payments.filter((p) => {
    const matchesFilter = paymentFilter === 'all' || p.status === paymentFilter;
    const matchesSearch =
      p.referenceCode.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      p.userName.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      p.bankName.toLowerCase().includes(paymentSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const maxTrendRevenue = Math.max(...(stats.salesTrend || []).map((t: any) => t.revenue), 10000);
  const pendingReviewsCount = allClientMeasurements.filter((m) => !m.coachFeedback).length;

  const navigationItems = [
    { id: 'analytics', label: 'Dashboard Overview', icon: TrendingUp },
    {
      id: 'daily_dashboard',
      label: 'Daily Sales & Ad CRM',
      icon: Target,
      badge: 'Sheet',
    },
    {
      id: 'payments',
      label: 'Bank Approvals',
      icon: CreditCard,
      badge: stats.pendingTransfers > 0 ? `${stats.pendingTransfers}` : null,
    },
    {
      id: 'members',
      label: 'Members Directory',
      icon: Users,
      badge:
        expiredMembersCount + expiringMembersCount > 0
          ? `${expiredMembersCount + expiringMembersCount} Due`
          : null,
    },
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
    { id: 'reports', label: 'Reports Center', icon: FileBarChart2 },
    { id: 'database_health', label: 'Database & Backend', icon: Server, statusDot: 'green' },
    { id: 'audit', label: 'Audit Trail', icon: History },
  ];

  const currentNavItem =
    navigationItems.find((item) => item.id === activeTab) || navigationItems[0];

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
          LEFT NAVIGATION SIDEBAR (Full-Height Desktop Rail + Sticky Nav)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="md:w-72 lg:w-80 shrink-0 md:bg-[#09090d] md:border-r md:border-white/[0.08] md:self-stretch">
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-72 lg:w-full bg-[#09090d] border-r md:border-r-0 border-white/[0.08] flex flex-col z-50 md:z-30 transition-transform duration-300 md:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.06] flex items-center justify-between shrink-0 bg-[#0c0c11]">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-crimson-950/80 border border-crimson-500/50 flex items-center justify-center p-1 shadow-[0_0_15px_rgba(186,26,26,0.4)] shrink-0">
              <Image
                src="/images/musclecraft-emblem.png"
                alt="MuscleCraft Emblem"
                width={26}
                height={26}
                className="object-contain"
              />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold tracking-wider text-white text-sm uppercase leading-tight block whitespace-nowrap">
                Muscle<span className="text-crimson-500">Craft</span>
              </span>
              <span className="text-[9px] font-mono font-bold tracking-widest text-crimson-400 uppercase block whitespace-nowrap">
                Owner Portal
              </span>
            </div>
          </div>

          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer shrink-0"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Items */}
        <nav
          className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20 pb-4"
          aria-label="Admin Navigation"
        >
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
                className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs sm:text-[13px] font-semibold transition-all min-h-[40px] cursor-pointer ${
                  isActive
                    ? 'bg-crimson-600 text-white shadow-crimson-glow font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-gray-400'
                    }`}
                  />
                  <span className="truncate whitespace-nowrap text-left">{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                  {item.statusDot === 'green' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                  {item.badge && (
                    <span
                      className={`text-[9.5px] font-mono font-medium px-2 py-0.5 rounded-full whitespace-nowrap border transition-colors ${
                        isActive
                          ? 'bg-white/20 text-white border-white/25'
                          : item.badge.includes('Due') ||
                            item.badge.includes('Slips') ||
                            !isNaN(Number(item.badge))
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          : 'bg-white/[0.06] text-zinc-300 border-white/[0.08]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer: Owner Identity & Fast Public Link */}
        <div className="p-3 border-t border-white/[0.06] bg-[#0c0c11] shrink-0 space-y-1.5">
          {/* Owner Profile Card */}
          <div className="p-2 rounded-xl bg-[#14141c] border border-white/[0.06] flex items-center gap-2.5">
            <img
              src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
              alt={currentUser?.name || 'Adeesha Kumarasingha'}
              className="w-7 h-7 rounded-full object-cover border border-crimson-500/50 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-white block truncate leading-tight">
                {(currentUser?.name || 'Adeesha Kumarasingha').replace(/\s*\(.*?\)\s*/g, '')}
              </span>
              <span className="text-[10px] text-gray-400 block truncate leading-tight">
                {currentUser?.role === 'instructor' ? 'Senior Coach' : 'Founder & Head Coach'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {/* Public Website Link */}
            <Link
              href="/"
              target="_blank"
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-gray-400 hover:text-white hover:bg-white/5 border border-white/5 flex items-center justify-center gap-1.5 transition-colors min-h-[34px]"
              title="Open public website in new tab"
            >
              <Globe className="w-3.5 h-3.5 text-crimson-400 shrink-0" />
              <span>Public Site</span>
            </Link>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 border border-rose-500/20 hover:border-rose-500/40 flex items-center justify-center gap-1.5 transition-colors min-h-[34px] cursor-pointer"
              title="Log out of Admin Portal"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MAIN APP CANVAS (Dedicated Admin Topbar + Content View)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#08080a]">
        {/* Dedicated Admin Topbar / Navigation Bar */}
        <header
          className={`h-16 px-3 sm:px-6 lg:px-8 border-b sticky top-0 z-30 flex items-center justify-between gap-3 transition-all duration-200 ${
            isScrolled
              ? 'bg-[#09090d]/95 backdrop-blur-xl border-white/[0.14] shadow-[0_12px_32px_-8px_rgba(0,0,0,0.85)]'
              : 'bg-[#0c0c11]/85 backdrop-blur-md border-white/[0.08]'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden text-gray-400 hover:text-white p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb & Quick Switcher Pill */}
            <div className="flex items-center gap-2 text-xs min-w-0">
              <span className="text-gray-400 font-medium hidden xl:inline whitespace-nowrap">
                MuscleCraft Admin
              </span>
              <span className="text-gray-600 hidden xl:inline">/</span>

              {/* Quick Tab Switcher Pill in Topbar */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setHeaderMenuOpen(!headerMenuOpen)}
                  className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.1] text-white text-xs font-bold transition-all cursor-pointer shadow-sm group shrink-0"
                  aria-expanded={headerMenuOpen}
                  aria-haspopup="true"
                  title="Click to quickly switch admin workspace"
                >
                  <currentNavItem.icon className="w-3.5 h-3.5 text-crimson-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="truncate max-w-[130px] sm:max-w-[170px] xl:max-w-[220px]">
                    {currentNavItem.label}
                  </span>
                  <ChevronDown
                    className={`w-3 h-3 text-gray-400 transition-transform duration-200 shrink-0 ${
                      headerMenuOpen ? 'rotate-180 text-white' : ''
                    }`}
                  />
                </button>

                {headerMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setHeaderMenuOpen(false)}
                    />
                    <div className="absolute left-0 mt-2 w-64 sm:w-72 bg-[#0e0e14] border border-white/[0.12] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] z-50 p-2 space-y-1 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold border-b border-white/[0.06] flex items-center justify-between">
                        <span>Select Workspace</span>
                        <span className="text-crimson-400">{navigationItems.length} Workspaces</span>
                      </div>
                      <div className="max-h-[360px] overflow-y-auto space-y-0.5 py-1 scrollbar-thin scrollbar-thumb-white/10">
                        {navigationItems.map((item) => {
                          const Icon = item.icon;
                          const isCurrent = activeTab === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setActiveTab(item.id as any);
                                setHeaderMenuOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                isCurrent
                                  ? 'bg-crimson-600 text-white font-bold shadow-[0_0_12px_rgba(186,26,26,0.4)]'
                                  : 'text-gray-300 hover:text-white hover:bg-white/[0.06]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <Icon
                                  className={`w-3.5 h-3.5 shrink-0 ${
                                    isCurrent ? 'text-white' : 'text-gray-400'
                                  }`}
                                />
                                <span className="truncate">{item.label}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                {item.statusDot === 'green' && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                )}
                                {item.badge && (
                                  <span
                                    className={`text-[9.5px] font-mono font-medium px-1.5 py-0.5 rounded-full border ${
                                      isCurrent
                                        ? 'bg-white/20 text-white border-white/30'
                                        : 'bg-white/[0.06] text-zinc-300 border-white/[0.08]'
                                    }`}
                                  >
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 flex-nowrap shrink-0">
            {/* Live Database Status Pill */}
            <button
              onClick={() => setActiveTab('database_health')}
              className="hidden lg:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-all cursor-pointer border border-white/[0.08] hover:border-white/20 bg-[#13131b] hover:bg-[#181824] text-zinc-300 whitespace-nowrap shrink-0 shadow-sm"
              title="Click to view Database & Backend Telemetry"
              aria-label="View Database and Backend Telemetry"
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  healthData?.supabaseConfigured && healthData?.database?.connected
                    ? 'bg-emerald-400'
                    : healthData?.supabaseConfigured
                    ? 'bg-rose-400'
                    : 'bg-amber-400'
                }`}
              />
              <span className="font-medium tracking-tight">
                {healthData?.supabaseConfigured && healthData?.database?.connected
                  ? `Supabase Live (${healthData?.database?.latencyMs || 21}ms)`
                  : healthData?.supabaseConfigured
                  ? 'Supabase Error'
                  : 'Local Cache Fallback'}
              </span>
            </button>

            <div className="hidden xl:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#13131b] border border-white/[0.08] text-zinc-300 text-xs font-mono font-medium whitespace-nowrap shrink-0">
              <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Rs. {stats.totalRevenue.toLocaleString()} MTD</span>
            </div>

            {stats.pendingTransfers > 0 && (
              <button
                onClick={() => setActiveTab('payments')}
                className="hidden 2xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-white text-xs font-mono font-medium cursor-pointer transition-colors whitespace-nowrap shrink-0"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{stats.pendingTransfers} Slips Waiting</span>
              </button>
            )}

            <button
              onClick={() => loadAdminData()}
              className="p-2 bg-[#13131b] hover:bg-white/[0.06] text-zinc-400 hover:text-white rounded-xl border border-white/[0.08] transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center shrink-0"
              title="Refresh Data"
              aria-label="Refresh telemetry data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Direct Logout CTA */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-rose-950/40 border border-white/[0.08] hover:border-rose-500/30 text-zinc-400 hover:text-rose-300 text-xs font-medium transition-colors cursor-pointer min-h-[36px] whitespace-nowrap shrink-0"
              title="Sign Out of Admin Portal"
              aria-label="Sign Out of Admin Portal"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400 shrink-0" />
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
            isLoadingData && !stats ? (
              <AnalyticsDashboardSkeleton />
            ) : (
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
                    <span>
                      {stats.growthPercent > 0
                        ? `+${stats.growthPercent}% vs last month`
                        : 'Live verified MTD ledger'}
                    </span>
                  </div>
                </div>

                <div className="bg-[#111116] border border-white/[0.08] p-5 rounded-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase tracking-wider">
                    <span>Active Member Base</span>
                    <Users className="w-4 h-4 text-crimson-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-2">
                    {stats.activeAthleteBase ?? (stats.soleMembers + stats.coupleMembers * 2 + stats.coachingMembers)}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-2">
                    {stats.soleMembers} Sole · {stats.coupleMembers} {stats.coupleMembers === 1 ? 'Pair' : 'Pairs'} ({stats.coupleMembers * 2} Athletes) · {stats.coachingMembers} VIP
                  </div>
                </div>

                <div className="bg-[#111116] border border-white/[0.08] p-5 rounded-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase tracking-wider">
                    <span>Pending Bank Slips</span>
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono mt-2">
                    {stats.pendingTransfers} Slips
                  </div>
                  <button
                    onClick={() => setActiveTab('payments')}
                    className="text-[11px] text-amber-400/90 hover:text-amber-300 underline mt-2 block font-medium cursor-pointer"
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
                    Rs. 500 Sole / Rs. 1,000 Couple ({stats.activeMembers || stats.approvedCount || 0} Verified)
                  </div>
                </div>
              </div>

              {/* ── EXPIRATIONS & RENEWALS CRM DESK (ACTION REQUIRED) ── */}
              <div
                id="renewals-desk"
                className="bg-[#111116] border border-amber-500/30 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                        Membership Expirations & Renewals Desk
                      </h2>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Track upcoming and overdue renewals, auto-logout 90-day cohorts, and dispatch 1-click WhatsApp reminders
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-rose-500/10 border border-rose-500/30 text-rose-300">
                      {expiredMembersCount} Overdue / Expired
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-amber-500/10 border border-amber-500/30 text-amber-300">
                      {expiringMembersCount} Expiring Soon (≤ 7d)
                    </span>
                  </div>
                </div>

                {expiringOrExpiredMembers.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-400 bg-white/[0.01] rounded-2xl border border-white/[0.04]">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                    <span className="text-gray-300 font-semibold block">All Member Subscriptions Current</span>
                    <span>No members have expired or are due for renewal within the next 7 days.</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#161622] text-gray-400 uppercase text-[10px] tracking-wider border-b border-white/[0.06]">
                        <tr>
                          <th className="py-3 px-4 font-bold">Client / Member</th>
                          <th className="py-3 px-4 font-bold">Package / Plan</th>
                          <th className="py-3 px-4 font-bold">Expiry Date</th>
                          <th className="py-3 px-4 font-bold">Renewal Status</th>
                          <th className="py-3 px-4 font-bold">Access Policy</th>
                          <th className="py-3 px-4 font-bold text-right">Quick CRM Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {expiringOrExpiredMembers.map((m) => {
                          const cleanPhone = m.phone ? m.phone.replace(/[^0-9]/g, '') : '';
                          const waText = m.isExpired
                            ? `Hi ${m.name}, Coach Adeesha from MuscleCraft Gym here! A quick note that your ${m.packageName || 'Gym'} membership has expired. Reply here to confirm your renewal or share your transfer slip so you can keep training without interruption!`
                            : `Hi ${m.name}, Coach Adeesha from MuscleCraft Gym here! Quick reminder that your ${m.packageName || 'Gym'} membership expires on ${m.expiryDate.toLocaleDateString()} (in ${m.daysLeft} days). Renew early to keep your workouts uninterrupted!`;

                          return (
                            <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={m.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                                    alt={m.name}
                                    className="w-8 h-8 rounded-full object-cover border border-white/10"
                                  />
                                  <div>
                                    <span className="font-semibold text-white block">{m.name}</span>
                                    <span className="text-[11px] text-gray-400 block">
                                      {m.email} {m.phone ? `· ${m.phone}` : ''}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span className="font-semibold text-gray-200 block">{m.packageName || m.tier}</span>
                                <span className="text-[10px] text-gray-400 font-mono">
                                  {m.packageType?.toUpperCase() || 'MEMBERSHIP'}
                                </span>
                              </td>

                              <td className="py-3.5 px-4 whitespace-nowrap font-mono text-gray-300">
                                {m.expiryDate.toLocaleDateString()}
                              </td>

                              <td className="py-3.5 px-4 whitespace-nowrap">
                                {m.isExpired ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-300 bg-rose-950/80 px-2.5 py-1 rounded-full border border-rose-700/60 shadow-sm">
                                    <AlertCircle className="w-3 h-3 text-rose-400" />
                                    Expired ({Math.abs(m.daysLeft)}d ago)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-600/50">
                                    <Clock className="w-3 h-3 text-amber-400" />
                                    Due in {m.daysLeft}d
                                  </span>
                                )}
                              </td>

                              <td className="py-3.5 px-4 whitespace-nowrap">
                                {m.is90Day ? (
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-600/40">
                                    90-Day (Auto-Logout)
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950/50 px-2 py-0.5 rounded border border-blue-600/40">
                                    Gym Floor (Portal Notice)
                                  </span>
                                )}
                              </td>

                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-2">
                                  {cleanPhone && (
                                    <a
                                      href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-2.5 py-1.5 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                      title="Open WhatsApp with prefilled renewal reminder"
                                    >
                                      <MessageSquare className="w-3 h-3" />
                                      <span>WhatsApp</span>
                                    </a>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleExtendMembership(m.id, 30)}
                                    className="px-2.5 py-1.5 bg-[#181822] hover:bg-crimson-600 text-gray-200 hover:text-white border border-white/10 hover:border-crimson-600 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                                    title="Extend membership by +30 days"
                                  >
                                    +30 Days
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleExtendMembership(m.id, 90)}
                                    className="px-2.5 py-1.5 bg-[#181822] hover:bg-amber-600 text-gray-200 hover:text-black border border-white/10 hover:border-amber-600 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                                    title="Extend membership by +90 days (1 Quarter)"
                                  >
                                    +90 Days
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
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
                        <span className="w-3 h-3 rounded bg-crimson-600 inline-block" /> Current Month ({(stats.salesTrend?.[stats.salesTrend.length - 1]?.month || 'Nov').split(' ')[0]})
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-[#2d2d3a] inline-block" /> Historical Trend
                      </span>
                    </div>
                    <span className="font-mono text-gray-300">
                      Average Monthly Growth: <strong className="text-emerald-400">{stats.growthPercent > 0 ? `+${stats.growthPercent}%` : '0%'}</strong>
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
                          <span className="text-zinc-300 font-medium">1. Total Registered</span>
                          <span className="text-white font-mono font-bold">{stats.registrationFunnel.registered}</span>
                        </div>
                        <div className="h-2.5 w-full bg-white/[0.04] border border-white/[0.04] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-zinc-500/80 rounded-full transition-all"
                            style={{ width: stats.registrationFunnel.registered > 0 ? '100%' : '0%' }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-emerald-400 font-medium flex items-center gap-1">
                            <Check className="w-3 h-3" /> 2. Approved & Active
                          </span>
                          <span className="text-emerald-300 font-mono font-bold">
                            {stats.registrationFunnel.approved} (
                            {stats.registrationFunnel.registered > 0
                              ? Math.round((stats.registrationFunnel.approved / stats.registrationFunnel.registered) * 100)
                              : 0}
                            %)
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-white/[0.04] border border-white/[0.04] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500/90 rounded-full transition-all"
                            style={{
                              width: `${
                                stats.registrationFunnel.registered > 0
                                  ? Math.min(100, (stats.registrationFunnel.approved / stats.registrationFunnel.registered) * 100)
                                  : 0
                              }%`,
                            }}
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
                        <div className="h-2.5 w-full bg-white/[0.04] border border-white/[0.04] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500/80 rounded-full transition-all"
                            style={{
                              width: `${
                                stats.registrationFunnel.registered > 0
                                  ? Math.min(100, (stats.registrationFunnel.pending / stats.registrationFunnel.registered) * 100)
                                  : 0
                              }%`,
                            }}
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
                        <div className="h-2.5 w-full bg-white/[0.04] border border-white/[0.04] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose-500/70 rounded-full transition-all"
                            style={{
                              width: `${
                                stats.registrationFunnel.registered > 0
                                  ? Math.min(100, (stats.registrationFunnel.notApproved / stats.registrationFunnel.registered) * 100)
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/[0.08] mt-6">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Approval Rate:</span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        {stats.registrationFunnel?.registered > 0
                          ? Math.round((stats.registrationFunnel.approved / stats.registrationFunnel.registered) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-gray-400">Avg Verification Turnaround:</span>
                      <span className="font-mono text-white">{stats.avgTurnaround || '< 45 Mins'}</span>
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
                        <span className="font-mono font-bold text-white">
                          {stats.membershipTypeSplit?.solePercent ?? 0}% ({stats.soleMembers ?? 0} Active)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-crimson-600 rounded-full transition-all"
                          style={{ width: `${stats.membershipTypeSplit?.solePercent ?? 0}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-gray-300 mb-1">
                        <span>Couple Memberships</span>
                        <span className="font-mono font-bold text-white">
                          {stats.membershipTypeSplit?.couplePercent ?? 0}% ({stats.coupleMembers ?? 0} {stats.coupleMembers === 1 ? 'Pair' : 'Pairs'})
                        </span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-400/80 rounded-full transition-all"
                          style={{ width: `${stats.membershipTypeSplit?.couplePercent ?? 0}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-gray-300 mb-1">
                        <span>Online & VIP Coaching</span>
                        <span className="font-mono font-bold text-white">
                          {stats.membershipTypeSplit?.coachingPercent ?? 0}% ({stats.coachingMembers ?? 0} VIP)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all"
                          style={{ width: `${stats.membershipTypeSplit?.coachingPercent ?? 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-gray-400 leading-relaxed">
                    {stats.activeMembers > 0 ? (
                      <>
                        <strong>Sole and Couple memberships</strong> represent {Math.min(100, (stats.membershipTypeSplit?.solePercent ?? 0) + (stats.membershipTypeSplit?.couplePercent ?? 0))}% of verified active gym athletes.
                      </>
                    ) : (
                      <>Ready for enrollments. Active tier distribution updates automatically as athletes join.</>
                    )}
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
                        <span>Hypertrophy & Strength</span>
                        <span className="font-mono font-bold text-white">{stats.disciplines?.hypertrophy ?? 0}%</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${stats.disciplines?.hypertrophy ?? 0}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-gray-300 mb-1">
                        <span>90-Day Transformation</span>
                        <span className="font-mono font-bold text-white">{stats.disciplines?.transformation ?? 0}%</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full transition-all"
                          style={{ width: `${stats.disciplines?.transformation ?? 0}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-gray-300 mb-1">
                        <span>Conditioning & Duo Fitness</span>
                        <span className="font-mono font-bold text-white">{stats.disciplines?.conditioning ?? 0}%</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-zinc-400 rounded-full transition-all"
                          style={{ width: `${stats.disciplines?.conditioning ?? 0}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-gray-300 mb-1">
                        <span>Mobility & Recovery</span>
                        <span className="font-mono font-bold text-white">{stats.disciplines?.mobility ?? 0}%</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all"
                          style={{ width: `${stats.disciplines?.mobility ?? 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-gray-400">
                    Calculated from live athlete enrollment tracks and coaching protocols.
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
                      <span className="text-3xl font-extrabold text-white font-mono block">
                        {stats.gymFloorLoad?.totalCheckedIn ?? stats.checkinsToday ?? 0}
                      </span>
                      <span className="text-xs text-gray-400">Athletes Scheduled / Checked In</span>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-600/40 text-emerald-400 font-semibold">
                      {stats.gymFloorLoad?.status || 'Ready for Open'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-gray-400 border-b border-white/[0.04] pb-1.5">
                      <span>Morning Peak (06:00 - 08:30)</span>
                      <span className="text-white font-mono font-semibold">
                        {stats.gymFloorLoad?.morning ?? 0} Visits
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-400 border-b border-white/[0.04] pb-1.5">
                      <span>Afternoon BurnZone (15:00 - 17:00)</span>
                      <span className="text-white font-mono font-semibold">
                        {stats.gymFloorLoad?.afternoon ?? 0} Visits
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-400 pt-0.5">
                      <span>Evening Peak (17:30 - 20:30)</span>
                      <span className="text-crimson-400 font-mono font-bold">
                        {stats.gymFloorLoad?.evening ?? 0} Visits
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 p-3.5 rounded-xl bg-crimson-950/20 border border-crimson-800/30 text-[11px] text-gray-300">
                    🔥 Peak floor hours: <strong>{stats.gymFloorLoad?.peakMorning || '07:00 AM'}</strong> & <strong>{stats.gymFloorLoad?.peakEvening || '06:30 PM'}</strong>.
                  </div>
                </div>
              </div>

              {/* Quick Link Card to Musclecraft Daily Dashboard */}
              <div className="bg-[#111116] border border-white/[0.08] hover:border-crimson-600/40 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-crimson-600/20 border border-crimson-500/30 flex items-center justify-center text-crimson-400 flex-shrink-0">
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-zinc-300">
                        Client Sheet Integrated
                      </span>
                      <h3 className="text-base font-bold text-white">
                        Musclecraft Daily Dashboard (Ad Spend, Inquiries & Sales)
                      </h3>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Monitor daily Meta Ads spend, WhatsApp lead counts, CPR, ROAS, and Target vs Actual sales directly.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('daily_dashboard')}
                  className="px-5 py-2.5 bg-crimson-600 hover:bg-crimson-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md cursor-pointer whitespace-nowrap"
                >
                  Open Daily Dashboard →
                </button>
              </div>
            </div>
            )
          )}

          {/* ───────────────────────────────────────────────────────────
              TAB: DAILY SALES & AD CRM DASHBOARD (CLIENT SPREADSHEET)
              ─────────────────────────────────────────────────────────── */}
          {activeTab === 'daily_dashboard' && (
            <DailySalesDashboardTab
              onNotify={(type, text) => setActionMessage({ type, text })}
              onAuditLog={(action) => {
                setAuditLogs((prev) => [
                  {
                    id: `log_${Date.now()}`,
                    actorId: currentUser?.id || 'usr_admin_1',
                    actorEmail: currentUser?.email || 'musclecraftlk@gmail.com',
                    action: 'DAILY_SALES_UPDATE',
                    targetType: 'daily_sales',
                    targetId: 'crm_sheet',
                    details: action,
                    timestamp: new Date().toISOString(),
                  },
                  ...prev,
                ]);
              }}
            />
          )}

          {/* ───────────────────────────────────────────────────────────
              TAB 2: BANK APPROVALS & PAYMENT SLIPS VERIFICATION
              ─────────────────────────────────────────────────────────── */}
          {activeTab === 'payments' && (
            <BankApprovalsTab
              payments={payments}
              isLoading={isLoadingData}
              onApprove={handleApprovePayment}
              onReject={handleRejectPayment}
              onRefresh={loadAdminData}
            />
          )}

          {/* ───────────────────────────────────────────────────────────
              TAB 3: MEMBERS DIRECTORY
              ─────────────────────────────────────────────────────────── */}
          {activeTab === 'members' && (
            isLoadingData && members.length === 0 ? (
              <MembersDirectorySkeleton />
            ) : (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111116] border border-white/[0.08] p-5 rounded-2xl">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                      <Users className="w-5 h-5 text-crimson-500" />
                      Members Directory & Roster
                    </h2>
                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-gray-300">
                      {filteredMembers.length} {filteredMembers.length === 1 ? 'Account' : 'Accounts'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Add or edit members, manage package renewals, ban/unban access, and track 90-day expirations
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-1 bg-[#181822] p-1 rounded-xl border border-white/5 text-xs">
                    {(['all', 'sole', 'couple', 'coaching'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
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

                  <button
                    type="button"
                    onClick={() => setShowAddMemberModal(true)}
                    className="px-4 py-2.5 bg-crimson-600 hover:bg-crimson-500 text-white text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(186,26,26,0.4)] flex items-center gap-1.5 min-h-[40px] cursor-pointer transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>+ Add Member</span>
                  </button>
                </div>
              </div>

              {/* Search & Status Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or phone number..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    aria-label="Search members"
                    className="w-full pl-11 pr-10 py-3 bg-[#111116] border border-white/[0.08] rounded-xl text-xs text-white placeholder:text-gray-500 focus:border-crimson-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-crimson-500/30 transition-colors"
                  />
                  {memberSearch && (
                    <button
                      type="button"
                      onClick={() => setMemberSearch('')}
                      aria-label="Clear search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white rounded-lg cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="relative sm:w-56 shrink-0">
                  <select
                    value={memberStatusFilter}
                    onChange={(e) => setMemberStatusFilter(e.target.value as any)}
                    aria-label="Filter by member status"
                    className="appearance-none w-full pl-4 pr-10 py-3 bg-[#111116] border border-white/[0.08] hover:border-white/[0.16] rounded-xl text-xs text-white font-medium focus:border-crimson-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-crimson-500/30 cursor-pointer transition-colors"
                  >
                    <option value="all" className="bg-[#161620]">All Statuses</option>
                    <option value="active" className="bg-[#161620]">Active Members</option>
                    <option value="expiring_soon" className="bg-[#161620]">Expiring Soon (&le; 7 Days)</option>
                    <option value="expired" className="bg-[#161620]">Expired (Auto-Deactivated)</option>
                    <option value="pending" className="bg-[#161620]">Pending Package / Slip</option>
                    <option value="suspended" className="bg-[#161620]">Banned / Suspended</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {hasActiveMemberFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      setMemberSearch('');
                      setMemberStatusFilter('all');
                      setMemberFilterType('all');
                    }}
                    className="px-3.5 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-xl text-xs font-semibold text-gray-300 hover:text-white cursor-pointer transition-colors whitespace-nowrap"
                  >
                    Reset Filters
                  </button>
                )}
              </div>

              {/* Members Table + Responsive Mobile Cards */}
              <div className="bg-[#111116] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
                {paginatedMembers.length === 0 ? (
                  <div className="py-16 px-4 text-center space-y-3">
                    <Users className="w-9 h-9 text-gray-600 mx-auto" />
                    <div>
                      <span className="text-sm font-semibold text-gray-300 block">
                        No members match your current filters
                      </span>
                      <span className="text-xs text-gray-500 block mt-1">
                        Try clearing your search term or switching status / tier filters.
                      </span>
                    </div>
                    {hasActiveMemberFilters && (
                      <button
                        type="button"
                        onClick={() => {
                          setMemberSearch('');
                          setMemberStatusFilter('all');
                          setMemberFilterType('all');
                        }}
                        className="mt-2 px-4 py-2 rounded-xl bg-crimson-600/20 hover:bg-crimson-600/30 border border-crimson-500/40 text-crimson-300 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Reset All Filters
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Mobile Card View (< md) */}
                    <div className="md:hidden divide-y divide-white/[0.06]">
                      {paginatedMembers.map((m) => {
                        const expiry = m.membershipExpiresAt ? new Date(m.membershipExpiresAt).getTime() : null;
                        const daysLeft = expiry ? Math.ceil((expiry - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                        const isExpired = (daysLeft !== null && daysLeft <= 0) || m.status === 'expired';
                        const isExpiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 7;
                        const isSelfRow = Boolean(currentUser?.id && m.id === currentUser.id);

                        return (
                          <div key={m.id} className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <img
                                  src={m.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop'}
                                  alt={m.name}
                                  className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-semibold text-white text-xs truncate">{m.name}</span>
                                    {m.role === 'admin' && (
                                      <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-crimson-950/90 text-crimson-300 border border-crimson-700/60">
                                        Admin
                                      </span>
                                    )}
                                    {m.role === 'instructor' && (
                                      <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700/60">
                                        Coach
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-gray-400 block truncate">{m.email}</span>
                                  {m.phone && <span className="text-[11px] text-gray-500 font-mono block">{m.phone}</span>}
                                </div>
                              </div>

                              <div className="shrink-0">
                                {m.status === 'suspended' ? (
                                  <span className="text-[10px] font-bold text-rose-300 bg-rose-950/90 px-2 py-0.5 rounded-full border border-rose-600/70 inline-flex items-center gap-1">
                                    <Ban className="w-2.5 h-2.5" /> Banned
                                  </span>
                                ) : isExpired ? (
                                  <span className="text-[10px] font-bold text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-700/60">
                                    Expired
                                  </span>
                                ) : isExpiringSoon ? (
                                  <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-600/50">
                                    Due Soon
                                  </span>
                                ) : m.status === 'active' ? (
                                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-700/50">
                                    Active
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-700/50">
                                    Pending
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.05]">
                              <div>
                                <span className="text-[10px] text-gray-500 uppercase block">Plan</span>
                                <span className="text-gray-200 font-medium block truncate">{m.packageName || m.tier}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-gray-500 uppercase block">Expires</span>
                                <span className="text-gray-200 font-mono block">
                                  {formatShortDate(m.membershipExpiresAt)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setEditingMember(m)}
                                className="flex-1 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-gray-200 text-xs font-semibold flex items-center justify-center gap-1.5 min-h-[40px] cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5 text-crimson-400" />
                                <span>Edit Details</span>
                              </button>
                              {!isSelfRow && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleMemberStatus(m)}
                                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 min-h-[40px] cursor-pointer ${
                                    m.status === 'active'
                                      ? 'bg-white/[0.03] hover:bg-rose-950/60 text-zinc-300 hover:text-rose-300 border border-white/[0.08] hover:border-rose-500/40'
                                      : 'bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40'
                                  }`}
                                >
                                  {m.status === 'active' ? (
                                    <>
                                      <Ban className="w-3.5 h-3.5" />
                                      <span>Ban</span>
                                    </>
                                  ) : (
                                    <>
                                      <ShieldCheck className="w-3.5 h-3.5" />
                                      <span>{m.status === 'suspended' ? 'Unban' : 'Activate'}</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop Table View (>= md) */}
                    <div className="hidden md:block overflow-x-auto">
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
                          {paginatedMembers.map((m) => {
                            const expiry = m.membershipExpiresAt ? new Date(m.membershipExpiresAt).getTime() : null;
                            const daysLeft = expiry ? Math.ceil((expiry - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                            const isExpired = (daysLeft !== null && daysLeft <= 0) || m.status === 'expired';
                            const isExpiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 7;
                            const cleanPhone = m.phone ? m.phone.replace(/[^0-9]/g, '') : '';
                            const isSelfRow = Boolean(currentUser?.id && m.id === currentUser.id);
                            const waText = isExpired
                              ? `Hi ${m.name}, Coach Adeesha from MuscleCraft Gym here! A quick note that your ${m.packageName || 'Gym'} membership has expired. Reply here to confirm your renewal or share your transfer slip so you can keep training without interruption!`
                              : `Hi ${m.name}, Coach Adeesha from MuscleCraft Gym here! Quick reminder that your ${m.packageName || 'Gym'} membership expires on ${formatShortDate(m.membershipExpiresAt)} (in ${daysLeft} days). Renew early to keep your workouts uninterrupted!`;

                            return (
                              <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={m.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop'}
                                      alt={m.name}
                                      className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0"
                                    />
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-semibold text-white">{m.name}</span>
                                        {m.role === 'admin' && (
                                          <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-crimson-950/90 text-crimson-300 border border-crimson-700/60">
                                            Admin
                                          </span>
                                        )}
                                        {m.role === 'instructor' && (
                                          <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700/60">
                                            Coach
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[11px] text-gray-400 block">
                                        {m.email} {m.phone ? `· ${m.phone}` : ''}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="font-semibold text-gray-200 block">{m.packageName || m.tier}</span>
                                  <span className="text-[10px] text-gray-500 uppercase font-mono whitespace-nowrap block">
                                    Joined {formatShortDate(m.joinedAt)}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 whitespace-nowrap">
                                  {m.status === 'suspended' ? (
                                    <span className="text-[11px] font-bold text-rose-300 bg-rose-950/90 px-2.5 py-1 rounded-full border border-rose-600/70 inline-flex items-center gap-1">
                                      <Ban className="w-3 h-3" /> Banned
                                    </span>
                                  ) : isExpired ? (
                                    <span className="text-[11px] font-bold text-rose-300 bg-rose-950/80 px-2.5 py-1 rounded-full border border-rose-700/60 shadow-sm">
                                      Expired (Inactive)
                                    </span>
                                  ) : isExpiringSoon ? (
                                    <span className="text-[11px] font-bold text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-600/50">
                                      Due Soon
                                    </span>
                                  ) : m.status === 'active' ? (
                                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-700/50">
                                      Active
                                    </span>
                                  ) : (
                                    <span className="text-[11px] font-bold text-amber-400 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-700/50">
                                      Pending Package
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 whitespace-nowrap">
                                  {m.membershipExpiresAt ? (
                                    <div>
                                      <span
                                        className={`font-mono text-xs block ${
                                          isExpired
                                            ? 'text-rose-400 font-bold'
                                            : isExpiringSoon
                                            ? 'text-amber-400 font-bold'
                                            : 'text-gray-200'
                                        }`}
                                      >
                                        {formatShortDate(m.membershipExpiresAt)}
                                      </span>
                                      {isExpired ? (
                                        <span className="text-[10px] text-rose-300 bg-rose-950/70 border border-rose-700/50 px-2 py-0.5 rounded font-bold inline-flex items-center gap-1 mt-0.5">
                                          <AlertCircle className="w-2.5 h-2.5" /> Expired ({Math.abs(daysLeft || 0)}d ago)
                                        </span>
                                      ) : isExpiringSoon ? (
                                        <span className="text-[10px] text-amber-300 bg-amber-950/70 border border-amber-600/50 px-2 py-0.5 rounded font-semibold inline-flex items-center gap-1 mt-0.5">
                                          <Clock className="w-2.5 h-2.5" /> Due in {daysLeft}d
                                        </span>
                                      ) : daysLeft !== null ? (
                                        <span className="text-[10px] text-gray-500 font-mono block mt-0.5">
                                          {daysLeft}d remaining
                                        </span>
                                      ) : null}
                                    </div>
                                  ) : (
                                    <span className="text-gray-500 font-mono text-[11px]">
                                      {m.role !== 'client' ? 'Staff' : 'N/A'}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 whitespace-nowrap">
                                  {m.role === 'admin' ? (
                                    <>
                                      <span className="text-xs text-crimson-300 font-medium block">System Owner / Admin</span>
                                      <span className="text-[10px] text-gray-500">Full Access</span>
                                    </>
                                  ) : m.role === 'instructor' ? (
                                    <>
                                      <span className="text-xs text-amber-300 font-medium block">Coaching Staff</span>
                                      <span className="text-[10px] text-gray-500">Instructor Roster</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-xs text-gray-300 block">
                                        {m.assignedInstructorName || 'Coach Adeesha (Owner)'}
                                      </span>
                                      <span className="text-[10px] text-gray-500">Master Roster</span>
                                    </>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {cleanPhone && (isExpiringSoon || isExpired) && (
                                      <a
                                        href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-2.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                        title="Send WhatsApp Renewal Reminder"
                                      >
                                        <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                                      </a>
                                    )}
                                    {(isExpiringSoon || isExpired) && (
                                      <button
                                        type="button"
                                        onClick={() => handleExtendMembership(m.id, 30)}
                                        className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                        title="Extend membership by +30 days"
                                      >
                                        +30d
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => setEditingMember(m)}
                                      className="px-2.5 py-1.5 bg-white/[0.04] hover:bg-white/[0.1] text-gray-200 hover:text-white border border-white/[0.1] hover:border-crimson-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson-500"
                                      title={`Edit ${m.name}'s details`}
                                    >
                                      <Pencil className="w-3.5 h-3.5 text-crimson-400" />
                                      <span>Edit</span>
                                    </button>
                                    {!isSelfRow && (
                                      <button
                                        type="button"
                                        onClick={() => handleToggleMemberStatus(m)}
                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson-500 ${
                                          m.status === 'active'
                                            ? 'bg-white/[0.03] hover:bg-rose-950/60 text-zinc-300 hover:text-rose-300 border border-white/[0.08] hover:border-rose-500/40'
                                            : 'bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40'
                                        }`}
                                        title={m.status === 'active' ? 'Ban / Suspend user portal access' : 'Unban & activate member portal'}
                                      >
                                        {m.status === 'active' ? (
                                          <>
                                            <Ban className="w-3.5 h-3.5" />
                                            <span>Ban</span>
                                          </>
                                        ) : (
                                          <>
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                            <span>{m.status === 'suspended' ? 'Unban' : 'Activate'}</span>
                                          </>
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Footer */}
                    <TablePagination
                      currentPage={safeMembersPage}
                      totalItems={filteredMembers.length}
                      pageSize={membersPageSize}
                      onPageChange={setMembersPage}
                      onPageSizeChange={setMembersPageSize}
                      pageSizeOptions={[5, 8, 10, 25]}
                      itemLabel="members"
                    />
                  </>
                )}
              </div>
            </div>
            )
          )}

          {/* ───────────────────────────────────────────────────────────
              TAB: BODY ANALYTICS HUB & SUBMISSIONS MONITOR
              ─────────────────────────────────────────────────────────── */}
          {activeTab === 'analytics_submissions' && (
            <BodyAnalyticsTab
              measurements={allClientMeasurements}
              members={members}
              isLoading={isLoadingData}
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
              healthData={healthData}
              isLoading={isLoadingData}
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
              isLoading={isLoadingData}
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
              TAB: EXECUTIVE REPORTS CENTER
              ─────────────────────────────────────────────────────────── */}
          {activeTab === 'reports' && (
            <ReportsTab adminId={currentUser?.id || ''} />
          )}



          {/* ───────────────────────────────────────────────────────────
              TAB 7: AUDIT LOGS
              ─────────────────────────────────────────────────────────── */}
          {activeTab === 'audit' && (
            isLoadingData && auditLogs.length === 0 ? (
              <AuditLogsSkeleton />
            ) : (
            <div className="space-y-5">
              <div className="bg-[#111116] border border-white/[0.08] p-5 sm:p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <History className="w-5 h-5 text-crimson-500" />
                    Administrative Audit Trail & Security Ledger
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Immutable log of all financial approvals, member edits, SMS dispatches, and protocol assignments.
                  </p>
                </div>
                <span className="text-xs font-mono text-gray-300 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] self-start sm:self-auto">
                  {filteredAuditLogs.length} / {auditLogs.length} Entries
                </span>
              </div>

              {/* Audit Search & Action Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search audit logs by actor, action, member name, or message..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    aria-label="Search audit logs"
                    className="w-full pl-11 pr-10 py-3 bg-[#111116] border border-white/[0.08] rounded-xl text-xs text-white placeholder:text-gray-500 focus:border-crimson-500 focus:outline-none"
                  />
                  {auditSearch && (
                    <button
                      type="button"
                      onClick={() => setAuditSearch('')}
                      aria-label="Clear audit search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white rounded-lg cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="relative sm:w-64 shrink-0">
                  <select
                    value={auditActionFilter}
                    onChange={(e) => setAuditActionFilter(e.target.value)}
                    aria-label="Filter by audit action"
                    className="appearance-none w-full pl-4 pr-10 py-3 bg-[#111116] border border-white/[0.08] rounded-xl text-xs text-white font-mono focus:border-crimson-500 focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-[#161620]">All Action Types</option>
                    {uniqueAuditActions.map((act) => (
                      <option key={act} value={act} className="bg-[#161620]">
                        {act}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="bg-[#111116] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs table-fixed">
                    <thead className="bg-[#16161f] text-gray-400 uppercase text-[10px] tracking-wider border-b border-white/[0.06]">
                      <tr>
                        <th className="py-3.5 px-4 font-bold w-[170px]">Timestamp</th>
                        <th className="py-3.5 px-4 font-bold w-[180px]">Actor</th>
                        <th className="py-3.5 px-4 font-bold w-[200px]">Action Type</th>
                        <th className="py-3.5 px-4 font-bold">Details & Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {paginatedAuditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-14 text-center text-gray-500">
                            No audit entries match your current filter.
                          </td>
                        </tr>
                      ) : (
                        paginatedAuditLogs.map((log) => {
                          const formatted = formatAuditLogDetails(log.details);
                          return (
                            <tr key={log.id} className="hover:bg-white/[0.02] transition-colors align-top">
                              <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-gray-400">
                                {new Date(log.timestamp).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td className="py-3.5 px-4 truncate">
                                <span className="font-semibold text-white block truncate" title={log.actorEmail}>
                                  {log.actorEmail}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-crimson-950 text-crimson-300 border border-crimson-800 inline-block max-w-full truncate">
                                  {log.action}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-gray-300 font-medium break-words">
                                <span className="block leading-relaxed">{formatted.summary}</span>
                                {formatted.meta.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                                    {formatted.meta.map((tag, i) => (
                                      <span
                                        key={i}
                                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-gray-400"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {filteredAuditLogs.length > 0 && (
                  <TablePagination
                    currentPage={safeAuditPage}
                    totalItems={filteredAuditLogs.length}
                    pageSize={auditPageSize}
                    onPageChange={setAuditPage}
                    onPageSizeChange={setAuditPageSize}
                    pageSizeOptions={[5, 10, 25, 50]}
                    itemLabel="entries"
                  />
                )}
              </div>
            </div>
            )
          )}

          {/* ───────────────────────────────────────────────────────────
              TAB: DATABASE & BACKEND TELEMETRY
              ─────────────────────────────────────────────────────────── */}
          {activeTab === 'database_health' && (
            <DatabaseHealthTab
              healthData={healthData}
              isLoading={isLoadingData}
              onRefreshHealth={handleRefreshHealth}
            />
          )}
        </main>

        {/* Minimal Admin Workspace Footer (NOT public marketing footer) */}
        <footer className="py-4 px-6 sm:px-8 border-t border-white/[0.04] text-[11px] text-gray-500 flex flex-col md:flex-row items-center justify-between gap-2 text-center md:text-left">
          <span>MuscleCraft Operations Command Center · Owner Edition v1.2</span>
          <span className="text-gray-400">
            Development Contact: <strong className="text-gray-200 font-medium">The Monolith LK</strong> · Dulanja Abeysinghe (
            <a href="tel:0765917189" className="text-crimson-400 hover:text-crimson-300 transition-colors underline underline-offset-2">
              0765917189
            </a>
            )
          </span>
          <span>Authorized Personnel Only · All Actions Recorded & Synced</span>
        </footer>
      </div>

      {/* Add Member & Login Access Modal */}
      {showAddMemberModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddMemberModal(false);
          }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-[#111116] border border-crimson-800/60 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden my-auto">
            <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#15151e]">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-crimson-950 border border-crimson-600 flex items-center justify-center text-crimson-400">
                  <UserPlus className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">Add New Member & Portal Access</h3>
                  <p className="text-xs text-gray-400">Creates login credentials & provisions package access immediately</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                aria-label="Close modal"
                className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/[0.06] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newMemberForm.name}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, name: e.target.value })}
                    placeholder="e.g. Kasun Perera"
                    className="w-full px-3.5 py-2.5 bg-[#161620] border border-white/10 rounded-xl text-xs text-white focus:border-crimson-500 focus:outline-none min-h-[42px]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newMemberForm.email}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
                    placeholder="kasun@example.com"
                    className="w-full px-3.5 py-2.5 bg-[#161620] border border-white/10 rounded-xl text-xs text-white focus:border-crimson-500 focus:outline-none min-h-[42px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Login Password * (min 6)</label>
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={newMemberForm.password}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, password: e.target.value })}
                    placeholder="MemberPassword123!"
                    className="w-full px-3.5 py-2.5 bg-[#161620] border border-white/10 rounded-xl text-xs text-white focus:border-crimson-500 focus:outline-none min-h-[42px]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Phone / WhatsApp</label>
                  <input
                    type="tel"
                    value={newMemberForm.phone}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, phone: e.target.value })}
                    placeholder="+94 77 123 4567"
                    className="w-full px-3.5 py-2.5 bg-[#161620] border border-white/10 rounded-xl text-xs text-white focus:border-crimson-500 focus:outline-none min-h-[42px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Account Role</label>
                  <select
                    value={newMemberForm.role}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, role: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-[#161620] border border-white/10 rounded-xl text-xs text-white focus:border-crimson-500 focus:outline-none min-h-[42px]"
                  >
                    <option value="client">Athlete / Client</option>
                    <option value="instructor">Coach / Instructor</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Initial Portal Status</label>
                  <select
                    value={newMemberForm.status}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-[#161620] border border-white/10 rounded-xl text-xs text-white focus:border-crimson-500 focus:outline-none min-h-[42px]"
                  >
                    <option value="active">Active (Immediate Portal Access)</option>
                    <option value="pending">Pending (Must Buy Package First)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Assigned Package</label>
                  <select
                    value={newMemberForm.tier}
                    onChange={(e) => {
                      const t = e.target.value;
                      const autoDays =
                        t === 'sole_1y' || t === 'couple_1y'
                          ? 365
                          : t === 'sole_6m' || t === 'couple_6m'
                          ? 180
                          : t === 'sole_3m' || t === 'couple_3m' || t === 'coaching_90'
                          ? 90
                          : 30;
                      setNewMemberForm({ ...newMemberForm, tier: t, durationDays: autoDays });
                    }}
                    className="w-full px-3.5 py-2.5 bg-[#161620] border border-white/10 rounded-xl text-xs text-white focus:border-crimson-500 focus:outline-none min-h-[42px]"
                  >
                    <option value="sole_1m">Sole - 1 Month (30d)</option>
                    <option value="sole_3m">Sole - 3 Months (90d)</option>
                    <option value="sole_6m">Sole - 6 Months (180d)</option>
                    <option value="sole_1y">Sole - 1 Year (365d)</option>
                    <option value="couple_1m">Couple - 1 Month (30d)</option>
                    <option value="couple_3m">Couple - 3 Months (90d)</option>
                    <option value="couple_6m">Couple - 6 Months (180d)</option>
                    <option value="couple_1y">Couple - 1 Year (365d)</option>
                    <option value="coaching_90">90 Days Better Me VIP (90d)</option>
                    <option value="burnzone">MuscleCraft BurnZone (30d)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Access Duration (Days)</label>
                  <input
                    type="number"
                    min={1}
                    max={1095}
                    value={newMemberForm.durationDays}
                    onChange={(e) =>
                      setNewMemberForm({ ...newMemberForm, durationDays: Number(e.target.value) || 30 })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#161620] border border-white/10 rounded-xl text-xs text-white font-mono focus:border-crimson-500 focus:outline-none min-h-[42px]"
                  />
                </div>
              </div>

              {newMemberForm.role === 'client' && newMemberForm.status === 'active' && (
                <div className="p-4 rounded-2xl bg-emerald-950/25 border border-emerald-500/30 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newMemberForm.recordPayment}
                        onChange={(e) =>
                          setNewMemberForm({ ...newMemberForm, recordPayment: e.target.checked })
                        }
                        className="mt-0.5 rounded border-emerald-500/60 bg-[#111116] text-emerald-500 focus:ring-emerald-500"
                      />
                      <span>
                        <span className="text-xs font-bold text-emerald-300 block">
                          Auto-Record Package Fee to Revenue &amp; Profits (No Receipt Needed)
                        </span>
                        <span className="text-[11px] text-gray-400 block mt-0.5">
                          Automatically logs an approved payment into Dashboard MTD Sales, Admission Pool &amp; Executive Reports.
                        </span>
                      </span>
                    </label>
                  </div>

                  {newMemberForm.recordPayment && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                          Payment Method
                        </label>
                        <select
                          value={newMemberForm.paymentMethod}
                          onChange={(e) =>
                            setNewMemberForm({ ...newMemberForm, paymentMethod: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-[#121218] border border-white/10 rounded-xl text-xs text-white focus:border-emerald-500 focus:outline-none min-h-[38px]"
                        >
                          <option value="Cash / In-Person (Admin Enrolled)">Cash / In-Person</option>
                          <option value="Direct Bank Transfer (Admin Verified)">Direct Bank Transfer</option>
                          <option value="Card / POS Payment">Card / POS Payment</option>
                          <option value="Complimentary / Free">Complimentary / Free (Rs. 0)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                          Amount Override LKR <span className="text-gray-500 font-normal">(optional)</span>
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={newMemberForm.customAmount}
                          onChange={(e) =>
                            setNewMemberForm({ ...newMemberForm, customAmount: e.target.value })
                          }
                          placeholder="Auto: Package + Admission"
                          className="w-full px-3 py-2 bg-[#121218] border border-white/10 rounded-xl text-xs text-white font-mono focus:border-emerald-500 focus:outline-none min-h-[38px]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:text-white text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingMember}
                  className="px-6 py-2.5 bg-crimson-600 hover:bg-crimson-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-crimson-glow flex items-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isCreatingMember ? 'Creating Account...' : 'Create Member & Grant Access'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Details Modal */}
      {editingMember && (
        <EditMemberModal
          member={editingMember}
          coaches={staffCoaches}
          currentUserId={currentUser?.id}
          onClose={() => setEditingMember(null)}
          onSave={handleEditMember}
        />
      )}
    </div>
  );
}
