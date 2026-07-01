'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { StatCard } from '@/components/shared/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';

export default function RevenuePage() {
  const [trips, setTrips]         = useState([]);
  const [chartData, setChartData] = useState([]);

  // Bug 11 fix: wrap in try/catch so page doesn't crash silently
  useEffect(() => {
    const run = async () => {
      try {
        const { data, error } = await supabase.from('trips')
          .select('total_fare,status,created_at,trip_type').eq('status', 'completed');
        if (error) throw error;
        setTrips(data ?? []);
        const days = Array.from({ length: 14 }, (_, i) => subDays(new Date(), 13 - i));
        const grouped = days.map(day => {
          const label  = format(day, 'dd MMM');
          const dayStr = format(day, 'yyyy-MM-dd');
          const rev    = (data ?? [])
            .filter(t => t.created_at?.startsWith(dayStr))
            .reduce((s, t) => s + (t.total_fare ?? 0), 0);
          return { date: label, revenue: Math.round(rev) };
        });
        setChartData(grouped);
      } catch (err) {
        console.error('[RevenuePage]', err.message);
      }
    };
    run();
  }, []);

  const totalRev = trips.reduce((s, t) => s + (t.total_fare ?? 0), 0);
  const avgFare  = trips.length ? totalRev / trips.length : 0;
  const alsCount = trips.filter(t => t.trip_type === 'prehospital').length;
  const h2hCount = trips.filter(t => t.trip_type === 'h2h').length;

  return (
    <AuthGuard allowedRoles={['admin']}>
      <div className='space-y-6'>
        <h1 className='text-2xl font-black text-slate-800'>💰 Revenue Analytics</h1>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <StatCard title='Total Revenue' value={`₹${totalRev.toLocaleString('en-IN')}`} icon='💰' color='green' />
          <StatCard title='Completed Trips' value={trips.length} icon='✅' color='teal' />
          <StatCard title='Avg Fare/Trip' value={`₹${Math.round(avgFare).toLocaleString('en-IN')}`} icon='📊' color='navy' />
          <StatCard title='ALS / H2H Split' value={`${alsCount} / ${h2hCount}`} icon='🚑' color='red' />
        </div>
        <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-6'>
          <h2 className='font-bold text-slate-700 mb-4'>Daily Revenue — Last 14 Days (₹)</h2>
          <ResponsiveContainer width='100%' height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray='3 3' stroke='#f1f5f9' />
              <XAxis dataKey='date' tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => `₹${v.toLocaleString('en-IN')}`} />
              <Tooltip formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
              <Bar dataKey='revenue' fill='#0D9488' radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AuthGuard>
  );
}
