import { Router, Request, Response } from 'express';
import { db } from '../db/mock-db';

const router = Router();

// GET /api/diet-plans
router.get('/', (req: Request, res: Response) => {
  const clientId = req.query.clientId as string | undefined;
  if (!clientId) {
    return res.status(400).json({ error: 'Missing clientId query parameter' });
  }

  const plan = db.dietPlans.find((p) => p.userId === clientId && p.active) || null;
  return res.json({ dietPlan: plan });
});

// POST /api/diet-plans
router.post('/', (req: Request, res: Response) => {
  try {
    const { userId, title, dailyCalories, proteinGrams, carbsGrams, fatGrams, notes } = req.body;
    if (!userId || !title || !dailyCalories) {
      return res.status(400).json({ error: 'Missing required diet plan fields' });
    }

    // Deactivate previous plans for user
    db.dietPlans.forEach((p) => {
      if (p.userId === userId) p.active = false;
    });

    const newPlan = {
      id: `diet_${Date.now()}`,
      userId,
      title,
      dailyCalories,
      proteinGrams: proteinGrams || 150,
      carbsGrams: carbsGrams || 200,
      fatGrams: fatGrams || 60,
      notes: notes || '',
      active: true,
      createdAt: new Date().toISOString(),
    };

    db.dietPlans.push(newPlan);
    return res.status(201).json({ success: true, dietPlan: newPlan });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create diet plan' });
  }
});

export default router;
