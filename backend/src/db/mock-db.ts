import {
  User,
  PaymentRecord,
  BodyMeasurement,
  DietPlan,
  Appointment,
  ExerciseVideo,
  AuditLog,
} from '../types';

export class MuscleCraftDatabase {
  private static instance: MuscleCraftDatabase;

  public users: User[] = [
    {
      id: 'usr_admin_1',
      email: 'adeesha@musclecraft.lk',
      name: 'Adeesha Kumarasingha (Owner & Head Coach)',
      role: 'admin',
      tier: 'sole_1y',
      packageName: 'Sole - 1 Year (Owner)',
      status: 'active',
      phone: '+94 77 123 4567',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      membershipExpiresAt: '2028-12-31T23:59:59Z',
      joinedAt: '2023-01-01T08:00:00Z',
    },
    {
      id: 'usr_inst_adeesha',
      email: 'owner@musclecraft.lk',
      name: 'Adeesha Kumarasingha (Head Coach Desk)',
      role: 'admin',
      tier: 'sole_1y',
      packageName: 'Sole - 1 Year',
      status: 'active',
      phone: '+94 77 123 4567',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      membershipExpiresAt: '2028-12-31T23:59:59Z',
      joinedAt: '2023-01-01T08:00:00Z',
    },
    {
      id: 'usr_client_90',
      email: 'marcus@musclecraft.lk',
      name: 'Marcus Vance',
      role: 'client',
      tier: 'coaching_90',
      packageName: '90-Day VIP Athletic Transformation',
      packageType: 'coaching',
      status: 'active',
      phone: '+94 71 884 1029',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      assignedInstructorId: 'usr_admin_1',
      assignedInstructorName: 'Adeesha Kumarasingha (Head Coach)',
      membershipExpiresAt: '2026-12-15T23:59:59Z',
      joinedAt: '2026-09-15T10:00:00Z',
    },
    {
      id: 'usr_client_nuwan',
      email: 'nuwan.silva@gmail.com',
      name: 'Nuwan Silva',
      role: 'client',
      tier: 'sole_6m',
      packageName: 'Sole - 6 Months',
      packageType: 'sole',
      status: 'active',
      phone: '+94 77 452 9182',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      assignedInstructorId: 'usr_admin_1',
      assignedInstructorName: 'Adeesha Kumarasingha (Head Coach)',
      membershipExpiresAt: '2027-04-10T23:59:59Z',
      joinedAt: '2026-10-10T11:00:00Z',
    },
    {
      id: 'usr_client_couple_kanishka',
      email: 'kanishka.perera@gmail.com',
      name: 'Kanishka & Hiruni Perera',
      role: 'client',
      tier: 'couple_1y',
      packageName: 'Couple - 1 Year',
      packageType: 'couple',
      status: 'active',
      phone: '+94 76 991 3821',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      assignedInstructorId: 'usr_admin_1',
      assignedInstructorName: 'Adeesha Kumarasingha (Head Coach)',
      membershipExpiresAt: '2027-10-01T23:59:59Z',
      joinedAt: '2026-10-01T09:30:00Z',
    },
    {
      id: 'usr_client_chamari',
      email: 'chamari.a@outlook.com',
      name: 'Chamari Atapattu',
      role: 'client',
      tier: 'sole_1m',
      packageName: 'Sole - 1 Month',
      packageType: 'sole',
      status: 'active',
      phone: '+94 70 338 1902',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      assignedInstructorId: 'usr_admin_1',
      assignedInstructorName: 'Adeesha Kumarasingha (Head Coach)',
      membershipExpiresAt: '2026-10-31T23:59:59Z',
      joinedAt: '2026-10-01T12:00:00Z',
    },
    {
      id: 'usr_client_pending',
      email: 'david.reynolds@gmail.com',
      name: 'David Reynolds',
      role: 'client',
      tier: 'sole_3m',
      packageName: 'Sole - 3 Months',
      packageType: 'sole',
      status: 'pending',
      phone: '+94 72 411 9832',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      joinedAt: '2026-10-25T14:20:00Z',
    },
  ];

  public payments: PaymentRecord[] = [
    {
      id: 'pay_001',
      userId: 'usr_client_pending',
      userName: 'David Reynolds',
      userEmail: 'david.reynolds@gmail.com',
      referenceCode: 'TRF-MC-948102',
      tier: 'sole_3m',
      packageName: 'Sole - 3 Months',
      packageType: 'sole',
      duration: '3_months',
      packageAmount: 12000,
      admissionFee: 500,
      amount: 12500,
      currency: 'LKR',
      bankName: 'Commercial Bank of Ceylon (Online Slip)',
      transferDate: '2026-10-25',
      senderAccountName: 'David Reynolds',
      receiptNotes: 'Transfer via ComBank online banking reference #CMB-998201.',
      status: 'pending',
      createdAt: '2026-10-25T14:35:00Z',
    },
    {
      id: 'pay_003',
      userId: 'usr_client_couple_kanishka',
      userName: 'Kanishka & Hiruni Perera',
      userEmail: 'kanishka.perera@gmail.com',
      referenceCode: 'TRF-MC-774921',
      tier: 'couple_1y',
      packageName: 'Couple - 1 Year',
      packageType: 'couple',
      duration: '1_year',
      packageAmount: 78000,
      admissionFee: 1000,
      amount: 79000,
      currency: 'LKR',
      bankName: 'Hatton National Bank (HNB)',
      transferDate: '2026-10-01',
      senderAccountName: 'Kanishka Perera',
      receiptNotes: 'Annual couple package transfer verified via HNB deposit slip.',
      status: 'approved',
      adminNotes: 'Verified via HNB core banking statement.',
      reviewedBy: 'usr_admin_1',
      reviewedAt: '2026-10-01T11:00:00Z',
      createdAt: '2026-10-01T09:40:00Z',
    },
  ];

  public measurements: BodyMeasurement[] = [
    {
      id: 'meas_01',
      userId: 'usr_client_90',
      weekNumber: 1,
      date: '2026-09-15',
      weightKg: 88.5,
      bodyFatPercentage: 18.5,
      chestCm: 104.0,
      waistCm: 89.0,
      hipsCm: 101.0,
      armsCm: 37.5,
      thighsCm: 61.0,
      notes: 'Initial baseline measurement on entry into 90-day program.',
      coachFeedback: 'Solid baseline. Focus this first cycle on stabilizing squat depth and hitting 180g protein minimum. - Coach Adeesha',
    },
  ];

  public dietPlans: DietPlan[] = [];
  public appointments: Appointment[] = [];
  public videos: ExerciseVideo[] = [];
  public broadcastMessages: any[] = [];
  public auditLogs: AuditLog[] = [];

  public static getInstance(): MuscleCraftDatabase {
    if (!MuscleCraftDatabase.instance) {
      MuscleCraftDatabase.instance = new MuscleCraftDatabase();
    }
    return MuscleCraftDatabase.instance;
  }
}

export const db = MuscleCraftDatabase.getInstance();
export { MuscleCraftDatabase as IronForgeDatabase };
