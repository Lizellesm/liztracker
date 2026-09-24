import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { DatabaseBackup, Download, Share2, ShieldCheck, TriangleAlert, Upload } from 'lucide-react';
import { DEFAULT_SETTINGS, getSettings } from '../db';
import { canShareFiles, downloadBackup, readBackup, restoreBackup, shareBackup, summarise } from '../backup';
import { IconBubble } from '../ui';

const WEEK = 7 * 24 * 60 * 60 * 1000;

function ago(ts: number) {
  const days = Math.floor((Date.now() - ts) / (24 * 60 * 60 * 1000));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

export default function BackupCard() {
  const settings = useLiveQuery(getSettings) ?? DEFAULT_SETTINGS;
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ tone: 'good' | 'bad'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const last = settings.lastBackupAt;
  const overdue = !last || Date.now() - last > WEEK;

  const run = async (action: () => Promise<string | null>) => {
    setBusy(true);
    setMessage(null);
    try {
      const text = await action();
      if (text) setMessage({ tone: 'good', text });
    } catch (e) {
      setMessage({ tone: 'bad', text: (e as Error).message || 'Something went wrong.' });
    } finally {
      setBusy(false);
    }
  };

  const restore = (file: File) =>
    run(async () => {
      const backup = await readBackup(file);
      const when = new Date(backup.exportedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
      const ok = confirm(
        `Restore the backup from ${when}?\n\nIt contains ${summarise(backup)}.\n\nThis REPLACES everything currently in the app.`,
      );
      if (!ok) return null;
      await restoreBackup(backup);
      return `Restored: ${summarise(backup)}.`;
    });

  return (
    <section className="card">
      <div className="card-head">
        <IconBubble Icon={DatabaseBackup} tone="brand" />
        <span className="card-title">Backup</span>
      </div>

      <div className={`backup-status ${overdue ? 'warn' : 'ok'}`}>
        {overdue ? <TriangleAlert size={20} /> : <ShieldCheck size={20} />}
        <span>
          {last ? `Last backup ${ago(last)}` : 'Not backed up yet'}
          <small>
            {overdue
              ? 'Your data only lives on this phone. Back up weekly and keep the file in Google Drive.'
              : 'Nice. Keep the file somewhere off the phone, like Google Drive.'}
          </small>
        </span>
      </div>

      {canShareFiles() && (
        <button type="button" className="btn primary icon-label" disabled={busy} onClick={() => run(async () => ((await shareBackup()) ? 'Backup shared.' : null))}>
          <Share2 size={18} /> Share backup (Drive, email…)
        </button>
      )}
      <button
        type="button"
        className="btn outline icon-label"
        disabled={busy}
        onClick={() => run(async () => (await downloadBackup(), 'Backup saved to your Downloads folder.'))}
      >
        <Download size={18} /> Save backup file
      </button>
      <button type="button" className="btn outline icon-label" disabled={busy} onClick={() => fileInput.current?.click()}>
        <Upload size={18} /> Restore from backup…
      </button>
      <input
        ref={fileInput}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ''; // allow picking the same file again
          if (file) restore(file);
        }}
      />

      {message && <p className={`backup-message ${message.tone}`}>{message.text}</p>}
    </section>
  );
}
