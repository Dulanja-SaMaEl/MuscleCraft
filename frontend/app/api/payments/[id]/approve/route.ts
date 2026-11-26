import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/services/payment-service';
import { ApprovePaymentSchema } from '@/lib/validation';
import {
  supabaseServer,
  isServerSupabaseConfigured,
  resolveServerUser,
} from '@/lib/supabase/server';
import { db } from '@/lib/db/mock-db';
import { SmsService } from '@/lib/services/sms-service';
import { EmailService } from '@/lib/services/email-service';

function computePlanDurationDays(tier?: string | null): number {
  if (!tier) return 30;
  if (tier === 'sole_1y' || tier === 'couple_1y') return 365;
  if (tier === 'sole_6m' || tier === 'couple_6m') return 180;
  if (tier === 'sole_3m' || tier === 'couple_3m' || tier === 'coaching_90') return 90;
  return 30;
}

function inferPackageType(tier?: string | null): 'sole' | 'couple' | 'coaching' {
  if (!tier) return 'sole';
  if (tier.startsWith('couple')) return 'couple';
  if (tier === 'coaching_90' || tier === 'burnzone') return 'coaching';
  return 'sole';
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId');
    const adminUser = await resolveServerUser(adminId);

    if (adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Administrator role required.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const validated = ApprovePaymentSchema.parse(body);

    let updatedPayment: any = null;

    if (isServerSupabaseConfigured && supabaseServer) {
      const { data: existing, error: findErr } = await supabaseServer
        .from('payments')
        .select('*')
        .or(`id.eq.${params.id},reference_code.eq.${params.id}`)
        .maybeSingle();

      if (!findErr && existing) {
        const nowIso = new Date().toISOString();
        // Verify reviewer ID exists in Supabase profiles to satisfy FK constraint
        let validReviewerId: string | null = null;
        try {
          const { data: revProf } = await supabaseServer
            .from('profiles')
            .select('id')
            .eq('id', adminUser.id)
            .maybeSingle();
          validReviewerId = revProf?.id || null;
        } catch (_) {}

        const { data: updPay, error: updErr } = await supabaseServer
          .from('payments')
          .update({
            status: 'approved',
            admin_notes: validated.adminNotes || 'Approved by Head Coach Adeesha',
            reviewed_by: validReviewerId,
            reviewed_at: nowIso,
          })
          .eq('id', existing.id)
          .select('*')
          .single();

        if (updErr) {
          throw new Error(updErr.message);
        }

        updatedPayment = updPay;

        // Activate & provision membership on client's Supabase profile immediately
        if (existing.user_id) {
          const durationDays = computePlanDurationDays(existing.tier);
          const priceInfo = PaymentService.getTierPrice(existing.tier);
          const { data: currentProfile } = await supabaseServer
            .from('profiles')
            .select('name, email, phone, membership_expires_at, status')
            .eq('id', existing.user_id)
            .maybeSingle();

          // Stack on remaining time ONLY if still active and unexpired; else start fresh from now
          const curExp =
            currentProfile?.status === 'active' && currentProfile?.membership_expires_at
              ? new Date(currentProfile.membership_expires_at).getTime()
              : 0;
          const baseTime = curExp > Date.now() ? curExp : Date.now();
          const newExpiry = new Date(baseTime + durationDays * 24 * 60 * 60 * 1000).toISOString();

          await supabaseServer
            .from('profiles')
            .update({
              status: 'active',
              tier: existing.tier,
              package_id: existing.package_id || existing.tier,
              package_name: priceInfo.name,
              package_type: inferPackageType(existing.tier),
              membership_expires_at: newExpiry,
              updated_at: nowIso,
            })
            .eq('id', existing.user_id);

          const localUser = db.users.find((u) => u.id === existing.user_id);
          if (localUser) {
            localUser.status = 'active';
            localUser.tier = existing.tier;
            localUser.packageName = priceInfo.name;
            localUser.membershipExpiresAt = newExpiry;
          }

          // Automatic SMS & Email Notification: Bank Slip Approved & Membership Activated
          try {
            const memberPhone = currentProfile?.phone || localUser?.phone;
            const memberEmail = currentProfile?.email || localUser?.email;
            const memberName = currentProfile?.name || localUser?.name || 'Athlete';
            if (memberPhone) {
              await SmsService.notifyPaymentApproved({
                phone: memberPhone,
                name: memberName,
                amount: existing.amount,
                packageName: priceInfo.name,
              });
            }
            if (memberEmail) {
              await EmailService.notifyPaymentApproved({
                email: memberEmail,
                name: memberName,
                amount: existing.amount,
                packageName: priceInfo.name,
                expiresAt: newExpiry,
              });
            }
          } catch (notifyErr) {
            console.warn('Payment approval notification warning:', notifyErr);
          }
        }
      }
    }

    // Also update local mock DB record if present
    try {
      const localPay = db.payments.find((p) => p.id === params.id || p.referenceCode === params.id);
      if (localPay) {
        updatedPayment = PaymentService.approvePayment(adminUser, localPay.id, validated.adminNotes);
      } else if (!updatedPayment) {
        updatedPayment = PaymentService.approvePayment(adminUser, params.id, validated.adminNotes);
      }
    } catch (localErr) {
      if (!updatedPayment) throw localErr;
    }

    return NextResponse.json({ success: true, payment: updatedPayment });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Approval failed' },
      { status: 400 }
    );
  }
}
