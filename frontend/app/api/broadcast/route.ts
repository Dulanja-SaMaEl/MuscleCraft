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
            audience: b.target_audience,
            sentAt: b.created_at,
            senderName: b.sender_name,
            channels: b.channels || ['in_app'],
            sentCount: b.sent_count || 1,
            status: b.status || 'sent',
          }));
        }
      } catch (err) {
        console.warn('Supabase broadcast fetch error:', err);
      }
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

    let recipientCount = db.users.filter((u) => u.role === 'client').length || 25;
    if (validated.audience === 'coaching_90_vip') {
      recipientCount = db.users.filter((u) => u.tier === 'coaching_90').length || 19;
    } else if (validated.audience === 'sole_members') {
      recipientCount = db.users.filter((u) => u.tier?.startsWith('sole')).length || 42;
    } else if (validated.audience === 'couple_members') {
      recipientCount = db.users.filter((u) => u.tier?.startsWith('couple')).length || 23;
    } else if (validated.audience === 'specific_client') {
      recipientCount = 1;
    }

    const newBroadcast = {
      id: `bc_${Date.now()}`,
      title: validated.title,
      body: validated.body,
      audience: validated.audience,
      targetClientId: validated.targetClientId,
      sentAt: new Date().toISOString(),
      senderId: caller.id,
      senderName: caller.name,
      channels: validated.channels || ['in_app'],
      sentCount: recipientCount,
      status: 'sent',
    };

    if (!db.broadcastMessages) {
      db.broadcastMessages = [];
    }
    db.broadcastMessages.unshift(newBroadcast as any);

    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        await supabaseServer.from('broadcast_messages').insert({
          title: newBroadcast.title,
          body: newBroadcast.body,
          target_audience: validated.audience.includes('coaching') ? 'coaching_90' : 'all',
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
