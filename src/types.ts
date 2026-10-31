export const LEADER_COLORS = [
  'Red',
  'Blue',
  'Green',
  'Purple',
  'Yellow',
  'Black',
] as const;

export type LeaderColor = (typeof LEADER_COLORS)[number];

export const PLAYER_SIDES = ['me', 'opponent'] as const;
export type PlayerSide = (typeof PLAYER_SIDES)[number];

export type MatchResult = 'win' | 'loss' | 'draw';

export interface Leader {
  id: string;
  name: string;
  colors: LeaderColor[];
  setId: string;
  setName: string;
  setCode: string;
  imageUrl: string;
  custom?: boolean;
}

export interface Tournament {
  id: string;
  name: string;
  date: string;
  location?: string;
  format?: string;
  leaderId: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Match {
  id: string;
  tournamentId: string;
  round: number;
  opponentLeaderId?: string;
  opponentName?: string;
  diceWinner?: PlayerSide;
  firstPlayer?: PlayerSide;
  myGameWins: number;
  opponentGameWins: number;
  /** A bye counts as a win without an opponent, dice roll, or game score. */
  isBye?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppData {
  version: 1;
  tournaments: Tournament[];
  matches: Match[];
  customLeaders: Leader[];
}

export const EMPTY_DATA: AppData = {
  version: 1,
  tournaments: [],
  matches: [],
  customLeaders: [],
};
