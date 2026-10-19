import { db } from '../db/mock-db';
import { PaymentRecord, PaymentStatus, User } from '../types';

export class PaymentService {
  // Generate distinct bank transfer reference code
  static generateReferenceCode(): string {
    const random = Math.floor(100000 + Math.random() * 900000);
    return `TRF-IRON-${random}`;
  }

  // Get pricing for tier
  static getTierPrice(tier: 'monthly' | 'coaching_90'): number {
    return tier === 'monthly' ? 50.0 : 450.0;
  }

  // Submit manual bank transfer
  static submitBankTransfer(data: {
    userId: string;
    referenceCode: string;
    tier: 'monthly' | 'coaching_90';
    bankName: string;
    transferDate: string;
    senderAccountName: string;
    receiptNotes?: string;
  }): PaymentRecord {
    const user = db.users.find((u) => u.id === data.userId);
    if (!user) {
      throw new Error('User not found.');
    }

    const amount = this.getTierPrice(data.tier);

    const payment: PaymentRecord = {
      id: `pay_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      referenceCode: data.referenceCode,
      tier: data.tier,
      amount,
      currency: 'USD',
      bankName: data.bankName,
      transferDate: data.transferDate,
      senderAccountName: data.senderAccountName,
      receiptNotes: data.receiptNotes,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    db.payments.unshift(payment);

    // Record audit
    db.auditLogs.unshift({
      id: `log_${Date.now()}`,
      actorId: user.id,
      actorEmail: user.email,
      action: 'BANK_TRANSFER_SUBMITTED',
      targetType: 'payment',
      targetId: payment.id,
      details: `Submitted manual bank transfer ${payment.referenceCode} for $${amount.toFixed(2)} (${data.tier}).`,
      timestamp: new Date().toISOString(),
    });

    return payment;
  }

  // Get payments for a specific user (IDOR protected) or all payments if admin
  static getPayments(requestingUser: User, targetUserId?: string): PaymentRecord[] {
    if (requestingUser.role === 'admin') {
      if (targetUserId) {
        return db.payments.filter((p) => p.userId === targetUserId);
      }
      return db.payments;
    }

    // Client can only view their own payments
    return db.payments.filter((p) => p.userId === requestingUser.id);
  }

  // Admin approves manual bank transfer
  static approvePayment(adminUser: User, paymentId: string, adminNotes?: string): PaymentRecord {
    if (adminUser.role !== 'admin') {
      throw new Error('Unauthorized: Only administrators can approve bank transfers.');
    }

    const payment = db.payments.find((p) => p.id === paymentId);
    if (!payment) {
      throw new Error('Payment record not found.');
    }

    payment.status = 'approved';
    payment.reviewedBy = adminUser.id;
    payment.reviewedAt = new Date().toISOString();
    if (adminNotes) payment.adminNotes = adminNotes;

    // Activate member and extend expiry
    const user = db.users.find((u) => u.id === payment.userId);
    if (user) {
      user.status = 'active';
      user.tier = payment.tier;

      const durationDays = payment.tier === 'coaching_90' ? 90 : 30;
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + durationDays);
      user.membershipExpiresAt = expiry.toISOString();

      // If 90-day coaching, automatically assign head coach Elena Rostova if not assigned
      if (payment.tier === 'coaching_90' && !user.assignedInstructorId) {
        user.assignedInstructorId = 'usr_inst_1';
        user.assignedInstructorName = 'Elena Rostova';
      }
    }

    // Record audit
    db.auditLogs.unshift({
      id: `log_${Date.now()}`,
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: 'PAYMENT_APPROVED',
      targetType: 'payment',
      targetId: payment.id,
      details: `Admin ${adminUser.name} approved transfer ${payment.referenceCode} for ${payment.userName} ($${payment.amount}). Membership activated until ${user?.membershipExpiresAt}.`,
      timestamp: new Date().toISOString(),
    });

    return payment;
  }

  // Admin rejects manual bank transfer
  static rejectPayment(adminUser: User, paymentId: string, reason: string): PaymentRecord {
    if (adminUser.role !== 'admin') {
      throw new Error('Unauthorized: Only administrators can reject bank transfers.');
    }

    const payment = db.payments.find((p) => p.id === paymentId);
    if (!payment) {
      throw new Error('Payment record not found.');
    }

    payment.status = 'rejected';
    payment.adminNotes = reason;
    payment.reviewedBy = adminUser.id;
    payment.reviewedAt = new Date().toISOString();

    db.auditLogs.unshift({
      id: `log_${Date.now()}`,
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: 'PAYMENT_REJECTED',
      targetType: 'payment',
      targetId: payment.id,
      details: `Admin ${adminUser.name} rejected transfer ${payment.referenceCode}. Reason: ${reason}`,
      timestamp: new Date().toISOString(),
    });

    return payment;
  }
}
