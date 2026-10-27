import rawLeaders from '../data/leaders.json';
import type { Leader, LeaderColor, Match, Tournament } from '../types';

export const BUNDLED_LEADERS = rawLeaders.leaders as unknown as Leader[];

export const COLOR_HEX: Record<LeaderColor, string> = {
  Red: '#d95d5d',
  Blue: '#4f8fd8',
  Green: '#58b98a',
  Purple: '#a578dd',
  Yellow: '#e7c454',
  Black: '#8b93a3',
};

export function leaderGradient(colors: LeaderColor[]): string {
  const stops = colors.length > 0 ? colors : (['Black'] as LeaderColor[]);
  if (stops.length === 1) {
    const color = COLOR_HEX[stops[0]];
    return `linear-gradient(135deg, ${color}, ${color}99)`;
  }
  return `linear-gradient(135deg, ${stops
    .map((color) => COLOR_HEX[color])
    .join(', ')})`;
}

export function leaderInitials(name: string): string {
  const words = name
    .replace(/["']/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 0 && word !== '&');
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function leaderMatchesQuery(leader: Leader, query: string): boolean {
  const normalized = normalizeSearch(query);
  if (!normalized) return true;

  const haystack = normalizeSearch(
    [
      leader.name,
      leader.setCode,
      leader.setName,
      ...leader.colors,
    ].join(' '),
  );

  return normalized.split(' ').every((token) => haystack.includes(token));
}

export function collectRecentLeaderIds(
  tournaments: Tournament[],
  matches: Match[],
  limit = 8,
): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();

  const add = (id: string) => {
    if (!seen.has(id) && ids.length < limit) {
      seen.add(id);
      ids.push(id);
    }
  };

  [...tournaments]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .forEach((tournament) => add(tournament.leaderId));

  [...matches]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .forEach((match) => add(match.opponentLeaderId));

  return ids;
}
