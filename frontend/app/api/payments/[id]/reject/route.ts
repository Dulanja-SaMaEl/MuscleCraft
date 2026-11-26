import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/services/payment-service';
import {
  supabaseServer,
  isServerSupabaseConfigured,
  resolveServerUser,
} from '@/lib/supabase/server';
import { db } from '@/lib/db/mock-db';
import { SmsService } from '@/lib/services/sms-service';
import { EmailService } from '@/lib/services/email-service';

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
    const reason = body.reason || 'Invalid deposit slip reference';
    let updatedPayment: any = null;

    if (isServerSupabaseConfigured && supabaseServer) {
      let validReviewerId: string | null = null;
      try {
        const { data: revProf } = await supabaseServer
          .from('profiles')
          .select('id')
          .eq('id', adminUser.id)
          .maybeSingle();
        validReviewerId = revProf?.id || null;
      } catch (_) {}

      const { data: updPay, error } = await supabaseServer
        .from('payments')
        .update({
          status: 'rejected',
          admin_notes: reason,
          reviewed_by: validReviewerId,
          reviewed_at: new Date().toISOString(),
        })
        .or(`id.eq.${params.id},reference_code.eq.${params.id}`)
        .select('*')
        .maybeSingle();

      if (!error && updPay) {
        updatedPayment = updPay;

        // Automatic SMS & Email Notification: Bank Slip Rejected
        if (updPay.user_id) {
          try {
            const { data: userProf } = await supabaseServer
              .from('profiles')
              .select('name, email, phone')
              .eq('id', updPay.user_id)
              .maybeSingle();

            if (userProf?.phone) {
              await SmsService.notifyPaymentRejected({
                phone: userProf.phone,
                name: userProf.name || 'Athlete',
                reason,
              });
            }
            if (userProf?.email) {
              await EmailService.notifyPaymentRejected({
                email: userProf.email,
                name: userProf.name || 'Athlete',
                reason,
              });
            }
          } catch (notifyErr) {
            console.warn('Payment rejection notification warning:', notifyErr);
          }
        }
      }
    }

    try {
      const localPay = db.payments.find((p) => p.id === params.id || p.referenceCode === params.id);
      if (localPay) {
        updatedPayment = PaymentService.rejectPayment(adminUser, localPay.id, reason);
      } else if (!updatedPayment) {
        updatedPayment = PaymentService.rejectPayment(adminUser, params.id, reason);
      }
    } catch (localErr) {
      if (!updatedPayment) throw localErr;
    }

    return NextResponse.json({ success: true, payment: updatedPayment });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Rejection failed' },
      { status: 400 }
    );
  }
}
