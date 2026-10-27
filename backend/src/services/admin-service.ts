import { db } from '../db/mock-db';
import { User, UserStatus, AuditLog, GYM_PACKAGES } from '../types';

export class AdminService {
  static checkAdmin(caller: User) {
    if (caller.role !== 'admin') {
      throw new Error('Forbidden: Administrative privileges required.');
    }
  }

  static getDashboardStats(caller: User) {
    this.checkAdmin(caller);

    const clientMembers = db.users.filter((u) => u.role === 'client');
    const totalMembers = clientMembers.length;
    const activeMembers = clientMembers.filter((u) => u.status === 'active').length;
    const pendingMembers = clientMembers.filter((u) => u.status === 'pending').length;
    const pendingTransfers = db.payments.filter((p) => p.status === 'pending').length;
    
    const approvedPayments = db.payments.filter((p) => p.status === 'approved');
    const totalRevenue = approvedPayments.reduce((sum, p) => sum + p.amount, 0);
    const admissionFeesTotal = approvedPayments.reduce((sum, p) => sum + (p.admissionFee || 500), 0);
    const rejectedTransfers = db.payments.filter((p) => p.status === 'rejected').length;

    // Package category breakdown
    const soleMembers = clientMembers.filter(
      (u) => u.tier?.startsWith('sole') || u.tier === 'monthly'
    ).length;
    const coupleMembers = clientMembers.filter((u) => u.tier?.startsWith('couple')).length;
    const coachingMembers = clientMembers.filter(
      (u) => u.tier === 'coaching_90' || u.tier === 'burnzone'
    ).length;

    // Monthly Sales & Revenue Trend (in LKR)
    const salesTrend = [
      { month: 'May', revenue: 95000, newMembers: 12, sole: 8, couple: 3, coaching: 1 },
      { month: 'Jun', revenue: 124000, newMembers: 16, sole: 11, couple: 4, coaching: 1 },
      { month: 'Jul', revenue: 148000, newMembers: 19, sole: 13, couple: 4, coaching: 2 },
      { month: 'Aug', revenue: 162500, newMembers: 21, sole: 14, couple: 5, coaching: 2 },
      { month: 'Sep', revenue: 184000, newMembers: 23, sole: 15, couple: 6, coaching: 2 },
      { month: 'Oct (Current)', revenue: Math.max(totalRevenue, 218500), newMembers: 26, sole: 17, couple: 6, coaching: 3 },
    ];

    const registrationFunnel = {
      registered: totalMembers + rejectedTransfers,
      approved: approvedPayments.length,
      pending: pendingTransfers,
      notApproved: rejectedTransfers,
    };

    return {
      totalMembers,
      activeMembers,
      pendingMembers,
      pendingTransfers,
      totalRevenue: Math.max(totalRevenue, 218500),
      admissionFeesTotal: Math.max(admissionFeesTotal, 18500),
      monthRevenue: 218500,
      approvedCount: approvedPayments.length,
      rejectedCount: rejectedTransfers,
      soleMembers: Math.max(soleMembers, 65),
      coupleMembers: Math.max(coupleMembers, 23),
      coachingMembers: Math.max(coachingMembers, 19),
      salesTrend,
      registrationFunnel,
    };
  }

  static getAllMembers(caller: User): User[] {
    this.checkAdmin(caller);
    return db.users;
  }

  static updateMemberStatus(
    caller: User,
    targetUserId: string,
    newStatus: UserStatus,
    reason?: string
  ): User {
    this.checkAdmin(caller);

    const user = db.users.find((u) => u.id === targetUserId);
    if (!user) {
      throw new Error('Member not found.');
    }

    user.status = newStatus;

    db.auditLogs.unshift({
      id: `log_${Date.now()}`,
      actorId: caller.id,
      actorEmail: caller.email,
      action: `MEMBER_STATUS_${newStatus.toUpperCase()}`,
      targetType: 'user',
      targetId: user.id,
      details: `Admin changed status of ${user.name} (${user.email}) to ${newStatus}.${reason ? ` Reason: ${reason}` : ''}`,
      timestamp: new Date().toISOString(),
    });

    return user;
  }

  static extendMembership(
    caller: User,
    targetUserId: string,
    additionalDays: number = 30
  ): User {
    this.checkAdmin(caller);

    const user = db.users.find((u) => u.id === targetUserId);
    if (!user) {
      throw new Error('Member not found.');
    }

    const currentExpiry = user.membershipExpiresAt
      ? new Date(user.membershipExpiresAt).getTime()
      : Date.now();
    const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
    const newExpiry = new Date(baseTime + additionalDays * 24 * 60 * 60 * 1000);
    user.membershipExpiresAt = newExpiry.toISOString();
    user.status = 'active';

    db.auditLogs.unshift({
      id: `log_${Date.now()}`,
      actorId: caller.id,
      actorEmail: caller.email,
      action: 'MEMBERSHIP_EXTENDED',
      targetType: 'user',
      targetId: user.id,
      details: `Extended membership for ${user.name} by ${additionalDays} days until ${newExpiry.toLocaleDateString()}.`,
      timestamp: new Date().toISOString(),
    });

    return user;
  }

  static assignInstructor(
    caller: User,
    targetClientId: string,
    instructorId: string
  ): User {
    this.checkAdmin(caller);

    const client = db.users.find((u) => u.id === targetClientId);
    if (!client) throw new Error('Client not found.');

    const instructor = db.users.find((u) => u.id === instructorId);
    if (!instructor) throw new Error('Instructor not found.');

    client.assignedInstructorId = instructor.id;
    client.assignedInstructorName = instructor.name;

    db.auditLogs.unshift({
      id: `log_${Date.now()}`,
      actorId: caller.id,
      actorEmail: caller.email,
      action: 'INSTRUCTOR_ASSIGNED',
      targetType: 'user',
      targetId: client.id,
      details: `Assigned coach ${instructor.name} to client ${client.name}.`,
      timestamp: new Date().toISOString(),
    });

    return client;
  }

  static getAuditLogs(caller: User): AuditLog[] {
    this.checkAdmin(caller);
    return db.auditLogs;
  }
}
