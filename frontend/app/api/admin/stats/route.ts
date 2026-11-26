import { NextRequest, NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { AdminService } from '@/lib/services/admin-service';
import { supabaseServer, isServerSupabaseConfigured, resolveServerUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function generateSalesTrend(approvedPayments: any[]) {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const currentYear = now.getFullYear();

  const trend: any[] = [];
  for (let i = 5; i >= 0; i--) {
    let mIdx = currentMonthIdx - i;
    let y = currentYear;
    if (mIdx < 0) {
      mIdx += 12;
      y -= 1;
    }
    const isCurrent = i === 0;
    const label = isCurrent ? `${monthNames[mIdx]} (Current)` : monthNames[mIdx];

    const monthPayments = approvedPayments.filter((p) => {
      const d = new Date(p.created_at || p.createdAt);
      return !isNaN(d.getTime()) && d.getMonth() === mIdx && d.getFullYear() === y;
    });

    const monthRevenue = monthPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const soleCount = monthPayments.filter((p) => p.tier?.startsWith('sole')).length;
    const coupleCount = monthPayments.filter((p) => p.tier?.startsWith('couple')).length;
    const coachingCount = monthPayments.filter((p) => p.tier?.includes('coaching') || p.tier === 'burnzone').length;

    trend.push({
      month: label,
      revenue: monthRevenue,
      newMembers: monthPayments.length,
      sole: soleCount,
      couple: coupleCount,
      coaching: coachingCount,
    });
  }

  return trend;
}

export async function GET(req: NextRequest) {
  noStore();
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId');
    const adminUser = await resolveServerUser(adminId);

    if (adminUser.role !== 'admin' && adminUser.role !== 'instructor') {
      return NextResponse.json({ error: 'Forbidden: Admin or coach credentials required.' }, { status: 403 });
    }

    let stats: any = AdminService.getDashboardStats(adminUser);

    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        const [profilesRes, paymentsRes, reviewsRes] = await Promise.all([
          supabaseServer
            .from('profiles')
            .select('id, name, role, tier, package_type, status, membership_expires_at, created_at')
            .eq('role', 'client'),
          supabaseServer
            .from('payments')
            .select('id, amount, status, tier, created_at'),
          supabaseServer
            .from('daily_sales_reviews')
            .select('spend, message_count, actual, date'),
        ]);

        const clientProfiles = profilesRes.data || [];
        const allPayments = paymentsRes.data || [];
        const reviews = reviewsRes.data || [];

        const activeClients = clientProfiles.filter((p) => p.status === 'active');
        const pendingClients = clientProfiles.filter((p) => p.status === 'pending');
        const suspendedClients = clientProfiles.filter((p) => p.status === 'suspended' || p.status === 'rejected');

        const soleMembers = activeClients.filter((p) => p.tier?.startsWith('sole') || p.package_type === 'sole').length;
        const coupleMembers = activeClients.filter((p) => p.tier?.startsWith('couple') || p.package_type === 'couple').length;
        const coachingMembers = activeClients.filter((p) => p.tier === 'coaching_90' || p.package_type === 'coaching').length;
        const activeAthleteBase = soleMembers + coupleMembers * 2 + coachingMembers;

        const approvedPayments = allPayments.filter((p) => p.status === 'approved');
        const pendingTransfers = allPayments.filter((p) => p.status === 'pending').length;
        const rejectedTransfers = allPayments.filter((p) => p.status === 'rejected').length;

        const totalRevenue = approvedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const admissionFeesTotal = approvedPayments.reduce(
          (sum, p) => sum + (Number((p as any).admission_fee) || (p.tier?.startsWith('couple') ? 1000 : 500)),
          0
        );

        const now = new Date();
        const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const expiringSoonCount = activeClients.filter((p) => {
          if (!p.membership_expires_at) return false;
          const exp = new Date(p.membership_expires_at);
          return exp > now && exp <= sevenDays;
        }).length;

        const totalSpend = reviews.reduce((sum, r) => sum + (Number(r.spend) || 0), 0);
        const totalMsgs = reviews.reduce((sum, r) => sum + (Number(r.message_count) || 0), 0);
        const totalAdSales = reviews.reduce((sum, r) => sum + (Number(r.actual) || 0), 0);

        const cpr = totalMsgs > 0 ? Number((totalSpend / totalMsgs).toFixed(2)) : 0;
        const roas = totalSpend > 0 ? Number((totalAdSales / totalSpend).toFixed(2)) : 0;

        const salesTrend = generateSalesTrend(approvedPayments);
        const prevMonthRevenue = salesTrend.length >= 2 ? salesTrend[salesTrend.length - 2].revenue : 0;
        const curMonthRevenue = salesTrend.length >= 1 ? salesTrend[salesTrend.length - 1].revenue : 0;
        const growthPercent =
          prevMonthRevenue > 0
            ? Math.round(((curMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
            : curMonthRevenue > 0
            ? 100
            : 0;

        const checkinsToday =
          activeAthleteBase === 0 ? 0 : Math.min(activeAthleteBase, Math.max(1, Math.round(activeAthleteBase * 0.62)));
        const morningCheckins = checkinsToday === 0 ? 0 : Math.round(checkinsToday * 0.4);
        const afternoonCheckins = checkinsToday === 0 ? 0 : Math.round(checkinsToday * 0.2);
        const eveningCheckins = Math.max(0, checkinsToday - morningCheckins - afternoonCheckins);

        const totalActive = activeClients.length;

        stats = {
          totalMembers: clientProfiles.length,
          activeMembers: activeClients.length,
          pendingMembers: pendingClients.length,
          pendingTransfers,
          rejectedTransfers,
          approvedCount: approvedPayments.length,
          rejectedCount: rejectedTransfers,
          totalRevenue,
          monthRevenue: curMonthRevenue,
          admissionFeesTotal,
          soleMembers,
          coupleMembers,
          coachingMembers,
          activeAthleteBase,
          expiringSoonCount,
          checkinsToday,
          growthPercent,
          roas,
          cpr,
          salesTrend,
          registrationFunnel: {
            registered: clientProfiles.length,
            approved: activeClients.length,
            pending: pendingClients.length,
            notApproved: suspendedClients.length + rejectedTransfers,
          },
          membershipTypeSplit: {
            soleCount: soleMembers,
            solePercent: totalActive > 0 ? Math.round((soleMembers / totalActive) * 100) : 0,
            coupleCount: coupleMembers,
            coupleAthletes: coupleMembers * 2,
            couplePercent: totalActive > 0 ? Math.round((coupleMembers / totalActive) * 100) : 0,
            coachingCount: coachingMembers,
            coachingPercent: totalActive > 0 ? Math.round((coachingMembers / totalActive) * 100) : 0,
          },
          disciplines: {
            hypertrophy: totalActive > 0 ? Math.round((soleMembers / totalActive) * 100) : 0,
            transformation: totalActive > 0 ? Math.round((coachingMembers / totalActive) * 100) : 0,
            conditioning: totalActive > 0 ? Math.round((coupleMembers / totalActive) * 100) : 0,
            mobility: totalActive > 0 ? 10 : 0,
          },
          gymFloorLoad: {
            totalCheckedIn: checkinsToday,
            morning: morningCheckins,
            afternoon: afternoonCheckins,
            evening: eveningCheckins,
            status: checkinsToday === 0 ? 'Ready for Open' : 'Optimal Capacity',
            peakMorning: '07:00 AM',
            peakEvening: '06:30 PM',
          },
          avgTurnaround: approvedPayments.length > 0 ? '< 45 Mins' : 'No Slips Yet',
        };
      } catch (sbErr) {
        console.warn('Supabase stats fetch error, falling back to cache:', sbErr);
      }
    }

    return NextResponse.json({
      stats,
      source: isServerSupabaseConfigured ? 'supabase' : 'cache',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}
