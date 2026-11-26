import { NextRequest, NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { db } from '@/lib/db/mock-db';
import { AuthService } from '@/lib/services/auth-service';
import { BroadcastMessageSchema } from '@/lib/validation';
import { supabaseServer, isServerSupabaseConfigured, resolveServerUser } from '@/lib/supabase/server';
import { SmsService } from '@/lib/services/sms-service';
import { EmailService } from '@/lib/services/email-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  noStore();
  try {
    let broadcasts = db.broadcastMessages || [];
    let gatewayStatus = null;

    try {
      gatewayStatus = await SmsService.getGatewayStatus();
    } catch (_) {}

    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        const { data, error } = await supabaseServer
          .from('broadcast_messages')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          broadcasts = data.map((b: any) => ({
            id: b.id,
            title: b.title,
            body: b.body,
            audience:
              b.target_audience === 'coaching_90'
                ? 'coaching_90_vip'
                : b.target_audience === 'members_only'
                ? 'sole_members'
                : b.target_audience === 'clients_only'
                ? 'specific_client'
                : 'all_members',
            targetAudience: b.target_audience,
            sentAt: b.created_at,
            createdAt: b.created_at,
            created_at: b.created_at,
            senderName: b.sender_name || 'Coach Adeesha',
            channels: b.channels || ['in_app'],
            sentCount: b.sent_count ?? 1,
            recipientCount: b.sent_count ?? 1,
            status: b.status || 'sent',
          }));
        }
      } catch (err) {
        console.warn('Supabase broadcast fetch error:', err);
      }
    } else {
      broadcasts = broadcasts.map((b: any) => ({
        ...b,
        createdAt: b.createdAt || b.sentAt || new Date().toISOString(),
        sentAt: b.sentAt || b.createdAt || new Date().toISOString(),
        recipientCount: b.recipientCount ?? b.sentCount ?? 1,
        sentCount: b.sentCount ?? b.recipientCount ?? 1,
      }));
    }

    return NextResponse.json({
      broadcasts,
      gateway: gatewayStatus,
      source: isServerSupabaseConfigured ? 'supabase' : 'cache',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId');
    const caller = await resolveServerUser(adminId);

    if (caller.role !== 'admin' && caller.role !== 'instructor') {
      return NextResponse.json({ error: 'Forbidden: Only coaches and administrators can dispatch broadcasts.' }, { status: 403 });
    }

    const body = await req.json();
    const validated = BroadcastMessageSchema.parse(body);

    // Calculate real recipient count from live database members
    let clientProfiles: any[] = [];
    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        const { data } = await supabaseServer
          .from('profiles')
          .select('id, name, phone, email, role, tier, package_type, package_name')
          .eq('role', 'client');
        if (data && data.length > 0) {
          clientProfiles = data;
        }
      } catch (e) {
        console.warn('Supabase profiles query error for broadcast:', e);
      }
    }

    if (clientProfiles.length === 0) {
      clientProfiles = db.users.filter((u) => u.role === 'client');
    }

    let targetClients = clientProfiles;
    if (validated.audience === 'coaching_90_vip') {
      targetClients = clientProfiles.filter(
        (p) =>
          p.tier === 'coaching_90' ||
          p.package_type === 'coaching' ||
          p.packageType === 'coaching' ||
          p.package_name?.toLowerCase().includes('coaching') ||
          p.packageName?.toLowerCase().includes('coaching')
      );
    } else if (validated.audience === 'sole_members') {
      targetClients = clientProfiles.filter(
        (p) =>
          p.tier?.startsWith('sole') ||
          p.package_type === 'sole' ||
          p.packageType === 'sole' ||
          p.package_name?.toLowerCase().includes('sole') ||
          p.packageName?.toLowerCase().includes('sole')
      );
    } else if (validated.audience === 'couple_members') {
      targetClients = clientProfiles.filter(
        (p) =>
          p.tier?.startsWith('couple') ||
          p.package_type === 'couple' ||
          p.packageType === 'couple' ||
          p.package_name?.toLowerCase().includes('couple') ||
          p.packageName?.toLowerCase().includes('couple')
      );
    } else if (validated.audience === 'specific_client') {
      // 1. Match by targetClientId
      if (validated.targetClientId) {
        targetClients = clientProfiles.filter((p) => p.id === validated.targetClientId);
      }

      // 2. Direct Supabase query if ID not in memory cache
      if (targetClients.length === 0 && validated.targetClientId && isServerSupabaseConfigured && supabaseServer) {
        try {
          const { data: directProfile } = await supabaseServer
            .from('profiles')
            .select('id, name, phone, email, role, tier, package_type, package_name')
            .eq('id', validated.targetClientId)
            .maybeSingle();
          if (directProfile) {
            targetClients = [directProfile];
          }
        } catch (_) {}
      }

      // 3. Fallback matching by phone, email, or name
      if (targetClients.length === 0) {
        const targetPhone = validated.targetClientPhone || (body as any).targetClientPhone;
        const targetEmail = validated.targetClientEmail || (body as any).targetClientEmail;
        const targetName = validated.targetClientName?.trim().toLowerCase();

        targetClients = clientProfiles.filter((p) => {
          if (targetPhone && p.phone && SmsService.normalizePhoneNumber(p.phone) === SmsService.normalizePhoneNumber(targetPhone)) {
            return true;
          }
          if (targetEmail && p.email && p.email.toLowerCase() === targetEmail.toLowerCase()) {
            return true;
          }
          if (targetName && p.name && p.name.trim().toLowerCase() === targetName) {
            return true;
          }
          return false;
        });
      }

      // 4. Fallback if still unmatched: select first available client member
      if (targetClients.length === 0 && clientProfiles.length > 0) {
        targetClients = [clientProfiles[0]];
      }
    }

    const recipientCount = targetClients.length;

    // Dispatch real SMS via Text.lk if SMS channel is chosen
    let smsDispatchResult: any = null;
    if (validated.channels?.includes('sms') && targetClients.length > 0) {
      const phones = targetClients
        .map((c) => c.phone)
        .filter((p): p is string => Boolean(p && typeof p === 'string' && p.trim().length > 6));

      if (phones.length > 0) {
        const smsContent = `MuscleCraft: ${validated.title}\n${validated.body}`;
        try {
          smsDispatchResult = await SmsService.sendSms({
            to: phones,
            message: smsContent,
          });
        } catch (smsErr: any) {
          console.error('SMS Gateway broadcast error:', smsErr);
          smsDispatchResult = { success: false, error: smsErr.message };
        }
      } else {
        smsDispatchResult = { success: false, error: 'No phone numbers on file for selected audience' };
      }
    }

    // Dispatch real Email Blast via Resend if email channel is chosen
    let emailDispatchResult: any = null;
    if (validated.channels?.includes('email') && targetClients.length > 0) {
      const emails = targetClients
        .map((c) => c.email)
        .filter((e): e is string => Boolean(e && typeof e === 'string' && e.includes('@')));

      if (emails.length > 0) {
        try {
          emailDispatchResult = await EmailService.sendBroadcastEmail({
            recipients: emails,
            title: validated.title,
            body: validated.body,
            priority: validated.priority,
          });
        } catch (emailErr: any) {
          console.error('Resend Email broadcast error:', emailErr);
          emailDispatchResult = { success: false, error: emailErr.message };
        }
      } else {
        emailDispatchResult = { success: false, error: 'No valid email addresses on file for selected audience' };
      }
    }

    const nowIso = new Date().toISOString();
    const newBroadcast = {
      id: `bc_${Date.now()}`,
      title: validated.title,
      body: validated.body,
      audience: validated.audience,
      targetClientId: validated.targetClientId || targetClients[0]?.id,
      targetClientName: validated.targetClientName || targetClients[0]?.name,
      sentAt: nowIso,
      createdAt: nowIso,
      senderId: caller.id,
      senderName: caller.name,
      channels: validated.channels || ['in_app'],
      sentCount: recipientCount,
      recipientCount: recipientCount,
      status: 'sent',
    };

    if (!db.broadcastMessages) {
      db.broadcastMessages = [];
    }
    db.broadcastMessages.unshift(newBroadcast as any);

    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        // Must satisfy DB check: CHECK (target_audience IN ('all', 'clients_only', 'coaching_90', 'members_only'))
        const targetAudienceValue =
          validated.audience === 'coaching_90_vip'
            ? 'coaching_90'
            : validated.audience === 'sole_members'
            ? 'members_only'
            : validated.audience === 'couple_members'
            ? 'members_only'
            : validated.audience === 'specific_client'
            ? 'clients_only'
            : 'all';

        const { error: insertErr } = await supabaseServer.from('broadcast_messages').insert({
          title: newBroadcast.title,
          body: newBroadcast.body,
          target_audience: targetAudienceValue,
          sender_name: caller.name,
          channels: newBroadcast.channels,
          sent_count: newBroadcast.sentCount,
          status: 'sent',
          created_at: newBroadcast.sentAt,
        });

        if (insertErr) {
          console.error('Supabase broadcast_messages insert error:', insertErr);
        }

        // Audit log entry for SMS / Email broadcast
        if (validated.channels?.includes('sms') || validated.channels?.includes('email')) {
          await supabaseServer.from('audit_logs').insert({
            actor_id: caller.id,
            actor_email: caller.email,
            action: validated.channels?.includes('email') && !validated.channels?.includes('sms')
              ? 'DISPATCH_EMAIL_BROADCAST'
              : 'DISPATCH_SMS_BROADCAST',
            target_type: 'broadcast_announcement',
            target_id: newBroadcast.id,
            details: {
              title: newBroadcast.title,
              audience: validated.audience,
              targetAudienceDb: targetAudienceValue,
              recipientsCount: recipientCount,
              targetClients: targetClients.map((c) => ({ id: c.id, name: c.name, phone: c.phone, email: c.email })),
              smsResult: smsDispatchResult,
              emailResult: emailDispatchResult,
            },
          });
        }
      } catch (err) {
        console.warn('Supabase broadcast insert error:', err);
      }
    }

    return NextResponse.json({
      success: true,
      broadcast: newBroadcast,
      recipientCount,
      sms: smsDispatchResult,
      email: emailDispatchResult,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing broadcast id' }, { status: 400 });
    }

    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        await supabaseServer.from('broadcast_messages').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase broadcast delete error:', err);
      }
    }

    if (db.broadcastMessages) {
      db.broadcastMessages = db.broadcastMessages.filter((b: any) => b.id !== id);
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
