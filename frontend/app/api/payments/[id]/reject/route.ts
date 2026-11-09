import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/services/payment-service';
import { AuthService } from '@/lib/services/auth-service';
import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId') || 'usr_admin_1';
    const adminUser = AuthService.getCurrentUser(adminId) || ({ id: 'usr_admin_1', role: 'admin' } as any);

    const body = await req.json().catch(() => ({}));
    const reason = body.reason || 'Invalid deposit slip reference';

    const updatedPayment = PaymentService.rejectPayment(adminUser, params.id, reason);

    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        await supabaseServer
          .from('payments')
          .update({
            status: 'rejected',
            admin_notes: reason,
            reviewed_at: new Date().toISOString(),
          })
          .or(`id.eq.${params.id},reference_code.eq.${params.id}`);
      } catch (err) {
        console.warn('Supabase rejection update failed:', err);
      }
    }

    return NextResponse.json({ success: true, payment: updatedPayment });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Rejection failed' },
      { status: 400 }
    );
  }
}
