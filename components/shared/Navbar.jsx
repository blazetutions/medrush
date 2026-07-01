'use client';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, Menu } from 'lucide-react';
import { useState } from 'react';

const NAV_LINKS = {
  admin:    [{ label:'Dashboard', href:'/admin' }, { label:'Fleet', href:'/admin/fleet' }, { label:'Hospitals', href:'/admin/hospitals' }, { label:'Revenue', href:'/admin/revenue' }],
  hospital: [{ label:'Dashboard', href:'/hospital' }, { label:'Profile', href:'/hospital/profile' }, { label:'Requests', href:'/hospital/requests' }, { label:'Bookings', href:'/hospital/bookings' }],
  agent:    [{ label:'Dashboard', href:'/agent' }, { label:'Trips', href:'/agent/trips' }, { label:'Onboard Hospital', href:'/agent/onboard' }],
  customer: [{ label:'Home', href:'/customer' }, { label:'Book Ambulance', href:'/customer/book-ambulance' }, { label:'Hospitals', href:'/customer/hospitals' }, { label:'My Bookings', href:'/customer/my-bookings' }],
};

const ROLE_COLORS = { admin:'bg-red-600', hospital:'bg-teal-600', agent:'bg-amber-600', customer:'bg-slate-800' };

export function Navbar() {
  const { user, role, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const links = NAV_LINKS[role] ?? [];
  const bg = ROLE_COLORS[role] ?? 'bg-slate-800';

  return (
    <nav className={`${bg} text-white`}>
      <div className='max-w-7xl mx-auto px-4 py-3 flex items-center justify-between'>
        <span className='font-black text-xl'>🚑 MedRush
          {role && <span className='ml-2 text-xs font-normal opacity-70 uppercase tracking-widest'>{role}</span>}
        </span>
        <div className='hidden md:flex items-center gap-6'>
          {links.map(l => <Link key={l.href} href={l.href} className='text-sm hover:opacity-80 transition-opacity'>{l.label}</Link>)}
          {user && <Button size='sm' variant='ghost' onClick={signOut} className='text-white hover:bg-white/20'><LogOut className='w-4 h-4 mr-1'/>Sign Out</Button>}
        </div>
        <button className='md:hidden' onClick={() => setOpen(!open)}><Menu /></button>
      </div>
      {open && (
        <div className='md:hidden px-4 pb-3 flex flex-col gap-2'>
          {links.map(l => <Link key={l.href} href={l.href} className='text-sm py-1' onClick={() => setOpen(false)}>{l.label}</Link>)}
          {user && <button onClick={signOut} className='text-sm text-left py-1 opacity-70'>Sign Out</button>}
        </div>
      )}
    </nav>
  );
}
