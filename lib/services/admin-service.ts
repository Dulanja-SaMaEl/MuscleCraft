import { db } from '../db/mock-db';
import { User, UserStatus, AuditLog } from '../types';

export class AdminService {
  static checkAdmin(caller: User) {
    if (caller.role !== 'admin') {
      throw new Error('Forbidden: Administrative privileges required.');
    }
  }

  static getDashboardStats(caller: User) {
    this.checkAdmin(caller);

    const totalMembers = db.users.filter((u) => u.role === 'client').length;
    const activeMembers = db.users.filter((u) => u.role === 'client' && u.status === 'active').length;
    const pendingTransfers = db.payments.filter((p) => p.status === 'pending').length;
    const totalRevenue = db.payments
      .filter((p) => p.status === 'approved')
      .reduce((sum, p) => sum + p.amount, 0);

    const coaching90Members = db.users.filter((u) => u.tier === 'coaching_90' && u.status === 'active').length;
    const monthlyMembers = db.users.filter((u) => u.tier === 'monthly' && u.status === 'active').length;

    return {
      totalMembers,
      activeMembers,
      pendingTransfers,
      totalRevenue,
      coaching90Members,
      monthlyMembers,
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

  static assignInstructor(
    caller: User,
    targetClientId: string,
    instructorId: string
  ): User {
    this.checkAdmin(caller);

    const client = db.users.find((u) => u.id === targetClientId);
    if (!client) throw new Error('Client not found.');

    const instructor = db.users.find((u) => u.id === instructorId && u.role === 'instructor');
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
      details: `Assigned coach ${instructor.name} to ${client.name}.`,
      timestamp: new Date().toISOString(),
    });

    return client;
  }

  static getAuditLogs(caller: User): AuditLog[] {
    this.checkAdmin(caller);
    return db.auditLogs;
  }
}
