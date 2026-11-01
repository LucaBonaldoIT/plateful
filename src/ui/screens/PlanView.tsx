// 05–07 + D1 — the week: day tabs on mobile, grid on desktop, meal detail and swap (§7).
import { useMemo, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { DIET_LABEL, describeConstraints, portions } from '../../domain/compat';
import { DAYS, key, leftoverTarget, rankAlternatives } from '../../domain/generator';
import { formatQuantity, roundAmount } from '../../domain/grocery';
import { MACRO_PROFILES, SLOTS, macroSplit, recipeNutrients, slotOf } from '../../domain/nutrition';
import { shortDay, weekRange } from '../../domain/schema';
import { mealStatus, totalsFor } from '../../domain/totals';
import type { Day, Meal, MealRef, Plan } from '../../domain/types';
import { database, useStore } from '../../state/store';
import { Icon } from '../components/Icon';
import { fmt } from '../components/people';
import { Bar, Button, Confirm, Notice, Overline, Sheet, Tag, useToast } from '../components/ui';

const pct = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : 0);
const signed = (n: number) => (n > 0 ? `+${n}` : n === 0 ? '±0' : `−${Math.abs(n)}`);

export function PlanView() {
  const { id } = useParams();
  const plan = useStore((s) => s.data!.plans.find((p) => p.id === id));
  const household = useStore((s) => s.data!.household);
  const warnings = useStore((s) => s.lastWarnings);
  const [params, setParams] = useSearchParams();
  const day = Math.min(6, Math.max(0, Number(params.get('day') ?? 0))) as Day;
  const [open, setOpen] = useState<MealRef | null>(null);
  const [swapping, setSwapping] = useState<MealRef | null>(null);
  const [confirmGenerate, setConfirmGenerate] = useState(false);
  const toast = useToast();
  if (!plan) return <Navigate to="/" replace />;

  const stale = JSON.stringify(plan.household) !== JSON.stringify(household);
  const filled = plan.meals.filter((m) => m.recipeId).length;
  const locked = plan.meals.filter((m) => m.locked).length;
  const st = useStore.getState();
  const generateWeek = () => {
    st.regenerate(plan.id);
    toast(locked ? `Week generated · ${locked} locked meal${locked > 1 ? 's' : ''} kept` : 'Week generated');
  };

  return (
    <main id="main" className="pf-page pf-page--wide">
      <nav className="pf-crumbs" aria-label="Breadcrumb">
        <Link to="/">Plans</Link>
        <Icon name="chevron-right" size={14} />
        <span aria-current="page">{plan.name}</span>
      </nav>
      <div className="pf-titlebar">
        <div className="pf-stack-xs">
          <h1 className="pf-h1">{plan.name}</h1>
          <p className="pf-soft pf-sm">{weekRange(plan.weekStart)}</p>
          <div className="pf-row pf-wrap pf-gap-6">
            <Tag icon="users">{plan.household.people.length} {plan.household.people.length === 1 ? 'person' : 'people'}</Tag>
            <Tag kind="accent">{DIET_LABEL[plan.household.diet]}</Tag>
            <Tag kind="accent">
              {MACRO_PROFILES[plan.household.macroProfile].label} · {MACRO_PROFILES[plan.household.macroProfile].carbs}/{MACRO_PROFILES[plan.household.macroProfile].protein}/{MACRO_PROFILES[plan.household.macroProfile].fat}
            </Tag>
            {plan.household.excludedAllergens.map((a) => (
              <Tag key={a}>{a === 'gluten' ? 'No gluten' : `No ${a.replace('-', ' ')}`}</Tag>
            ))}
            <Tag>{plan.settings.mealsPerDay} meals / day</Tag>
            {plan.settings.leftoversEnabled && <Tag icon="leftover">Leftovers on</Tag>}
          </div>
        </div>
        <div className="pf-row pf-wrap pf-gap-8 pf-plan-actions">
          <Button variant="primary" icon="sparkles" onClick={() => (filled > locked ? setConfirmGenerate(true) : generateWeek())}>
            Generate week
          </Button>
          <Button icon="refresh" className="pf-mobile-only" onClick={() => { st.regenerate(plan.id, day); toast(`${shortDay(plan.weekStart, day).dow} regenerated`); }}>
            Regenerate day
          </Button>
          <Link to={`/plan/${plan.id}/grocery`} className="ds-button pf-desktop-only">
            <Icon name="basket" size={17} /> Grocery list
          </Link>
        </div>
      </div>

      {stale && (
        <Notice icon="info" title="Your household changed since this plan was made.">
          <p className="pf-sm">The plan keeps its own copy. Update it to use the current people, diet and allergens; meals that no longer fit are flagged, not replaced.</p>
          <Button size="sm" icon="refresh" className="pf-mt-8" onClick={() => { st.updateFromHousehold(plan.id); toast('Plan updated from household'); }}>
            Update from household
          </Button>
        </Notice>
      )}
      {warnings.map((w) => (
        <Notice key={w} kind="warn" icon="alert">
          {w}
        </Notice>
      ))}
      {plan.household.people.length === 0 && <Notice kind="warn" icon="alert">This plan has no people, so portions can't be sized.</Notice>}

      {/* mobile: one day at a time */}
      <section className="pf-mobile-only pf-stack-md" aria-label="Day view">
        <div className="pf-daytabs" role="tablist" aria-label="Day">
          {DAYS.map((d) => {
            const { dow, date } = shortDay(plan.weekStart, d);
            return (
              <button key={d} role="tab" aria-selected={d === day} className="pf-daytab" onClick={() => setParams({ day: String(d) }, { replace: true })}>
                <span className="pf-xs">{dow}</span>
                <span className="pf-daytab__num">{date}</span>
              </button>
            );
          })}
        </div>
        <div className="pf-stack-sm">
          {SLOTS[plan.settings.mealsPerDay].map((slot) => {
            const meal = plan.meals.find((m) => m.day === day && m.slot === slot.id);
            return meal ? <MealCard key={slot.id} plan={plan} meal={meal} onOpen={() => setOpen(meal)} /> : null;
          })}
        </div>
        <DayTotals plan={plan} days={[day]} title={`${dayName(plan, day)} totals`} />
        <Link to={`/plan/${plan.id}/grocery`} className="ds-button ds-button--primary pf-button--large pf-block">
          <Icon name="basket" size={17} /> Grocery list
        </Link>
      </section>

      {/* desktop: the whole week */}
      <section className="pf-desktop-only pf-stack-lg" aria-label="Week grid">
        <div className="pf-grid" style={{ gridTemplateColumns: `112px repeat(7, minmax(0, 1fr))` }}>
          <span />
          {DAYS.map((d) => {
            const { dow, date } = shortDay(plan.weekStart, d);
            return (
              <div key={d} className="pf-grid__day">
                <span className="pf-sm pf-soft">{dow}</span> <span className="pf-h3">{date}</span>
                <Button variant="quiet" size="sm" icon="refresh" label={`Regenerate ${dow}`} onClick={() => { st.regenerate(plan.id, d); toast(`${dow} regenerated`); }} />
              </div>
            );
          })}
          {SLOTS[plan.settings.mealsPerDay].map((slot) => (
            <Row key={slot.id} label={slot.label} share={slot.share}>
              {DAYS.map((d) => {
                const meal = plan.meals.find((m) => m.day === d && m.slot === slot.id);
                return meal ? <MealCard key={d} plan={plan} meal={meal} compact onOpen={() => setOpen(meal)} /> : <span key={d} />;
              })}
            </Row>
          ))}
        </div>
        <div className="pf-week-summary">
          <DayTotals plan={plan} days={DAYS} title="Average per day" />
          <div className="ds-panel pf-stack-xs pf-legend">
            <p className="pf-strong pf-sm">Legend</p>
            <p className="pf-sm pf-soft"><Icon name="lock" size={15} className="ds-accent" /> Locked — kept when regenerating</p>
            <p className="pf-sm pf-soft"><Icon name="leftover" size={15} className="ds-accent" /> Leftovers — no extra cooking</p>
            <p className="pf-sm pf-soft"><Icon name="alert" size={15} className="pf-text--warn" /> Portion capped at ×0.5–2.0</p>
          </div>
        </div>
      </section>

      {open && <MealSheet plan={plan} meal={plan.meals.find((m) => key(m) === key(open))!} onClose={() => setOpen(null)} onSwap={() => { setSwapping(open); setOpen(null); }} />}
      {swapping && <SwapSheet plan={plan} at={swapping} onClose={() => setSwapping(null)} />}
      <Confirm
        open={confirmGenerate}
        title="Generate the whole week?"
        confirmLabel="Generate"
        onCancel={() => setConfirmGenerate(false)}
        onConfirm={() => { setConfirmGenerate(false); generateWeek(); }}
      >
        <p>Every unlocked meal is replaced.{locked ? ` ${locked} locked meal${locked > 1 ? 's stay' : ' stays'} as it is.` : ' Lock meals you want to keep first.'}</p>
      </Confirm>
    </main>
  );
}

function dayName(plan: Plan, day: Day) {
  const d = new Date(plan.weekStart + 'T00:00:00');
  d.setDate(d.getDate() + day);
  return d.toLocaleDateString('en-GB', { weekday: 'long' });
}

function Row({ label, share, children }: { label: string; share: number; children: React.ReactNode }) {
  return (
    <>
      <div className="pf-grid__slot">
        <Overline>{label}</Overline>
        <span className="pf-xs pf-soft">{Math.round(share * 100)}% kcal</span>
      </div>
      {children}
    </>
  );
}

function MealCard({ plan, meal, compact, onOpen }: { plan: Plan; meal: Meal; compact?: boolean; onOpen: () => void }) {
  const db = database();
  const status = mealStatus(plan, meal, db);
  const recipe = meal.recipeId ? db.recipeById.get(meal.recipeId) : undefined;
  const slot = slotOf(plan.settings.mealsPerDay, meal.slot);
  const st = useStore.getState();
  const leftoverFrom = meal.leftoverOf ? `${shortDay(plan.weekStart, meal.leftoverOf.day).dow} ${slotOf(plan.settings.mealsPerDay, meal.leftoverOf.slot).label.toLowerCase()}` : null;
  const ps = recipe ? portions(recipe, plan.household, plan.settings.mealsPerDay, meal.slot, db) : [];
  const clamped = ps.some((p) => p.clamped);
  const hasFollower = plan.meals.some((m) => m.leftoverOf && key(m.leftoverOf) === key(meal));

  return (
    <article className={`ds-panel pf-meal ${meal.leftoverOf ? 'is-leftover' : ''} ${compact ? 'is-compact' : ''} ${status !== 'ok' ? 'is-' + status : ''}`}>
      <div className="pf-meal__top">
        {!compact ? <Overline>{slot.label} · {Math.round(slot.share * 100)}%</Overline> : <span />}
        <div className="pf-row">
          <Button
            variant="quiet"
            size="sm"
            icon={meal.locked ? 'lock' : 'unlock'}
            label={meal.locked ? 'Unlock meal' : 'Lock meal'}
            className={meal.locked ? 'ds-accent' : ''}
            onClick={() => st.toggleLock(plan.id, meal)}
          />
          <Button variant="quiet" size="sm" icon="more" label="Meal details" onClick={onOpen} />
        </div>
      </div>
      <button type="button" className="pf-meal__body" onClick={onOpen}>
        {status === 'empty' && <span className="pf-sm pf-soft">{describeConstraints(plan.household, slot.type)}. Tap to pick a dish.</span>}
        {status === 'missing' && <span className="pf-sm pf-text--warn">Recipe no longer available</span>}
        {recipe && <span className={compact ? 'pf-strong' : 'pf-h3'}>{recipe.name}</span>}
      </button>
      {recipe && (
        <div className="pf-row pf-wrap pf-gap-6">
          {leftoverFrom ? (
            <Tag kind="accent" icon="leftover">{compact ? `From ${leftoverFrom.split(' ')[0]}` : `Leftovers from ${leftoverFrom}`}</Tag>
          ) : (
            <>
              <Tag>{Math.round(recipeNutrients(recipe, db).kcal)} kcal{compact ? '' : ' / serving'}</Tag>
              {!compact && <Tag icon="clock">{recipe.prepMinutes} min</Tag>}
              {hasFollower && <Tag kind="accent" icon="leftover">Cooks ×2</Tag>}
            </>
          )}
          {clamped && <Tag kind="warn" icon="alert">Capped</Tag>}
          {status === 'incompatible' && <Tag kind="warn" icon="alert">Doesn't fit settings</Tag>}
        </div>
      )}
      {recipe && !compact && plan.household.people.length > 0 && (
        <p className="pf-sm pf-soft">{plan.household.people.map((p, i) => `${p.name} ×${ps[i]!.factor.toFixed(2)}`).join(' · ')}</p>
      )}
    </article>
  );
}

function DayTotals({ plan, days, title }: { plan: Plan; days: Day[]; title: string }) {
  const totals = totalsFor(plan, days, database());
  const p = MACRO_PROFILES[plan.household.macroProfile];
  return (
    <section className="ds-panel pf-totals" aria-label={title}>
      <div className="pf-row pf-between pf-wrap pf-gap-8">
        <h2 className="pf-h3">{title}</h2>
        <Tag>{p.label} · {p.carbs}/{p.protein}/{p.fat}</Tag>
      </div>
      {totals.map((t) => {
        const d = pct(t.kcal, t.target);
        const split = macroSplit(t);
        return (
          <div key={t.personId} className="pf-stack-xs">
            <div className="pf-row pf-between pf-wrap">
              <span className="pf-row pf-gap-8">
                <span className="pf-strong">{t.name}</span>
                <Tag kind={Math.abs(d) <= 10 ? 'ok' : 'warn'}>{signed(d)}%</Tag>
              </span>
              <span className="pf-sm pf-soft">
                {fmt(t.kcal)} / {fmt(t.target)} kcal
              </span>
            </div>
            <Bar value={t.target ? t.kcal / t.target : 0} tone={Math.abs(d) <= 10 ? 'accent' : 'warn'} />
            <p className="pf-xs pf-soft">
              P {Math.round(t.protein)} g ({Math.round(split.protein)}%) · C {Math.round(t.carbs)} g ({Math.round(split.carbs)}%) · F {Math.round(t.fat)} g ({Math.round(split.fat)}%)
            </p>
          </div>
        );
      })}
    </section>
  );
}

function MealSheet({ plan, meal, onClose, onSwap }: { plan: Plan; meal: Meal; onClose: () => void; onSwap: () => void }) {
  const db = database();
  const st = useStore.getState();
  const toast = useToast();
  const recipe = meal.recipeId ? db.recipeById.get(meal.recipeId) : undefined;
  const slot = slotOf(plan.settings.mealsPerDay, meal.slot);
  const [showSteps, setShowSteps] = useState(false);
  const [confirm, setConfirm] = useState<null | 'clear' | 'leftovers'>(null);
  const follower = plan.meals.find((m) => m.leftoverOf && key(m.leftoverOf) === key(meal));
  const target = leftoverTarget(meal, plan.settings);
  const targetMeal = target ? plan.meals.find((m) => key(m) === key(target)) : undefined;
  const canLeftover = !!recipe?.batchable && !meal.leftoverOf && !follower && !!target && !!targetMeal && !targetMeal.locked && recipe.slots.includes(slotOf(plan.settings.mealsPerDay, target.slot).type);
  const overline = `${dayName(plan, meal.day)} · ${slot.label}`;

  if (!recipe) {
    return (
      <Sheet open onClose={onClose} title={meal.recipeId ? 'Recipe no longer available' : 'Empty meal'} overline={overline} actions={<Button variant="primary" icon="swap" className="pf-grow" onClick={onSwap}>Pick a dish</Button>}>
        <p className="pf-soft">{meal.recipeId ? 'This recipe was removed from the database. It is left out of the grocery list.' : describeConstraints(plan.household, slot.type) + '.'}</p>
      </Sheet>
    );
  }
  const ps = portions(recipe, plan.household, plan.settings.mealsPerDay, meal.slot, db);
  const n = recipeNutrients(recipe, db);
  const total = ps.reduce((s, p) => s + p.factor, 0) * (follower ? 2 : 1);

  return (
    <>
      <Sheet
        open={!confirm}
        onClose={onClose}
        title={recipe.name}
        overline={overline}
        actions={
          <>
            <Button size="lg" icon="swap" className="pf-grow" onClick={onSwap}>Swap</Button>
            <Button size="lg" icon={meal.locked ? 'unlock' : 'lock'} className="pf-grow" onClick={() => { st.toggleLock(plan.id, meal); toast(meal.locked ? 'Meal unlocked' : 'Meal locked'); }}>
              {meal.locked ? 'Unlock' : 'Lock'}
            </Button>
            <Button variant="quiet" icon="trash" label="Clear meal" className="pf-text--err" onClick={() => (follower ? setConfirm('clear') : (st.clearMeal(plan.id, meal), onClose()))} />
          </>
        }
      >
        <div className="pf-row pf-wrap pf-gap-6">
          <Tag>{Math.round(n.kcal)} kcal / serving</Tag>
          <Tag icon="clock">{recipe.prepMinutes} min</Tag>
          {follower && <Tag kind="accent" icon="leftover">Cooks ×2 → {dayName(plan, follower.day).slice(0, 3)} {slotOf(plan.settings.mealsPerDay, follower.slot).label.toLowerCase()}</Tag>}
          {meal.leftoverOf && <Tag kind="accent" icon="leftover">Leftovers — no cooking</Tag>}
        </div>
        {meal.leftoverOf && (
          <Notice icon="info">
            Eaten from the batch cooked {dayName(plan, meal.leftoverOf.day)}.{' '}
            <button type="button" className="pf-link" onClick={() => { st.unlinkLeftover(plan.id, meal); toast('Now a separate meal'); }}>Make it a separate meal</button>
          </Notice>
        )}
        {plan.household.people.length > 0 && (
          <table className="pf-table">
            <thead>
              <tr><th>Person</th><th>Portion</th><th>kcal</th><th>P / C / F g</th></tr>
            </thead>
            <tbody>
              {plan.household.people.map((p, i) => {
                const f = ps[i]!.factor;
                return (
                  <tr key={p.id}>
                    <td className="pf-strong">{p.name}</td>
                    <td>×{f.toFixed(2)}{ps[i]!.clamped && <Icon name="alert" size={13} className="pf-text--warn" />}</td>
                    <td>{Math.round(n.kcal * f)}</td>
                    <td>{Math.round(n.protein * f)} / {Math.round(n.carbs * f)} / {Math.round(n.fat * f)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <div className="pf-stack-xs">
          <p className="pf-strong pf-sm">Ingredients · {meal.leftoverOf ? 'counted with the batch' : `whole household${follower ? ', ×2 for leftovers' : ''}`}</p>
          <dl className="pf-kv">
            {recipe.ingredients.map(({ ingredientId, quantity }) => {
              const ing = db.ingredients.get(ingredientId)!;
              return (
                <div key={ingredientId}>
                  <dt>{ing.name}</dt>
                  <dd>{formatQuantity(roundAmount(quantity * total, ing.unit), ing.unit)}</dd>
                </div>
              );
            })}
          </dl>
        </div>
        <div className="ds-panel pf-steps-panel">
          <button type="button" className="pf-row pf-between pf-steps-toggle" aria-expanded={showSteps} onClick={() => setShowSteps((v) => !v)}>
            <span className="pf-strong">Method · {recipe.steps.length} steps</span>
            <Icon name="chevron-down" size={18} className={showSteps ? 'pf-rot' : ''} />
          </button>
          {showSteps && (
            <ol className="pf-method">
              {recipe.steps.map((s) => <li key={s}>{s}</li>)}
            </ol>
          )}
        </div>
        {canLeftover && (
          <Button icon="leftover" block onClick={() => (targetMeal?.recipeId ? setConfirm('leftovers') : (st.makeLeftovers(plan.id, meal), toast('Leftovers planned')))}>
            Cook ×2 for {dayName(plan, target!.day)} {slotOf(plan.settings.mealsPerDay, target!.slot).label.toLowerCase()}
          </Button>
        )}
        <Notice kind="warn" icon="alert">Always check product labels. Allergen data may be incomplete or wrong.</Notice>
      </Sheet>
      <Confirm
        open={confirm === 'clear'}
        title="Clear this meal?"
        confirmLabel="Clear both"
        danger
        onCancel={() => setConfirm(null)}
        onConfirm={() => { st.clearMeal(plan.id, meal); setConfirm(null); onClose(); }}
      >
        <p>Its leftovers on {follower && dayName(plan, follower.day)} are cleared too.</p>
      </Confirm>
      <Confirm
        open={confirm === 'leftovers'}
        title="Replace the next meal with leftovers?"
        confirmLabel="Use leftovers"
        onCancel={() => setConfirm(null)}
        onConfirm={() => { st.makeLeftovers(plan.id, meal); setConfirm(null); toast('Leftovers planned'); }}
      >
        <p>{targetMeal?.recipeId && db.recipeById.get(targetMeal.recipeId)?.name} will be replaced by leftovers of {recipe.name}.</p>
      </Confirm>
    </>
  );
}

function SwapSheet({ plan, at, onClose }: { plan: Plan; at: MealRef; onClose: () => void }) {
  const db = database();
  const st = useStore.getState();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [pick, setPick] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const slot = slotOf(plan.settings.mealsPerDay, at.slot);
  const all = useMemo(() => rankAlternatives(plan.household, plan.settings, plan.meals, at, db), [plan, at, db]);
  const list = all.filter((a) => a.recipe.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 40);
  const follower = plan.meals.find((m) => m.leftoverOf && key(m.leftoverOf) === key(at));
  const chosen = pick ? db.recipeById.get(pick) : undefined;
  const apply = () => {
    if (!pick) return;
    st.swapMeal(plan.id, at, pick);
    toast('Meal swapped and locked');
    onClose();
  };

  return (
    <>
      <Sheet
        open={!confirm}
        onClose={onClose}
        title={`Swap ${slot.label.toLowerCase()}`}
        overline={`${dayName(plan, at.day)} · ${slot.label}`}
        actions={
          <Button variant="primary" size="lg" icon="check" className="pf-grow" disabled={!chosen} onClick={() => (follower ? setConfirm(true) : apply())}>
            {chosen ? `Use ${chosen.name.length > 28 ? chosen.name.slice(0, 26) + '…' : chosen.name}` : 'Pick a dish'}
          </Button>
        }
      >
        <label className="pf-search">
          <Icon name="search" size={16} />
          <span className="ds-sr-only">Search recipes</span>
          <input className="ds-input" placeholder="Search recipes" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <p className="pf-xs pf-soft">
          {DIET_LABEL[plan.household.diet]}
          {plan.household.excludedAllergens.length ? ` · without ${plan.household.excludedAllergens.join(', ')}` : ''} · fits {slot.type}. Best macro fit for the day first.
        </p>
        {list.length === 0 ? (
          <p className="pf-soft">{all.length === 0 ? describeConstraints(plan.household, slot.type) + '.' : 'No recipe matches your search.'}</p>
        ) : (
          <ul className="pf-alts" role="listbox" aria-label="Alternatives">
            {list.map((a) => {
              const n = recipeNutrients(a.recipe, db);
              const on = pick === a.recipe.id;
              const current = plan.meals.find((m) => key(m) === key(at))?.recipeId === a.recipe.id;
              return (
                <li key={a.recipe.id}>
                  <button type="button" role="option" aria-selected={on} className="pf-alt" onClick={() => setPick(a.recipe.id)}>
                    <span className="pf-stack-xs pf-alt__text">
                      <span className="pf-strong">{a.recipe.name}</span>
                      <span className="pf-xs pf-soft">{Math.round(n.kcal)} kcal · {a.recipe.prepMinutes} min{current ? ' · current' : ''}</span>
                    </span>
                    {a.cookedNearby !== undefined ? (
                      <Tag kind="warn">Cooked {shortDay(plan.weekStart, a.cookedNearby).dow}</Tag>
                    ) : (
                      <Tag kind={a.fit === 'ok' ? 'default' : 'ok'}>{a.fit === 'best' ? 'Best fit' : a.fit === 'good' ? 'Good fit' : 'OK fit'}</Tag>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <p className="pf-xs pf-soft">Swapping a meal locks it, so generating again keeps it.</p>
      </Sheet>
      <Confirm open={confirm} title="Swap a batch-cooked meal?" confirmLabel="Swap" onCancel={() => setConfirm(false)} onConfirm={apply}>
        <p>Its leftovers on {follower && dayName(plan, follower.day)} are cleared, so you can fill that meal again.</p>
      </Confirm>
    </>
  );
}
