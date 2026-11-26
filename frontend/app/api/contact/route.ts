import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { EmailService } from '@/lib/services/email-service';
import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabase/server';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

const ContactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name.').max(120),
  email: z.string().trim().email('Please provide a valid email address.').max(160),
  phone: z.string().trim().max(40).optional().default(''),
  subject: z.string().trim().min(2).max(160).default('General Inquiry'),
  message: z.string().trim().min(10, 'Please enter a message of at least 10 characters.').max(3000),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit('contact_form', ip, 5, 10 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: `Too many inquiries submitted. Please try again in ${rate.retryAfterSeconds}s.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = ContactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid inquiry submission.' },
        { status: 400 }
      );
    }

    const { name, email, phone, subject, message } = parsed.data;
    const emailRes = await EmailService.sendContactInquiry({
      name,
      email,
      phone,
      subject,
      message,
    });

    // Record in Supabase audit_logs + inbound fallback so Admin sees website inquiries in Inbox too
    const inquiryRecord = {
      id: `inq_${Date.now()}`,
      resendEmailId: emailRes.messageId || `web_${Date.now()}`,
      from: `${name} <${email}>`,
      to: [EmailService.getAdminEmail()],
      subject: `[Web Contact] ${subject}`,
      text: `${message}${phone ? `\n\nPhone / WhatsApp: ${phone}` : ''}`,
      receivedAt: new Date().toISOString(),
    };
    EmailService.addInboundFallback(inquiryRecord);

    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        await supabaseServer.from('audit_logs').insert({
          actor_id: null,
          actor_email: email,
          action: 'INBOUND_EMAIL_RECEIVED',
          target_type: 'inbound_email',
          target_id: inquiryRecord.id,
          details: JSON.stringify(inquiryRecord),
        });
      } catch (err) {
        console.warn('Contact inquiry audit log error:', err);
      }
    }

    return NextResponse.json({
      success: true,
      delivered: emailRes.success,
      message: 'Your inquiry has been transmitted to Coach Adeesha. A confirmation email has been sent to your inbox.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to submit inquiry.' }, { status: 500 });
  }
}
