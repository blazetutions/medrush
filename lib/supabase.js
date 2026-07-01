import { createBrowserClient } from '@supabase/ssr';

// Create client immediately - safe because NEXT_PUBLIC_ vars are inlined at build time by Next.js
// Empty string fallbacks prevent crashes during SSR/build when window is undefined
const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  || '';
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createBrowserClient(supabaseUrl, supabaseAnon);

export function getSupabase() {
  return supabase;
}
