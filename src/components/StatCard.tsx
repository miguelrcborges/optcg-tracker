import type { ReactNode } from 'react';

interface StatCardProps {
  value: ReactNode;
  label: string;
  hint?: ReactNode;
  className?: string;
}

export function StatCard({ value, label, hint, className = '' }: StatCardProps) {
  return (
    <div className={`panel p-4 ${className}`}>
      <div className="stat-value tabular-nums">{value}</div>
      <div className="stat-label">{label}</div>
      {hint ? <div className="mt-2 text-[11px] text-mist-500">{hint}</div> : null}
    </div>
  );
}
