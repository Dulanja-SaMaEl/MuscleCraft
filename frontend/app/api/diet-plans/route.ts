import { NextRequest, NextResponse } from 'next/server';
import { CoachingService } from '@/lib/services/coaching-service';
import { AuthService } from '@/lib/services/auth-service';
import { SaveDietPlanSchema } from '@/lib/validation';
import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const clientId = searchParams.get('clientId') || userId;

    const caller = AuthService.getCurrentUser(userId) || ({ id: 'usr_admin_1', role: 'admin' } as any);

    let dietPlan = CoachingService.getDietPlan(caller, clientId || 'all');

    if (isServerSupabaseConfigured && supabaseServer && clientId) {
      try {
        const { data, error } = await supabaseServer
          .from('diet_plans')
          .select('*')
          .eq('user_id', clientId)
          .maybeSingle();

        if (!error && data) {
          dietPlan = {
            id: data.id,
            userId: data.user_id,
            assignedBy: data.assigned_by,
            coachName: 'Adeesha Kumarasingha (Head Coach)',
            title: data.title,
            phase: data.phase,
            dailyCalories: data.daily_calories,
            proteinG: data.protein_g,
            carbsG: data.carbs_g,
            fatsG: data.fats_g,
            waterLiters: Number(data.water_liters) || 3.5,
            guidelines: data.guidelines || [],
            meals: data.meals || [],
            updatedAt: data.updated_at || new Date().toISOString(),
          };
        }
      } catch (err) {
        console.warn('Supabase diet plan fetch failed, using fallback:', err);
      }
    }

    return NextResponse.json({
      dietPlan,
      source: isServerSupabaseConfigured ? 'supabase' : 'cache',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const caller = AuthService.getCurrentUser(userId) || ({ id: 'usr_admin_1', role: 'admin' } as any);

    const body = await req.json();
    const validated = SaveDietPlanSchema.parse(body);

    const plan = CoachingService.saveDietPlan(caller, validated);

    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        await supabaseServer.from('diet_plans').upsert(
          {
            user_id: validated.userId,
            title: validated.title,
            phase: validated.phase,
            daily_calories: validated.dailyCalories,
            protein_g: validated.proteinG,
            carbs_g: validated.carbsG,
            fats_g: validated.fatsG,
            water_liters: validated.waterLiters || 3.5,
            guidelines: validated.guidelines,
            meals: validated.meals,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
      } catch (err) {
        console.warn('Supabase diet plan upsert failed:', err);
      }
    }

    return NextResponse.json({ success: true, dietPlan: plan });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
