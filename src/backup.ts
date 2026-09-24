import { db, updateSettings } from './db';

const TABLES = ['bowel', 'food', 'exercise', 'days', 'settings'] as const;
type TableName = (typeof TABLES)[number];

export interface Backup {
  app: 'liztracker';
  version: 1;
  exportedAt: string;
  data: Record<TableName, unknown[]>;
}

export async function createBackup(): Promise<Backup> {
  const data = {} as Backup['data'];
  for (const t of TABLES) data[t] = await db.table(t).toArray();
  return { app: 'liztracker', version: 1, exportedAt: new Date().toISOString(), data };
}

function backupFile(backup: Backup) {
  const date = backup.exportedAt.slice(0, 10);
  return new File([JSON.stringify(backup)], `liztracker-backup-${date}.json`, { type: 'application/json' });
}

/** Downloads the backup file (lands in the phone's Downloads folder). */
export async function downloadBackup() {
  const file = backupFile(await createBackup());
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  await updateSettings({ lastBackupAt: Date.now() });
}

export function canShareFiles() {
  try {
    return !!navigator.canShare?.({ files: [new File(['{}'], 'test.json', { type: 'application/json' })] });
  } catch {
    return false;
  }
}

/** Opens the phone's share menu (Google Drive, email, WhatsApp…). Returns false if cancelled. */
export async function shareBackup() {
  const file = backupFile(await createBackup());
  try {
    await navigator.share({ files: [file], title: 'LizTracker backup' });
  } catch (e) {
    if ((e as DOMException).name === 'AbortError') return false;
    throw e;
  }
  await updateSettings({ lastBackupAt: Date.now() });
  return true;
}

/** Parses and checks a backup file; throws a readable error if it isn't one. */
export async function readBackup(file: File): Promise<Backup> {
  let parsed: Backup;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error("That file isn't a LizTracker backup (it couldn't be read).");
  }
  if (parsed?.app !== 'liztracker' || typeof parsed.data !== 'object') {
    throw new Error("That file isn't a LizTracker backup.");
  }
  for (const t of TABLES) {
    if (parsed.data[t] !== undefined && !Array.isArray(parsed.data[t])) throw new Error('The backup file is damaged.');
  }
  return parsed;
}

export function summarise(backup: Backup) {
  const n = (t: TableName) => backup.data[t]?.length ?? 0;
  return `${n('food')} food, ${n('exercise')} exercise and ${n('bowel')} bowel entries across ${n('days')} days`;
}

/** Replaces everything in the app with the backup's contents, all-or-nothing. */
export async function restoreBackup(backup: Backup) {
  await db.transaction('rw', TABLES.map((t) => db.table(t)), async () => {
    for (const t of TABLES) {
      await db.table(t).clear();
      const rows = backup.data[t] ?? [];
      if (rows.length) await db.table(t).bulkAdd(rows);
    }
  });
  // The restored file is itself a backup from that moment.
  await updateSettings({ lastBackupAt: new Date(backup.exportedAt).getTime() });
}
