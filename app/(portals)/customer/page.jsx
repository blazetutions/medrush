'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function CustomerHome() {
  const { user } = useAuth();
  const router = useRouter();
  // Bug 12 fix: fetch actual available unit count instead of hardcoding "5"
  const [availableUnits, setAvailableUnits] = useState(0);

  useEffect(() => {
    supabase.from('ambulances').select('id', { count: 'exact', head: true }).eq('status', 'available')
      .then(({ count }) => setAvailableUnits(count ?? 0));
  }, []);

  const actions = [
    {
      icon: '🚑',
      title: 'Book ALS Ambulance',
      desc: 'Emergency prehospital or H2H transfer',
      color: 'border-red-500 bg-red-50',
      href: '/customer/book-ambulance',
      btn: 'Book Now',
      btnColor: 'bg-red-600 hover:bg-red-700',
    },
    {
      icon: '🏥',
      title: 'Find Hospitals',
      desc: 'Browse & book OPD or surgery slots',
      color: 'border-teal-500 bg-teal-50',
      href: '/customer/hospitals',
      btn: 'Search',
      btnColor: 'bg-teal-600 hover:bg-teal-700',
    },
    {
      icon: '📋',
      title: 'My Bookings',
      desc: 'View your trips and appointments',
      color: 'border-slate-500 bg-slate-50',
      href: '/customer/my-bookings',
      btn: 'View All',
      btnColor: 'bg-slate-700 hover:bg-slate-800',
    },
  ];

  return (
    <AuthGuard allowedRoles={['customer']}>
      <div className='space-y-6'>
        <div className='bg-gradient-to-r from-slate-900 to-teal-700 rounded-2xl p-8 text-white'>
          <h1 className='text-3xl font-black mb-1'>Emergency Services, Madurai</h1>
          <p className='opacity-80'>ALS Ambulance · Hospital Booking · 24×7 Support</p>
          <div className='mt-4 inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 text-sm'>
            <span className='w-2 h-2 bg-green-400 rounded-full animate-pulse' />
            {availableUnits} unit{availableUnits !== 1 ? 's' : ''} available now
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {actions.map(a => (
            <div
              key={a.href}
              className={`border-l-4 rounded-xl p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${a.color}`}
              onClick={() => router.push(a.href)}
            >
              <div className='text-4xl mb-3'>{a.icon}</div>
              <h3 className='font-bold text-slate-800 text-lg mb-1'>{a.title}</h3>
              <p className='text-slate-500 text-sm mb-4'>{a.desc}</p>
              <Button className={`${a.btnColor} text-white w-full`}>{a.btn}</Button>
            </div>
          ))}
        </div>

        <div className='bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800'>
          <span className='font-bold'>📞 Emergency Hotline:</span> Call 1800-MEDRUSH (24×7 ALS dispatch)
        </div>
      </div>
    </AuthGuard>
  );
}
