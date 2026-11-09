import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/mock-db';
import { DailySalesRecord, CrmMarketingSummary } from '@/lib/types';

function computeSummary(records: DailySalesRecord[], lifetimeSpend: number): CrmMarketingSummary {
  const activeRecords = records.filter((r) => r.spend > 0 || r.messageCount > 0 || r.actual > 0 || r.orderCount > 0);
  
  // Latest day with activity or first day
  const latest = activeRecords.length > 0 ? activeRecords[activeRecords.length - 1] : records[0] || {
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
    const summary = computeSummary(db.dailySalesRecords, db.crmAccountLifetimeSpend);
    return NextResponse.json({
      success: true,
      records: db.dailySalesRecords,
      lifetimeSpend: db.crmAccountLifetimeSpend,
      summary,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch daily sales records' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, record, records, lifetimeSpend } = body;

    if (action === 'update_settings' && typeof lifetimeSpend === 'number') {
      db.crmAccountLifetimeSpend = lifetimeSpend;
      const summary = computeSummary(db.dailySalesRecords, db.crmAccountLifetimeSpend);
      return NextResponse.json({ success: true, lifetimeSpend: db.crmAccountLifetimeSpend, summary });
    }

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

      const summary = computeSummary(db.dailySalesRecords, db.crmAccountLifetimeSpend);
      return NextResponse.json({ success: true, records: db.dailySalesRecords, summary });
    }

    if (record && record.date) {
      const target = Number(record.target) || 0;
      const actual = Number(record.actual) || 0;
      const spend = Number(record.spend) || 0;
      const messageCount = Number(record.messageCount) || 0;
      const orderCount = Number(record.orderCount) || 0;
      const diff = Number((actual - target).toFixed(2));
      const roas = spend > 0 ? Number((actual / spend).toFixed(2)) : 0;
      const cpr = messageCount > 0 ? Number((spend / messageCount).toFixed(2)) : 0;

      const idx = db.dailySalesRecords.findIndex((r) => r.date === record.date || r.id === record.id);
      const computedRecord: DailySalesRecord = {
        id: idx >= 0 ? db.dailySalesRecords[idx].id : `dsr_${Date.now()}`,
        date: record.date,
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

      // Sort chronologically by date
      db.dailySalesRecords.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const summary = computeSummary(db.dailySalesRecords, db.crmAccountLifetimeSpend);
      return NextResponse.json({ success: true, record: computedRecord, records: db.dailySalesRecords, summary });
    }

    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Operation failed' }, { status: 500 });
  }
}
