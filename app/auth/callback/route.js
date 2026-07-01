// Bug 5 fix: missing auth callback route for @supabase/ssr session exchange
import { createServerSupabase } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    try {
      const supabase = await createServerSupabase();
      await supabase.auth.exchangeCodeForSession(code);
    } catch (err) {
      console.error('[auth/callback] error:', err.message);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
