import { useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Check,
  Dices,
  Flag,
  Minus,
  Plus,
  Save,
  UserRound,
} from 'lucide-react';
import type { PlayerSide } from '../types';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import {
  getMatchResult,
  nextRound,
  resultLabel,
  resultToneClass,
} from '../lib/stats';
import { EmptyState } from '../components/EmptyState';
import { LeaderImage } from '../components/LeaderImage';
import { LeaderPicker } from '../components/LeaderPicker';
import { PageHeader } from '../components/PageHeader';
import { SegmentedControl } from '../components/SegmentedControl';

const QUICK_SCORES = [
  { label: '2–0', my: 2, opponent: 0 },
  { label: '2–1', my: 2, opponent: 1 },
  { label: '1–2', my: 1, opponent: 2 },
  { label: '0–2', my: 0, opponent: 2 },
  { label: 'Draw', my: 1, opponent: 1 },
];

function ScoreStepper({
  label,
  value,
  onChange,
  tone,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  tone: 'you' | 'opponent';
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        tone === 'you'
          ? 'border-emerald-400/20 bg-emerald-400/[0.04]'
          : 'border-crimson-400/20 bg-crimson-400/[0.04]'
      }`}
    >
      <div className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-mist-500">
        {label}
      </div>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value <= 0}
          className="icon-btn border-white/10 bg-white/[0.04] text-mist-200"
          aria-label={`Remove one game from ${label}`}
        >
          <Minus className="size-4" />
        </button>
        <span className="font-display text-4xl leading-none text-mist-100 tabular-nums">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(5, value + 1))}
          disabled={value >= 5}
          className="icon-btn border-white/10 bg-white/[0.04] text-mist-200"
          aria-label={`Add one game to ${label}`}
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function MatchFormPage() {
  const { id, matchId } = useParams();
  const navigate = useNavigate();
  const { data, leaderMap, addMatch, updateMatch } = useData();
  const { toast } = useToast();
  const intentRef = useRef<'done' | 'another'>('done');

  const tournament = id
    ? data.tournaments.find((item) => item.id === id)
    : undefined;

  const tournamentMatches = useMemo(
    () =>
      data.matches.filter(
        (match) => match.tournamentId === id && match.id !== matchId,
      ),
    [data.matches, id, matchId],
  );

  const existing = matchId
    ? data.matches.find(
        (match) => match.id === matchId && match.tournamentId === id,
      )
    : undefined;
  const editing = Boolean(matchId);

  const [round, setRound] = useState(
    existing?.round ?? nextRound(tournamentMatches),
  );
  const [opponentLeaderId, setOpponentLeaderId] = useState<string | null>(
    existing?.opponentLeaderId ?? null,
  );
  const [opponentName, setOpponentName] = useState(
    existing?.opponentName ?? '',
  );
  const [diceWinner, setDiceWinner] = useState<PlayerSide | null>(
    existing?.diceWinner ?? null,
  );
  const [firstPlayer, setFirstPlayer] = useState<PlayerSide | null>(
    existing?.firstPlayer ?? null,
  );
  const [firstTouched, setFirstTouched] = useState(editing);
  const [myGameWins, setMyGameWins] = useState(
    existing?.myGameWins ?? 0,
  );
  const [opponentGameWins, setOpponentGameWins] = useState(
    existing?.opponentGameWins ?? 0,
  );
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [errors, setErrors] = useState<{
    round?: string;
    opponent?: string;
    dice?: string;
    first?: string;
  }>({});

  if (!tournament) {
    return (
      <EmptyState
        title="Event not found"
        description="This tournament may have been deleted."
        action={
          <Link to="/" className="btn-primary">
            Back to tournaments
          </Link>
        }
      />
    );
  }

  if (editing && !existing) {
    return (
      <EmptyState
        title="Round not found"
        description="This match may have been deleted."
        action={
          <Link to={`/tournaments/${tournament.id}`} className="btn-primary">
            Back to event
          </Link>
        }
      />
    );
  }

  const opponent = opponentLeaderId
    ? leaderMap.get(opponentLeaderId)
    : null;
  const yourLeader = leaderMap.get(tournament.leaderId);
  const previewResult = getMatchResult({ myGameWins, opponentGameWins });

  function handleDiceChange(value: PlayerSide) {
    setDiceWinner(value);
    if (!firstTouched) {
      setFirstPlayer(value);
    }
    setErrors((current) => ({ ...current, dice: undefined }));
  }

  function handleFirstChange(value: PlayerSide) {
    setFirstTouched(true);
    setFirstPlayer(value);
    setErrors((current) => ({ ...current, first: undefined }));
  }

  function resetForNextRound() {
    setRound((current) => current + 1);
    setOpponentLeaderId(null);
    setOpponentName('');
    setDiceWinner(null);
    setFirstPlayer(null);
    setFirstTouched(false);
    setMyGameWins(0);
    setOpponentGameWins(0);
    setNotes('');
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!tournament) return;
    const intent = intentRef.current;

    const nextErrors: typeof errors = {};
    if (!Number.isInteger(round) || round < 1 || round > 999) {
      nextErrors.round = 'Round must be between 1 and 999.';
    } else if (tournamentMatches.some((match) => match.round === round)) {
      nextErrors.round = `Round ${round} is already logged.`;
    }
    if (!opponentLeaderId) {
      nextErrors.opponent = 'Choose your opponent’s leader.';
    }
    if (!diceWinner) {
      nextErrors.dice = 'Who won the dice roll?';
    }
    if (!firstPlayer) {
      nextErrors.first = 'Who played first?';
    }

    setErrors(nextErrors);
    if (
      Object.keys(nextErrors).length > 0 ||
      !opponentLeaderId ||
      !diceWinner ||
      !firstPlayer
    ) {
      return;
    }

    intentRef.current = 'done';

    const input = {
      tournamentId: tournament.id,
      round,
      opponentLeaderId,
      opponentName: opponentName.trim() || undefined,
      diceWinner,
      firstPlayer,
      myGameWins,
      opponentGameWins,
      notes: notes.trim() || undefined,
    };

    if (editing && existing) {
      updateMatch(existing.id, input);
      toast('Round updated.');
      navigate(`/tournaments/${tournament.id}`);
      return;
    }

    addMatch(input);
    const savedRound = round;

    if (intent === 'another') {
      toast(`Round ${savedRound} saved. Next round ready.`);
      resetForNextRound();
    } else {
      toast(`Round ${savedRound} saved.`);
      navigate(`/tournaments/${tournament.id}`);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow={editing ? `Round ${round}` : 'New round'}
        title={editing ? 'Edit match' : 'Log a match'}
        description={`${tournament.name} · ${yourLeader?.name ?? 'Your leader'}`}
        backTo={`/tournaments/${tournament.id}`}
        backLabel="Back to event"
      />

      <div className="panel mb-3 flex items-center gap-3 p-3">
        <LeaderImage
          leader={yourLeader}
          className="h-16 w-11 shrink-0 rounded-lg"
          alt=""
        />
        <div className="min-w-0 flex-1">
          <p className="section-title">Your leader</p>
          <p className="truncate text-sm font-semibold text-mist-100">
            {yourLeader?.name ?? 'Unknown leader'}
          </p>
          <p className="text-[11px] text-mist-500">
            {yourLeader?.colors.join('/') ?? ''}
          </p>
        </div>
        {opponent ? (
          <>
            <span className="font-display text-lg text-mist-600">vs</span>
            <LeaderImage
              leader={opponent}
              className="h-16 w-11 shrink-0 rounded-lg"
              alt=""
            />
          </>
        ) : null}
      </div>

      <form
        onSubmit={handleSubmit}
        className="panel-raised animate-rise-in p-5 sm:p-6"
      >
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-[7rem_1fr]">
            <div>
              <label htmlFor="match-round" className="label">
                Round <span className="text-crimson-400">*</span>
              </label>
              <input
                id="match-round"
                type="number"
                min={1}
                max={999}
                inputMode="numeric"
                className="field text-center text-lg font-semibold tabular-nums"
                value={round || ''}
                onChange={(event) => {
                  setRound(Number(event.target.value));
                  setErrors((current) => ({ ...current, round: undefined }));
                }}
              />
              {errors.round ? (
                <p className="mt-1.5 text-xs text-crimson-300">{errors.round}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="opponent-name" className="label">
                Opponent name <span className="text-mist-600">(optional)</span>
              </label>
              <input
                id="opponent-name"
                className="field"
                value={opponentName}
                onChange={(event) => setOpponentName(event.target.value)}
                placeholder="Who did you play?"
              />
            </div>
          </div>

          <LeaderPicker
            label="Opponent’s leader"
            value={opponentLeaderId}
            onChange={(leaderId) => {
              setOpponentLeaderId(leaderId);
              setErrors((current) => ({ ...current, opponent: undefined }));
            }}
            error={errors.opponent}
          />

          <div>
            <div className="mb-2 flex items-center gap-2">
              <Dices className="size-4 text-gold-400/80" />
              <span className="section-title">Dice &amp; turn order</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <SegmentedControl
                label="Who won the dice?"
                value={diceWinner}
                onChange={handleDiceChange}
                error={errors.dice}
                options={[
                  { value: 'me', label: 'Me' },
                  { value: 'opponent', label: 'Opponent' },
                ]}
              />
              <SegmentedControl
                label="Who played first?"
                value={firstPlayer}
                onChange={handleFirstChange}
                error={errors.first}
                hint={
                  firstTouched
                    ? 'Set manually for this round.'
                    : 'Follows the dice winner until you change it.'
                }
                options={[
                  { value: 'me', label: 'Me' },
                  { value: 'opponent', label: 'Opponent' },
                ]}
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Flag className="size-4 text-gold-400/80" />
                <span className="section-title">Game score</span>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${resultToneClass(
                  previewResult,
                )}`}
              >
                {myGameWins === 0 && opponentGameWins === 0 ? (
                  'Enter games'
                ) : (
                  <>
                    <Check className="size-3" />
                    {resultLabel(previewResult)}
                  </>
                )}
              </span>
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
              {QUICK_SCORES.map((score) => {
                const active =
                  myGameWins === score.my &&
                  opponentGameWins === score.opponent;
                return (
                  <button
                    key={score.label}
                    type="button"
                    onClick={() => {
                      setMyGameWins(score.my);
                      setOpponentGameWins(score.opponent);
                    }}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? 'border-gold-400/50 bg-gold-400/12 text-gold-200'
                        : 'border-white/10 bg-white/[0.035] text-mist-400 hover:border-white/20 hover:text-mist-200'
                    }`}
                  >
                    {score.label}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ScoreStepper
                label="Your games"
                value={myGameWins}
                onChange={setMyGameWins}
                tone="you"
              />
              <ScoreStepper
                label="Opponent games"
                value={opponentGameWins}
                onChange={setOpponentGameWins}
                tone="opponent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="match-notes" className="label">
              Match notes
            </label>
            <textarea
              id="match-notes"
              className="field min-h-24 resize-y"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Misplay, tech choice, how the game felt…"
            />
          </div>
        </div>

        <div className="mt-7 flex flex-col-reverse gap-2 border-t border-white/[0.07] pt-5 sm:flex-row sm:justify-end">
          <Link to={`/tournaments/${tournament.id}`} className="btn-secondary">
            Cancel
          </Link>
          {!editing ? (
            <button
              type="submit"
              className="btn-secondary"
              onClick={() => {
                intentRef.current = 'another';
              }}
            >
              <Plus className="size-4" />
              Save &amp; add another
            </button>
          ) : null}
          <button
            type="submit"
            className="btn-primary"
            onClick={() => {
              intentRef.current = 'done';
            }}
          >
            {editing ? <Save className="size-4" /> : <Check className="size-4" />}
            {editing ? 'Save changes' : 'Save round'}
          </button>
        </div>
      </form>

      <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-mist-600">
        <UserRound className="size-3.5" />
        Tip: the first player follows the dice winner unless you change it.
      </div>
    </div>
  );
}
