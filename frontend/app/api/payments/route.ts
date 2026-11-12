import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/services/payment-service';
import { AuthService } from '@/lib/services/auth-service';
import { SubmitBankTransferSchema } from '@/lib/validation';
import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabase/server';
import { db } from '@/lib/db/mock-db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const requestingUser = AuthService.getCurrentUser(userId) || { id: 'usr_admin_1', role: 'admin' } as any;

  let payments: any[] = [];

  if (isServerSupabaseConfigured && supabaseServer) {
    try {
      let query = supabaseServer.from('payments').select('*').order('created_at', { ascending: false });
      if (requestingUser.role !== 'admin') {
        query = query.eq('user_id', requestingUser.id);
      }
      const { data, error } = await query;
      if (!error && data) {
        payments = data.map((p: any) => ({
          id: p.id,
          userId: p.user_id,
          userName: p.sender_account_name || 'Member',
          userEmail: '',
          referenceCode: p.reference_code,
          packageId: p.package_id,
          tier: p.tier,
          amount: Number(p.amount),
          currency: p.currency || 'LKR',
          bankName: p.bank_name,
          transferDate: p.transfer_date,
          senderAccountName: p.sender_account_name,
          receiptNotes: p.receipt_notes || '',
          receiptUrl: p.receipt_url,
          status: p.status,
          adminNotes: p.admin_notes || '',
          reviewedBy: p.reviewed_by,
          reviewedAt: p.reviewed_at,
          createdAt: p.created_at,
        }));
      }
    } catch (sbErr) {
      console.warn('Supabase payments fetch failed, using local ledger:', sbErr);
    }
  } else {
    payments = PaymentService.getPayments(requestingUser);
  }

  return NextResponse.json({
    payments,
    referenceCodeProposal: PaymentService.generateReferenceCode(),
    source: isServerSupabaseConfigured ? 'supabase' : 'cache',
  });
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const user = AuthService.getCurrentUser(userId) || (db.users[0] as any);

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
      receiptUrl: validated.receiptUrl,
    });

    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        await supabaseServer.from('payments').insert({
          user_id: user.id.includes('-') ? user.id : null,
          reference_code: payment.referenceCode,
          tier: payment.tier,
          amount: payment.amount,
          currency: 'LKR',
          bank_name: payment.bankName,
          transfer_date: payment.transferDate,
          sender_account_name: payment.senderAccountName,
          receipt_notes: payment.receiptNotes,
          receipt_url: payment.receiptUrl || validated.receiptUrl || null,
          status: 'pending',
          created_at: new Date().toISOString(),
        });
      } catch (insertErr) {
        console.warn('Supabase payment insert failed, cached locally:', insertErr);
      }
    }

    return NextResponse.json({ success: true, payment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Validation failed' },
      { status: 400 }
    );
  }
}
