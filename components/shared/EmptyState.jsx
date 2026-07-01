export function EmptyState({ icon = '📭', title, subtitle, action }) {
  return (
    <div className='flex flex-col items-center justify-center py-16 text-center'>
      <p className='text-6xl mb-4'>{icon}</p>
      <p className='font-bold text-slate-700 text-lg'>{title}</p>
      {subtitle && <p className='text-slate-400 text-sm mt-1 max-w-xs'>{subtitle}</p>}
      {action && <div className='mt-4'>{action}</div>}
    </div>
  );
}
