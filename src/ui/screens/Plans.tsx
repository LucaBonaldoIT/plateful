// 04 — saved weekly plans (§9).
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { nextMonday, weekRange } from '../../domain/schema';
import type { Plan } from '../../domain/types';
import { useStore } from '../../state/store';
import { Icon } from '../components/Icon';
import { PlanSettingsEditor, mondayOptions } from '../components/planSettings';
import { Button, Confirm, Field, Notice, Overline, Sheet, Tag } from '../components/ui';

function edited(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Edited today';
  return `Edited ${d.getDate()} ${d.toLocaleString('en-GB', { month: 'short' })}`;
}

export function Plans() {
  const plans = useStore((s) => s.data!.plans);
  const defaults = useStore((s) => s.data!.defaultSettings);
  const hasPeople = useStore((s) => s.data!.household.people.length > 0);
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [settings, setSettings] = useState(defaults);
  const [week, setWeek] = useState(nextMonday());
  const [menu, setMenu] = useState<Plan | null>(null);
  const [renaming, setRenaming] = useState<Plan | null>(null);
  const [name, setName] = useState('');
  const [duplicating, setDuplicating] = useState<Plan | null>(null);
  const [deleting, setDeleting] = useState<Plan | null>(null);
  const current = nextMonday(new Date(Date.now() - 6 * 864e5));
  const sorted = [...plans].sort((a, b) => b.weekStart.localeCompare(a.weekStart) || b.createdAt.localeCompare(a.createdAt));

  return (
    <main id="main" className="pf-page">
      <div className="pf-titlebar">
        <div>
          <Overline>Your weeks</Overline>
          <h1 className="pf-h1">Plans</h1>
        </div>
        <Button variant="primary" icon="plus" disabled={!hasPeople} onClick={() => { setSettings(defaults); setCreating(true); }}>
          New plan
        </Button>
      </div>
      {!hasPeople && (
        <Notice kind="warn" icon="alert">
          Your household has no people. <Link to="/household">Add someone</Link> to plan meals.
        </Notice>
      )}
      {sorted.length === 0 ? (
        <div className="pf-empty">
          <Icon name="calendar" size={28} />
          <p>No plans yet. Create one to get a week of meals and a grocery list.</p>
        </div>
      ) : (
        <ul className="pf-plan-list">
          {sorted.map((p) => {
            const meals = p.meals.filter((m) => m.recipeId).length;
            const isCurrent = p.weekStart === current;
            return (
              <li key={p.id} className={`ds-panel pf-plan ${isCurrent ? 'is-current' : ''}`}>
                <Link to={`/plan/${p.id}`} className="pf-plan__link">
                  <span className="pf-row pf-gap-8 pf-wrap">
                    <span className="pf-h3">{p.name}</span>
                    {isCurrent && <Tag kind="accent">This week</Tag>}
                  </span>
                  <span className="pf-sm pf-soft">
                    {weekRange(p.weekStart)} · {meals} meals · {p.household.people.length} {p.household.people.length === 1 ? 'person' : 'people'}
                  </span>
                  <span className="pf-xs pf-soft">{edited(p.updatedAt)}</span>
                </Link>
                <Button variant="quiet" icon="more" label={`Actions for ${p.name}`} onClick={() => setMenu(p)} />
              </li>
            );
          })}
        </ul>
      )}
      <Notice icon="info">Plans keep a snapshot of your household. Editing the household doesn't change saved plans.</Notice>

      <Sheet
        open={creating}
        onClose={() => setCreating(false)}
        title="New plan"
        actions={
          <Button
            variant="primary"
            size="lg"
            icon="sparkles"
            className="pf-grow"
            onClick={() => {
              const id = useStore.getState().createPlan(week, settings);
              setCreating(false);
              navigate(`/plan/${id}`);
            }}
          >
            Create plan
          </Button>
        }
      >
        <PlanSettingsEditor value={settings} onChange={setSettings} week={week} onWeek={setWeek} />
      </Sheet>

      <Sheet open={!!menu} onClose={() => setMenu(null)} title={menu?.name ?? ''} overline="Plan">
        <div className="pf-menu">
          <Button icon="arrow-left" className="pf-flip" block onClick={() => { navigate(`/plan/${menu!.id}`); }}>Open</Button>
          <Button icon="pencil" block onClick={() => { setName(menu!.name); setRenaming(menu); setMenu(null); }}>Rename</Button>
          <Button icon="copy" block onClick={() => { setWeek(nextMonday()); setDuplicating(menu); setMenu(null); }}>Duplicate to another week</Button>
          <Button icon="trash" block className="pf-text--err" onClick={() => { setDeleting(menu); setMenu(null); }}>Delete</Button>
        </div>
      </Sheet>

      <Sheet
        open={!!renaming}
        onClose={() => setRenaming(null)}
        title="Rename plan"
        actions={
          <Button variant="primary" className="pf-grow" onClick={() => { useStore.getState().renamePlan(renaming!.id, name); setRenaming(null); }}>
            Save
          </Button>
        }
      >
        <Field label="Name">{(id) => <input id={id} className="ds-input" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />}</Field>
      </Sheet>

      <Sheet
        open={!!duplicating}
        onClose={() => setDuplicating(null)}
        title="Duplicate plan"
        actions={
          <Button variant="primary" className="pf-grow" icon="copy" onClick={() => { const id = useStore.getState().duplicatePlan(duplicating!.id, week); setDuplicating(null); navigate(`/plan/${id}`); }}>
            Duplicate
          </Button>
        }
      >
        <p className="pf-soft">Copies every meal and lock to the week you choose.</p>
        <Field label="Week">
          {(id) => (
            <select id={id} className="ds-input" value={week} onChange={(e) => setWeek(e.target.value)}>
              {mondayOptions().map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          )}
        </Field>
      </Sheet>

      <Confirm
        open={!!deleting}
        title="Delete this plan?"
        confirmLabel="Delete"
        danger
        onCancel={() => setDeleting(null)}
        onConfirm={() => { useStore.getState().deletePlan(deleting!.id); setDeleting(null); }}
      >
        <p>{deleting?.name} and its grocery list will be removed from this browser.</p>
      </Confirm>
    </main>
  );
}
