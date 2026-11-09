import { createClient } from '@supabase/supabase-js';

function cleanEnv(val: string | undefined): string {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '');
}

export function extractSupabaseUrl(urlOrConnStr: string): string {
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

const rawUrl =
  cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
  cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL) ||
  '';

export const supabaseUrl = extractSupabaseUrl(rawUrl);

// Supports both new Supabase "Publishable key" and legacy "Anon key"
export const supabaseKey =
  cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
  cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_KEY);

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('placeholder')
);

// Create client if configured, otherwise provide safe fallback wrapper
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export function getSupabaseClient() {
  if (!supabase) {
    console.warn(
      '⚠️ Supabase is not configured yet. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) in .env.local to enable live database persistence.'
    );
  }
  return supabase;
}
