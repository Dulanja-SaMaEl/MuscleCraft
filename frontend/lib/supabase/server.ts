import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/db/mock-db';
import { User } from '@/lib/types';

// Robust normalization for environment variables in hosted environments (Vercel, Railway, Node, etc.)
function cleanEnv(val: string | undefined): string {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '');
}

function extractSupabaseUrl(urlOrConnStr: string): string {
  if (!urlOrConnStr) return '';
  const clean = cleanEnv(urlOrConnStr);
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean.replace(/\/+$/, '');
  }
  // Try extracting project ref from postgres connection string:
  // e.g. postgresql://postgres:password@db.abcdefghijklmnop.supabase.co:5432/postgres
  const matchDb = clean.match(/db\.([a-z0-9_-]+)\.supabase\.co/i);
  if (matchDb && matchDb[1]) {
    return `https://${matchDb[1]}.supabase.co`;
  }
  // e.g. postgresql://postgres.abcdefghijklmnop:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
  const matchPooler = clean.match(/postgres\.([a-z0-9_-]+):/i);
  if (matchPooler && matchPooler[1]) {
    return `https://${matchPooler[1]}.supabase.co`;
  }
  return '';
}

export function discoverSupabaseCredentials() {
  let foundUrl = '';
  let foundSecretKey = '';
  let foundPubKey = '';

  // 1. Direct explicit URL checks
  const explicitUrls = [
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PROJECT_URL,
    process.env.SUPABASE_REST_URL,
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.SUPABASE_DATABASE_URL,
  ];
  for (const u of explicitUrls) {
    const ext = extractSupabaseUrl(u || '');
    if (ext) {
      foundUrl = ext;
      break;
    }
  }

  // 2. Scan all process.env keys dynamically for URL if still not found
  if (!foundUrl && typeof process !== 'undefined' && process.env) {
    for (const [key, val] of Object.entries(process.env)) {
      if (!val) continue;
      const clean = cleanEnv(val);
      if (clean.includes('.supabase.co') || clean.includes('supabase.com')) {
        const ext = extractSupabaseUrl(clean);
        if (ext) {
          foundUrl = ext;
          break;
        }
      }
    }
  }

  // 3. Scan all process.env keys for secret / service role key
  if (typeof process !== 'undefined' && process.env) {
    for (const [key, val] of Object.entries(process.env)) {
      if (!val) continue;
      const clean = cleanEnv(val);
      const lowerKey = key.toLowerCase();

      if (clean.startsWith('sb_secret_')) {
        foundSecretKey = clean;
        break;
      }
      if (
        (lowerKey.includes('secret') || lowerKey.includes('service_role') || lowerKey.includes('service')) &&
        (clean.startsWith('sb_') || clean.startsWith('eyJ'))
      ) {
        foundSecretKey = clean;
        break;
      }
    }
  }

  // 4. Scan all process.env keys for publishable / anon key
  if (typeof process !== 'undefined' && process.env) {
    for (const [key, val] of Object.entries(process.env)) {
      if (!val) continue;
      const clean = cleanEnv(val);
      const lowerKey = key.toLowerCase();

      if (clean.startsWith('sb_publishable_')) {
        foundPubKey = clean;
        break;
      }
      if (
        (lowerKey.includes('publishable') || lowerKey.includes('anon') || lowerKey.includes('public')) &&
        (clean.startsWith('sb_') || clean.startsWith('eyJ'))
      ) {
        foundPubKey = clean;
        break;
      }
    }
  }

  const chosenKey =
    foundSecretKey ||
    foundPubKey ||
    cleanEnv(process.env.SUPABASE_SECRET_KEY) ||
    cleanEnv(process.env.SECRET_KEY) ||
    cleanEnv(process.env['secret_key']) ||
    cleanEnv(process.env['publishable key']) ||
    cleanEnv(process.env['publishable_key']) ||
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY) ||
    '';

  return {
    url: foundUrl,
    key: chosenKey,
    secretKey: foundSecretKey,
    pubKey: foundPubKey,
  };
}

const discovered = discoverSupabaseCredentials();

export const supabaseUrl = discovered.url;
export const supabaseKey = discovered.key;

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

export async function pingSupabase(): Promise<{
  ok: boolean;
  latencyMs: number;
  error?: string;
  tableChecked?: string;
  tableCounts?: { profiles?: number; packages?: number; payments?: number; sales?: number };
}> {
  if (!supabaseServer) {
    return { ok: false, latencyMs: 0, error: 'Supabase credentials not configured in environment variables' };
  }
  const start = Date.now();
  try {
    // Probe primary packages table
    const { count: pkgCount, error: pkgError } = await supabaseServer
      .from('gym_packages')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    const latencyMs = Date.now() - start;

    if (!pkgError) {
      // Fetch other counts for comprehensive telemetry
      let pCount = 0;
      let payCount = 0;
      let sCount = 0;
      try {
        const [profRes, payRes, sRes] = await Promise.all([
          supabaseServer.from('profiles').select('id', { count: 'exact', head: true }),
          supabaseServer.from('payments').select('id', { count: 'exact', head: true }),
          supabaseServer.from('daily_sales_reviews').select('id', { count: 'exact', head: true }),
        ]);
        pCount = profRes.count || 0;
        payCount = payRes.count || 0;
        sCount = sRes.count || 0;
      } catch (e) {
        // secondary count failures don't invalidate connection
      }

      return {
        ok: true,
        latencyMs,
        tableChecked: 'gym_packages',
        tableCounts: {
          packages: pkgCount || 0,
          profiles: pCount,
          payments: payCount,
          sales: sCount,
        },
      };
    }

    // Fallback try profiles if gym_packages not found
    const { count: profCount, error: profError } = await supabaseServer
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    if (!profError) {
      return {
        ok: true,
        latencyMs: Date.now() - start,
        tableChecked: 'profiles',
        tableCounts: { profiles: profCount || 0 },
      };
    }

    // If both failed, return specific error
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: `Supabase reached, but table access failed: ${pkgError?.message || profError?.message}. Please execute supabase/schema.sql in the Supabase SQL Editor.`,
    };
  } catch (err: any) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: err.message || 'Network exception connecting to Supabase host',
    };
  }
}

/**
 * Fetch a user profile by ID or email from Supabase, falling back to mock DB.
 */
export async function getSessionUser(userIdOrEmail?: string | null): Promise<User | null> {
  if (!userIdOrEmail) {
    return null;
  }

  const clean = userIdOrEmail.trim();

  if (isServerSupabaseConfigured && supabaseServer) {
    try {
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
