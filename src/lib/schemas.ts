import { z } from 'zod';
import { LEADER_COLORS, PLAYER_SIDES } from '../types';

const leaderColorSchema = z.enum(LEADER_COLORS);

export const leaderSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  colors: z.array(leaderColorSchema).min(1),
  setId: z.string().default(''),
  setName: z.string().default(''),
  setCode: z.string().default(''),
  imageUrl: z.string().default(''),
  custom: z.boolean().optional(),
});

export const tournamentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  location: z.string().optional(),
  format: z.string().optional(),
  leaderId: z.string().min(1),
  notes: z.string().optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const matchSchema = z.object({
  id: z.string().min(1),
  tournamentId: z.string().min(1),
  round: z.number().int().min(1).max(999),
  opponentLeaderId: z.string().min(1),
  opponentName: z.string().optional(),
  diceWinner: z.enum(PLAYER_SIDES),
  firstPlayer: z.enum(PLAYER_SIDES),
  myGameWins: z.number().int().min(0).max(99),
  opponentGameWins: z.number().int().min(0).max(99),
  notes: z.string().optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const appDataSchema = z.object({
  version: z.literal(1),
  tournaments: z.array(tournamentSchema).default([]),
  matches: z.array(matchSchema).default([]),
  customLeaders: z.array(leaderSchema).default([]),
});

export const backupEnvelopeSchema = z.object({
  app: z.literal('grand-line-ledger'),
  version: z.literal(1),
  exportedAt: z.string(),
  data: appDataSchema,
});
