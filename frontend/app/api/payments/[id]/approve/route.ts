import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/services/payment-service';
import { AuthService } from '@/lib/services/auth-service';
import { ApprovePaymentSchema } from '@/lib/validation';
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
    const validated = ApprovePaymentSchema.parse(body);

    const updatedPayment = PaymentService.approvePayment(
      adminUser,
      params.id,
      validated.adminNotes
    );

    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        await supabaseServer
          .from('payments')
          .update({
            status: 'approved',
            admin_notes: validated.adminNotes || 'Approved by Head Coach Adeesha',
            reviewed_at: new Date().toISOString(),
          })
          .or(`id.eq.${params.id},reference_code.eq.${params.id}`);
      } catch (err) {
        console.warn('Supabase approval update failed:', err);
      }
    }

    return NextResponse.json({ success: true, payment: updatedPayment });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Approval failed' },
      { status: 400 }
    );
  }
}
