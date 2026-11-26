import {
  User,
  PaymentRecord,
  BodyMeasurement,
  DietPlan,
  Appointment,
  ExerciseVideo,
  AuditLog,
  DailySalesRecord,
} from '../types';

/**
 * Clean Production Handover Fallback Store.
 * Contains ONLY the Owner Admin credentials profile; live records are persisted in Supabase.
 */
export class MuscleCraftDatabase {
  private static instance: MuscleCraftDatabase;

  public users: User[] = [
    {
      id: 'a0000000-0000-0000-0000-000000000001',
      email: 'adeesha@musclecraft.lk',
      name: 'Adeesha Kumarasingha (Owner & Head Coach)',
      role: 'admin',
      tier: 'sole_1y',
      packageName: '1 Year Membership (Sole)',
      status: 'active',
      phone: '+94 77 123 4567',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      membershipExpiresAt: '2028-12-31T23:59:59Z',
      joinedAt: '2023-01-01T08:00:00Z',
    },
  ];

  public payments: PaymentRecord[] = [];
  public measurements: BodyMeasurement[] = [];
  public dietPlans: DietPlan[] = [];
  public appointments: Appointment[] = [];
  public videos: ExerciseVideo[] = [];
  public broadcastMessages: any[] = [];
  public auditLogs: AuditLog[] = [];
  public crmAccountLifetimeSpend: number = 0;
  public dailySalesRecords: DailySalesRecord[] = [];

  public static getInstance(): MuscleCraftDatabase {
    if (!MuscleCraftDatabase.instance) {
      MuscleCraftDatabase.instance = new MuscleCraftDatabase();
    }
    return MuscleCraftDatabase.instance;
  }
}

export const db = MuscleCraftDatabase.getInstance();
