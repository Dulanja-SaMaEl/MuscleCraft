'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileBarChart2,
  Download,
  Printer,
  RefreshCw,
  DollarSign,
  Users,
  Clock,
  ShieldAlert,
  TrendingUp,
  CheckCircle2,
  CreditCard,
  Target,
  Calendar,
} from 'lucide-react';

interface ReportsTabProps {
  adminId?: string;
}

type ReportSection = 'revenue' | 'members' | 'cohort90' | 'crm';

function toCsvCell(val: any): string {
  const s = String(val ?? '').replace(/"/g, '""');
  return `"${s}"`;
}

function downloadCsv(filename: string, headers: string[], rows: any[][]) {
  const lines = [headers.map(toCsvCell).join(','), ...rows.map((r) => r.map(toCsvCell).join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsTab({ adminId = '' }: ReportsTabProps) {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeReport, setActiveReport] = useState<ReportSection>('revenue');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('all');

  const loadReports = useCallback(async () => {
    if (!adminId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/reports?adminId=${encodeURIComponent(adminId)}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load reports.');
      }
      setReportData(data);
    } catch (err: any) {
      setError(err?.message || 'Unable to load reports.');
    } finally {
      setLoading(false);
    }
  }, [adminId]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const filterByRange = (isoDate?: string | null) => {
    if (dateRange === 'all' || !isoDate) return true;
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const ts = new Date(isoDate).getTime();
    return Number.isNaN(ts) || ts >= cutoff;
  };

  if (loading && !reportData) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex flex-col sm:flex-row justify-between gap-4 bg-[#111116] border border-white/[0.08] p-6 rounded-2xl">
          <div className="space-y-2">
            <div className="h-6 w-64 bg-white/15 rounded-lg" />
            <div className="h-3.5 w-80 bg-white/5 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-28 bg-white/10 rounded-xl" />
            <div className="h-10 w-28 bg-white/10 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-[#111116] border border-white/[0.08] rounded-2xl p-5" />
          ))}
        </div>
        <div className="h-72 bg-[#111116] border border-white/[0.08] rounded-2xl" />
      </div>
    );
  }

  const summary = reportData?.summary || {};
  const payments = (reportData?.payments || []).filter((p: any) => filterByRange(p.created_at || p.transfer_date));
  const members = reportData?.members || [];
  const salesReviews = (reportData?.salesReviews || []).filter((s: any) => filterByRange(s.date));
  const packageBreakdown = reportData?.packageBreakdown || [];

  const filteredApprovedRevenue = payments
    .filter((p: any) => p.status === 'approved')
    .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

  const cohort90Members = members.filter(
    (m: any) =>
      m.tier === 'coaching_90' ||
      m.package_type === 'coaching' ||
      String(m.package_name || '').toLowerCase().includes('90')
  );

  const handleExportCurrentCsv = () => {
    const dateStamp = new Date().toISOString().split('T')[0];
    if (activeReport === 'revenue') {
      downloadCsv(
        `musclecraft-revenue-report-${dateStamp}.csv`,
        ['Reference', 'Sender', 'Package Tier', 'Bank', 'Amount (LKR)', 'Transfer Date', 'Status', 'Created At'],
        payments.map((p: any) => [
          p.reference_code,
          p.sender_account_name,
          p.tier,
          p.bank_name,
          p.amount,
          p.transfer_date,
          p.status,
          p.created_at,
        ])
      );
    } else if (activeReport === 'members' || activeReport === 'cohort90') {
      const list = activeReport === 'cohort90' ? cohort90Members : members;
      downloadCsv(
        `musclecraft-${activeReport === 'cohort90' ? '90day-cohort' : 'members'}-report-${dateStamp}.csv`,
        ['Name', 'Email', 'Phone', 'Package', 'Status', 'Joined At', 'Expires At'],
        list.map((m: any) => [
          m.name,
          m.email,
          m.phone || '',
          m.package_name || m.tier || 'None',
          m.status,
          m.joined_at,
          m.membership_expires_at || 'N/A',
        ])
      );
    } else {
      downloadCsv(
        `musclecraft-ad-crm-report-${dateStamp}.csv`,
        ['Date', 'Target Sales', 'Actual Sales', 'Ad Spend', 'Messages / Leads', 'Orders', 'Notes'],
        salesReviews.map((r: any) => [
          r.date,
          r.target ?? r.target_sales ?? 0,
          r.actual ?? r.actual_sales ?? 0,
          r.spend ?? 0,
          r.message_count ?? r.msg_count ?? 0,
          r.order_count ?? 0,
          r.notes || '',
        ])
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-[#111116] border border-white/[0.08] p-5 sm:p-6 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-crimson-950/80 border border-crimson-600/40 text-crimson-400">
              <FileBarChart2 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                MuscleCraft Executive Reports & Exports
              </h2>
              <p className="text-xs text-gray-400">
                Live revenue reconciliation, membership & 90-day cohort expirations, and ad CRM reports ({reportData?.source === 'supabase' ? 'Supabase DB Live' : 'Local Cache'}).
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          <div className="flex items-center gap-1 bg-[#181822] p-1 rounded-xl border border-white/10 text-xs">
            {(['7d', '30d', '90d', 'all'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setDateRange(r)}
                className={`px-3 py-1.5 rounded-lg font-semibold uppercase text-[11px] transition-colors cursor-pointer ${
                  dateRange === r ? 'bg-crimson-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {r === 'all' ? 'All Time' : r}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={loadReports}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-gray-200 flex items-center gap-1.5 min-h-[40px] cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCurrentCsv}
            className="px-4 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-300 text-xs font-bold flex items-center gap-1.5 min-h-[40px] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-crimson-600 hover:bg-crimson-500 text-white text-xs font-bold flex items-center gap-1.5 min-h-[40px] cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-700 text-rose-200 text-xs">
          {error}
        </div>
      )}

      {/* Executive Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111116] border border-white/[0.08] p-5 rounded-2xl">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
            <span>Approved Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </span>
          <span className="text-2xl font-extrabold text-white font-mono mt-2 block">
            Rs. {filteredApprovedRevenue.toLocaleString()}
          </span>
          <span className="text-[11px] text-emerald-400 mt-1 block">
            {payments.filter((p: any) => p.status === 'approved').length} verified slips
          </span>
        </div>

        <div className="bg-[#111116] border border-white/[0.08] p-5 rounded-2xl">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
            <span>Active Members</span>
            <Users className="w-4 h-4 text-crimson-400" />
          </span>
          <span className="text-2xl font-extrabold text-white font-mono mt-2 block">
            {summary.activeClients ?? 0} / {summary.totalClients ?? 0}
          </span>
          <span className="text-[11px] text-gray-400 mt-1 block">
            {summary.pendingPurchaseClients ?? 0} pending package purchase
          </span>
        </div>

        <div className="bg-[#111116] border border-white/[0.08] p-5 rounded-2xl">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
            <span>Expired / Banned</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </span>
          <span className="text-2xl font-extrabold text-amber-400 font-mono mt-2 block">
            {(summary.expiredClients ?? 0) + (summary.suspendedClients ?? 0)}
          </span>
          <span className="text-[11px] text-gray-400 mt-1 block">
            {summary.expiredClients ?? 0} expired · {summary.suspendedClients ?? 0} banned
          </span>
        </div>

        <div className="bg-[#111116] border border-white/[0.08] p-5 rounded-2xl">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
            <span>Ad Spend / Leads</span>
            <Target className="w-4 h-4 text-sky-400" />
          </span>
          <span className="text-2xl font-extrabold text-white font-mono mt-2 block">
            Rs. {Number(summary.totalAdSpend || 0).toLocaleString()}
          </span>
          <span className="text-[11px] text-sky-300 mt-1 block">
            {summary.totalLeads ?? 0} leads (CPR Rs. {summary.avgCostPerLead ?? 0})
          </span>
        </div>
      </div>

      {/* Report Sub-navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-[#111116] border border-white/[0.08] p-2 rounded-2xl print:hidden">
        {[
          { id: 'revenue', label: 'Revenue & Bank Transfers Report', icon: CreditCard },
          { id: 'members', label: 'Membership Lifecycle Report', icon: Users },
          { id: 'cohort90', label: '90-Day Cohort Expirations Report', icon: Clock },
          { id: 'crm', label: 'Daily Sales & Ad CRM Report', icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeReport === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveReport(tab.id as ReportSection)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                active
                  ? 'bg-crimson-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. REVENUE & BANK TRANSFERS REPORT */}
      {activeReport === 'revenue' && (
        <div className="space-y-6">
          {/* Package Revenue Summary */}
          <div className="bg-[#111116] border border-white/[0.08] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Package Revenue Breakdown
              </h3>
              <span className="text-xs text-gray-400 font-mono">
                Pending Pool: Rs. {Number(summary.totalPendingRevenue || 0).toLocaleString()} LKR
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#16161f] text-gray-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Package Tier</th>
                    <th className="py-3 px-4">Active Members</th>
                    <th className="py-3 px-4">Approved Payments</th>
                    <th className="py-3 px-4 text-right">Approved Revenue (LKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {packageBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500">
                        No approved package transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    packageBreakdown.map((row: any) => (
                      <tr key={row.tier} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4 font-mono font-bold text-white uppercase">{row.tier}</td>
                        <td className="py-3 px-4 text-gray-300">{row.activeMembers}</td>
                        <td className="py-3 px-4 text-gray-300">{row.paymentsCount}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                          Rs. {Number(row.revenueLkr || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Full Transaction Ledger */}
          <div className="bg-[#111116] border border-white/[0.08] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Transfer Audit Report ({payments.length} Records)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#16161f] text-gray-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Sender</th>
                    <th className="py-3 px-4">Plan</th>
                    <th className="py-3 px-4">Bank</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        No payment records found in this date range.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p: any) => (
                      <tr key={p.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4 font-mono text-crimson-400 font-semibold">{p.reference_code}</td>
                        <td className="py-3 px-4 text-white font-medium">{p.sender_account_name}</td>
                        <td className="py-3 px-4 font-mono uppercase text-gray-300">{p.tier}</td>
                        <td className="py-3 px-4 text-gray-400 truncate max-w-[180px]">{p.bank_name}</td>
                        <td className="py-3 px-4 font-mono text-gray-400">{p.transfer_date}</td>
                        <td className="py-3 px-4 uppercase font-bold text-[10.5px]">
                          <span
                            className={`px-2 py-0.5 rounded-full border ${
                              p.status === 'approved'
                                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-600/40'
                                : p.status === 'pending'
                                ? 'bg-amber-950/70 text-amber-300 border-amber-600/40'
                                : 'bg-rose-950/70 text-rose-300 border-rose-600/40'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-white">
                          Rs. {Number(p.amount || 0).toLocaleString()}
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

      {/* 2 & 3. MEMBERSHIP LIFECYCLE / 90-DAY COHORT REPORT */}
      {(activeReport === 'members' || activeReport === 'cohort90') && (
        <div className="bg-[#111116] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {activeReport === 'cohort90'
                ? `90-Day Coaching Cohort & Auto-Deactivation Report (${cohort90Members.length})`
                : `Full Membership Access & Expiration Report (${members.length})`}
            </h3>
            <span className="text-xs text-gray-400">
              Expired plans automatically block client portal access until renewed
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#16161f] text-gray-400 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Athlete</th>
                  <th className="py-3 px-4">Email / Phone</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4">Expires</th>
                  <th className="py-3 px-4 text-right">Portal Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {(activeReport === 'cohort90' ? cohort90Members : members).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-500">
                      {activeReport === 'cohort90'
                        ? 'No athletes enrolled in the 90-Day Coaching cohort yet.'
                        : 'No client memberships registered yet.'}
                    </td>
                  </tr>
                ) : (
                (activeReport === 'cohort90' ? cohort90Members : members).map((m: any) => {
                  const expTime = m.membership_expires_at ? new Date(m.membership_expires_at).getTime() : null;
                  const daysRemaining = expTime ? Math.ceil((expTime - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                  const isExp = m.status === 'expired' || (expTime !== null && expTime <= Date.now());
                  return (
                    <tr key={m.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4 font-semibold text-white">{m.name}</td>
                      <td className="py-3 px-4 text-gray-400">
                        {m.email} {m.phone ? `· ${m.phone}` : ''}
                      </td>
                      <td className="py-3 px-4 text-gray-200">{m.package_name || m.tier || 'None'}</td>
                      <td className="py-3 px-4 font-mono text-gray-400">
                        {m.joined_at ? new Date(m.joined_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-300">
                        {m.membership_expires_at ? (
                          <span>
                            {new Date(m.membership_expires_at).toLocaleDateString()}{' '}
                            <span className="text-[10px] text-gray-500">
                              ({daysRemaining !== null && daysRemaining > 0 ? `${daysRemaining}d left` : 'ended'})
                            </span>
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase border ${
                            m.status === 'suspended'
                              ? 'bg-rose-950/70 text-rose-300 border-rose-600/50'
                              : isExp
                              ? 'bg-rose-950/60 text-rose-300 border-rose-700/40'
                              : m.status === 'pending'
                              ? 'bg-amber-950/70 text-amber-300 border-amber-600/40'
                              : 'bg-emerald-950/70 text-emerald-300 border-emerald-600/40'
                          }`}
                        >
                          {m.status === 'suspended'
                            ? 'Banned'
                            : isExp
                            ? 'Expired (Inactive)'
                            : m.status === 'pending'
                            ? 'Awaiting Package'
                            : 'Active'}
                        </span>
                      </td>
                    </tr>
                  );
                })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. DAILY AD SPEND & CRM REPORT */}
      {activeReport === 'crm' && (
        <div className="bg-[#111116] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Daily Meta Ads & Sales CRM Report ({salesReviews.length} Days)
            </h3>
            <span className="text-xs font-mono text-emerald-400">
              Total Actual Sales: Rs. {Number(summary.totalCrmSales || 0).toLocaleString()}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#16161f] text-gray-400 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Target (LKR)</th>
                  <th className="py-3 px-4 text-right">Actual (LKR)</th>
                  <th className="py-3 px-4 text-right">Ad Spend</th>
                  <th className="py-3 px-4 text-right">Leads</th>
                  <th className="py-3 px-4 text-right">Orders</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {salesReviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      No daily ad CRM records found in this date range.
                    </td>
                  </tr>
                ) : (
                  salesReviews.map((r: any, idx: number) => (
                    <tr key={r.id || idx} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4 font-mono text-white">{r.date}</td>
                      <td className="py-3 px-4 text-right font-mono text-gray-400">
                        {Number(r.target ?? r.target_sales ?? 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-400 font-bold">
                        {Number(r.actual ?? r.actual_sales ?? 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-amber-300">
                        {Number(r.spend || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-sky-300">
                        {r.message_count ?? r.msg_count ?? 0}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-white">{r.order_count || 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
