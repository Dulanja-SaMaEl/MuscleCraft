import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth-service';
import { getR2StorageStats } from '@/lib/storage/cloudflare-r2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const caller = userId ? AuthService.getCurrentUser(userId) : null;

    if (caller && caller.role !== 'admin' && caller.role !== 'instructor') {
      return NextResponse.json(
        { error: 'Forbidden: Storage telemetry is restricted to coaches and administrators.' },
        { status: 403 }
      );
    }

    const stats = await getR2StorageStats();
    return NextResponse.json({ stats });
  } catch (err: any) {
    console.error('Failed to read R2 storage statistics:', err);
    return NextResponse.json(
      { error: err.message || 'Unable to inspect video storage quota.' },
      { status: 500 }
    );
  }
}
