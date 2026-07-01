'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function PublicHome() {
  const router = useRouter();

  return (
    <div className='min-h-screen bg-slate-900 flex flex-col text-white'>

      {/* Nav */}
      <nav className='flex items-center justify-between px-6 py-4 border-b border-white/10'>
        <span className='text-2xl font-black'>🚑 MedRush</span>
        <div className='flex items-center gap-3'>
          <Button
            variant='ghost'
            onClick={() => router.push('/login')}
            className='text-slate-300 hover:text-white hover:bg-white/10'
          >
            Sign In
          </Button>
          <Button
            onClick={() => router.push('/login')}
            className='bg-teal-600 hover:bg-teal-700 text-white'
          >
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <div className='flex-1 flex flex-col items-center justify-center text-center px-4 py-16'>
        <div className='text-7xl mb-6'>🚑</div>
        <h1 className='text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-white to-teal-300 bg-clip-text text-transparent'>
          MedRush
        </h1>
        <p className='text-xl text-slate-300 mb-2'>Tamil Nadu&apos;s First Healthcare Super-App</p>
        <p className='text-slate-400 mb-10 max-w-xl'>
          Advanced Life Support ambulances, hospital marketplace, and BLS/ACLS training — all in one platform. Serving Madurai 24×7.
        </p>

        {/* Primary CTAs */}
        <div className='flex gap-4 justify-center flex-wrap mb-16'>
          <Button
            onClick={() => router.push('/login')}
            className='bg-red-600 hover:bg-red-700 text-white px-8 py-6 text-lg font-bold rounded-xl'
          >
            🚑 Book Emergency Ambulance
          </Button>
          <Button
            onClick={() => router.push('/login')}
            variant='outline'
            className='border-teal-400 text-teal-300 hover:bg-teal-900 px-8 py-6 text-lg rounded-xl'
          >
            🏥 Find Hospitals
          </Button>
        </div>

        {/* Stats */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl'>
          {[
            ['🚑', 'ALS Fleet',  '5 units, Madurai'],
            ['🏥', 'Hospitals',  '280+ listed'],
            ['🎓', 'Trained',    'AHA Certified'],
            ['⚡', 'Response',   '8 min SLA'],
          ].map(([icon, label, val]) => (
            <div key={label} className='bg-white/10 rounded-xl p-4 text-center'>
              <div className='text-3xl mb-2'>{icon}</div>
              <p className='font-bold text-sm'>{label}</p>
              <p className='text-xs text-slate-400'>{val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className='text-center py-6 border-t border-white/10 text-xs text-slate-500'>
        © 2025 MedRush Healthcare Pvt Ltd · Madurai, Tamil Nadu · contact@medrush.in
        <span className='mx-3'>·</span>
        {/* Staff portals — not linked from main nav, access via direct URL */}
        <span className='text-slate-600'>Staff: /admin · /hospital · /agent</span>
      </footer>
    </div>
  );
}
