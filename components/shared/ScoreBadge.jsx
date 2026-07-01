import { medrushScoreColor, medrushScoreLabel } from '@/lib/constants';

export function ScoreBadge({ score, showLabel = true }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-bold border ${medrushScoreColor(score)}`}>
      <span className='text-base'>⚡</span>
      {score}
      {showLabel && (
        <span className='font-normal text-xs opacity-70'>/ 100 · {medrushScoreLabel(score)}</span>
      )}
    </span>
  );
}
