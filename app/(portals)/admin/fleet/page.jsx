'use client';
// Bug 10 fix: useCallback to prevent stale closure
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { AmbulanceMap } from '@/components/maps/AmbulanceMap';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  available:   'bg-green-100 text-green-700',
  on_call:     'bg-amber-100 text-amber-700',
  maintenance: 'bg-red-100 text-red-700',
  offline:     'bg-slate-100 text-slate-500',
};

export default function FleetPage() {
  const [units, setUnits] = useState([]);

  const load = useCallback(() =>
    supabase.from('ambulances').select('*').order('unit_code')
      .then(({ data }) => setUnits(data ?? []))
  , []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    const { error } = await supabase.from('ambulances').update({ status }).eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Status updated'); load(); }
  };

  return (
    <AuthGuard allowedRoles={['admin']}>
      <div className='space-y-6'>
        <h1 className='text-2xl font-black text-slate-800'>🚑 Fleet Management</h1>
        <div className='bg-white rounded-xl border border-slate-200 p-4'>
          <AmbulanceMap units={units} height='300px' />
        </div>
        <div className='bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='bg-slate-800 text-white'>
                {['Unit','Type','Zone','Paramedic','Driver','Vehicle No','Status'].map(h => (
                  <th key={h} className='px-4 py-3 text-left'>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {units.map((u, i) => (
                <tr key={u.id} className={`border-t border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                  <td className='px-4 py-3 font-bold text-teal-600'>{u.unit_code}</td>
                  <td className='px-4 py-3'><Badge variant='outline'>{u.type}</Badge></td>
                  <td className='px-4 py-3 text-slate-600'>{u.zone}</td>
                  <td className='px-4 py-3'>{u.paramedic_name}</td>
                  <td className='px-4 py-3'>{u.driver_name}</td>
                  <td className='px-4 py-3 text-slate-500'>{u.vehicle_no}</td>
                  <td className='px-4 py-3'>
                    <Select defaultValue={u.status} onValueChange={v => updateStatus(u.id, v)}>
                      <SelectTrigger className={`h-7 text-xs ${STATUS_COLORS[u.status]}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='available'>Available</SelectItem>
                        <SelectItem value='on_call'>On Call</SelectItem>
                        <SelectItem value='maintenance'>Maintenance</SelectItem>
                        <SelectItem value='offline'>Offline</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AuthGuard>
  );
}
