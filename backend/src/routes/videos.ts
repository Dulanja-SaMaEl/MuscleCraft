import { Router, Request, Response } from 'express';
import { db } from '../db/mock-db';
import { VideoService } from '../services/video-service';

const router = Router();

// GET /api/videos
router.get('/', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
  const category = req.query.category as string | undefined;

  let caller = userId ? db.users.find((u) => u.id === userId) : null;
  if (!caller) {
    // Guest or unauthenticated client defaults to public tier
    caller = {
      id: 'guest',
      email: 'guest@musclecraft.lk',
      name: 'Guest Athlete',
      role: 'client' as const,
      tier: 'none' as const,
      status: 'active' as const,
      joinedAt: new Date().toISOString(),
    };
  }

  let videos = VideoService.getPermittedVideos(caller);
  if (category && category !== 'All') {
    videos = videos.filter((v) => v.category.toLowerCase() === category.toLowerCase());
  }

  return res.json({ videos });
});

export default router;

