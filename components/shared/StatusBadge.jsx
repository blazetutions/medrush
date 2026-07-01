import { STATUS_COLORS } from '@/lib/constants';

export function StatusBadge({ status, className = '' }) {
  const s = status?.toLowerCase() ?? 'pending';
  const color = STATUS_COLORS[s] ?? 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${color} ${className}`}>
      {s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
    </span>
  );
}
