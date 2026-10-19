import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/lib/services/admin-service';
import { AuthService } from '@/lib/services/auth-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId') || 'usr_admin_1';
    const adminUser = AuthService.getCurrentUser(adminId);

    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const members = AdminService.getAllMembers(adminUser);
    return NextResponse.json({ members });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId') || 'usr_admin_1';
    const adminUser = AuthService.getCurrentUser(adminId);

    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { memberId, status, instructorId, reason } = body;

    let updatedMember = null;
    if (status) {
      updatedMember = AdminService.updateMemberStatus(adminUser, memberId, status, reason);
    } else if (instructorId) {
      updatedMember = AdminService.assignInstructor(adminUser, memberId, instructorId);
    }

    return NextResponse.json({ success: true, member: updatedMember });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
