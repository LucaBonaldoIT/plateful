// Meals per day, week and leftovers (§5).
import { SLOTS } from '../../domain/nutrition';
import { addDays, nextMonday, toIsoDate, weekRange } from '../../domain/schema';
import type { MealsPerDay, PlanSettings } from '../../domain/types';
import { Section } from './household';
import { Bar, Segmented, Toggle } from './ui';

export function mondayOptions(): { value: string; label: string }[] {
  const base = nextMonday();
  return Array.from({ length: 17 }, (_, i) => {
    const iso = toIsoDate(addDays(base, (i - 4) * 7));
    return { value: iso, label: `${weekRange(iso)} ${iso.slice(0, 4)}` };
  });
}

export function PlanSettingsEditor({ value, onChange, week, onWeek }: { value: PlanSettings; onChange: (v: PlanSettings) => void; week?: string; onWeek?: (iso: string) => void }) {
  const slots = SLOTS[value.mealsPerDay];
  return (
    <div className="pf-stack-lg">
      <Section title="Meals per day" sub="Sets the slots and how calories are split.">
        <Segmented<MealsPerDay>
          label="Meals per day"
          equal
          value={value.mealsPerDay}
          onChange={(mealsPerDay) => onChange({ ...value, mealsPerDay })}
          options={([1, 2, 3, 4, 5, 6] as MealsPerDay[]).map((n) => ({ value: n, label: String(n) }))}
        />
        <div className="ds-panel pf-stack-sm">
          {slots.map((s) => (
            <div key={s.id} className="pf-stack-xs">
              <div className="pf-row pf-between">
                <span className="pf-soft pf-sm">{s.label}</span>
                <span className="pf-sm pf-strong">{Math.round(s.share * 100)}% of daily kcal</span>
              </div>
              <Bar value={s.share} />
            </div>
          ))}
        </div>
      </Section>
      {week && onWeek && (
        <Section title="Week" sub="Plans always run Monday to Sunday.">
          <label className="pf-select">
            <span className="ds-sr-only">Week</span>
            <select className="ds-input" value={week} onChange={(e) => onWeek(e.target.value)}>
              {mondayOptions().map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </Section>
      )}
      <div className="ds-panel pf-row pf-between pf-gap-12">
        <div>
          <p className="pf-strong">Leftovers & batch cooking</p>
          <p className="pf-sm pf-soft">Cook a dinner twice and eat it for lunch the next day. Up to 3 times a week.</p>
        </div>
        <Toggle label="Leftovers & batch cooking" on={value.leftoversEnabled} onChange={(leftoversEnabled) => onChange({ ...value, leftoversEnabled })} />
      </div>
    </div>
  );
}
