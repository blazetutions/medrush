'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const STATUS_COLOR = {
  pending:   'bg-amber-100 text-amber-700',
  confirmed: 'bg-teal-100 text-teal-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  accepted:  'bg-blue-100 text-blue-700',
  enroute:   'bg-purple-100 text-purple-700',
};

export default function MyBookings() {
  const { user } = useAuth();
  const [tab, setTab]         = useState('ambulance');
  const [trips, setTrips]     = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('trips').select('*').eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setTrips(data ?? []));
    supabase.from('bookings').select('*, hospitals(name)').eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setBookings(data ?? []));
  }, [user]);

  return (
    <AuthGuard allowedRoles={['customer']}>
      <div className='space-y-4'>
        <h1 className='text-2xl font-black text-slate-800'>📋 My Bookings</h1>

        <div className='flex gap-2'>
          {['ambulance', 'hospital'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                tab === t ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              {t === 'ambulance' ? '🚑 Ambulance Trips' : '🏥 Hospital Bookings'}
            </button>
          ))}
        </div>

        {tab === 'ambulance' && (
          <div className='space-y-3'>
            {trips.map(t => (
              <div key={t.id} className='bg-white rounded-xl border border-slate-200 p-4 flex justify-between items-start'>
                <div>
                  <p className='font-bold text-slate-800'>{t.patient_name}</p>
                  <p className='text-sm text-slate-500'>{t.pickup_address} → {t.dropoff_address}</p>
                  <p className='text-xs text-slate-400 mt-1'>
                    {t.created_at ? format(new Date(t.created_at), 'dd MMM yyyy, hh:mm a') : '—'}
                  </p>
                </div>
                <div className='text-right'>
                  <Badge className={STATUS_COLOR[t.status] ?? ''}>{t.status}</Badge>
                  <p className='text-lg font-black text-slate-800 mt-2'>
                    ₹{(t.total_fare || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            ))}
            {trips.length === 0 && <p className='text-slate-500 text-center py-8'>No ambulance trips yet.</p>}
          </div>
        )}

        {tab === 'hospital' && (
          <div className='space-y-3'>
            {bookings.map(b => (
              <div key={b.id} className='bg-white rounded-xl border border-slate-200 p-4 flex justify-between items-start'>
                <div>
                  <p className='font-bold text-slate-800'>{b.hospitals?.name}</p>
                  <p className='text-sm text-slate-500 capitalize'>
                    {b.booking_type}{b.doctor_name ? ` · Dr. ${b.doctor_name}` : ''}
                  </p>
                  <p className='text-xs text-slate-400 mt-1'>
                    {b.preferred_date ? format(new Date(b.preferred_date), 'dd MMM yyyy') : '-'}
                  </p>
                </div>
                <Badge className={STATUS_COLOR[b.status] ?? ''}>{b.status}</Badge>
              </div>
            ))}
            {bookings.length === 0 && <p className='text-slate-500 text-center py-8'>No hospital bookings yet.</p>}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
