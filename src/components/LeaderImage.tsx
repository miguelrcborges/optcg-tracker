import { useEffect, useState, type CSSProperties } from 'react';
import type { Leader } from '../types';
import { leaderGradient, leaderInitials } from '../lib/leaders';

interface LeaderImageProps {
  leader?: Leader | null;
  className?: string;
  style?: CSSProperties;
  alt?: string;
}

export function LeaderImage({ leader, className = '', style, alt }: LeaderImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [leader?.id]);

  const showFallback = !leader?.imageUrl || failed;

  return (
    <div
      className={`relative overflow-hidden bg-ink-800 ${className}`}
      style={{
        background: leader ? leaderGradient(leader.colors) : undefined,
        ...style,
      }}
    >
      {!showFallback && leader ? (
        <img
          src={leader.imageUrl}
          alt={alt ?? leader.name}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center font-display text-lg text-white/85 drop-shadow">
          {leader ? leaderInitials(leader.name) : '?'}
        </span>
      )}
      <span className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/10" />
    </div>
  );
}

export function ColorDots({ colors }: { colors: Leader['colors'] }) {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden="true">
      {colors.map((color) => (
        <span
          key={color}
          className="size-1.5 rounded-full ring-1 ring-black/30"
          style={{ background: leaderGradient([color]) }}
        />
      ))}
    </span>
  );
}

export function LeaderMeta({ leader }: { leader: Leader }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-mist-500">
      <ColorDots colors={leader.colors} />
      <span>{leader.setCode || 'CUSTOM'}</span>
      <span className="text-mist-600">·</span>
      <span>{leader.colors.join('/')}</span>
    </span>
  );
}
