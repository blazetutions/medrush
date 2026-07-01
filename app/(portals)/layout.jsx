import { Navbar } from '@/components/shared/Navbar';
import { Toaster } from 'react-hot-toast';

export const dynamic = 'force-dynamic';

export default function PortalsLayout({ children }) {
  return (
    <div className='min-h-screen bg-slate-50'>
      <Navbar />
      <main className='max-w-7xl mx-auto px-4 py-6'>{children}</main>
      <Toaster position='top-right' />
    </div>
  );
}
