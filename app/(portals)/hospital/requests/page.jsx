'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function HospitalRequestsPage() {
  const { user }    = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const { data: h } = await supabase.from('hospitals').select('id').eq('user_id', user.id).single();
      if (!h) { setLoading(false); return; }
      const { data, error } = await supabase.from('bookings').select('*')
        .eq('hospital_id', h.id).eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRequests(data ?? []);
    } catch (err) {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success(`Booking ${status}`); load(); }
  };

  return (
    <AuthGuard allowedRoles={['hospital']}>
      <div className='max-w-4xl mx-auto space-y-6'>
        <PageHeader icon='📥' title='Incoming Requests' subtitle='New booking requests from patients — action required' />

        {loading ? (
          <div className='flex justify-center py-12'><div className='animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600' /></div>
        ) : requests.length === 0 ? (
          <EmptyState icon='📭' title='No pending requests' subtitle='New bookings from patients will appear here' />
        ) : (
          <div className='space-y-3'>
            {requests.map(r => (
              <div key={r.id} className='bg-white border border-slate-200 rounded-xl p-4'>
                <div className='flex justify-between items-start flex-wrap gap-3 mb-3'>
                  <div>
                    <div className='flex items-center gap-2 mb-1'>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${r.booking_type === 'surgery' ? 'bg-red-100 text-red-700' : r.booking_type === 'opd' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {r.booking_type?.toUpperCase()}
                      </span>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className='text-sm font-medium text-slate-700'>{r.doctor_name ? `Dr. ${r.doctor_name}` : 'No doctor specified'}</p>
                    <p className='text-xs text-slate-400 mt-0.5'>
                      📅 {r.preferred_date ? format(new Date(r.preferred_date), 'dd MMM yyyy') : 'No date set'}
                      {r.preferred_time && ` · ${r.preferred_time}`}
                    </p>
                    {r.notes && <p className='text-xs text-slate-500 mt-1 italic'>"{r.notes}"</p>}
                    <p className='text-xs text-slate-400 mt-1'>Platform fee: ₹{r.platform_fee}</p>
                  </div>
                  <p className='text-xs text-slate-400'>{format(new Date(r.created_at), 'dd MMM yyyy, hh:mm a')}</p>
                </div>
                <div className='flex gap-2'>
                  <Button size='sm' onClick={() => updateStatus(r.id, 'confirmed')} className='bg-teal-600 hover:bg-teal-700 text-white text-xs'>✅ Confirm</Button>
                  <Button size='sm' onClick={() => updateStatus(r.id, 'cancelled')} variant='outline' className='text-red-600 border-red-200 text-xs'>❌ Cancel</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
