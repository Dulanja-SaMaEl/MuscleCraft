export type UserRole = 'client' | 'instructor' | 'admin';

export type MembershipTier = 'none' | 'monthly' | 'coaching_90';

export type UserStatus = 'active' | 'pending' | 'suspended' | 'banned';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tier: MembershipTier;
  status: UserStatus;
  avatarUrl?: string;
  phone?: string;
  assignedInstructorId?: string;
  assignedInstructorName?: string;
  membershipExpiresAt?: string;
  joinedAt: string;
}

export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export interface PaymentRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  referenceCode: string; // e.g. TRF-IRON-74921
  tier: 'monthly' | 'coaching_90';
  amount: number;
  currency: string;
  bankName: string;
  transferDate: string;
  senderAccountName: string;
  receiptNotes?: string;
  receiptUrl?: string;
  status: PaymentStatus;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface BodyMeasurement {
  id: string;
  userId: string;
  weekNumber: number;
  date: string;
  weightKg: number;
  bodyFatPercentage?: number;
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  armsCm?: number;
  thighsCm?: number;
  notes?: string;
  coachFeedback?: string;
}

export interface MealItem {
  meal: string;
  items: string;
  macros: string;
}

export interface DietPlan {
  id: string;
  userId: string;
  assignedBy: string;
  coachName: string;
  title: string;
  phase: string;
  dailyCalories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  waterLiters: number;
  guidelines: string[];
  meals: MealItem[];
  updatedAt: string;
}

export type AppointmentType = 'individual_consultation' | 'group_coaching';

export interface Appointment {
  id: string;
  title: string;
  type: AppointmentType;
  instructorId: string;
  instructorName: string;
  clientId?: string;
  clientName?: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingLink: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

export type VideoAccessLevel = 'common' | 'coaching_90';

export interface ExerciseVideo {
  id: string;
  title: string;
  category: 'Warmup' | 'Hypertrophy' | 'Powerlifting' | 'Mobility' | 'Coaching Clinic';
  duration: string;
  accessLevel: VideoAccessLevel;
  cfStreamId: string;
  videoUrl?: string;
  thumbnailUrl: string;
  description: string;
  instructorName: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  timestamp: string;
}
