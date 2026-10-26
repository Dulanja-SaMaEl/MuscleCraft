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

// POST /api/videos (Upload / Submit session video)
router.post('/', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string) || req.body.userId;
  const caller = db.users.find((u) => u.id === userId);

  if (!caller) {
    return res.status(401).json({ error: 'Unauthorized: User not found' });
  }

  try {
    const video = VideoService.addVideo(caller, req.body);
    return res.status(201).json({ success: true, video });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

// DELETE /api/videos/:id
router.delete('/:id', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
  const caller = db.users.find((u) => u.id === userId);

  if (!caller) {
    return res.status(401).json({ error: 'Unauthorized: User not found' });
  }

  try {
    VideoService.deleteVideo(caller, req.params.id);
    return res.json({ success: true, message: 'Video deleted' });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

export default router;

