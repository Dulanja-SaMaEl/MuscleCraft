import { Router, Request, Response } from 'express';
import { CoachingService } from '../services/coaching-service';
import { AuthService } from '../services/auth-service';
import { SaveDietPlanSchema } from '../validation';

const router = Router();

// GET /api/diet-plans
router.get('/', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
  const clientId = (req.query.clientId as string) || userId;
  if (!clientId) {
    return res.status(400).json({ error: 'Missing clientId query parameter' });
  }

  const caller = AuthService.getCurrentUser(userId || clientId);
  if (!caller) {
    return res.status(401).json({ error: 'User not found' });
  }

  try {
    const plan = CoachingService.getDietPlan(caller, clientId);
    return res.json({ dietPlan: plan });
  } catch (error: any) {
    return res.status(403).json({ error: error.message });
  }
});

// POST /api/diet-plans
router.post('/', (req: Request, res: Response) => {
  try {
    const userId = (req.headers['x-user-id'] as string) || req.body.instructorId;
    const caller = AuthService.getCurrentUser(userId);
    if (!caller) {
      return res.status(401).json({ error: 'Unauthorized: missing coach authentication' });
    }

    const parsed = SaveDietPlanSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
    }

    const plan = CoachingService.saveDietPlan(caller, parsed.data);
    return res.status(201).json({ success: true, dietPlan: plan });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to save diet plan' });
  }
});

export default router;
