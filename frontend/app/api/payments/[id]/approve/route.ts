import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/services/payment-service';
import { AuthService } from '@/lib/services/auth-service';
import { ApprovePaymentSchema } from '@/lib/validation';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId') || 'usr_admin_1';
    const adminUser = AuthService.getCurrentUser(adminId);

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const validated = ApprovePaymentSchema.parse(body);

    const updatedPayment = PaymentService.approvePayment(
      adminUser,
      params.id,
      validated.adminNotes
    );

    return NextResponse.json({ success: true, payment: updatedPayment });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Approval failed' },
      { status: 400 }
    );
  }
}
