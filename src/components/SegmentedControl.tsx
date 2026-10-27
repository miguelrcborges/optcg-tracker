import { type ReactNode } from 'react';

interface Option<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  value: T | null;
  options: Option<T>[];
  onChange: (value: T) => void;
  hint?: string;
  error?: string;
}

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
  error,
}: SegmentedControlProps<T>) {
  return (
    <div>
      <span className="label">{label}</span>
      <div
        className="grid grid-cols-2 gap-2"
        role="group"
        aria-label={label}
      >
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className={`btn border px-3 py-3 ${
                active
                  ? 'border-gold-400/60 bg-gold-400/12 text-gold-200 shadow-[inset_0_0_0_1px_rgba(231,183,95,0.18)]'
                  : 'border-white/10 bg-white/[0.035] text-mist-300 hover:border-white/20 hover:bg-white/[0.06]'
              }`}
            >
              {option.icon}
              {option.label}
            </button>
          );
        })}
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-crimson-300">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[11px] text-mist-500">{hint}</p>
      ) : null}
    </div>
  );
}
