import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth-service';
import { db } from '../db/mock-db';

const router = Router();

// GET /api/auth/session
router.get('/session', (req: Request, res: Response) => {
  const userId = req.query.userId as string | undefined;
  const user = AuthService.getCurrentUser(userId);

  return res.json({
    user,
    availablePersonas: db.users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      tier: u.tier,
      status: u.status,
    })),
  });
});

// POST /api/auth/session
router.post('/session', (req: Request, res: Response) => {
  try {
    const { email, personaId } = req.body;
    let user = null;

    if (personaId) {
      user = db.users.find((u) => u.id === personaId) || null;
    } else if (email) {
      user = AuthService.authenticate(email);
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ success: true, user });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Authentication error' });
  }
});

export default router;
