import { db } from '../db/mock-db';
import { PaymentRecord, PaymentStatus, User, GYM_PACKAGES } from '../types';

export class PaymentService {
  // Generate distinct bank transfer reference code
  static generateReferenceCode(): string {
    const random = Math.floor(100000 + Math.random() * 900000);
    return `TRF-MC-${random}`;
  }

  // Get pricing for tier
  static getTierPrice(tier: string): { amount: number; packagePrice: number; admissionFee: number; name: string } {
    const gymPkg = GYM_PACKAGES.find((p) => p.id === tier);
    if (gymPkg) {
      return {
        amount: gymPkg.price + gymPkg.admissionFee,
        packagePrice: gymPkg.price,
        admissionFee: gymPkg.admissionFee,
        name: gymPkg.name,
      };
    }

    if (tier === 'coaching_90') {
      return {
        amount: 25000,
        packagePrice: 25000,
        admissionFee: 0,
        name: '90-Day VIP Athletic Transformation',
      };
    }

    if (tier === 'burnzone') {
      return {
        amount: 15000,
        packagePrice: 15000,
        admissionFee: 500,
        name: 'MuscleCraft BurnZone Functional Conditioning',
      };
    }

    // Default fallback
    return {
      amount: 5000,
      packagePrice: 4500,
      admissionFee: 500,
      name: 'Sole - 1 Month Gym Access',
    };
  }

  // Submit manual bank transfer
  static submitBankTransfer(data: {
    userId: string;
    referenceCode: string;
    tier: string;
    bankName: string;
    transferDate: string;
    senderAccountName: string;
    receiptNotes?: string;
  }): PaymentRecord {
    const user = db.users.find((u) => u.id === data.userId);
    if (!user) {
      throw new Error('User not found.');
    }

    const priceInfo = this.getTierPrice(data.tier);

    const payment: PaymentRecord = {
      id: `pay_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      referenceCode: data.referenceCode,
      tier: data.tier,
      packageName: priceInfo.name,
      packageAmount: priceInfo.packagePrice,
      admissionFee: priceInfo.admissionFee,
      amount: priceInfo.amount,
      currency: 'LKR',
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
      details: `Submitted manual bank transfer ${payment.referenceCode} for Rs. ${payment.amount.toLocaleString()} LKR (${priceInfo.name}).`,
      timestamp: new Date().toISOString(),
    });

    return payment;
  }

  // Get payments for a specific user (IDOR protected) or all payments if admin
  static getPayments(requestingUser: User, targetUserId?: string): PaymentRecord[] {
    if (requestingUser.role === 'admin' || requestingUser.role === 'instructor') {
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
      user.packageName = payment.packageName;

      // Determine duration
      let durationDays = 30;
      if (payment.tier === 'sole_1y' || payment.tier === 'couple_1y') {
        durationDays = 365;
      } else if (payment.tier === 'sole_6m' || payment.tier === 'couple_6m') {
        durationDays = 180;
      } else if (payment.tier === 'sole_3m' || payment.tier === 'couple_3m' || payment.tier === 'coaching_90') {
        durationDays = 90;
      }

      const expiry = new Date();
      expiry.setDate(expiry.getDate() + durationDays);
      user.membershipExpiresAt = expiry.toISOString();

      if (!user.assignedInstructorId) {
        user.assignedInstructorId = 'usr_admin_1';
        user.assignedInstructorName = 'Adeesha Kumarasingha (Founder & Head Coach)';
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
      details: `Admin ${adminUser.name} approved transfer ${payment.referenceCode} for ${payment.userName} (Rs. ${payment.amount.toLocaleString()} LKR). Membership activated until ${user?.membershipExpiresAt ? new Date(user.membershipExpiresAt).toLocaleDateString() : 'N/A'}.`,
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
    payment.adminNotes = reason || 'Payment slip verification failed.';
    payment.reviewedBy = adminUser.id;
    payment.reviewedAt = new Date().toISOString();

    db.auditLogs.unshift({
      id: `log_${Date.now()}`,
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: 'PAYMENT_REJECTED',
      targetType: 'payment',
      targetId: payment.id,
      details: `Admin ${adminUser.name} rejected transfer ${payment.referenceCode} for ${payment.userName}. Reason: ${payment.adminNotes}`,
      timestamp: new Date().toISOString(),
    });

    return payment;
  }
}
