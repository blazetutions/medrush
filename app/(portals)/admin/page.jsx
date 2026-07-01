'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SectionTabs } from '@/components/shared/SectionTabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { AmbulanceMap } from '@/components/maps/AmbulanceMap';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [tab, setTab]           = useState('overview');
  const [stats, setStats]       = useState({ trips: 0, hospitals: 0, revenue: 0, pending: 0, referrals: 0, transfers: 0 });
  const [units, setUnits]       = useState([]);
  const [recentTrips, setRecent] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [pendingHosp, setPendingHosp] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [allTrips, setAllTrips]   = useState([]);

  const load = async () => {
    const [tripsRes, hospRes, unitsRes, revRes, pendRes, allHospRes, refRes, tfRes, allTripsRes] = await Promise.all([
      supabase.from('trips').select('id,status,total_fare,patient_name,pickup_address,dropoff_address,created_at,trip_type').order('created_at', { ascending: false }).limit(10),
      supabase.from('hospitals').select('id', { count: 'exact', head: true }).eq('listing_active', true),
      supabase.from('ambulances').select('*'),
      supabase.from('trips').select('total_fare').eq('status', 'completed'),
      supabase.from('trips').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('hospitals').select('*').eq('listing_active', false).order('created_at', { ascending: false }),
      supabase.from('referrals').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('transfers').select('*, from_hospital:hospitals!from_hospital(name), to_hospital:hospitals!to_hospital(name)').order('created_at', { ascending: false }).limit(20),
      supabase.from('trips').select('id,status,total_fare,patient_name,pickup_address,dropoff_address,created_at,trip_type,ambulance_id').order('created_at', { ascending: false }).limit(50),
    ]);

    setRecent(tripsRes.data ?? []);
    setUnits(unitsRes.data ?? []);
    setPendingHosp(allHospRes.data ?? []);
    setReferrals(refRes.data ?? []);
    setTransfers(tfRes.data ?? []);
    setAllTrips(allTripsRes.data ?? []);

    const rev = (revRes.data ?? []).reduce((sum, t) => sum + (t.total_fare ?? 0), 0);
    setStats({
      trips:     allTripsRes.data?.length ?? 0,
      hospitals: hospRes.count ?? 0,
      revenue:   rev,
      pending:   pendRes.count ?? 0,
      referrals: refRes.data?.length ?? 0,
      transfers: tfRes.data?.length ?? 0,
    });
  };

  useEffect(() => { load(); }, []);

  const approveHospital = async (id) => {
    const { error } = await supabase.from('hospitals').update({ listing_active: true }).eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Hospital approved and now live!'); load(); }
  };

  const rejectHospital = async (id) => {
    const { error } = await supabase.from('hospitals').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Hospital rejected and removed.'); load(); }
  };

  const updateTripStatus = async (id, status) => {
    const { error } = await supabase.from('trips').update({ status }).eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Trip status updated'); load(); }
  };

  const TABS = [
    { id: 'overview',   icon: '📊', label: 'Overview' },
    { id: 'trips',      icon: '🚑', label: 'All Trips',          count: stats.trips },
    { id: 'hospitals',  icon: '🏥', label: 'Hospital Approvals', count: pendingHosp.length },
    { id: 'referrals',  icon: '📨', label: 'Referrals',          count: stats.referrals },
    { id: 'transfers',  icon: '🔄', label: 'Transfers',          count: stats.transfers },
  ];

  const STATUS_NEXT = {
    pending:   ['accepted', 'cancelled'],
    accepted:  ['enroute', 'cancelled'],
    enroute:   ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  };

  return (
    <AuthGuard allowedRoles={['admin']}>
      <div className='max-w-7xl mx-auto space-y-6'>
        <PageHeader icon='⚡' title='Admin Dashboard' subtitle='MedRush Operations Centre — Madurai' />

        {/* Stats */}
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3'>
          <StatCard title='Total Trips'    value={stats.trips}                                  icon='🚑' color='red'    />
          <StatCard title='Hospitals'      value={stats.hospitals}                              icon='🏥' color='teal'   />
          <StatCard title='Revenue'        value={`₹${Math.round(stats.revenue/1000)}K`}       icon='💰' color='green'  />
          <StatCard title='Pending'        value={stats.pending}                                icon='⏳' color='amber'  />
          <StatCard title='Referrals'      value={stats.referrals}                              icon='📨' color='navy'   />
          <StatCard title='Pending Hosp.'  value={pendingHosp.length}                           icon='🏗' color='purple' />
        </div>

        <SectionTabs tabs={TABS} active={tab} onChange={setTab} />

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div className='space-y-6'>
            {/* Map */}
            <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-4'>
              <h2 className='font-bold text-slate-700 mb-3'>🗺 Live Fleet — Madurai</h2>
              <AmbulanceMap units={units} hospitals={hospitals} height='360px' />
            </div>

            {/* Recent trips */}
            <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-4'>
              <h2 className='font-bold text-slate-700 mb-3'>Recent Trips (last 10)</h2>
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='bg-slate-50 text-slate-500 text-left'>
                      {['Patient', 'Route', 'Type', 'Status', 'Fare', 'Time'].map(h => (
                        <th key={h} className='px-3 py-2 font-medium'>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentTrips.map(t => (
                      <tr key={t.id} className='border-t border-slate-100 hover:bg-slate-50'>
                        <td className='px-3 py-2 font-medium'>{t.patient_name || '—'}</td>
                        <td className='px-3 py-2 text-slate-500 max-w-[180px] truncate'>{t.pickup_address} → {t.dropoff_address}</td>
                        <td className='px-3 py-2 text-xs capitalize text-slate-500'>{t.trip_type}</td>
                        <td className='px-3 py-2'><StatusBadge status={t.status} /></td>
                        <td className='px-3 py-2 font-bold text-slate-700'>₹{(t.total_fare || 0).toLocaleString('en-IN')}</td>
                        <td className='px-3 py-2 text-slate-400 text-xs'>{format(new Date(t.created_at), 'dd MMM, HH:mm')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Fleet status */}
            <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-4'>
              <h2 className='font-bold text-slate-700 mb-3'>Fleet Status</h2>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                {['available', 'on_call', 'maintenance', 'offline'].map(s => {
                  const count = units.filter(u => u.status === s).length;
                  return (
                    <div key={s} className='bg-slate-50 rounded-lg p-3 text-center'>
                      <p className='text-2xl font-black text-slate-800'>{count}</p>
                      <StatusBadge status={s} className='mt-1' />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ALL TRIPS */}
        {tab === 'trips' && (
          <div className='bg-white rounded-xl border border-slate-200 overflow-hidden'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='bg-slate-800 text-white text-left'>
                  {['Patient', 'Route', 'Type', 'Status', 'Fare', 'Time', 'Actions'].map(h => (
                    <th key={h} className='px-4 py-3 font-medium'>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allTrips.map((t, i) => (
                  <tr key={t.id} className={`border-t border-slate-100 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                    <td className='px-4 py-3 font-medium text-slate-800'>{t.patient_name || '—'}</td>
                    <td className='px-4 py-3 text-slate-500 max-w-[160px] truncate text-xs'>{t.pickup_address} → {t.dropoff_address}</td>
                    <td className='px-4 py-3 text-xs capitalize text-slate-500'>{t.trip_type}</td>
                    <td className='px-4 py-3'><StatusBadge status={t.status} /></td>
                    <td className='px-4 py-3 font-bold text-slate-700'>₹{(t.total_fare || 0).toLocaleString('en-IN')}</td>
                    <td className='px-4 py-3 text-slate-400 text-xs'>{format(new Date(t.created_at), 'dd MMM, HH:mm')}</td>
                    <td className='px-4 py-3'>
                      <div className='flex gap-1 flex-wrap'>
                        {(STATUS_NEXT[t.status] ?? []).map(s => (
                          <Button key={s} size='sm' onClick={() => updateTripStatus(t.id, s)}
                            className={`text-xs h-6 px-2 ${s === 'cancelled' ? 'bg-red-600 hover:bg-red-700' : s === 'completed' ? 'bg-green-600 hover:bg-green-700' : 'bg-teal-600 hover:bg-teal-700'} text-white`}>
                            {s}
                          </Button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {allTrips.length === 0 && <EmptyState icon='🚑' title='No trips yet' subtitle='Trips from customer bookings will appear here' />}
          </div>
        )}

        {/* HOSPITAL APPROVALS */}
        {tab === 'hospitals' && (
          <div className='space-y-3'>
            {pendingHosp.length > 0 && (
              <div className='bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700 font-medium'>
                ⚠️ {pendingHosp.length} hospital{pendingHosp.length > 1 ? 's' : ''} pending review — submitted by agents
              </div>
            )}
            {pendingHosp.map(h => (
              <div key={h.id} className='bg-white border border-slate-200 rounded-xl p-4'>
                <div className='flex justify-between items-start flex-wrap gap-3'>
                  <div>
                    <p className='font-bold text-slate-800 text-base'>{h.name}</p>
                    <p className='text-sm text-slate-500 mt-0.5'>📍 {h.address}</p>
                    <div className='flex flex-wrap gap-2 mt-2 text-xs text-slate-500'>
                      <span>🛏 {h.beds} beds</span>
                      <span>📞 {h.phone}</span>
                      {h.nabh_certified && <span className='text-teal-600 font-medium'>✅ NABH</span>}
                    </div>
                    {(h.specialties || []).length > 0 && (
                      <div className='flex flex-wrap gap-1 mt-2'>
                        {h.specialties.slice(0, 4).map(s => (
                          <span key={s} className='px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs'>{s}</span>
                        ))}
                      </div>
                    )}
                    <p className='text-xs text-slate-400 mt-2'>Submitted: {format(new Date(h.created_at), 'dd MMM yyyy, hh:mm a')}</p>
                  </div>
                  <div className='flex gap-2'>
                    <Button onClick={() => approveHospital(h.id)} className='bg-green-600 hover:bg-green-700 text-white text-sm'>
                      ✅ Approve & Go Live
                    </Button>
                    <Button onClick={() => rejectHospital(h.id)} variant='outline' className='text-red-600 border-red-200 text-sm'>
                      ❌ Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {pendingHosp.length === 0 && <EmptyState icon='✅' title='No pending approvals' subtitle='All hospital submissions have been reviewed' />}
          </div>
        )}

        {/* REFERRALS */}
        {tab === 'referrals' && (
          <div className='bg-white rounded-xl border border-slate-200 overflow-hidden'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='bg-slate-800 text-white text-left'>
                  {['Patient', 'Phone', 'Age', 'Referred To', 'Type', 'Status', 'Commission', 'Date'].map(h => (
                    <th key={h} className='px-4 py-3 font-medium'>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {referrals.map((r, i) => (
                  <tr key={r.id} className={`border-t border-slate-100 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                    <td className='px-4 py-3 font-medium text-slate-800'>{r.patient_name}</td>
                    <td className='px-4 py-3 text-slate-500 text-xs'>{r.patient_phone}</td>
                    <td className='px-4 py-3 text-slate-500 text-xs'>{r.patient_age ?? '—'}</td>
                    <td className='px-4 py-3 text-slate-500 text-xs truncate max-w-[140px]'>{r.referred_to_id}</td>
                    <td className='px-4 py-3'><span className={`text-xs px-2 py-0.5 rounded-full ${r.referred_type === 'hospital' ? 'bg-teal-100 text-teal-700' : 'bg-purple-100 text-purple-700'}`}>{r.referred_type}</span></td>
                    <td className='px-4 py-3'><StatusBadge status={r.status} /></td>
                    <td className='px-4 py-3 font-medium text-green-600 text-xs'>₹{r.commission_amt ?? 0}</td>
                    <td className='px-4 py-3 text-slate-400 text-xs'>{format(new Date(r.created_at), 'dd MMM')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {referrals.length === 0 && <EmptyState icon='📨' title='No referrals yet' subtitle='Agent referrals will appear here' />}
          </div>
        )}

        {/* TRANSFERS */}
        {tab === 'transfers' && (
          <div className='space-y-3'>
            {transfers.map(t => (
              <div key={t.id} className='bg-white border border-slate-200 rounded-xl p-4'>
                <div className='flex justify-between items-start flex-wrap gap-2'>
                  <div>
                    <p className='font-bold text-slate-800'>🧑‍⚕️ {t.patient_name}</p>
                    <p className='text-sm text-slate-500 mt-1'>
                      {t.from_hospital?.name ?? 'Unknown'} →
                      {t.to_hospital?.name ? ` 🏥 ${t.to_hospital.name}` : ' Destination TBD'}
                    </p>
                    <p className='text-xs text-slate-400 mt-1 bg-slate-50 rounded p-1.5 italic'>{t.transfer_reason}</p>
                  </div>
                  <div className='text-right'>
                    <StatusBadge status={t.status} />
                    <p className='text-xs text-slate-400 mt-1'>{format(new Date(t.created_at), 'dd MMM yyyy, hh:mm a')}</p>
                  </div>
                </div>
              </div>
            ))}
            {transfers.length === 0 && <EmptyState icon='🔄' title='No transfers yet' subtitle='Hospital-initiated patient transfers will appear here' />}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
