import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/db/mock-db';
import { User } from '@/lib/types';

// Robust normalization for environment variables in hosted environments (Vercel, Railway, Node, etc.)
function cleanEnv(val: string | undefined): string {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '');
}

const rawUrl =
  cleanEnv(process.env.SUPABASE_URL) ||
  cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
  cleanEnv(process.env.SUPABASE_PROJECT_URL) ||
  cleanEnv(process.env.SUPABASE_REST_URL) ||
  '';

export const supabaseUrl = rawUrl.replace(/\/+$/, '');

// Accept Service Role / Secret Key for administrative server routes, or fallback to anon/publishable
export const supabaseKey =
  cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY) ||
  cleanEnv(process.env.SUPABASE_SECRET_KEY) ||
  cleanEnv(process.env.SUPABASE_SERVICE_KEY) ||
  cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
  cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_KEY) ||
  cleanEnv(process.env.SUPABASE_ANON_KEY) ||
  cleanEnv(process.env.SUPABASE_PUBLISHABLE_KEY) ||
  cleanEnv(process.env.SUPABASE_KEY) ||
  '';

export const isServerSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('placeholder')
);

export const supabaseServer = isServerSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

export async function pingSupabase(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  if (!supabaseServer) {
    return { ok: false, latencyMs: 0, error: 'Supabase credentials not configured' };
  }
  const start = Date.now();
  try {
    const { error } = await supabaseServer.from('gym_packages').select('id', { count: 'exact', head: true }).limit(1);
    const latencyMs = Date.now() - start;
    if (error) {
      // Fallback try profiles if gym_packages isn't yet migrated
      const { error: profError } = await supabaseServer.from('profiles').select('id', { count: 'exact', head: true }).limit(1);
      if (profError) {
        return { ok: false, latencyMs: Date.now() - start, error: error.message };
      }
    }
    return { ok: true, latencyMs };
  } catch (err: any) {
    return { ok: false, latencyMs: Date.now() - start, error: err.message };
  }
}

/**
 * Fetch a user profile by ID or email from Supabase, falling back to mock DB.
 */
export async function getSessionUser(userIdOrEmail?: string | null): Promise<User | null> {
  if (!userIdOrEmail) {
    return db.users.find((u) => u.role === 'admin') || db.users[0] || null;
  }

  const clean = userIdOrEmail.trim();

  if (isServerSupabaseConfigured && supabaseServer) {
    try {
      // Check by ID or email
      let query = supabaseServer.from('profiles').select('*');
      if (clean.includes('@')) {
        query = query.ilike('email', clean);
      } else {
        query = query.or(`id.eq."${clean}",email.eq."${clean}"`);
      }

      const { data, error } = await query.limit(1).maybeSingle();
      if (!error && data) {
        return {
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
      console.warn('Supabase profile query failed, using cache:', err);
    }
  }

  // Fallback to in-memory mock db
  const found =
    db.users.find((u) => u.id === clean || u.email.toLowerCase() === clean.toLowerCase()) ||
    (clean.includes('@')
      ? db.users.find((u) => u.email.toLowerCase().startsWith(clean.toLowerCase().split('@')[0]))
      : null);

  return found || null;
}
