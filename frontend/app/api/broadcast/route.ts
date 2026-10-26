import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/mock-db';
import { AuthService } from '@/lib/services/auth-service';
import { BroadcastMessageSchema } from '@/lib/validation';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId');
    const caller = AuthService.getCurrentUser(adminId);

    if (!caller || caller.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    return NextResponse.json({
      broadcasts: db.broadcastMessages || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId');
    const caller = AuthService.getCurrentUser(adminId);

    if (!caller || caller.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const validated = BroadcastMessageSchema.parse(body);

    // Calculate recipient count dynamically
    let recipientCount = db.users.filter((u) => u.role === 'client').length;
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
      senderName: caller.name,
      audience: validated.audience,
      targetClientId: validated.targetClientId,
      targetClientName: validated.targetClientName,
      channels: validated.channels,
      priority: validated.priority,
      createdAt: new Date().toISOString(),
      status: 'sent',
      recipientCount,
    };

    if (!db.broadcastMessages) {
      db.broadcastMessages = [];
    }
    db.broadcastMessages.unshift(newBroadcast);

    // Audit log entry
    db.auditLogs.unshift({
      id: `log_${Date.now()}`,
      actorId: caller.id,
      actorEmail: caller.email,
      action: 'BROADCAST_SENT',
      targetType: 'broadcast',
      targetId: newBroadcast.id,
      details: `Broadcast "${newBroadcast.title}" dispatched to ${recipientCount} recipients via [${newBroadcast.channels.join(', ')}].`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, broadcast: newBroadcast }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
