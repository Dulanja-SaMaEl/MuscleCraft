import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/lib/services/admin-service';
import { AuthService } from '@/lib/services/auth-service';
import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabase/server';
import { db } from '@/lib/db/mock-db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId') || 'usr_admin_1';
    const adminUser = AuthService.getCurrentUser(adminId);

    let members = AdminService.getAllMembers(adminUser || { id: 'usr_admin_1', role: 'admin' } as any);

    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        const { data: profiles, error } = await supabaseServer
          .from('profiles')
          .select('*')
          .order('joined_at', { ascending: false });

        if (!error && profiles && profiles.length > 0) {
          members = profiles.map((p: any) => ({
            id: p.id,
            email: p.email,
            name: p.name,
            role: p.role,
            tier: p.tier,
            packageId: p.package_id,
            packageName: p.package_name,
            packageType: p.package_type,
            status: p.status,
            avatarUrl: p.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            assignedInstructorId: p.assigned_instructor_id,
            assignedInstructorName: p.assigned_instructor_name,
            membershipExpiresAt: p.membership_expires_at,
            joinedAt: p.joined_at,
            phone: p.phone,
          }));
        }
      } catch (sbErr) {
        console.warn('Supabase members fetch error, using cache:', sbErr);
      }
    }

    return NextResponse.json({
      members,
      total: members.length,
      source: isServerSupabaseConfigured ? 'supabase' : 'cache',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId') || 'usr_admin_1';
    const adminUser = AuthService.getCurrentUser(adminId) || ({ id: 'usr_admin_1', role: 'admin' } as any);

    const body = await req.json();
    const { memberId, status, instructorId, extendDays, reason } = body;

    let updatedMember = null;
    if (extendDays) {
      updatedMember = AdminService.extendMembership(adminUser, memberId, Number(extendDays));
    } else if (status) {
      updatedMember = AdminService.updateMemberStatus(adminUser, memberId, status, reason);
    } else if (instructorId) {
      updatedMember = AdminService.assignInstructor(adminUser, memberId, instructorId);
    }

    if (isServerSupabaseConfigured && supabaseServer && memberId) {
      const updatePayload: any = { updated_at: new Date().toISOString() };
      if (status) updatePayload.status = status;
      if (instructorId) updatePayload.assigned_instructor_id = instructorId;
      if (updatedMember && updatedMember.membershipExpiresAt) {
        updatePayload.membership_expires_at = updatedMember.membershipExpiresAt;
      }
      await supabaseServer.from('profiles').update(updatePayload).eq('id', memberId);
    }

    return NextResponse.json({ success: true, member: updatedMember });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
