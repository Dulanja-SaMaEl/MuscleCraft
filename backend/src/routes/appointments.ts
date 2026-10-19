import { Router, Request, Response } from 'express';
import { db } from '../db/mock-db';
import { CoachingService } from '../services/coaching-service';

const router = Router();

// GET /api/appointments
router.get('/', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId parameter' });
  }

  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  try {
    const appointments = CoachingService.getAppointments(user);
    return res.json({ appointments });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch appointments' });
  }
});

// POST /api/appointments
router.post('/', (req: Request, res: Response) => {
  try {
    const requesterId = (req.headers['x-user-id'] as string) || req.body.userId || req.body.clientId;
    if (!requesterId) {
      return res.status(401).json({ error: 'Missing user authentication' });
    }

    const caller = db.users.find((u) => u.id === requesterId);
    if (!caller) {
      return res.status(404).json({ error: 'Caller user not found' });
    }

    const { title, instructorId, type, scheduledAt, clientId, durationMinutes, meetingLink, notes } = req.body;
    if (!instructorId || !type || !scheduledAt) {
      return res.status(400).json({ error: 'Missing required appointment fields' });
    }

    const appt = CoachingService.scheduleAppointment(caller, {
      title: title || (type === 'group_coaching' ? 'Group Performance Masterclass' : '1-on-1 Consultation'),
      type: type === 'group_coaching' ? 'group_coaching' : 'individual_consultation',
      instructorId,
      clientId: clientId || (caller.role === 'client' ? caller.id : undefined),
      scheduledAt,
      durationMinutes: durationMinutes ? Number(durationMinutes) : 60,
      meetingLink,
      notes,
    });

    return res.status(201).json({ success: true, appointment: appt });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to schedule appointment' });
  }
});

export default router;

