'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

async function fetchRole(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  if (error) console.error('[useAuth] fetchRole error:', error.message);
  return data?.role ?? null;
}

export function useAuth() {
  const [user, setUser]       = useState(null);
  const [role, setRole]       = useState(null);
  const [loading, setLoading] = useState(true);
  const initDone              = useRef(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          const r = await fetchRole(session.user.id);
          if (mounted) {
            // Bug 1 fix: use sentinel 'UNKNOWN' instead of null so AuthGuard can redirect
            setRole(r ?? 'UNKNOWN');
          }
        }
      } catch (err) {
        console.error('[useAuth] init error:', err.message);
      } finally {
        if (mounted) setLoading(false);
        initDone.current = true;
      }
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      // Bug 4 fix: skip INITIAL_SESSION and events before init completes
      if (event === 'INITIAL_SESSION') return;
      if (!initDone.current) return;

      try {
        if (session?.user) {
          setUser(session.user);
          const r = await fetchRole(session.user.id);
          if (mounted) setRole(r ?? 'UNKNOWN');
        } else {
          setUser(null);
          setRole(null);
        }
      } catch (err) {
        console.error('[useAuth] onAuthStateChange error:', err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
  };

  return { user, role, loading, signOut };
}
