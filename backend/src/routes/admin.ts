import { Router, Request, Response } from 'express';
import { AdminService } from '../services/admin-service';
import { AuthService } from '../services/auth-service';

const router = Router();

// GET /api/admin/stats
router.get('/stats', (req: Request, res: Response) => {
  const adminId = (req.headers['x-user-id'] as string) || (req.query.adminId as string);
  const adminUser = AuthService.getCurrentUser(adminId);
  if (!adminUser || adminUser.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
  }

  try {
    const stats = AdminService.getDashboardStats(adminUser);
    return res.json({ stats });
  } catch (error: any) {
    return res.status(403).json({ error: error.message || 'Access denied' });
  }
});

// GET /api/admin/members
router.get('/members', (req: Request, res: Response) => {
  const adminId = (req.headers['x-user-id'] as string) || (req.query.adminId as string);
  const adminUser = AuthService.getCurrentUser(adminId);
  if (!adminUser || adminUser.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
  }

  try {
    const members = AdminService.getAllMembers(adminUser);
    return res.json({ members });
  } catch (error: any) {
    return res.status(403).json({ error: error.message || 'Access denied' });
  }
});

// PATCH /api/admin/members
router.patch('/members', (req: Request, res: Response) => {
  const adminId = (req.headers['x-user-id'] as string) || (req.query.adminId as string);
  const adminUser = AuthService.getCurrentUser(adminId);
  if (!adminUser || adminUser.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
  }

  const { memberId, status, instructorId, extendDays, reason } = req.body;
  try {
    let updatedMember = null;
    if (extendDays) {
      updatedMember = AdminService.extendMembership(adminUser, memberId, Number(extendDays));
    } else if (status) {
      updatedMember = AdminService.updateMemberStatus(adminUser, memberId, status, reason);
    } else if (instructorId) {
      updatedMember = AdminService.assignInstructor(adminUser, memberId, instructorId);
    }
    return res.json({ success: true, member: updatedMember });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

// GET /api/admin/audit-logs
router.get('/audit-logs', (req: Request, res: Response) => {
  const adminId = (req.headers['x-user-id'] as string) || (req.query.adminId as string);
  const adminUser = AuthService.getCurrentUser(adminId);
  if (!adminUser || adminUser.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
  }

  try {
    const logs = AdminService.getAuditLogs(adminUser);
    return res.json({ logs });
  } catch (error: any) {
    return res.status(403).json({ error: error.message || 'Access denied' });
  }
});

// GET /api/admin/packages
let packagesStore = [
  { id: 'sole_1m', type: 'sole', duration: '1_month', name: 'Sole - 1 Month', price: 4500, admissionFee: 500, durationLabel: '1 Month', features: ['Full facility & gym equipment access', 'Locker room & shower access', 'Free orientation by Coach Adeesha'] },
  { id: 'sole_3m', type: 'sole', duration: '3_months', name: 'Sole - 3 Months', price: 12000, admissionFee: 500, durationLabel: '3 Months', savings: 'Save Rs. 1,500', popular: true, features: ['Full facility access', 'Bi-weekly progress checks', 'Save Rs. 1,500'] },
  { id: 'sole_6m', type: 'sole', duration: '6_months', name: 'Sole - 6 Months', price: 22000, admissionFee: 500, durationLabel: '6 Months', savings: 'Save Rs. 5,000', features: ['Full facility access', 'Body recomp tracking', 'Save Rs. 5,000'] },
  { id: 'sole_1y', type: 'sole', duration: '1_year', name: 'Sole - 1 Year', price: 40000, admissionFee: 500, durationLabel: '1 Year', savings: 'Save Rs. 14,000', popular: true, features: ['Full 365-day access', 'Priority guidance by Coach Adeesha', 'Save Rs. 14,000'] },
  { id: 'couple_1m', type: 'couple', duration: '1_month', name: 'Couple - 1 Month', price: 8000, admissionFee: 1000, durationLabel: '1 Month', features: ['Access for 2 partners', 'Full facility access', 'Admission: Rs. 1,000'] },
  { id: 'couple_3m', type: 'couple', duration: '3_months', name: 'Couple - 3 Months', price: 22500, admissionFee: 1000, durationLabel: '3 Months', savings: 'Save Rs. 1,500', popular: true, features: ['Access for 2 partners', 'Shared progress tracking', 'Save Rs. 1,500'] },
  { id: 'couple_6m', type: 'couple', duration: '6_months', name: 'Couple - 6 Months', price: 42000, admissionFee: 1000, durationLabel: '6 Months', savings: 'Save Rs. 6,000', features: ['Access for 2 partners', 'Nutritional consultation', 'Save Rs. 6,000'] },
  { id: 'couple_1y', type: 'couple', duration: '1_year', name: 'Couple - 1 Year', price: 78000, admissionFee: 1000, durationLabel: '1 Year', savings: 'Save Rs. 18,000', popular: true, features: ['Access for 2 partners', 'Priority coach reviews', 'Save Rs. 18,000'] },
  { id: 'burnzone', type: 'coaching', duration: '1_month', name: 'MuscleCraft BurnZone', price: 3000, admissionFee: 500, durationLabel: '1 Month', popular: true, features: ['Functional fitness & CrossFit conditioning', 'Fat loss & body toning', 'Supervised by Coach Adeesha', 'Admission fee: Rs. 500'] },
  { id: 'coaching_90', type: 'coaching', duration: '90_days', name: '90 Days Better Me (Online Coaching)', price: 8000, admissionFee: 0, durationLabel: '12-Week Transformation Cohort', popular: true, savings: 'Zero Admission Fee', features: ['Personalized nutrition & workout programming', 'Weekly body metric & photo progress analysis', 'Direct 1-on-1 coach WhatsApp support', 'Strict 90-day cohort access'] },
];

let admissionStore = { sole: 500, couple: 1000 };

router.get('/packages', (req: Request, res: Response) => {
  return res.json({ packages: packagesStore, admissionFees: admissionStore });
});

router.post('/packages', (req: Request, res: Response) => {
  const adminId = (req.headers['x-user-id'] as string) || (req.query.adminId as string);
  const adminUser = AuthService.getCurrentUser(adminId);
  if (!adminUser || adminUser.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
  }

  const { package: updatedPkg, admissionFees: newFees, action } = req.body;
  if (action === 'reset') {
    admissionStore = { sole: 500, couple: 1000 };
    return res.json({ success: true, packages: packagesStore, admissionFees: admissionStore });
  }

  if (newFees) {
    if (typeof newFees.sole === 'number') admissionStore.sole = newFees.sole;
    if (typeof newFees.couple === 'number') admissionStore.couple = newFees.couple;
  }

  if (updatedPkg && updatedPkg.id) {
    const idx = packagesStore.findIndex(p => p.id === updatedPkg.id);
    if (idx >= 0) {
      packagesStore[idx] = { ...packagesStore[idx], ...updatedPkg, price: Number(updatedPkg.price) };
    } else {
      packagesStore.push({ ...updatedPkg, price: Number(updatedPkg.price) });
    }
    return res.json({ success: true, package: packagesStore[idx >= 0 ? idx : packagesStore.length - 1], packages: packagesStore, admissionFees: admissionStore });
  }

  return res.json({ success: true, packages: packagesStore, admissionFees: admissionStore });
});

export default router;
