'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import { ScoreBadge } from '@/components/shared/ScoreBadge';

export default function AdminHospitalsPage() {
  const [hospitals, setHospitals]   = useState([]);
  const [pending, setPending]       = useState([]);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);

  const load = useCallback(async () => {
    try {
      const [activeRes, pendingRes] = await Promise.all([
        supabase.from('hospitals').select('*').eq('listing_active', true).order('medrush_score', { ascending: false }),
        supabase.from('hospitals').select('*').eq('listing_active', false).order('created_at', { ascending: false }),
      ]);
      setHospitals(activeRes.data ?? []);
      setPending(pendingRes.data ?? []);
    } catch (err) {
      toast.error('Failed to load hospitals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = async (id) => {
    const { error } = await supabase.from('hospitals').update({ listing_active: true }).eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Hospital approved and now live!'); load(); }
  };

  const reject = async (id) => {
    const { error } = await supabase.from('hospitals').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Hospital removed.'); load(); }
  };

  const updateScore = async (id, score) => {
    const { error } = await supabase.from('hospitals').update({ medrush_score: parseInt(score) }).eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Score updated'); load(); }
  };

  const filtered = hospitals.filter(h =>
    !search || h.name.toLowerCase().includes(search.toLowerCase()) || (h.city || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AuthGuard allowedRoles={['admin']}>
      <div className='max-w-6xl mx-auto space-y-6'>
        <PageHeader icon='🏥' title='Hospital Management' subtitle='Approve pending hospitals · Manage active listings' />

        {/* Pending approvals */}
        {pending.length > 0 && (
          <div className='space-y-3'>
            <h2 className='font-bold text-amber-700 flex items-center gap-2'>
              <span className='bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs'>{pending.length}</span>
              Pending Approval
            </h2>
            {pending.map(h => (
              <div key={h.id} className='bg-amber-50 border border-amber-200 rounded-xl p-4 flex justify-between items-start flex-wrap gap-3'>
                <div>
                  <p className='font-bold text-slate-800'>{h.name}</p>
                  <p className='text-sm text-slate-500'>📍 {h.address} · 📞 {h.phone} · 🛏 {h.beds} beds</p>
                  {(h.specialties || []).length > 0 && (
                    <p className='text-xs text-slate-400 mt-1'>{h.specialties.slice(0, 4).join(', ')}</p>
                  )}
                </div>
                <div className='flex gap-2'>
                  <Button onClick={() => approve(h.id)} className='bg-green-600 hover:bg-green-700 text-white text-sm'>✅ Approve</Button>
                  <Button onClick={() => reject(h.id)} variant='outline' className='text-red-600 border-red-200 text-sm'>❌ Reject</Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Active hospitals */}
        <div className='space-y-3'>
          <div className='flex items-center justify-between flex-wrap gap-3'>
            <h2 className='font-bold text-slate-700'>Active Listings ({filtered.length})</h2>
            <Input placeholder='Search by name or city…' value={search} onChange={e => setSearch(e.target.value)} className='w-64' />
          </div>

          {loading ? (
            <p className='text-slate-400 text-sm text-center py-8'>Loading…</p>
          ) : filtered.length === 0 ? (
            <EmptyState icon='🏥' title='No hospitals found' />
          ) : (
            <div className='bg-white rounded-xl border border-slate-200 overflow-hidden'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='bg-slate-800 text-white text-left'>
                    {['Hospital', 'City', 'Beds', 'NABH', 'Tier', 'MedRush Score', 'Actions'].map(h => (
                      <th key={h} className='px-4 py-3 font-medium'>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((h, i) => (
                    <tr key={h.id} className={`border-t border-slate-100 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                      <td className='px-4 py-3 font-medium text-slate-800 max-w-[200px] truncate'>{h.name}</td>
                      <td className='px-4 py-3 text-slate-500 text-xs'>{h.city}</td>
                      <td className='px-4 py-3 text-slate-500'>{h.beds}</td>
                      <td className='px-4 py-3'>{h.nabh_certified ? '✅' : '—'}</td>
                      <td className='px-4 py-3'>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${h.listing_tier === 'platinum' ? 'bg-purple-100 text-purple-700' : h.listing_tier === 'premium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                          {h.listing_tier ?? 'basic'}
                        </span>
                      </td>
                      <td className='px-4 py-3'>
                        {h.medrush_score > 0 ? <ScoreBadge score={h.medrush_score} showLabel={false} /> : '—'}
                      </td>
                      <td className='px-4 py-3'>
                        <div className='flex gap-1'>
                          <input type='number' min='0' max='100' defaultValue={h.medrush_score ?? 0}
                            onBlur={e => updateScore(h.id, e.target.value)}
                            className='w-16 border border-slate-200 rounded px-2 py-1 text-xs'
                            placeholder='Score'
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
