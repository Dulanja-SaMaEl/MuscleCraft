import { NextRequest, NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { resolveServerUser } from '@/lib/supabase/server';
import { runMembershipExpirySweep } from '@/lib/services/membership-expiry-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function isAuthorizedCron(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authHeader = req.headers.get('authorization')?.trim();
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }
  // Official Vercel Cron invocation header when CRON_SECRET is not explicitly configured
  if (!cronSecret && req.headers.get('x-vercel-cron') === '1') {
    return true;
  }
  return false;
}

/**
 * GET /api/cron/membership-expiry
 * Invoked automatically every day by Vercel Cron (02:30 UTC / 08:00 AM Sri Lanka Time)
 * or manually by an authenticated Administrator (?adminId=...).
 */
export async function GET(req: NextRequest) {
  noStore();
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId');
    let actorEmail = 'vercel-cron@musclecraftlk.com';

    if (!isAuthorizedCron(req)) {
      const caller = await resolveServerUser(adminId);
      if (caller.role !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized: Valid CRON_SECRET or Administrator credentials required.' },
          { status: 401 }
        );
      }
      actorEmail = caller.email || 'musclecraftlk@gmail.com';
    }

    const summary = await runMembershipExpirySweep(actorEmail);
    return NextResponse.json({
      success: true,
      summary,
      message: `Expiry check complete: ${summary.lockedOutCount} locked out, ${summary.expiring3DayNotifiedCount} 3-day reminders sent, ${summary.expiredNotifiedCount} expiration notices sent.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Membership expiry sweep failed.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/membership-expiry?adminId=...
 * Manual trigger from Admin Dashboard Renewals Desk.
 */
export async function POST(req: NextRequest) {
  return GET(req);
}
