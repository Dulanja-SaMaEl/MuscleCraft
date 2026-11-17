import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/services/payment-service';
import { SubmitBankTransferSchema } from '@/lib/validation';
import {
  supabaseServer,
  isServerSupabaseConfigured,
  resolveServerUser,
} from '@/lib/supabase/server';
import { db } from '@/lib/db/mock-db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const requestingUser = await resolveServerUser(userId);
  const isStaff = requestingUser.role === 'admin' || requestingUser.role === 'instructor';

  // Fail closed for unauthenticated / banned requests
  if (!isStaff && (!userId || requestingUser.id === 'anon_client')) {
    return NextResponse.json({ error: 'Unauthorized: Sign in to view your transfer records.' }, { status: 401 });
  }

  let payments: any[] = [];

  if (isServerSupabaseConfigured && supabaseServer) {
    try {
      let query = supabaseServer.from('payments').select('*').order('created_at', { ascending: false });
      if (!isStaff) {
        query = query.eq('user_id', requestingUser.id);
      }
      const { data, error } = await query;
      if (!error && data) {
        const mapped = data.map((p: any) => ({
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

        // Double-enforce strict ownership filter on non-staff responses
        payments = isStaff ? mapped : mapped.filter((p) => p.userId === requestingUser.id);
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
    const user = await resolveServerUser(userId);

    if (!userId || user.id === 'anon_client') {
      return NextResponse.json(
        { error: 'Please register or sign in before submitting a bank transfer.' },
        { status: 401 }
      );
    }

    if (user.status === 'suspended') {
      return NextResponse.json(
        { error: 'Your account has been suspended. Please contact Coach Adeesha.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validated = SubmitBankTransferSchema.parse(body);

    // Compute accurate amount from Supabase gym_packages if available
    let priceInfo = PaymentService.getTierPrice(validated.tier);
    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        const { data: pkg } = await supabaseServer
          .from('gym_packages')
          .select('id, name, price, admission_fee')
          .eq('id', validated.tier)
          .maybeSingle();
        if (pkg) {
          priceInfo = {
            amount: Number(pkg.price) + Number(pkg.admission_fee || 0),
            packagePrice: Number(pkg.price),
            admissionFee: Number(pkg.admission_fee || 0),
            name: pkg.name,
          };
        }
      } catch (_) {}
    }

    // Build payment record & sync into mock cache for fallback parity
    const payment: any = {
      id: `pay_${Date.now()}`,
      userId: user.id,
      userName: user.name || validated.senderAccountName,
      userEmail: user.email || '',
      referenceCode: validated.referenceCode,
      tier: validated.tier,
      packageName: priceInfo.name,
      packageAmount: priceInfo.packagePrice,
      admissionFee: priceInfo.admissionFee,
      amount: priceInfo.amount,
      currency: 'LKR',
      bankName: validated.bankName,
      transferDate: validated.transferDate,
      senderAccountName: validated.senderAccountName,
      receiptNotes: validated.receiptNotes,
      receiptUrl: validated.receiptUrl,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    db.payments.unshift(payment);

    if (isServerSupabaseConfigured && supabaseServer) {
      const { data: inserted, error: insertErr } = await supabaseServer
        .from('payments')
        .insert({
          user_id: user.id,
          reference_code: payment.referenceCode,
          package_id: validated.tier,
          tier: payment.tier,
          amount: payment.amount,
          currency: 'LKR',
          bank_name: payment.bankName,
          transfer_date: payment.transferDate,
          sender_account_name: payment.senderAccountName,
          receipt_notes: payment.receiptNotes || null,
          receipt_url: payment.receiptUrl || null,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select('*')
        .maybeSingle();

      if (insertErr) {
        console.error('Supabase payment insert failed:', insertErr);
        return NextResponse.json(
          { error: `Failed to record bank transfer: ${insertErr.message}` },
          { status: 400 }
        );
      }

      if (inserted) {
        payment.id = inserted.id;
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
