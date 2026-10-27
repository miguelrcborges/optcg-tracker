import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import {
  Database,
  Download,
  HardDrive,
  Info,
  ShieldCheck,
  Smartphone,
  Trash2,
  Upload,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import {
  downloadBackup,
  formatBytes,
  parseBackup,
  storageFootprint,
  type ParsedBackup,
} from '../lib/storage';
import { formatTimestamp } from '../lib/dates';
import { BUNDLED_LEADERS } from '../lib/leaders';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Modal } from '../components/Modal';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function DataPage() {
  const { data, replaceData, clearData } = useData();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<ParsedBackup | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(
    typeof window !== 'undefined' &&
      window.matchMedia('(display-mode: standalone)').matches,
  );

  const footprint = useMemo(() => storageFootprint(data), [data]);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = parseBackup(text);
      setPendingImport(parsed);
      setImportError(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not read that file.';
      setImportError(message);
      toast(message, 'error');
    } finally {
      event.target.value = '';
    }
  }

  async function installApp() {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === 'accepted') {
      setInstalled(true);
    }
    setInstallEvent(null);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Your ledger"
        title="Data"
        description="Everything is stored in this browser. Export a JSON backup before clearing data or switching devices."
      />

      <section className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <StatCard value={data.tournaments.length} label="Tournaments" />
        <StatCard value={data.matches.length} label="Rounds" />
        <StatCard
          value={data.customLeaders.length}
          label="Custom leaders"
          hint={`${BUNDLED_LEADERS.length} bundled`}
        />
        <StatCard
          value={formatBytes(footprint)}
          label="Storage used"
          hint="Approximate"
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-5 animate-rise-in">
          <div className="flex size-10 items-center justify-center rounded-xl border border-gold-400/20 bg-gold-400/10 text-gold-300">
            <Download className="size-5" />
          </div>
          <h2 className="mt-4 font-display text-2xl text-mist-100">Export backup</h2>
          <p className="mt-1 text-sm leading-relaxed text-mist-400">
            Download every tournament, round, note, and custom leader as a
            single JSON file.
          </p>
          <button
            type="button"
            className="btn-primary mt-5"
            onClick={() => {
              downloadBackup(data);
              toast('Backup downloaded.');
            }}
          >
            <Download className="size-4" />
            Download JSON
          </button>
        </section>

        <section className="panel p-5 animate-rise-in">
          <div className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-mist-200">
            <Upload className="size-5" />
          </div>
          <h2 className="mt-4 font-display text-2xl text-mist-100">Import backup</h2>
          <p className="mt-1 text-sm leading-relaxed text-mist-400">
            Load a Grand Line Ledger backup. Importing replaces everything
            currently in this browser, so export first if you need a copy.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={handleFile}
          />
          <button
            type="button"
            className="btn-secondary mt-5"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="size-4" />
            Choose JSON file
          </button>
          {importError ? (
            <p className="mt-3 rounded-lg border border-crimson-400/30 bg-crimson-500/10 px-3 py-2 text-xs leading-relaxed text-crimson-200">
              {importError}
            </p>
          ) : null}
        </section>
      </div>

      <section className="panel mt-4 p-5">
        <div className="flex items-start gap-3">
          <Smartphone className="mt-0.5 size-5 shrink-0 text-gold-400/80" />
          <div className="flex-1">
            <h2 className="font-display text-2xl text-mist-100">Install on your phone</h2>
            <p className="mt-1 text-sm leading-relaxed text-mist-400">
              This app is a PWA. Install it for a home-screen icon, offline app
              shell, and cached leader art. On iPhone use Safari’s Share menu →
              Add to Home Screen. On Android use Chrome’s menu → Install app.
            </p>
            {installed ? (
              <span className="chip mt-3 border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                <ShieldCheck className="size-3.5" />
                Running as an installed app
              </span>
            ) : installEvent ? (
              <button
                type="button"
                className="btn-secondary mt-4"
                onClick={installApp}
              >
                <Smartphone className="size-4" />
                Install app
              </button>
            ) : (
              <p className="mt-3 text-[11px] text-mist-500">
                Or keep using it in the browser — data is saved either way.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="panel mt-4 p-5">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 size-5 shrink-0 text-mist-400" />
          <div>
            <h2 className="font-display text-2xl text-mist-100">About this ledger</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-mist-400">
              Grand Line Ledger stores data only in this browser using local
              storage. There is no account and no cloud sync. If you clear site
              data or switch phones, restore from a JSON backup.
            </p>
            <dl className="mt-4 grid gap-2 text-[11px] text-mist-500 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <Database className="size-3.5" />
                <dt className="sr-only">Format</dt>
                <dd>Backup format v1</dd>
              </div>
              <div className="flex items-center gap-2">
                <HardDrive className="size-3.5" />
                <dt className="sr-only">Storage</dt>
                <dd>{formatBytes(footprint)} in localStorage</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-crimson-400/20 bg-crimson-950/25 p-5">
        <h2 className="flex items-center gap-2 font-display text-2xl text-crimson-200">
          <Trash2 className="size-4" />
          Danger zone
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-mist-400">
          Clear every tournament, round, and custom leader from this browser.
          This cannot be undone without a backup.
        </p>
        <button
          type="button"
          className="btn-danger mt-4"
          onClick={() => setClearOpen(true)}
          disabled={
            data.tournaments.length === 0 &&
            data.matches.length === 0 &&
            data.customLeaders.length === 0
          }
        >
          <Trash2 className="size-4" />
          Clear all data
        </button>
      </section>

      <Modal
        open={Boolean(pendingImport)}
        onClose={() => setPendingImport(null)}
        title="Import this backup?"
        description="Review the contents before replacing your current ledger."
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setPendingImport(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                if (!pendingImport) return;
                replaceData(pendingImport.data);
                setPendingImport(null);
                toast('Backup imported.');
              }}
            >
              <Upload className="size-4" />
              Replace &amp; import
            </button>
          </div>
        }
      >
        {pendingImport ? (
          <div className="space-y-4">
            <dl className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 text-center">
                <dd className="font-display text-2xl text-mist-100">
                  {pendingImport.data.tournaments.length}
                </dd>
                <dt className="mt-1 text-[10px] uppercase tracking-[0.1em] text-mist-500">
                  Events
                </dt>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 text-center">
                <dd className="font-display text-2xl text-mist-100">
                  {pendingImport.data.matches.length}
                </dd>
                <dt className="mt-1 text-[10px] uppercase tracking-[0.1em] text-mist-500">
                  Rounds
                </dt>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 text-center">
                <dd className="font-display text-2xl text-mist-100">
                  {pendingImport.data.customLeaders.length}
                </dd>
                <dt className="mt-1 text-[10px] uppercase tracking-[0.1em] text-mist-500">
                  Custom
                </dt>
              </div>
            </dl>
            {pendingImport.exportedAt ? (
              <p className="text-xs text-mist-500">
                Exported {formatTimestamp(pendingImport.exportedAt)}
              </p>
            ) : null}
            <p className="rounded-xl border border-gold-400/20 bg-gold-400/[0.06] px-3 py-2.5 text-xs leading-relaxed text-gold-200/90">
              Your current {data.tournaments.length} event
              {data.tournaments.length === 1 ? '' : 's'} and{' '}
              {data.matches.length} round{data.matches.length === 1 ? '' : 's'}{' '}
              will be replaced.
            </p>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={clearOpen}
        title="Clear all data?"
        description="Every tournament, match, note, and custom leader in this browser will be deleted. Download a backup first if you are not sure."
        confirmLabel="Clear everything"
        onClose={() => setClearOpen(false)}
        onConfirm={() => {
          clearData();
          toast('All data cleared.');
        }}
      />
    </div>
  );
}
