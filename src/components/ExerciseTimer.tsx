import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Pause, Play, SkipBack, SkipForward, X } from 'lucide-react';
import { beep, say, stepName, type TimerStep } from '../timer';

type Phase = 'ready' | 'work' | 'rest' | 'done';

const READY_SECONDS = 5;

/**
 * Full-screen guided timer: a get-ready countdown, then each step with a rest in between.
 * Beeps on the last 3 seconds and at each change, and can say the next exercise, so the
 * phone can stay on the floor. Calls `onClose` with the exercises that were finished.
 */
export default function ExerciseTimer({
  steps,
  restSeconds,
  speak,
  onClose,
}: {
  steps: TimerStep[];
  restSeconds: number;
  speak: boolean;
  onClose: (finished: string[]) => void;
}) {
  const [phase, setPhase] = useState<Phase>('ready');
  const [index, setIndex] = useState(0);
  const [endsAt, setEndsAt] = useState<number | null>(() => Date.now() + READY_SECONDS * 1000);
  const [pausedLeft, setPausedLeft] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const finished = useRef<string[]>([]);
  const lastTick = useRef<number | null>(null);

  const talk = (text: string) => speak && say(text);
  const restBefore = (i: number) => Math.min(restSeconds, steps[i].rest ?? restSeconds);
  const step = steps[index];
  const remaining = pausedLeft ?? (endsAt === null ? null : Math.max(0, endsAt - now));
  const total = phase === 'ready' ? READY_SECONDS : phase === 'rest' ? restBefore(index) : (step?.seconds ?? 0);

  const enter = (next: Phase, i: number) => {
    const s = steps[i];
    setPhase(next);
    setIndex(i);
    setPausedLeft(null);
    lastTick.current = null;
    if (next === 'work') {
      setEndsAt(s.seconds ? Date.now() + s.seconds * 1000 : null);
      beep('go');
      if (!s.seconds) talk(`${stepName(s)}. Tap done when finished.`);
      else if (phase === 'work') talk(s.label ?? s.exercise.name); // no rest before it, e.g. jog → walk
    } else if (next === 'rest') {
      setEndsAt(Date.now() + restBefore(i) * 1000);
      beep('rest');
      const prev = steps[i - 1];
      talk(prev && prev.exercise.id === s.exercise.id && s.label ? `Rest. Next: ${s.label}` : `Rest. Next: ${stepName(s)}`);
    } else if (next === 'done') {
      setEndsAt(null);
      beep('done');
      talk('Well done! All finished.');
    }
  };

  const goNext = (completed: boolean) => {
    if (phase === 'work' && completed && step.last && !finished.current.includes(step.exercise.name)) {
      finished.current = [...finished.current, step.exercise.name];
    }
    if (phase === 'ready' || phase === 'rest') return enter('work', index);
    if (index === steps.length - 1) return enter('done', index);
    enter(restBefore(index + 1) > 0 ? 'rest' : 'work', index + 1);
  };

  const goBack = () => enter('work', phase === 'work' ? Math.max(0, index - 1) : index);

  const togglePause = () => {
    if (pausedLeft !== null) {
      setEndsAt(Date.now() + pausedLeft);
      setPausedLeft(null);
    } else if (remaining !== null) {
      setPausedLeft(remaining);
    }
  };

  // Announce the first exercise; keep the screen on while the timer is open.
  useEffect(() => {
    talk(`Get ready. ${stepName(steps[0])}`);
    let lock: WakeLockSentinel | undefined;
    const keepAwake = async () => {
      try {
        lock = await navigator.wakeLock?.request('screen');
      } catch {
        // Not supported or not allowed: the timer still works while the screen is on.
      }
    };
    void keepAwake();
    const onVisible = () => document.visibilityState === 'visible' && void keepAwake();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      void lock?.release();
      speechSynthesis?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  // Countdown beeps and moving on when time is up.
  useEffect(() => {
    if (remaining === null || pausedLeft !== null || phase === 'done') return;
    const secs = Math.ceil(remaining / 1000);
    if (remaining <= 0) goNext(true);
    else if (secs <= 3 && secs !== lastTick.current) {
      lastTick.current = secs;
      beep('tick');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);

  const shown = phase === 'rest' || phase === 'ready' ? steps[index] : step;
  const upNext = phase === 'work' ? steps[index + 1] : steps[index + 1];
  const pct = remaining !== null && total ? remaining / (total * 1000) : 1;
  const r = 110;
  const c = 2 * Math.PI * r;

  return createPortal(
    <div className={`timer-screen ${phase}`}>
      <header className="timer-top">
        <button type="button" className="icon-btn" onClick={() => onClose(finished.current)} aria-label="Stop timer">
          <X size={22} />
        </button>
        <span className="timer-count">
          {phase === 'done' ? 'Finished' : `${exerciseNo(steps, index)} of ${exerciseNo(steps, steps.length - 1)}`}
        </span>
        <span style={{ width: 44 }} />
      </header>

      {phase === 'done' ? (
        <div className="timer-main">
          <div className="timer-phase">Well done!</div>
          <h2 className="timer-name">
            {finished.current.length} exercise{finished.current.length === 1 ? '' : 's'} ticked off
          </h2>
          <button type="button" className="btn primary timer-big-btn" onClick={() => onClose(finished.current)}>
            <Check size={22} /> Close
          </button>
        </div>
      ) : (
        <>
          <div className="timer-main">
            <div className="timer-phase">{phase === 'ready' ? 'Get ready' : phase === 'rest' ? 'Rest · next up' : 'Now'}</div>
            <h2 className="timer-name">{shown.exercise.name}</h2>
            {shown.label && <div className="timer-label">{shown.label}</div>}

            {remaining !== null ? (
              <div className="timer-ring">
                <svg viewBox="0 0 240 240">
                  <circle cx="120" cy="120" r={r} className="ring-track" />
                  <circle
                    cx="120"
                    cy="120"
                    r={r}
                    className="ring-fill"
                    strokeDasharray={c}
                    strokeDashoffset={c * (1 - pct)}
                    transform="rotate(-90 120 120)"
                  />
                </svg>
                <span className="timer-time">{clock(remaining)}</span>
              </div>
            ) : (
              <div className="timer-reps">
                <div className="timer-dose">{shown.exercise.dose || 'At your own pace'}</div>
                <button type="button" className="btn primary timer-big-btn" onClick={() => goNext(true)}>
                  <Check size={22} /> Done
                </button>
              </div>
            )}

            {phase === 'work' && upNext && <div className="muted">Next: {stepName(upNext)}</div>}
          </div>

          <div className="timer-controls">
            <button type="button" className="round-btn" onClick={goBack} aria-label="Previous">
              <SkipBack size={22} />
            </button>
            <button
              type="button"
              className="round-btn big"
              onClick={togglePause}
              disabled={remaining === null}
              aria-label={pausedLeft !== null ? 'Resume' : 'Pause'}
            >
              {pausedLeft !== null ? <Play size={30} /> : <Pause size={30} />}
            </button>
            <button type="button" className="round-btn" onClick={() => goNext(phase !== 'work')} aria-label="Skip">
              <SkipForward size={22} />
            </button>
          </div>
        </>
      )}
    </div>,
    document.body,
  );
}

/** 1-based number of the exercise that step `i` belongs to (sides and rounds share one number). */
function exerciseNo(steps: TimerStep[], i: number) {
  return steps.slice(0, i + 1).filter((s, j) => j === 0 || s.exercise.id !== steps[j - 1].exercise.id).length;
}

function clock(ms: number) {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
