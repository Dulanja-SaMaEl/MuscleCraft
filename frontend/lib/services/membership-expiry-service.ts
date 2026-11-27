import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabase/server';
import { db } from '@/lib/db/mock-db';
import { SmsService } from '@/lib/services/sms-service';
import { EmailService } from '@/lib/services/email-service';
import { User } from '@/lib/types';

export interface ExpirySweepSummary {
  checkedClients: number;
  lockedOutCount: number;
  expiring3DayNotifiedCount: number;
  expiredNotifiedCount: number;
  skippedAlreadyNotifiedCount: number;
  details: {
    memberId: string;
    name: string;
    email: string;
    event: '3_day_warning' | 'expired_lockout';
    smsSent: boolean;
    emailSent: boolean;
    expiresAt: string;
  }[];
  ranAt: string;
}

// In-memory deduplication fallback when Supabase is not active
const localSentNotices = new Set<string>();

function buildCycleKey(userId: string, expiresAt: string): string {
  const dateOnly = new Date(expiresAt).toISOString().slice(0, 10);
  return `${userId}_${dateOnly}`;
}

async function hasNoticeBeenSent(action: 'EXPIRY_REMINDER_3D_SENT' | 'EXPIRY_LOCKOUT_NOTICE_SENT', cycleKey: string): Promise<boolean> {
  const memKey = `${action}:${cycleKey}`;
  if (localSentNotices.has(memKey)) return true;

  if (isServerSupabaseConfigured && supabaseServer) {
    try {
      const { data } = await supabaseServer
        .from('audit_logs')
        .select('id')
        .eq('action', action)
        .eq('target_id', cycleKey)
        .limit(1)
        .maybeSingle();
      if (data?.id) {
        localSentNotices.add(memKey);
        return true;
      }
    } catch (_) {}
  }
  return false;
}

async function recordNoticeSent(params: {
  action: 'EXPIRY_REMINDER_3D_SENT' | 'EXPIRY_LOCKOUT_NOTICE_SENT';
  cycleKey: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  expiresAt: string;
  smsSent: boolean;
  emailSent: boolean;
  actorEmail?: string;
}) {
  const memKey = `${params.action}:${params.cycleKey}`;
  localSentNotices.add(memKey);

  if (isServerSupabaseConfigured && supabaseServer) {
    try {
      await supabaseServer.from('audit_logs').insert({
        actor_id: null,
        actor_email: params.actorEmail || 'system-cron@musclecraftlk.com',
        action: params.action,
        target_type: 'membership_expiry',
        target_id: params.cycleKey,
        details: JSON.stringify({
          memberId: params.memberId,
          name: params.memberName,
          email: params.memberEmail,
          expiresAt: params.expiresAt,
          smsSent: params.smsSent,
          emailSent: params.emailSent,
        }),
      });
    } catch (_) {}
  }
}

/**
 * Deduplicated single-member expired notification trigger (used when enforceAndSyncUserStatus
 * locks out an active client on login/session check before the daily cron runs).
 */
export async function notifySingleExpiredMemberIfNeeded(user: User): Promise<void> {
  if (!user || user.role !== 'client' || !user.membershipExpiresAt) return;
  const cycleKey = buildCycleKey(user.id, user.membershipExpiresAt);
  const alreadySent = await hasNoticeBeenSent('EXPIRY_LOCKOUT_NOTICE_SENT', cycleKey);
  if (alreadySent) return;

  const [smsRes, emailRes] = await Promise.allSettled([
    user.phone
      ? SmsService.notifyMembershipExpired({
          phone: user.phone,
          name: user.name,
          packageName: user.packageName || user.tier,
          expiresAt: user.membershipExpiresAt,
          tier: user.tier,
        })
      : Promise.resolve(null),
    user.email
      ? EmailService.notifyMembershipExpired({
          email: user.email,
          name: user.name,
          packageName: user.packageName || user.tier,
          expiresAt: user.membershipExpiresAt,
          tier: user.tier,
        })
      : Promise.resolve(null),
  ]);

  const smsSent = smsRes.status === 'fulfilled' && Boolean(smsRes.value?.success);
  const emailSent = emailRes.status === 'fulfilled' && Boolean(emailRes.value?.success);

  await recordNoticeSent({
    action: 'EXPIRY_LOCKOUT_NOTICE_SENT',
    cycleKey,
    memberId: user.id,
    memberName: user.name,
    memberEmail: user.email,
    expiresAt: user.membershipExpiresAt,
    smsSent,
    emailSent,
  });
}

/**
 * Runs the full Membership Expiration & Renewal Reminder sweep:
 * 1. Sends 3-day advance SMS + Email renewal reminder to active clients expiring within 3 days (0 < daysLeft <= 3).
 * 2. Automatically locks out expired active clients (`status = 'expired'`) and sends post-expiration SMS + Email renewal notice.
 * Idempotent per (memberId + expirationDate) so members never receive duplicate notices for the same billing period.
 */
export async function runMembershipExpirySweep(actorEmail?: string): Promise<ExpirySweepSummary> {
  const now = new Date();
  const nowMs = now.getTime();
  const nowIso = now.toISOString();

  const summary: ExpirySweepSummary = {
    checkedClients: 0,
    lockedOutCount: 0,
    expiring3DayNotifiedCount: 0,
    expiredNotifiedCount: 0,
    skippedAlreadyNotifiedCount: 0,
    details: [],
    ranAt: nowIso,
  };

  let clients: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    tier?: string;
    packageName?: string;
    status: string;
    membershipExpiresAt?: string | null;
  }[] = [];

  if (isServerSupabaseConfigured && supabaseServer) {
    const { data, error } = await supabaseServer
      .from('profiles')
      .select('id, name, email, phone, tier, package_name, status, membership_expires_at')
      .eq('role', 'client')
      .in('status', ['active', 'expired'])
      .not('membership_expires_at', 'is', null);

    if (!error && data) {
      clients = data.map((p: any) => ({
        id: String(p.id),
        name: p.name || 'Athlete',
        email: p.email || '',
        phone: p.phone || null,
        tier: p.tier || 'none',
        packageName: p.package_name || p.tier || 'Gym Membership',
        status: p.status,
        membershipExpiresAt: p.membership_expires_at,
      }));
    }
  } else {
    clients = db.users
      .filter((u) => u.role === 'client' && (u.status === 'active' || u.status === 'expired') && u.membershipExpiresAt)
      .map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || null,
        tier: u.tier,
        packageName: u.packageName || u.tier,
        status: u.status,
        membershipExpiresAt: u.membershipExpiresAt || null,
      }));
  }

  summary.checkedClients = clients.length;

  for (const client of clients) {
    if (!client.membershipExpiresAt) continue;
    const expiryMs = new Date(client.membershipExpiresAt).getTime();
    if (Number.isNaN(expiryMs)) continue;

    const diffMs = expiryMs - nowMs;
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const cycleKey = buildCycleKey(client.id, client.membershipExpiresAt);

    // CASE 1: EXPIRED (expiryMs <= nowMs) -> Auto-lock portal + send post-expiration SMS & Email once
    if (diffMs <= 0) {
      if (client.status === 'active') {
        if (isServerSupabaseConfigured && supabaseServer) {
          await supabaseServer
            .from('profiles')
            .update({ status: 'expired', updated_at: nowIso })
            .eq('id', client.id);
        }
        const localMatch = db.users.find((u) => u.id === client.id);
        if (localMatch) localMatch.status = 'expired';
        summary.lockedOutCount += 1;
      }

      const alreadySent = await hasNoticeBeenSent('EXPIRY_LOCKOUT_NOTICE_SENT', cycleKey);
      if (alreadySent) {
        summary.skippedAlreadyNotifiedCount += 1;
        continue;
      }

      const [smsRes, emailRes] = await Promise.allSettled([
        client.phone
          ? SmsService.notifyMembershipExpired({
              phone: client.phone,
              name: client.name,
              packageName: client.packageName,
              expiresAt: client.membershipExpiresAt,
              tier: client.tier,
            })
          : Promise.resolve(null),
        client.email
          ? EmailService.notifyMembershipExpired({
              email: client.email,
              name: client.name,
              packageName: client.packageName,
              expiresAt: client.membershipExpiresAt,
              tier: client.tier,
            })
          : Promise.resolve(null),
      ]);

      const smsSent = smsRes.status === 'fulfilled' && Boolean(smsRes.value?.success);
      const emailSent = emailRes.status === 'fulfilled' && Boolean(emailRes.value?.success);

      await recordNoticeSent({
        action: 'EXPIRY_LOCKOUT_NOTICE_SENT',
        cycleKey,
        memberId: client.id,
        memberName: client.name,
        memberEmail: client.email,
        expiresAt: client.membershipExpiresAt,
        smsSent,
        emailSent,
        actorEmail,
      });

      summary.expiredNotifiedCount += 1;
      summary.details.push({
        memberId: client.id,
        name: client.name,
        email: client.email,
        event: 'expired_lockout',
        smsSent,
        emailSent,
        expiresAt: client.membershipExpiresAt,
      });
      continue;
    }

    // CASE 2: EXPIRING IN <= 3 DAYS (0 < daysLeft <= 3) -> Send 3-day advance SMS & Email reminder once
    if (client.status === 'active' && daysLeft > 0 && daysLeft <= 3) {
      const alreadySent = await hasNoticeBeenSent('EXPIRY_REMINDER_3D_SENT', cycleKey);
      if (alreadySent) {
        summary.skippedAlreadyNotifiedCount += 1;
        continue;
      }

      const [smsRes, emailRes] = await Promise.allSettled([
        client.phone
          ? SmsService.notifyMembershipExpiringSoon({
              phone: client.phone,
              name: client.name,
              packageName: client.packageName,
              daysLeft,
              expiresAt: client.membershipExpiresAt,
              tier: client.tier,
            })
          : Promise.resolve(null),
        client.email
          ? EmailService.notifyMembershipExpiringSoon({
              email: client.email,
              name: client.name,
              packageName: client.packageName,
              daysLeft,
              expiresAt: client.membershipExpiresAt,
              tier: client.tier,
            })
          : Promise.resolve(null),
      ]);

      const smsSent = smsRes.status === 'fulfilled' && Boolean(smsRes.value?.success);
      const emailSent = emailRes.status === 'fulfilled' && Boolean(emailRes.value?.success);

      await recordNoticeSent({
        action: 'EXPIRY_REMINDER_3D_SENT',
        cycleKey,
        memberId: client.id,
        memberName: client.name,
        memberEmail: client.email,
        expiresAt: client.membershipExpiresAt,
        smsSent,
        emailSent,
        actorEmail,
      });

      summary.expiring3DayNotifiedCount += 1;
      summary.details.push({
        memberId: client.id,
        name: client.name,
        email: client.email,
        event: '3_day_warning',
        smsSent,
        emailSent,
        expiresAt: client.membershipExpiresAt,
      });
    }
  }

  return summary;
}
