import { Router, Request, Response } from 'express';
import { db } from '../db/mock-db';

const router = Router();

// GET /api/appointments
router.get('/', (req: Request, res: Response) => {
  const userId = req.query.userId as string | undefined;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId query parameter' });
  }

  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  let appointments = db.appointments;
  if (user.role === 'client') {
    appointments = db.appointments.filter((a) => a.clientId === userId);
  } else if (user.role === 'instructor') {
    appointments = db.appointments.filter((a) => a.instructorId === userId);
  }

  return res.json({ appointments });
});

// POST /api/appointments
router.post('/', (req: Request, res: Response) => {
  try {
    const { clientId, instructorId, type, scheduledAt, notes } = req.body;
    if (!clientId || !instructorId || !type || !scheduledAt) {
      return res.status(400).json({ error: 'Missing required appointment fields' });
    }

    const newAppt = {
      id: `appt_${Date.now()}`,
      clientId,
      instructorId,
      type,
      scheduledAt,
      status: 'scheduled' as const,
      notes: notes || '',
      createdAt: new Date().toISOString(),
    };

    db.appointments.push(newAppt);
    return res.status(201).json({ success: true, appointment: newAppt });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to schedule appointment' });
  }
});

export default router;
