import { createClient } from '@supabase/supabase-js';

function cleanEnv(val: string | undefined): string {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '');
}

const rawUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const supabaseUrl = rawUrl.replace(/\/+$/, '');

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
