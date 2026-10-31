import type { Match, MatchResult } from '../types';

export interface MatchRecord {
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  gamesWon: number;
  gamesLost: number;
  matchWinRate: number | null;
  gameWinRate: number | null;
}

export function emptyRecord(): MatchRecord {
  return {
    matches: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    gamesWon: 0,
    gamesLost: 0,
    matchWinRate: null,
    gameWinRate: null,
  };
}

export function getMatchResult(
  match: Pick<Match, 'myGameWins' | 'opponentGameWins' | 'isBye'>,
): MatchResult {
  if (match.isBye) return 'win';
  if (match.myGameWins > match.opponentGameWins) return 'win';
  if (match.myGameWins < match.opponentGameWins) return 'loss';
  return 'draw';
}

function rate(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return numerator / denominator;
}

export function summarize(matches: Match[]): MatchRecord {
  const record = emptyRecord();

  for (const match of matches) {
    record.matches += 1;
    if (!match.isBye) {
      record.gamesWon += match.myGameWins;
      record.gamesLost += match.opponentGameWins;
    }

    switch (getMatchResult(match)) {
      case 'win':
        record.wins += 1;
        break;
      case 'loss':
        record.losses += 1;
        break;
      case 'draw':
        record.draws += 1;
        break;
    }
  }

  record.matchWinRate = rate(record.wins, record.wins + record.losses);
  record.gameWinRate = rate(record.gamesWon, record.gamesWon + record.gamesLost);

  return record;
}

export function groupSummary<T>(
  matches: Match[],
  getKey: (match: Match) => T,
): Map<T, MatchRecord> {
  const groups = new Map<T, Match[]>();

  for (const match of matches) {
    const key = getKey(match);
    const group = groups.get(key);
    if (group) {
      group.push(match);
    } else {
      groups.set(key, [match]);
    }
  }

  const result = new Map<T, MatchRecord>();
  for (const [key, group] of groups) {
    result.set(key, summarize(group));
  }
  return result;
}

export function formatRecord(record: MatchRecord): string {
  if (record.draws > 0) {
    return `${record.wins}–${record.losses}–${record.draws}`;
  }
  return `${record.wins}–${record.losses}`;
}

export function formatPercent(value: number | null): string {
  if (value === null) return '–';
  return `${Math.round(value * 100)}%`;
}

export function resultLabel(result: MatchResult): string {
  switch (result) {
    case 'win':
      return 'Win';
    case 'loss':
      return 'Loss';
    case 'draw':
      return 'Draw';
  }
}

export function resultToneClass(result: MatchResult): string {
  switch (result) {
    case 'win':
      return 'border-emerald-400/35 bg-emerald-400/12 text-emerald-300';
    case 'loss':
      return 'border-crimson-400/35 bg-crimson-400/12 text-crimson-300';
    case 'draw':
      return 'border-white/15 bg-white/5 text-mist-300';
  }
}

export function sortByRound(matches: Match[]): Match[] {
  return [...matches].sort(
    (a, b) => a.round - b.round || a.createdAt.localeCompare(b.createdAt),
  );
}

export function nextRound(matches: Match[]): number {
  if (matches.length === 0) return 1;
  return Math.max(...matches.map((match) => match.round)) + 1;
}
