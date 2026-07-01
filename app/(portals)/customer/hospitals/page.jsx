'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { supabase } from '@/lib/supabase';
import { ScoreBadge } from '@/components/shared/ScoreBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { LoadingGrid } from '@/components/shared/LoadingGrid';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import { Star, MapPin, Phone, Bed, ChevronRight, ArrowLeft } from 'lucide-react';

const AmbulanceMap = dynamic(
  () => import('@/components/maps/AmbulanceMap').then(m => m.AmbulanceMap),
  { ssr: false, loading: () => <div className='h-48 bg-slate-100 rounded-xl animate-pulse' /> }
);

function StarRating({ rating, size = 'sm' }) {
  const sz = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <div className='flex items-center gap-0.5'>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`${sz} ${i < Math.round(rating ?? 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
      ))}
    </div>
  );
}

function HospitalCard({ hospital, onClick }) {
  return (
    <div onClick={onClick}
      className='bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-teal-300 transition-all cursor-pointer group p-5'>
      <div className='flex justify-between items-start mb-3'>
        <div className='flex-1 min-w-0 mr-2'>
          <h3 className='font-bold text-slate-800 group-hover:text-teal-700 transition-colors leading-snug'>{hospital.name}</h3>
          <p className='text-xs text-slate-400 flex items-center gap-1 mt-1'><MapPin className='w-3 h-3 shrink-0' />{hospital.address}</p>
        </div>
        <div className='shrink-0 space-y-1'>
          {hospital.nabh_certified && <Badge className='bg-teal-100 text-teal-700 border-0 text-xs block text-center'>NABH ✓</Badge>}
          {hospital.listing_tier === 'platinum' && <Badge className='bg-purple-100 text-purple-700 border-0 text-xs block text-center'>Platinum</Badge>}
        </div>
      </div>

      {hospital.medrush_score > 0 && <div className='mb-3'><ScoreBadge score={hospital.medrush_score} /></div>}

      <div className='flex items-center gap-2 mb-3'>
        <StarRating rating={hospital.rating} />
        <span className='text-xs text-slate-500'>{hospital.rating} ({hospital.reviews_count} reviews)</span>
      </div>

      <div className='flex items-center gap-3 text-xs text-slate-500 mb-3'>
        <span className='flex items-center gap-1'><Bed className='w-3 h-3' /> {hospital.beds} beds</span>
        {hospital.icu_beds > 0 && <span>🏥 {hospital.icu_beds} ICU</span>}
        {hospital.emergency_available && <span className='text-red-600 font-medium'>🆘 24h Emergency</span>}
      </div>

      <div className='flex flex-wrap gap-1 mb-4'>
        {(hospital.specialties || []).slice(0, 3).map(s => (
          <span key={s} className='px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs'>{s}</span>
        ))}
        {(hospital.specialties || []).length > 3 && (
          <span className='text-xs text-teal-600 font-medium px-2 py-0.5'>+{(hospital.specialties || []).length - 3} more</span>
        )}
      </div>

      <div className='flex items-center justify-between'>
        <span className='text-xs text-slate-400'>{hospital.established_year ? `Est. ${hospital.established_year}` : hospital.city}</span>
        <span className='text-teal-600 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all'>
          View Details <ChevronRight className='w-4 h-4' />
        </span>
      </div>
    </div>
  );
}

function HospitalDetail({ hospital, onBack, user }) {
  const [reviews, setReviews]       = useState([]);
  const [actionType, setActionType] = useState(null);
  const [formData, setFormData]     = useState({ doctor: '', date: '', notes: '', rating: '5', comment: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from('reviews').select('*').eq('hospital_id', hospital.id)
      .order('created_at', { ascending: false }).limit(5)
      .then(({ data }) => setReviews(data ?? []));
  }, [hospital.id]);

  const handleAction = async () => {
    setSubmitting(true);
    try {
      if (actionType === 'opd' || actionType === 'surgery') {
        const { error } = await supabase.from('bookings').insert({
          customer_id: user.id, hospital_id: hospital.id,
          booking_type: actionType, doctor_name: formData.doctor,
          preferred_date: formData.date, status: 'pending',
          platform_fee: actionType === 'surgery' ? 150 : 100,
        });
        if (error) throw error;
        toast.success('Booking confirmed! Hospital will contact you within 2 hours.');
      } else if (actionType === 'review') {
        const { error } = await supabase.from('reviews').insert({
          hospital_id: hospital.id, customer_id: user.id,
          rating: parseInt(formData.rating), comment: formData.comment,
        });
        if (error) throw error;
        toast.success('Review submitted! Thank you.');
      }
      setActionType(null);
      setFormData({ doctor: '', date: '', notes: '', rating: '5', comment: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='space-y-6'>
      <button onClick={onBack} className='flex items-center gap-2 text-teal-600 hover:text-teal-800 text-sm font-medium'>
        <ArrowLeft className='w-4 h-4' /> Back to hospitals
      </button>

      {/* Hero */}
      <div className='bg-gradient-to-r from-slate-900 to-slate-700 rounded-2xl p-6 text-white'>
        <div className='flex justify-between items-start flex-wrap gap-3'>
          <div>
            <h1 className='text-2xl font-black leading-tight'>{hospital.name}</h1>
            <p className='text-slate-300 text-sm mt-1 flex items-center gap-1'><MapPin className='w-3 h-3' />{hospital.address}</p>
            <div className='flex items-center gap-3 mt-3 flex-wrap'>
              <StarRating rating={hospital.rating} size='md' />
              <span className='text-slate-300 text-sm'>{hospital.rating} · {hospital.reviews_count} reviews</span>
              {hospital.nabh_certified && <Badge className='bg-teal-400/20 text-teal-200 border-teal-400/30 text-xs'>NABH Accredited</Badge>}
            </div>
          </div>
          {hospital.medrush_score > 0 && (
            <div className='text-right'>
              <ScoreBadge score={hospital.medrush_score} />
              <p className='text-xs text-slate-400 mt-1'>MedRush Quality Score</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
        {[
          { label: 'Total Beds', value: hospital.beds,             icon: '🛏' },
          { label: 'ICU Beds',   value: hospital.icu_beds ?? '-',  icon: '🏥' },
          { label: 'OT Count',   value: hospital.ot_count ?? '-',  icon: '🔬' },
          { label: 'Est.',       value: hospital.established_year ?? hospital.city, icon: '📅' },
        ].map(s => (
          <div key={s.label} className='bg-white border border-slate-200 rounded-xl p-3 text-center'>
            <p className='text-2xl mb-1'>{s.icon}</p>
            <p className='text-xl font-black text-slate-800'>{s.value}</p>
            <p className='text-xs text-slate-400'>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div>
        <p className='font-bold text-slate-700 mb-3 text-sm uppercase tracking-wide'>Book / Interact</p>
        <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
          {[
            { id: 'opd',     icon: '🗓', title: 'Book OPD Slot',   desc: 'Schedule consultation',     fee: 100 },
            { id: 'surgery', icon: '🔬', title: 'Book Surgery',     desc: 'Plan elective surgery',     fee: 150 },
            { id: 'review',  icon: '⭐', title: 'Write a Review',   desc: 'Rate your experience',      fee: 0   },
          ].map(a => (
            <button key={a.id} onClick={() => setActionType(a.id)}
              className='bg-white border-2 border-slate-200 rounded-xl p-4 text-left hover:border-teal-400 hover:bg-teal-50 transition-all group'>
              <p className='text-3xl mb-2'>{a.icon}</p>
              <p className='font-bold text-slate-800 text-sm group-hover:text-teal-700'>{a.title}</p>
              <p className='text-xs text-slate-400 mt-0.5'>{a.desc}</p>
              {a.fee > 0 && <p className='text-xs text-teal-600 mt-1 font-medium'>Platform fee: ₹{a.fee}</p>}
            </button>
          ))}
        </div>
      </div>

      {/* Specialties */}
      <div className='bg-white border border-slate-200 rounded-xl p-5'>
        <p className='font-bold text-slate-700 mb-3'>Specialties</p>
        <div className='flex flex-wrap gap-2'>
          {(hospital.specialties || []).map(s => (
            <span key={s} className='px-3 py-1.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg text-sm font-medium'>{s}</span>
          ))}
        </div>
      </div>

      {/* Map */}
      {hospital.lat && hospital.lng && (
        <div className='bg-white border border-slate-200 rounded-xl p-4'>
          <p className='font-bold text-slate-700 mb-3'>📍 Location</p>
          <AmbulanceMap hospitals={[hospital]} height='200px' />
        </div>
      )}

      {/* Reviews */}
      <div className='bg-white border border-slate-200 rounded-xl p-5'>
        <p className='font-bold text-slate-700 mb-3'>Patient Reviews ({hospital.reviews_count})</p>
        {reviews.length > 0 ? reviews.map(r => (
          <div key={r.id} className='border-b border-slate-100 py-3 last:border-0'>
            <div className='flex items-center gap-2 mb-1'>
              <StarRating rating={r.rating} />
              <span className='text-xs text-slate-400'>{new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
            <p className='text-sm text-slate-600'>{r.comment || 'No comment provided.'}</p>
          </div>
        )) : (
          <p className='text-slate-400 text-sm text-center py-4'>No reviews yet. Be the first to review!</p>
        )}
      </div>

      {/* Contact */}
      <div className='bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between'>
        <div>
          <p className='font-bold text-slate-700'>Contact Hospital</p>
          <p className='text-slate-500 text-sm'>{hospital.phone}</p>
        </div>
        <Button asChild className='bg-teal-600 text-white'>
          <a href={`tel:${hospital.phone}`}><Phone className='w-4 h-4 mr-2' /> Call Now</a>
        </Button>
      </div>

      {/* Action Dialog */}
      <Dialog open={!!actionType} onOpenChange={() => setActionType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'opd' ? '📅 Book OPD' : actionType === 'surgery' ? '🔬 Book Surgery' : '⭐ Write Review'} — {hospital.name}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            {(actionType === 'opd' || actionType === 'surgery') && <>
              <div><Label>Doctor / Specialist</Label><Input value={formData.doctor} onChange={e => setFormData(f => ({ ...f, doctor: e.target.value }))} placeholder='e.g. Dr. Karthik, Cardiologist' className='mt-1' /></div>
              <div><Label>Preferred Date <span className='text-red-500'>*</span></Label><Input type='date' value={formData.date} onChange={e => setFormData(f => ({ ...f, date: e.target.value }))} min={new Date().toISOString().split('T')[0]} className='mt-1' /></div>
              <div className='bg-teal-50 border border-teal-200 rounded-lg p-3 text-sm text-teal-700'>
                Platform fee: <strong>₹{actionType === 'surgery' ? 150 : 100}</strong>
              </div>
            </>}
            {actionType === 'review' && <>
              <div>
                <Label>Your Rating</Label>
                <div className='flex gap-2 mt-2'>
                  {[1, 2, 3, 4, 5].map(r => (
                    <button key={r} type='button' onClick={() => setFormData(f => ({ ...f, rating: r.toString() }))}
                      className={`text-2xl transition-transform ${parseInt(formData.rating) >= r ? 'scale-110' : ''}`}>
                      {parseInt(formData.rating) >= r ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
              </div>
              <div><Label>Your Review</Label><Textarea value={formData.comment} onChange={e => setFormData(f => ({ ...f, comment: e.target.value }))} placeholder='Share your experience…' className='mt-1' rows={4} /></div>
            </>}
            <Button onClick={handleAction} disabled={submitting} className='w-full bg-teal-600 text-white'>
              {submitting ? 'Submitting…' : 'Confirm'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function HospitalsPage() {
  const { user } = useAuth();
  const [hospitals, setHospitals]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('all');
  const [detailHosp, setDetailHosp] = useState(null);

  useEffect(() => {
    supabase.from('hospitals').select('*').eq('listing_active', true)
      .order('medrush_score', { ascending: false })
      .then(({ data }) => { setHospitals(data ?? []); setLoading(false); });
  }, []);

  const filtered = hospitals.filter(h => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || h.name.toLowerCase().includes(q)
      || (h.specialties || []).some(s => s.toLowerCase().includes(q))
      || (h.address || '').toLowerCase().includes(q)
      || (h.city || '').toLowerCase().includes(q);
    const matchFilter =
      filter === 'all'       ? true :
      filter === 'nabh'      ? h.nabh_certified :
      filter === 'emergency' ? h.emergency_available :
      filter === 'platinum'  ? h.listing_tier === 'platinum' : true;
    return matchSearch && matchFilter;
  });

  if (detailHosp) return (
    <AuthGuard allowedRoles={['customer']}>
      <div className='max-w-4xl mx-auto'>
        <HospitalDetail hospital={detailHosp} onBack={() => setDetailHosp(null)} user={user} />
      </div>
    </AuthGuard>
  );

  return (
    <AuthGuard allowedRoles={['customer']}>
      <div className='max-w-6xl mx-auto space-y-6'>
        <PageHeader icon='🏥' title='Find Hospitals' subtitle='Browse hospitals — powered by MedRush Quality Score' />

        <div className='flex flex-col md:flex-row gap-3'>
          <Input placeholder='Search by name, specialty, area, city…' value={search} onChange={e => setSearch(e.target.value)} className='flex-1' />
          <div className='flex gap-2 flex-wrap'>
            {[
              { id: 'all',       label: 'All' },
              { id: 'platinum',  label: '⭐ Platinum' },
              { id: 'nabh',      label: '✅ NABH' },
              { id: 'emergency', label: '🆘 24h Emergency' },
            ].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${filter === f.id ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <p className='text-sm text-slate-400'>{filtered.length} hospitals found</p>

        {loading ? <LoadingGrid count={6} /> : (
          filtered.length === 0
            ? <EmptyState icon='🔍' title='No hospitals found' subtitle='Try a different search or filter' />
            : (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {filtered.map(h => (
                  <HospitalCard key={h.id} hospital={h} onClick={() => setDetailHosp(h)} />
                ))}
              </div>
            )
        )}
      </div>
    </AuthGuard>
  );
}
