import { createBrowserClient } from '@supabase/ssr';

let _supabase = null;

export function getSupabase() {
  if (!_supabase) {
    _supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
  }
  return _supabase;
}

export const supabase = new Proxy({}, {
  get(_, prop) {
    return getSupabase()[prop];
  }
});
