import { Skeleton } from '@/components/ui/skeleton';

export function LoadingGrid({ count = 6, className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' }) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className='h-52 rounded-xl' />
      ))}
    </div>
  );
}
