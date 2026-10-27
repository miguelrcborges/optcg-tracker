import type { AppData } from '../types';
import { EMPTY_DATA } from '../types';
import { appDataSchema, backupEnvelopeSchema } from './schemas';

export const STORAGE_KEY = 'grand-line-ledger:data:v1';

export interface LoadResult {
  data: AppData;
  warning: string | null;
}

function emptyData(): AppData {
  return {
    version: 1,
    tournaments: [],
    matches: [],
    customLeaders: [],
  };
}

export function loadData(): LoadResult {
  if (typeof localStorage === 'undefined') {
    return { data: emptyData(), warning: null };
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { data: emptyData(), warning: null };
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    const result = appDataSchema.safeParse(parsed);
    if (result.success) {
      return { data: result.data, warning: null };
    }
    return {
      data: emptyData(),
      warning:
        'Your saved data could not be read because it does not match the expected format. Nothing was deleted.',
    };
  } catch {
    return {
      data: emptyData(),
      warning:
        'Your saved data could not be read. Nothing was deleted, but the app started with an empty ledger.',
    };
  }
}

export function saveData(data: AppData): string | null {
  if (typeof localStorage === 'undefined') return null;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return null;
  } catch {
    return 'Could not save to this browser’s storage. It may be full or blocked.';
  }
}

export function exportBackup(data: AppData): string {
  return JSON.stringify(
    {
      app: 'grand-line-ledger',
      version: 1,
      exportedAt: new Date().toISOString(),
      data,
    },
    null,
    2,
  );
}

export interface ParsedBackup {
  data: AppData;
  exportedAt: string | null;
}

export function parseBackup(text: string): ParsedBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }

  const envelope = backupEnvelopeSchema.safeParse(parsed);
  if (envelope.success) {
    return {
      data: envelope.data.data,
      exportedAt: envelope.data.exportedAt,
    };
  }

  const direct = appDataSchema.safeParse(parsed);
  if (direct.success) {
    return { data: direct.data, exportedAt: null };
  }

  const issue = direct.error.issues[0];
  const location = issue?.path.join('.') || 'data';
  throw new Error(
    `That file is not a Grand Line Ledger backup${
      issue ? ` (${location}: ${issue.message})` : ''
    }.`,
  );
}

export function downloadBackup(data: AppData): void {
  const blob = new Blob([exportBackup(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  anchor.href = url;
  anchor.download = `grand-line-ledger-${date}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function storageFootprint(data: AppData): number {
  try {
    return new Blob([JSON.stringify(data)]).size;
  } catch {
    return 0;
  }
}

export { EMPTY_DATA };
