import { NextRequest, NextResponse } from 'next/server';
import { CoachingService } from '@/lib/services/coaching-service';
import { AuthService } from '@/lib/services/auth-service';
import { AddMeasurementSchema } from '@/lib/validation';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const clientId = searchParams.get('clientId') || userId;

    const caller = AuthService.getCurrentUser(userId);
    if (!caller) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!clientId) {
      return NextResponse.json({ error: 'Missing clientId parameter' }, { status: 400 });
    }

    if (clientId === 'all' || searchParams.get('all') === 'true') {
      const allMeasurements = CoachingService.getAllClientMeasurements(caller);
      return NextResponse.json({ measurements: allMeasurements });
    }

    const measurements = CoachingService.getMeasurements(caller, clientId);
    return NextResponse.json({ measurements });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const caller = AuthService.getCurrentUser(userId);

    if (!caller) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { measurementId, feedback } = body;

    if (!measurementId || !feedback) {
      return NextResponse.json({ error: 'Missing measurementId or feedback' }, { status: 400 });
    }

    const updated = CoachingService.addCoachFeedback(caller, measurementId, feedback);
    return NextResponse.json({ success: true, measurement: updated });
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
    const validated = AddMeasurementSchema.parse(body);

    const measurement = CoachingService.addMeasurement(caller, {
      userId: body.userId || caller.id,
      weekNumber: validated.weekNumber,
      date: validated.date,
      weightKg: validated.weightKg,
      bodyFatPercentage: validated.bodyFatPercentage,
      chestCm: validated.chestCm,
      waistCm: validated.waistCm,
      hipsCm: validated.hipsCm,
      armsCm: validated.armsCm,
      thighsCm: validated.thighsCm,
      notes: validated.notes,
    });

    return NextResponse.json({ success: true, measurement }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
