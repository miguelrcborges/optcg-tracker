import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  Compass,
  Database,
  Trophy,
  X,
} from 'lucide-react';
import { useData } from '../context/DataContext';

const NAV_ITEMS = [
  { to: '/', label: 'Tournaments', icon: Trophy, end: true },
  { to: '/stats', label: 'Stats', icon: BarChart3, end: false },
  { to: '/data', label: 'Data', icon: Database, end: false },
];

function navClass({ isActive }: { isActive: boolean }): string {
  return `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-white/[0.06] text-gold-300'
      : 'text-mist-400 hover:bg-white/[0.04] hover:text-mist-100'
  }`;
}

function mobileNavClass({ isActive }: { isActive: boolean }): string {
  return `relative flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] transition ${
    isActive ? 'text-gold-300' : 'text-mist-500'
  }`;
}

function StorageBanners() {
  const { storageWarning, saveError, dismissSaveError } = useData();
  const [warningDismissed, setWarningDismissed] = useState(false);

  if (!storageWarning && !saveError) return null;

  if (saveError) {
    return (
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-crimson-400/30 bg-crimson-950/60 px-4 py-3 text-sm text-crimson-100">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <p className="flex-1 leading-snug">{saveError}</p>
        <button
          type="button"
          onClick={dismissSaveError}
          className="rounded p-0.5 opacity-70 hover:opacity-100"
          aria-label="Dismiss storage warning"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  if (!storageWarning || warningDismissed) return null;

  return (
    <div className="mb-5 flex items-start gap-3 rounded-xl border border-gold-400/25 bg-gold-400/[0.07] px-4 py-3 text-sm text-gold-200">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <p className="flex-1 leading-snug">{storageWarning}</p>
      <button
        type="button"
        onClick={() => setWarningDismissed(true)}
        className="rounded p-0.5 opacity-70 hover:opacity-100"
        aria-label="Dismiss storage warning"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

export function Layout() {
  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only z-[100] rounded-lg bg-gold-400 px-4 py-2 text-sm font-bold text-ink-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-3"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="group flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl border border-gold-400/25 bg-gold-400/10 text-gold-300 transition group-hover:border-gold-400/45 group-hover:bg-gold-400/15">
              <Compass className="size-5" />
            </span>
            <span className="leading-none">
              <span className="block font-display text-xl tracking-wide text-mist-100">
                Grand Line Ledger
              </span>
              <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.22em] text-mist-500">
                One Piece TCG · Match Log
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
                <item.icon className="size-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main
        id="main"
        className="mx-auto w-full max-w-6xl px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 sm:pb-16 sm:pt-8"
      >
        <StorageBanners />
        <Outlet />
      </main>

      <footer className="mx-auto hidden max-w-6xl px-6 pb-8 text-[11px] text-mist-600 sm:block">
        Grand Line Ledger · Local-first, no account. Back up from the Data tab.
      </footer>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.07] bg-ink-950/90 backdrop-blur-xl sm:hidden"
        aria-label="Main"
      >
        <div className="mx-auto flex max-w-md px-2 pb-safe">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={mobileNavClass}
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`absolute top-0 h-0.5 w-8 rounded-full transition ${
                      isActive ? 'bg-gold-400' : 'bg-transparent'
                    }`}
                  />
                  <item.icon className="size-5" />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
