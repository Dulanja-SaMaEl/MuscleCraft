import { Router, Request, Response } from 'express';
import { PaymentService } from '../services/payment-service';
import { SubmitBankTransferSchema, ApprovePaymentSchema, RejectPaymentSchema } from '../validation';
import { db } from '../db/mock-db';

const router = Router();

// GET /api/payments
router.get('/', (req: Request, res: Response) => {
  const userId = req.query.userId as string | undefined;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId query parameter' });
  }

  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (user.role === 'admin') {
    return res.json({ payments: PaymentService.getAllPayments() });
  }

  return res.json({ payments: PaymentService.getUserPayments(userId) });
});

// POST /api/payments (submit bank transfer)
router.post('/', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || req.body.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: missing x-user-id or userId' });
    }

    const parsed = SubmitBankTransferSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
    }

    const payment = PaymentService.submitBankTransfer({
      userId,
      referenceCode: parsed.data.referenceCode,
      tier: parsed.data.tier,
      bankName: parsed.data.bankName,
      senderAccountName: parsed.data.senderAccountName,
      transferDate: parsed.data.transferDate,
      receiptNotes: parsed.data.receiptNotes,
    });

    return res.status(201).json({ success: true, payment });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Payment submission failed' });
  }
});

// POST /api/payments/:id/approve
router.post('/:id/approve', (req: Request, res: Response) => {
  try {
    const adminId = (req.headers['x-user-id'] as string) || req.body.adminId;
    if (!adminId) {
      return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
    }

    const parsed = ApprovePaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
    }

    const payment = PaymentService.approvePayment(req.params.id, adminId, parsed.data.adminNotes);
    return res.json({ success: true, payment });
  } catch (error: any) {
    const status = error.message.includes('Forbidden') ? 403 : error.message.includes('not found') ? 404 : 400;
    return res.status(status).json({ error: error.message });
  }
});

// POST /api/payments/:id/reject
router.post('/:id/reject', (req: Request, res: Response) => {
  try {
    const adminId = (req.headers['x-user-id'] as string) || req.body.adminId;
    if (!adminId) {
      return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
    }

    const parsed = RejectPaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
    }

    const payment = PaymentService.rejectPayment(req.params.id, adminId, parsed.data.reason);
    return res.json({ success: true, payment });
  } catch (error: any) {
    const status = error.message.includes('Forbidden') ? 403 : error.message.includes('not found') ? 404 : 400;
    return res.status(status).json({ error: error.message });
  }
});

export default router;
