import { describe, expect, it } from 'vitest';
import type { Match } from '../types';
import {
  formatPercent,
  formatRecord,
  getMatchResult,
  groupSummary,
  nextRound,
  sortByRound,
  summarize,
} from './stats';

function match(overrides: Partial<Match> = {}): Match {
  return {
    id: 'match-1',
    tournamentId: 'event-1',
    round: 1,
    opponentLeaderId: 'OP01-001',
    diceWinner: 'me',
    firstPlayer: 'me',
    myGameWins: 2,
    opponentGameWins: 0,
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
    ...overrides,
  };
}

describe('getMatchResult', () => {
  it('derives win, loss and draw from game scores', () => {
    expect(getMatchResult({ myGameWins: 2, opponentGameWins: 1 })).toBe('win');
    expect(getMatchResult({ myGameWins: 0, opponentGameWins: 2 })).toBe('loss');
    expect(getMatchResult({ myGameWins: 1, opponentGameWins: 1 })).toBe('draw');
  });

  it('treats a bye as a win regardless of score', () => {
    expect(getMatchResult({ myGameWins: 0, opponentGameWins: 0, isBye: true })).toBe(
      'win',
    );
  });
});

describe('summarize', () => {
  it('counts records, games and rates', () => {
    const record = summarize([
      match({ id: 'a', myGameWins: 2, opponentGameWins: 0 }),
      match({ id: 'b', myGameWins: 1, opponentGameWins: 2 }),
      match({ id: 'c', myGameWins: 1, opponentGameWins: 1 }),
    ]);

    expect(record.matches).toBe(3);
    expect(record.wins).toBe(1);
    expect(record.losses).toBe(1);
    expect(record.draws).toBe(1);
    expect(record.gamesWon).toBe(4);
    expect(record.gamesLost).toBe(3);
    expect(record.matchWinRate).toBe(0.5);
    expect(record.gameWinRate).toBeCloseTo(4 / 7);
  });

  it('returns null rates when there is nothing to divide by', () => {
    const record = summarize([]);
    expect(record.matches).toBe(0);
    expect(record.matchWinRate).toBeNull();
    expect(record.gameWinRate).toBeNull();
  });

  it('counts byes as wins without adding games', () => {
    const record = summarize([
      match({ id: 'a', isBye: true, myGameWins: 0, opponentGameWins: 0 }),
      match({ id: 'b', myGameWins: 1, opponentGameWins: 2 }),
    ]);

    expect(record.matches).toBe(2);
    expect(record.wins).toBe(1);
    expect(record.losses).toBe(1);
    expect(record.gamesWon).toBe(1);
    expect(record.gamesLost).toBe(2);
    expect(record.matchWinRate).toBe(0.5);
    expect(record.gameWinRate).toBeCloseTo(1 / 3);
  });
});

describe('groupSummary', () => {
  it('groups matches by key', () => {
    const grouped = groupSummary(
      [
        match({ id: 'a', opponentLeaderId: 'A', myGameWins: 2, opponentGameWins: 0 }),
        match({ id: 'b', opponentLeaderId: 'A', myGameWins: 0, opponentGameWins: 2 }),
        match({ id: 'c', opponentLeaderId: 'B', myGameWins: 2, opponentGameWins: 1 }),
      ],
      (item) => item.opponentLeaderId,
    );

    expect(grouped.get('A')?.matches).toBe(2);
    expect(grouped.get('A')?.wins).toBe(1);
    expect(grouped.get('A')?.losses).toBe(1);
    expect(grouped.get('B')?.wins).toBe(1);
  });
});

describe('formatting helpers', () => {
  it('omits draws when there are none', () => {
    expect(formatRecord(summarize([match()]))).toBe('1–0');
    expect(
      formatRecord(
        summarize([
          match({ id: 'a' }),
          match({ id: 'b', myGameWins: 1, opponentGameWins: 1 }),
        ]),
      ),
    ).toBe('1–0–1');
  });

  it('formats percentages and empty rates', () => {
    expect(formatPercent(0.5)).toBe('50%');
    expect(formatPercent(0.666)).toBe('67%');
    expect(formatPercent(null)).toBe('–');
  });
});

describe('round helpers', () => {
  it('sorts by round and finds the next round', () => {
    const matches = [
      match({ id: 'b', round: 2 }),
      match({ id: 'a', round: 1 }),
    ];
    expect(sortByRound(matches).map((item) => item.round)).toEqual([1, 2]);
    expect(nextRound(matches)).toBe(3);
    expect(nextRound([])).toBe(1);
  });
});
