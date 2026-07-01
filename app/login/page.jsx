'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast, { Toaster } from 'react-hot-toast';

export const dynamic = 'force-dynamic';

const ROLE_REDIRECT = {
  admin:    '/admin',
  hospital: '/hospital',
  agent:    '/agent',
  customer: '/customer',
};

async function fetchProfileWithRetry(userId, maxRetries = 3) {
  const supabase = getSupabase();
  for (let i = 0; i < maxRetries; i++) {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
    if (error) {
      console.error(`[fetchProfileWithRetry] attempt ${i + 1}:`, error.message);
      if (i < maxRetries - 1) await new Promise(r => setTimeout(r, 500));
      continue;
    }
    if (data?.role) return data;
    if (i < maxRetries - 1) await new Promise(r => setTimeout(r, 500));
  }
  return null;
}

export default function LoginPage() {
  const router  = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const profile = await fetchProfileWithRetry(data.user.id);

      if (!profile?.role) {
        // Profile not found — upsert as customer fallback
        await supabase.from('users').upsert({
          id:    data.user.id,
          email: data.user.email,
          role:  'customer',
          name:  data.user.email.split('@')[0],
        });
        router.push('/customer');
        return;
      }

      router.push(ROLE_REDIRECT[profile.role] ?? '/customer');
    } catch (err) {
      toast.error(err.message ?? 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-slate-900 flex items-center justify-center px-4'>
      <Toaster />
      <div className='bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md'>
        <h1 className='text-3xl font-black text-slate-900 mb-1'>🚑 MedRush</h1>
        <p className='text-slate-500 mb-6 text-sm'>Sign in to your portal</p>
        <form onSubmit={handleLogin} className='space-y-4'>
          <div>
            <Label>Email</Label>
            <Input
              type='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className='mt-1'
              placeholder='you@example.com'
            />
          </div>
          <div>
            <Label>Password</Label>
            <Input
              type='password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className='mt-1'
            />
          </div>
          <Button
            type='submit'
            disabled={loading}
            className='w-full bg-teal-600 hover:bg-teal-700 text-white'
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
        <p className='text-xs text-slate-400 mt-6 text-center'>
          MedRush Healthcare Pvt Ltd · Madurai
        </p>
      </div>
    </div>
  );
}
