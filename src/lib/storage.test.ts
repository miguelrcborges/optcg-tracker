import { describe, expect, it } from 'vitest';
import type { AppData } from '../types';
import { exportBackup, parseBackup } from './storage';

const sampleData: AppData = {
  version: 1,
  tournaments: [
    {
      id: 'event-1',
      name: 'Friday Locals',
      date: '2026-02-06',
      leaderId: 'OP01-001',
      createdAt: '2026-02-06T18:00:00.000Z',
      updatedAt: '2026-02-06T18:00:00.000Z',
    },
  ],
  matches: [
    {
      id: 'match-1',
      tournamentId: 'event-1',
      round: 1,
      opponentLeaderId: 'OP01-060',
      diceWinner: 'me',
      firstPlayer: 'me',
      myGameWins: 2,
      opponentGameWins: 1,
      createdAt: '2026-02-06T18:10:00.000Z',
      updatedAt: '2026-02-06T18:10:00.000Z',
    },
  ],
  customLeaders: [
    {
      id: 'custom:1',
      name: 'Test Leader',
      colors: ['Red', 'Blue'],
      setId: 'CUSTOM',
      setName: 'Custom leader',
      setCode: 'CUSTOM',
      imageUrl: '',
      custom: true,
    },
  ],
};

describe('parseBackup', () => {
  it('reads an exported backup envelope', () => {
    const parsed = parseBackup(exportBackup(sampleData));
    expect(parsed.data.tournaments).toHaveLength(1);
    expect(parsed.data.matches[0].myGameWins).toBe(2);
    expect(parsed.exportedAt).toBeTruthy();
  });

  it('reads a direct AppData object', () => {
    const parsed = parseBackup(JSON.stringify(sampleData));
    expect(parsed.exportedAt).toBeNull();
    expect(parsed.data.customLeaders[0].name).toBe('Test Leader');
  });

  it('rejects invalid JSON', () => {
    expect(() => parseBackup('{nope')).toThrow(/not valid JSON/i);
  });

  it('rejects an unrelated JSON file', () => {
    expect(() => parseBackup(JSON.stringify({ hello: 'world' }))).toThrow(
      /not a Grand Line Ledger backup/i,
    );
  });

  it('rejects malformed matches', () => {
    const broken = {
      ...sampleData,
      matches: [{ ...sampleData.matches[0], diceWinner: 'nobody' }],
    };
    expect(() => parseBackup(JSON.stringify(broken))).toThrow(
      /not a Grand Line Ledger backup/i,
    );
  });
});
