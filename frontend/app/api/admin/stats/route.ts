import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/lib/services/admin-service';
import { AuthService } from '@/lib/services/auth-service';
import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId') || 'usr_admin_1';
    const adminUser = AuthService.getCurrentUser(adminId) || ({ id: 'usr_admin_1', role: 'admin' } as any);

    let stats: any = AdminService.getDashboardStats(adminUser);

    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        const [
          totalMembersRes,
          activeMembersRes,
          pendingTransfersRes,
          paymentsRes,
          reviewsRes,
        ] = await Promise.all([
          supabaseServer.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'client'),
          supabaseServer.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'client').eq('status', 'active'),
          supabaseServer.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          supabaseServer.from('payments').select('amount').eq('status', 'approved'),
          supabaseServer.from('daily_sales_reviews').select('spend, message_count, actual'),
        ]);

        const approvedPayments = paymentsRes.data || [];
        const totalRevenue = approvedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        const reviews = reviewsRes.data || [];
        const totalSpend = reviews.reduce((sum, r) => sum + (Number(r.spend) || 0), 0);
        const totalMsgs = reviews.reduce((sum, r) => sum + (Number(r.message_count) || 0), 0);
        const totalAdSales = reviews.reduce((sum, r) => sum + (Number(r.actual) || 0), 0);

        const cpr = totalMsgs > 0 ? Number((totalSpend / totalMsgs).toFixed(2)) : 0;
        const roas = totalSpend > 0 ? Number((totalAdSales / totalSpend).toFixed(2)) : 0;

        stats = {
          ...stats,
          totalMembers: totalMembersRes.count !== null ? totalMembersRes.count : stats.totalMembers,
          activeMembers: activeMembersRes.count !== null ? activeMembersRes.count : stats.activeMembers,
          pendingTransfers: pendingTransfersRes.count !== null ? pendingTransfersRes.count : stats.pendingTransfers,
          totalRevenue: totalRevenue > 0 ? totalRevenue : stats.totalRevenue,
          roas: roas > 0 ? roas : (stats as any).roas || 0,
          cpr: cpr > 0 ? cpr : (stats as any).cpr || 0,
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
