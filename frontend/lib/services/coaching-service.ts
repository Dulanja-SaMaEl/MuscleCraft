import { db } from '../db/mock-db';
import { BodyMeasurement, DietPlan, Appointment, User } from '../types';

export class CoachingService {
  // Verify access permissions to prevent IDOR
  private static canAccessClientData(caller: User, targetClientId: string): boolean {
    if (caller.role === 'admin') return true;
    if (caller.id === targetClientId) return true;
    if (caller.role === 'instructor') {
      const client = db.users.find((u) => u.id === targetClientId);
      return client?.assignedInstructorId === caller.id;
    }
    return false;
  }

  // --- MEASUREMENTS ---
  static getMeasurements(caller: User, targetClientId: string): BodyMeasurement[] {
    if (!this.canAccessClientData(caller, targetClientId)) {
      throw new Error('Forbidden: You are not authorized to view these measurements.');
    }

    return db.measurements
      .filter((m) => m.userId === targetClientId)
      .sort((a, b) => a.weekNumber - b.weekNumber);
  }

  static addMeasurement(
    caller: User,
    data: {
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
    }
  ): BodyMeasurement {
    if (caller.id !== data.userId && caller.role !== 'admin') {
      throw new Error('Forbidden: You can only record your own measurements.');
    }

    const newMeasurement: BodyMeasurement = {
      id: `meas_${Date.now()}`,
      userId: data.userId,
      weekNumber: data.weekNumber,
      date: data.date,
      weightKg: data.weightKg,
      bodyFatPercentage: data.bodyFatPercentage,
      chestCm: data.chestCm,
      waistCm: data.waistCm,
      hipsCm: data.hipsCm,
      armsCm: data.armsCm,
      thighsCm: data.thighsCm,
      notes: data.notes,
    };

    db.measurements.push(newMeasurement);
    return newMeasurement;
  }

  static addCoachFeedback(
    instructor: User,
    measurementId: string,
    feedback: string
  ): BodyMeasurement {
    if (instructor.role !== 'instructor' && instructor.role !== 'admin') {
      throw new Error('Forbidden: Only instructors can submit coach feedback.');
    }

    const measurement = db.measurements.find((m) => m.id === measurementId);
    if (!measurement) {
      throw new Error('Measurement record not found.');
    }

    measurement.coachFeedback = feedback;
    return measurement;
  }

  // --- DIET PLANS ---
  static getDietPlan(caller: User, targetClientId: string): DietPlan | null {
    if (!this.canAccessClientData(caller, targetClientId)) {
      throw new Error('Forbidden: You are not authorized to view this diet plan.');
    }

    return db.dietPlans.find((d) => d.userId === targetClientId) || null;
  }

  static saveDietPlan(
    instructor: User,
    data: {
      userId: string;
      title: string;
      phase: string;
      dailyCalories: number;
      proteinG: number;
      carbsG: number;
      fatsG: number;
      waterLiters: number;
      guidelines: string[];
      meals: { meal: string; items: string; macros: string }[];
    }
  ): DietPlan {
    if (instructor.role !== 'instructor' && instructor.role !== 'admin') {
      throw new Error('Forbidden: Only instructors and admins can create or edit diet plans.');
    }

    const existingIndex = db.dietPlans.findIndex((d) => d.userId === data.userId);

    const plan: DietPlan = {
      id: existingIndex >= 0 ? db.dietPlans[existingIndex].id : `diet_${Date.now()}`,
      userId: data.userId,
      assignedBy: instructor.id,
      coachName: instructor.name,
      title: data.title,
      phase: data.phase,
      dailyCalories: data.dailyCalories,
      proteinG: data.proteinG,
      carbsG: data.carbsG,
      fatsG: data.fatsG,
      waterLiters: data.waterLiters,
      guidelines: data.guidelines,
      meals: data.meals,
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      db.dietPlans[existingIndex] = plan;
    } else {
      db.dietPlans.push(plan);
    }

    // Audit log
    db.auditLogs.unshift({
      id: `log_${Date.now()}`,
      actorId: instructor.id,
      actorEmail: instructor.email,
      action: 'DIET_PLAN_UPDATED',
      targetType: 'diet_plan',
      targetId: plan.id,
      details: `Diet plan "${plan.title}" saved for client ${data.userId}.`,
      timestamp: new Date().toISOString(),
    });

    return plan;
  }

  // --- APPOINTMENTS ---
  static getAppointments(caller: User): Appointment[] {
    if (caller.role === 'admin') {
      return db.appointments;
    }

    if (caller.role === 'instructor') {
      return db.appointments.filter((a) => a.instructorId === caller.id);
    }

    // Client sees their 1-on-1 consultations AND all group coaching sessions
    return db.appointments.filter(
      (a) => a.clientId === caller.id || a.type === 'group_coaching'
    );
  }

  static scheduleAppointment(
    caller: User,
    data: {
      title: string;
      type: 'individual_consultation' | 'group_coaching';
      instructorId: string;
      clientId?: string;
      scheduledAt: string;
      durationMinutes?: number;
      meetingLink?: string;
      notes?: string;
    }
  ): Appointment {
    const instructor = db.users.find((u) => u.id === data.instructorId);
    if (!instructor) {
      throw new Error('Instructor not found.');
    }

    let clientName: string | undefined;
    if (data.clientId) {
      const client = db.users.find((u) => u.id === data.clientId);
      clientName = client?.name;
    }

    const apt: Appointment = {
      id: `apt_${Date.now()}`,
      title: data.title,
      type: data.type,
      instructorId: data.instructorId,
      instructorName: instructor.name,
      clientId: data.clientId,
      clientName,
      scheduledAt: data.scheduledAt,
      durationMinutes: data.durationMinutes || 60,
      meetingLink: data.meetingLink || 'https://meet.google.com/iron-session',
      status: 'scheduled',
      notes: data.notes,
    };

    db.appointments.unshift(apt);
    return apt;
  }
}
