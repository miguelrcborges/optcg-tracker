import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronRight, Plus, Search, Sparkles } from 'lucide-react';
import type { LeaderColor } from '../types';
import { LEADER_COLORS } from '../types';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import {
  COLOR_HEX,
  collectRecentLeaderIds,
  leaderMatchesQuery,
} from '../lib/leaders';
import { LeaderImage, LeaderMeta } from './LeaderImage';
import { Modal } from './Modal';

interface LeaderPickerProps {
  label: string;
  value: string | null;
  onChange: (leaderId: string) => void;
  error?: string;
  excludeId?: string;
  hint?: string;
}

type ColorFilter = LeaderColor | 'All';

function LeaderOption({
  leaderId,
  selected,
  onSelect,
}: {
  leaderId: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const { leaderMap } = useData();
  const leader = leaderMap.get(leaderId);

  if (!leader) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.02] p-2 text-left">
        <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded-md bg-ink-800 text-[10px] text-mist-500">
          ?
        </div>
        <div className="min-w-0 text-xs text-mist-500">Unknown leader</div>
      </div>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`group flex items-center gap-2.5 rounded-xl border p-2 text-left transition ${
        selected
          ? 'border-gold-400/60 bg-gold-400/10'
          : 'border-white/[0.08] bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.055]'
      }`}
    >
      <LeaderImage
        leader={leader}
        className="h-14 w-10 shrink-0 rounded-md"
        alt=""
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-mist-100">
          {leader.name}
        </span>
        <span className="mt-1 block">
          <LeaderMeta leader={leader} />
        </span>
      </span>
      {selected ? (
        <Check className="size-4 shrink-0 text-gold-300" />
      ) : (
        <ChevronRight className="size-3.5 shrink-0 text-mist-600 transition group-hover:text-mist-400" />
      )}
    </button>
  );
}

export function LeaderPicker({
  label,
  value,
  onChange,
  error,
  excludeId,
  hint,
}: LeaderPickerProps) {
  const { leaders, leaderMap, data, addCustomLeader } = useData();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [colorFilter, setColorFilter] = useState<ColorFilter>('All');
  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customColors, setCustomColors] = useState<LeaderColor[]>(['Red']);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = value ? leaderMap.get(value) : null;

  const filtered = useMemo(
    () =>
      leaders.filter(
        (leader) =>
          leader.id !== excludeId &&
          (colorFilter === 'All' || leader.colors.includes(colorFilter)) &&
          leaderMatchesQuery(leader, query),
      ),
    [leaders, excludeId, colorFilter, query],
  );

  const recentIds = useMemo(
    () =>
      collectRecentLeaderIds(data.tournaments, data.matches, 6).filter(
        (id) => id !== excludeId && leaderMap.has(id),
      ),
    [data.tournaments, data.matches, excludeId, leaderMap],
  );

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => searchRef.current?.focus(), 90);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setColorFilter('All');
      setCustomOpen(false);
      setCustomName('');
      setCustomColors(['Red']);
    }
  }, [open]);

  function close() {
    setOpen(false);
  }

  function select(leaderId: string) {
    onChange(leaderId);
    close();
  }

  function startCustom() {
    setCustomName(query.trim());
    setCustomColors(['Red']);
    setCustomOpen(true);
  }

  function saveCustom() {
    if (!customName.trim()) return;
    const leader = addCustomLeader(customName, customColors);
    toast(`Added ${leader.name} to your custom leaders.`);
    select(leader.id);
  }

  function toggleCustomColor(color: LeaderColor) {
    setCustomColors((current) =>
      current.includes(color)
        ? current.length > 1
          ? current.filter((item) => item !== color)
          : current
        : [...current, color],
    );
  }

  return (
    <div>
      <span className="label">{label}</span>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition ${
          error
            ? 'border-crimson-400/50 bg-crimson-500/[0.06]'
            : 'border-white/10 bg-ink-850/80 hover:border-white/20 hover:bg-ink-800/80'
        }`}
      >
        {selected ? (
          <LeaderImage
            leader={selected}
            className="h-16 w-11 shrink-0 rounded-lg"
            alt=""
          />
        ) : (
          <span className="flex h-16 w-11 shrink-0 items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.02] text-mist-500">
            <Search className="size-4" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          {selected ? (
            <>
              <span className="block truncate text-sm font-semibold text-mist-100">
                {selected.name}
              </span>
              <span className="mt-1 block">
                <LeaderMeta leader={selected} />
              </span>
            </>
          ) : (
            <>
              <span className="block text-sm font-medium text-mist-300">
                Choose a leader
              </span>
              <span className="mt-0.5 block text-[11px] text-mist-500">
                Search the full leader list
              </span>
            </>
          )}
        </span>
        <ChevronRight className="size-4 shrink-0 text-mist-500" />
      </button>
      {error ? (
        <p className="mt-1.5 text-xs text-crimson-300">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[11px] text-mist-500">{hint}</p>
      ) : null}

      <Modal
        open={open}
        onClose={close}
        title={customOpen ? 'Add a custom leader' : label}
        description={
          customOpen
            ? 'Use this if a leader is missing from the bundled list.'
            : 'Search by name, set code, or color.'
        }
        size="lg"
        footer={
          customOpen ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setCustomOpen(false)}
              >
                Back to list
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={saveCustom}
                disabled={!customName.trim()}
              >
                Add & select
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn-ghost w-full justify-center text-mist-400"
              onClick={startCustom}
            >
              <Plus className="size-4" />
              Can’t find a leader? Add a custom one
            </button>
          )
        }
      >
        {customOpen ? (
          <div className="space-y-5">
            <div>
              <label htmlFor="custom-leader-name" className="label">
                Leader name
              </label>
              <input
                id="custom-leader-name"
                className="field"
                value={customName}
                onChange={(event) => setCustomName(event.target.value)}
                placeholder="e.g. Monkey D. Luffy"
                autoFocus
              />
            </div>
            <div>
              <span className="label">Colors</span>
              <div className="flex flex-wrap gap-2">
                {LEADER_COLORS.map((color) => {
                  const active = customColors.includes(color);
                  return (
                    <button
                      key={color}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleCustomColor(color)}
                      className={`chip transition ${
                        active
                          ? 'border-gold-400/50 bg-gold-400/10 text-gold-200'
                          : 'hover:border-white/20 hover:text-mist-200'
                      }`}
                    >
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: COLOR_HEX[color] }}
                      />
                      {color}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-mist-500">
                Pick at least one color. Multi-color leaders are supported.
              </p>
            </div>
            <div className="flex items-start gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-[11px] leading-relaxed text-mist-500">
              <Sparkles className="mt-0.5 size-3.5 shrink-0 text-gold-400/80" />
              Custom leaders are stored with your ledger and included in JSON
              backups.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-mist-500" />
              <input
                ref={searchRef}
                className="field pl-10"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search leaders…"
                aria-label="Search leaders"
              />
            </div>

            <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {(['All', ...LEADER_COLORS] as ColorFilter[]).map((color) => {
                const active = colorFilter === color;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setColorFilter(color)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                      active
                        ? 'border-gold-400/50 bg-gold-400/10 text-gold-200'
                        : 'border-white/10 bg-white/[0.03] text-mist-400 hover:border-white/20 hover:text-mist-200'
                    }`}
                  >
                    {color === 'All' ? (
                      'All colors'
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: COLOR_HEX[color] }}
                        />
                        {color}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {!query && recentIds.length > 0 ? (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="section-title">Recent</span>
                  <span className="text-[10px] text-mist-600">
                    {recentIds.length} leader{recentIds.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {recentIds.map((id) => (
                    <LeaderOption
                      key={`recent-${id}`}
                      leaderId={id}
                      selected={id === value}
                      onSelect={() => select(id)}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="section-title">
                  {query || colorFilter !== 'All' ? 'Results' : 'All leaders'}
                </span>
                <span className="text-[10px] text-mist-600">
                  {filtered.length} leader{filtered.length === 1 ? '' : 's'}
                </span>
              </div>

              {filtered.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {filtered.map((leader) => (
                    <LeaderOption
                      key={leader.id}
                      leaderId={leader.id}
                      selected={leader.id === value}
                      onSelect={() => select(leader.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center">
                  <p className="text-sm font-medium text-mist-300">
                    No leaders match “{query}”
                  </p>
                  <p className="mt-1 text-xs text-mist-500">
                    Try a different name or add it as a custom leader.
                  </p>
                  <button
                    type="button"
                    className="btn-secondary mt-4"
                    onClick={startCustom}
                  >
                    <Plus className="size-4" />
                    Add custom leader
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
