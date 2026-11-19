import { NextRequest, NextResponse } from 'next/server';
import { SmsService } from '@/lib/services/sms-service';
import { resolveServerUser, supabaseServer, isServerSupabaseConfigured } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId');
    const caller = await resolveServerUser(adminId);

    if (caller.role !== 'admin' && caller.role !== 'instructor') {
      return NextResponse.json(
        { error: 'Forbidden: Admin or coach permissions required.' },
        { status: 403 }
      );
    }

    const gatewayStatus = await SmsService.getGatewayStatus();

    return NextResponse.json({
      success: true,
      gateway: gatewayStatus,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to check SMS gateway' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId');
    const caller = await resolveServerUser(adminId);

    if (caller.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can dispatch test SMS messages.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { phone, message } = body;

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { error: 'Please provide a valid recipient phone number.' },
        { status: 400 }
      );
    }

    const textMessage =
      message && typeof message === 'string' && message.trim()
        ? message.trim()
        : 'MuscleCraft SMS Gateway Test: Your Text.lk integration is ONLINE and working properly with sender ID "Musclecraft".';

    const sendRes = await SmsService.sendSms({
      to: phone,
      message: textMessage,
    });

    if (!sendRes.success) {
      return NextResponse.json(
        { error: sendRes.error || 'Failed to dispatch test SMS', details: sendRes.rawResponse },
        { status: 400 }
      );
    }

    // Record in audit log if Supabase is active
    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        await supabaseServer.from('audit_logs').insert({
          actor_id: caller.id,
          actor_email: caller.email,
          action: 'DISPATCH_TEST_SMS',
          target_type: 'sms_gateway',
          target_id: phone,
          details: {
            recipient: phone,
            senderId: SmsService.getSenderId(),
            status: sendRes.status,
          },
        });
      } catch (_) {}
    }

    return NextResponse.json({
      success: true,
      message: `Test SMS successfully dispatched to ${phone} via Text.lk (Sender: ${SmsService.getSenderId()}).`,
      result: sendRes,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Server error while dispatching SMS' },
      { status: 500 }
    );
  }
}
