'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';

export default function OnboardHospital() {
  const [form, setForm] = useState({
    name: '', address: '', phone: '', beds: '', specialties_str: '', nabh_certified: 'false',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('hospitals').insert({
        name: form.name,
        address: form.address,
        phone: form.phone,
        beds: parseInt(form.beds) || 0,
        specialties: form.specialties_str.split(',').map(s => s.trim()).filter(Boolean),
        nabh_certified: form.nabh_certified === 'true',
        listing_active: false,
      });
      if (error) throw error;
      toast.success('Hospital submitted! Admin will review and activate within 24 hours.');
      setForm({ name: '', address: '', phone: '', beds: '', specialties_str: '', nabh_certified: 'false' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard allowedRoles={['agent']}>
      <div className='max-w-xl space-y-4'>
        <h1 className='text-2xl font-black text-slate-800'>🏥 Onboard New Hospital</h1>
        <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4'>
          {[['name','Hospital Name'],['address','Full Address'],['phone','Phone'],['beds','Beds']].map(([k, l]) => (
            <div key={k}>
              <Label>{l}</Label>
              <Input value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} className='mt-1' />
            </div>
          ))}
          <div>
            <Label>Specialties (comma separated)</Label>
            <Input
              value={form.specialties_str}
              onChange={e => setForm(f => ({ ...f, specialties_str: e.target.value }))}
              className='mt-1'
            />
          </div>
          <div>
            <Label>NABH Certified?</Label>
            <select
              value={form.nabh_certified}
              onChange={e => setForm(f => ({ ...f, nabh_certified: e.target.value }))}
              className='mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm'
            >
              <option value='false'>No</option>
              <option value='true'>Yes</option>
            </select>
          </div>
          <div className='bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700'>
            This hospital will be reviewed by admin before going live on the platform.
          </div>
          <Button onClick={handleSubmit} disabled={loading} className='w-full bg-amber-600 text-white'>
            {loading ? 'Submitting...' : 'Submit for Review'}
          </Button>
        </div>
      </div>
    </AuthGuard>
  );
}
