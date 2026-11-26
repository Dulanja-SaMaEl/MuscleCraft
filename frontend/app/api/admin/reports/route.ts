import { NextRequest, NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import {
  supabaseServer,
  isServerSupabaseConfigured,
  resolveServerUser,
} from '@/lib/supabase/server';
import { db } from '@/lib/db/mock-db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  noStore();
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId');
    const caller = await resolveServerUser(adminId);

    if (caller.role !== 'admin' && caller.role !== 'instructor') {
      return NextResponse.json({ error: 'Forbidden: Reports restricted to administrators.' }, { status: 403 });
    }

    const now = new Date();
    const nowIso = now.toISOString();

    let profiles: any[] = [];
    let payments: any[] = [];
    let salesReviews: any[] = [];
    let measurements: any[] = [];
    let videos: any[] = [];

    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        // Keep expired status accurate before building reports
        await supabaseServer
          .from('profiles')
          .update({ status: 'expired', updated_at: nowIso })
          .eq('role', 'client')
          .eq('status', 'active')
          .not('membership_expires_at', 'is', null)
          .lt('membership_expires_at', nowIso);

        const [profRes, payRes, salesRes, measRes, vidRes] = await Promise.all([
          supabaseServer.from('profiles').select('*').order('joined_at', { ascending: false }),
          supabaseServer.from('payments').select('*').order('created_at', { ascending: false }),
          supabaseServer.from('daily_sales_reviews').select('*').order('date', { ascending: false }),
          supabaseServer.from('body_measurements').select('id, user_id, week_number, weight_kg, coach_feedback, date'),
          supabaseServer.from('exercise_videos').select('id, title, category, access_level, target_client_id, created_at'),
        ]);

        profiles = profRes.data || [];
        payments = payRes.data || [];
        salesReviews = salesRes.data || [];
        measurements = measRes.data || [];
        videos = vidRes.data || [];
      } catch (err) {
        console.warn('Supabase report queries warning:', err);
      }
    } else {
      profiles = db.users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        tier: u.tier,
        package_name: u.packageName,
        package_type: u.packageType,
        status: u.status,
        membership_expires_at: u.membershipExpiresAt,
        joined_at: u.joinedAt,
      }));
      payments = db.payments.map((p) => ({
        id: p.id,
        user_id: p.userId,
        reference_code: p.referenceCode,
        tier: p.tier,
        amount: p.amount,
        bank_name: p.bankName,
        transfer_date: p.transferDate,
        sender_account_name: p.senderAccountName,
        status: p.status,
        created_at: p.createdAt,
        receipt_url: p.receiptUrl,
      }));
      measurements = db.measurements;
      videos = db.videos;
    }

    const clients = profiles.filter((p) => p.role === 'client');
    const activeClients = clients.filter((c) => c.status === 'active');
    const pendingClients = clients.filter((c) => c.status === 'pending');
    const suspendedClients = clients.filter((c) => c.status === 'suspended');
    const expiredClients = clients.filter(
      (c) =>
        c.status === 'expired' ||
        (c.membership_expires_at && new Date(c.membership_expires_at).getTime() <= now.getTime())
    );
    const ninetyDayCohort = clients.filter(
      (c) =>
        c.tier === 'coaching_90' ||
        c.package_type === 'coaching' ||
        String(c.package_name || '').toLowerCase().includes('90')
    );

    const approvedPayments = payments.filter((p) => p.status === 'approved');
    const pendingPayments = payments.filter((p) => p.status === 'pending');
    const rejectedPayments = payments.filter((p) => p.status === 'rejected');

    const totalApprovedRevenue = approvedPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const totalPendingRevenue = pendingPayments.reduce((s, p) => s + Number(p.amount || 0), 0);

    // Package breakdown from real approved payments + clients
    const packageMap = new Map<string, { tier: string; paymentsCount: number; revenueLkr: number; activeMembers: number }>();
    for (const p of approvedPayments) {
      const key = p.tier || 'other';
      const entry = packageMap.get(key) || { tier: key, paymentsCount: 0, revenueLkr: 0, activeMembers: 0 };
      entry.paymentsCount += 1;
      entry.revenueLkr += Number(p.amount || 0);
      packageMap.set(key, entry);
    }
    for (const c of activeClients) {
      const key = c.tier || 'other';
      if (key === 'none') continue;
      const entry = packageMap.get(key) || { tier: key, paymentsCount: 0, revenueLkr: 0, activeMembers: 0 };
      entry.activeMembers += 1;
      packageMap.set(key, entry);
    }

    // Marketing & Ad CRM aggregates (exact schema columns: spend, message_count, actual, order_count)
    const totalAdSpend = salesReviews.reduce((s, r) => s + Number(r.spend || 0), 0);
    const totalLeads = salesReviews.reduce((s, r) => s + Number(r.message_count ?? r.msg_count ?? 0), 0);
    const totalCrmSales = salesReviews.reduce((s, r) => s + Number(r.actual ?? r.actual_sales ?? 0), 0);
    const totalOrders = salesReviews.reduce((s, r) => s + Number(r.order_count || 0), 0);

    return NextResponse.json({
      generatedAt: nowIso,
      summary: {
        totalClients: clients.length,
        activeClients: activeClients.length,
        pendingPurchaseClients: pendingClients.length,
        expiredClients: expiredClients.length,
        suspendedClients: suspendedClients.length,
        ninetyDayCohortCount: ninetyDayCohort.length,
        totalApprovedRevenue,
        totalPendingRevenue,
        approvedPaymentsCount: approvedPayments.length,
        pendingPaymentsCount: pendingPayments.length,
        rejectedPaymentsCount: rejectedPayments.length,
        totalMeasurements: measurements.length,
        pendingFeedbackMeasurements: measurements.filter((m) => !m.coach_feedback && !m.coachFeedback).length,
        totalVideos: videos.length,
        totalAdSpend,
        totalLeads,
        totalCrmSales,
        totalOrders,
        avgCostPerLead: totalLeads > 0 ? Number((totalAdSpend / totalLeads).toFixed(2)) : 0,
      },
      packageBreakdown: Array.from(packageMap.values()).sort((a, b) => b.revenueLkr - a.revenueLkr),
      payments,
      members: clients,
      salesReviews,
      source: isServerSupabaseConfigured ? 'supabase' : 'cache',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to build reports.' }, { status: 500 });
  }
}
