import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Droplets, Footprints, Minus, Palette, Plus } from 'lucide-react';
import { DEFAULT_SETTINGS, getSettings, updateSettings, type ExerciseCategory } from '../db';
import { EXERCISE } from '../constants';
import { getTheme, setTheme, type Theme } from '../theme';
import { IconBubble, Segmented } from '../ui';

export default function SettingsScreen() {
  const settings = useLiveQuery(getSettings) ?? DEFAULT_SETTINGS;
  const [theme, setThemeState] = useState<Theme>(getTheme);

  const chooseTheme = (t: Theme) => {
    setTheme(t);
    setThemeState(t);
  };

  const setGoal = (c: ExerciseCategory, target: number) =>
    updateSettings({ goals: { ...settings.goals, [c]: { ...settings.goals[c], target: Math.max(0, target) } } });

  return (
    <div className="screen">
      <h1 className="page-title">Settings</h1>

      <section className="card">
        <div className="card-head">
          <IconBubble Icon={Palette} tone="brand" />
          <span className="card-title">Appearance</span>
        </div>
        <Segmented
          value={theme}
          onChange={chooseTheme}
          options={[
            { value: 'system', label: 'Phone setting' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
        />
      </section>

      <section className="card">
        <div className="card-head">
          <IconBubble Icon={Droplets} tone="water" />
          <span className="card-title">Daily water goal</span>
        </div>
        <Stepper
          value={settings.waterGoal}
          unit={`glasses (${settings.glassMl} ml each)`}
          onChange={(v) => updateSettings({ waterGoal: Math.max(1, v) })}
        />
      </section>

      <section className="card">
        <div className="card-head">
          <IconBubble Icon={Footprints} tone="exercise" />
          <span className="card-title">Weekly exercise goals</span>
        </div>
        {EXERCISE.map((c) => {
          const goal = settings.goals[c.id];
          const step = goal.unit === 'minutes' ? 10 : 1;
          return (
            <div key={c.id} className="setting-row">
              <IconBubble Icon={c.Icon} tone={c.id} size="sm" />
              <span className="setting-label">{c.label}</span>
              <Stepper
                value={goal.target}
                unit={goal.unit === 'minutes' ? 'min' : 'times'}
                onChange={(v) => setGoal(c.id, v)}
                step={step}
              />
            </div>
          );
        })}
      </section>
    </div>
  );
}

function Stepper({
  value,
  unit,
  onChange,
  step = 1,
}: {
  value: number;
  unit: string;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <div className="stepper">
      <button className="round-btn sm" onClick={() => onChange(value - step)} aria-label="Decrease">
        <Minus size={18} />
      </button>
      <span className="stepper-value">
        <strong>{value}</strong> <span className="muted small">{unit}</span>
      </span>
      <button className="round-btn sm" onClick={() => onChange(value + step)} aria-label="Increase">
        <Plus size={18} />
      </button>
    </div>
  );
}
