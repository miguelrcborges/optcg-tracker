import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  backTo?: string;
  backLabel?: string;
  action?: ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  backTo,
  backLabel = 'Back',
  action,
}: PageHeaderProps) {
  return (
    <header className="mb-6 animate-rise-in">
      {backTo ? (
        <Link
          to={backTo}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-mist-500 transition hover:text-gold-300"
        >
          <ArrowLeft className="size-3.5" />
          {backLabel}
        </Link>
      ) : null}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-400/90">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-balance font-display text-4xl leading-none text-mist-100 sm:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mist-400">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}
