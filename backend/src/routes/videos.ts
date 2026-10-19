import { Router, Request, Response } from 'express';
import { VideoService } from '../services/video-service';

const router = Router();

// GET /api/videos
router.get('/', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
  const category = req.query.category as string | undefined;

  const videos = VideoService.getVideosForUser(userId, category);
  return res.json({ videos });
});

export default router;
