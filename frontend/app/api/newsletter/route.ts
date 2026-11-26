import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { EmailService } from '@/lib/services/email-service';
import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabase/server';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

const NewsletterSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.').max(160),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit('newsletter', ip, 5, 10 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: `Please wait ${rate.retryAfterSeconds}s before subscribing again.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = NewsletterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid email address.' },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase();
    await EmailService.notifyNewsletterWelcome({ email });

    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        await supabaseServer.from('audit_logs').insert({
          actor_id: null,
          actor_email: email,
          action: 'NEWSLETTER_SUBSCRIBED',
          target_type: 'newsletter',
          target_id: email,
          details: `Subscribed ${email} to the MuscleCraft Athletic Cohort dispatch.`,
        });
      } catch (_) {}
    }

    return NextResponse.json({
      success: true,
      message: 'You are subscribed! Welcome email dispatched to your inbox.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Subscription failed.' }, { status: 500 });
  }
}
