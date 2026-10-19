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

    const logs = AdminService.getAuditLogs(adminUser);
    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}
