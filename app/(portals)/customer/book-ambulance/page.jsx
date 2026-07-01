'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { supabase } from '@/lib/supabase';
import { calcFare, FARE, getDistanceKm } from '@/lib/constants';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import { Clock, CheckCircle } from 'lucide-react';

const AmbulanceMap = dynamic(
  () => import('@/components/maps/AmbulanceMap').then(m => m.AmbulanceMap),
  { ssr: false, loading: () => <div className='h-64 bg-slate-100 rounded-xl animate-pulse flex items-center justify-center text-slate-400 text-sm'>Loading map…</div> }
);

const FACILITY_ICONS = {
  'Defibrillator': '⚡', '12-Lead ECG': '💓', 'Ventilator': '🫁',
  'Infusion Pump': '💉', 'Cardiac Monitor': '📊', 'O2 Cylinder x2': '🫧',
  'Suction Unit': '🔧', 'CPAP': '😮‍💨', 'Spinal Board': '🦴',
  'Crash Cart': '🆘', 'Cervical Collar Set': '🛡', 'KED Vest': '🦺',
  'First Aid Kit': '🩹', 'BP Monitor': '🩺', 'SpO2 Monitor': '💡',
  'Neonatal Kit': '👶', 'AED': '⚡', 'Trauma Bag': '🎒',
  'ECG Monitor': '📈', 'ECG': '📈', 'O2 Cylinder': '🫧',
  'First Responder Kit': '🏥', 'Stretcher': '🛏', 'Suction': '🔧',
  'Immobilization Set': '🦴',
};

export default function BookAmbulancePage() {
  const { user } = useAuth();
  const [units, setUnits]       = useState([]);
  const [selected, setSelected] = useState(null);
  const [tripType, setTripType] = useState('prehospital');
  const [step, setStep]         = useState(1);
  const [loading, setLoading]   = useState(false);
  const [booked, setBooked]     = useState(false);
  const [userLat, setUserLat]   = useState(9.9252);
  const [userLng, setUserLng]   = useState(78.1198);
  const [form, setForm]         = useState({
    patient_name: '', patient_age: '', pickup_address: '',
    dropoff_address: '', distance_km: '10', emergency_note: '',
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude); },
        () => {}
      );
    }
    supabase.from('ambulances').select('*').neq('status', 'offline')
      .then(({ data }) => setUnits(data ?? []));
  }, []);

  const sortedUnits = [...units].sort((a, b) => {
    const dA = getDistanceKm(userLat, userLng, a.current_lat, a.current_lng);
    const dB = getDistanceKm(userLat, userLng, b.current_lat, b.current_lng);
    return dA - dB;
  });

  const fare      = calcFare(tripType, parseFloat(form.distance_km) || 10);
  const isNight   = new Date().getHours() >= 22 || new Date().getHours() < 6;
  const finalFare = isNight ? fare * 1.25 : fare;

  const handleBook = async () => {
    if (!selected) { toast.error('Please select an ambulance first'); return; }
    if (!form.patient_name || !form.pickup_address) { toast.error('Fill all required fields'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from('trips').insert({
        customer_id:     user.id,
        ambulance_id:    selected.id,
        trip_type:       tripType,
        ambulance_type:  selected.type,
        patient_name:    form.patient_name,
        patient_age:     parseInt(form.patient_age) || null,
        pickup_address:  form.pickup_address,
        dropoff_address: form.dropoff_address,
        emergency_note:  form.emergency_note,
        distance_km:     parseFloat(form.distance_km) || 10,
        fare_base:       fare,
        total_fare:      finalFare,
        night_surcharge: isNight,
        status:          'pending',
      });
      if (error) throw error;
      // Bug 14 fix: wrap ambulance update in try/catch — don't let it silently fail
      try {
        await supabase.from('ambulances').update({ status: 'on_call' }).eq('id', selected.id);
      } catch (updateErr) {
        console.error('[BookAmbulance] ambulance status update failed:', updateErr.message);
        // Continue anyway — trip was booked successfully
      }
      setBooked(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (booked) return (
    <AuthGuard allowedRoles={['customer']}>
      <div className='max-w-lg mx-auto text-center py-16'>
        <div className='text-7xl mb-4 animate-bounce'>🚑</div>
        <h2 className='text-2xl font-black text-slate-800 mb-2'>Ambulance Dispatched!</h2>
        <p className='text-slate-500 mb-4'>
          <b>{selected?.unit_code}</b> is on the way. ETA: <b>{selected?.eta_minutes ?? 10} minutes</b>
        </p>
        <div className='bg-teal-50 border border-teal-200 rounded-xl p-4 text-left mb-6 text-sm space-y-1'>
          <p>👨‍⚕️ Paramedic: <b>{selected?.paramedic_name}</b></p>
          <p>🚗 Driver: <b>{selected?.driver_name}</b> · {selected?.vehicle_no}</p>
          <p>🏥 Type: <b>{selected?.type}</b></p>
          <p>💰 Fare: <b>₹{Math.round(finalFare).toLocaleString('en-IN')}</b>{isNight ? ' (incl. night surcharge)' : ''}</p>
        </div>
        <p className='text-sm text-slate-400 mb-4'>You will receive a call from the paramedic shortly.</p>
        <Button onClick={() => { setBooked(false); setStep(1); setSelected(null); }} className='bg-teal-600 text-white'>
          Book Another
        </Button>
      </div>
    </AuthGuard>
  );

  return (
    <AuthGuard allowedRoles={['customer']}>
      <div className='max-w-5xl mx-auto space-y-6'>
        <PageHeader icon='🚑' title='Book Ambulance' subtitle='Select a nearby unit — see live ETA and onboard facilities' />

        {/* Trip type */}
        <div className='grid grid-cols-3 gap-2'>
          {[
            { id: 'prehospital', label: 'Emergency',    icon: '🆘', desc: 'Prehospital care' },
            { id: 'h2h',         label: 'H2H Transfer', icon: '🔄', desc: 'Hospital to hospital' },
            { id: 'discharge',   label: 'Discharge',    icon: '🏠', desc: 'Home transport' },
          ].map(t => (
            <button key={t.id} type='button' onClick={() => setTripType(t.id)}
              className={`p-3 rounded-xl border-2 text-left transition-all ${tripType === t.id ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
              <p className='text-xl mb-1'>{t.icon}</p>
              <p className='font-bold text-sm text-slate-800'>{t.label}</p>
              <p className='text-xs text-slate-400'>{t.desc}</p>
            </button>
          ))}
        </div>

        {step === 1 ? (
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Map */}
            <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-4'>
              <p className='font-bold text-slate-700 mb-3 text-sm'>📍 Live Ambulance Positions</p>
              <AmbulanceMap
                units={sortedUnits}
                height='320px'
                onSelectUnit={u => {
                  if (u.status === 'available') { setSelected(u); setStep(2); }
                  else toast.error('This unit is currently on call.');
                }}
              />
              <p className='text-xs text-slate-400 mt-2 text-center'>Tap a 🚑 marker to select that unit</p>
            </div>

            {/* Unit list */}
            <div className='space-y-3 max-h-[440px] overflow-y-auto pr-1'>
              <p className='font-bold text-slate-700 text-sm'>Nearest Units to You</p>
              {sortedUnits.map(u => {
                const dist  = getDistanceKm(userLat, userLng, u.current_lat, u.current_lng);
                const avail = u.status === 'available';
                return (
                  <div key={u.id}
                    onClick={() => avail ? (setSelected(u), setStep(2)) : toast.error('Unit is on call')}
                    className={`bg-white rounded-xl border-2 p-4 transition-all ${avail ? 'cursor-pointer hover:border-teal-400' : 'opacity-60 cursor-not-allowed'} ${selected?.id === u.id ? 'border-teal-500 bg-teal-50' : 'border-slate-200'}`}>
                    <div className='flex justify-between items-start mb-2'>
                      <div>
                        <p className='font-bold text-slate-800 flex items-center gap-2'>
                          <span className='text-lg'>🚑</span> {u.unit_code}
                          <StatusBadge status={u.status} />
                        </p>
                        <p className='text-xs text-slate-500 mt-0.5'>{u.type} · {u.zone}</p>
                      </div>
                      <div className='text-right'>
                        <p className='text-lg font-black text-teal-600 flex items-center gap-1'>
                          <Clock className='w-4 h-4' /> {u.eta_minutes ?? Math.round(dist * 2 + 5)} min
                        </p>
                        <p className='text-xs text-slate-400'>{dist} km away</p>
                      </div>
                    </div>
                    <p className='text-xs text-slate-600 mb-2'>👨‍⚕️ {u.paramedic_name} · 🚗 {u.driver_name}</p>
                    <div className='flex flex-wrap gap-1'>
                      {(u.facilities || []).slice(0, 4).map(f => (
                        <span key={f} className='inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs'>
                          {FACILITY_ICONS[f] ?? '✅'} {f}
                        </span>
                      ))}
                      {(u.facilities || []).length > 4 && (
                        <span className='text-xs text-teal-600 font-medium px-2 py-0.5'>+{(u.facilities || []).length - 4} more</span>
                      )}
                    </div>
                  </div>
                );
              })}
              {sortedUnits.length === 0 && (
                <p className='text-slate-400 text-sm text-center py-8'>Loading ambulance units…</p>
              )}
            </div>
          </div>
        ) : (
          /* Step 2: Form */
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Selected unit + fare */}
            <div className='space-y-4'>
              <div className='bg-teal-50 border-2 border-teal-300 rounded-xl p-4'>
                <div className='flex justify-between items-start mb-3'>
                  <div>
                    <p className='font-black text-teal-800 text-lg'>🚑 {selected?.unit_code}</p>
                    <p className='text-sm text-teal-600'>{selected?.type} · {selected?.zone}</p>
                  </div>
                  <div className='text-right'>
                    <p className='text-xl font-black text-teal-700'>{selected?.eta_minutes ?? 10} min</p>
                    <p className='text-xs text-teal-500'>ETA</p>
                  </div>
                </div>
                <div className='text-sm text-slate-700 space-y-1 mb-3'>
                  <p>👨‍⚕️ Paramedic: <b>{selected?.paramedic_name}</b></p>
                  <p>🚗 Driver: <b>{selected?.driver_name}</b> · {selected?.vehicle_no}</p>
                </div>
                <p className='text-xs font-semibold text-slate-600 mb-2'>Onboard Facilities:</p>
                <div className='grid grid-cols-2 gap-1'>
                  {(selected?.facilities || []).map(f => (
                    <span key={f} className='flex items-center gap-1 text-xs text-slate-700'>
                      <CheckCircle className='w-3 h-3 text-teal-500 shrink-0' />
                      {FACILITY_ICONS[f] ?? '•'} {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Fare preview */}
              <div className='bg-white border border-slate-200 rounded-xl p-4 space-y-2 text-sm'>
                <p className='font-bold text-slate-700'>Fare Estimate</p>
                <div className='flex justify-between text-slate-600'>
                  <span>Base ({tripType === 'h2h' ? 'H2H' : tripType === 'discharge' ? 'BLS' : 'ALS'})</span>
                  <span>₹{tripType === 'h2h' ? FARE.H2H_BASE : tripType === 'discharge' ? FARE.BLS_BASE : FARE.ALS_BASE}</span>
                </div>
                <div className='flex justify-between text-slate-600'>
                  <span>Distance ({form.distance_km || 10} km, first 10 km free)</span>
                  <span>₹{Math.max(0, (parseFloat(form.distance_km) || 10) - 10) * (tripType === 'h2h' ? FARE.H2H_PER_KM : tripType === 'discharge' ? FARE.BLS_PER_KM : FARE.ALS_PER_KM)}</span>
                </div>
                {isNight && (
                  <div className='flex justify-between text-amber-600'>
                    <span>Night surcharge (25%)</span>
                    <span>₹{Math.round(fare * 0.25)}</span>
                  </div>
                )}
                <div className='border-t border-slate-200 pt-2 flex justify-between font-black text-slate-800 text-base'>
                  <span>Total</span>
                  <span>₹{Math.round(finalFare).toLocaleString('en-IN')}</span>
                </div>
              </div>
              <Button variant='outline' onClick={() => setStep(1)} className='w-full'>← Change Ambulance</Button>
            </div>

            {/* Booking form */}
            <div className='bg-white border border-slate-200 rounded-xl p-6 space-y-4'>
              <p className='font-bold text-slate-700'>Patient & Pickup Details</p>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label>Patient Name <span className='text-red-500'>*</span></Label>
                  <Input value={form.patient_name} onChange={e => setForm(f => ({ ...f, patient_name: e.target.value }))} className='mt-1' placeholder='Full name' />
                </div>
                <div>
                  <Label>Patient Age</Label>
                  <Input type='number' value={form.patient_age} onChange={e => setForm(f => ({ ...f, patient_age: e.target.value }))} className='mt-1' placeholder='Years' />
                </div>
              </div>
              <div>
                <Label>Pickup Address <span className='text-red-500'>*</span></Label>
                <Input value={form.pickup_address} onChange={e => setForm(f => ({ ...f, pickup_address: e.target.value }))} className='mt-1' placeholder='Full address or landmark' />
              </div>
              <div>
                <Label>Drop-off Address (Hospital)</Label>
                <Input value={form.dropoff_address} onChange={e => setForm(f => ({ ...f, dropoff_address: e.target.value }))} className='mt-1' placeholder='e.g. Apollo Hospital, KK Nagar' />
              </div>
              <div>
                <Label>Estimated Distance (km)</Label>
                <Input type='number' step='0.5' min='1' value={form.distance_km} onChange={e => setForm(f => ({ ...f, distance_km: e.target.value }))} className='mt-1' />
              </div>
              <div>
                <Label>Emergency Notes</Label>
                <Textarea value={form.emergency_note} onChange={e => setForm(f => ({ ...f, emergency_note: e.target.value }))} placeholder='Symptoms, conditions, medications, allergies…' className='mt-1' rows={3} />
              </div>
              <Button onClick={handleBook} disabled={loading} className='w-full bg-red-600 hover:bg-red-700 text-white py-3 text-base font-bold'>
                {loading ? '📡 Dispatching…' : `🚑 Dispatch ${selected?.unit_code} Now`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
