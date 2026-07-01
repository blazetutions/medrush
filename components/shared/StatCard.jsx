export function StatCard({ title, value, subtitle, icon, color = 'teal' }) {
  const colors = {
    teal:  'border-teal-500 bg-teal-50 text-teal-700',
    red:   'border-red-500 bg-red-50 text-red-700',
    amber: 'border-amber-500 bg-amber-50 text-amber-700',
    navy:  'border-slate-700 bg-slate-50 text-slate-700',
    green: 'border-green-500 bg-green-50 text-green-700',
  };
  return (
    <div className={`rounded-xl border-l-4 p-5 shadow-sm ${colors[color]}`}>
      <div className='flex items-start justify-between'>
        <div>
          <p className='text-sm font-medium opacity-70'>{title}</p>
          <p className='text-2xl font-black mt-1'>{value}</p>
          {subtitle && <p className='text-xs mt-1 opacity-60'>{subtitle}</p>}
        </div>
        {icon && <span className='text-3xl'>{icon}</span>}
      </div>
    </div>
  );
}
