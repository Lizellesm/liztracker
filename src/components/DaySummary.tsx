import { useLiveQuery } from 'dexie-react-hooks';
import {
  Activity,
  Droplet,
  FaceSlightlySmiling,
  Footprints,
  NotebookPen,
  Pencil,
  Pill,
  ThumbsDown,
  ThumbsUp,
  Utensils,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { DEFAULT_SETTINGS, getSettings } from '../db';
import { BRISTOL, EXERCISE, bristolTone } from '../constants';
import type { DayData } from '../history';
import { formatDay, formatLongDate, formatTime } from '../time';
import { FEELING, SLEEP, STRESS, WELLBEING } from './MoreAboutDay';
import { BLOAT_LABELS, CRAMP_LABELS } from './SymptomCards';

/** Read-only overview of one day, with a button to open it for editing. */
export default function DaySummary({ data, onEdit }: { data: DayData; onEdit: () => void }) {
  const settings = useLiveQuery(getSettings) ?? DEFAULT_SETTINGS;
  const { log } = data;

  const meds = settings.medications.filter((m) => log?.medsTaken?.includes(m.id));
  const checkIn = [
    log?.wellbeing !== undefined && `Body: ${WELLBEING[log.wellbeing].label}`,
    log?.feeling !== undefined && `Feeling: ${FEELING[log.feeling].label}`,
    log?.stress !== undefined && `Stress: ${STRESS[log.stress].label}`,
    log?.sleep !== undefined && `Sleep: ${SLEEP[log.sleep].label}`,
    log?.weightKg !== undefined && `${log.weightKg.toFixed(1)} kg`,
  ].filter(Boolean);
  const hasSymptoms = log?.cramps !== undefined || log?.bloating !== undefined;

  const empty =
    !log?.waterGlasses && !data.food.length && !data.exercise.length && !data.bowel.length && !hasSymptoms && !meds.length && !checkIn.length && !log?.note;

  return (
    <section className="card">
      <div className="summary-head">
        <div>
          <div className="card-title">{formatDay(data.day)}</div>
          <div className="muted small">{formatLongDate(data.day)}</div>
        </div>
        <button className="btn primary compact icon-label" onClick={onEdit}>
          <Pencil size={16} /> {empty ? 'Fill in' : 'Edit'}
        </button>
      </div>

      {empty && <p className="muted center">Nothing logged on this day.</p>}

      {!!log?.waterGlasses && (
        <Line Icon={Droplet} tone="water" title="Water">
          {log.waterGlasses}/{settings.waterGoal} glasses
        </Line>
      )}

      {data.food.length > 0 && (
        <Line Icon={Utensils} tone="food" title="Meals">
          <span className="chip-list">
            {data.food.map((f) => (
              <span key={f.id} className={`tag ${f.verdict ?? ''}`}>
                {f.verdict === 'safe' && <ThumbsUp size={13} />}
                {f.verdict === 'trigger' && <ThumbsDown size={13} />}
                {f.description || f.tags.join(', ')}
              </span>
            ))}
          </span>
        </Line>
      )}

      {data.exercise.length > 0 && (
        <Line Icon={Footprints} tone="exercise" title="Exercise">
          {data.exercise.map((e) => (
            <div key={e.id}>
              {EXERCISE.filter((c) => e.categories.includes(c.id))
                .map((c) => `${c.label}${e.minutes[c.id] ? ` ${e.minutes[c.id]}m` : ''}`)
                .join(' · ')}
            </div>
          ))}
        </Line>
      )}

      {data.bowel.length > 0 && (
        <Line Icon={Activity} tone="bowel" title="Bowel">
          {data.bowel.map((b) => (
            <div key={b.id} className="bowel-line">
              <span className="muted small">{formatTime(b.timestamp)}</span>
              <span className={`badge tone-${bristolTone(b.bristol)}`}>Type {b.bristol}</span>
              {BRISTOL[b.bristol - 1].short}
            </div>
          ))}
        </Line>
      )}

      {hasSymptoms && (
        <Line Icon={Zap} tone="cramps" title="Symptoms">
          Cramps: {CRAMP_LABELS[Math.min(log?.cramps ?? 0, CRAMP_LABELS.length - 1)]} · Bloating:{' '}
          {BLOAT_LABELS[log?.bloating ?? 0]}
        </Line>
      )}

      {meds.length > 0 && (
        <Line Icon={Pill} tone="meds" title="Supplements">
          {meds.map((m) => m.name).join(', ')} ✓
        </Line>
      )}

      {checkIn.length > 0 && (
        <Line Icon={FaceSlightlySmiling} tone="mood" title="Check-in">
          {checkIn.join(' · ')}
        </Line>
      )}

      {log?.note && (
        <Line Icon={NotebookPen} tone="brand" title="Notes">
          <span className="summary-notes">{log.note}</span>
        </Line>
      )}
    </section>
  );
}

function Line({ Icon, tone, title, children }: { Icon: LucideIcon; tone: string; title: string; children: ReactNode }) {
  return (
    <div className="summary-line">
      <span className={`bubble sm ${tone}`}>
        <Icon />
      </span>
      <div className="summary-line-body">
        <div className="summary-line-title">{title}</div>
        <div>{children}</div>
      </div>
    </div>
  );
}
