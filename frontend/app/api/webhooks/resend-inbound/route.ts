import { NextRequest, NextResponse } from 'next/server';
import { EmailService, InboundEmailRecord } from '@/lib/services/email-service';
import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabase/server';

/**
 * POST /api/webhooks/resend-inbound
 * Receives inbound emails forwarded by Resend (`email.received` webhook event).
 * Configure this URL in Resend Dashboard -> Webhooks -> Event: `email.received`:
 *   https://<your-domain>/api/webhooks/resend-inbound
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // Verify Svix signature when RESEND_WEBHOOK_SECRET is configured
    const sigCheck = EmailService.verifyWebhookSignature(rawBody, {
      svixId: req.headers.get('svix-id'),
      svixTimestamp: req.headers.get('svix-timestamp'),
      svixSignature: req.headers.get('svix-signature'),
    });

    if (!sigCheck.valid) {
      return NextResponse.json({ error: sigCheck.reason || 'Invalid webhook signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody || '{}');
    const eventType = payload?.type || 'email.received';
    const data = payload?.data || payload;

    // Only ingest inbound received events (acknowledge other webhook events cleanly with 200)
    if (eventType !== 'email.received' && !data?.from) {
      return NextResponse.json({ received: true, ignoredEvent: eventType });
    }

    const resendEmailId = String(data?.email_id || data?.id || `in_${Date.now()}`);
    let textBody = data?.text || '';
    let htmlBody = data?.html || '';
    let fromAddress = typeof data?.from === 'string' ? data.from : data?.from?.email || 'Unknown Sender';
    let toList = Array.isArray(data?.to) ? data.to : data?.to ? [String(data.to)] : [];
    let subject = data?.subject || '(No Subject)';

    // Resend's email.received webhook sends metadata first; fetch full body via Receiving API
    if (!textBody && !htmlBody && data?.email_id) {
      const fullEmail = await EmailService.fetchReceivedEmail(String(data.email_id));
      if (fullEmail) {
        textBody = fullEmail.text || '';
        htmlBody = fullEmail.html || '';
        if (fullEmail.from) fromAddress = fullEmail.from;
        if (fullEmail.to) toList = fullEmail.to;
        if (fullEmail.subject) subject = fullEmail.subject;
      }
    }

    const record: InboundEmailRecord = {
      id: `in_${Date.now()}`,
      resendEmailId,
      from: fromAddress,
      to: toList,
      subject,
      text: textBody || (htmlBody ? htmlBody.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '(Empty message body)'),
      html: htmlBody || undefined,
      receivedAt: data?.created_at || new Date().toISOString(),
    };

    EmailService.addInboundFallback(record);

    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        await supabaseServer.from('audit_logs').insert({
          actor_id: null,
          actor_email: fromAddress.slice(0, 160),
          action: 'INBOUND_EMAIL_RECEIVED',
          target_type: 'inbound_email',
          target_id: resendEmailId,
          details: JSON.stringify(record),
        });
      } catch (dbErr) {
        console.warn('Could not persist inbound email to Supabase:', dbErr);
      }
    }

    return NextResponse.json({ received: true, emailId: resendEmailId });
  } catch (error: any) {
    console.error('[Resend Inbound Webhook Error]:', error);
    return NextResponse.json({ error: error.message || 'Webhook processing error' }, { status: 400 });
  }
}
