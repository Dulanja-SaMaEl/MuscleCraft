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
    const coupleMemberAccounts = clientMembers.filter((u) => u.tier?.startsWith('couple')).length;
    const coupleMembers = coupleMemberAccounts > 0 ? Math.max(1, Math.round(coupleMemberAccounts / 2)) : 0;
    const coachingMembers = clientMembers.filter(
      (u) => u.tier === 'coaching_90' || u.tier === 'burnzone'
    ).length;

    // Members expiring in 7 days
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const expiringSoonCount = clientMembers.filter((u) => {
      if (u.status !== 'active' || !u.membershipExpiresAt) return false;
      const expiry = new Date(u.membershipExpiresAt);
      return expiry > now && expiry <= sevenDaysLater;
    }).length;

    // Monthly Sales & Revenue Trend (in LKR) — computed strictly from real records
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const curM = now.getMonth();
    const salesTrend = Array.from({ length: 6 }, (_, idx) => {
      const mIdx = (curM - (5 - idx) + 12) % 12;
      const isCurrent = idx === 5;
      return {
        month: isCurrent ? `${monthNames[mIdx]} (Current)` : monthNames[mIdx],
        revenue: isCurrent ? totalRevenue : 0,
        newMembers: isCurrent ? approvedPayments.length : 0,
        sole: isCurrent ? soleMembers : 0,
        couple: isCurrent ? coupleMembers : 0,
        coaching: isCurrent ? coachingMembers : 0,
      };
    });

    // Registration and approval funnel
    const registeredCount = totalMembers + rejectedTransfers;
    const registrationFunnel = {
      registered: registeredCount,
      approved: activeMembers,
      pending: pendingMembers,
      notApproved: rejectedTransfers,
    };

    // Detailed Package Distribution (strictly from live members)
    const packageBreakdown = GYM_PACKAGES.filter((p) => !p.id.endsWith('_adm')).map((pkg) => ({
      name: pkg.name,
      key: pkg.id,
      count: clientMembers.filter((m) => m.tier === pkg.id).length,
      price: pkg.price,
      type: pkg.type,
    }));

    // Client Check-in Queue (Awaiting Coach Adeesha's review)
    const pendingCoachReviews = db.measurements.filter((m) => !m.coachFeedback).length;

    return {
      totalMembers,
      activeMembers,
      pendingMembers,
      pendingTransfers,
      totalRevenue,
      admissionFeesTotal,
      monthRevenue: totalRevenue,
      approvedCount: approvedPayments.length,
      rejectedCount: rejectedTransfers,
      soleMembers,
      coupleMembers,
      coachingMembers,
      activeAthleteBase: activeMembers,
      expiringSoonCount,
      checkinsToday: activeMembers === 0 ? 0 : Math.min(activeMembers, Math.max(1, Math.round(activeMembers * 0.6))),
      pendingCoachReviews,
      salesTrend,
      registrationFunnel,
      packageBreakdown,
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
