import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth-service';
import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, phone, tier, packageName, packageType } = body;

    // 1. Input Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Please enter your full name (at least 2 characters).' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();
    const selectedTier = tier || 'sole_1m';

    let registeredUser = null;
    let authUserId = `usr_${Date.now()}`;

    // 2. Register in Supabase Cloud (if configured)
    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        // A. Create Supabase Auth User with their chosen password
        const { data: authData, error: authError } = await supabaseServer.auth.admin.createUser({
          email: cleanEmail,
          password: password,
          email_confirm: true,
          user_metadata: {
            name: cleanName,
            role: 'client',
            phone: phone || null,
            tier: selectedTier,
          },
        });

        if (authError) {
          if (authError.message?.toLowerCase().includes('already registered') || authError.message?.toLowerCase().includes('unique')) {
            return NextResponse.json(
              { error: 'An account with this email address already exists. Please sign in instead.' },
              { status: 409 }
            );
          }
          console.warn('Supabase auth.admin.createUser warning:', authError.message);
        }

        if (authData?.user?.id) {
          authUserId = authData.user.id;
        }

        // B. Upsert into public.profiles table
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const profilePayload = {
          id: authUserId,
          email: cleanEmail,
          name: cleanName,
          phone: phone ? phone.trim() : null,
          role: 'client',
          tier: selectedTier,
          package_id: selectedTier,
          package_name: packageName || 'Sole - 1 Month',
          package_type: packageType || 'sole',
          status: 'active',
          avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          membership_expires_at: expiresAt,
          joined_at: new Date().toISOString(),
        };

        const { data: profileData, error: profileError } = await supabaseServer
          .from('profiles')
          .upsert(profilePayload, { onConflict: 'email' })
          .select()
          .maybeSingle();

        if (!profileError && profileData) {
          registeredUser = {
            id: String(profileData.id),
            email: profileData.email,
            name: profileData.name,
            role: profileData.role,
            tier: profileData.tier || selectedTier,
            packageId: profileData.package_id || selectedTier,
            packageName: profileData.package_name || 'Sole - 1 Month',
            packageType: profileData.package_type || 'sole',
            status: profileData.status || 'active',
            avatarUrl: profileData.avatar_url,
            membershipExpiresAt: profileData.membership_expires_at,
            joinedAt: profileData.joined_at,
            phone: profileData.phone,
          };
        }
      } catch (err: any) {
        console.warn('Supabase profile creation error:', err);
      }
    }

    // 3. Fallback / Synchronize with AuthService & Mock DB
    try {
      const localUser = AuthService.registerUser({
        name: cleanName,
        email: cleanEmail,
        password: password,
        phone: phone ? phone.trim() : undefined,
        tier: selectedTier,
        packageName: packageName || 'Sole - 1 Month',
        packageType: packageType || 'sole',
      });
      if (!registeredUser) {
        registeredUser = localUser;
      }
    } catch (err: any) {
      if (!registeredUser) {
        const isDuplicate = err.message?.toLowerCase().includes('already exists');
        return NextResponse.json({ error: err.message || 'Registration failed' }, { status: isDuplicate ? 409 : 400 });
      }
    }

    // Set password in credentials map for memory caching
    AuthService.setPassword(cleanEmail, password);

    return NextResponse.json(
      {
        success: true,
        user: registeredUser,
        message: 'Account created successfully! Welcome to MuscleCraft.',
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Server error while processing registration.' },
      { status: 500 }
    );
  }
}
