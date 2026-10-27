import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  ChevronRight,
  MapPin,
  Plus,
  Trophy,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { formatEventDate } from '../lib/dates';
import { getMatchResult, summarize } from '../lib/stats';
import { leaderGradient } from '../lib/leaders';
import { EmptyState } from '../components/EmptyState';
import { LeaderImage } from '../components/LeaderImage';
import { PageHeader } from '../components/PageHeader';
import {
  RecordBar,
  RecordPill,
  ResultBadge,
} from '../components/ResultBadge';

export function TournamentsPage() {
  const { data, leaderMap } = useData();

  const tournaments = useMemo(
    () =>
      [...data.tournaments].sort(
        (a, b) =>
          b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
      ),
    [data.tournaments],
  );

  const matchesByTournament = useMemo(() => {
    const map = new Map<string, typeof data.matches>();
    for (const match of data.matches) {
      const group = map.get(match.tournamentId);
      if (group) {
        group.push(match);
      } else {
        map.set(match.tournamentId, [match]);
      }
    }
    return map;
  }, [data.matches]);

  return (
    <div>
      <PageHeader
        eyebrow="Your log"
        title="Tournaments"
        description="Every event, every leader, every round. Log results after each match and let the ledger do the counting."
        action={
          <Link to="/tournaments/new" className="btn-primary">
            <Plus className="size-4" />
            <span className="hidden sm:inline">New tournament</span>
            <span className="sm:hidden">New</span>
          </Link>
        }
      />

      {tournaments.length === 0 ? (
        <EmptyState
          icon={<Trophy className="size-6" />}
          title="The log is empty"
          description="Start with the event you played last. Add your leader, then log each round as you go — or all at once afterwards."
          action={
            <Link to="/tournaments/new" className="btn-primary">
              <Plus className="size-4" />
              Create your first tournament
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {tournaments.map((tournament, index) => {
            const matches = matchesByTournament.get(tournament.id) ?? [];
            const record = summarize(matches);
            const leader = leaderMap.get(tournament.leaderId);
            const lastResult = matches.length
              ? getMatchResult(
                  [...matches].sort((a, b) => b.round - a.round)[0],
                )
              : null;

            return (
              <Link
                key={tournament.id}
                to={`/tournaments/${tournament.id}`}
                className="panel group relative overflow-hidden p-4 transition hover:border-white/15 hover:bg-ink-850/90 animate-rise-in"
                style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
              >
                <div
                  className="pointer-events-none absolute -right-10 -top-16 size-48 rounded-full opacity-[0.07] blur-2xl transition group-hover:opacity-[0.12]"
                  style={{
                    background: leader
                      ? leaderGradient(leader.colors)
                      : undefined,
                  }}
                />
                <div className="relative flex gap-4">
                  <LeaderImage
                    leader={leader}
                    className="h-28 w-20 shrink-0 rounded-xl shadow-lg shadow-black/30"
                    alt=""
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-400/80">
                          {tournament.format || 'Event'}
                        </p>
                        <h2 className="mt-0.5 truncate font-display text-2xl leading-tight text-mist-100">
                          {tournament.name}
                        </h2>
                      </div>
                      <ChevronRight className="mt-1 size-4 shrink-0 text-mist-600 transition group-hover:translate-x-0.5 group-hover:text-mist-300" />
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-mist-500">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="size-3" />
                        {formatEventDate(tournament.date)}
                      </span>
                      {tournament.location ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3" />
                          {tournament.location}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <RecordPill record={record} />
                      <span className="text-[11px] text-mist-500">
                        {record.matches} round{record.matches === 1 ? '' : 's'}
                      </span>
                      {lastResult ? (
                        <span className="ml-auto">
                          <ResultBadge result={lastResult} size="sm" />
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-2.5">
                      <RecordBar record={record} />
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
                      <span className="truncate text-mist-400">
                        {leader?.name ?? 'Unknown leader'}
                      </span>
                      {record.matches > 0 ? (
                        <span className="shrink-0 tabular-nums text-mist-600">
                          {record.gamesWon}–{record.gamesLost} games
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
