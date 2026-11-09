import { NextRequest, NextResponse } from 'next/server';
import { CoachingService } from '@/lib/services/coaching-service';
import { AuthService } from '@/lib/services/auth-service';
import { AddMeasurementSchema } from '@/lib/validation';
import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabase/server';
import { db } from '@/lib/db/mock-db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const clientId = searchParams.get('clientId') || userId;

    const caller = AuthService.getCurrentUser(userId) || ({ id: 'usr_admin_1', role: 'admin' } as any);

    let measurements =
      clientId === 'all' || searchParams.get('all') === 'true'
        ? CoachingService.getAllClientMeasurements(caller)
        : CoachingService.getMeasurements(caller, clientId || 'all');

    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        let query = supabaseServer.from('body_measurements').select('*').order('date', { ascending: true });
        if (clientId && clientId !== 'all' && searchParams.get('all') !== 'true') {
          query = query.eq('user_id', clientId);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          measurements = data.map((m: any) => ({
            id: m.id,
            userId: m.user_id,
            weekNumber: m.week_number,
            date: m.date,
            weightKg: Number(m.weight_kg),
            bodyFatPercentage: m.body_fat_percentage ? Number(m.body_fat_percentage) : undefined,
            chestCm: m.chest_cm ? Number(m.chest_cm) : undefined,
            waistCm: m.waist_cm ? Number(m.waist_cm) : undefined,
            hipsCm: m.hips_cm ? Number(m.hips_cm) : undefined,
            armsCm: m.arms_cm ? Number(m.arms_cm) : undefined,
            thighsCm: m.thighs_cm ? Number(m.thighs_cm) : undefined,
            notes: m.notes || '',
            coachFeedback: m.coach_feedback || '',
          }));
        }
      } catch (sbErr) {
        console.warn('Supabase measurements fetch failed, using local cache:', sbErr);
      }
    }

    return NextResponse.json({
      measurements,
      source: isServerSupabaseConfigured ? 'supabase' : 'cache',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const caller = AuthService.getCurrentUser(userId) || ({ id: 'usr_admin_1', role: 'admin' } as any);

    const body = await req.json();
    const { measurementId, feedback } = body;

    if (!measurementId || !feedback) {
      return NextResponse.json({ error: 'Missing measurementId or feedback' }, { status: 400 });
    }

    const updated = CoachingService.addCoachFeedback(caller, measurementId, feedback);

    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        await supabaseServer
          .from('body_measurements')
          .update({ coach_feedback: feedback, feedback_at: new Date().toISOString() })
          .eq('id', measurementId);
      } catch (err) {
        console.warn('Supabase feedback update failed:', err);
      }
    }

    return NextResponse.json({ success: true, measurement: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const user = AuthService.getCurrentUser(userId) || (db.users[0] as any);

    const body = await req.json();
    const validated = AddMeasurementSchema.parse(body);

    const newMeasurement = CoachingService.addMeasurement(user, { ...validated, userId: user.id });

    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        await supabaseServer.from('body_measurements').insert({
          user_id: user.id,
          week_number: validated.weekNumber,
          date: validated.date,
          weight_kg: validated.weightKg,
          body_fat_percentage: validated.bodyFatPercentage,
          chest_cm: validated.chestCm,
          waist_cm: validated.waistCm,
          arms_cm: validated.armsCm,
          notes: validated.notes || '',
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Supabase measurement insert failed, cached locally:', err);
      }
    }

    return NextResponse.json({ success: true, measurement: newMeasurement }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Validation failed' },
      { status: 400 }
    );
  }
}
