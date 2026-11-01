// Household settings: people, diet, macro profile, allergens and recipe availability (§4).
import { useMemo, useState } from 'react';
import { DIET_HINT, DIET_LABEL, compatibleRecipes } from '../../domain/compat';
import { MACRO_PROFILES, MACRO_PROFILE_ORDER } from '../../domain/nutrition';
import type { Allergen, Diet, Household, Person, SlotType } from '../../domain/types';
import { database, useStore } from '../../state/store';
import { Icon } from './Icon';
import { PersonCard, PersonEditor } from './people';
import { Button, Chip, Confirm, Notice } from './ui';

const DIETS: Diet[] = ['omnivore', 'flexitarian', 'pescatarian', 'vegetarian', 'vegan'];
const ALLERGENS: { id: Allergen; label: string }[] = [
  { id: 'gluten', label: 'Gluten' },
  { id: 'dairy', label: 'Dairy' },
  { id: 'eggs', label: 'Eggs' },
  { id: 'tree-nuts', label: 'Tree nuts' },
  { id: 'peanuts', label: 'Peanuts' },
  { id: 'soy', label: 'Soy' },
  { id: 'fish', label: 'Fish' },
  { id: 'shellfish', label: 'Shellfish' },
  { id: 'sesame', label: 'Sesame' },
];

export function Section({ title, sub, action, children }: { title: string; sub?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="pf-section">
      <div className="pf-section__head">
        <div>
          <h2 className="pf-h2">{title}</h2>
          {sub && <p className="pf-soft pf-sm">{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Availability({ household }: { household: Household }) {
  const counts = useMemo(() => {
    const db = database();
    return (['breakfast', 'lunch', 'dinner', 'snack'] as SlotType[]).map((s) => [s, compatibleRecipes(household, s, db).length] as const);
  }, [household]);
  return (
    <div className="ds-panel pf-availability" aria-live="polite">
      <p className="pf-strong">Recipes available with these settings</p>
      <dl className="pf-counts">
        {counts.map(([slot, n]) => (
          <div key={slot}>
            <dt className="ds-overline pf-overline">{slot}</dt>
            <dd className={`pf-figure ${n < 7 ? 'pf-text--warn' : ''}`}>{n}</dd>
            {n < 7 && <dd className="pf-xs pf-text--warn">{n === 0 ? 'none — slot stays empty' : 'repeats likely'}</dd>}
          </div>
        ))}
      </dl>
    </div>
  );
}

export function HouseholdEditor({ layout = 'stack' }: { layout?: 'stack' | 'columns' }) {
  const household = useStore((s) => s.data!.household);
  const { setHousehold, upsertPerson, removePerson } = useStore.getState();
  const [editing, setEditing] = useState<Person | 'new' | null>(null);
  const [removing, setRemoving] = useState<Person | null>(null);

  const people = (
    <Section
      title="People"
      sub="Adults only (18+). Everyone eats the same dishes; portions are sized per person."
      action={household.people.length > 0 && household.people.length < 12 ? <Button icon="plus" onClick={() => setEditing('new')}>Add person</Button> : undefined}
    >
      {household.people.length === 0 ? (
        <div className="pf-empty">
          <Icon name="users" size={28} />
          <p>Add the people who eat together. Plateful uses their body data to size each portion.</p>
          <Button variant="primary" icon="plus" onClick={() => setEditing('new')}>
            Add the first person
          </Button>
        </div>
      ) : (
        <div className="pf-people">
          {household.people.map((p) => (
            <PersonCard key={p.id} person={p} profile={household.macroProfile} onEdit={() => setEditing(p)} />
          ))}
        </div>
      )}
    </Section>
  );

  const diet = (
    <Section title="Diet" sub="One diet for the whole household.">
      <div className="pf-chips" role="radiogroup" aria-label="Diet">
        {DIETS.map((d) => (
          <Chip key={d} role="radio" on={household.diet === d} onClick={() => setHousehold((h) => ({ ...h, diet: d }))}>
            {DIET_LABEL[d]}
          </Chip>
        ))}
      </div>
      <p className="pf-xs pf-soft">{DIET_HINT[household.diet]}</p>
    </Section>
  );

  const profile = (
    <Section title="Macro profile" sub="Share of daily calories · carbs / protein / fat">
      <div className="pf-radios" role="radiogroup" aria-label="Macro profile">
        {MACRO_PROFILE_ORDER.map((id) => {
          const p = MACRO_PROFILES[id];
          const on = household.macroProfile === id;
          return (
            <button key={id} type="button" role="radio" aria-checked={on} className="pf-radio" onClick={() => setHousehold((h) => ({ ...h, macroProfile: id }))}>
              <span className="pf-radio__dot" aria-hidden="true" />
              <span className="pf-radio__text">
                <span className="pf-strong">{p.label}</span>
                <span className="pf-xs pf-soft">{p.description}</span>
              </span>
              <span className="pf-xs pf-radio__split">
                {p.carbs}/{p.protein}/{p.fat}
              </span>
            </button>
          );
        })}
      </div>
    </Section>
  );

  const allergens = (
    <Section title="Allergens" sub="Recipes with any of these are never used.">
      <div className="pf-chips">
        {ALLERGENS.map((a) => {
          const on = household.excludedAllergens.includes(a.id);
          return (
            <Chip
              key={a.id}
              on={on}
              onClick={() =>
                setHousehold((h) => ({
                  ...h,
                  excludedAllergens: on ? h.excludedAllergens.filter((x) => x !== a.id) : [...h.excludedAllergens, a.id],
                }))
              }
            >
              {a.label}
            </Chip>
          );
        })}
      </div>
      <Notice kind="warn" icon="alert">
        Always check product labels. Allergen data may be incomplete or wrong.
      </Notice>
    </Section>
  );

  return (
    <>
      {layout === 'columns' ? (
        <div className="pf-columns">
          <div className="pf-stack-lg">
            {people}
            {diet}
            {allergens}
          </div>
          <div className="pf-stack-lg">
            {profile}
            <Availability household={household} />
          </div>
        </div>
      ) : (
        <div className="pf-stack-lg">
          {people}
          {diet}
          {profile}
          {allergens}
          <Availability household={household} />
        </div>
      )}
      {editing && (
        <PersonEditor
          person={editing === 'new' ? null : editing}
          profile={household.macroProfile}
          onClose={() => setEditing(null)}
          onSave={(p) => {
            upsertPerson(p);
            setEditing(null);
          }}
          onRemove={
            editing !== 'new'
              ? () => {
                  setRemoving(editing);
                  setEditing(null);
                }
              : undefined
          }
        />
      )}
      <Confirm
        open={!!removing}
        title={`Remove ${removing?.name ?? ''}?`}
        confirmLabel="Remove"
        danger
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          if (removing) removePerson(removing.id);
          setRemoving(null);
        }}
      >
        <p>They'll be removed from the household. Saved plans keep their own copy of the household.</p>
      </Confirm>
    </>
  );
}

