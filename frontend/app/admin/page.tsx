'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/context/auth-context';
import {
  Shield,
  CreditCard,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  UserCheck,
  UserX,
  History,
  TrendingUp,
} from 'lucide-react';
import { User, PaymentRecord, AuditLog } from '@/lib/types';

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'payments' | 'members' | 'audit'>('payments');

  // Data states
  const [stats, setStats] = useState<any>({
    totalMembers: 4,
    activeMembers: 3,
    pendingTransfers: 1,
    totalRevenue: 950.0,
  });
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Filter & Search states
  const [memberSearch, setMemberSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

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
        body: JSON.stringify({ adminNotes: 'Verified via institutional wire ledger.' }),
      });

      if (res.ok) {
        setActionMessage({
          type: 'success',
          text: `Payment ${paymentId} approved! Membership successfully activated.`,
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
    const reason = prompt('Please enter rejection reason (e.g. Unverified wire reference, incorrect amount):');
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
          text: `Payment ${paymentId} rejected and member notified.`,
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

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const filteredPayments = payments.filter((p) => {
    if (paymentFilter === 'all') return true;
    return p.status === paymentFilter;
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#080809]">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 sm:pt-36 lg:pt-40 pb-12 sm:pb-16 w-full">
        {/* Admin Header */}
        <div className="bg-[#121215] border border-red-900/40 p-6 sm:p-8 rounded-lg mb-8 shadow-card-dark flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-red-950 border-2 border-red-600 flex items-center justify-center text-red-400">
              <Shield className="w-8 h-8" />
            </div>
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
                  MuscleCraft Command Center
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider bg-red-900/40 text-red-300 border-red-700/60">
                  Platform Admin
                </span>
                <span className="text-[10px] bg-green-950/80 text-green-400 border border-green-700/60 px-2 py-0.5 rounded font-bold uppercase">
                  Root Authority
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Admin: <strong className="text-white">{currentUser?.name || 'Victor Thorne'}</strong> • Manual Bank Transfer Approvals, Member Access & Telemetry.
              </p>
            </div>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {actionMessage && (
          <div
            className={`p-4 rounded-lg mb-6 flex items-center justify-between text-xs font-semibold ${
              actionMessage.type === 'success'
                ? 'bg-green-950/80 border border-green-700 text-green-200'
                : 'bg-red-950/80 border border-red-700 text-red-200'
            }`}
          >
            <span>{actionMessage.text}</span>
            <button onClick={() => setActionMessage(null)} className="text-gray-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* KPI Telemetry Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#121215] border border-white/[0.08] p-5 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Total Members
              </span>
              <Users className="w-4 h-4 text-gray-400" />
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1 block">
              {stats.totalMembers}
            </span>
            <span className="text-[11px] text-green-400 mt-1 block">
              {stats.activeMembers} active subscriptions
            </span>
          </div>

          <div className="bg-[#121215] border border-amber-600/30 p-5 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
                Pending Transfers
              </span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono mt-1 block">
              {stats.pendingTransfers}
            </span>
            <span className="text-[11px] text-amber-300 mt-1 block">
              Requires administrative review
            </span>
          </div>

          <div className="bg-[#121215] border border-white/[0.08] p-5 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Verified Revenue
              </span>
              <DollarSign className="w-4 h-4 text-gold" />
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1 block">
              ${stats.totalRevenue.toFixed(2)}
            </span>
            <span className="text-[11px] text-gold mt-1 block">
              Direct institutional wire
            </span>
          </div>

          <div className="bg-[#121215] border border-white/[0.08] p-5 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                90-Day VIP Athletes
              </span>
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1 block">
              {stats.coaching90Members || 2}
            </span>
            <span className="text-[11px] text-blue-300 mt-1 block">
              Full coaching cohort active
            </span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-white/[0.08] mb-8 overflow-x-auto">
          {[
            { id: 'payments', label: `Bank Transfer Verification Queue (${payments.filter(p => p.status === 'pending').length} Pending)` },
            { id: 'members', label: `Member Directory (${members.length})` },
            { id: 'audit', label: `Security & Activity Logs (${auditLogs.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-5 text-xs sm:text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-red-500 text-red-400 bg-red-500/[0.04]'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: BANK TRANSFER VERIFICATION QUEUE */}
        {activeTab === 'payments' && (
          <div className="bg-[#121215] border border-white/[0.08] p-6 rounded-lg space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  Manual Bank Transfer Review & Activation Queue
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Verify wire references against bank ledgers. Approving immediately activates membership credentials.
                </p>
              </div>

              {/* Filter */}
              <div className="flex items-center gap-1 text-xs">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setPaymentFilter(f)}
                    className={`px-3 py-1 rounded uppercase font-bold text-[10px] transition-colors ${
                      paymentFilter === f
                        ? 'bg-red-600 text-white'
                        : 'bg-[#18181d] text-gray-400 hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#18181d] text-gray-400 uppercase tracking-wider border-b border-white/[0.06]">
                  <tr>
                    <th className="py-3 px-4">Transfer Reference</th>
                    <th className="py-3 px-4">Member Name</th>
                    <th className="py-3 px-4">Tier</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Bank & Sender</th>
                    <th className="py-3 px-4">Transfer Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02]">
                      <td className="py-3.5 px-4 font-mono font-bold text-gold">{p.referenceCode}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{p.userName}</div>
                        <div className="text-[10px] text-gray-400">{p.userEmail}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold uppercase text-white">
                        {p.tier.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white font-mono text-sm">
                        ${p.amount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-gray-300">
                        <div>{p.bankName}</div>
                        <div className="text-[10px] text-gray-400">Acc: {p.senderAccountName}</div>
                        {p.receiptNotes && (
                          <div className="text-[10px] text-gray-500 italic mt-0.5 line-clamp-1">
                            "{p.receiptNotes}"
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-300">{p.transferDate}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            p.status === 'approved'
                              ? 'bg-green-950 text-green-400 border border-green-700/60'
                              : p.status === 'pending'
                              ? 'bg-amber-950 text-amber-400 border border-amber-700/60 animate-pulse'
                              : 'bg-red-950 text-red-400 border border-red-700/60'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {p.status === 'pending' ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleApprovePayment(p.id)}
                              className="px-2.5 py-1 bg-green-600 hover:bg-green-500 text-white font-bold rounded text-[11px] flex items-center gap-1 transition-colors shadow-sm"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Approve
                            </button>
                            <button
                              onClick={() => handleRejectPayment(p.id)}
                              className="px-2.5 py-1 bg-red-950 hover:bg-red-900 text-red-300 border border-red-700 font-bold rounded text-[11px] flex items-center gap-1 transition-colors"
                            >
                              <XCircle className="w-3 h-3" /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-500">
                            {p.status === 'approved' ? '✓ Verified' : '✕ Rejected'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: MEMBER DIRECTORY */}
        {activeTab === 'members' && (
          <div className="bg-[#121215] border border-white/[0.08] p-6 rounded-lg space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  Club Member Directory & Role Control
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Manage memberships, suspension status, coach assignment, and access privileges.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search athlete by name or email..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full bg-[#18181d] border border-white/[0.1] focus:border-red-500 pl-9 pr-3 py-1.5 rounded text-xs text-white placeholder-gray-500 outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#18181d] text-gray-400 uppercase tracking-wider border-b border-white/[0.06]">
                  <tr>
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Tier</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Assigned Coach</th>
                    <th className="py-3 px-4">Expiry Date</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-white/[0.02]">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{m.name}</div>
                        <div className="text-[10px] text-gray-400">{m.email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold uppercase text-gray-300">
                        {m.role}
                      </td>
                      <td className="py-3.5 px-4 font-semibold uppercase text-gold">
                        {m.tier === 'coaching_90' ? '90-Day VIP' : m.tier === 'monthly' ? 'Monthly Gym' : 'None'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            m.status === 'active'
                              ? 'bg-green-950 text-green-400 border border-green-700/60'
                              : m.status === 'pending'
                              ? 'bg-amber-950 text-amber-400 border border-amber-700/60'
                              : 'bg-red-950 text-red-400 border border-red-700/60'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-300">
                        {m.assignedInstructorName || 'None'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-300">
                        {m.membershipExpiresAt
                          ? new Date(m.membershipExpiresAt).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleMemberStatus(m)}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                            m.status === 'active'
                              ? 'bg-red-950 text-red-300 border border-red-700 hover:bg-red-900'
                              : 'bg-green-900 text-green-200 border border-green-600 hover:bg-green-800'
                          }`}
                        >
                          {m.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SYSTEM AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="bg-[#121215] border border-white/[0.08] p-6 rounded-lg space-y-4">
            <div className="border-b border-white/[0.08] pb-4">
              <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-red-400" />
                Immutable System Security & Activity Logs
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Every administrative authorization, payment status change, and diet plan update is recorded.
              </p>
            </div>

            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-[#18181d] border border-white/[0.06] p-3 rounded text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gold uppercase text-[10px] bg-black/40 px-1.5 py-0.5 rounded border border-white/[0.08]">
                        {log.action}
                      </span>
                      <span className="text-gray-400">{log.actorEmail}</span>
                    </div>
                    <p className="text-gray-200 font-medium">{log.details}</p>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
