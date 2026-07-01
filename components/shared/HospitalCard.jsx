import { Badge } from '@/components/ui/badge';
import { Star, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HospitalCard({ hospital, onBook }) {
  return (
    <div className='bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5'>
      <div className='flex justify-between items-start mb-3'>
        <div>
          <h3 className='font-bold text-slate-800 text-base'>{hospital.name}</h3>
          <p className='text-xs text-slate-500 flex items-center gap-1 mt-1'>
            <MapPin className='w-3 h-3'/>{hospital.address}
          </p>
        </div>
        {hospital.nabh_certified && <Badge className='bg-teal-100 text-teal-700 text-xs'>NABH</Badge>}
      </div>
      <div className='flex items-center gap-1 mb-3'>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={`w-4 h-4 ${i < Math.round(hospital.rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}/>
        ))}
        <span className='text-xs text-slate-500 ml-1'>({hospital.reviews_count} reviews)</span>
      </div>
      <div className='flex flex-wrap gap-1 mb-4'>
        {(hospital.specialties || []).slice(0, 4).map(s => (
          <Badge key={s} variant='outline' className='text-xs'>{s}</Badge>
        ))}
      </div>
      <div className='flex gap-2'>
        <Button size='sm' className='bg-teal-600 text-white flex-1' onClick={() => onBook?.(hospital)}>
          Book OPD / Surgery
        </Button>
        <Button size='sm' variant='outline' className='flex-1'>
          <Phone className='w-3 h-3 mr-1'/>{hospital.phone}
        </Button>
      </div>
    </div>
  );
}
