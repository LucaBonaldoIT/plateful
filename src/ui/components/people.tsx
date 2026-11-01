// Person card and editor (FR-HH-2…5).
import { useState } from 'react';
import { energyTarget, macroGrams } from '../../domain/nutrition';
import { newId, personSchema } from '../../domain/schema';
import type { MacroProfile, Person } from '../../domain/types';
import { Button, Field, Overline, Segmented, Sheet, Tag } from './ui';

const ACTIVITY_HINT = {
  sedentary: 'Sedentary: desk job, little or no exercise.',
  moderate: 'Moderate: exercise 3–5 days a week.',
  high: 'High: hard exercise 6–7 days a week, or a physical job.',
};
const GOAL_LABEL = { lose: 'Lose weight · −500 kcal', maintain: 'Maintain', gain: 'Gain · +300 kcal' };
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);
export const fmt = (n: number) => Math.round(n).toLocaleString('en-GB');

export function PersonCard({ person, profile, onEdit }: { person: Person; profile: MacroProfile; onEdit: () => void }) {
  const t = energyTarget(person);
  const g = macroGrams(t.target, profile);
  return (
    <article className="ds-panel pf-person">
      <div className="pf-person__top">
        <div>
          <h3 className="pf-h3">{person.name}</h3>
          <p className="pf-soft pf-sm">
            {cap(person.sex)} · {person.age} y · {person.weightKg.toFixed(1)} kg · {person.heightCm} cm
          </p>
        </div>
        <Button variant="quiet" icon="pencil" label={`Edit ${person.name}`} onClick={onEdit} />
      </div>
      <div className="pf-row pf-wrap pf-gap-6">
        <Tag>{cap(person.activity)} activity</Tag>
        <Tag kind="accent">{GOAL_LABEL[person.goal]}</Tag>
      </div>
      <hr className="ds-rule" />
      <div className="pf-person__numbers">
        <div>
          <Overline>Daily target</Overline>
          <p className="pf-figure">{fmt(t.target)} kcal</p>
        </div>
        <div className="pf-person__macros">
          <p className="pf-sm pf-strong">
            C {g.carbs} g · P {g.protein} g · F {g.fat} g
          </p>
          <p className="pf-xs pf-soft">
            BMR {fmt(t.bmr)} · TDEE {fmt(t.tdee)}
          </p>
        </div>
      </div>
      {t.floorApplied && <p className="pf-xs pf-text--warn">Raised to the safe minimum for this person.</p>}
    </article>
  );
}

type Draft = { name: string; sex: Person['sex']; age: string; weightKg: string; heightCm: string; activity: Person['activity']; goal: Person['goal'] };

export function PersonEditor({ person, profile, onSave, onRemove, onClose }: { person: Person | null; profile: MacroProfile; onSave: (p: Person) => void; onRemove?: () => void; onClose: () => void }) {
  const [d, setD] = useState<Draft>(() =>
    person
      ? { ...person, age: String(person.age), weightKg: String(person.weightKg), heightCm: String(person.heightCm) }
      : { name: '', sex: 'female', age: '', weightKg: '', heightCm: '', activity: 'moderate', goal: 'maintain' },
  );
  const [touched, setTouched] = useState(false);
  const candidate = { id: person?.id ?? newId(), name: d.name, sex: d.sex, age: Number(d.age), weightKg: Number(d.weightKg.replace(',', '.')), heightCm: Number(d.heightCm), activity: d.activity, goal: d.goal };
  const res = personSchema.safeParse(candidate);
  const err = (field: keyof Draft) => {
    if (!touched || res.success) return undefined;
    const issue = res.error.issues.find((i) => i.path[0] === field);
    if (!issue) return undefined;
    if (field === 'age' && candidate.age > 0 && candidate.age < 18) return 'Plateful plans for adults only.';
    return { name: 'Enter a name (1–40 characters).', age: 'Age 18–100.', weightKg: 'Weight 30–300 kg.', heightCm: 'Height 120–230 cm.' }[field as 'name'] ?? issue.message;
  };
  const preview = res.success ? energyTarget(res.data) : null;
  const set = (patch: Partial<Draft>) => setD((x) => ({ ...x, ...patch }));
  const save = () => {
    setTouched(true);
    if (res.success) onSave(res.data);
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title={person ? 'Edit person' : 'Add person'}
      actions={
        <>
          {onRemove && (
            <Button variant="quiet" icon="trash" className="pf-text--err" onClick={onRemove}>
              Remove
            </Button>
          )}
          <Button variant="primary" size="lg" className="pf-grow" onClick={save}>
            Save
          </Button>
        </>
      }
    >
      <form
        className="pf-form"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <Field label="Name" error={err('name')}>
          {(id, hint) => <input id={id} aria-describedby={hint} aria-invalid={!!err('name')} className="ds-input" value={d.name} maxLength={40} autoComplete="off" onChange={(e) => set({ name: e.target.value })} />}
        </Field>
        <div className="ds-field">
          <span className="ds-label">Sex</span>
          <Segmented label="Sex" equal value={d.sex} onChange={(sex) => set({ sex })} options={[{ value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }]} />
          <p className="ds-hint">Used by the calorie formula (Mifflin-St Jeor).</p>
        </div>
        <div className="pf-grid3">
          {(
            [
              ['age', 'Age', 'y', 'numeric'],
              ['weightKg', 'Weight', 'kg', 'decimal'],
              ['heightCm', 'Height', 'cm', 'numeric'],
            ] as const
          ).map(([k, label, suffix, mode]) => (
            <Field key={k} label={label} error={err(k)}>
              {(id, hint) => (
                <div className="pf-input-suffix">
                  <input id={id} aria-describedby={hint} aria-invalid={!!err(k)} className="ds-input" inputMode={mode} value={d[k]} onChange={(e) => set({ [k]: e.target.value } as Partial<Draft>)} />
                  <span aria-hidden="true">{suffix}</span>
                </div>
              )}
            </Field>
          ))}
        </div>
        <div className="ds-field">
          <span className="ds-label">Activity level</span>
          <Segmented label="Activity level" equal value={d.activity} onChange={(activity) => set({ activity })} options={[{ value: 'sedentary', label: 'Sedentary' }, { value: 'moderate', label: 'Moderate' }, { value: 'high', label: 'High' }]} />
          <p className="ds-hint">{ACTIVITY_HINT[d.activity]}</p>
        </div>
        <div className="ds-field">
          <span className="ds-label">Goal</span>
          <Segmented label="Goal" equal value={d.goal} onChange={(goal) => set({ goal })} options={[{ value: 'lose', label: 'Lose' }, { value: 'maintain', label: 'Maintain' }, { value: 'gain', label: 'Gain' }]} />
        </div>
        {preview && (
          <div className="pf-result">
            <div>
              <Overline accent>Daily target</Overline>
              <p className="pf-figure">{fmt(preview.target)} kcal</p>
            </div>
            <p className="pf-sm pf-soft">
              {preview.floorApplied ? 'Safe minimum applied' : `TDEE ${fmt(preview.tdee)}${d.goal === 'lose' ? ' − 500' : d.goal === 'gain' ? ' + 300' : ''}`}
              <br />
              {(() => {
                const g = macroGrams(preview.target, profile);
                return `C ${g.carbs} g · P ${g.protein} g · F ${g.fat} g`;
              })()}
            </p>
          </div>
        )}
        <button type="submit" hidden />
      </form>
    </Sheet>
  );
}
