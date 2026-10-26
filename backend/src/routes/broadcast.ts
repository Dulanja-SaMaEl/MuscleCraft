import { Router, Request, Response } from 'express';
import { db } from '../db/mock-db';
import { BroadcastMessageSchema } from '../validation';

const router = Router();

// GET /api/broadcast
router.get('/', (req: Request, res: Response) => {
  return res.json({ broadcasts: db.broadcastMessages || [] });
});

// POST /api/broadcast
router.post('/', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || req.body.adminId || 'usr_admin_1';
  const caller = db.users.find((u) => u.id === userId);

  if (!caller || caller.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized: Admin access required' });
  }

  const parsed = BroadcastMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
  }

  const data = parsed.data;
  let recipientCount = db.users.filter((u) => u.role === 'client').length;
  if (data.audience === 'coaching_90_vip') {
    recipientCount = 19;
  } else if (data.audience === 'sole_members') {
    recipientCount = 42;
  } else if (data.audience === 'couple_members') {
    recipientCount = 23;
  } else if (data.audience === 'specific_client') {
    recipientCount = 1;
  }

  const newBroadcast = {
    id: `bc_${Date.now()}`,
    title: data.title,
    body: data.body,
    senderName: caller.name,
    audience: data.audience,
    targetClientId: data.targetClientId,
    targetClientName: data.targetClientName,
    channels: data.channels,
    priority: data.priority,
    createdAt: new Date().toISOString(),
    status: 'sent',
    recipientCount,
  };

  if (!db.broadcastMessages) {
    db.broadcastMessages = [];
  }
  db.broadcastMessages.unshift(newBroadcast);

  return res.status(201).json({ success: true, broadcast: newBroadcast });
});

export default router;
