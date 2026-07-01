'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';

export default function HospitalProfile() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', address: '', phone: '', beds: '', specialties_str: '' });
  const [loading, setLoading]       = useState(false);
  const [hospitalId, setHospitalId] = useState(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('hospitals').select('*').eq('user_id', user.id).single()
      .then(({ data }) => {
        if (data) {
          setHospitalId(data.id);
          setForm({
            name: data.name || '',
            address: data.address || '',
            phone: data.phone || '',
            beds: data.beds || '',
            specialties_str: (data.specialties || []).join(', '),
          });
        }
      });
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        address: form.address,
        phone: form.phone,
        beds: parseInt(form.beds) || 0,
        specialties: form.specialties_str.split(',').map(s => s.trim()).filter(Boolean),
        user_id: user.id,
      };
      const { error } = hospitalId
        ? await supabase.from('hospitals').update(payload).eq('id', hospitalId)
        : await supabase.from('hospitals').insert(payload);
      if (error) throw error;
      toast.success('Profile saved successfully!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard allowedRoles={['hospital']}>
      <div className='max-w-xl space-y-4'>
        <h1 className='text-2xl font-black text-slate-800'>🏥 Hospital Profile</h1>
        <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4'>
          {[
            ['name', 'Hospital Name', 'text'],
            ['address', 'Full Address', 'text'],
            ['phone', 'Phone Number', 'tel'],
            ['beds', 'Number of Beds', 'number'],
          ].map(([key, label, type]) => (
            <div key={key}>
              <Label>{label}</Label>
              <Input
                type={type}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className='mt-1'
              />
            </div>
          ))}
          <div>
            <Label>Specialties (comma separated)</Label>
            <Input
              value={form.specialties_str}
              onChange={e => setForm(f => ({ ...f, specialties_str: e.target.value }))}
              placeholder='Cardiology, Neurology, Orthopaedics'
              className='mt-1'
            />
          </div>
          <Button onClick={handleSave} disabled={loading} className='w-full bg-teal-600 text-white'>
            {loading ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </div>
    </AuthGuard>
  );
}
