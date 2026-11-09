import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/mock-db';
import { DailySalesRecord, CrmMarketingSummary } from '@/lib/types';
import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabase/server';

function formatDisplayDate(rawDate: string): string {
  if (!rawDate) return '';
  if (rawDate.includes('/')) return rawDate;
  const parts = rawDate.split('-');
  if (parts.length === 3) {
    const y = parts[0];
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    return `${m}/${d}/${y}`;
  }
  return rawDate;
}

function formatDbDate(inputDate: string): string {
  if (!inputDate) return new Date().toISOString().split('T')[0];
  if (inputDate.match(/^\d{4}-\d{2}-\d{2}$/)) return inputDate;
  const parts = inputDate.split('/');
  if (parts.length === 3) {
    const m = parts[0].padStart(2, '0');
    const d = parts[1].padStart(2, '0');
    const y = parts[2];
    return `${y}-${m}-${d}`;
  }
  return inputDate;
}

function computeSummary(records: DailySalesRecord[], lifetimeSpend: number): CrmMarketingSummary {
  const activeRecords = records.filter((r) => r.spend > 0 || r.messageCount > 0 || r.actual > 0 || r.orderCount > 0);

  const latest =
    activeRecords.length > 0
      ? activeRecords[activeRecords.length - 1]
      : records[0] || {
          spend: 0,
          actual: 0,
          orderCount: 0,
          messageCount: 0,
          date: '11/1/2026',
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
}

export async function GET(req: NextRequest) {
  try {
    let records: DailySalesRecord[] = db.dailySalesRecords;
    let lifetimeSpend: number = db.crmAccountLifetimeSpend;

    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        // 1. Fetch CRM Marketing Settings from Supabase
        const { data: settingsData } = await supabaseServer
          .from('crm_marketing_settings')
          .select('ad_account_lifetime_spend')
          .eq('id', 'default')
          .maybeSingle();

        if (settingsData && typeof settingsData.ad_account_lifetime_spend === 'number') {
          lifetimeSpend = settingsData.ad_account_lifetime_spend;
          db.crmAccountLifetimeSpend = lifetimeSpend;
        }

        // 2. Fetch Daily Sales Reviews from Supabase
        const { data: dbRecords, error: dbErr } = await supabaseServer
          .from('daily_sales_reviews')
          .select('*')
          .order('date', { ascending: true });

        if (!dbErr && dbRecords && dbRecords.length > 0) {
          records = dbRecords.map((r: any) => ({
            id: String(r.id),
            date: formatDisplayDate(r.date),
            target: Number(r.target) || 0,
            actual: Number(r.actual) || 0,
            diff: Number(r.diff) || Number((r.actual - r.target).toFixed(2)),
            spend: Number(r.spend) || 0,
            messageCount: Number(r.message_count) || 0,
            orderCount: Number(r.order_count) || 0,
            roas: Number(r.roas) || 0,
            cpr: Number(r.cpr) || 0,
            notes: r.notes || '',
            updatedAt: r.updated_at || new Date().toISOString(),
          }));
          db.dailySalesRecords = records;
        }
      } catch (sbErr) {
        console.warn('Supabase fetch failed, using local cache:', sbErr);
      }
    }

    const summary = computeSummary(records, lifetimeSpend);
    return NextResponse.json({
      success: true,
      records,
      lifetimeSpend,
      summary,
      source: isServerSupabaseConfigured ? 'supabase' : 'cache',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch daily sales records' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, record, records, lifetimeSpend } = body;

    // 1. Update Lifetime Ad Spend Settings
    if (action === 'update_settings' && typeof lifetimeSpend === 'number') {
      db.crmAccountLifetimeSpend = lifetimeSpend;

      if (isServerSupabaseConfigured && supabaseServer) {
        try {
          await supabaseServer
            .from('crm_marketing_settings')
            .upsert({ id: 'default', ad_account_lifetime_spend: lifetimeSpend, updated_at: new Date().toISOString() });
        } catch (sbErr) {
          console.warn('Supabase settings update error:', sbErr);
        }
      }

      const summary = computeSummary(db.dailySalesRecords, db.crmAccountLifetimeSpend);
      return NextResponse.json({ success: true, lifetimeSpend: db.crmAccountLifetimeSpend, summary });
    }

    // 2. Batch Update
    if (action === 'batch_update' && Array.isArray(records)) {
      db.dailySalesRecords = records.map((r: any) => {
        const target = Number(r.target) || 0;
        const actual = Number(r.actual) || 0;
        const spend = Number(r.spend) || 0;
        const messageCount = Number(r.messageCount) || 0;
        const orderCount = Number(r.orderCount) || 0;
        const diff = Number((actual - target).toFixed(2));
        const roas = spend > 0 ? Number((actual / spend).toFixed(2)) : 0;
        const cpr = messageCount > 0 ? Number((spend / messageCount).toFixed(2)) : 0;

        return {
          ...r,
          date: formatDisplayDate(r.date),
          target,
          actual,
          diff,
          spend,
          messageCount,
          orderCount,
          roas,
          cpr,
          updatedAt: new Date().toISOString(),
        };
      });

      if (isServerSupabaseConfigured && supabaseServer) {
        try {
          const dbPayload = db.dailySalesRecords.map((r) => ({
            date: formatDbDate(r.date),
            target: r.target,
            actual: r.actual,
            spend: r.spend,
            message_count: r.messageCount,
            order_count: r.orderCount,
            roas: r.roas,
            cpr: r.cpr,
            notes: r.notes || '',
          }));
          await supabaseServer.from('daily_sales_reviews').upsert(dbPayload, { onConflict: 'date' });
        } catch (sbErr) {
          console.warn('Supabase batch upsert failed:', sbErr);
        }
      }

      const summary = computeSummary(db.dailySalesRecords, db.crmAccountLifetimeSpend);
      return NextResponse.json({ success: true, records: db.dailySalesRecords, summary });
    }

    // 3. Upsert Single Day Record
    if (record && record.date) {
      const target = Number(record.target) || 0;
      const actual = Number(record.actual) || 0;
      const spend = Number(record.spend) || 0;
      const messageCount = Number(record.messageCount) || 0;
      const orderCount = Number(record.orderCount) || 0;
      const diff = Number((actual - target).toFixed(2));
      const roas = spend > 0 ? Number((actual / spend).toFixed(2)) : 0;
      const cpr = messageCount > 0 ? Number((spend / messageCount).toFixed(2)) : 0;

      const displayDate = formatDisplayDate(record.date);
      const dbDate = formatDbDate(record.date);

      const idx = db.dailySalesRecords.findIndex((r) => r.date === displayDate || r.id === record.id);
      const computedRecord: DailySalesRecord = {
        id: idx >= 0 ? db.dailySalesRecords[idx].id : `dsr_${Date.now()}`,
        date: displayDate,
        target,
        actual,
        diff,
        spend,
        messageCount,
        orderCount,
        roas,
        cpr,
        notes: record.notes || '',
        updatedAt: new Date().toISOString(),
      };

      if (idx >= 0) {
        db.dailySalesRecords[idx] = computedRecord;
      } else {
        db.dailySalesRecords.push(computedRecord);
      }

      if (isServerSupabaseConfigured && supabaseServer) {
        try {
          await supabaseServer.from('daily_sales_reviews').upsert(
            {
              date: dbDate,
              target,
              actual,
              spend,
              message_count: messageCount,
              order_count: orderCount,
              roas,
              cpr,
              notes: record.notes || '',
            },
            { onConflict: 'date' }
          );
        } catch (sbErr) {
          console.warn('Supabase daily sales review upsert failed:', sbErr);
        }
      }

      const summary = computeSummary(db.dailySalesRecords, db.crmAccountLifetimeSpend);
      return NextResponse.json({ success: true, record: computedRecord, summary });
    }

    return NextResponse.json({ error: 'Invalid payload action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update daily sales record' }, { status: 500 });
  }
}
