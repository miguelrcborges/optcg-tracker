import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  CalendarDays,
  ChevronRight,
  Dices,
  Flag,
  MapPin,
  Pencil,
  Plus,
  StickyNote,
  Trash2,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { formatEventDate } from '../lib/dates';
import {
  formatPercent,
  formatRecord,
  getMatchResult,
  sortByRound,
  summarize,
} from '../lib/stats';
import { EmptyState } from '../components/EmptyState';
import { LeaderImage } from '../components/LeaderImage';
import { PageHeader } from '../components/PageHeader';
import { RecordBar, RecordPill, ResultBadge } from '../components/ResultBadge';
import { StatCard } from '../components/StatCard';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { Match } from '../types';

export function TournamentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, leaderMap, deleteTournament, deleteMatch } = useData();
  const { toast } = useToast();
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);
  const [deleteEventOpen, setDeleteEventOpen] = useState(false);

  const tournament = id
    ? data.tournaments.find((item) => item.id === id)
    : undefined;

  const matches = useMemo(
    () =>
      sortByRound(
        data.matches.filter((match) => match.tournamentId === tournament?.id),
      ),
    [data.matches, tournament?.id],
  );

  const record = useMemo(() => summarize(matches), [matches]);
  const firstRecord = useMemo(
    () => summarize(matches.filter((match) => match.firstPlayer === 'me')),
    [matches],
  );
  const diceWonRecord = useMemo(
    () => summarize(matches.filter((match) => match.diceWinner === 'me')),
    [matches],
  );

  if (!tournament) {
    return (
      <EmptyState
        title="Event not found"
        description="This tournament may have been deleted, or the link is out of date."
        action={
          <Link to="/" className="btn-primary">
            Back to tournaments
          </Link>
        }
      />
    );
  }

  const leader = leaderMap.get(tournament.leaderId);

  return (
    <div>
      <PageHeader
        eyebrow={tournament.format || 'Tournament'}
        title={tournament.name}
        backTo="/"
        backLabel="All tournaments"
        action={
          <div className="flex items-center gap-2">
            <Link
              to={`/tournaments/${tournament.id}/edit`}
              className="btn-secondary hidden sm:inline-flex"
            >
              <Pencil className="size-4" />
              Edit
            </Link>
            <Link
              to={`/tournaments/${tournament.id}/matches/new`}
              className="btn-primary"
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">Add match</span>
              <span className="sm:hidden">Match</span>
            </Link>
          </div>
        }
      />

      <section className="panel-raised relative overflow-hidden animate-rise-in">
        {leader ? (
          <div className="pointer-events-none absolute -right-10 -top-16 h-[150%] w-2/3 opacity-[0.12] blur-2xl">
            <LeaderImage leader={leader} className="h-full w-full" alt="" />
          </div>
        ) : null}

        <div className="relative p-5 sm:p-6">
          <div className="flex gap-4 sm:gap-6">
            <LeaderImage
              leader={leader}
              className="h-40 w-28 shrink-0 rounded-2xl shadow-2xl shadow-black/50 sm:h-48 sm:w-32"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-mist-400">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="size-3.5" />
                  {formatEventDate(tournament.date)}
                </span>
                {tournament.location ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {tournament.location}
                  </span>
                ) : null}
              </div>

              <h2 className="mt-2 break-words font-display text-2xl leading-none text-mist-100 sm:text-4xl">
                {leader?.name ?? 'Unknown leader'}
              </h2>
              <p className="mt-1 text-xs text-mist-500">
                {leader?.setCode ?? '—'} · {leader?.colors.join('/') ?? '—'}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <RecordPill record={record} />
                <span className="chip">
                  {record.gamesWon}–{record.gamesLost} games
                </span>
                <span className="chip">
                  {record.matches} round{record.matches === 1 ? '' : 's'}
                </span>
              </div>

              <div className="mt-4 max-w-xs">
                <RecordBar record={record} />
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 border-t border-white/[0.07] pt-4">
            <Link
              to={`/tournaments/${tournament.id}/edit`}
              className="btn-ghost sm:hidden"
            >
              <Pencil className="size-4" />
              Edit event
            </Link>
            <button
              type="button"
              onClick={() => setDeleteEventOpen(true)}
              className="btn-ghost ml-auto text-mist-500 hover:text-crimson-300"
            >
              <Trash2 className="size-4" />
              Delete event
            </button>
          </div>
        </div>
      </section>

      {tournament.notes ? (
        <section className="panel mt-3 flex gap-3 p-4 animate-rise-in">
          <StickyNote className="mt-0.5 size-4 shrink-0 text-gold-400/80" />
          <div>
            <p className="section-title">Event notes</p>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-mist-300">
              {tournament.notes}
            </p>
          </div>
        </section>
      ) : null}

      <section className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <StatCard value={formatRecord(record)} label="Match record" />
        <StatCard value={`${record.gamesWon}–${record.gamesLost}`} label="Games" />
        <StatCard
          value={formatRecord(firstRecord)}
          label="Going first"
          hint={`${formatPercent(firstRecord.matchWinRate)} win rate`}
        />
        <StatCard
          value={formatRecord(diceWonRecord)}
          label="Won the dice"
          hint={`${formatPercent(diceWonRecord.matchWinRate)} win rate`}
        />
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-mist-100">Rounds</h2>
            <p className="mt-0.5 text-xs text-mist-500">
              Tap a round to edit it.
            </p>
          </div>
          <Link
            to={`/tournaments/${tournament.id}/matches/new`}
            className="btn-secondary"
          >
            <Plus className="size-4" />
            Add round
          </Link>
        </div>

        {matches.length === 0 ? (
          <div className="panel flex flex-col items-center px-6 py-10 text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] text-mist-500">
              <Dices className="size-5" />
            </div>
            <h3 className="font-display text-xl text-mist-100">No rounds yet</h3>
            <p className="mt-1 max-w-sm text-sm text-mist-400">
              Log the first match: opponent’s leader, dice, turn order, and the
              game score.
            </p>
            <Link
              to={`/tournaments/${tournament.id}/matches/new`}
              className="btn-primary mt-5"
            >
              <Plus className="size-4" />
              Add first match
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {matches.map((match) => {
              const isBye = Boolean(match.isBye);
              const opponent = match.opponentLeaderId
                ? leaderMap.get(match.opponentLeaderId)
                : undefined;
              const result = getMatchResult(match);
              return (
                <div
                  key={match.id}
                  className="panel group flex items-stretch gap-2 p-2.5 transition hover:border-white/15 hover:bg-ink-850/90 sm:gap-3 sm:p-3"
                >
                  <div className="flex w-9 shrink-0 flex-col items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.035]">
                    <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-mist-600">
                      Rnd
                    </span>
                    <span className="font-display text-xl leading-none text-mist-200">
                      {match.round}
                    </span>
                  </div>

                  <Link
                    to={`/tournaments/${tournament.id}/matches/${match.id}/edit`}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    {isBye ? (
                      <div className="flex h-16 w-11 shrink-0 items-center justify-center rounded-lg border border-dashed border-gold-400/30 bg-gold-400/[0.06] text-gold-300/80">
                        <Flag className="size-4" />
                      </div>
                    ) : (
                      <LeaderImage
                        leader={opponent}
                        className="h-16 w-11 shrink-0 rounded-lg shadow-md shadow-black/30"
                        alt=""
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-semibold text-mist-100">
                          {isBye ? 'Bye' : opponent?.name ?? 'Unknown leader'}
                        </span>
                        <ResultBadge result={result} size="sm" />
                      </div>
                      {isBye ? (
                        <p className="mt-0.5 truncate text-[11px] text-mist-500">
                          No opponent this round
                        </p>
                      ) : match.opponentName ? (
                        <p className="mt-0.5 truncate text-[11px] text-mist-500">
                          vs {match.opponentName}
                        </p>
                      ) : null}

                      {!isBye ? (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <span className="chip">
                            <Dices className="size-3" />
                            Dice: {match.diceWinner === 'me' ? 'You' : 'Opponent'}
                          </span>
                          <span className="chip">
                            <Flag className="size-3" />
                            First: {match.firstPlayer === 'me' ? 'You' : 'Opponent'}
                          </span>
                        </div>
                      ) : null}

                      {match.notes ? (
                        <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-mist-500">
                          {match.notes}
                        </p>
                      ) : null}
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="font-display text-2xl leading-none text-mist-100 tabular-nums">
                        {isBye
                          ? '—'
                          : `${match.myGameWins}–${match.opponentGameWins}`}
                      </div>
                      <div className="mt-1 text-[8px] font-bold uppercase tracking-[0.14em] text-mist-600">
                        {isBye ? 'Bye win' : 'Games'}
                      </div>
                      <ChevronRight className="ml-auto mt-1 size-3.5 text-mist-600 transition group-hover:translate-x-0.5 group-hover:text-mist-300" />
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setMatchToDelete(match)}
                    className="icon-btn self-center text-mist-600 hover:text-crimson-300"
                    aria-label={`Delete round ${match.round}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(matchToDelete)}
        title="Delete this round?"
        description={
          matchToDelete
            ? matchToDelete.isBye
              ? `Round ${matchToDelete.round} bye will be removed from the ledger.`
              : `Round ${matchToDelete.round} against ${
                  matchToDelete.opponentLeaderId
                    ? leaderMap.get(matchToDelete.opponentLeaderId)?.name ??
                      'that leader'
                    : 'that leader'
                } will be removed from the ledger.`
            : ''
        }
        confirmLabel="Delete round"
        onClose={() => setMatchToDelete(null)}
        onConfirm={() => {
          if (!matchToDelete) return;
          deleteMatch(matchToDelete.id);
          toast('Round deleted.');
          setMatchToDelete(null);
        }}
      />

      <ConfirmDialog
        open={deleteEventOpen}
        title="Delete this event?"
        description={`“${tournament.name}” and its ${matches.length} logged round${
          matches.length === 1 ? '' : 's'
        } will be deleted. Export a backup first if you might want them later.`}
        confirmLabel="Delete event"
        onClose={() => setDeleteEventOpen(false)}
        onConfirm={() => {
          deleteTournament(tournament.id);
          toast('Event deleted.');
          navigate('/');
        }}
      />
    </div>
  );
}
