import { Router, Request, Response } from 'express';
import { AdminService } from '../services/admin-service';

const router = Router();

// GET /api/admin/stats
router.get('/stats', (req: Request, res: Response) => {
  const adminId = (req.headers['x-user-id'] as string) || (req.query.adminId as string);
  if (!adminId) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
  }

  try {
    const stats = AdminService.getFacilityStats(adminId);
    return res.json(stats);
  } catch (error: any) {
    return res.status(403).json({ error: error.message || 'Access denied' });
  }
});

// GET /api/admin/members
router.get('/members', (req: Request, res: Response) => {
  const adminId = (req.headers['x-user-id'] as string) || (req.query.adminId as string);
  if (!adminId) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
  }

  try {
    const members = AdminService.getAllMembers(adminId);
    return res.json({ members });
  } catch (error: any) {
    return res.status(403).json({ error: error.message || 'Access denied' });
  }
});

// GET /api/admin/audit-logs
router.get('/audit-logs', (req: Request, res: Response) => {
  const adminId = (req.headers['x-user-id'] as string) || (req.query.adminId as string);
  if (!adminId) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
  }

  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const logs = AdminService.getAuditLogs(adminId, limit);
    return res.json({ logs });
  } catch (error: any) {
    return res.status(403).json({ error: error.message || 'Access denied' });
  }
});

export default router;
