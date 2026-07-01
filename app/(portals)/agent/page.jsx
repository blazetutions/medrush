'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { supabase } from '@/lib/supabase';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SectionTabs } from '@/components/shared/SectionTabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { PhoneCall, Plus } from 'lucide-react';

export default function AgentPortal() {
  const { user } = useAuth();
  const [tab, setTab]                   = useState('overview');
  const [referrals, setReferrals]       = useState([]);
  const [hospitals, setHospitals]       = useState([]);
  const [diagnostics, setDiagnostics]   = useState([]);
  const [myHospitals, setMyHospitals]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [refDialog, setRefDialog]       = useState(false);
  const [onboardDialog, setOnboardDialog] = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [rf, setRf] = useState({ patient_name: '', patient_phone: '', patient_age: '', referred_to_id: '', referred_type: 'hospital', referral_reason: '' });
  const [ob, setOb] = useState({ name: '', address: '', phone: '', beds: '', specialties_str: '', nabh_certified: 'false' });

  const load = async () => {
    if (!user) return;
    const [refRes, hospRes, diagRes, myHospRes] = await Promise.all([
      supabase.from('referrals').select('*').eq('agent_id', user.id).order('created_at', { ascending: false }),
      supabase.from('hospitals').select('id,name,city,medrush_score,rating').eq('listing_active', true),
      supabase.from('diagnostics').select('id,name,city').eq('listing_active', true),
      supabase.from('hospitals').select('*').eq('user_id', user.id),
    ]);
    setReferrals(refRes.data ?? []);
    setHospitals(hospRes.data ?? []);
    setDiagnostics(diagRes.data ?? []);
    setMyHospitals(myHospRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const submitReferral = async () => {
    if (!rf.patient_name || !rf.patient_phone || !rf.referred_to_id) { toast.error('Fill all required fields'); return; }
    setSubmitting(true);
    const { error } = await supabase.from('referrals').insert({
      agent_id: user.id, patient_name: rf.patient_name, patient_phone: rf.patient_phone,
      patient_age: parseInt(rf.patient_age) || null, referred_to_id: rf.referred_to_id,
      referred_type: rf.referred_type, referral_reason: rf.referral_reason,
      status: 'pending', commission_rate: 5.0,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Referral submitted! You earn commission when the patient converts.');
    setRefDialog(false);
    setRf({ patient_name: '', patient_phone: '', patient_age: '', referred_to_id: '', referred_type: 'hospital', referral_reason: '' });
    load();
  };

  const submitOnboard = async () => {
    if (!ob.name || !ob.address) { toast.error('Name and address are required'); return; }
    setSubmitting(true);
    const { error } = await supabase.from('hospitals').insert({
      name: ob.name, address: ob.address, phone: ob.phone,
      beds: parseInt(ob.beds) || 0,
      specialties: ob.specialties_str.split(',').map(s => s.trim()).filter(Boolean),
      nabh_certified: ob.nabh_certified === 'true',
      listing_active: false, user_id: user.id,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Hospital submitted for admin review! Goes live within 24 hours.');
    setOnboardDialog(false);
    setOb({ name: '', address: '', phone: '', beds: '', specialties_str: '', nabh_certified: 'false' });
    load();
  };

  const updateReferral = async (id, status) => {
    await supabase.from('referrals').update({ status, commission_amt: status === 'converted' ? 500 : 0 }).eq('id', id);
    toast.success('Status updated');
    load();
  };

  const converted   = referrals.filter(r => r.status === 'converted').length;
  const pending     = referrals.filter(r => r.status === 'pending').length;
  const commission  = referrals.filter(r => r.status === 'converted').reduce((s, r) => s + (r.commission_amt ?? 0), 0);

  const TABS = [
    { id: 'overview',  icon: '📊', label: 'Overview' },
    { id: 'referrals', icon: '📨', label: 'My Referrals', count: referrals.length },
    { id: 'hospitals', icon: '🏥', label: 'My Hospitals', count: myHospitals.length },
    { id: 'browse',    icon: '🔍', label: 'Browse & Refer' },
  ];

  if (loading) return (
    <AuthGuard allowedRoles={['agent']}>
      <div className='flex items-center justify-center h-64 text-4xl animate-bounce'>🧑‍💼</div>
    </AuthGuard>
  );

  return (
    <AuthGuard allowedRoles={['agent']}>
      <div className='max-w-6xl mx-auto space-y-6'>
        <PageHeader icon='🧑‍💼' title='Agent Dashboard'
          subtitle='Refer patients · Earn commission · Onboard hospitals'
          actions={<>
            <Button onClick={() => setRefDialog(true)} className='bg-teal-600 text-white text-sm'>
              <Plus className='w-4 h-4 mr-1' /> New Referral
            </Button>
            <Button onClick={() => setOnboardDialog(true)} variant='outline' className='text-sm'>
              🏥 Onboard Hospital
            </Button>
          </>}
        />

        <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
          <StatCard title='Total Referrals'   value={referrals.length}                              icon='📨' color='teal'   />
          <StatCard title='Converted'         value={converted}                                     icon='✅' color='green'  />
          <StatCard title='Pending'           value={pending}                                       icon='⏳' color='amber'  />
          <StatCard title='Commission'        value={`₹${commission.toLocaleString('en-IN')}`}     icon='💰' color='purple' />
        </div>

        <SectionTabs tabs={TABS} active={tab} onChange={setTab} />

        {tab === 'overview' && (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='bg-white border border-slate-200 rounded-xl p-5'>
              <p className='font-bold text-slate-700 mb-3'>Recent Referrals</p>
              {referrals.slice(0, 5).map(r => (
                <div key={r.id} className='flex justify-between items-center py-2 border-b border-slate-100 last:border-0'>
                  <div>
                    <p className='font-medium text-sm text-slate-800'>{r.patient_name}</p>
                    <p className='text-xs text-slate-400'>{r.patient_phone} · {r.referred_type}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))}
              {referrals.length === 0 && <EmptyState icon='📨' title='No referrals yet' subtitle="Click 'New Referral' to start" />}
            </div>
            <div className='bg-white border border-slate-200 rounded-xl p-5'>
              <p className='font-bold text-slate-700 mb-3'>Commission Rates</p>
              <div className='space-y-2 text-sm'>
                {[
                  ['Per converted hospital referral', '₹500', 'text-green-600'],
                  ['Per converted diagnostic referral', '₹200', 'text-green-600'],
                  ['Hospital onboarding bonus', '₹2,000', 'text-purple-600'],
                ].map(([label, val, cls]) => (
                  <div key={label} className='flex justify-between text-slate-600 pb-2 border-b border-slate-100'>
                    <span>{label}</span>
                    <span className={`font-bold ${cls}`}>{val}</span>
                  </div>
                ))}
                <div className='flex justify-between font-bold text-slate-800 pt-1'>
                  <span>Your total earned</span>
                  <span className='text-green-600'>₹{commission.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'referrals' && (
          <div className='space-y-3'>
            {referrals.map(r => (
              <div key={r.id} className='bg-white border border-slate-200 rounded-xl p-4'>
                <div className='flex justify-between items-start flex-wrap gap-2 mb-3'>
                  <div>
                    <p className='font-bold text-slate-800 flex items-center gap-2'>
                      <PhoneCall className='w-4 h-4 text-teal-500' />
                      {r.patient_name} · {r.patient_phone}
                      {r.patient_age && <span className='text-slate-400 text-sm'>({r.patient_age} yrs)</span>}
                    </p>
                    <p className='text-sm text-slate-500 mt-0.5'>
                      {r.referred_type === 'hospital' ? '🏥' : '🔬'} {r.referred_type}
                    </p>
                    {r.referral_reason && <p className='text-sm text-slate-500 mt-1 italic'>"{r.referral_reason}"</p>}
                  </div>
                  <div className='text-right'>
                    <StatusBadge status={r.status} />
                    <p className='text-xs text-slate-400 mt-1'>{format(new Date(r.created_at), 'dd MMM yyyy')}</p>
                  </div>
                </div>
                {r.status === 'pending' && (
                  <div className='flex gap-2 flex-wrap'>
                    <Button size='sm' onClick={() => updateReferral(r.id, 'contacted')} variant='outline' className='text-xs border-blue-200 text-blue-600'>Mark Contacted</Button>
                    <Button size='sm' onClick={() => updateReferral(r.id, 'converted')} className='bg-green-600 text-white text-xs'>Mark Converted ✅</Button>
                    <Button size='sm' onClick={() => updateReferral(r.id, 'lost')} variant='outline' className='text-xs border-red-200 text-red-600'>Lost</Button>
                  </div>
                )}
                {r.status === 'contacted' && (
                  <div className='flex gap-2 flex-wrap'>
                    <Button size='sm' onClick={() => updateReferral(r.id, 'converted')} className='bg-green-600 text-white text-xs'>Mark Converted ✅</Button>
                    <Button size='sm' onClick={() => updateReferral(r.id, 'lost')} variant='outline' className='text-xs border-red-200 text-red-600'>Lost</Button>
                  </div>
                )}
                {r.status === 'converted' && r.commission_amt > 0 && (
                  <p className='text-sm text-green-600 font-medium'>💰 Commission: ₹{r.commission_amt}</p>
                )}
              </div>
            ))}
            {referrals.length === 0 && <EmptyState icon='📨' title='No referrals yet' subtitle="Create your first referral using 'New Referral'" />}
          </div>
        )}

        {tab === 'hospitals' && (
          <div className='space-y-3'>
            {myHospitals.map(h => (
              <div key={h.id} className='bg-white border border-slate-200 rounded-xl p-4 flex justify-between items-center'>
                <div>
                  <p className='font-bold text-slate-800'>{h.name}</p>
                  <p className='text-sm text-slate-400'>{h.address} · {h.beds} beds</p>
                  {!h.listing_active && <p className='text-xs text-amber-600 mt-1'>⏳ Pending admin review</p>}
                </div>
                <StatusBadge status={h.listing_active ? 'confirmed' : 'pending'} />
              </div>
            ))}
            {myHospitals.length === 0 && <EmptyState icon='🏥' title='No hospitals onboarded yet' subtitle="Use 'Onboard Hospital' to add hospitals" />}
          </div>
        )}

        {tab === 'browse' && (
          <div className='space-y-4'>
            <p className='font-bold text-slate-700'>Hospitals on Platform — Refer a Patient</p>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {hospitals.map(h => (
                <div key={h.id} className='bg-white border border-slate-200 rounded-xl p-4 hover:border-teal-300 hover:shadow-md transition-all'>
                  <p className='font-bold text-slate-800 mb-1'>{h.name}</p>
                  <p className='text-xs text-slate-400 mb-2'>{h.city} · ⭐{h.rating} · MedRush {h.medrush_score ?? '-'}/100</p>
                  <Button size='sm' onClick={() => { setRf(f => ({ ...f, referred_to_id: h.id, referred_type: 'hospital' })); setRefDialog(true); }}
                    className='bg-teal-600 text-white text-xs w-full'>
                    Refer Patient Here
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Referral Dialog */}
      <Dialog open={refDialog} onOpenChange={setRefDialog}>
        <DialogContent className='max-w-md'>
          <DialogHeader><DialogTitle>📨 New Patient Referral</DialogTitle></DialogHeader>
          <div className='space-y-4'>
            <div className='grid grid-cols-2 gap-3'>
              <div><Label>Patient Name <span className='text-red-500'>*</span></Label><Input value={rf.patient_name} onChange={e => setRf(r => ({ ...r, patient_name: e.target.value }))} className='mt-1' /></div>
              <div><Label>Phone <span className='text-red-500'>*</span></Label><Input value={rf.patient_phone} onChange={e => setRf(r => ({ ...r, patient_phone: e.target.value }))} className='mt-1' type='tel' /></div>
            </div>
            <div><Label>Patient Age</Label><Input type='number' value={rf.patient_age} onChange={e => setRf(r => ({ ...r, patient_age: e.target.value }))} className='mt-1' /></div>
            <div>
              <Label>Refer To</Label>
              <div className='grid grid-cols-2 gap-2 mt-1'>
                {['hospital', 'diagnostic'].map(t => (
                  <button key={t} type='button' onClick={() => setRf(r => ({ ...r, referred_type: t, referred_to_id: '' }))}
                    className={`py-2 rounded-lg text-sm font-medium border transition-all ${rf.referred_type === t ? 'bg-teal-600 text-white border-teal-600' : 'bg-white border-slate-200 text-slate-600'}`}>
                    {t === 'hospital' ? '🏥 Hospital' : '🔬 Diagnostic'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Select Destination <span className='text-red-500'>*</span></Label>
              <Select onValueChange={v => setRf(r => ({ ...r, referred_to_id: v }))}>
                <SelectTrigger className='mt-1'><SelectValue placeholder='Choose…' /></SelectTrigger>
                <SelectContent>
                  {(rf.referred_type === 'hospital' ? hospitals : diagnostics).map(h => (
                    <SelectItem key={h.id} value={h.id}>{h.name} ({h.city})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Reason / Notes</Label><Textarea value={rf.referral_reason} onChange={e => setRf(r => ({ ...r, referral_reason: e.target.value }))} className='mt-1' rows={2} placeholder='Why are you referring this patient?' /></div>
            <Button onClick={submitReferral} disabled={submitting} className='w-full bg-teal-600 text-white'>
              {submitting ? 'Submitting…' : 'Submit Referral'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Onboard Dialog */}
      <Dialog open={onboardDialog} onOpenChange={setOnboardDialog}>
        <DialogContent className='max-w-md'>
          <DialogHeader><DialogTitle>🏥 Onboard New Hospital</DialogTitle></DialogHeader>
          <div className='space-y-4'>
            {[['name', 'Hospital Name'], ['address', 'Full Address'], ['phone', 'Phone'], ['beds', 'Beds']].map(([k, l]) => (
              <div key={k}><Label>{l}</Label><Input value={ob[k]} onChange={e => setOb(o => ({ ...o, [k]: e.target.value }))} className='mt-1' /></div>
            ))}
            <div><Label>Specialties (comma separated)</Label><Input value={ob.specialties_str} onChange={e => setOb(o => ({ ...o, specialties_str: e.target.value }))} className='mt-1' /></div>
            <div>
              <Label>NABH Certified?</Label>
              <select value={ob.nabh_certified} onChange={e => setOb(o => ({ ...o, nabh_certified: e.target.value }))}
                className='mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm'>
                <option value='false'>No</option>
                <option value='true'>Yes</option>
              </select>
            </div>
            <div className='bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700'>
              This hospital will be reviewed by admin before going live.
            </div>
            <Button onClick={submitOnboard} disabled={submitting} className='w-full bg-amber-600 text-white'>
              {submitting ? 'Submitting…' : 'Submit for Review'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AuthGuard>
  );
}
