import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  AppData,
  Leader,
  LeaderColor,
  Match,
  PlayerSide,
  Tournament,
} from '../types';
import { EMPTY_DATA } from '../types';
import { BUNDLED_LEADERS } from '../lib/leaders';
import { newCustomLeaderId, newId } from '../lib/ids';
import { loadData, saveData } from '../lib/storage';

export interface TournamentInput {
  name: string;
  date: string;
  location?: string;
  format?: string;
  leaderId: string;
  notes?: string;
}

export interface MatchInput {
  tournamentId: string;
  round: number;
  opponentLeaderId: string;
  opponentName?: string;
  diceWinner: PlayerSide;
  firstPlayer: PlayerSide;
  myGameWins: number;
  opponentGameWins: number;
  notes?: string;
}

interface DataContextValue {
  data: AppData;
  leaders: Leader[];
  leaderMap: Map<string, Leader>;
  storageWarning: string | null;
  saveError: string | null;
  dismissSaveError: () => void;
  addTournament: (input: TournamentInput) => Tournament;
  updateTournament: (id: string, input: TournamentInput) => void;
  deleteTournament: (id: string) => void;
  addMatch: (input: MatchInput) => Match;
  updateMatch: (id: string, input: MatchInput) => void;
  deleteMatch: (id: string) => void;
  addCustomLeader: (name: string, colors: LeaderColor[]) => Leader;
  replaceData: (data: AppData) => void;
  clearData: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

function nowISO(): string {
  return new Date().toISOString();
}

function cleanOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => loadData(), []);
  const [data, setData] = useState<AppData>(initial.data);
  const [storageWarning] = useState<string | null>(initial.warning);
  const [saveError, setSaveError] = useState<string | null>(null);
  const lastSaved = useRef(initial.data);

  useEffect(() => {
    // Do not overwrite storage until the user actually changes something.
    // This also protects unreadable legacy data from being clobbered on load.
    if (data === lastSaved.current) return;
    lastSaved.current = data;
    setSaveError(saveData(data));
  }, [data]);

  const leaders = useMemo(() => {
    const custom = data.customLeaders.map((leader) => ({
      ...leader,
      custom: true,
    }));
    return [...custom, ...BUNDLED_LEADERS].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [data.customLeaders]);

  const leaderMap = useMemo(
    () => new Map(leaders.map((leader) => [leader.id, leader])),
    [leaders],
  );

  const addTournament = useCallback((input: TournamentInput): Tournament => {
    const timestamp = nowISO();
    const tournament: Tournament = {
      id: newId(),
      name: input.name.trim(),
      date: input.date,
      location: cleanOptional(input.location),
      format: cleanOptional(input.format),
      leaderId: input.leaderId,
      notes: cleanOptional(input.notes),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    setData((current) => ({
      ...current,
      tournaments: [tournament, ...current.tournaments],
    }));
    return tournament;
  }, []);

  const updateTournament = useCallback(
    (id: string, input: TournamentInput) => {
      setData((current) => ({
        ...current,
        tournaments: current.tournaments.map((tournament) =>
          tournament.id === id
            ? {
                ...tournament,
                name: input.name.trim(),
                date: input.date,
                location: cleanOptional(input.location),
                format: cleanOptional(input.format),
                leaderId: input.leaderId,
                notes: cleanOptional(input.notes),
                updatedAt: nowISO(),
              }
            : tournament,
        ),
      }));
    },
    [],
  );

  const deleteTournament = useCallback((id: string) => {
    setData((current) => ({
      ...current,
      tournaments: current.tournaments.filter(
        (tournament) => tournament.id !== id,
      ),
      matches: current.matches.filter((match) => match.tournamentId !== id),
    }));
  }, []);

  const addMatch = useCallback((input: MatchInput): Match => {
    const timestamp = nowISO();
    const match: Match = {
      id: newId(),
      tournamentId: input.tournamentId,
      round: input.round,
      opponentLeaderId: input.opponentLeaderId,
      opponentName: cleanOptional(input.opponentName),
      diceWinner: input.diceWinner,
      firstPlayer: input.firstPlayer,
      myGameWins: input.myGameWins,
      opponentGameWins: input.opponentGameWins,
      notes: cleanOptional(input.notes),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    setData((current) => ({
      ...current,
      matches: [...current.matches, match],
    }));
    return match;
  }, []);

  const updateMatch = useCallback((id: string, input: MatchInput) => {
    setData((current) => ({
      ...current,
      matches: current.matches.map((match) =>
        match.id === id
          ? {
              ...match,
              round: input.round,
              opponentLeaderId: input.opponentLeaderId,
              opponentName: cleanOptional(input.opponentName),
              diceWinner: input.diceWinner,
              firstPlayer: input.firstPlayer,
              myGameWins: input.myGameWins,
              opponentGameWins: input.opponentGameWins,
              notes: cleanOptional(input.notes),
              updatedAt: nowISO(),
            }
          : match,
      ),
    }));
  }, []);

  const deleteMatch = useCallback((id: string) => {
    setData((current) => ({
      ...current,
      matches: current.matches.filter((match) => match.id !== id),
    }));
  }, []);

  const addCustomLeader = useCallback(
    (name: string, colors: LeaderColor[]): Leader => {
      const leader: Leader = {
        id: newCustomLeaderId(),
        name: name.trim(),
        colors: colors.length > 0 ? colors : ['Black'],
        setId: 'CUSTOM',
        setName: 'Custom leader',
        setCode: 'CUSTOM',
        imageUrl: '',
        custom: true,
      };

      setData((current) => ({
        ...current,
        customLeaders: [...current.customLeaders, leader],
      }));
      return leader;
    },
    [],
  );

  const replaceData = useCallback((next: AppData) => {
    setData(next);
  }, []);

  const clearData = useCallback(() => {
    setData({ ...EMPTY_DATA, tournaments: [], matches: [], customLeaders: [] });
  }, []);

  const value = useMemo<DataContextValue>(
    () => ({
      data,
      leaders,
      leaderMap,
      storageWarning,
      saveError,
      dismissSaveError: () => setSaveError(null),
      addTournament,
      updateTournament,
      deleteTournament,
      addMatch,
      updateMatch,
      deleteMatch,
      addCustomLeader,
      replaceData,
      clearData,
    }),
    [
      data,
      leaders,
      leaderMap,
      storageWarning,
      saveError,
      addTournament,
      updateTournament,
      deleteTournament,
      addMatch,
      updateMatch,
      deleteMatch,
      addCustomLeader,
      replaceData,
      clearData,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const value = useContext(DataContext);
  if (!value) {
    throw new Error('useData must be used inside DataProvider');
  }
  return value;
}
