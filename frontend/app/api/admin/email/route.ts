import { NextRequest, NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { EmailService, InboundEmailRecord } from '@/lib/services/email-service';
import { supabaseServer, isServerSupabaseConfigured, resolveServerUser } from '@/lib/supabase/server';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/email?adminId=...
 * Returns live Resend Gateway status + received inbound emails inbox.
 */
export async function GET(req: NextRequest) {
  noStore();
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId');
    const caller = await resolveServerUser(adminId);

    if (caller.role !== 'admin' && caller.role !== 'instructor') {
      return NextResponse.json({ error: 'Forbidden: Administrative credentials required.' }, { status: 403 });
    }

    const gateway = await EmailService.getGatewayStatus();
    let inbox: InboundEmailRecord[] = [...EmailService.getInboundFallback()];

    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        const { data: rows } = await supabaseServer
          .from('audit_logs')
          .select('id, details, created_at')
          .eq('action', 'INBOUND_EMAIL_RECEIVED')
          .order('created_at', { ascending: false })
          .limit(30);

        if (rows && rows.length > 0) {
          const parsedRows: InboundEmailRecord[] = [];
          for (const row of rows) {
            try {
              const obj = typeof row.details === 'string' ? JSON.parse(row.details) : row.details;
              if (obj && (obj.from || obj.subject)) {
                parsedRows.push({
                  id: String(row.id),
                  resendEmailId: obj.resendEmailId || String(row.id),
                  from: obj.from || 'Unknown Sender',
                  to: Array.isArray(obj.to) ? obj.to : [obj.to || gateway.adminEmail],
                  subject: obj.subject || '(No Subject)',
                  text: obj.text || '',
                  html: obj.html,
                  receivedAt: obj.receivedAt || row.created_at,
                  replied: Boolean(obj.replied),
                });
              }
            } catch (_) {}
          }
          if (parsedRows.length > 0) {
            inbox = parsedRows;
          }
        }
      } catch (err) {
        console.warn('Supabase inbound inbox load warning:', err);
      }
    }

    return NextResponse.json({
      success: true,
      gateway,
      inbox,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch email gateway status' }, { status: 500 });
  }
}

/**
 * POST /api/admin/email?adminId=...
 * Dispatches a Test Email or a Direct Reply to a received email via Resend.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit('admin_email', ip, 15, 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: `Rate limit reached. Try again in ${rate.retryAfterSeconds}s.` },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId');
    const caller = await resolveServerUser(adminId);

    if (caller.role !== 'admin' && caller.role !== 'instructor') {
      return NextResponse.json({ error: 'Forbidden: Administrative credentials required.' }, { status: 403 });
    }

    const body = await req.json();
    const { to, subject, message, mode = 'test' } = body;

    if (!to || typeof to !== 'string' || !to.includes('@')) {
      return NextResponse.json({ error: 'Valid recipient email address is required.' }, { status: 400 });
    }

    const cleanSubject =
      typeof subject === 'string' && subject.trim().length > 0
        ? subject.trim()
        : 'MuscleCraft Email Gateway Verification (Resend)';

    const cleanMessage =
      typeof message === 'string' && message.trim().length > 0
        ? message.trim()
        : 'This is a live test email dispatched from the MuscleCraft Admin Portal via Resend.';

    const sendRes = await EmailService.sendBroadcastEmail({
      recipients: [to.trim()],
      title: cleanSubject,
      body: cleanMessage,
      priority: 'normal',
    });

    if (!sendRes.success) {
      return NextResponse.json(
        {
          success: false,
          error: sendRes.error || 'Resend email dispatch failed.',
          fromEmail: EmailService.getFromEmail(),
          status: sendRes.status,
        },
        { status: sendRes.status === 'unconfigured' ? 400 : 502 }
      );
    }

    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        await supabaseServer.from('audit_logs').insert({
          actor_id: caller.id.includes('-') ? caller.id : null,
          actor_email: caller.email || 'musclecraftlk@gmail.com',
          action: mode === 'reply' ? 'DISPATCH_EMAIL_REPLY' : 'DISPATCH_TEST_EMAIL',
          target_type: 'email_gateway',
          target_id: to.trim(),
          details: JSON.stringify({
            recipient: to.trim(),
            subject: cleanSubject,
            status: sendRes.status,
            messageId: sendRes.messageId || null,
          }),
        });
      } catch (_) {}
    }

    return NextResponse.json({
      success: true,
      result: sendRes,
      message: `Email successfully delivered to ${to.trim()} via Resend! (ID: ${sendRes.messageId || 'accepted'})`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to dispatch email.' }, { status: 500 });
  }
}
