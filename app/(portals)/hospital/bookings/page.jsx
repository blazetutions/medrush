'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SectionTabs } from '@/components/shared/SectionTabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const TYPE_COLORS = {
  opd:          'bg-blue-100 text-blue-700',
  surgery:      'bg-red-100 text-red-700',
  consultation: 'bg-purple-100 text-purple-700',
};

export default function HospitalBookingsPage() {
  const { user }  = useAuth();
  const [tab, setTab]           = useState('all');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const { data: h } = await supabase.from('hospitals').select('id').eq('user_id', user.id).single();
      if (!h) { setLoading(false); return; }
      const { data, error } = await supabase.from('bookings').select('*')
        .eq('hospital_id', h.id).order('created_at', { ascending: false });
      if (error) throw error;
      setBookings(data ?? []);
    } catch (err) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Booking updated'); load(); }
  };

  const filtered = tab === 'all' ? bookings : bookings.filter(b => b.status === tab);

  const TABS = [
    { id: 'all',       label: 'All',       count: bookings.length },
    { id: 'pending',   label: 'Pending',   count: bookings.filter(b => b.status === 'pending').length },
    { id: 'confirmed', label: 'Confirmed', count: bookings.filter(b => b.status === 'confirmed').length },
    { id: 'completed', label: 'Completed', count: bookings.filter(b => b.status === 'completed').length },
    { id: 'cancelled', label: 'Cancelled', count: bookings.filter(b => b.status === 'cancelled').length },
  ];

  const revenue = bookings.filter(b => b.status === 'completed').reduce((s, b) => s + (b.platform_fee ?? 0), 0);

  return (
    <AuthGuard allowedRoles={['hospital']}>
      <div className='max-w-5xl mx-auto space-y-6'>
        <PageHeader icon='📅' title='Booking Management' subtitle={`Total revenue: ₹${revenue.toLocaleString('en-IN')}`} />

        <SectionTabs tabs={TABS} active={tab} onChange={setTab} />

        {loading ? (
          <div className='flex justify-center py-12'><div className='animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600' /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon='📋' title='No bookings found' subtitle='Bookings matching this filter will appear here' />
        ) : (
          <div className='bg-white rounded-xl border border-slate-200 overflow-hidden'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='bg-slate-50 text-left'>
                  {['Type', 'Doctor', 'Date', 'Status', 'Fee', 'Actions'].map(h => (
                    <th key={h} className='px-4 py-3 text-slate-500 font-medium'>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((b, i) => (
                  <tr key={b.id} className={`border-t border-slate-100 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                    <td className='px-4 py-3'>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${TYPE_COLORS[b.booking_type] ?? ''}`}>
                        {b.booking_type?.toUpperCase()}
                      </span>
                    </td>
                    <td className='px-4 py-3 text-slate-700'>{b.doctor_name ? `Dr. ${b.doctor_name}` : '—'}</td>
                    <td className='px-4 py-3 text-slate-500 text-xs'>
                      {b.preferred_date ? format(new Date(b.preferred_date), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className='px-4 py-3'><StatusBadge status={b.status} /></td>
                    <td className='px-4 py-3 font-medium text-slate-700'>₹{b.platform_fee}</td>
                    <td className='px-4 py-3'>
                      <div className='flex gap-1'>
                        {b.status === 'pending' && <>
                          <Button size='sm' onClick={() => updateStatus(b.id, 'confirmed')} className='bg-teal-600 text-white text-xs h-6 px-2'>Confirm</Button>
                          <Button size='sm' onClick={() => updateStatus(b.id, 'cancelled')} variant='outline' className='text-red-600 text-xs h-6 px-2'>Cancel</Button>
                        </>}
                        {b.status === 'confirmed' && (
                          <Button size='sm' onClick={() => updateStatus(b.id, 'completed')} className='bg-green-600 text-white text-xs h-6 px-2'>Complete</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
