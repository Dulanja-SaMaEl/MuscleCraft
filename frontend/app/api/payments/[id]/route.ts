import { NextRequest, NextResponse } from 'next/server';
import {
  supabaseServer,
  isServerSupabaseConfigured,
  resolveServerUser,
} from '@/lib/supabase/server';
import { db } from '@/lib/db/mock-db';

/**
 * Allows the transfer owner (or admin) to attach or update a bank transfer receipt URL
 * right after the transaction record has been created.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const caller = await resolveServerUser(userId);

    if (!userId || caller.id === 'anon_client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { receiptUrl, receiptNotes } = body;
    if (!receiptUrl || typeof receiptUrl !== 'string') {
      return NextResponse.json({ error: 'Missing uploaded receipt URL.' }, { status: 400 });
    }

    const isAdmin = caller.role === 'admin';

    if (isServerSupabaseConfigured && supabaseServer) {
      const { data: existing, error: findErr } = await supabaseServer
        .from('payments')
        .select('*')
        .or(`id.eq.${params.id},reference_code.eq.${params.id}`)
        .maybeSingle();

      if (findErr || !existing) {
        return NextResponse.json({ error: 'Transaction record not found.' }, { status: 404 });
      }

      if (!isAdmin && existing.user_id !== caller.id) {
        return NextResponse.json(
          { error: 'Forbidden: You may only attach receipts to your own transfers.' },
          { status: 403 }
        );
      }

      const updateFields: Record<string, any> = { receipt_url: receiptUrl };
      if (typeof receiptNotes === 'string' && receiptNotes.trim()) {
        updateFields.receipt_notes = receiptNotes.trim();
      }

      const { data: updated, error: updErr } = await supabaseServer
        .from('payments')
        .update(updateFields)
        .eq('id', existing.id)
        .select('*')
        .single();

      if (updErr) {
        return NextResponse.json({ error: updErr.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        payment: {
          id: updated.id,
          userId: updated.user_id,
          referenceCode: updated.reference_code,
          receiptUrl: updated.receipt_url,
          status: updated.status,
        },
      });
    }

    const localPay = db.payments.find((p) => p.id === params.id || p.referenceCode === params.id);
    if (!localPay) {
      return NextResponse.json({ error: 'Transaction record not found.' }, { status: 404 });
    }
    if (!isAdmin && localPay.userId !== caller.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    localPay.receiptUrl = receiptUrl;
    if (receiptNotes) localPay.receiptNotes = receiptNotes;

    return NextResponse.json({ success: true, payment: localPay });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to attach receipt.' }, { status: 400 });
  }
}
