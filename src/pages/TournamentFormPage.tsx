import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, Plus } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { todayISO } from '../lib/dates';
import { EmptyState } from '../components/EmptyState';
import { LeaderPicker } from '../components/LeaderPicker';
import { PageHeader } from '../components/PageHeader';

const FORMAT_SUGGESTIONS = [
  'Locals',
  'Store Championship',
  'Regional',
  'Flagship',
  'Extra Grand Battle',
  'Pirate Party',
  'Online',
];

export function TournamentFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, addTournament, updateTournament } = useData();
  const { toast } = useToast();

  const existing = id
    ? data.tournaments.find((tournament) => tournament.id === id)
    : undefined;
  const editing = Boolean(id);

  const [name, setName] = useState(existing?.name ?? '');
  const [date, setDate] = useState(existing?.date ?? todayISO());
  const [format, setFormat] = useState(existing?.format ?? '');
  const [location, setLocation] = useState(existing?.location ?? '');
  const [leaderId, setLeaderId] = useState<string | null>(
    existing?.leaderId ?? null,
  );
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [errors, setErrors] = useState<{
    name?: string;
    date?: string;
    leader?: string;
  }>({});

  if (editing && !existing) {
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

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = 'Give this event a name.';
    if (!date) nextErrors.date = 'Pick the event date.';
    if (!leaderId) nextErrors.leader = 'Choose the leader you played.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !leaderId) return;

    const input = {
      name: name.trim(),
      date,
      format: format.trim() || undefined,
      location: location.trim() || undefined,
      leaderId,
      notes: notes.trim() || undefined,
    };

    if (editing && existing) {
      updateTournament(existing.id, input);
      toast('Event updated.');
      navigate(`/tournaments/${existing.id}`);
    } else {
      const tournament = addTournament(input);
      toast('Tournament created. Good luck!');
      navigate(`/tournaments/${tournament.id}`);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow={editing ? 'Edit event' : 'New event'}
        title={editing ? 'Edit tournament' : 'Set the stage'}
        description={
          editing
            ? 'Update the event details. Match records are kept exactly as logged.'
            : 'Name the event, pick your leader, and start logging rounds.'
        }
        backTo={editing && existing ? `/tournaments/${existing.id}` : '/'}
        backLabel={editing ? 'Back to event' : 'Back to tournaments'}
      />

      <form onSubmit={handleSubmit} className="panel-raised animate-rise-in p-5 sm:p-6">
        <div className="space-y-5">
          <div>
            <label htmlFor="event-name" className="label">
              Event name <span className="text-crimson-400">*</span>
            </label>
            <input
              id="event-name"
              className="field"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Friday Night Locals"
              autoFocus
            />
            {errors.name ? (
              <p className="mt-1.5 text-xs text-crimson-300">{errors.name}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="event-date" className="label">
                Date <span className="text-crimson-400">*</span>
              </label>
              <input
                id="event-date"
                type="date"
                className="field"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
              {errors.date ? (
                <p className="mt-1.5 text-xs text-crimson-300">{errors.date}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="event-format" className="label">
                Format
              </label>
              <input
                id="event-format"
                className="field"
                list="event-format-options"
                value={format}
                onChange={(event) => setFormat(event.target.value)}
                placeholder="Locals, Regional, Online…"
              />
              <datalist id="event-format-options">
                {FORMAT_SUGGESTIONS.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label htmlFor="event-location" className="label">
              Location
            </label>
            <input
              id="event-location"
              className="field"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Local game store, city, or online"
            />
          </div>

          <LeaderPicker
            label="Your leader"
            value={leaderId}
            onChange={setLeaderId}
            error={errors.leader}
            hint={
              editing
                ? 'Changing this updates the leader shown for every round in this event.'
                : 'This leader applies to the whole tournament.'
            }
          />

          <div>
            <label htmlFor="event-notes" className="label">
              Event notes
            </label>
            <textarea
              id="event-notes"
              className="field min-h-24 resize-y"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Deck tech, venue, goals, anything worth remembering…"
            />
          </div>
        </div>

        <div className="mt-7 flex flex-col-reverse gap-2 border-t border-white/[0.07] pt-5 sm:flex-row sm:justify-end">
          <Link
            to={editing && existing ? `/tournaments/${existing.id}` : '/'}
            className="btn-secondary"
          >
            Cancel
          </Link>
          <button type="submit" className="btn-primary">
            {editing ? <Check className="size-4" /> : <Plus className="size-4" />}
            {editing ? 'Save changes' : 'Create tournament'}
          </button>
        </div>
      </form>
    </div>
  );
}
