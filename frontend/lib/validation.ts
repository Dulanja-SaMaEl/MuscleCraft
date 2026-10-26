import { z } from 'zod';

export const SubmitBankTransferSchema = z.object({
  tier: z.string().min(2).max(50),
  referenceCode: z.string().min(5).max(30),
  bankName: z.string().min(2).max(100),
  transferDate: z.string().min(8).max(20),
  senderAccountName: z.string().min(2).max(100),
  receiptNotes: z.string().max(500).optional(),
});

export const ApprovePaymentSchema = z.object({
  adminNotes: z.string().max(300).optional(),
});

export const RejectPaymentSchema = z.object({
  reason: z.string().min(3).max(300),
});

export const AddMeasurementSchema = z.object({
  weekNumber: z.number().int().min(1).max(52),
  date: z.string().min(8).max(20),
  weightKg: z.number().positive().max(300),
  bodyFatPercentage: z.number().min(3).max(60).optional(),
  chestCm: z.number().positive().max(200).optional(),
  waistCm: z.number().positive().max(200).optional(),
  hipsCm: z.number().positive().max(200).optional(),
  armsCm: z.number().positive().max(100).optional(),
  thighsCm: z.number().positive().max(120).optional(),
  notes: z.string().max(500).optional(),
});

export const SaveDietPlanSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(3).max(100),
  phase: z.string().min(3).max(100),
  dailyCalories: z.number().int().min(1000).max(8000),
  proteinG: z.number().int().min(50).max(500),
  carbsG: z.number().int().min(0).max(800),
  fatsG: z.number().int().min(10).max(300),
  waterLiters: z.number().positive().max(10),
  guidelines: z.array(z.string()),
  meals: z.array(
    z.object({
      meal: z.string(),
      items: z.string(),
      macros: z.string(),
    })
  ),
});

export const ScheduleAppointmentSchema = z.object({
  title: z.string().min(3).max(100),
  type: z.enum(['individual_consultation', 'group_coaching']),
  instructorId: z.string().min(1),
  clientId: z.string().optional(),
  scheduledAt: z.string().min(10),
  durationMinutes: z.number().int().min(15).max(180).optional(),
  meetingLink: z.string().url().optional(),
  notes: z.string().max(500).optional(),
});

export const AddVideoSchema = z.object({
  title: z.string().min(3).max(120),
  category: z.enum([
    'Warmup',
    'Hypertrophy',
    'Powerlifting',
    'Mobility',
    'Coaching Clinic',
    'Technique Review',
    'Personalized Session',
  ]),
  duration: z.string().min(2).max(20),
  accessLevel: z.enum(['common', 'coaching_90']).default('common'),
  targetScope: z.enum(['all_members', 'specific_client', 'coaching_90_vip']).default('all_members'),
  targetClientId: z.string().optional(),
  targetClientName: z.string().optional(),
  cfStreamId: z.string().min(1).default('cf_stream_local'),
  videoUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url(),
  description: z.string().min(5).max(500),
});

export const BroadcastMessageSchema = z.object({
  title: z.string().min(3).max(150),
  body: z.string().min(5).max(2000),
  audience: z.enum(['all_members', 'coaching_90_vip', 'sole_members', 'couple_members', 'specific_client']),
  targetClientId: z.string().optional(),
  targetClientName: z.string().optional(),
  channels: z.array(z.enum(['in_app', 'sms', 'email', 'push'])).min(1),
  priority: z.enum(['normal', 'high', 'urgent']).default('normal'),
});
