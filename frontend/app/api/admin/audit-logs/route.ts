import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/lib/services/admin-service';
import { supabaseServer, isServerSupabaseConfigured, resolveServerUser } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId');
    const adminUser = await resolveServerUser(adminId);

    if (adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Administrator access required.' }, { status: 403 });
    }

    let logs = AdminService.getAuditLogs(adminUser);

    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        const { data, error } = await supabaseServer
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (!error && data && data.length > 0) {
          logs = data.map((l: any) => ({
            id: String(l.id),
            actorId: l.actor_id,
            actorEmail: l.actor_email,
            action: l.action,
            targetType: l.target_type,
            targetId: l.target_id,
            details: typeof l.details === 'string' ? l.details : JSON.stringify(l.details || {}),
            timestamp: l.created_at,
            createdAt: l.created_at,
          }));
        }
      } catch (err) {
        console.warn('Supabase audit logs fetch error, using cache:', err);
      }
    }

    return NextResponse.json({
      logs,
      source: isServerSupabaseConfigured ? 'supabase' : 'cache',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}
