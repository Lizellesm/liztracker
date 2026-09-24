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

// Android Chrome only shares allow-listed file types and refuses .json with "Permission denied",
// so shared backups go out as .txt (same JSON content). Restore accepts either.
function backupFile(backup: Backup, as: 'json' | 'txt' = 'json') {
  const date = backup.exportedAt.slice(0, 10);
  const type = as === 'json' ? 'application/json' : 'text/plain';
  return new File([JSON.stringify(backup)], `liztracker-backup-${date}.${as}`, { type });
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
    return !!navigator.canShare?.({ files: [new File(['{}'], 'test.txt', { type: 'text/plain' })] });
  } catch {
    return false;
  }
}

/**
 * Opens the phone's share menu (Google Drive, email, WhatsApp…).
 * Returns 'shared', 'cancelled', or 'downloaded' when sharing was refused and it saved to Downloads instead.
 */
export async function shareBackup(): Promise<'shared' | 'cancelled' | 'downloaded'> {
  const file = backupFile(await createBackup(), 'txt');
  try {
    await navigator.share({ files: [file], title: 'LizTracker backup' });
  } catch (e) {
    if ((e as DOMException).name === 'AbortError') return 'cancelled';
    await downloadBackup();
    return 'downloaded';
  }
  await updateSettings({ lastBackupAt: Date.now() });
  return 'shared';
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
