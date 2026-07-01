'use client';
import { useEffect, useState, useRef } from 'react';
import { getSupabase } from '@/lib/supabase';

async function fetchRole(userId) {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
    if (error) {
      console.error('[useAuth] fetchRole:', error.message);
      return null;
    }
    return data?.role ?? null;
  } catch (err) {
    console.error('[useAuth] fetchRole exception:', err.message);
    return null;
  }
}

export function useAuth() {
  const [user, setUser]       = useState(null);
  const [role, setRole]       = useState(null);
  const [loading, setLoading] = useState(true);
  const initDone              = useRef(false);

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabase();

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        if (session?.user) {
          setUser(session.user);
          const r = await fetchRole(session.user.id);
          if (mounted) setRole(r ?? 'UNKNOWN');
        }
      } catch (err) {
        console.error('[useAuth] init:', err.message);
      } finally {
        if (mounted) setLoading(false);
        initDone.current = true;
      }
    };

    init();

    let sub;
    try {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;
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
          console.error('[useAuth] onAuthStateChange:', err.message);
        } finally {
          if (mounted) setLoading(false);
        }
      });
      sub = data;
    } catch (err) {
      console.error('[useAuth] subscription setup:', err.message);
      if (mounted) setLoading(false);
    }

    return () => {
      mounted = false;
      try { sub?.subscription?.unsubscribe(); } catch {}
    };
  }, []);

  const signOut = async () => {
    try {
      await getSupabase().auth.signOut();
    } catch (err) {
      console.error('[useAuth] signOut:', err.message);
    }
    setUser(null);
    setRole(null);
  };

  return { user, role, loading, signOut };
}
