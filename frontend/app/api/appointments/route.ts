import { NextRequest, NextResponse } from 'next/server';
import { CoachingService } from '@/lib/services/coaching-service';
import { ScheduleAppointmentSchema } from '@/lib/validation';
import { supabaseServer, isServerSupabaseConfigured, getSessionUser } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const caller = await getSessionUser(userId);

    if (!caller) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let appointments: any[] = [];

    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        let query = supabaseServer.from('appointments').select('*').order('scheduled_at', { ascending: true });

        if (caller.role === 'client') {
          query = query.or(`client_id.eq."${caller.id}",client_name.ilike."%${caller.name}%"`);
        } else if (caller.role === 'instructor') {
          query = query.or(`instructor_id.eq."${caller.id}"`);
        }

        const { data, error } = await query;
        if (!error && data) {
          appointments = data.map((a: any) => ({
            id: String(a.id),
            title: a.title,
            type: a.type,
            instructorId: a.instructor_id,
            clientId: a.client_id,
            clientName: a.client_name,
            scheduledAt: a.scheduled_at,
            durationMinutes: a.duration_minutes,
            meetingLink: a.meeting_link,
            status: a.status,
            notes: a.notes,
          }));
        }
      } catch (sbErr) {
        console.warn('Supabase appointments fetch failed, using cache:', sbErr);
      }
    } else {
      appointments = CoachingService.getAppointments(caller);
    }

    return NextResponse.json({ appointments, source: isServerSupabaseConfigured ? 'supabase' : 'cache' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const caller = await getSessionUser(userId);

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

    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        await supabaseServer.from('appointments').insert({
          title: validated.title,
          type: validated.type,
          instructor_id: validated.instructorId,
          client_id: validated.clientId,
          client_name: caller.role === 'client' ? caller.name : undefined,
          scheduled_at: validated.scheduledAt,
          duration_minutes: validated.durationMinutes,
          meeting_link: validated.meetingLink,
          status: 'scheduled',
          notes: validated.notes,
        });
      } catch (sbErr) {
        console.warn('Supabase appointment insert failed:', sbErr);
      }
    }

    return NextResponse.json({ success: true, appointment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
