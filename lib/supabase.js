import { createBrowserClient } from '@supabase/ssr';

let _client = null;

function createClient() {
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }
  return _client;
}

// Safe lazy proxy — defers client creation to first access (client-side only)
export const supabase = new Proxy({}, {
  get(_, prop) {
    return createClient()[prop];
  },
  apply(_, thisArg, args) {
    return createClient()(...args);
  }
});

export function getSupabase() {
  return createClient();
}
