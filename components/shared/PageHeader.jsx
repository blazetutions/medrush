export function PageHeader({ icon, title, subtitle, actions }) {
  return (
    <div className='flex items-start justify-between mb-6 flex-wrap gap-3'>
      <div>
        <h1 className='text-2xl font-black text-slate-800 flex items-center gap-2'>
          <span>{icon}</span>{title}
        </h1>
        {subtitle && <p className='text-slate-500 text-sm mt-0.5'>{subtitle}</p>}
      </div>
      {actions && <div className='flex gap-2 flex-wrap'>{actions}</div>}
    </div>
  );
}
