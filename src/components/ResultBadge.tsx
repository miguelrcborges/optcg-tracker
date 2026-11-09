import type { MatchResult } from '../types';
import {
  resultLabel,
  resultToneClass,
  type MatchRecord,
} from '../lib/stats';

export function ResultBadge({
  result,
  size = 'md',
}: {
  result: MatchResult;
  size?: 'sm' | 'md';
}) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border font-bold uppercase tracking-[0.14em] ${resultToneClass(
        result,
      )} ${size === 'sm' ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]'}`}
    >
      {resultLabel(result)}
    </span>
  );
}

export function RecordBar({ record }: { record: MatchRecord }) {
  const total = record.matches || 1;
  return (
    <div
      className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/10"
      title={`${record.wins} wins, ${record.losses} losses, ${record.draws} draws`}
    >
      <span
        className="h-full bg-emerald-400/90"
        style={{ width: `${(record.wins / total) * 100}%` }}
      />
      <span
        className="h-full bg-crimson-400/85"
        style={{ width: `${(record.losses / total) * 100}%` }}
      />
      <span
        className="h-full bg-mist-500/70"
        style={{ width: `${(record.draws / total) * 100}%` }}
      />
    </div>
  );
}
