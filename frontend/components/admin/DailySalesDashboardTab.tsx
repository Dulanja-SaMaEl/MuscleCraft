'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  MessageSquare,
  Users,
  Target,
  Edit3,
  Plus,
  Download,
  Upload,
  RotateCcw,
  Check,
  X,
  Calendar,
  Sparkles,
  BarChart3,
  Percent,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Info,
} from 'lucide-react';
import { DailySalesRecord, CrmMarketingSummary } from '@/lib/types';

interface DailySalesDashboardTabProps {
  onNotify: (type: 'success' | 'error', text: string) => void;
  onAuditLog?: (action: string) => void;
}

export default function DailySalesDashboardTab({ onNotify, onAuditLog }: DailySalesDashboardTabProps) {
  const [records, setRecords] = useState<DailySalesRecord[]>([]);
  const [lifetimeSpend, setLifetimeSpend] = useState<number>(635555.2);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('11/2026');

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState<DailySalesRecord | null>(null);
  const [editFormData, setEditFormData] = useState<{
    date: string;
    target: number;
    actual: number;
    spend: number;
    messageCount: number;
    orderCount: number;
    notes: string;
  } | null>(null);

  // Settings Modal State (Lifetime ad spend)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [tempLifetimeSpend, setTempLifetimeSpend] = useState('635555.20');

  // Quick Log Today Modal State
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [quickDate, setQuickDate] = useState(() => {
    const d = new Date();
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  });
  const [quickSpend, setQuickSpend] = useState('');
  const [quickMessages, setQuickMessages] = useState('');
  const [quickOrders, setQuickOrders] = useState('');
  const [quickActual, setQuickActual] = useState('');

  // Load from API / Local Storage on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/daily-sales');
      if (res.ok) {
        const data = await res.json();
        if (data.records && Array.isArray(data.records) && data.records.length > 0) {
          setRecords(data.records);
        }
        if (typeof data.lifetimeSpend === 'number') {
          setLifetimeSpend(data.lifetimeSpend);
          setTempLifetimeSpend(data.lifetimeSpend.toString());
        }
      }
    } catch (err) {
      console.warn('Failed to load server daily sales, relying on local state:', err);
    } finally {
      setLoading(false);
    }
  };

  // Compute live cumulative sums and CRM metrics
  const summary: CrmMarketingSummary = useMemo(() => {
    const active = records.filter((r) => r.spend > 0 || r.messageCount > 0 || r.actual > 0 || r.orderCount > 0);
    const latest = active.length > 0 ? active[active.length - 1] : records[0] || {
      date: '11/1/2026',
      spend: 0,
      actual: 0,
      orderCount: 0,
      messageCount: 0,
    };

    const cumulativeSpend = records.reduce((sum, r) => sum + (Number(r.spend) || 0), 0);
    const cumulativeSales = records.reduce((sum, r) => sum + (Number(r.actual) || 0), 0);
    const cumulativeOrders = records.reduce((sum, r) => sum + (Number(r.orderCount) || 0), 0);
    const cumulativeMsgs = records.reduce((sum, r) => sum + (Number(r.messageCount) || 0), 0);
    const monthlyTarget = records.reduce((sum, r) => sum + (Number(r.target) || 0), 0);

    const dailySpend = Number(latest.spend) || 0;
    const dailySales = Number(latest.actual) || 0;
    const dailyOrders = Number(latest.orderCount) || 0;
    const dailyMsgs = Number(latest.messageCount) || 0;

    return {
      accountLifetimeSpend: lifetimeSpend,
      monthlyTargetSales: monthlyTarget,
      dailyDate: latest.date || '11/1/2026',
      dailySpend: dailySpend,
      dailySales: dailySales,
      dailyOrdersCount: dailyOrders,
      dailyAov: dailyOrders > 0 ? Number((dailySales / dailyOrders).toFixed(2)) : 0,
      dailyCpr: dailyMsgs > 0 ? Number((dailySpend / dailyMsgs).toFixed(2)) : 0,
      dailyRoas: dailySpend > 0 ? Number((dailySales / dailySpend).toFixed(2)) : 0,
      dailyMsgCount: dailyMsgs,
      dailyConversionRate: dailyMsgs > 0 ? Number(((dailyOrders / dailyMsgs) * 100).toFixed(2)) : 0,
      dailyCac: dailyOrders > 0 ? Number((dailySpend / dailyOrders).toFixed(2)) : 0,

      cumulativeSpend: Number(cumulativeSpend.toFixed(2)),
      cumulativeSales: Number(cumulativeSales.toFixed(2)),
      cumulativeOrdersCount: cumulativeOrders,
      cumulativeAov: cumulativeOrders > 0 ? Number((cumulativeSales / cumulativeOrders).toFixed(2)) : 0,
      cumulativeCpr: cumulativeMsgs > 0 ? Number((cumulativeSpend / cumulativeMsgs).toFixed(2)) : 0,
      cumulativeRoas: cumulativeSpend > 0 ? Number((cumulativeSales / cumulativeSpend).toFixed(2)) : 0,
      cumulativeMsgCount: cumulativeMsgs,
      cumulativeConversionRate: cumulativeMsgs > 0 ? Number(((cumulativeOrders / cumulativeMsgs) * 100).toFixed(2)) : 0,
      cumulativeCac: cumulativeOrders > 0 ? Number((cumulativeSpend / cumulativeOrders).toFixed(2)) : 0,
    };
  }, [records, lifetimeSpend]);

  const handleOpenEdit = (record: DailySalesRecord) => {
    setEditingRecord(record);
    setEditFormData({
      date: record.date,
      target: record.target || 0,
      actual: record.actual || 0,
      spend: record.spend || 0,
      messageCount: record.messageCount || 0,
      orderCount: record.orderCount || 0,
      notes: record.notes || '',
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;
    setLoading(true);

    try {
      const res = await fetch('/api/admin/daily-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          record: {
            id: editingRecord?.id,
            ...editFormData,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.records) setRecords(data.records);
        onNotify('success', `Daily review for ${editFormData.date} updated!`);
        if (onAuditLog) {
          onAuditLog(`Updated Daily Sales Review for ${editFormData.date}: Spend Rs. ${editFormData.spend}, Msgs: ${editFormData.messageCount}`);
        }
        setEditingRecord(null);
        setEditFormData(null);
      } else {
        const err = await res.json();
        onNotify('error', err.error || 'Failed to update record');
      }
    } catch (err: any) {
      onNotify('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        date: quickDate,
        spend: parseFloat(quickSpend) || 0,
        messageCount: parseInt(quickMessages) || 0,
        orderCount: parseInt(quickOrders) || 0,
        actual: parseFloat(quickActual) || 0,
        target: 0,
      };

      const res = await fetch('/api/admin/daily-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record: payload }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.records) setRecords(data.records);
        onNotify('success', `Logged Ad Spend & Lead stats for ${quickDate}!`);
        setQuickLogOpen(false);
        setQuickSpend('');
        setQuickMessages('');
        setQuickOrders('');
        setQuickActual('');
      } else {
        onNotify('error', 'Failed to log today');
      }
    } catch (err: any) {
      onNotify('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const num = parseFloat(tempLifetimeSpend) || 0;

    try {
      const res = await fetch('/api/admin/daily-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_settings',
          lifetimeSpend: num,
        }),
      });

      if (res.ok) {
        setLifetimeSpend(num);
        onNotify('success', `Ad Account Lifetime Spend calibrated to Rs. ${num.toLocaleString()} LKR`);
        setSettingsModalOpen(false);
      }
    } catch (err: any) {
      onNotify('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Target (LKR)', 'Actual (LKR)', 'DIFF (LKR)', 'Spend (LKR)', 'Message Count', 'Order Count', 'ROAS', 'CPR (LKR)', 'Notes'];
    const rows = records.map((r) => [
      r.date,
      r.target || 0,
      r.actual || 0,
      (r.actual || 0) - (r.target || 0),
      r.spend || 0,
      r.messageCount || 0,
      r.orderCount || 0,
      r.roas || 0,
      r.cpr || 0,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);

    // Append cumulative
    rows.push([
      'Cumulative',
      summary.monthlyTargetSales,
      summary.cumulativeSales,
      summary.cumulativeSales - summary.monthlyTargetSales,
      summary.cumulativeSpend,
      summary.cumulativeMsgCount,
      summary.cumulativeOrdersCount,
      summary.cumulativeRoas,
      summary.cumulativeCpr,
      'Monthly Summary Total',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MuscleCraft_Daily_Dashboard_${selectedMonth.replace('/', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify('success', 'Daily Sales Review CSV exported successfully!');
  };

  const maxSpend = useMemo(() => {
    const vals = records.map((r) => Number(r.spend) || 0);
    return Math.max(...vals, 2000);
  }, [records]);

  const maxSales = useMemo(() => {
    const vals = records.map((r) => Math.max(Number(r.actual) || 0, Number(r.target) || 0));
    return Math.max(...vals, 1000);
  }, [records]);

  return (
    <div className="space-y-6">
      {/* ── CLIENT SPREADSHEET EXACT HEADER (EYES-FRIENDLY LUXURY MINIMAL BANNER) ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#171115] via-[#121218] to-[#0f0f14] border border-crimson-600/30 text-white px-6 py-5 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-crimson-900/10 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-crimson-950/80 border border-crimson-500/40 flex items-center justify-center text-crimson-400 shadow-[0_0_15px_rgba(225,29,72,0.25)]">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight uppercase text-white">
                  Musclecraft Daily Dashboard
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-crimson-950/80 border border-crimson-500/30 text-[10px] font-mono font-bold text-crimson-300">
                  META CRM LIVE
                </span>
              </div>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                Meta Ads Spend · WhatsApp & Lead Messages · Daily Sales Targets · CPR & ROAS Review
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setQuickLogOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-crimson-600 to-rose-600 hover:from-crimson-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_20px_rgba(225,29,72,0.35)] transition-all cursor-pointer min-h-[40px]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Quick Log Today</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-gray-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-all cursor-pointer min-h-[40px]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setSettingsModalOpen(true)}
            className="px-3.5 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-gray-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-all cursor-pointer min-h-[40px]"
            title="Configure Ad Account Total Lifetime Spend"
          >
            <span>Ad Account Spend</span>
          </button>
        </div>
      </div>

      {/* ── TOP THREE-COLUMN DASHBOARD LAYOUT (CRM CARD | SPREADSHEET TABLE | CHARTS) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* ── 1. CRM SUMMARY BLOCK (3 COLS) ── */}
        <div className="xl:col-span-3 space-y-4">
          <div className="bg-[#111116] border border-white/[0.08] rounded-3xl p-5 shadow-xl space-y-4">
            {/* Header: Date + Brand Name */}
            <div className="bg-[#14141c] p-3.5 rounded-2xl border border-white/[0.08] flex items-center justify-between text-white shadow-sm">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">CRM Review</span>
                <span className="text-sm font-extrabold font-mono text-white">{summary.dailyDate}</span>
              </div>
              <span className="text-xs font-mono font-bold tracking-wider uppercase bg-white/[0.06] px-2.5 py-1 rounded-lg border border-white/[0.08] text-zinc-200">
                MuscleCraft
              </span>
            </div>

            {/* Metrics Matrix: CRM | Daily | Cumulative */}
            <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-[#0c0c11]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#161622] text-zinc-400 font-bold border-b border-white/[0.08] text-[10.5px]">
                    <th className="py-2.5 px-3 text-left whitespace-nowrap">CRM Metric</th>
                    <th className="py-2.5 px-2 text-right whitespace-nowrap">Daily</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap bg-white/[0.02]">Total MTD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-gray-300 font-mono text-[11.5px]">
                  {/* Total Spend */}
                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-3 font-sans font-semibold text-gray-200">Total Spend</td>
                    <td className="py-2.5 px-3 text-right text-amber-300 font-bold whitespace-nowrap">
                      {summary.dailySpend > 0 ? summary.dailySpend.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-amber-300 font-bold bg-white/[0.02] whitespace-nowrap">
                      {summary.cumulativeSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>

                  {/* Total Sales */}
                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-3 font-sans font-semibold text-gray-200">Total Sales</td>
                    <td className="py-2.5 px-3 text-right text-emerald-400 font-bold whitespace-nowrap">
                      {summary.dailySales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-400 font-bold bg-white/[0.02] whitespace-nowrap">
                      {summary.cumulativeSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>

                  {/* Orders Count */}
                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-3 font-sans font-semibold text-gray-200">Orders Count</td>
                    <td className="py-2.5 px-3 text-right text-white font-bold">{summary.dailyOrdersCount}</td>
                    <td className="py-2.5 px-3 text-right text-white font-bold bg-white/[0.02]">{summary.cumulativeOrdersCount}</td>
                  </tr>

                  {/* AOV */}
                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-3 font-sans font-semibold text-gray-200">AOV</td>
                    <td className="py-2.5 px-3 text-right text-gray-500">
                      {summary.dailyAov > 0 ? `Rs. ${summary.dailyAov.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-500 bg-white/[0.02]">
                      {summary.cumulativeAov > 0 ? `Rs. ${summary.cumulativeAov.toLocaleString()}` : '—'}
                    </td>
                  </tr>

                  {/* CPR (Cost Per Result) */}
                  <tr className="hover:bg-white/[0.02] bg-crimson-950/20">
                    <td className="py-2.5 px-3 font-sans font-bold text-crimson-300 flex items-center gap-1">
                      CPR (Cost/Msg)
                    </td>
                    <td className="py-2.5 px-3 text-right text-crimson-300 font-bold font-mono whitespace-nowrap">
                      {summary.dailyCpr > 0 ? summary.dailyCpr.toFixed(2) : '0.00'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-crimson-300 font-bold font-mono bg-white/[0.02] whitespace-nowrap">
                      {summary.cumulativeCpr.toFixed(2)}
                    </td>
                  </tr>

                  {/* ROAS */}
                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-3 font-sans font-semibold text-gray-200">ROAS</td>
                    <td className="py-2.5 px-3 text-right text-white">{summary.dailyRoas.toFixed(1)}</td>
                    <td className="py-2.5 px-3 text-right text-white bg-white/[0.02]">{summary.cumulativeRoas.toFixed(1)}</td>
                  </tr>

                  {/* Msg Count */}
                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-3 font-sans font-semibold text-gray-200">Msg count</td>
                    <td className="py-2.5 px-3 text-right text-zinc-200 font-bold">{summary.dailyMsgCount}</td>
                    <td className="py-2.5 px-3 text-right text-zinc-200 font-bold bg-white/[0.02]">{summary.cumulativeMsgCount}</td>
                  </tr>

                  {/* Conversion Rate */}
                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-3 font-sans font-semibold text-gray-200">Conversion Rate</td>
                    <td className="py-2.5 px-3 text-right text-gray-300">{summary.dailyConversionRate.toFixed(2)}%</td>
                    <td className="py-2.5 px-3 text-right text-gray-300 bg-white/[0.02]">{summary.cumulativeConversionRate.toFixed(2)}%</td>
                  </tr>

                  {/* CAC */}
                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-3 font-sans font-semibold text-gray-200">CAC</td>
                    <td className="py-2.5 px-3 text-right text-gray-500">
                      {summary.dailyCac > 0 ? `Rs. ${summary.dailyCac.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-500 bg-white/[0.02]">
                      {summary.cumulativeCac > 0 ? `Rs. ${summary.cumulativeCac.toLocaleString()}` : '—'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl text-[11px] text-gray-400 flex items-start gap-2">
              <Info className="w-4 h-4 text-crimson-400 flex-shrink-0 mt-0.5" />
              <span>
                Lifetime Ad Account Spend calibrated to <strong>Rs. {summary.accountLifetimeSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> LKR.
              </span>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-[#111116] border border-white/[0.08] shadow-sm">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Nov Total Spend</span>
              <span className="text-lg font-mono font-extrabold text-amber-300 mt-1 block">
                Rs. {summary.cumulativeSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-[#111116] border border-white/[0.08] shadow-sm">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Total Leads</span>
              <span className="text-lg font-mono font-extrabold text-zinc-200 mt-1 block">
                {summary.cumulativeMsgCount} Inquiries
              </span>
            </div>
          </div>
        </div>

        {/* ── 2. DAILY SALES REVIEW TABLE (6 COLS) ── */}
        <div className="xl:col-span-6 space-y-4">
          <div className="bg-[#111116] border border-white/[0.08] rounded-3xl shadow-xl overflow-hidden flex flex-col h-full">
            {/* Table Header Banner (Eyes-Friendly Dark Elevation) */}
            <div className="bg-gradient-to-r from-[#1c1218] via-[#14121a] to-[#111116] px-5 py-3.5 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-crimson-950/80 border border-crimson-500/40 flex items-center justify-center text-crimson-400">
                  <Target className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                  Daily Sales Review ({selectedMonth})
                </h2>
              </div>
              <span className="text-[10px] font-mono bg-white/[0.06] border border-white/10 px-2.5 py-1 rounded-lg text-gray-300 font-semibold">
                {records.length} Days Monitored
              </span>
            </div>

            {/* Scrollable Spreadsheet Table */}
            <div className="overflow-x-auto flex-1 max-h-[640px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#14141d] text-gray-300 font-bold uppercase text-[10px] tracking-wider border-b border-white/[0.08] sticky top-0 z-10 shadow">
                  <tr>
                    <th className="py-3 px-2.5">Date</th>
                    <th className="py-3 px-2 text-right">Target</th>
                    <th className="py-3 px-2.5 text-right bg-emerald-950/40 text-emerald-300 border-x border-emerald-800/40">Actual</th>
                    <th className="py-3 px-2 text-right">DIFF</th>
                    <th className="py-3 px-2.5 text-right">Spend</th>
                    <th className="py-3 px-2 text-center">Msg count</th>
                    <th className="py-3 px-2 text-center">Order count</th>
                    <th className="py-3 px-2 text-right">ROAS</th>
                    <th className="py-3 px-2.5 text-right">CPR</th>
                    <th className="py-3 px-2 text-center">Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-[11px] font-mono">
                  {records.map((r) => {
                    const diff = (r.actual || 0) - (r.target || 0);
                    const cpr = r.messageCount > 0 ? (r.spend / r.messageCount).toFixed(2) : '0.00';
                    const roas = r.spend > 0 ? (r.actual / r.spend).toFixed(1) : '0.0';
                    const hasData = r.spend > 0 || r.messageCount > 0 || r.actual > 0;

                    return (
                      <tr
                        key={r.id || r.date}
                        className={`hover:bg-white/[0.03] transition-colors ${
                          hasData ? 'bg-white/[0.01]' : 'opacity-70'
                        }`}
                      >
                        {/* Date */}
                        <td className="py-2.5 px-2.5 whitespace-nowrap font-sans font-medium text-gray-300">
                          {r.date}
                        </td>

                        {/* Target */}
                        <td className="py-2.5 px-2 text-right text-gray-400">
                          {(r.target || 0).toFixed(2)}
                        </td>

                        {/* Actual (Highlighted in light green exactly like client sheet) */}
                        <td className="py-2.5 px-2.5 text-right font-bold text-emerald-300 bg-emerald-950/30 border-x border-emerald-900/30">
                          {(r.actual || 0).toFixed(2)}
                        </td>

                        {/* DIFF */}
                        <td className={`py-2.5 px-2 text-right ${diff >= 0 ? 'text-gray-400' : 'text-rose-400 font-bold'}`}>
                          {diff.toFixed(2)}
                        </td>

                        {/* Spend */}
                        <td className={`py-2.5 px-2.5 text-right font-bold ${r.spend > 0 ? 'text-amber-300' : 'text-gray-500'}`}>
                          {r.spend > 0 ? r.spend.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                        </td>

                        {/* Message count */}
                        <td className={`py-2.5 px-2 text-center font-bold ${r.messageCount > 0 ? 'text-zinc-200' : 'text-gray-500'}`}>
                          {r.messageCount || 0}
                        </td>

                        {/* Order count */}
                        <td className={`py-2.5 px-2 text-center ${r.orderCount > 0 ? 'text-white font-bold' : 'text-gray-500'}`}>
                          {r.orderCount || 0}
                        </td>

                        {/* ROAS */}
                        <td className="py-2.5 px-2 text-right text-gray-400">
                          {roas}
                        </td>

                        {/* CPR */}
                        <td className={`py-2.5 px-2.5 text-right font-bold ${Number(cpr) > 0 ? 'text-crimson-300' : 'text-gray-500'}`}>
                          {cpr}
                        </td>

                        {/* Action */}
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(r)}
                            className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                            title={`Edit ${r.date}`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* ── CUMULATIVE SUMMARY FOOTER ROW ── */}
                <tfoot className="sticky bottom-0 z-10 bg-[#161622] text-white font-mono font-bold text-xs border-t border-white/20 shadow-2xl backdrop-blur-md">
                  <tr>
                    <td className="py-3 px-2.5 uppercase font-sans tracking-wider text-zinc-300 font-extrabold">Cumulative</td>
                    <td className="py-3 px-2 text-right text-zinc-400 font-bold">{summary.monthlyTargetSales.toFixed(2)}</td>
                    <td className="py-3 px-2.5 text-right border-x border-white/10 text-emerald-400 font-black bg-emerald-950/20">
                      {summary.cumulativeSales.toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-right text-zinc-300 font-bold">
                      {(summary.cumulativeSales - summary.monthlyTargetSales).toFixed(2)}
                    </td>
                    <td className="py-3 px-2.5 text-right text-amber-300 font-black">
                      {summary.cumulativeSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-2 text-center text-white font-black">{summary.cumulativeMsgCount}</td>
                    <td className="py-3 px-2 text-center text-white font-black">{summary.cumulativeOrdersCount}</td>
                    <td className="py-3 px-2 text-right text-zinc-200">{summary.cumulativeRoas.toFixed(1)}</td>
                    <td className="py-3 px-2.5 text-right text-crimson-400 font-black">
                      {summary.cumulativeCpr.toFixed(0)}
                    </td>
                    <td className="py-3 px-2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* ── 3. VISUAL CHARTS (MTD SALES & MTD SPEND) (3 COLS) ── */}
        <div className="xl:col-span-3 space-y-6">
          {/* Chart 1: MTD SALES (Matching Spreadsheet top graph) */}
          <div className="bg-[#111116] border border-white/[0.08] rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-rose-400">
                MTD SALES
              </h3>
              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-0.5 bg-red-500 rounded" /> Target
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-0.5 bg-emerald-500 rounded" /> Actual
                </span>
              </div>
            </div>

            {/* Sales Chart SVG */}
            <div className="h-44 w-full relative flex items-end pt-4 pb-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 300 120">
                {/* Horizontal reference grid lines */}
                <line x1="0" y1="20" x2="300" y2="20" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="0" y1="60" x2="300" y2="60" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="0" y1="100" x2="300" y2="100" stroke="rgba(255,255,255,0.1)" />

                {/* Target baseline line (red) */}
                <line x1="0" y1="100" x2="300" y2="100" stroke="#ef4444" strokeWidth="2" />

                {/* Actual sales line or points */}
                {summary.cumulativeSales > 0 ? (
                  <path
                    d={records
                      .map((r, i) => {
                        const x = (i / Math.max(records.length - 1, 1)) * 300;
                        const y = 100 - ((r.actual || 0) / maxSales) * 80;
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                  />
                ) : (
                  <line x1="0" y1="100" x2="300" y2="100" stroke="#10b981" strokeWidth="2" strokeDasharray="2 2" />
                )}
              </svg>
            </div>

            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
              <span>11/1/2026</span>
              <span>11/15/2026</span>
              <span>11/30/2026</span>
            </div>
            <div className="text-[11px] text-gray-400 text-center font-mono pt-1">
              MTD Actual Sales: <strong className="text-white">Rs. {summary.cumulativeSales.toLocaleString()} LKR</strong>
            </div>
          </div>

          {/* Chart 2: MTD SPEND (Matching Spreadsheet bottom graph with dropping curve) */}
          <div className="bg-[#111116] border border-white/[0.08] rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                MTD SPEND
              </h3>
              <span className="text-[10px] text-amber-300 font-mono font-bold">
                Rs. {summary.cumulativeSpend.toLocaleString()}
              </span>
            </div>

            {/* Ad Spend Curve SVG */}
            <div className="h-44 w-full relative flex items-end pt-4 pb-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 300 120">
                {/* Reference Grid lines */}
                <line x1="0" y1="20" x2="300" y2="20" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="0" y1="60" x2="300" y2="60" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="0" y1="100" x2="300" y2="100" stroke="rgba(255,255,255,0.1)" />

                {/* Spend Curve gradient area */}
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Path calculation for spend */}
                <path
                  d={
                    records
                      .map((r, i) => {
                        const x = (i / Math.max(records.length - 1, 1)) * 300;
                        const y = 100 - (Number(r.spend || 0) / maxSpend) * 85;
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                      })
                      .join(' ') + ' L 300 100 L 0 100 Z'
                  }
                  fill="url(#spendGrad)"
                />

                <path
                  d={records
                    .map((r, i) => {
                      const x = (i / Math.max(records.length - 1, 1)) * 300;
                      const y = 100 - (Number(r.spend || 0) / maxSpend) * 85;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                />

                {/* Points on days with spend */}
                {records
                  .slice(0, 7)
                  .filter((r) => r.spend > 0)
                  .map((r, i) => {
                    const x = (i / Math.max(records.length - 1, 1)) * 300;
                    const y = 100 - (Number(r.spend || 0) / maxSpend) * 85;
                    return <circle key={r.id || i} cx={x} cy={y} r="3" fill="#60a5fa" stroke="#111116" strokeWidth="1" />;
                  })}
              </svg>
            </div>

            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
              <span>11/1/2026</span>
              <span>11/15/2026</span>
              <span>11/30/2026</span>
            </div>

            <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-500/20 text-[11px] text-blue-200 text-center font-mono">
              Current CPR: <strong>Rs. {summary.cumulativeCpr.toFixed(2)}</strong> / lead
            </div>
          </div>
        </div>
      </div>

      {/* ── EDIT DAY MODAL ── */}
      {editingRecord && editFormData && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingRecord(null);
          }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="bg-[#111116] border border-crimson-800/60 rounded-3xl max-w-lg w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-crimson-950 border border-crimson-600 flex items-center justify-center text-crimson-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Edit Day: {editFormData.date}</h3>
                  <p className="text-xs text-gray-400">Update ad spend, leads, and sales figures</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="text-gray-400 hover:text-white p-2 rounded-xl bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Ad Spend (LKR):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.spend}
                    onChange={(e) => setEditFormData({ ...editFormData, spend: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#161622] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Message / Lead Count:</label>
                  <input
                    type="number"
                    value={editFormData.messageCount}
                    onChange={(e) => setEditFormData({ ...editFormData, messageCount: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#161622] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Actual Sales (LKR):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.actual}
                    onChange={(e) => setEditFormData({ ...editFormData, actual: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#161622] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Order / Member Count:</label>
                  <input
                    type="number"
                    value={editFormData.orderCount}
                    onChange={(e) => setEditFormData({ ...editFormData, orderCount: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#161622] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Revenue Target (LKR):</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.target}
                  onChange={(e) => setEditFormData({ ...editFormData, target: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#161622] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Notes / Campaign Tag:</label>
                <input
                  type="text"
                  placeholder="e.g. Meta Ads CrossFit Promo set #2"
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="w-full bg-[#161622] border border-white/10 rounded-xl px-3 py-2 text-white"
                />
              </div>

              {/* Calculated Preview */}
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div>
                  <span className="text-gray-400">Calculated CPR:</span>{' '}
                  <strong className="text-crimson-400">
                    Rs. {editFormData.messageCount > 0 ? (editFormData.spend / editFormData.messageCount).toFixed(2) : '0.00'}
                  </strong>
                </div>
                <div>
                  <span className="text-gray-400">Calculated ROAS:</span>{' '}
                  <strong className="text-white">
                    {editFormData.spend > 0 ? (editFormData.actual / editFormData.spend).toFixed(1) : '0.0'}x
                  </strong>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-crimson-600 hover:bg-crimson-500 text-white rounded-xl font-bold cursor-pointer"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── QUICK LOG TODAY MODAL ── */}
      {quickLogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setQuickLogOpen(false);
          }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="bg-[#111116] border border-crimson-800/60 rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-crimson-950 border border-crimson-600 flex items-center justify-center text-crimson-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Quick Log Daily Marketing</h3>
                  <p className="text-xs text-gray-400">Enter today's ad spend and message count</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickLogOpen(false)}
                className="text-gray-400 hover:text-white p-2 rounded-xl bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickLog} className="space-y-4 text-xs">
              <div>
                <label className="text-gray-300 font-semibold block mb-1">Date:</label>
                <input
                  type="text"
                  value={quickDate}
                  onChange={(e) => setQuickDate(e.target.value)}
                  placeholder="e.g. 11/7/2026"
                  className="w-full bg-[#161622] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Ad Spend (LKR):</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 750.00"
                    value={quickSpend}
                    onChange={(e) => setQuickSpend(e.target.value)}
                    className="w-full bg-[#161622] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Messages / Inquiries:</label>
                  <input
                    type="number"
                    placeholder="e.g. 25"
                    value={quickMessages}
                    onChange={(e) => setQuickMessages(e.target.value)}
                    className="w-full bg-[#161622] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">New Orders (Optional):</label>
                  <input
                    type="number"
                    placeholder="e.g. 1"
                    value={quickOrders}
                    onChange={(e) => setQuickOrders(e.target.value)}
                    className="w-full bg-[#161622] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Actual Sales (LKR):</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 8000.00"
                    value={quickActual}
                    onChange={(e) => setQuickActual(e.target.value)}
                    className="w-full bg-[#161622] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickLogOpen(false)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-crimson-600 hover:bg-crimson-500 text-white rounded-xl font-bold cursor-pointer"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SETTINGS MODAL: AD ACCOUNT TOTAL SPEND ── */}
      {settingsModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSettingsModalOpen(false);
          }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="bg-[#111116] border border-white/[0.1] rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-base font-bold text-white">Ad Account Lifetime Spend</h3>
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                className="text-gray-400 hover:text-white p-2 rounded-xl bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <p className="text-gray-400">
                This corresponds to the Meta / Google Ads cumulative lifetime spend displayed in the top-left CRM card of your Daily Dashboard (e.g. 635,555.20 LKR).
              </p>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Lifetime Ad Spend (LKR):</label>
                <input
                  type="number"
                  step="0.01"
                  value={tempLifetimeSpend}
                  onChange={(e) => setTempLifetimeSpend(e.target.value)}
                  className="w-full bg-[#161622] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSettingsModalOpen(false)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-crimson-600 hover:bg-crimson-500 text-white rounded-xl font-bold cursor-pointer"
                >
                  Update Lifetime Spend
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
