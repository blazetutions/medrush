'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { StatCard } from '@/components/shared/StatCard';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const STATUS_COLOR = {
  pending:   'bg-amber-100 text-amber-700',
  confirmed: 'bg-teal-100 text-teal-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function HospitalDashboard() {
  const { user } = useAuth();
  const [hospital, setHospital] = useState(null);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (!user) return;
    // Bug 9 fix: single query — fetch hospital with all data, then bookings
    supabase.from('hospitals').select('*').eq('user_id', user.id).single()
      .then(({ data: h }) => {
        if (!h) return;
        setHospital(h);
        supabase.from('bookings').select('*').eq('hospital_id', h.id)
          .order('created_at', { ascending: false }).limit(20)
          .then(({ data }) => setBookings(data ?? []));
      });
  }, [user]);

  const pending   = bookings.filter(b => b.status === 'pending').length;
  const confirmed = bookings.filter(b => b.status === 'confirmed').length;
  const revenue   = bookings.filter(b => b.status === 'completed').reduce((s, b) => s + (b.platform_fee ?? 0), 0);

  return (
    <AuthGuard allowedRoles={['hospital']}>
      <div className='space-y-6'>
        <div className='bg-gradient-to-r from-teal-700 to-teal-500 rounded-2xl p-6 text-white'>
          <h1 className='text-2xl font-black'>{hospital?.name ?? 'Hospital Portal'}</h1>
          <p className='opacity-80 text-sm mt-1'>
            {hospital?.address} · {hospital?.nabh_certified ? '✅ NABH Certified' : '⏳ NABH Pending'}
          </p>
        </div>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <StatCard title='Pending Bookings' value={pending} icon='⏳' color='amber' />
          <StatCard title='Confirmed' value={confirmed} icon='✅' color='teal' />
          <StatCard title='Platform Revenue' value={`₹${revenue}`} icon='💰' color='green' />
          <StatCard title='Rating' value={`${hospital?.rating ?? 0} ⭐`} subtitle={`${hospital?.reviews_count ?? 0} reviews`} color='navy' />
        </div>
        <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-4'>
          <h2 className='font-bold text-slate-700 mb-3'>Recent Bookings</h2>
          <div className='space-y-2'>
            {bookings.map(b => (
              <div key={b.id} className='flex justify-between items-center border-b border-slate-100 py-2'>
                <div>
                  <p className='text-sm font-medium capitalize'>{b.booking_type}</p>
                  <p className='text-xs text-slate-400'>
                    {b.doctor_name ? `Dr. ${b.doctor_name}` : '-'} · {b.preferred_date ? format(new Date(b.preferred_date), 'dd MMM yyyy') : '-'}
                  </p>
                </div>
                <Badge className={STATUS_COLOR[b.status] ?? ''}>{b.status}</Badge>
              </div>
            ))}
            {bookings.length === 0 && <p className='text-slate-500 text-sm text-center py-4'>No bookings yet.</p>}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
