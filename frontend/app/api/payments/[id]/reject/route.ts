import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/services/payment-service';
import { AuthService } from '@/lib/services/auth-service';
import { RejectPaymentSchema } from '@/lib/validation';

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

    const body = await req.json();
    const validated = RejectPaymentSchema.parse(body);

    const updatedPayment = PaymentService.rejectPayment(
      adminUser,
      params.id,
      validated.reason
    );

    return NextResponse.json({ success: true, payment: updatedPayment });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Rejection failed' },
      { status: 400 }
    );
  }
}
