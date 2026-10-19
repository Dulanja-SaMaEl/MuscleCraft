import { NextRequest, NextResponse } from 'next/server';
import { CoachingService } from '@/lib/services/coaching-service';
import { AuthService } from '@/lib/services/auth-service';
import { SaveDietPlanSchema } from '@/lib/validation';

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

    const dietPlan = CoachingService.getDietPlan(caller, clientId);
    return NextResponse.json({ dietPlan });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
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
    const validated = SaveDietPlanSchema.parse(body);

    const plan = CoachingService.saveDietPlan(caller, validated);
    return NextResponse.json({ success: true, dietPlan: plan });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
