export type UserRole = 'client' | 'instructor' | 'admin';

export type MembershipTier =
  | 'none'
  | 'monthly'
  | 'coaching_90'
  | 'sole_1m'
  | 'sole_3m'
  | 'sole_6m'
  | 'sole_1y'
  | 'couple_1m'
  | 'couple_3m'
  | 'couple_6m'
  | 'couple_1y'
  | 'burnzone';

export type PackageType = 'sole' | 'couple' | 'coaching';
export type PackageDuration = '1_month' | '3_months' | '6_months' | '1_year' | '90_days';

export interface GymPackage {
  id: string;
  type: 'sole' | 'couple' | 'coaching';
  duration: '1_month' | '3_months' | '6_months' | '1_year' | '90_days';
  name: string;
  price: number; // LKR
  admissionFee: number; // LKR
  durationLabel: string;
  savings?: string;
  popular?: boolean;
  features: string[];
}

export const GYM_PACKAGES: GymPackage[] = [
  // Sole Packages (Admission: Rs. 500)
  {
    id: 'sole_1m',
    type: 'sole',
    duration: '1_month',
    name: 'Sole - 1 Month',
    price: 4500,
    admissionFee: 500,
    durationLabel: '1 Month',
    features: [
      'Full facility & gym equipment access',
      'Locker room & shower access',
      'Admission fee: Rs. 500 (one-time on sign up)',
      'Free fitness orientation by Coach Adeesha',
      'Flexible monthly access without contract',
    ],
  },
  {
    id: 'sole_3m',
    type: 'sole',
    duration: '3_months',
    name: 'Sole - 3 Months',
    price: 12000,
    admissionFee: 500,
    durationLabel: '3 Months',
    savings: 'Save Rs. 1,500',
    popular: true,
    features: [
      'Full facility & gym equipment access',
      'Locker room & shower access',
      'Admission fee: Rs. 500 (one-time on sign up)',
      'Periodic progress & body assessment',
      'Workout & training progression guidance',
      'Save Rs. 1,500 compared to monthly',
    ],
  },
  {
    id: 'sole_6m',
    type: 'sole',
    duration: '6_months',
    name: 'Sole - 6 Months',
    price: 22000,
    admissionFee: 500,
    durationLabel: '6 Months',
    savings: 'Save Rs. 5,000',
    features: [
      'Full facility & gym equipment access',
      'Locker room & shower access',
      'Admission fee: Rs. 500 (one-time on sign up)',
      'Bi-weekly body measurement tracking',
      'Nutritional baseline consultation',
      'Save Rs. 5,000 compared to monthly',
    ],
  },
  {
    id: 'sole_1y',
    type: 'sole',
    duration: '1_year',
    name: 'Sole - 1 Year',
    price: 40000,
    admissionFee: 500,
    durationLabel: '1 Year (Best Value)',
    savings: 'Save Rs. 14,000',
    popular: true,
    features: [
      'Full 365-day VIP facility access',
      'Locker room & shower access',
      'Admission fee: Rs. 500 (one-time on sign up)',
      'Comprehensive body recomp & goal reviews',
      'Priority guidance from Coach Adeesha',
      'Maximum savings: Save Rs. 14,000',
    ],
  },

  // Couple Packages (Admission: Rs. 1,000)
  {
    id: 'couple_1m',
    type: 'couple',
    duration: '1_month',
    name: 'Couple - 1 Month',
    price: 8000,
    admissionFee: 1000,
    durationLabel: '1 Month',
    features: [
      'Access for 2 partners / companions',
      'Admission fee: Rs. 1,000 (one-time on sign up)',
      'Full facility & equipment access for both',
      'Locker room & shower access',
      'Shared fitness assessment',
    ],
  },
  {
    id: 'couple_3m',
    type: 'couple',
    duration: '3_months',
    name: 'Couple - 3 Months',
    price: 22500,
    admissionFee: 1000,
    durationLabel: '3 Months',
    savings: 'Save Rs. 1,500',
    popular: true,
    features: [
      'Access for 2 partners / companions',
      'Admission fee: Rs. 1,000 (one-time on sign up)',
      'Full facility access for both',
      'Shared progress measurement checks',
      'Workout & motivation accountability',
      'Save Rs. 1,500 compared to monthly',
    ],
  },
  {
    id: 'couple_6m',
    type: 'couple',
    duration: '6_months',
    name: 'Couple - 6 Months',
    price: 42000,
    admissionFee: 1000,
    durationLabel: '6 Months',
    savings: 'Save Rs. 6,000',
    features: [
      'Access for 2 partners / companions',
      'Admission fee: Rs. 1,000 (one-time on sign up)',
      'Full facility access for both',
      'Partner workout routine optimization',
      'Nutrition & diet baseline guidelines',
      'Save Rs. 6,000 compared to monthly',
    ],
  },
  {
    id: 'couple_1y',
    type: 'couple',
    duration: '1_year',
    name: 'Couple - 1 Year',
    price: 78000,
    admissionFee: 1000,
    durationLabel: '1 Year (Best Value)',
    savings: 'Save Rs. 18,000',
    popular: true,
    features: [
      'Full 365-day couple access for 2',
      'Admission fee: Rs. 1,000 (one-time on sign up)',
      'Year-round accountability & training guidance',
      'Direct guidance from Coach Adeesha',
      'Highest couple value: Save Rs. 18,000',
    ],
  },

  // Signature Coaching & Specialty Programs
  {
    id: 'burnzone',
    type: 'coaching',
    duration: '1_month',
    name: 'MuscleCraft BurnZone',
    price: 3000,
    admissionFee: 500,
    durationLabel: 'Per Month',
    popular: true,
    features: [
      'Functional fitness & high-intensity circuit training',
      'CrossFit-style metabolic conditioning & fat burn',
      'Strength and conditioning modules',
      'Body toning and weight management',
      'Supervised sessions with Coach Adeesha',
      'Admission fee: Rs. 500 (one-time on sign up)',
    ],
  },
  {
    id: 'coaching_90',
    type: 'coaching',
    duration: '90_days',
    name: '90 Days Better Me (Online Coaching)',
    price: 8000,
    admissionFee: 0,
    durationLabel: '12-Week Transformation Cohort',
    savings: 'Zero Admission Fee',
    popular: true,
    features: [
      'Personalized nutrition & macro calibration plan',
      'Custom progressive workout programming & form checks',
      'Weekly body metric & private photo progress analysis',
      'Direct 1-on-1 coach WhatsApp feedback & support',
      'Mindset & habit accountability coaching',
      'Private video exercise vault access',
      'Strict 90-day cohort access with milestone tracking',
    ],
  },
];

export type UserStatus = 'active' | 'pending' | 'suspended' | 'banned' | 'expired';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tier: string;
  packageName?: string;
  packageType?: 'sole' | 'couple' | 'coaching';
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
  referenceCode: string; // e.g. TRF-MC-74921
  tier: string;
  packageName?: string;
  packageType?: 'sole' | 'couple' | 'coaching';
  duration?: string;
  admissionFee?: number;
  packageAmount?: number;
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
export type VideoTargetScope = 'all_members' | 'specific_client' | 'coaching_90_vip';

export interface ExerciseVideo {
  id: string;
  title: string;
  category: 'Warmup' | 'Hypertrophy' | 'Powerlifting' | 'Mobility' | 'Coaching Clinic' | 'Technique Review' | 'Personalized Session';
  duration: string;
  accessLevel: VideoAccessLevel;
  cfStreamId: string;
  videoUrl?: string;
  thumbnailUrl: string;
  description: string;
  instructorName: string;
  targetScope?: VideoTargetScope;
  targetClientId?: string;
  targetClientName?: string;
  createdAt?: string;
}

export type BroadcastAudience =
  | 'all_members'
  | 'coaching_90_vip'
  | 'sole_members'
  | 'couple_members'
  | 'specific_client';

export type BroadcastChannel = 'in_app' | 'sms' | 'email' | 'push';

export interface BroadcastMessage {
  id: string;
  title: string;
  body: string;
  senderName: string;
  audience: BroadcastAudience;
  targetClientId?: string;
  targetClientName?: string;
  channels: BroadcastChannel[];
  priority: 'normal' | 'high' | 'urgent';
  createdAt: string;
  status: 'sent' | 'scheduled' | 'draft';
  recipientCount: number;
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
