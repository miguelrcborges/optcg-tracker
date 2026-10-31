import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Dices, RotateCcw, Swords, Target } from 'lucide-react';
import { useData } from '../context/DataContext';
import { isoDaysAgo, isoStartOfYear } from '../lib/dates';
import {
  formatPercent,
  formatRecord,
  groupSummary,
  summarize,
} from '../lib/stats';
import { EmptyState } from '../components/EmptyState';
import { LeaderImage } from '../components/LeaderImage';
import { PageHeader } from '../components/PageHeader';
import { RecordBar } from '../components/ResultBadge';
import { StatCard } from '../components/StatCard';
import type { MatchRecord } from '../lib/stats';

type Period = 'all' | '30' | 'year';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: '30', label: 'Last 30 days' },
  { value: 'year', label: 'This year' },
];

function BreakdownRow({
  leaderId,
  record,
  fallbackName,
}: {
  leaderId: string;
  record: MatchRecord;
  fallbackName: string;
}) {
  const { leaderMap } = useData();
  const leader = leaderMap.get(leaderId);

  return (
    <div className="flex items-center gap-3 py-3">
      <LeaderImage
        leader={leader}
        className="h-12 w-9 shrink-0 rounded-md"
        alt=""
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold text-mist-100">
            {leader?.name ?? fallbackName}
          </span>
          <span className="shrink-0 text-xs font-semibold tabular-nums text-mist-300">
            {formatRecord(record)}
          </span>
        </div>
        <div className="mt-1.5">
          <RecordBar record={record} />
        </div>
        <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-mist-500">
          <span>
            {record.matches} match{record.matches === 1 ? '' : 'es'}
          </span>
          <span className="tabular-nums">
            {formatPercent(record.matchWinRate)} win rate
          </span>
        </div>
      </div>
    </div>
  );
}

function SplitRow({ label, record }: { label: string; record: MatchRecord }) {
  return (
    <div className="py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-mist-200">{label}</span>
        <span className="text-xs font-semibold tabular-nums text-mist-300">
          {formatRecord(record)}{' '}
          <span className="font-normal text-mist-500">
            ({formatPercent(record.matchWinRate)})
          </span>
        </span>
      </div>
      <div className="mt-1.5">
        <RecordBar record={record} />
      </div>
      <div className="mt-1 text-[10px] text-mist-500">
        {record.matches} match{record.matches === 1 ? '' : 'es'}
      </div>
    </div>
  );
}

export function StatsPage() {
  const { data, leaderMap } = useData();
  const [period, setPeriod] = useState<Period>('all');
  const [leaderFilter, setLeaderFilter] = useState('all');

  const usedLeaderIds = useMemo(
    () => [...new Set(data.tournaments.map((t) => t.leaderId))],
    [data.tournaments],
  );

  const tournamentMap = useMemo(
    () => new Map(data.tournaments.map((t) => [t.id, t])),
    [data.tournaments],
  );

  const filteredTournaments = useMemo(() => {
    const cutoff =
      period === '30'
        ? isoDaysAgo(30)
        : period === 'year'
          ? isoStartOfYear()
          : null;

    return data.tournaments.filter(
      (tournament) =>
        (!cutoff || tournament.date >= cutoff) &&
        (leaderFilter === 'all' || tournament.leaderId === leaderFilter),
    );
  }, [data.tournaments, period, leaderFilter]);

  const filteredMatches = useMemo(() => {
    const ids = new Set(filteredTournaments.map((t) => t.id));
    return data.matches.filter((match) => ids.has(match.tournamentId));
  }, [data.matches, filteredTournaments]);

  const record = useMemo(() => summarize(filteredMatches), [filteredMatches]);

  const byLeader = useMemo(
    () =>
      [...groupSummary(
        filteredMatches,
        (match) => tournamentMap.get(match.tournamentId)?.leaderId ?? 'unknown',
      ).entries()]
        .filter(([id]) => id !== 'unknown')
        .sort((a, b) => b[1].matches - a[1].matches),
    [filteredMatches, tournamentMap],
  );

  const byOpponent = useMemo(
    () =>
      [
        ...groupSummary(
          filteredMatches.filter((match) => !match.isBye && match.opponentLeaderId),
          (match) => match.opponentLeaderId as string,
        ).entries(),
      ].sort((a, b) => b[1].matches - a[1].matches),
    [filteredMatches],
  );

  const first = useMemo(
    () => summarize(filteredMatches.filter((match) => match.firstPlayer === 'me')),
    [filteredMatches],
  );
  const second = useMemo(
    () => summarize(filteredMatches.filter((match) => match.firstPlayer === 'opponent')),
    [filteredMatches],
  );
  const diceWon = useMemo(
    () => summarize(filteredMatches.filter((match) => match.diceWinner === 'me')),
    [filteredMatches],
  );
  const diceLost = useMemo(
    () => summarize(filteredMatches.filter((match) => match.diceWinner === 'opponent')),
    [filteredMatches],
  );

  const hasFilters = period !== 'all' || leaderFilter !== 'all';

  function resetFilters() {
    setPeriod('all');
    setLeaderFilter('all');
  }

  return (
    <div>
      <PageHeader
        eyebrow="The numbers"
        title="Stats"
        description="Win rates, matchups, turn order, and dice luck across your logged events."
      />

      <section className="panel mb-4 p-3 animate-rise-in sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <span className="label">Period</span>
            <div className="flex flex-wrap gap-1.5">
              {PERIODS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPeriod(option.value)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    period === option.value
                      ? 'border-gold-400/50 bg-gold-400/12 text-gold-200'
                      : 'border-white/10 bg-white/[0.03] text-mist-400 hover:border-white/20 hover:text-mist-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full sm:w-56">
            <label htmlFor="leader-filter" className="label">
              Your leader
            </label>
            <select
              id="leader-filter"
              className="field"
              value={leaderFilter}
              onChange={(event) => setLeaderFilter(event.target.value)}
            >
              <option value="all">All leaders</option>
              {usedLeaderIds.map((id) => (
                <option key={id} value={id}>
                  {leaderMap.get(id)?.name ?? 'Unknown leader'}
                </option>
              ))}
            </select>
          </div>

          {hasFilters ? (
            <button
              type="button"
              onClick={resetFilters}
              className="btn-ghost shrink-0 text-mist-400"
            >
              <RotateCcw className="size-3.5" />
              Reset
            </button>
          ) : null}
        </div>
      </section>

      {filteredMatches.length === 0 ? (
        <EmptyState
          icon={<BarChart3 className="size-6" />}
          title={data.matches.length === 0 ? 'No rounds to analyse yet' : 'No matches in this range'}
          description={
            data.matches.length === 0
              ? 'Log a few rounds and this page will fill up with matchup and turn-order insights.'
              : 'Try a wider period or a different leader filter.'
          }
          action={
            data.matches.length === 0 ? (
              <Link to="/tournaments/new" className="btn-primary">
                Log your first tournament
              </Link>
            ) : (
              <button type="button" className="btn-secondary" onClick={resetFilters}>
                <RotateCcw className="size-4" />
                Reset filters
              </button>
            )
          }
        />
      ) : (
        <div className="space-y-6">
          <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 sm:gap-3">
            <StatCard
              value={filteredTournaments.length}
              label="Tournaments"
              hint={`${filteredMatches.length} rounds logged`}
            />
            <StatCard value={formatRecord(record)} label="Match record" />
            <StatCard value={formatPercent(record.matchWinRate)} label="Match win rate" />
            <StatCard
              value={`${record.gamesWon}–${record.gamesLost}`}
              label="Games"
              hint={`${formatPercent(record.gameWinRate)} game win rate`}
            />
            <StatCard
              value={record.draws}
              label="Draws"
              hint={record.draws === 1 ? 'One tied match' : 'Tied matches'}
            />
          </section>

          <section className="panel p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 font-display text-2xl text-mist-100">
                  <Target className="size-4 text-gold-400/80" />
                  Overall
                </h2>
                <p className="mt-0.5 text-xs text-mist-500">
                  {formatPercent(record.matchWinRate)} of decided matches won ·{' '}
                  {formatPercent(record.gameWinRate)} of games won
                </p>
              </div>
            </div>
            <div className="mt-4">
              <RecordBar record={record} />
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-mist-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-400" />
                {record.wins} wins
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-crimson-400" />
                {record.losses} losses
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-mist-500" />
                {record.draws} draws
              </span>
            </div>
          </section>

          <section className="panel p-4 sm:p-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 font-display text-2xl text-mist-100">
                  <Swords className="size-4 text-gold-400/80" />
                  Matchups
                </h2>
                <p className="mt-0.5 text-xs text-mist-500">
                  How you fare against each opposing leader.
                </p>
              </div>
              <span className="text-[10px] text-mist-600">
                {byOpponent.length} leader{byOpponent.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="mt-2 divide-y divide-white/[0.06]">
              {byOpponent.map(([leaderId, matchup]) => (
                <BreakdownRow
                  key={leaderId}
                  leaderId={leaderId}
                  record={matchup}
                  fallbackName="Unknown leader"
                />
              ))}
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="panel p-4 sm:p-5">
              <h2 className="flex items-center gap-2 font-display text-2xl text-mist-100">
                <Dices className="size-4 text-gold-400/80" />
                Dice &amp; turn order
              </h2>
              <p className="mt-0.5 text-xs text-mist-500">
                Does winning the roll actually help?
              </p>
              <div className="mt-2 divide-y divide-white/[0.06]">
                <SplitRow label="Won the dice" record={diceWon} />
                <SplitRow label="Lost the dice" record={diceLost} />
                <SplitRow label="Went first" record={first} />
                <SplitRow label="Went second" record={second} />
              </div>
            </section>

            <section className="panel p-4 sm:p-5">
              <h2 className="font-display text-2xl text-mist-100">By your leader</h2>
              <p className="mt-0.5 text-xs text-mist-500">
                Events grouped by the leader you registered.
              </p>
              <div className="mt-2 divide-y divide-white/[0.06]">
                {byLeader.map(([leaderId, leaderRecord]) => (
                  <BreakdownRow
                    key={leaderId}
                    leaderId={leaderId}
                    record={leaderRecord}
                    fallbackName="Unknown leader"
                  />
                ))}
              </div>
            </section>
          </div>

          <p className="px-1 text-[10px] leading-relaxed text-mist-600">
            Match win rate counts wins ÷ (wins + losses); draws are shown
            separately. Game win rate counts individual games. Filters apply to
            the event date, so every round in a filtered event is included.
          </p>
        </div>
      )}
    </div>
  );
}
