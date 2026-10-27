import { type ReactNode } from 'react';
import { Trophy } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="panel flex flex-col items-center px-6 py-12 text-center animate-rise-in">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-gold-400/20 bg-gold-400/10 text-gold-300">
        {icon ?? <Trophy className="size-6" />}
      </div>
      <h2 className="font-display text-2xl text-mist-100">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-mist-400">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
