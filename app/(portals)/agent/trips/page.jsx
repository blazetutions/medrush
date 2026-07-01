'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SectionTabs } from '@/components/shared/SectionTabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function AgentTripsPage() {
  const [trips, setTrips]   = useState([]);
  const [tab, setTab]       = useState('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('trips')
        .select('id,status,total_fare,patient_name,pickup_address,dropoff_address,trip_type,ambulance_type,created_at,night_surcharge')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      setTrips(data ?? []);
    } catch (err) {
      toast.error('Failed to load trips');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = tab === 'all' ? trips : trips.filter(t => t.status === tab);

  const TABS = [
    { id: 'all',       label: 'All Trips',  count: trips.length },
    { id: 'pending',   label: 'Pending',    count: trips.filter(t => t.status === 'pending').length },
    { id: 'enroute',   label: 'En Route',   count: trips.filter(t => t.status === 'enroute').length },
    { id: 'completed', label: 'Completed',  count: trips.filter(t => t.status === 'completed').length },
  ];

  const totalFare = trips.filter(t => t.status === 'completed').reduce((s, t) => s + (t.total_fare ?? 0), 0);

  return (
    <AuthGuard allowedRoles={['agent']}>
      <div className='max-w-5xl mx-auto space-y-6'>
        <PageHeader
          icon='🚑'
          title='Trip Log'
          subtitle={`${trips.length} total trips · ₹${totalFare.toLocaleString('en-IN')} revenue from completed`}
        />

        <SectionTabs tabs={TABS} active={tab} onChange={setTab} />

        {loading ? (
          <div className='flex justify-center py-12'><div className='animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600' /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon='🚑' title='No trips found' subtitle='Ambulance trips will appear here' />
        ) : (
          <div className='space-y-3'>
            {filtered.map(t => (
              <div key={t.id} className='bg-white border border-slate-200 rounded-xl p-4'>
                <div className='flex justify-between items-start flex-wrap gap-2'>
                  <div>
                    <p className='font-bold text-slate-800 flex items-center gap-2'>
                      🚑 {t.patient_name || 'Unknown patient'}
                      <span className='text-xs font-normal text-slate-400 capitalize'>{t.trip_type} · {t.ambulance_type}</span>
                      {t.night_surcharge && <span className='text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded'>🌙 Night</span>}
                    </p>
                    <p className='text-sm text-slate-500 mt-0.5'>{t.pickup_address} → {t.dropoff_address}</p>
                    <p className='text-xs text-slate-400 mt-1'>
                      {format(new Date(t.created_at), 'dd MMM yyyy, hh:mm a')}
                    </p>
                  </div>
                  <div className='text-right'>
                    <StatusBadge status={t.status} />
                    <p className='text-lg font-black text-slate-800 mt-1'>₹{(t.total_fare || 0).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
