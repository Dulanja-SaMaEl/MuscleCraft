import { NextRequest, NextResponse } from 'next/server';
import { CoachingService } from '@/lib/services/coaching-service';
import { AuthService } from '@/lib/services/auth-service';
import { ScheduleAppointmentSchema } from '@/lib/validation';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const caller = AuthService.getCurrentUser(userId);

    if (!caller) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const appointments = CoachingService.getAppointments(caller);
    return NextResponse.json({ appointments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const caller = AuthService.getCurrentUser(userId);

    if (!caller) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = ScheduleAppointmentSchema.parse(body);

    const appointment = CoachingService.scheduleAppointment(caller, {
      title: validated.title,
      type: validated.type,
      instructorId: validated.instructorId,
      clientId: validated.clientId,
      scheduledAt: validated.scheduledAt,
      durationMinutes: validated.durationMinutes,
      meetingLink: validated.meetingLink,
      notes: validated.notes,
    });

    return NextResponse.json({ success: true, appointment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
