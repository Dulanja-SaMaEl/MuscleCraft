import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth-service';
import { db } from '@/lib/db/mock-db';
import { supabaseServer, isServerSupabaseConfigured, getSessionUser } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  let user = await getSessionUser(userId);

  // Available personas: load real profiles from Supabase if configured
  let availablePersonas: any[] = [];

  if (isServerSupabaseConfigured && supabaseServer) {
    try {
      const { data: profiles } = await supabaseServer
        .from('profiles')
        .select('id, name, email, role, tier, status')
        .order('role', { ascending: true });

      if (profiles && profiles.length > 0) {
        availablePersonas = profiles.map((p) => ({
          id: String(p.id),
          name: p.name,
          email: p.email,
          role: p.role,
          tier: p.tier || 'none',
          status: p.status || 'active',
        }));
      }
    } catch (err) {
      console.warn('Could not query personas from Supabase:', err);
    }
  }

  // Fallback / merge with default personas
  if (availablePersonas.length === 0) {
    availablePersonas = db.users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      tier: u.tier,
      status: u.status,
    }));
  }

  return NextResponse.json({
    user,
    availablePersonas,
    source: isServerSupabaseConfigured ? 'supabase' : 'mock',
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, personaId } = body;

    let user = null;

    if (personaId) {
      user = await getSessionUser(personaId);
    } else if (email) {
      const cleanEmail = email.toLowerCase().trim();

      // 1. Check Supabase profiles table
      if (isServerSupabaseConfigured && supabaseServer) {
        try {
          const { data, error } = await supabaseServer
            .from('profiles')
            .select('*')
            .ilike('email', cleanEmail)
            .limit(1)
            .maybeSingle();

          if (!error && data) {
            user = {
              id: String(data.id),
              email: data.email,
              name: data.name,
              role: data.role,
              tier: data.tier || 'none',
              packageId: data.package_id,
              packageName: data.package_name,
              packageType: data.package_type,
              status: data.status || 'active',
              avatarUrl: data.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
              assignedInstructorId: data.assigned_instructor_id,
              assignedInstructorName: data.assigned_instructor_name,
              membershipExpiresAt: data.membership_expires_at,
              joinedAt: data.joined_at,
              phone: data.phone,
            };
          }
        } catch (err) {
          console.warn('Supabase auth search error:', err);
        }
      }

      // 2. Fallback to AuthService (for demo / seeded accounts)
      if (!user) {
        user = AuthService.authenticate(email, password);
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'No account found matching this email. Please check your credentials or contact Coach Adeesha on WhatsApp.' },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, user, source: isServerSupabaseConfigured ? 'supabase' : 'mock' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Authentication error' }, { status: 500 });
  }
}
