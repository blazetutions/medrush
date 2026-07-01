'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export function AuthGuard({ children, allowedRoles }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // No session → login
    if (!user) {
      router.replace('/login');
      return;
    }

    // Bug 2 fix: sentinel 'UNKNOWN' means role fetch failed → redirect to login
    if (role === 'UNKNOWN') {
      router.replace('/login');
      return;
    }

    // Role loaded — check authorization
    if (role && allowedRoles && !allowedRoles.includes(role)) {
      router.replace('/login');
    }
  }, [user, role, loading, router, allowedRoles]);

  // Initial load spinner
  if (loading) return (
    <div className='flex h-screen items-center justify-center'>
      <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600' />
    </div>
  );

  // No user → blank while redirecting
  if (!user) return null;

  // Role not loaded yet → brief spinner (will resolve quickly since fetchRole is fast)
  if (!role) return (
    <div className='flex h-screen items-center justify-center'>
      <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600' />
    </div>
  );

  // Unknown role → blank while redirecting
  if (role === 'UNKNOWN') return null;

  // Wrong role → blank while redirecting
  if (allowedRoles && !allowedRoles.includes(role)) return null;

  return <>{children}</>;
}
