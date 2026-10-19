import { Router, Request, Response } from 'express';
import { CoachingService } from '../services/coaching-service';
import { AddMeasurementSchema } from '../validation';
import { db } from '../db/mock-db';

const router = Router();

// GET /api/measurements
router.get('/', (req: Request, res: Response) => {
  const targetClientId = req.query.clientId as string | undefined;
  const requesterId = (req.headers['x-user-id'] as string) || (req.query.requesterId as string);

  if (!requesterId || !targetClientId) {
    return res.status(400).json({ error: 'Missing requesterId or clientId parameter' });
  }

  const requester = db.users.find((u) => u.id === requesterId);
  if (!requester) {
    return res.status(401).json({ error: 'User not found' });
  }

  try {
    const measurements = CoachingService.getMeasurements(requester, targetClientId);
    return res.json({ measurements });
  } catch (error: any) {
    const status = error.message.includes('Forbidden') ? 403 : 400;
    return res.status(status).json({ error: error.message });
  }
});

// POST /api/measurements
router.post('/', (req: Request, res: Response) => {
  const requesterId = (req.headers['x-user-id'] as string) || req.body.requesterId;
  const targetClientId = req.body.clientId || requesterId;

  if (!requesterId) {
    return res.status(401).json({ error: 'Unauthorized: missing user authentication' });
  }

  const requester = db.users.find((u) => u.id === requesterId);
  if (!requester) {
    return res.status(401).json({ error: 'User not found' });
  }

  const parsed = AddMeasurementSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
  }

  try {
    const measurement = CoachingService.addMeasurement(requester, {
      ...parsed.data,
      userId: targetClientId,
    });
    return res.status(201).json({ success: true, measurement });
  } catch (error: any) {
    const status = error.message.includes('Forbidden') ? 403 : 400;
    return res.status(status).json({ error: error.message });
  }
});

export default router;
