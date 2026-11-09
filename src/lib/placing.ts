export function formatOrdinal(value: number): string {
  const lastTwo = value % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return `${value}th`;

  switch (value % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
}

export function formatPlacing(
  placing: number | undefined,
  playerCount?: number,
): string | null {
  if (placing === undefined) return null;
  const ordinal = formatOrdinal(placing);
  return playerCount === undefined ? ordinal : `${ordinal}/${playerCount}`;
}

export type PlacingTone = 'gold' | 'silver' | 'bronze' | 'neutral';

const GOLD_MAX_SHARE = 3.125 / 100;
const SILVER_MAX_SHARE = 12.5 / 100;
const BRONZE_MAX_SHARE = 25 / 100;

export function getPlacingTone(
  placing: number | undefined,
  playerCount?: number,
): PlacingTone {
  if (
    placing === undefined ||
    playerCount === undefined ||
    playerCount < 1
  ) {
    return 'neutral';
  }

  const topShare = placing / playerCount;
  if (placing <= 8 && topShare <= GOLD_MAX_SHARE) return 'gold';
  if (placing <= 32 && topShare <= SILVER_MAX_SHARE) return 'silver';
  if (placing <= 64 && topShare <= BRONZE_MAX_SHARE) return 'bronze';
  return 'neutral';
}

export function placingToneClass(tone: PlacingTone): string {
  switch (tone) {
    case 'gold':
      return 'border-gold-400/30 bg-gold-400/10 text-gold-200';
    case 'silver':
      return 'border-silver-300/30 bg-silver-300/10 text-silver-200';
    case 'bronze':
      return 'border-bronze-400/35 bg-bronze-400/10 text-bronze-200';
    default:
      return 'border-white/10 bg-white/[0.04] text-mist-300';
  }
}
