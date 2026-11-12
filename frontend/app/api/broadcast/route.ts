import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/mock-db';
import { AuthService } from '@/lib/services/auth-service';
import { BroadcastMessageSchema } from '@/lib/validation';
import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    let broadcasts = db.broadcastMessages || [];

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
            audience: b.target_audience || 'all_members',
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
    const caller = AuthService.getCurrentUser(adminId) || ({ id: 'usr_admin_1', name: 'Adeesha Kumarasingha (Head Coach)', role: 'admin' } as any);

    const body = await req.json();
    const validated = BroadcastMessageSchema.parse(body);

    // Calculate real recipient count from live database members
    let clientProfiles: any[] = [];
    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        const { data } = await supabaseServer
          .from('profiles')
          .select('id, role, tier, package_type, package_name')
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

    let recipientCount = clientProfiles.length;
    if (validated.audience === 'coaching_90_vip') {
      recipientCount = clientProfiles.filter(
        (p) =>
          p.tier === 'coaching_90' ||
          p.package_type === 'coaching' ||
          p.packageType === 'coaching' ||
          p.package_name?.toLowerCase().includes('coaching') ||
          p.packageName?.toLowerCase().includes('coaching')
      ).length;
    } else if (validated.audience === 'sole_members') {
      recipientCount = clientProfiles.filter(
        (p) =>
          p.tier?.startsWith('sole') ||
          p.package_type === 'sole' ||
          p.packageType === 'sole' ||
          p.package_name?.toLowerCase().includes('sole') ||
          p.packageName?.toLowerCase().includes('sole')
      ).length;
    } else if (validated.audience === 'couple_members') {
      recipientCount = clientProfiles.filter(
        (p) =>
          p.tier?.startsWith('couple') ||
          p.package_type === 'couple' ||
          p.packageType === 'couple' ||
          p.package_name?.toLowerCase().includes('couple') ||
          p.packageName?.toLowerCase().includes('couple')
      ).length;
    } else if (validated.audience === 'specific_client') {
      recipientCount = 1;
    }

    const nowIso = new Date().toISOString();
    const newBroadcast = {
      id: `bc_${Date.now()}`,
      title: validated.title,
      body: validated.body,
      audience: validated.audience,
      targetClientId: validated.targetClientId,
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
        const targetAudienceValue =
          validated.audience === 'coaching_90_vip'
            ? 'coaching_90'
            : validated.audience === 'sole_members'
            ? 'sole'
            : validated.audience === 'couple_members'
            ? 'couple'
            : validated.audience === 'specific_client'
            ? 'direct'
            : 'all';

        await supabaseServer.from('broadcast_messages').insert({
          title: newBroadcast.title,
          body: newBroadcast.body,
          target_audience: targetAudienceValue,
          sender_name: caller.name,
          channels: newBroadcast.channels,
          sent_count: newBroadcast.sentCount,
          status: 'sent',
          created_at: newBroadcast.sentAt,
        });
      } catch (err) {
        console.warn('Supabase broadcast insert error:', err);
      }
    }

    return NextResponse.json({
      success: true,
      broadcast: newBroadcast,
      recipientCount,
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
