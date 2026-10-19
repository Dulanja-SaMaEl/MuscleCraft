import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/services/payment-service';
import { AuthService } from '@/lib/services/auth-service';
import { SubmitBankTransferSchema } from '@/lib/validation';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const requestingUser = AuthService.getCurrentUser(userId);

  if (!requestingUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payments = PaymentService.getPayments(requestingUser);
  return NextResponse.json({
    payments,
    referenceCodeProposal: PaymentService.generateReferenceCode(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const user = AuthService.getCurrentUser(userId);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = SubmitBankTransferSchema.parse(body);

    const payment = PaymentService.submitBankTransfer({
      userId: user.id,
      referenceCode: validated.referenceCode,
      tier: validated.tier,
      bankName: validated.bankName,
      transferDate: validated.transferDate,
      senderAccountName: validated.senderAccountName,
      receiptNotes: validated.receiptNotes,
    });

    return NextResponse.json({ success: true, payment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Validation failed' },
      { status: 400 }
    );
  }
}
