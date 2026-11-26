import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth-service';
import {
  supabaseServer,
  isServerSupabaseConfigured,
  getSessionUser,
  enforceAndSyncUserStatus,
  findAuthUserByEmail,
  verifySupabaseCredentials,
} from '@/lib/supabase/server';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

const ADMIN_ALIASES = new Set(['admin', 'owner', 'adeesha', 'coach', 'owner@musclecraft.lk']);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  let user = userId ? await getSessionUser(userId) : null;
  if (user) {
    user = await enforceAndSyncUserStatus(user);
  }

  return NextResponse.json({
    user,
    availablePersonas: [],
    source: isServerSupabaseConfigured ? 'supabase' : 'mock',
  });
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit('auth_login', ip, 15, 10 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: `Too many sign-in attempts. Please wait ${rate.retryAfterSeconds}s and try again.` },
        { status: 429 }
      );
    }
    const body = await req.json();
    const { email, password, personaId } = body;

    if (personaId) {
      return NextResponse.json(
        { error: 'Passwordless account switching is disabled in production.' },
        { status: 403 }
      );
    }

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string' || password.length === 0) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const rawCleanEmail = email.toLowerCase().trim();
    const targetEmail =
      ADMIN_ALIASES.has(rawCleanEmail) || rawCleanEmail.startsWith('admin@')
        ? 'musclecraftlk@gmail.com'
        : rawCleanEmail;

    let user = null;

    if (isServerSupabaseConfigured && supabaseServer) {
      // 1. Check whether the email already owns a Supabase Auth credential record
      const existingAuthUser = await findAuthUserByEmail(targetEmail);

      if (existingAuthUser) {
        // Strict Supabase Auth verification with isolated client - ZERO fallback on mismatch
        const { user: verifiedAuth } = await verifySupabaseCredentials(targetEmail, password);
        if (!verifiedAuth) {
          return NextResponse.json(
            { error: 'Invalid email or password.' },
            { status: 401 }
          );
        }
        user = await getSessionUser(targetEmail);
      } else {
        // Legacy seeded profile not yet provisioned in auth.users: strictly verify known credentials
        const localValid = AuthService.verifyPassword(targetEmail, password);
        if (!localValid) {
          return NextResponse.json(
            { error: 'Invalid email or password.' },
            { status: 401 }
          );
        }

        user = await getSessionUser(targetEmail);
        if (user) {
          // Auto-provision into Supabase Auth now that the seeded credential was strictly verified
          try {
            await supabaseServer.auth.admin.createUser({
              email: targetEmail,
              password,
              email_confirm: true,
              user_metadata: {
                name: user.name,
                role: user.role,
              },
            });
          } catch {
            // Safe to ignore if already created concurrently
          }
        }
      }
    } else {
      // Pure local/mock fallback mode (strict password required)
      const authRes = AuthService.authenticate(targetEmail, password);
      if (authRes.error || !authRes.user) {
        return NextResponse.json(
          { error: authRes.error || 'Invalid email or password.' },
          { status: 401 }
        );
      }
      user = authRes.user;
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    user = await enforceAndSyncUserStatus(user);

    // Block banned/suspended users immediately at authentication boundary
    if (user && user.status === 'suspended') {
      return NextResponse.json(
        {
          error: 'Your MuscleCraft account has been suspended/banned by the administrator. Please contact Coach Adeesha for assistance.',
          code: 'ACCOUNT_SUSPENDED',
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, user, source: isServerSupabaseConfigured ? 'supabase' : 'mock' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Authentication error' }, { status: 500 });
  }
}
