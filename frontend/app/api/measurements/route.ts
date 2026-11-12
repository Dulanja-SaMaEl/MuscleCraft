import { NextRequest, NextResponse } from 'next/server';
import { CoachingService } from '@/lib/services/coaching-service';
import { AuthService } from '@/lib/services/auth-service';
import { AddMeasurementSchema } from '@/lib/validation';
import { supabaseServer, isServerSupabaseConfigured, getSessionUser } from '@/lib/supabase/server';
import { db } from '@/lib/db/mock-db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const clientId = searchParams.get('clientId') || userId;

    let caller = await getSessionUser(userId);
    if (!caller) {
      caller = AuthService.getCurrentUser(userId) || ({ id: 'usr_admin_1', role: 'admin' } as any);
    }

    let measurements: any[] = [];

    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        let query = supabaseServer
          .from('body_measurements')
          .select('*')
          .order('week_number', { ascending: true });

        if (clientId && clientId !== 'all' && searchParams.get('all') !== 'true') {
          query = query.eq('user_id', clientId);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          measurements = data.map((m: any) => ({
            id: String(m.id),
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

    // Fallback to local memory mock only if no records found and clientId is a mock user
    if (measurements.length === 0) {
      const isMockClient = clientId === 'usr_client_90' || !clientId || clientId === 'all';
      if (isMockClient) {
        const safeCaller: any = caller || { id: 'usr_admin_1', role: 'admin' };
        const mockMeasurements =
          clientId === 'all' || searchParams.get('all') === 'true'
            ? CoachingService.getAllClientMeasurements(safeCaller)
            : CoachingService.getMeasurements(safeCaller, clientId || 'all');
        if (mockMeasurements && mockMeasurements.length > 0) {
          measurements = mockMeasurements;
        }
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
    const caller =
      (await getSessionUser(userId)) ||
      AuthService.getCurrentUser(userId) ||
      ({ id: 'usr_admin_1', role: 'admin' } as any);

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
    const urlUserId = searchParams.get('userId');
    const body = await req.json();
    const validated = AddMeasurementSchema.parse(body);

    const targetUserId = body.userId || urlUserId || 'usr_client_90';
    const resolvedUser = await getSessionUser(targetUserId);
    const safeUser: any =
      resolvedUser ||
      AuthService.getCurrentUser(targetUserId) ||
      ({
        id: targetUserId,
        name: 'Athlete',
        role: 'client',
        email: 'athlete@musclecraft.lk',
      } as any);

    const newMeasurement = CoachingService.addMeasurement(safeUser, {
      ...validated,
      userId: targetUserId,
    });

    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        const { data: inserted, error: sbErr } = await supabaseServer
          .from('body_measurements')
          .insert({
            user_id: targetUserId,
            week_number: validated.weekNumber,
            date: validated.date,
            weight_kg: validated.weightKg,
            body_fat_percentage: validated.bodyFatPercentage || null,
            chest_cm: validated.chestCm || null,
            waist_cm: validated.waistCm || null,
            arms_cm: validated.armsCm || null,
            notes: validated.notes || '',
            created_at: new Date().toISOString(),
          })
          .select()
          .maybeSingle();

        if (sbErr) {
          console.error('Supabase measurement insert error:', sbErr);
        } else if (inserted) {
          newMeasurement.id = String(inserted.id);
        }
      } catch (err) {
        console.error('Supabase measurement insert exception:', err);
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
